"use client";

import React, { useState } from "react";
import { SchemaItem, Schema, FieldGroup } from "@/types/schema";
import SchemaItemEditor from "./SchemaItemEditor";
import { generateFieldAttributes, organizeSchema } from "@/lib/aiService";
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
  linkingMode
}: {
  item: SchemaItem;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (item: SchemaItem) => void;
  onCancel: () => void;
  onStartLinking?: (linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  linkingMode?: { linkingPath: string; linkingType: 'checkbox' | 'date' | 'text' } | null;
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
          onStartLinking={onStartLinking}
          linkingMode={linkingMode}
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

export default function SchemaEditor({ schema, onSchemaChange, fieldGroup, formType, onStartLinking, linkingMode }: SchemaEditorProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<SchemaItem> | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        (async () => {
          const newSchemaItem = await generateSchemaItem(fieldGroup);
          setNewItem(newSchemaItem);
          setEditingItem(newSchemaItem.unique_id);
        })();
      }
    }
  }, [fieldGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveItem = (item: SchemaItem) => {
    if (newItem && item.unique_id === newItem.unique_id) {
      // Adding new item
      onSchemaChange([...schema, item]);
      setNewItem(null);
    } else {
      // Updating existing item
      onSchemaChange(schema.map(s => s.unique_id === item.unique_id ? item : s));
    }
    setEditingItem(null);
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
        alert(`Failed to organize schema: ${result.error}`);
      } else {
        onSchemaChange(result.schema);
        
        // Show summary of blocks created
        if (result.blocks && result.blocks.length > 0) {
          const blockSummary = result.blocks
            .map(b => `${b.title}: ${b.item_count} items`)
            .join('\n');
          alert(`Schema organized into ${result.blocks.length} blocks:\n\n${blockSummary}`);
        }
      }
    } catch (error) {
      console.error('Error organizing schema:', error);
      alert('Failed to organize schema. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
  };

  const activeItem = activeId ? schema.find(item => item.unique_id === activeId) : null;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "20px" }}>
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
              }}
              onStartLinking={onStartLinking}
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
                )}
                <SortableSchemaItem
                  item={item}
                  isEditing={editingItem === item.unique_id}
                  onEdit={() => setEditingItem(item.unique_id)}
                  onDelete={() => handleDeleteItem(item.unique_id)}
                  onSave={handleSaveItem}
                  onCancel={() => setEditingItem(null)}
                  onStartLinking={onStartLinking}
                  linkingMode={linkingMode}
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
  );
}