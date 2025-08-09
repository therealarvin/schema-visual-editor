"use client";

import React, { useState } from "react";
import { SchemaItem, Schema, FieldGroup, PDFField } from "@/types/schema";
import SchemaItemEditor from "./SchemaItemEditor";
import BeautificationModal from "./BeautificationModal";
import IndividualCheckboxIntentDialog from "./IndividualCheckboxIntentDialog";
import NotificationModal from "./NotificationModal";
import { generateFieldAttributes, organizeSchema, beautifySchemaBlock, BeautificationIteration, generateSingleCheckboxLabel } from "@/lib/aiService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SchemaEditorProps {
  schema: Schema;
  onSchemaChange: (schema: Schema) => void;
  fieldGroup?: FieldGroup;
  formType: string;
  onStartLinking?: (linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  linkingMode?: { linkingPath: string; linkingType: 'checkbox' | 'date' | 'text' } | null;
  onHighlightField?: (fieldName: string | null) => void;
  onNavigateToPage?: (page: number) => void;
  onEditingItemChange?: (itemId: string | null) => void;
  extractedFields?: PDFField[];
  currentPage?: number;
  visibilityFieldSelectionMode?: boolean;
  onVisibilityFieldSelected?: (schemaItemId: string, conditionIndex: number) => void;
}

