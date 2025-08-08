"use client";

import React, { useState } from "react";
import { SchemaItem, Schema, FieldGroup } from "@/types/schema";
import SchemaItemEditor from "./SchemaItemEditor";

interface SchemaEditorProps {
  schema: Schema;
  onSchemaChange: (schema: Schema) => void;
  fieldGroup?: FieldGroup;
  formType: string;
}

export default function SchemaEditor({ schema, onSchemaChange, fieldGroup, formType }: SchemaEditorProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<SchemaItem> | null>(null);

  // Generate schema item from field group
  const generateSchemaItem = (group: FieldGroup): SchemaItem => {
    const firstField = group.fields[0];
    const uniqueId = firstField.name;

    const baseItem: SchemaItem = {
      unique_id: uniqueId,
      display_attributes: {
        display_name: group.displayName || "",
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
        linked_form_fields_text: group.fields.slice(1).map(f => f.name)
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

    return baseItem;
  };

  // Add new schema item from field group
  React.useEffect(() => {
    if (fieldGroup) {
      const newSchemaItem = generateSchemaItem(fieldGroup);
      setNewItem(newSchemaItem);
      setEditingItem(newSchemaItem.unique_id);
    }
  }, [fieldGroup]);

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
      
      {newItem && editingItem === newItem.unique_id && (
        <div>
          <h3>New Schema Item</h3>
          <SchemaItemEditor
            item={newItem as SchemaItem}
            onSave={handleSaveItem}
            onCancel={() => setEditingItem(null)}
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