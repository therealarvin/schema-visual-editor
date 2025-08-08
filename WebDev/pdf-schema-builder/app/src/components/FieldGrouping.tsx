"use client";

import React, { useState } from "react";
import { PDFField, FieldGroup } from "@/types/schema";

interface FieldGroupingProps {
  selectedFields: PDFField[];
  onCreateGroup: (group: FieldGroup) => void;
  onCancel: () => void;
}

export default function FieldGrouping({ selectedFields, onCreateGroup, onCancel }: FieldGroupingProps) {
  const [groupType, setGroupType] = useState<FieldGroup["groupType"] | "">("");
  const [intent, setIntent] = useState("");

  // Determine available group types based on selected fields
  const getAvailableGroupTypes = () => {
    if (selectedFields.length === 0) return [];
    
    const fieldTypes = new Set(selectedFields.map(f => f.type));
    
    if (fieldTypes.size === 1) {
      const type = selectedFields[0].type;
      
      if (type === "text") {
        return [
          { value: "text-continuation", label: "Text Continuation (single value across multiple fields)" },
          { value: "text-same-value", label: "Same Value Linked Fields (duplicate value in each field)" }
        ];
      } else if (type === "checkbox") {
        return [{ value: "checkbox", label: "Checkbox Group" }];
      } else if (type === "radio") {
        return [{ value: "radio", label: "Radio Button Group" }];
      }
    }
    
    return [];
  };

  const availableTypes = getAvailableGroupTypes();

  const handleCreate = () => {
    if (!groupType || !intent) {
      alert("Please select a group type and describe the field's purpose");
      return;
    }

    onCreateGroup({
      fields: selectedFields,
      groupType: groupType as FieldGroup["groupType"],
      intent
    });
  };

  return (
    <div style={{
      position: "fixed",
      right: "20px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "400px",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "20px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      zIndex: 1000
    }}>
      <h3 style={{ marginTop: 0 }}>Create Field Group</h3>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          Selected Fields ({selectedFields.length}):
        </label>
        <div style={{ 
          maxHeight: "150px", 
          overflow: "auto", 
          border: "1px solid #e5e7eb", 
          borderRadius: "4px",
          padding: "8px"
        }}>
          {selectedFields.map(field => (
            <div key={field.name} style={{ 
              padding: "4px", 
              background: "#f3f4f6", 
              marginBottom: "4px",
              borderRadius: "2px",
              fontSize: "14px"
            }}>
              {field.name} ({field.type})
            </div>
          ))}
        </div>
      </div>

      {availableTypes.length > 0 ? (
        <>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Group Type:
            </label>
            <select 
              value={groupType} 
              onChange={(e) => setGroupType(e.target.value as FieldGroup["groupType"])}
              style={{ 
                width: "100%", 
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px"
              }}
            >
              <option value="">Select a type...</option>
              {availableTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Field Intent:
            </label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Describe what this field is for (e.g., 'needs to enter the contractor for the lawn here')"
              style={{ 
                width: "100%", 
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                minHeight: "60px",
                resize: "vertical"
              }}
            />
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              AI will generate appropriate display name and settings based on your description
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button 
              onClick={onCancel}
              style={{ 
                padding: "8px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                background: "white",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              style={{ 
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                background: "#2563eb",
                color: "white",
                cursor: "pointer"
              }}
            >
              Create Group
            </button>
          </div>
        </>
      ) : (
        <div style={{ color: "#6b7280", textAlign: "center", padding: "20px" }}>
          Please select fields of the same type to create a group.
        </div>
      )}
    </div>
  );
}