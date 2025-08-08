'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronDown as ChevronDownArrow,
  FileText,
  Code,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Schema, SchemaItem } from '@/types/schema';
import { generateUniqueId } from '@/lib/utils';

interface SchemaEditorProps {
  schema: Schema;
  onSchemaChange: (schema: Schema) => void;
}

interface FieldEditorProps {
  item: SchemaItem;
  onUpdate: (item: SchemaItem) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  index: number;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  schema: Schema; // Need this to lookup linked fields
  onReorder: (itemId: string, newOrder: number) => void;
}

const inputTypes = [
  { value: 'text', label: 'Text Input' },
  { value: 'text-area', label: 'Text Area' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'signature', label: 'Signature' },
  { value: 'fileUpload', label: 'File Upload' },
  { value: 'info', label: 'Info Display' },
];

const colorThemes = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'gray', label: 'Gray' },
];

const iconOptions = [
  { value: 'MapPin', label: 'Map Pin' },
  { value: 'Home', label: 'Home' },
  { value: 'FileText', label: 'File Text' },
  { value: 'Calendar', label: 'Calendar' },
  { value: 'CreditCard', label: 'Credit Card' },
  { value: 'Users', label: 'Users' },
  { value: 'Info', label: 'Info' },
  { value: 'AlertCircle', label: 'Alert Circle' },
];

const infoStyles = [
  { value: 'default', label: 'Default (Blue)' },
  { value: 'subtle', label: 'Subtle (Gray)' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'inline', label: 'Inline' },
  { value: 'compact', label: 'Compact' },
  { value: 'warning', label: 'Warning (Yellow)' },
  { value: 'success', label: 'Success (Green)' },
  { value: 'error', label: 'Error (Red)' },
  { value: 'tip', label: 'Tip (Purple)' },
];

const radioLayouts = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'grid', label: 'Grid' },
];

const valueTypes = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'resolved', label: 'Database Resolved' },
  { value: 'reserved', label: 'Reserved Value' },
];

const reservedValues = [
  { value: 'tenant_name_csv', label: 'Tenant Names (CSV)' },
  { value: 'realtor_name_spaced', label: 'Realtor Name' },
];

const visibilityOperators = [
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<', label: 'Less than' },
  { value: '<=', label: 'Less than or equal' },
  { value: '==', label: 'Equals' },
  { value: '!==', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'doesNotContain', label: 'Does not contain' },
];

const validationRuleOperators = [
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<', label: 'Less than' },
  { value: '<=', label: 'Less than or equal' },
  { value: '==', label: 'Equals' },
  { value: '!==', label: 'Not equals' },
];

//eslint-disable-next-line @typescript-eslint/no-unused-vars
function FieldEditor({ item, onUpdate, onDelete, onDuplicate, index, onMove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, schema, onReorder }: FieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState(item.display_attributes.display_name || '');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [tempOrder, setTempOrder] = useState(item.display_attributes.order.toString());
  const [radioOptions, setRadioOptions] = useState(
    item.display_attributes.display_radio_options?.join('\n') || ''
  );

  // Sync tempOrder when item order changes externally
  useEffect(() => {
    setTempOrder(item.display_attributes.order.toString());
  }, [item.display_attributes.order]);

  // Helper to clean up empty objects in the schema
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanEmptyObjects = (obj: any) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        cleanEmptyObjects(obj[key]);
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      }
    });
  };

//eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = useCallback((path: string, value: any) => {
    const keys = path.split('.');
    const updatedItem = JSON.parse(JSON.stringify(item));
    
    let current = updatedItem;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Handle undefined/null/empty string cleanup
    if (value === undefined || value === null || value === '') {
      delete current[keys[keys.length - 1]];
    } else {
      current[keys[keys.length - 1]] = value;
    }
    
    // Clean up empty objects
    cleanEmptyObjects(updatedItem);
    
    onUpdate(updatedItem);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, onUpdate]);

  const handleInputTypeChange = useCallback((newType: string) => {
    const updatedItem = JSON.parse(JSON.stringify(item));
    updatedItem.display_attributes.input_type = newType;
    
    // Clean up fields that don't apply to the new type
    switch (newType) {
      case 'text':
        delete updatedItem.display_attributes.display_radio_options;
        delete updatedItem.display_attributes.checkbox_options;
        break;
      case 'text-area':
        delete updatedItem.display_attributes.display_radio_options;
        delete updatedItem.display_attributes.checkbox_options;
        delete updatedItem.display_attributes.special_input?.text;
        break;
      case 'radio':
        delete updatedItem.display_attributes.checkbox_options;
        delete updatedItem.display_attributes.special_input?.text;
        delete updatedItem.display_attributes.special_input?.textArea;
        delete updatedItem.display_attributes.special_input?.checkbox;
        delete updatedItem.display_attributes.special_input?.signature;
        delete updatedItem.display_attributes.special_input?.fileUpload;
        delete updatedItem.display_attributes.special_input?.info;
        break;
      case 'checkbox':
        delete updatedItem.display_attributes.display_radio_options;
        delete updatedItem.display_attributes.special_input?.text;
        delete updatedItem.display_attributes.special_input?.textArea;
        delete updatedItem.display_attributes.special_input?.radio;
        delete updatedItem.display_attributes.special_input?.signature;
        delete updatedItem.display_attributes.special_input?.fileUpload;
        delete updatedItem.display_attributes.special_input?.info;
        break;
      case 'signature':
        delete updatedItem.display_attributes.display_radio_options;
        delete updatedItem.display_attributes.checkbox_options;
        delete updatedItem.display_attributes.special_input?.text;
        delete updatedItem.display_attributes.special_input?.textArea;
        delete updatedItem.display_attributes.special_input?.radio;
        delete updatedItem.display_attributes.special_input?.checkbox;
        delete updatedItem.display_attributes.special_input?.fileUpload;
        delete updatedItem.display_attributes.special_input?.info;
        break;
      case 'fileUpload':
        delete updatedItem.display_attributes.display_radio_options;
        delete updatedItem.display_attributes.checkbox_options;
        delete updatedItem.display_attributes.special_input?.text;
        delete updatedItem.display_attributes.special_input?.textArea;
        delete updatedItem.display_attributes.special_input?.radio;
        delete updatedItem.display_attributes.special_input?.checkbox;
        delete updatedItem.display_attributes.special_input?.signature;
        delete updatedItem.display_attributes.special_input?.info;
        break;
      case 'info':
        delete updatedItem.display_attributes.display_radio_options;
        delete updatedItem.display_attributes.checkbox_options;
        delete updatedItem.display_attributes.placeholder;
        delete updatedItem.display_attributes.isRequired;
        delete updatedItem.display_attributes.special_input?.text;
        delete updatedItem.display_attributes.special_input?.textArea;
        delete updatedItem.display_attributes.special_input?.radio;
        delete updatedItem.display_attributes.special_input?.checkbox;
        delete updatedItem.display_attributes.special_input?.signature;
        delete updatedItem.display_attributes.special_input?.fileUpload;
        break;
    }
    
    cleanEmptyObjects(updatedItem);
    onUpdate(updatedItem);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, onUpdate]);

  const handleRadioOptionsChange = useCallback((value: string) => {
    setRadioOptions(value);
    const options = value.split('\n').filter(opt => opt.trim()).map(opt => opt.trim());
    updateField('display_attributes.display_radio_options', options.length > 0 ? options : undefined);
  }, [updateField]);

  const addCheckboxOption = useCallback(() => {
    const current = item.display_attributes.checkbox_options || { options: [] };
    const newOption = {
      display_name: '',
      databaseStored: ''
    };
    updateField('display_attributes.checkbox_options', {
      ...current,
      options: [...(current.options || []), newOption]
    });
  }, [item.display_attributes.checkbox_options, updateField]);

  const removeCheckboxOption = useCallback((index: number) => {
    const current = item.display_attributes.checkbox_options || { options: [] };
    const newOptions = current.options.filter((_, i) => i !== index);
    if (newOptions.length > 0) {
      updateField('display_attributes.checkbox_options', {
        ...current,
        options: newOptions
      });
    } else {
      updateField('display_attributes.checkbox_options', undefined);
    }
  }, [item.display_attributes.checkbox_options, updateField]);

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCheckboxOption = useCallback((index: number, field: string, value: any) => {
    const current = item.display_attributes.checkbox_options || { options: [] };
    const newOptions = [...current.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    updateField('display_attributes.checkbox_options', {
      ...current,
      options: newOptions
    });
  }, [item.display_attributes.checkbox_options, updateField]);

  const addLinkedFieldToOption = useCallback((optionIndex: number, fieldId: string) => {
    const current = item.display_attributes.checkbox_options || { options: [] };
    const newOptions = [...current.options];
    const currentLinkedFields = newOptions[optionIndex].linkedFields || [];
    if (!currentLinkedFields.includes(fieldId)) {
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        linkedFields: [...currentLinkedFields, fieldId]
      };
      updateField('display_attributes.checkbox_options', {
        ...current,
        options: newOptions
      });
    }
  }, [item.display_attributes.checkbox_options, updateField]);

  const removeLinkedFieldFromOption = useCallback((optionIndex: number, fieldId: string) => {
    const current = item.display_attributes.checkbox_options || { options: [] };
    const newOptions = [...current.options];
    const currentLinkedFields = newOptions[optionIndex].linkedFields || [];
    const updatedLinkedFields = currentLinkedFields.filter(id => id !== fieldId);
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      linkedFields: updatedLinkedFields.length > 0 ? updatedLinkedFields : undefined
    };
    updateField('display_attributes.checkbox_options', {
      ...current,
      options: newOptions
    });
  }, [item.display_attributes.checkbox_options, updateField]);

  const addVisibilityCondition = useCallback(() => {
    const current = item.display_attributes.visibleIf || [];
    updateField('display_attributes.visibleIf', [
      ...current,
      { unique_id: '', operation: '==', valueChecked: '' }
    ]);
  }, [item.display_attributes.visibleIf, updateField]);

  const removeVisibilityCondition = useCallback((index: number) => {
    const current = item.display_attributes.visibleIf || [];
    updateField('display_attributes.visibleIf', current.filter((_, i) => i !== index));
  }, [item.display_attributes.visibleIf, updateField]);

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateVisibilityCondition = useCallback((index: number, field: string, value: any) => {
    const current = [...(item.display_attributes.visibleIf || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('display_attributes.visibleIf', current);
  }, [item.display_attributes.visibleIf, updateField]);

  const addLoopbackValidation = useCallback(() => {
    const current = item.display_attributes.validation?.loopback || [];
    updateField('display_attributes.validation.loopback', [
      ...current,
      { regex: '', message: '' }
    ]);
  }, [item.display_attributes.validation?.loopback, updateField]);

  const removeLoopbackValidation = useCallback((index: number) => {
    const current = item.display_attributes.validation?.loopback || [];
    updateField('display_attributes.validation.loopback', current.filter((_, i) => i !== index));
  }, [item.display_attributes.validation?.loopback, updateField]);

  const updateLoopbackValidation = useCallback((index: number, field: string, value: string) => {
    const current = [...(item.display_attributes.validation?.loopback || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('display_attributes.validation.loopback', current);
  }, [item.display_attributes.validation?.loopback, updateField]);

  const addCrossFieldValidation = useCallback(() => {
    const current = item.display_attributes.validation?.crossField || [];
    updateField('display_attributes.validation.crossField', [
      ...current,
      { rule: '==', unique_id: '', message: '' }
    ]);
  }, [item.display_attributes.validation?.crossField, updateField]);

  const removeCrossFieldValidation = useCallback((index: number) => {
    const current = item.display_attributes.validation?.crossField || [];
    updateField('display_attributes.validation.crossField', current.filter((_, i) => i !== index));
  }, [item.display_attributes.validation?.crossField, updateField]);

  const updateCrossFieldValidation = useCallback((index: number, field: string, value: string) => {
    const current = [...(item.display_attributes.validation?.crossField || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('display_attributes.validation.crossField', current);
  }, [item.display_attributes.validation?.crossField, updateField]);

  const addPdfAttribute = useCallback(() => {
    const current = item.pdf_attributes || [];
    updateField('pdf_attributes', [
      ...current,
      { formType: '', formfield: '' }
    ]);
  }, [item.pdf_attributes, updateField]);

  const removePdfAttribute = useCallback((index: number) => {
    const current = item.pdf_attributes || [];
    updateField('pdf_attributes', current.filter((_, i) => i !== index));
  }, [item.pdf_attributes, updateField]);

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePdfAttribute = useCallback((index: number, field: string, value: any) => {
    const current = [...(item.pdf_attributes || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('pdf_attributes', current);
  }, [item.pdf_attributes, updateField]);

  return (
    <Card className="mb-4 w-full">
      <CardHeader className="pb-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div 
              className="cursor-move p-1 hover:bg-gray-100 rounded flex-shrink-0"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <Input
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  onBlur={() => {
                    updateField('display_attributes.display_name', tempDisplayName);
                    setIsEditingName(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateField('display_attributes.display_name', tempDisplayName);
                      setIsEditingName(false);
                    } else if (e.key === 'Escape') {
                      setTempDisplayName(item.display_attributes.display_name || '');
                      setIsEditingName(false);
                    }
                  }}
                  className="h-8 text-base font-semibold"
                  autoFocus
                />
              ) : (
                <CardTitle 
                  className="text-base truncate cursor-pointer hover:bg-gray-100 px-2 py-1 -mx-2 rounded"
                  onClick={() => {
                    setTempDisplayName(item.display_attributes.display_name || '');
                    setIsEditingName(true);
                  }}
                >
                  {item.display_attributes.display_name || 'Unnamed Field'}
                </CardTitle>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                  {item.unique_id || 'no-id'}
                </code>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {item.display_attributes.input_type}
                </Badge>
                {isEditingOrder ? (
                  <Input
                    type="number"
                    value={tempOrder}
                    onChange={(e) => setTempOrder(e.target.value)}
                    onBlur={() => {
                      const newOrder = parseInt(tempOrder) || 1;
                      onReorder(item.unique_id, newOrder);
                      setIsEditingOrder(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newOrder = parseInt(tempOrder) || 1;
                        onReorder(item.unique_id, newOrder);
                        setIsEditingOrder(false);
                      } else if (e.key === 'Escape') {
                        setTempOrder(item.display_attributes.order.toString());
                        setIsEditingOrder(false);
                      }
                    }}
                    className="h-6 w-16 text-xs font-mono px-2"
                    min="1"
                    autoFocus
                  />
                ) : (
                  <Badge 
                    variant="secondary" 
                    className="text-xs flex-shrink-0 font-mono cursor-pointer hover:bg-gray-300 transition-colors"
                    onClick={() => {
                      setTempOrder(item.display_attributes.order.toString());
                      setIsEditingOrder(true);
                    }}
                  >
                    #{item.display_attributes.order}
                  </Badge>
                )}
                {item.display_attributes.block && (
                  <Badge variant="secondary" className="text-xs max-w-[150px] truncate" title={`Block: ${item.display_attributes.block}`}>
                    Block: {item.display_attributes.block}
                  </Badge>
                )}
                {item.pdf_attributes && item.pdf_attributes.length > 0 && (
                  <>
                    {item.pdf_attributes.map((pdf, pdfIndex) => (
                      <Badge 
                        key={pdfIndex} 
                        variant="default" 
                        className="text-xs bg-purple-100 text-purple-800 border-purple-200"
                        title={`PDF: ${pdf.formType} → ${pdf.formfield}`}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {pdf.formfield}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-2 py-1 -mx-2 rounded transition-colors">
                  <Checkbox
                    checked={item.display_attributes.isRequired || false}
                    onCheckedChange={checked => updateField('display_attributes.isRequired', checked || undefined)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-600">Required</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
              >
                <ChevronDownArrow className="h-3 w-3" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs defaultValue="display" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="display">
                <FileText className="h-4 w-4 mr-2" />
                Display
              </TabsTrigger>
              <TabsTrigger value="logic">
                <Eye className="h-4 w-4 mr-2" />
                Logic
              </TabsTrigger>
              <TabsTrigger value="pdf">
                <Code className="h-4 w-4 mr-2" />
                PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="display" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${item.unique_id}-unique-id`}>Unique ID *</Label>
                  <Input
                    id={`${item.unique_id}-unique-id`}
                    value={item.unique_id}
                    onChange={e => {
                      const newUniqueId = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                      // Check if the new ID already exists in another field
                      const isDuplicate = schema.some(field => 
                        field.unique_id === newUniqueId && field.unique_id !== item.unique_id
                      );
                      if (!isDuplicate || newUniqueId === '') {
                        updateField('unique_id', newUniqueId);
                      }
                    }}
                    placeholder="unique_field_id"
                    className={cn(
                      schema.some(field => 
                        field.unique_id === item.unique_id && 
                        field.unique_id !== '' && 
                        schema.filter(f => f.unique_id === item.unique_id).length > 1
                      ) && "border-red-500"
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Only letters, numbers, underscores, and hyphens allowed
                    {schema.filter(field => field.unique_id === item.unique_id).length > 1 && (
                      <span className="text-red-500 block">This ID is already in use!</span>
                    )}
                  </p>
                </div>

                <div>
                  <Label htmlFor={`${item.unique_id}-type`}>Input Type *</Label>
                  <Select
                    value={item.display_attributes.input_type}
                    onValueChange={handleInputTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inputTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`${item.unique_id}-name`}>Display Name</Label>
                  <Input
                    id={`${item.unique_id}-name`}
                    value={item.display_attributes.display_name || ''}
                    onChange={e => updateField('display_attributes.display_name', e.target.value)}
                    placeholder="Field display name"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor={`${item.unique_id}-description`}>Description</Label>
                  <Textarea
                    id={`${item.unique_id}-description`}
                    value={item.display_attributes.description || ''}
                    onChange={e => updateField('display_attributes.description', e.target.value)}
                    placeholder="Optional field description"
                    rows={2}
                  />
                </div>

                {item.display_attributes.input_type !== 'info' && (
                  <div>
                    <Label htmlFor={`${item.unique_id}-placeholder`}>Placeholder</Label>
                    <Input
                      id={`${item.unique_id}-placeholder`}
                      value={item.display_attributes.placeholder || ''}
                      onChange={e => updateField('display_attributes.placeholder', e.target.value)}
                      placeholder="Placeholder text"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`${item.unique_id}-value-type`}>Value Type</Label>
                  <Select
                    value={item.display_attributes.value.type || 'manual'}
                    onValueChange={value => updateField('display_attributes.value.type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {valueTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {item.display_attributes.value.type === 'reserved' && (
                  <div>
                    <Label htmlFor={`${item.unique_id}-reserved-value`}>Reserved Value</Label>
                    <Select
                      value={item.display_attributes.value.reserved || ''}
                      onValueChange={value => updateField('display_attributes.value.reserved', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reserved value" />
                      </SelectTrigger>
                      <SelectContent>
                        {reservedValues.map(val => (
                          <SelectItem key={val.value} value={val.value}>
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {item.display_attributes.value.type === 'resolved' && (
                  <div>
                    <Label htmlFor={`${item.unique_id}-signature-output`}>Signature Output</Label>
                    <Select
                      value={item.display_attributes.value.output || ''}
                      onValueChange={value => updateField('display_attributes.value.output', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select output type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SignatureInput__signer">Signer</SelectItem>
                        <SelectItem value="SignatureInput__delegator">Delegator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Special Input Options */}
              {/* Text Special Inputs */}
              {item.display_attributes.input_type === 'text' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Text Input Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-phone`}
                        checked={item.display_attributes.special_input?.text?.phone || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.phone', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-phone`}>Phone Number Format</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-date`}
                        checked={item.display_attributes.special_input?.text?.date || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.date', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-date`}>Date Picker</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-currency`}
                        checked={item.display_attributes.special_input?.text?.currency || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.currency', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-currency`}>Currency Format ($)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-percentage`}
                        checked={item.display_attributes.special_input?.text?.percentage || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.percentage', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-percentage`}>Percentage Format (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-number`}
                        checked={item.display_attributes.special_input?.text?.number || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.number', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-number`}>Numbers Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-email`}
                        checked={item.display_attributes.special_input?.text?.email || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.email', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-email`}>Email Validation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-text-url`}
                        checked={item.display_attributes.special_input?.text?.url || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.text.url', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-text-url`}>URL Validation</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Radio Options */}
              {item.display_attributes.input_type === 'radio' && (
                <div className="space-y-2">
                  <Label>Radio Options (one per line)</Label>
                  <Textarea
                    value={radioOptions}
                    onChange={e => handleRadioOptionsChange(e.target.value)}
                    placeholder="Option 1\nOption 2\nOption 3"
                    rows={4}
                  />
                </div>
              )}

              {/* Checkbox Options */}
              {item.display_attributes.input_type === 'checkbox' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Checkbox Options</Label>
                      <Button
                        onClick={addCheckboxOption}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(item.display_attributes.checkbox_options?.options || []).map((option, optionIndex) => (
                        <div key={optionIndex} className="p-3 border rounded-lg space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>Display Name</Label>
                              <Input
                                value={option.display_name}
                                onChange={e => updateCheckboxOption(optionIndex, 'display_name', e.target.value)}
                                placeholder="e.g., Swimming Pool"
                              />
                            </div>
                            <div>
                              <Label>Database Value</Label>
                              <Input
                                value={option.databaseStored}
                                onChange={e => updateCheckboxOption(optionIndex, 'databaseStored', e.target.value)}
                                placeholder="e.g., pool"
                              />
                            </div>
                            <div className="col-span-full">
                              <Label>Linked Fields</Label>
                              <div className="space-y-2">
                                {/* Display existing linked fields */}
                                {option.linkedFields && option.linkedFields.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {option.linkedFields.map((fieldId) => {
                                      const linkedField = schema.find(f => f.unique_id === fieldId);
                                      return (
                                        <div key={fieldId} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-sm">
                                          <span>{linkedField?.display_attributes.display_name || fieldId}</span>
                                          <Button
                                            onClick={() => removeLinkedFieldFromOption(optionIndex, fieldId)}
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {/* Add new linked field dropdown */}
                                <Select
                                  value=""
                                  onValueChange={(fieldId) => addLinkedFieldToOption(optionIndex, fieldId)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Add linked field..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {schema
                                      .filter(f => 
                                        f.unique_id !== item.unique_id && 
                                        !option.linkedFields?.includes(f.unique_id)
                                      )
                                      .map(field => (
                                        <SelectItem key={field.unique_id} value={field.unique_id}>
                                          {field.display_attributes.display_name || field.unique_id}
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button
                                onClick={() => removeCheckboxOption(optionIndex)}
                                size="sm"
                                variant="destructive"
                                className="mt-2"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove Option
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!item.display_attributes.checkbox_options?.options || item.display_attributes.checkbox_options.options.length === 0) && (
                        <div className="text-center py-4 text-muted-foreground border rounded-lg">
                          <p>No checkbox options configured. Click &quot;Add Option&quot; to create one.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.unique_id}-min-selected`}>Minimum Selected</Label>
                      <Input
                        id={`${item.unique_id}-min-selected`}
                        type="number"
                        value={item.display_attributes.checkbox_options?.minSelected || ''}
                        onChange={e => {
                          const current = item.display_attributes.checkbox_options || { options: [] };
                          updateField('display_attributes.checkbox_options', {
                            ...current,
                            minSelected: e.target.value ? parseInt(e.target.value) : undefined
                          });
                        }}
                        min={0}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`${item.unique_id}-max-selected`}>Maximum Selected</Label>
                      <Input
                        id={`${item.unique_id}-max-selected`}
                        type="number"
                        value={item.display_attributes.checkbox_options?.maxSelected || ''}
                        onChange={e => {
                          const current = item.display_attributes.checkbox_options || { options: [] };
                          updateField('display_attributes.checkbox_options', {
                            ...current,
                            maxSelected: e.target.value ? parseInt(e.target.value) : undefined
                          });
                        }}
                        min={1}
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* Radio Special Options */}
              {item.display_attributes.input_type === 'radio' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Radio Button Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.unique_id}-radio-layout`}>Layout</Label>
                      <Select
                        value={item.display_attributes.special_input?.radio?.layout || 'vertical'}
                        onValueChange={value => updateField('display_attributes.special_input.radio.layout', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {radioLayouts.map(layout => (
                            <SelectItem key={layout.value} value={layout.value}>
                              {layout.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {item.display_attributes.special_input?.radio?.layout === 'grid' && (
                      <div>
                        <Label htmlFor={`${item.unique_id}-radio-columns`}>Grid Columns</Label>
                        <Input
                          id={`${item.unique_id}-radio-columns`}
                          type="number"
                          value={item.display_attributes.special_input?.radio?.columns || 2}
                          onChange={e => updateField('display_attributes.special_input.radio.columns', parseInt(e.target.value) || 2)}
                          min={1}
                          max={6}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checkbox Special Options */}
              {item.display_attributes.input_type === 'checkbox' && (
                <>
                  <h4 className="font-medium">Checkbox Display Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-checkbox-asradio`}
                        checked={item.display_attributes.special_input?.checkbox?.asRadio || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.checkbox.asRadio', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-checkbox-asradio`}>Act as Radio (Single Selection)</Label>
                    </div>
                    <div>
                      <Label htmlFor={`${item.unique_id}-checkbox-horizontal`}>Horizontal Columns</Label>
                      <Input
                        id={`${item.unique_id}-checkbox-horizontal`}
                        type="number"
                        value={item.display_attributes.special_input?.checkbox?.horizontal || 1}
                        onChange={e => updateField('display_attributes.special_input.checkbox.horizontal', parseInt(e.target.value) || 1)}
                        min={1}
                        max={6}
                        placeholder="1"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Signature Special Options */}
              {item.display_attributes.input_type === 'signature' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Signature Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.unique_id}-signature-dateformat`}>Date Format</Label>
                      <Input
                        id={`${item.unique_id}-signature-dateformat`}
                        value={item.display_attributes.special_input?.signature?.dateFormat || ''}
                        onChange={e => updateField('display_attributes.special_input.signature.dateFormat', e.target.value || undefined)}
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-signature-initials`}
                        checked={item.display_attributes.special_input?.signature?.showInitials || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.signature.showInitials', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-signature-initials`}>Show Initials Field</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload Special Options */}
              {item.display_attributes.input_type === 'fileUpload' && (
                <div className="space-y-4">
                  <h4 className="font-medium">File Upload Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.unique_id}-file-accept`}>Accepted File Types</Label>
                      <Input
                        id={`${item.unique_id}-file-accept`}
                        value={item.display_attributes.special_input?.fileUpload?.accept || ''}
                        onChange={e => updateField('display_attributes.special_input.fileUpload.accept', e.target.value || undefined)}
                        placeholder=".pdf,.doc,.docx"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${item.unique_id}-file-maxsize`}>Max File Size (MB)</Label>
                      <Input
                        id={`${item.unique_id}-file-maxsize`}
                        type="number"
                        value={item.display_attributes.special_input?.fileUpload?.maxSize || ''}
                        onChange={e => updateField('display_attributes.special_input.fileUpload.maxSize', e.target.value ? parseInt(e.target.value) : undefined)}
                        min={1}
                        placeholder="10"
                      />
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <Checkbox
                        id={`${item.unique_id}-file-multiple`}
                        checked={item.display_attributes.special_input?.fileUpload?.multiple || false}
                        onCheckedChange={checked => updateField('display_attributes.special_input.fileUpload.multiple', checked || undefined)}
                      />
                      <Label htmlFor={`${item.unique_id}-file-multiple`}>Allow Multiple Files</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Special Options */}
              {item.display_attributes.input_type === 'info' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Info Box Options</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.unique_id}-info-style`}>Style</Label>
                      <Select
                        value={item.display_attributes.special_input?.info?.style || 'default'}
                        onValueChange={value => updateField('display_attributes.special_input.info.style', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {infoStyles.map(style => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${item.unique_id}-info-icon`}
                          checked={item.display_attributes.special_input?.info?.icon ?? true}
                          onCheckedChange={checked => updateField('display_attributes.special_input.info.icon', checked)}
                        />
                        <Label htmlFor={`${item.unique_id}-info-icon`}>Show Icon</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${item.unique_id}-info-minimizable`}
                          checked={item.display_attributes.special_input?.info?.minimizable || false}
                          onCheckedChange={checked => updateField('display_attributes.special_input.info.minimizable', checked || undefined)}
                        />
                        <Label htmlFor={`${item.unique_id}-info-minimizable`}>Can be Minimized</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Options */}
              <Separator />
              <h4 className="font-medium">Appearance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${item.unique_id}-order`}>Order</Label>
                  <Input
                    id={`${item.unique_id}-order`}
                    type="number"
                    value={item.display_attributes.order || 1}
                    onChange={e => {
                      const newOrder = parseInt(e.target.value) || 1;
                      onReorder(item.unique_id, newOrder);
                    }}
                    min={1}
                  />
                </div>

                <div>
                  <Label htmlFor={`${item.unique_id}-width`}>Width (1-12)</Label>
                  <Input
                    id={`${item.unique_id}-width`}
                    type="number"
                    value={item.display_attributes.width || 12}
                    onChange={e => updateField('display_attributes.width', parseInt(e.target.value) || 12)}
                    min={1}
                    max={12}
                  />
                </div>

                <div>
                  <Label htmlFor={`${item.unique_id}-attribute`}>Semantic Attribute</Label>
                  <Input
                    id={`${item.unique_id}-attribute`}
                    value={item.display_attributes.attribute || ''}
                    onChange={e => updateField('display_attributes.attribute', e.target.value || undefined)}
                    placeholder="e.g., address, phone, email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {item.display_attributes.input_type !== 'info' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${item.unique_id}-required`}
                      checked={item.display_attributes.isRequired || false}
                      onCheckedChange={checked => updateField('display_attributes.isRequired', checked || undefined)}
                    />
                    <Label htmlFor={`${item.unique_id}-required`}>Required field</Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${item.unique_id}-hidden`}
                    checked={item.display_attributes.isHidden || false}
                    onCheckedChange={checked => updateField('display_attributes.isHidden', checked || undefined)}
                  />
                  <Label htmlFor={`${item.unique_id}-hidden`}>Hidden field</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${item.unique_id}-cached`}
                    checked={item.display_attributes.isCached || false}
                    onCheckedChange={checked => updateField('display_attributes.isCached', checked || undefined)}
                  />
                  <Label htmlFor={`${item.unique_id}-cached`}>Cache field value</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${item.unique_id}-break`}
                    checked={item.display_attributes.breakBefore || false}
                    onCheckedChange={checked => updateField('display_attributes.breakBefore', checked || undefined)}
                  />
                  <Label htmlFor={`${item.unique_id}-break`}>Break before field (start new row)</Label>
                </div>
              </div>

              <Separator />

              {/* Block Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Block Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${item.unique_id}-block`}>Block Name</Label>
                    <Input
                      id={`${item.unique_id}-block`}
                      value={item.display_attributes.block || ''}
                      onChange={e => updateField('display_attributes.block', e.target.value || undefined)}
                      placeholder="Group fields into blocks"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${item.unique_id}-block-title`}>Block Title</Label>
                    <Input
                      id={`${item.unique_id}-block-title`}
                      value={item.display_attributes.block_style?.title || ''}
                      onChange={e => updateField('display_attributes.block_style.title', e.target.value || undefined)}
                      placeholder="Display title for block"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${item.unique_id}-block-desc`}>Block Description</Label>
                    <Input
                      id={`${item.unique_id}-block-desc`}
                      value={item.display_attributes.block_style?.description || ''}
                      onChange={e => updateField('display_attributes.block_style.description', e.target.value || undefined)}
                      placeholder="Description for block"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`${item.unique_id}-block-icon`}>Block Icon</Label>
                    <Select
                      value={item.display_attributes.block_style?.icon || ''}
                      onValueChange={value => updateField('display_attributes.block_style.icon', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No icon</SelectItem>
                        {iconOptions.map(icon => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`${item.unique_id}-block-theme`}>Block Color Theme</Label>
                    <Select
                      value={item.display_attributes.block_style?.color_theme || ''}
                      onValueChange={value => updateField('display_attributes.block_style.color_theme', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Default</SelectItem>
                        {colorThemes.map(theme => (
                          <SelectItem key={theme.value} value={theme.value}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logic" className="space-y-4">
              {/* Conditional Visibility */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Conditional Visibility</h4>
                  <Button 
                    onClick={addVisibilityCondition} 
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {item.display_attributes.visibleIf?.map((condition, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Field</Label>
                        <Select
                          value={condition.unique_id}
                          onValueChange={value => updateVisibilityCondition(index, 'unique_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {schema.filter(f => f.unique_id !== item.unique_id).map(field => (
                              <SelectItem key={field.unique_id} value={field.unique_id}>
                                {field.display_attributes.display_name || field.unique_id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Operation</Label>
                        <Select
                          value={condition.operation}
                          onValueChange={value => updateVisibilityCondition(index, 'operation', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {visibilityOperators.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Value</Label>
                        <div className="flex gap-1">
                          <Input
                            value={condition.valueChecked}
                            onChange={e => updateVisibilityCondition(index, 'valueChecked', e.target.value)}
                            placeholder="Value to check"
                          />
                          <Button 
                            onClick={() => removeVisibilityCondition(index)}
                            size="sm"
                            variant="ghost"
                            className="px-2"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Validation */}
              <div className="space-y-4">
                <h4 className="font-medium">Validation</h4>
                
                {/* Loopback Validation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Self Validation (Regex)</Label>
                    <Button 
                      onClick={addLoopbackValidation} 
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>

                  {item.display_attributes.validation?.loopback?.map((rule, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Regex Pattern</Label>
                          <Input
                            value={rule.regex}
                            onChange={e => updateLoopbackValidation(index, 'regex', e.target.value)}
                            placeholder="^[0-9]{5}$"
                          />
                        </div>
                        <div>
                          <Label>Error Message</Label>
                          <div className="flex gap-1">
                            <Input
                              value={rule.message}
                              onChange={e => updateLoopbackValidation(index, 'message', e.target.value)}
                              placeholder="Must be 5 digits"
                            />
                            <Button 
                              onClick={() => removeLoopbackValidation(index)}
                              size="sm"
                              variant="ghost"
                              className="px-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cross-field Validation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cross-field Validation</Label>
                    <Button 
                      onClick={addCrossFieldValidation} 
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>

                  {item.display_attributes.validation?.crossField?.map((rule, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label>Rule</Label>
                          <Select
                            value={rule.rule}
                            onValueChange={value => updateCrossFieldValidation(index, 'rule', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {validationRuleOperators.map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Compare Field</Label>
                          <Select
                            value={rule.unique_id}
                            onValueChange={value => updateCrossFieldValidation(index, 'unique_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {schema.filter(f => f.unique_id !== item.unique_id).map(field => (
                                <SelectItem key={field.unique_id} value={field.unique_id}>
                                  {field.display_attributes.display_name || field.unique_id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Error Message</Label>
                          <div className="flex gap-1">
                            <Input
                              value={rule.message || ''}
                              onChange={e => updateCrossFieldValidation(index, 'message', e.target.value)}
                              placeholder="Error message"
                            />
                            <Button 
                              onClick={() => removeCrossFieldValidation(index)}
                              size="sm"
                              variant="ghost"
                              className="px-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pdf" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">PDF Field Mapping</h4>
                <Button 
                  onClick={addPdfAttribute} 
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Mapping
                </Button>
              </div>

              {item.pdf_attributes?.map((pdf, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Form Type</Label>
                      <Input
                        value={pdf.formType}
                        onChange={e => updatePdfAttribute(index, 'formType', e.target.value)}
                        placeholder="e.g., residential_lease"
                      />
                    </div>
                    <div>
                      <Label>PDF Field Name</Label>
                      <div className="flex gap-1">
                        <Input
                          value={Array.isArray(pdf.formfield) ? pdf.formfield.join(',') : pdf.formfield}
                          onChange={e => updatePdfAttribute(index, 'formfield', e.target.value)}
                          placeholder="field_name"
                        />
                        <Button 
                          onClick={() => removePdfAttribute(index)}
                          size="sm"
                          variant="ghost"
                          className="px-2"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Linked Text Fields */}
                  <div>
                    <Label>Linked Text Fields (continuation boxes)</Label>
                    <div className="space-y-2">
                      {(pdf.linked_form_fields_text || []).map((field, fieldIndex) => (
                        <Card key={fieldIndex} className="p-3">
                          <div className="flex gap-2 items-center">
                            <Input
                              value={field}
                              onChange={e => {
                                const newFields = [...(pdf.linked_form_fields_text || [])];
                                newFields[fieldIndex] = e.target.value;
                                updatePdfAttribute(index, 'linked_form_fields_text', newFields);
                              }}
                              placeholder="Continuation field name"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFields = (pdf.linked_form_fields_text || []).filter((_, i) => i !== fieldIndex);
                                updatePdfAttribute(index, 'linked_form_fields_text', newFields.length > 0 ? newFields : undefined);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFields = [...(pdf.linked_form_fields_text || []), ''];
                          updatePdfAttribute(index, 'linked_form_fields_text', newFields);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Text Field
                      </Button>
                    </div>
                  </div>

                  {/* Linked Radio Fields */}
                  <div>
                    <Label>Linked Radio Fields</Label>
                    <div className="space-y-2">
                      {(pdf.linked_form_fields_radio || []).map((radio, radioIndex) => (
                        <Card key={radioIndex} className="p-3">
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={radio.radioField}
                                onChange={e => {
                                  const newRadios = [...(pdf.linked_form_fields_radio || [])];
                                  newRadios[radioIndex] = { ...newRadios[radioIndex], radioField: e.target.value };
                                  updatePdfAttribute(index, 'linked_form_fields_radio', newRadios);
                                }}
                                placeholder="PDF radio field"
                              />
                              <Input
                                value={radio.displayName}
                                onChange={e => {
                                  const newRadios = [...(pdf.linked_form_fields_radio || [])];
                                  newRadios[radioIndex] = { ...newRadios[radioIndex], displayName: e.target.value };
                                  updatePdfAttribute(index, 'linked_form_fields_radio', newRadios);
                                }}
                                placeholder="Display name"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newRadios = (pdf.linked_form_fields_radio || []).filter((_, i) => i !== radioIndex);
                                updatePdfAttribute(index, 'linked_form_fields_radio', newRadios.length > 0 ? newRadios : undefined);
                              }}
                              className="self-start"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRadios = [...(pdf.linked_form_fields_radio || []), { radioField: '', displayName: '' }];
                          updatePdfAttribute(index, 'linked_form_fields_radio', newRadios);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Radio Field
                      </Button>
                    </div>
                  </div>

                  {/* Linked Checkbox Fields */}
                  <div>
                    <Label>Linked Checkbox Fields</Label>
                    <div className="space-y-2">
                      {(pdf.linked_form_fields_checkbox || []).map((checkbox, checkboxIndex) => (
                        <Card key={checkboxIndex} className="p-3">
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={checkbox.fromDatabase}
                                onChange={e => {
                                  const newCheckboxes = [...(pdf.linked_form_fields_checkbox || [])];
                                  newCheckboxes[checkboxIndex] = { ...newCheckboxes[checkboxIndex], fromDatabase: e.target.value };
                                  updatePdfAttribute(index, 'linked_form_fields_checkbox', newCheckboxes);
                                }}
                                placeholder="Database value"
                              />
                              <Input
                                value={checkbox.pdfAttribute}
                                onChange={e => {
                                  const newCheckboxes = [...(pdf.linked_form_fields_checkbox || [])];
                                  newCheckboxes[checkboxIndex] = { ...newCheckboxes[checkboxIndex], pdfAttribute: e.target.value };
                                  updatePdfAttribute(index, 'linked_form_fields_checkbox', newCheckboxes);
                                }}
                                placeholder="PDF field name"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newCheckboxes = (pdf.linked_form_fields_checkbox || []).filter((_, i) => i !== checkboxIndex);
                                updatePdfAttribute(index, 'linked_form_fields_checkbox', newCheckboxes.length > 0 ? newCheckboxes : undefined);
                              }}
                              className="self-start"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCheckboxes = [...(pdf.linked_form_fields_checkbox || []), { fromDatabase: '', pdfAttribute: '' }];
                          updatePdfAttribute(index, 'linked_form_fields_checkbox', newCheckboxes);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Checkbox Field
                      </Button>
                    </div>
                  </div>

                  {/* Linked Date Fields */}
                  <div>
                    <Label>Linked Date Fields</Label>
                    <div className="space-y-2">
                      {(pdf.linked_dates || []).map((date, dateIndex) => (
                        <Card key={dateIndex} className="p-3">
                          <div className="flex gap-2 items-center">
                            <Input
                              value={date.dateFieldName}
                              onChange={e => {
                                const newDates = [...(pdf.linked_dates || [])];
                                newDates[dateIndex] = { dateFieldName: e.target.value };
                                updatePdfAttribute(index, 'linked_dates', newDates);
                              }}
                              placeholder="Date field name"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newDates = (pdf.linked_dates || []).filter((_, i) => i !== dateIndex);
                                updatePdfAttribute(index, 'linked_dates', newDates.length > 0 ? newDates : undefined);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDates = [...(pdf.linked_dates || []), { dateFieldName: '' }];
                          updatePdfAttribute(index, 'linked_dates', newDates);
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Date Field
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {item.pdf_attributes?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No PDF mappings configured. Click &quot;Add Mapping&quot; to map this field to PDF forms.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

export default function SchemaEditor({ schema, onSchemaChange }: SchemaEditorProps) {
  const [sortByBlock, setSortByBlock] = useState<boolean>(() => {
    // Load preference from localStorage only in browser
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('schemaEditor.sortByBlock');
      return saved === null ? true : saved === 'true';
    }
    return true; // Default to sorting by block
  });

  // Save preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('schemaEditor.sortByBlock', sortByBlock.toString());
    }
  }, [sortByBlock]);

  // Function to normalize order numbers to match array positions
  const normalizeOrderNumbers = useCallback((schemaItems: SchemaItem[]): SchemaItem[] => {
    return schemaItems.map((item, index) => ({
      ...item,
      display_attributes: {
        ...item.display_attributes,
        order: index + 1
      }
    }));
  }, []);


  const addNewField = useCallback((afterOrder?: number) => {
    const newSchema = [...schema];
    
    let insertIndex: number;
    if (afterOrder !== undefined) {
      // Find the item with the specified order
      const itemIndex = newSchema.findIndex(item => item.display_attributes.order === afterOrder);
      insertIndex = itemIndex !== -1 ? itemIndex + 1 : newSchema.length;
    } else {
      // Add at the end
      insertIndex = newSchema.length;
    }
    
    const newField: SchemaItem = {
      unique_id: generateUniqueId(),
      display_attributes: {
        display_name: 'New Field',
        input_type: 'text',
        order: insertIndex + 1, // Will be normalized
        width: 12,
        value: {
          type: 'manual'
        }
      }
    };
    
    // Insert the new field at the correct position
    newSchema.splice(insertIndex, 0, newField);
    
    // Normalize all order numbers to match positions
    const normalizedSchema = normalizeOrderNumbers(newSchema);
    onSchemaChange(normalizedSchema);
  }, [schema, onSchemaChange, normalizeOrderNumbers]);

  const updateField = useCallback((index: number, updatedItem: SchemaItem) => {
    const newSchema = [...schema];
    newSchema[index] = updatedItem;
    onSchemaChange(newSchema);
  }, [schema, onSchemaChange]);

  const deleteField = useCallback((index: number) => {
    const newSchema = schema.filter((_, i) => i !== index);
    // Normalize order numbers after deletion
    const normalizedSchema = normalizeOrderNumbers(newSchema);
    onSchemaChange(normalizedSchema);
  }, [schema, onSchemaChange, normalizeOrderNumbers]);

  const duplicateField = useCallback((index: number) => {
    const originalField = schema[index];
    const duplicatedField: SchemaItem = {
      ...JSON.parse(JSON.stringify(originalField)),
      unique_id: generateUniqueId(),
      display_attributes: {
        ...originalField.display_attributes,
        display_name: originalField.display_attributes.display_name ? `${originalField.display_attributes.display_name} (Copy)` : 'Field Copy',
        order: index + 2 // Will be normalized
      }
    };
    
    // Insert right after the original field
    const newSchema = [...schema];
    newSchema.splice(index + 1, 0, duplicatedField);
    
    // Normalize order numbers
    const normalizedSchema = normalizeOrderNumbers(newSchema);
    onSchemaChange(normalizedSchema);
  }, [schema, onSchemaChange, normalizeOrderNumbers]);

  const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
    const newSchema = [...schema];
    const draggedItem = newSchema[dragIndex];
    
    // Remove dragged item
    newSchema.splice(dragIndex, 1);
    // Insert at new position
    newSchema.splice(hoverIndex, 0, draggedItem);
    
    // Normalize order numbers to match positions
    const normalizedSchema = normalizeOrderNumbers(newSchema);
    onSchemaChange(normalizedSchema);
  }, [schema, onSchemaChange, normalizeOrderNumbers]);

  const sortedSchema = useMemo(() => {
    if (!sortByBlock) {
      // Sort only by order when sortByBlock is false
      return [...schema].sort((a, b) => a.display_attributes.order - b.display_attributes.order);
    }
    
    // Original block-based sorting logic
    // First, create a map of block names to their minimum order
    const blockMinOrder = new Map<string, number>();
    schema.forEach(item => {
      const block = item.display_attributes.block;
      if (block) {
        const currentMin = blockMinOrder.get(block);
        if (currentMin === undefined || item.display_attributes.order < currentMin) {
          blockMinOrder.set(block, item.display_attributes.order);
        }
      }
    });
    
    return [...schema].sort((a, b) => {
      const blockA = a.display_attributes.block || '';
      const blockB = b.display_attributes.block || '';
      
      if (blockA !== blockB) {
        // If one has no block and the other does, no-block items come first
        if (!blockA) return -1;
        if (!blockB) return 1;
        
        // Sort blocks by their minimum order value
        const minOrderA = blockMinOrder.get(blockA) || 0;
        const minOrderB = blockMinOrder.get(blockB) || 0;
        return minOrderA - minOrderB;
      }
      
      // Within the same block (or both without blocks), sort by order
      return a.display_attributes.order - b.display_attributes.order;
    });
  }, [schema, sortByBlock]);

  const moveFieldUp = useCallback((index: number) => {
    if (index > 0) {
      moveField(index, index - 1);
    }
  }, [moveField]);

  const moveFieldDown = useCallback((index: number) => {
    if (index < schema.length - 1) {
      moveField(index, index + 1);
    }
  }, [moveField, schema.length]);

  const reorderField = useCallback((itemId: string, newOrder: number) => {
    const currentIndex = schema.findIndex(item => item.unique_id === itemId);
    if (currentIndex === -1) return;

    const clampedOrder = Math.max(1, Math.min(newOrder, schema.length));
    const targetIndex = clampedOrder - 1;
    
    // If the target position is the same as current, do nothing
    if (currentIndex === targetIndex) return;

    const newSchema = [...schema];
    const [movedItem] = newSchema.splice(currentIndex, 1);
    newSchema.splice(targetIndex, 0, movedItem);
    
    // Normalize all order numbers to ensure they match positions
    const normalizedSchema = normalizeOrderNumbers(newSchema);
    onSchemaChange(normalizedSchema);
  }, [schema, onSchemaChange, normalizeOrderNumbers]);

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Schema Editor</h2>
          <Button
            variant={sortByBlock ? "default" : "outline"}
            size="sm"
            onClick={() => setSortByBlock(!sortByBlock)}
            className="text-xs"
          >
            {sortByBlock ? "Sorted by Block" : "Sorted by Order"}
          </Button>
        </div>
        <Button onClick={() => addNewField()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-2 pr-4">
          {sortedSchema.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No fields in schema. Click &quot;Add Field&quot; to get started.</p>
            </div>
          ) : (
            sortedSchema.map((item, index) => {
              const originalIndex = schema.findIndex(field => field.unique_id === item.unique_id);
              return (
                <React.Fragment key={`field-${originalIndex}`}>
                  {index === 0 && (
                    <div className="flex justify-center py-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addNewField(0)}
                        className="h-6 px-2 hover:bg-blue-50 hover:text-blue-600 transition-colors opacity-50 hover:opacity-100"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <FieldEditor
                    item={item}
                    index={index}
                    onUpdate={updatedItem => updateField(originalIndex, updatedItem)}
                    onDelete={() => deleteField(originalIndex)}
                    onDuplicate={() => duplicateField(originalIndex)}
                    onMove={moveField}
                    onMoveUp={() => moveFieldUp(index)}
                    onMoveDown={() => moveFieldDown(index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedSchema.length - 1}
                    schema={schema}
                    onReorder={reorderField}
                  />
                  <div className="flex justify-center py-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addNewField(item.display_attributes.order)}
                      className="h-6 px-2 hover:bg-blue-50 hover:text-blue-600 transition-colors opacity-50 hover:opacity-100"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}