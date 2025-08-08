"use client";

import React, { useState } from "react";
import { SchemaItem, Schema, FieldGroup } from "@/types/schema";
import SchemaItemEditor from "./SchemaItemEditor";
import { generateFieldAttributes } from "@/lib/aiService";

interface SchemaEditorProps {
  schema: Schema;
  onSchemaChange: (schema: Schema) => void;
  fieldGroup?: FieldGroup;
  formType: string;
  onStartLinking?: (linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  linkingMode?: { linkingPath: string; linkingType: 'checkbox' | 'date' | 'text' } | null;
}

export default function SchemaEditor({ schema, onSchemaChange, fieldGroup, formType, onStartLinking, linkingMode }: SchemaEditorProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<SchemaItem> | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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
        
        // No longer capturing screenshots - using intent-based generation only
        
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
    if (fieldGroup) {
      (async () => {
        const newSchemaItem = await generateSchemaItem(fieldGroup);
        setNewItem(newSchemaItem);
        setEditingItem(newSchemaItem.unique_id);
      })();
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
    onSchemaChange(schema.filter(s => s.unique_id !== uniqueId));
  };

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "20px" }}>
      <h2>Schema Editor</h2>
      
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
        <div>
          <h3>New Schema Item</h3>
          <SchemaItemEditor
            item={newItem as SchemaItem}
            onSave={handleSaveItem}
            onCancel={() => setEditingItem(null)}
            onStartLinking={onStartLinking}
            linkingMode={linkingMode}
          />
        </div>
      )}

      {schema.map((item) => (
        <div key={item.unique_id} style={{ 
          border: "1px solid #d1d5db", 
          borderRadius: "8px", 
          padding: "12px",
          marginBottom: "12px"
        }}>
          {editingItem === item.unique_id ? (
            <SchemaItemEditor
              item={item}
              onSave={handleSaveItem}
              onCancel={() => setEditingItem(null)}
              onStartLinking={onStartLinking}
              linkingMode={linkingMode}
            />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{item.display_attributes.display_name || item.unique_id}</strong>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    Type: {item.display_attributes.input_type} | Order: {item.display_attributes.order}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setEditingItem(item.unique_id)}
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
                    onClick={() => handleDeleteItem(item.unique_id)}
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
            </>
          )}
        </div>
      ))}

      {schema.length === 0 && !newItem && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px",
          color: "#6b7280"
        }}>
          Select fields from the PDF to create schema items.
        </div>
      )}
    </div>
  );
}