// Sortable item component
function SortableSchemaItem({ 
  item, 
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onStartLinking,
  onSaveAndStartLinking,
  linkingMode,
  onStartVisibilityFieldSelection,
  visibilityFieldSelectionMode,
  schema
}: {
  item: SchemaItem;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (item: SchemaItem) => void;
  onCancel: () => void;
  onStartLinking?: (linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  onSaveAndStartLinking?: (item: SchemaItem, linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  linkingMode?: { linkingPath: string; linkingType: 'checkbox' | 'date' | 'text' } | null;
  onStartVisibilityFieldSelection?: (conditionIndex: number) => void;
  visibilityFieldSelectionMode?: number | null;
  schema?: SchemaItem[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.unique_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "12px",
        background: isDragging ? "#f3f4f6" : "white",
      }}
    >
      {isEditing ? (
        <SchemaItemEditor
          item={item}
          onSave={onSave}
          onCancel={onCancel}
          onSaveAndStartLinking={onSaveAndStartLinking}
          linkingMode={linkingMode}
          onStartVisibilityFieldSelection={onStartVisibilityFieldSelection}
          visibilityFieldSelectionMode={visibilityFieldSelectionMode}
          schema={schema}
        />
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: "grab",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "2px"
            }}
            title="Drag to reorder"
          >
            <div style={{ width: "20px", height: "2px", background: "#9ca3af" }} />
            <div style={{ width: "20px", height: "2px", background: "#9ca3af" }} />
            <div style={{ width: "20px", height: "2px", background: "#9ca3af" }} />
          </div>
          
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{item.display_attributes.display_name || item.unique_id}</strong>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Type: {item.display_attributes.input_type} | Order: {item.display_attributes.order}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onEdit}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ef4444",
                  borderRadius: "4px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemaEditor({ 
  schema, 
  onSchemaChange, 
  fieldGroup, 
  formType, 
  onStartLinking, 
  linkingMode, 
  onHighlightField, 
  onNavigateToPage,
  onEditingItemChange,
  extractedFields = [],
  currentPage,
  visibilityFieldSelectionMode: parentVisibilityMode,
  onVisibilityFieldSelected
}: SchemaEditorProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<SchemaItem> | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [beautifyingBlock, setBeautifyingBlock] = useState<string | null>(null);
  const [beautificationIterations, setBeautificationIterations] = useState<BeautificationIteration[]>([]);
  const [beautificationProgress, setBeautificationProgress] = useState<{
    blockName: string;
    iteration: number;
    totalIterations: number;
  } | null>(null);
  const [showBeautificationModal, setShowBeautificationModal] = useState(false);
  const [showCheckboxIntentDialog, setShowCheckboxIntentDialog] = useState(false);
  const [pendingCheckboxGroup, setPendingCheckboxGroup] = useState<FieldGroup | null>(null);
  
  // Store the last editing item to preserve it across various actions
  const [persistentEditingItem, setPersistentEditingItem] = useState<string | null>(null);
  
  // Visibility field selection mode
  const [visibilityFieldSelectionMode, setVisibilityFieldSelectionMode] = useState<number | null>(null);
  const [visibilityEditingItemId, setVisibilityEditingItemId] = useState<string | null>(null);
  
  // Helper to get all field names associated with a schema item
  const getSchemaItemFieldNames = (item: SchemaItem): string[] => {
    const fieldNames: string[] = [];
    
    item.pdf_attributes?.forEach(attr => {
      // Add main form field
      if (typeof attr.formfield === 'string') {
        fieldNames.push(attr.formfield);
      } else if (Array.isArray(attr.formfield)) {
        fieldNames.push(...attr.formfield);
      }
      
      // Add linked text fields
      if (attr.linked_form_fields_text) {
        fieldNames.push(...attr.linked_form_fields_text);
      }
      
      // Add linked checkbox fields
      if (attr.linked_form_fields_checkbox) {
        attr.linked_form_fields_checkbox.forEach(cb => {
          fieldNames.push(cb.pdfAttribute);
        });
      }
      
      // Add linked radio fields
      if (attr.linked_form_fields_radio) {
        attr.linked_form_fields_radio.forEach(r => {
          fieldNames.push(r.radioField);
        });
      }
    });
    
    return fieldNames;
  };
  
  // Handle visibility field selection
  const handleStartVisibilityFieldSelection = (conditionIndex: number) => {
    setVisibilityFieldSelectionMode(conditionIndex);
    setVisibilityEditingItemId(editingItem);
    if (onVisibilityFieldSelected && editingItem) {
      onVisibilityFieldSelected(editingItem, conditionIndex);
    }
  };
  
  // Handle edit item click
  const handleEditItem = (itemId: string) => {
    setEditingItem(itemId);
    setPersistentEditingItem(itemId);
    
    // Notify parent about editing item change
    if (onEditingItemChange) {
      onEditingItemChange(itemId);
    }
    
    // Find the schema item
    const item = schema.find(s => s.unique_id === itemId);
    if (!item) return;
    
    // Get all field names for this schema item
    const fieldNames = getSchemaItemFieldNames(item);
    
    // Find all pages that contain these fields
    const pages = new Set<number>();
    extractedFields.forEach(field => {
      if (fieldNames.includes(field.name)) {
        pages.add(field.page);
      }
    });
    
    if (pages.size > 0 && onNavigateToPage) {
      const pagesArray = Array.from(pages).sort((a, b) => a - b);
      
      // If current page has fields from this item, stay on it
      if (currentPage && pages.has(currentPage)) {
        // Already on a page with this item's fields
        return;
      }
      
      // Otherwise navigate to the first page with this item's fields
      onNavigateToPage(pagesArray[0]);
    }
  };
  
  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    title?: string;
  }>({ isOpen: false, message: '', type: 'info' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate schema item with custom labels for checkboxes
  const generateSchemaItemWithLabels = async (
    group: FieldGroup, 
    labels: { fieldName: string; displayName: string; reasoning: string }[]
  ): Promise<SchemaItem> => {
    const firstField = group.fields[0];
    const uniqueId = firstField.name;

    const baseItem: SchemaItem = {
      unique_id: uniqueId,
      display_attributes: {
        display_name: group.displayName || group.intent || "",
        input_type: "checkbox",
        order: schema.length + 1,
        value: {
          type: "manual"
        },
        checkbox_options: {
          options: group.fields.map(field => {
            // Find the AI-generated label for this field
            const aiLabel = labels.find(l => l.fieldName === field.name);
            return {
              display_name: aiLabel?.displayName || field.name,
              databaseStored: field.name,
              linkedFields: []
            };
          })
        }
      },
      pdf_attributes: [{
        formType,
        formfield: firstField.name,
        linked_form_fields_checkbox: group.fields.map(field => ({
          fromDatabase: field.name,
          pdfAttribute: field.name
        }))
      }]
    };

    // If intent is provided, use AI to enhance other attributes
    if (group.intent) {
      try {
        setIsGeneratingAI(true);
        
        const aiAttributes = await generateFieldAttributes({
          intent: group.intent,
          fieldType: 'checkbox',
          screenshot: undefined,
          pdfContext: group.fields,
          groupType: 'checkbox'
        });
        
        // Apply AI attributes but keep our custom checkbox labels
        baseItem.display_attributes.display_name = aiAttributes.display_name;
        if (aiAttributes.description) {
          baseItem.display_attributes.description = aiAttributes.description;
        }
        if (aiAttributes.width) {
          baseItem.display_attributes.width = aiAttributes.width;
        }
        if (aiAttributes.special_input) {
          baseItem.display_attributes.special_input = aiAttributes.special_input;
        }
      } catch (error) {
        console.error('AI generation failed:', error);
      } finally {
        setIsGeneratingAI(false);
      }
    }

    return baseItem;
  };

  // Handle individual checkbox intents
  const handleIndividualCheckboxIntents = async (intents: { fieldName: string; intent: string }[]) => {
    setShowCheckboxIntentDialog(false);
    
    if (!pendingCheckboxGroup) return;
    
    const group = pendingCheckboxGroup;
    setPendingCheckboxGroup(null);
    
    setIsGeneratingAI(true);
    
    try {
      // Generate labels for each checkbox option individually
      const labels: { fieldName: string; displayName: string; reasoning: string }[] = [];
      
      for (const checkboxIntent of intents) {
        if (checkboxIntent.intent) {
          // Generate label with AI for this specific checkbox
          const labelResponse = await generateSingleCheckboxLabel({
            fieldName: checkboxIntent.fieldName,
            intent: checkboxIntent.intent,
            formType
          });
          
          labels.push({
            fieldName: checkboxIntent.fieldName,
            displayName: labelResponse.displayName,
            reasoning: labelResponse.reasoning
          });
        } else {
          // No intent provided, use original field name
          labels.push({
            fieldName: checkboxIntent.fieldName,
            displayName: checkboxIntent.fieldName,
            reasoning: 'No intent provided, using original field name'
          });
        }
      }
      
      // Create schema item with AI-generated labels
      const schemaItem = await generateSchemaItemWithLabels(group, labels);
      setNewItem(schemaItem);
      setEditingItem(schemaItem.unique_id);
    } catch (error) {
      console.error('Error generating checkbox labels:', error);
      setNotification({
        isOpen: true,
        message: 'Failed to generate checkbox labels. Please try again.',
        type: 'error',
        title: 'Generation Failed'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Generate schema item from field group
  const generateSchemaItem = async (group: FieldGroup): Promise<SchemaItem> => {
    const firstField = group.fields[0];
    const uniqueId = firstField.name;

    const baseItem: SchemaItem = {
      unique_id: uniqueId,
      display_attributes: {
        display_name: group.displayName || group.intent || "",
        input_type: "text",
        order: schema.length + 1,
        value: {
          type: "manual"
        }
      }
    };

    // Generate pdf_attributes based on group type
    if (group.groupType === "text-continuation") {
      baseItem.display_attributes.input_type = "text";
      baseItem.pdf_attributes = [{
        formType,
        formfield: firstField.name,
        linked_form_fields_text: group.fields.map(f => f.name)  // Include all fields, not just slice(1)
      }];
    } else if (group.groupType === "text-same-value") {
      baseItem.display_attributes.input_type = "text";
      baseItem.pdf_attributes = group.fields.map(field => ({
        formType,
        formfield: field.name
      }));
    } else if (group.groupType === "checkbox") {
      baseItem.display_attributes.input_type = "checkbox";
      baseItem.display_attributes.checkbox_options = {
        options: group.fields.map(field => ({
          display_name: field.name,
          databaseStored: field.name,
          linkedFields: []
        }))
      };
      baseItem.pdf_attributes = [{
        formType,
        formfield: firstField.name,
        linked_form_fields_checkbox: group.fields.map(field => ({
          fromDatabase: field.name,
          pdfAttribute: field.name
        }))
      }];
    } else if (group.groupType === "radio") {
      baseItem.display_attributes.input_type = "radio";
      baseItem.display_attributes.display_radio_options = group.fields.map(f => f.name);
      baseItem.pdf_attributes = [{
        formType,
        formfield: group.fields.map(f => f.name),
        linked_form_fields_radio: group.fields.map(field => ({
          radioField: field.name,
          displayName: field.name
        }))
      }];
    }

    // If intent is provided, use AI to generate better attributes
    if (group.intent) {
      try {
        setIsGeneratingAI(true);
        
        // Map group type to input type
        let inputType: SchemaItem['display_attributes']['input_type'] = 'text';
        if (group.groupType === 'checkbox') inputType = 'checkbox';
        else if (group.groupType === 'radio') inputType = 'radio';
        
        // Generate AI attributes (without screenshot)
        const aiAttributes = await generateFieldAttributes({
          intent: group.intent,
          fieldType: inputType,
          screenshot: undefined,  // No screenshot
          pdfContext: group.fields,
          groupType: group.groupType
        });
        
        // Apply AI-generated attributes
        baseItem.display_attributes.display_name = aiAttributes.display_name;
        if (aiAttributes.description) {
          baseItem.display_attributes.description = aiAttributes.description;
        }
        if (aiAttributes.width) {
          baseItem.display_attributes.width = aiAttributes.width;
        }
        if (aiAttributes.placeholder) {
          baseItem.display_attributes.placeholder = aiAttributes.placeholder;
        }
        if (aiAttributes.special_input) {
          baseItem.display_attributes.special_input = aiAttributes.special_input;
        }
        
        // For checkboxes, apply AI-generated option display names
        if (group.groupType === 'checkbox' && aiAttributes.checkbox_options?.options) {
          const aiOptions = aiAttributes.checkbox_options.options;
          baseItem.display_attributes.checkbox_options = {
            options: group.fields.map(field => {
              // Find matching AI-generated option by value
              const aiOption = aiOptions.find((opt: any) => opt.value === field.name);
              return {
                display_name: aiOption?.display_name || field.name,
                databaseStored: field.name,
                linkedFields: []
              };
            })
          };
        }
      } catch (error) {
        console.error('AI generation failed:', error);
        // Fallback to intent as display name
        baseItem.display_attributes.display_name = group.intent;
      } finally {
        setIsGeneratingAI(false);
      }
    }

    return baseItem;
  };

  // Add new schema item from field group
  React.useEffect(() => {
    // Only process if we have a field group with intent AND it's not already in the schema
    if (fieldGroup && fieldGroup.intent) {
      // Check if this field group's items are already in the schema
      const firstFieldName = fieldGroup.fields[0]?.name;
      const alreadyInSchema = schema.some(item => item.unique_id === firstFieldName);
      
      // Also check if we already have a newItem with this field
      const alreadyProcessing = newItem && newItem.unique_id === firstFieldName;
      
      // Only generate if not already in schema and not currently processing
      if (!alreadyInSchema && !alreadyProcessing) {
        // For checkbox groups, show the intent dialog
        if (fieldGroup.groupType === 'checkbox') {
          setPendingCheckboxGroup(fieldGroup);
          setShowCheckboxIntentDialog(true);
        } else {
          // For other types, generate normally
          (async () => {
            const newSchemaItem = await generateSchemaItem(fieldGroup);
            setNewItem(newSchemaItem);
            setEditingItem(newSchemaItem.unique_id);
          })();
        }
      }
    }
  }, [fieldGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync persistent editing state with current editing state
  React.useEffect(() => {
    if (editingItem) {
      setPersistentEditingItem(editingItem);
    }
  }, [editingItem]);
  
  // Restore editing state when coming back from linking mode
  React.useEffect(() => {
    if (!linkingMode && persistentEditingItem && !editingItem) {
      // Restore the editing state after linking completes
      setEditingItem(persistentEditingItem);
    }
  }, [linkingMode, persistentEditingItem, editingItem]);

  const handleSaveItem = (item: SchemaItem, keepOpen: boolean = false) => {
    if (newItem && item.unique_id === newItem.unique_id) {
      // Adding new item
      onSchemaChange([...schema, item]);
      setNewItem(null);
    } else {
      // Updating existing item
      onSchemaChange(schema.map(s => s.unique_id === item.unique_id ? item : s));
    }
    // Only close the editor if not explicitly told to keep it open
    if (!keepOpen) {
      setEditingItem(null);
      setPersistentEditingItem(null); // Clear persistent state when intentionally closing
    }
  };
  
  // Special save function for linking that keeps the editor open
  const handleSaveForLinking = (item: SchemaItem) => {
    handleSaveItem(item, true); // Keep editor open
  };
  
  // Custom linking handler that saves the item but keeps editor open
  const handleStartLinkingWithSave = (item: SchemaItem, linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => {
    // Save the item but keep the editor open
    handleSaveForLinking(item);
    // Start linking mode
    if (onStartLinking) {
      onStartLinking(linkingPath, linkingType);
    }
  };

  const handleDeleteItem = (uniqueId: string) => {
    // Update order attributes for remaining items
    const newSchema = schema
      .filter(s => s.unique_id !== uniqueId)
      .map((item, index) => ({
        ...item,
        display_attributes: {
          ...item.display_attributes,
          order: index + 1
        }
      }));
    onSchemaChange(newSchema);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = schema.findIndex((item) => item.unique_id === active.id);
      const newIndex = schema.findIndex((item) => item.unique_id === over.id);
      
      // Reorder the array
      const newSchema = arrayMove(schema, oldIndex, newIndex);
      
      // Update order attributes to match new positions
      const updatedSchema = newSchema.map((item, index) => ({
        ...item,
        display_attributes: {
          ...item.display_attributes,
          order: index + 1
        }
      }));
      
      onSchemaChange(updatedSchema);
    }
    
    setActiveId(null);
  };

  const handleOrganizeSchema = async () => {
    if (schema.length === 0) return;
    
    setIsOrganizing(true);
    try {
      const result = await organizeSchema({
        schema,
        formType
      });
      
      if (result.error) {
        console.error('Failed to organize schema:', result.error);
        setNotification({
          isOpen: true,
          message: `Failed to organize schema: ${result.error}`,
          type: 'error',
          title: 'Organization Failed'
        });
      } else {
        onSchemaChange(result.schema);
        
        // Show summary of blocks created
        if (result.blocks && result.blocks.length > 0) {
          const blockSummary = result.blocks
            .map(b => `${b.title}: ${b.item_count} items`)
            .join('\n');
          setNotification({
            isOpen: true,
            message: `Schema organized into ${result.blocks.length} blocks:\n\n${blockSummary}`,
            type: 'success',
            title: 'Schema Organized'
          });
        }
      }
    } catch (error) {
      console.error('Error organizing schema:', error);
      setNotification({
        isOpen: true,
        message: 'Failed to organize schema. Please try again.',
        type: 'error',
        title: 'Organization Error'
      });
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleBeautifyBlock = async (blockName: string) => {
    if (!blockName || beautifyingBlock) return;
    
    setBeautifyingBlock(blockName);
    setBeautificationIterations([]);
    setBeautificationProgress({
      blockName,
      iteration: 0,
      totalIterations: 2  // Reduced for speed
    });
    setShowBeautificationModal(true);
    
    try {
      // Use Server-Sent Events for real-time updates
      const response = await fetch('/api/beautify-schema-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema,
          blockName,
          formType,
          iterationLimit: 2  // Reduced for speed
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      const iterations: BeautificationIteration[] = [];
      let currentIteration: Partial<BeautificationIteration> = {};
      let finalSchema: SchemaItem[] | null = null;
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Append new data to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events in the buffer
        const events = buffer.split('\n\n');
        
        // Keep the last incomplete event in the buffer
        buffer = events.pop() || '';
        
        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;
          
          const lines = eventBlock.split('\n');
          let eventType = '';
          let eventData: any = null;
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                eventData = JSON.parse(line.slice(6));
              } catch (e) {
                console.error('Failed to parse event data:', line);
              }
            }
          }
          
          if (eventType && eventData) {
            console.log(`Processing event: ${eventType}`, eventData);
            
            switch (eventType) {
                case 'start':
                  console.log('Beautification started:', eventData);
                  break;
                  
                case 'iteration-start':
                  console.log('Starting iteration:', eventData.iteration);
                  setBeautificationProgress(prev => prev ? {
                    ...prev,
                    iteration: eventData.iteration
                  } : null);
                  currentIteration = {
                    iteration: eventData.iteration,
                    changes: [],
                    isComplete: false
                  };
                  break;
                  
                case 'screenshot':
                  console.log('Screenshot received for iteration:', eventData.iteration);
                  currentIteration.screenshot = eventData.screenshot;
                  break;
                  
                case 'analysis':
                  console.log('Analysis received for iteration:', eventData.iteration);
                  currentIteration.reasoning = eventData.analysis;
                  break;
                  
                case 'changes':
                  console.log('Changes received for iteration:', eventData.iteration, 'Count:', eventData.changes?.length);
                  currentIteration.changes = eventData.changes;
                  break;
                  
                case 'iteration-complete':
                  console.log('Iteration complete:', eventData.iteration, 'Is complete:', eventData.isComplete);
                  if (currentIteration.iteration) {
                    const completeIteration: BeautificationIteration = {
                      iteration: currentIteration.iteration,
                      screenshot: currentIteration.screenshot || '',
                      changes: currentIteration.changes || [],
                      reasoning: eventData.reasoning || currentIteration.reasoning || '',
                      isComplete: eventData.isComplete
                    };
                    iterations.push(completeIteration);
                    setBeautificationIterations([...iterations]);
                    console.log('Total iterations so far:', iterations.length);
                  }
                  // Reset for next iteration
                  currentIteration = {};
                  break;
                  
                case 'complete':
                  finalSchema = eventData.schema;
                  console.log(`Beautification complete in ${eventData.duration}ms, total iterations: ${iterations.length}`);
                  break;
                  
                case 'error':
                  console.error('Beautification error:', eventData.message);
                  setNotification({
                    isOpen: true,
                    message: eventData.message,
                    type: 'error',
                    title: 'Beautification Error'
                  });
                  break;
              }
            }
          }
        }
      
      // Apply final schema
      if (finalSchema) {
        onSchemaChange(finalSchema);
      }
      
    } catch (error) {
      console.error('Error beautifying block:', error);
      setNotification({
        isOpen: true,
        message: 'Failed to beautify block. Please try again.',
        type: 'error',
        title: 'Beautification Failed'
      });
    } finally {
      setBeautifyingBlock(null);
      setBeautificationProgress(null);
    }
  };

  const activeItem = activeId ? schema.find(item => item.unique_id === activeId) : null;

  return (
    <>
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        title={notification.title}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
      
      <BeautificationModal
        isOpen={showBeautificationModal}
        blockName={beautificationProgress?.blockName || ''}
        currentIteration={beautificationProgress?.iteration || 0}
        totalIterations={beautificationProgress?.totalIterations || 2}
        iterations={beautificationIterations}
        onClose={() => setShowBeautificationModal(false)}
      />
      
      <IndividualCheckboxIntentDialog
        isOpen={showCheckboxIntentDialog}
        checkboxOptions={pendingCheckboxGroup?.fields.map(f => ({
          fieldName: f.name,
          currentLabel: f.name,
          page: f.page
        })) || []}
        onComplete={handleIndividualCheckboxIntents}
        onCancel={() => {
          setShowCheckboxIntentDialog(false);
          setPendingCheckboxGroup(null);
          if (onHighlightField) {
            onHighlightField(null); // Clear highlight on cancel
          }
        }}
        onHighlightField={onHighlightField}
        onNavigateToPage={onNavigateToPage}
      />
      
      <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Schema Editor</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {schema.length > 0 && (
            <button
              onClick={handleOrganizeSchema}
              disabled={isOrganizing}
              style={{
                padding: "8px 16px",
                border: "1px solid #8b5cf6",
                borderRadius: "6px",
                background: isOrganizing ? "#f3f4f6" : "#8b5cf6",
                color: isOrganizing ? "#6b7280" : "white",
                cursor: isOrganizing ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {isOrganizing ? (
                <>
                  <div style={{ 
                    width: "14px", 
                    height: "14px", 
                    border: "2px solid #6b7280", 
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  Organizing...
                </>
              ) : (
                <>
                  <span style={{ fontSize: "16px" }}>🤖</span>
                  Organize with AI
                </>
              )}
            </button>
          )}
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            Drag items to reorder
          </div>
        </div>
      </div>
      
      {isGeneratingAI && (
        <div style={{ 
          padding: "12px", 
          background: "#eff6ff", 
          border: "1px solid #2563eb", 
          borderRadius: "8px", 
          marginBottom: "12px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ 
              width: "16px", 
              height: "16px", 
              border: "2px solid #2563eb", 
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <span>AI is generating field attributes using GPT-5 nano...</span>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {newItem && editingItem === newItem.unique_id && (
        <div style={{ marginBottom: "20px" }}>
          <h3>New Schema Item</h3>
          <div style={{
            border: "2px dashed #10b981",
            borderRadius: "8px",
            padding: "12px",
            background: "#f0fdf4"
          }}>
            <SchemaItemEditor
              item={newItem as SchemaItem}
              onSave={handleSaveItem}
              onCancel={() => {
                setEditingItem(null);
                setNewItem(null);
                setPersistentEditingItem(null);
              }}
              onSaveAndStartLinking={handleStartLinkingWithSave}
              linkingMode={linkingMode}
            />
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={schema.map(item => item.unique_id)}
          strategy={verticalListSortingStrategy}
        >
          {schema.map((item, index) => {
            const prevItem = index > 0 ? schema[index - 1] : null;
            const showBlockHeader = !prevItem || prevItem.display_attributes.block !== item.display_attributes.block;
            const blockStyle = item.display_attributes.block_style;
            
            return (
              <React.Fragment key={item.unique_id}>
                {showBlockHeader && item.display_attributes.block && (
                  <div style={{
                    marginTop: index > 0 ? "24px" : "0",
                    marginBottom: "12px",
                    padding: "8px 12px",
                    background: blockStyle?.color_theme === 'blue' ? '#eff6ff' :
                               blockStyle?.color_theme === 'green' ? '#f0fdf4' :
                               blockStyle?.color_theme === 'purple' ? '#faf5ff' :
                               blockStyle?.color_theme === 'orange' ? '#fff7ed' :
                               '#f9fafb',
                    borderLeft: `4px solid ${
                      blockStyle?.color_theme === 'blue' ? '#2563eb' :
                      blockStyle?.color_theme === 'green' ? '#10b981' :
                      blockStyle?.color_theme === 'purple' ? '#8b5cf6' :
                      blockStyle?.color_theme === 'orange' ? '#f97316' :
                      '#6b7280'
                    }`,
                    borderRadius: "4px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "600",
                          color: blockStyle?.color_theme === 'blue' ? '#1e40af' :
                                 blockStyle?.color_theme === 'green' ? '#047857' :
                                 blockStyle?.color_theme === 'purple' ? '#6b21a8' :
                                 blockStyle?.color_theme === 'orange' ? '#c2410c' :
                                 '#374151'
                        }}>
                          {blockStyle?.title || item.display_attributes.block}
                        </div>
                        {blockStyle?.description && (
                          <div style={{ 
                            fontSize: "13px", 
                            color: "#6b7280",
                            marginTop: "4px"
                          }}>
                            {blockStyle.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleBeautifyBlock(item.display_attributes.block!)}
                        disabled={beautifyingBlock === item.display_attributes.block}
                        style={{
                          padding: "4px 10px",
                          fontSize: "12px",
                          border: "1px solid",
                          borderColor: beautifyingBlock === item.display_attributes.block ? "#d1d5db" :
                                      blockStyle?.color_theme === 'blue' ? '#2563eb' :
                                      blockStyle?.color_theme === 'green' ? '#10b981' :
                                      blockStyle?.color_theme === 'purple' ? '#8b5cf6' :
                                      blockStyle?.color_theme === 'orange' ? '#f97316' :
                                      '#6b7280',
                          borderRadius: "4px",
                          background: beautifyingBlock === item.display_attributes.block ? "#f3f4f6" : "white",
                          color: beautifyingBlock === item.display_attributes.block ? "#9ca3af" :
                                blockStyle?.color_theme === 'blue' ? '#2563eb' :
                                blockStyle?.color_theme === 'green' ? '#10b981' :
                                blockStyle?.color_theme === 'purple' ? '#8b5cf6' :
                                blockStyle?.color_theme === 'orange' ? '#f97316' :
                                '#6b7280',
                          cursor: beautifyingBlock === item.display_attributes.block ? "not-allowed" : "pointer",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {beautifyingBlock === item.display_attributes.block ? (
                          <>
                            <div style={{ 
                              width: "10px", 
                              height: "10px", 
                              border: "2px solid #9ca3af", 
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }} />
                            Beautifying...
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: "14px" }}>✨</span>
                            Beautify
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <SortableSchemaItem
                  item={item}
                  isEditing={editingItem === item.unique_id}
                  onEdit={() => handleEditItem(item.unique_id)}
                  onDelete={() => handleDeleteItem(item.unique_id)}
                  onSave={handleSaveItem}
                  onCancel={() => {
                    setEditingItem(null);
                    setPersistentEditingItem(null);
                    setVisibilityFieldSelectionMode(null);
                    setVisibilityEditingItemId(null);
                    if (onEditingItemChange) {
                      onEditingItemChange(null);
                    }
                  }}
                  onSaveAndStartLinking={handleStartLinkingWithSave}
                  linkingMode={linkingMode}
                  onStartVisibilityFieldSelection={handleStartVisibilityFieldSelection}
                  visibilityFieldSelectionMode={visibilityFieldSelectionMode}
                  schema={schema}
                />
              </React.Fragment>
            );
          })}
        </SortableContext>
        
        <DragOverlay>
          {activeItem ? (
            <div style={{
              border: "2px solid #2563eb",
              borderRadius: "8px",
              padding: "12px",
              background: "white",
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              opacity: 0.9
            }}>
              <strong>{activeItem.display_attributes.display_name || activeItem.unique_id}</strong>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Type: {activeItem.display_attributes.input_type} | Order: {activeItem.display_attributes.order}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {schema.length === 0 && !newItem && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px",
          color: "#6b7280",
          border: "2px dashed #e5e7eb",
          borderRadius: "8px"
        }}>
          Select fields from the PDF to create schema items.
        </div>
      )}
    </div>
    </>
  );
}