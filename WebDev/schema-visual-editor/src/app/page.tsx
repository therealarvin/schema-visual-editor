'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Eye, Edit3, FileJson, Copy, Save, RotateCcw, Eraser, EyeOff, Maximize2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

import SchemaEditor from '@/components/SchemaEditor';
import FormPreview from '@/components/FormPreview';
import { JsonEditor } from '@/components/JsonEditor';
import { Schema } from '@/types/schema';
import { sampleSchema } from '@/lib/utils';
import { autofixJson } from '@/lib/json-autofix';

export default function Home() {
  const [schema, setSchema] = useState<Schema>(sampleSchema);
  const [activeTab, setActiveTab] = useState('editor');
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [jsonHasChanges, setJsonHasChanges] = useState(false);
  const [jsonError, setJsonError] = useState<{ line: number; column: number; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editorWidth, setEditorWidth] = useState(33.33); // Percentage width for editor
  const [isResizing, setIsResizing] = useState(false);

  const handleSchemaChange = useCallback((newSchema: Schema) => {
    setSchema(newSchema);
    setJsonHasChanges(false);
  }, []);

  const initializeJsonEditor = useCallback(() => {
    setJsonEditorValue(JSON.stringify(schema, null, 2));
    setJsonHasChanges(false);
  }, [schema]);

  const handleJsonChange = useCallback((value: string) => {
    setJsonEditorValue(value);
    setJsonHasChanges(JSON.stringify(schema, null, 2) !== value);
    setJsonError(null); // Clear error when user types
  }, [schema]);

  const applyJsonChanges = useCallback(() => {
    try {
      // Check if input is empty
      if (!jsonEditorValue.trim()) {
        toast.error('Please enter JSON content to apply');
        return;
      }

      // Check for common JSON issues and provide helpful messages
      if (jsonEditorValue.includes('//')) {
        toast.error('JSON Syntax Error: Comments (// or /* */) are not allowed in JSON. Please remove all comments and try again.');
        return;
      }

      // Strip JavaScript-style comments and extra commas that might cause issues
      const cleanedJson = jsonEditorValue
        // Remove single-line comments
        .replace(/\/\/.*$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Fix unquoted property names (common JS pattern)
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // Remove trailing commas before closing braces/brackets
        .replace(/,(\s*[}\]])/g, '$1');

      const parsedSchema = JSON.parse(cleanedJson);
      
      if (!Array.isArray(parsedSchema)) {
        toast.error('Invalid schema format: Schema must be an array of field objects');
        return;
      }
      
      // Validate each item has the required structure
      for (let i = 0; i < parsedSchema.length; i++) {
        const item = parsedSchema[i];
        
        if (!item.unique_id) {
          toast.error(`Invalid schema format: Field at index ${i} is missing required 'unique_id' property`);
          return;
        }
        
        if (!item.display_attributes) {
          toast.error(`Invalid schema format: Field '${item.unique_id}' is missing 'display_attributes' object`);
          return;
        }
        
        if (typeof item.display_attributes.order !== 'number') {
          toast.error(`Invalid schema format: Field '${item.unique_id}' must have a numeric 'order' property`);
          return;
        }
        
        if (!item.display_attributes.input_type) {
          toast.error(`Invalid schema format: Field '${item.unique_id}' is missing 'input_type' property`);
          return;
        }

        // Validate input_type is one of the allowed values
        const allowedTypes = ['text', 'radio', 'checkbox', 'signature', 'fileUpload', 'info', 'text-area'];
        if (!allowedTypes.includes(item.display_attributes.input_type)) {
          toast.error(`Invalid schema format: Field '${item.unique_id}' has invalid input_type '${item.display_attributes.input_type}'. Must be one of: ${allowedTypes.join(', ')}`);
          return;
        }

        if (!item.display_attributes.value) {
          toast.error(`Invalid schema format: Field '${item.unique_id}' is missing 'value' object`);
          return;
        }

        if (!item.display_attributes.value.type) {
          toast.error(`Invalid schema format: Field '${item.unique_id}' value object is missing 'type' property`);
          return;
        }
      }
      
      setSchema(parsedSchema);
      setJsonHasChanges(false);
      setJsonError(null);
      toast.success('Schema updated from JSON!');
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Get more specific JSON error information
        const errorMessage = error.message;
        const match = errorMessage.match(/at position (\d+)/);
        if (match) {
          const position = parseInt(match[1]);
          const lines = jsonEditorValue.substring(0, position).split('\n');
          const lineNumber = lines.length;
          const columnNumber = lines[lines.length - 1].length + 1;
          setJsonError({
            line: lineNumber,
            column: columnNumber,
            message: errorMessage
          });
          toast.error(`JSON Syntax Error at line ${lineNumber}, column ${columnNumber}: ${errorMessage}`);
        } else {
          // Try to extract line/column from other error formats
          const lineMatch = errorMessage.match(/line (\d+)/);
          const colMatch = errorMessage.match(/column (\d+)/);
          if (lineMatch || colMatch) {
            setJsonError({
              line: lineMatch ? parseInt(lineMatch[1]) : 1,
              column: colMatch ? parseInt(colMatch[1]) : 1,
              message: errorMessage
            });
          } else {
            setJsonError({
              line: 1,
              column: 1,
              message: errorMessage
            });
          }
          toast.error(`JSON Syntax Error: ${errorMessage}`);
        }
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        // For validation errors, try to extract field info
        const fieldMatch = errorMsg.match(/at index (\d+)|Field '([^']+)'/);
        if (fieldMatch) {
          const index = fieldMatch[1] ? parseInt(fieldMatch[1]) : -1;
          const fieldName = fieldMatch[2];
          // Try to find the line number of the problematic field
          const lines = jsonEditorValue.split('\n');
          let targetLine = 1;
          for (let i = 0; i < lines.length; i++) {
            if ((index >= 0 && lines[i].includes(`"unique_id"`) && lines.slice(0, i + 1).join('\n').split('"unique_id"').length - 1 === index + 1) ||
                (fieldName && lines[i].includes(`"${fieldName}"`))) {
              targetLine = i + 1;
              break;
            }
          }
          setJsonError({
            line: targetLine,
            column: 1,
            message: errorMsg
          });
        }
        toast.error(`Failed to apply changes: ${errorMsg}`);
      }
    }
  }, [jsonEditorValue]);

  const resetJsonEditor = useCallback(() => {
    initializeJsonEditor();
    setJsonError(null);
    toast.success('JSON editor reset to current schema');
  }, [initializeJsonEditor]);

  const cleanJsonComments = useCallback(() => {
    if (!jsonEditorValue.trim()) {
      toast.error('No JSON content to clean');
      return;
    }

    // Strip JavaScript-style comments and fix common JS->JSON issues
    const cleanedJson = jsonEditorValue
      // Remove single-line comments
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Fix unquoted property names (common JS pattern)
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      // Remove trailing commas before closing braces/brackets
      .replace(/,(\s*[}\]])/g, '$1')
      // Clean up extra whitespace left by comment removal
      .replace(/^\s*\n/gm, '')
      // Remove empty lines with only whitespace
      .replace(/^\s*$/gm, '')
      // Compress multiple newlines into single newlines
      .replace(/\n\n+/g, '\n');

    try {
      // Try to parse and reformat the cleaned JSON
      const parsed = JSON.parse(cleanedJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonEditorValue(formatted);
      toast.success('Comments removed and JSON cleaned successfully!');
    } catch (error) {
      // If parsing fails, provide more specific error info
      if (error instanceof SyntaxError) {
        const errorMessage = error.message;
        const match = errorMessage.match(/at position (\d+)/);
        if (match) {
          const position = parseInt(match[1]);
          const lines = cleanedJson.substring(0, position).split('\n');
          const lineNumber = lines.length;
          const columnNumber = lines[lines.length - 1].length + 1;
          setJsonEditorValue(cleanedJson);
          toast.error(`Comments removed, but JSON error remains at line ${lineNumber}, column ${columnNumber}: ${errorMessage}`);
        } else {
          setJsonEditorValue(cleanedJson);
          toast.error(`Comments removed, but JSON syntax error remains: ${errorMessage}`);
        }
      } else {
        setJsonEditorValue(cleanedJson);
        toast.error('Comments removed, but please check for remaining syntax errors');
      }
    }
  }, [jsonEditorValue]);

  const handleAutofix = useCallback(() => {
    if (!jsonEditorValue.trim()) {
      toast.error('No JSON content to fix');
      return;
    }

    const { fixed, changes } = autofixJson(jsonEditorValue);
    
    if (changes.length === 0) {
      toast.info('No auto-fixable issues found');
      return;
    }

    setJsonEditorValue(fixed);
    setJsonError(null);
    toast.success(`Applied ${changes.length} fixes: ${changes.join(', ')}`);
    
    // Try to apply the fixed JSON
    setTimeout(() => {
      try {
        const parsedSchema = JSON.parse(fixed);
        if (Array.isArray(parsedSchema)) {
          setSchema(parsedSchema);
          setJsonHasChanges(false);
          toast.success('Schema updated with auto-fixed JSON!');
        }
      } catch {
        // If still has errors, at least we improved it
        toast.info('JSON improved but still has errors. Please review.');
      }
    }, 100);
  }, [jsonEditorValue]);

  const exportSchema = useCallback(() => {
    const dataStr = JSON.stringify(schema, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Schema exported successfully!');
  }, [schema]);

  const importSchema = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        
        if (!fileContent.trim()) {
          toast.error('The selected file is empty');
          return;
        }

        // Check for common JSON issues and provide helpful messages
        if (fileContent.includes('//')) {
          toast.error('JSON Syntax Error: Comments (// or /* */) are not allowed in JSON. Please remove all comments from the file and try again.');
          return;
        }

        // Strip JavaScript-style comments and extra commas that might cause issues
        const cleanedJson = fileContent
          // Remove single-line comments
          .replace(/\/\/.*$/gm, '')
          // Remove multi-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // Fix unquoted property names (common JS pattern)
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
          // Remove trailing commas before closing braces/brackets
          .replace(/,(\s*[}\]])/g, '$1');

        const importedSchema = JSON.parse(cleanedJson);
        
        if (!Array.isArray(importedSchema)) {
          toast.error('Invalid schema format: Schema must be an array of field objects');
          return;
        }

        // Validate each item has the required structure
        for (let i = 0; i < importedSchema.length; i++) {
          const item = importedSchema[i];
          
          if (!item.unique_id) {
            toast.error(`Invalid schema format: Field at index ${i} is missing required 'unique_id' property`);
            return;
          }
          
          if (!item.display_attributes) {
            toast.error(`Invalid schema format: Field '${item.unique_id}' is missing 'display_attributes' object`);
            return;
          }
          
          if (typeof item.display_attributes.order !== 'number') {
            toast.error(`Invalid schema format: Field '${item.unique_id}' must have a numeric 'order' property`);
            return;
          }
          
          if (!item.display_attributes.input_type) {
            toast.error(`Invalid schema format: Field '${item.unique_id}' is missing 'input_type' property`);
            return;
          }

          // Validate input_type is one of the allowed values
          const allowedTypes = ['text', 'radio', 'checkbox', 'signature', 'fileUpload', 'info', 'text-area'];
          if (!allowedTypes.includes(item.display_attributes.input_type)) {
            toast.error(`Invalid schema format: Field '${item.unique_id}' has invalid input_type '${item.display_attributes.input_type}'. Must be one of: ${allowedTypes.join(', ')}`);
            return;
          }

          if (!item.display_attributes.value) {
            toast.error(`Invalid schema format: Field '${item.unique_id}' is missing 'value' object`);
            return;
          }

          if (!item.display_attributes.value.type) {
            toast.error(`Invalid schema format: Field '${item.unique_id}' value object is missing 'type' property`);
            return;
          }
        }
        
        setSchema(importedSchema);
        toast.success('Schema imported successfully!');
      } catch (error) {
        if (error instanceof SyntaxError) {
          // Get more specific JSON error information
          const errorMessage = error.message;
          const match = errorMessage.match(/at position (\d+)/);
          if (match) {
            const position = parseInt(match[1]);
            const fileContent = e.target?.result as string;
            const lines = fileContent.substring(0, position).split('\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;
            toast.error(`JSON Syntax Error in file at line ${lineNumber}, column ${columnNumber}: ${errorMessage}`);
          } else {
            toast.error(`JSON Syntax Error in file: ${errorMessage}`);
          }
        } else {
          toast.error(`Failed to import schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  }, []);

  const copySchemaJson = useCallback(() => {
    const schemaJson = JSON.stringify(schema, null, 2);
    navigator.clipboard.writeText(schemaJson).then(() => {
      toast.success('Schema JSON copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy schema JSON');
    });
  }, [schema]);



  const clearSchema = useCallback(() => {
    setSchema([]);
    toast.success('Schema cleared!');
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 20% and 80%
    if (newWidth >= 20 && newWidth <= 80) {
      setEditorWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Initialize JSON editor when schema changes or component mounts
  useEffect(() => {
    initializeJsonEditor();
  }, [initializeJsonEditor]);

  // Initialize JSON editor when switching to JSON editor tab
  useEffect(() => {
    if (activeTab === 'json-editor') {
      initializeJsonEditor();
    }
  }, [activeTab, initializeJsonEditor]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schema Visual Editor</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and preview OnRoad form schemas with live updates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Badge variant="outline" className="gap-1">
              <FileJson className="h-3 w-3" />
              {schema.length} fields
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-80px)]">
        <div className={`flex h-full ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
          {/* Left Panel - Schema Editor */}
          <div 
            className="h-full bg-white flex flex-col border-r"
            style={{ 
              width: showPreview ? `${editorWidth}%` : '100%',
              minWidth: showPreview ? '300px' : 'auto'
            }}
          >
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Schema Editor
                    {!showPreview && <Maximize2 className="h-4 w-4 text-blue-500" />}
                  </h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSchema}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-6 py-4">
                <SchemaEditor 
                  schema={schema} 
                  onSchemaChange={handleSchemaChange}
                />
              </div>
          </div>

          {/* Resizer */}
          {showPreview && (
            <div
              className="w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group flex items-center justify-center"
              onMouseDown={() => setIsResizing(true)}
            >
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/10" />
              <div className="w-1 h-8 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors" />
            </div>
          )}

          {/* Right Panel - Preview and JSON */}
          {showPreview && (
            <div className="flex-1 bg-gray-50" style={{ width: `${100 - editorWidth}%` }}>
              <div className="h-full flex flex-col">
                <div className="px-6 py-4 bg-white border-b">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between">
                      <TabsList>
                        <TabsTrigger value="preview" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Live Preview
                        </TabsTrigger>
                        <TabsTrigger value="json-editor" className="gap-2">
                          <Edit3 className="h-4 w-4" />
                          JSON Editor
                        </TabsTrigger>
                        <TabsTrigger value="json" className="gap-2">
                          <FileJson className="h-4 w-4" />
                          Schema JSON
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSchema}
                          className="hidden"
                          id="import-input"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('import-input')?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Import
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportSchema}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </Tabs>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <Tabs value={activeTab} className="h-full flex flex-col">
                    <TabsContent value="preview" className="flex-1 mt-0 overflow-hidden">
                      <div className="h-full overflow-y-auto overflow-x-hidden bg-white">
                        <FormPreview schema={schema} />
                      </div>
                    </TabsContent>

                    <TabsContent value="json-editor" className="flex-1 mt-0 overflow-hidden px-6">
                      <div className="h-full flex flex-col py-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-700">Edit Schema JSON</h3>
                        <div className="flex items-center gap-2">
                          {jsonHasChanges && (
                            <Badge variant="destructive" className="text-xs">
                              Unsaved Changes
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cleanJsonComments}
                            className="gap-2"
                          >
                            <Eraser className="h-4 w-4" />
                            Clean Comments
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetJsonEditor}
                            className="gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={applyJsonChanges}
                            disabled={!jsonHasChanges}
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Apply Changes
                          </Button>
                        </div>
                      </div>
                      <JsonEditor
                        value={jsonEditorValue}
                        onChange={handleJsonChange}
                        error={jsonError}
                        onAutofix={handleAutofix}
                        className="flex-1"
                        placeholder="Enter your schema JSON here..."
                      />
                      <div className="mt-3 text-xs text-gray-500">
                        <p>Edit the schema JSON directly. Click &quot;Apply Changes&quot; to update the schema.</p>
                        <p>Note: Changes will be validated before applying.</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                    <TabsContent value="json" className="flex-1 mt-0 overflow-hidden px-6">
                      <div className="h-full flex flex-col py-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-700">Schema JSON Output</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copySchemaJson}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy JSON
                        </Button>
                      </div>
                      <div className="flex-1 overflow-auto border rounded-lg bg-gray-900 text-green-400 p-4 font-mono text-sm">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(schema, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}