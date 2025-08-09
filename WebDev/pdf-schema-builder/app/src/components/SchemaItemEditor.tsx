"use client";

import React, { useState } from "react";
import { SchemaItem } from "@/types/schema";

interface SchemaItemEditorProps {
  item: SchemaItem;
  onSave: (item: SchemaItem) => void;
  onCancel: () => void;
  onStartLinking?: (linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  onSaveAndStartLinking?: (item: SchemaItem, linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => void;
  linkingMode?: { linkingPath: string; linkingType: 'checkbox' | 'date' | 'text' } | null;
  onStartVisibilityFieldSelection?: (conditionIndex: number) => void;
  visibilityFieldSelectionMode?: number | null; // Index of the condition being set
  schema?: SchemaItem[]; // For getting field info
}

export default function SchemaItemEditor({ 
  item, 
  onSave, 
  onCancel, 
  onStartLinking, 
  onSaveAndStartLinking, 
  linkingMode,
  onStartVisibilityFieldSelection,
  visibilityFieldSelectionMode,
  schema = []
}: SchemaItemEditorProps) {
  const [localItem, setLocalItem] = useState<SchemaItem>(JSON.parse(JSON.stringify(item)));

  // Helper to update nested checkbox options
  const updateCheckboxOption = (index: number, field: string, value: unknown) => {
    const newItem = { ...localItem };
    if (!newItem.display_attributes.checkbox_options) {
      newItem.display_attributes.checkbox_options = { options: [] };
    }
    if (!newItem.display_attributes.checkbox_options.options[index]) {
      newItem.display_attributes.checkbox_options.options[index] = {
        display_name: "",
        databaseStored: "",
        linkedFields: []
      };
    }
    (newItem.display_attributes.checkbox_options.options[index] as Record<string, unknown>)[field] = value;
    setLocalItem(newItem);
  };

  // Helper to add a new checkbox option
  const addCheckboxOption = () => {
    const newItem = { ...localItem };
    if (!newItem.display_attributes.checkbox_options) {
      newItem.display_attributes.checkbox_options = { options: [] };
    }
    newItem.display_attributes.checkbox_options.options.push({
      display_name: "",
      databaseStored: "",
      linkedFields: []
    });
    setLocalItem(newItem);
  };

  // Helper to remove a checkbox option
  const removeCheckboxOption = (index: number) => {
    const newItem = { ...localItem };
    if (newItem.display_attributes.checkbox_options?.options) {
      newItem.display_attributes.checkbox_options.options.splice(index, 1);
    }
    setLocalItem(newItem);
  };

  // Helper to update PDF attributes
  const updatePdfAttribute = (index: number, field: string, value: unknown) => {
    const newItem = { ...localItem };
    if (!newItem.pdf_attributes) {
      newItem.pdf_attributes = [];
    }
    if (!newItem.pdf_attributes[index]) {
      newItem.pdf_attributes[index] = { formType: "", formfield: "" };
    }
    (newItem.pdf_attributes[index] as Record<string, unknown>)[field] = value;
    setLocalItem(newItem);
  };

  // Helper to add linked text field
  const addLinkedTextField = (pdfIndex: number) => {
    const newItem = { ...localItem };
    if (!newItem.pdf_attributes?.[pdfIndex]) return;
    if (!newItem.pdf_attributes[pdfIndex].linked_form_fields_text) {
      newItem.pdf_attributes[pdfIndex].linked_form_fields_text = [];
    }
    newItem.pdf_attributes[pdfIndex].linked_form_fields_text!.push("");
    setLocalItem(newItem);
  };

  // Helper to update linked text field
  const updateLinkedTextField = (pdfIndex: number, fieldIndex: number, value: string) => {
    const newItem = { ...localItem };
    if (newItem.pdf_attributes?.[pdfIndex]?.linked_form_fields_text) {
      newItem.pdf_attributes[pdfIndex].linked_form_fields_text![fieldIndex] = value;
      setLocalItem(newItem);
    }
  };

  // Helper to remove linked text field
  const removeLinkedTextField = (pdfIndex: number, fieldIndex: number) => {
    const newItem = { ...localItem };
    if (newItem.pdf_attributes?.[pdfIndex]?.linked_form_fields_text) {
      newItem.pdf_attributes[pdfIndex].linked_form_fields_text!.splice(fieldIndex, 1);
      setLocalItem(newItem);
    }
  };

  return (
    <div style={{ 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px", 
      padding: "16px",
      marginBottom: "16px",
      background: "#f9fafb"
    }}>
      {/* Basic Fields */}
      <h4 style={{ marginBottom: "12px", fontWeight: "bold" }}>Basic Properties</h4>
      
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
          Unique ID:
        </label>
        <input
          type="text"
          value={localItem.unique_id || ""}
          onChange={(e) => setLocalItem({ ...localItem, unique_id: e.target.value })}
          style={{ 
            width: "100%", 
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px"
          }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
          Display Name (Required):
        </label>
        <input
          type="text"
          value={localItem.display_attributes.display_name || ""}
          onChange={(e) => setLocalItem({
            ...localItem,
            display_attributes: {
              ...localItem.display_attributes,
              display_name: e.target.value
            }
          })}
          style={{ 
            width: "100%", 
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px"
          }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
          Order (Required):
        </label>
        <input
          type="number"
          value={localItem.display_attributes.order}
          onChange={(e) => setLocalItem({
            ...localItem,
            display_attributes: {
              ...localItem.display_attributes,
              order: parseInt(e.target.value) || 0
            }
          })}
          style={{ 
            width: "100px", 
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px"
          }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
          Input Type:
        </label>
        <select
          value={localItem.display_attributes.input_type}
          onChange={(e) => setLocalItem({
            ...localItem,
            display_attributes: {
              ...localItem.display_attributes,
              input_type: e.target.value as SchemaItem["display_attributes"]["input_type"]
            }
          })}
          style={{ 
            width: "200px", 
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px"
          }}
        >
          <option value="text">Text</option>
          <option value="text-area">Text Area</option>
          <option value="radio">Radio</option>
          <option value="checkbox">Checkbox</option>
          <option value="signature">Signature</option>
          <option value="fileUpload">File Upload</option>
          <option value="info">Info</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
          Value Type:
        </label>
        <select
          value={localItem.display_attributes.value.type}
          onChange={(e) => setLocalItem({
            ...localItem,
            display_attributes: {
              ...localItem.display_attributes,
              value: {
                ...localItem.display_attributes.value,
                type: e.target.value as "manual" | "resolved" | "reserved"
              }
            }
          })}
          style={{ 
            width: "200px", 
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px"
          }}
        >
          <option value="manual">Manual</option>
          <option value="resolved">Resolved (from database)</option>
          <option value="reserved">Reserved (computed)</option>
        </select>
        
        {/* Output type for signatures */}
        {localItem.display_attributes.input_type === "signature" && (
          <div style={{ marginTop: "8px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
              Signature Output Type:
            </label>
            <select
              value={localItem.display_attributes.value.output || "string"}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  value: {
                    ...localItem.display_attributes.value,
                    output: e.target.value as "string" | "SignatureInput__signer" | "SignatureInput__delegator"
                  }
                }
              })}
              style={{ 
                width: "250px", 
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px"
              }}
            >
              <option value="string">String</option>
              <option value="SignatureInput__signer">Signature Input (Signer)</option>
              <option value="SignatureInput__delegator">Signature Input (Delegator)</option>
            </select>
          </div>
        )}
      </div>

      {/* Value details for resolved type */}
      {localItem.display_attributes.value.type === "resolved" && (
        <div style={{ marginBottom: "12px", paddingLeft: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Database Configuration (Supabase):
          </label>
          <textarea
            value={JSON.stringify(localItem.display_attributes.value.supabase || [], null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setLocalItem({
                  ...localItem,
                  display_attributes: {
                    ...localItem.display_attributes,
                    value: {
                      ...localItem.display_attributes.value,
                      supabase: parsed
                    }
                  }
                });
              } catch {
                // Invalid JSON, don't update
              }
            }}
            placeholder='[{"table": "users", "column": "name", "eqBy": []}]'
            style={{ 
              width: "100%", 
              minHeight: "80px",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px"
            }}
          />
        </div>
      )}
      
      {/* Width and Break Before */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Width (Grid units 1-12):
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={localItem.display_attributes.width || ""}
            onChange={(e) => setLocalItem({
              ...localItem,
              display_attributes: {
                ...localItem.display_attributes,
                width: parseInt(e.target.value) || undefined
              }
            })}
            placeholder="12"
            style={{ 
              width: "100%", 
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px"
            }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <label>
            <input
              type="checkbox"
              checked={localItem.display_attributes.breakBefore || false}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  breakBefore: e.target.checked
                }
              })}
            /> Break before this field (new line)
          </label>
        </div>
      </div>

      {/* Description field */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
          Description:
        </label>
        <textarea
          value={localItem.display_attributes.description || ""}
          onChange={(e) => setLocalItem({
            ...localItem,
            display_attributes: {
              ...localItem.display_attributes,
              description: e.target.value
            }
          })}
          placeholder="Optional description for this field"
          style={{ 
            width: "100%", 
            minHeight: "60px",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "4px"
          }}
        />
      </div>

      {/* Placeholder field for text inputs */}
      {(localItem.display_attributes.input_type === "text" || localItem.display_attributes.input_type === "text-area") && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Placeholder:
          </label>
          <input
            type="text"
            value={localItem.display_attributes.placeholder || ""}
            onChange={(e) => setLocalItem({
              ...localItem,
              display_attributes: {
                ...localItem.display_attributes,
                placeholder: e.target.value
              }
            })}
            placeholder="Placeholder text for the input field"
            style={{ 
              width: "100%", 
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px"
            }}
          />
        </div>
      )}

      {/* Value details for reserved type */}
      {localItem.display_attributes.value.type === "reserved" && (
        <div style={{ marginBottom: "12px", paddingLeft: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Reserved Field:
          </label>
          <select
            value={localItem.display_attributes.value.reserved || ""}
            onChange={(e) => setLocalItem({
              ...localItem,
              display_attributes: {
                ...localItem.display_attributes,
                value: {
                  ...localItem.display_attributes.value,
                  reserved: e.target.value as "landlord_name_csv" | "tenant_name_csv" | "realtor_name_spaced" | "property_street_address" | "buyer/tenant_name_csv" | "buyer/tenant_phone_number" | "landlord_phone_number"
                }
              }
            })}
            style={{ 
              width: "100%", 
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px"
            }}
          >
            <option value="">Select a reserved field</option>
            <option value="landlord_name_csv">Landlord Name CSV</option>
            <option value="tenant_name_csv">Tenant Name CSV</option>
            <option value="realtor_name_spaced">Realtor Name Spaced</option>
            <option value="property_street_address">Property Street Address</option>
            <option value="buyer/tenant_name_csv">Buyer/Tenant Name CSV</option>
            <option value="buyer/tenant_phone_number">Buyer/Tenant Phone Number</option>
            <option value="landlord_phone_number">Landlord Phone Number</option>
          </select>
        </div>
      )}

      {/* Block and Block Style */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Block Configuration
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
              Block Label:
            </label>
            <input
              type="text"
              value={localItem.display_attributes.block || ""}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  block: e.target.value
                }
              })}
              placeholder="Optional grouping label"
              style={{ 
                width: "100%", 
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px"
              }}
            />
          </div>
          
          {localItem.display_attributes.block && (
            <>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Block Title:
                </label>
                <input
                  type="text"
                  value={localItem.display_attributes.block_style?.title || ""}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      block_style: {
                        ...localItem.display_attributes.block_style,
                        title: e.target.value
                      }
                    }
                  })}
                  placeholder="Block title"
                  style={{ 
                    width: "100%", 
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Block Description:
                </label>
                <input
                  type="text"
                  value={localItem.display_attributes.block_style?.description || ""}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      block_style: {
                        ...localItem.display_attributes.block_style,
                        description: e.target.value
                      }
                    }
                  })}
                  placeholder="Block description"
                  style={{ 
                    width: "100%", 
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Block Icon:
                </label>
                <input
                  type="text"
                  value={localItem.display_attributes.block_style?.icon || ""}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      block_style: {
                        ...localItem.display_attributes.block_style,
                        icon: e.target.value
                      }
                    }
                  })}
                  placeholder="Icon name or emoji"
                  style={{ 
                    width: "100%", 
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Color Theme:
                </label>
                <select
                  value={localItem.display_attributes.block_style?.color_theme || ""}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      block_style: {
                        ...localItem.display_attributes.block_style,
                        color_theme: e.target.value as "blue" | "green" | "purple" | "orange" | "gray"
                      }
                    }
                  })}
                  style={{ 
                    width: "150px", 
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                >
                  <option value="">Select theme</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
            </>
          )}
        </div>
      </details>

      {/* Attribute Configuration */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Attribute Configuration
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
              Attribute Key:
            </label>
            <input
              type="text"
              value={localItem.display_attributes.attribute?.key || ""}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  attribute: {
                    ...localItem.display_attributes.attribute,
                    key: e.target.value,
                    operation: localItem.display_attributes.attribute?.operation || ((value) => value),
                    reverseOperation: localItem.display_attributes.attribute?.reverseOperation
                  }
                }
              })}
              placeholder="e.g., address, phone, email"
              style={{ 
                width: "100%", 
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px"
              }}
            />
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Semantic tag for this field (used for smart field mapping)
          </div>
        </div>
      </details>

      {/* Checkbox Options */}
      {localItem.display_attributes.input_type === "checkbox" && (
        <details style={{ marginBottom: "12px" }} open>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            Checkbox Options
          </summary>
          <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
            {/* Min/Max Selected */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Min Selected:
                </label>
                <input
                  type="number"
                  min="0"
                  value={localItem.display_attributes.checkbox_options?.minSelected || ""}
                  onChange={(e) => {
                    const newItem = { ...localItem };
                    if (!newItem.display_attributes.checkbox_options) {
                      newItem.display_attributes.checkbox_options = { options: [] };
                    }
                    newItem.display_attributes.checkbox_options.minSelected = parseInt(e.target.value) || undefined;
                    setLocalItem(newItem);
                  }}
                  style={{ 
                    width: "80px", 
                    padding: "4px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Max Selected:
                </label>
                <input
                  type="number"
                  min="1"
                  value={localItem.display_attributes.checkbox_options?.maxSelected || ""}
                  onChange={(e) => {
                    const newItem = { ...localItem };
                    if (!newItem.display_attributes.checkbox_options) {
                      newItem.display_attributes.checkbox_options = { options: [] };
                    }
                    newItem.display_attributes.checkbox_options.maxSelected = parseInt(e.target.value) || undefined;
                    setLocalItem(newItem);
                  }}
                  style={{ 
                    width: "80px", 
                    padding: "4px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
            </div>
            {localItem.display_attributes.checkbox_options?.options.map((option, index) => (
              <div key={index} style={{ 
                border: "1px solid #d1d5db", 
                borderRadius: "4px", 
                padding: "8px", 
                marginBottom: "8px" 
              }}>
                <div style={{ marginBottom: "4px" }}>
                  <input
                    type="text"
                    value={option.display_name}
                    onChange={(e) => updateCheckboxOption(index, "display_name", e.target.value)}
                    placeholder="Display Name"
                    style={{ 
                      width: "45%", 
                      marginRight: "10px",
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                  <input
                    type="text"
                    value={option.databaseStored}
                    onChange={(e) => updateCheckboxOption(index, "databaseStored", e.target.value)}
                    placeholder="Database Value"
                    style={{ 
                      width: "45%", 
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                  <button
                    onClick={() => removeCheckboxOption(index)}
                    style={{ 
                      marginLeft: "8px",
                      padding: "4px 8px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Remove
                  </button>
                </div>
                
                {/* Linked Fields Management */}
                <div style={{ marginTop: "8px" }}>
                  <label style={{ fontSize: "14px", fontWeight: "bold" }}>Linked Fields:</label>
                  {option.linkedFields && option.linkedFields.length > 0 ? (
                    <div style={{ marginTop: "4px" }}>
                      {option.linkedFields.map((linkedId, linkIndex) => (
                        <div key={linkIndex} style={{ 
                          display: "inline-block", 
                          marginRight: "8px",
                          marginTop: "4px",
                          padding: "2px 8px",
                          background: "#e5e7eb",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}>
                          {linkedId}
                          <button
                            onClick={() => {
                              const newItem = { ...localItem };
                              if (newItem.display_attributes.checkbox_options?.options[index]?.linkedFields) {
                                newItem.display_attributes.checkbox_options.options[index].linkedFields = 
                                  newItem.display_attributes.checkbox_options.options[index].linkedFields!.filter(
                                    (id) => id !== linkedId
                                  );
                                setLocalItem(newItem);
                              }
                            }}
                            style={{ 
                              marginLeft: "4px",
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontWeight: "bold"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                      No linked fields
                    </div>
                  )}
                  
                  {(onStartLinking || onSaveAndStartLinking) && (
                    <button
                      onClick={() => {
                        if (onSaveAndStartLinking) {
                          onSaveAndStartLinking(localItem, `${localItem.unique_id}.${index}`, 'checkbox');
                        } else if (onStartLinking) {
                          onSave(localItem); // Fallback to old behavior
                          onStartLinking(`${localItem.unique_id}.${index}`, 'checkbox');
                        }
                      }}
                      disabled={linkingMode?.linkingPath === `${localItem.unique_id}.${index}` && linkingMode?.linkingType === 'checkbox'}
                      style={{ 
                        marginTop: "8px",
                        padding: "4px 8px",
                        background: (linkingMode?.linkingPath === `${localItem.unique_id}.${index}` && linkingMode?.linkingType === 'checkbox')
                          ? "#fbbf24" 
                          : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (linkingMode?.linkingPath === `${localItem.unique_id}.${index}` && linkingMode?.linkingType === 'checkbox')
                          ? "not-allowed" 
                          : "pointer",
                        fontSize: "12px"
                      }}
                    >
                      {(linkingMode?.linkingPath === `${localItem.unique_id}.${index}` && linkingMode?.linkingType === 'checkbox')
                        ? "🔗 Linking Active - Click a grouped field in PDF" 
                        : "Add Linked Field"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addCheckboxOption}
              style={{ 
                padding: "4px 8px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Add Option
            </button>
          </div>
        </details>
      )}

      {/* Radio Options */}
      {localItem.display_attributes.input_type === "radio" && (
        <details style={{ marginBottom: "12px" }} open>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            Radio Options
          </summary>
          <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
            <textarea
              value={localItem.display_attributes.display_radio_options?.join("\n") || ""}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  display_radio_options: e.target.value.split("\n").filter(s => s.trim())
                }
              })}
              placeholder="Enter radio options (one per line)"
              style={{ 
                width: "100%", 
                minHeight: "80px",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px"
              }}
            />
          </div>
        </details>
      )}

      {/* PDF Attributes */}
      <details style={{ marginBottom: "12px" }} open>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          PDF Attributes
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          {localItem.pdf_attributes?.map((pdfAttr, pdfIndex) => (
            <div key={pdfIndex} style={{ 
              border: "1px solid #d1d5db", 
              borderRadius: "4px", 
              padding: "8px", 
              marginBottom: "8px" 
            }}>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontWeight: "bold" }}>Form Type:</label>
                <input
                  type="text"
                  value={pdfAttr.formType || ""}
                  onChange={(e) => updatePdfAttribute(pdfIndex, "formType", e.target.value)}
                  style={{ 
                    marginLeft: "8px",
                    padding: "4px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontWeight: "bold" }}>Form Field:</label>
                {Array.isArray(pdfAttr.formfield) ? (
                  <textarea
                    value={pdfAttr.formfield.join("\n")}
                    onChange={(e) => updatePdfAttribute(pdfIndex, "formfield", e.target.value.split("\n").filter(s => s.trim()))}
                    placeholder="Enter form fields (one per line)"
                    style={{ 
                      width: "100%",
                      minHeight: "60px",
                      marginTop: "4px",
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={pdfAttr.formfield || ""}
                    onChange={(e) => updatePdfAttribute(pdfIndex, "formfield", e.target.value)}
                    style={{ 
                      marginLeft: "8px",
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                )}
              </div>

              {/* Linked Text Fields - Continuation */}
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontWeight: "bold" }}>Text Continuation Fields:</label>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                  For multi-box text fields (left-to-right continuation)
                </div>
                {pdfAttr.linked_form_fields_text && pdfAttr.linked_form_fields_text.length > 0 ? (
                  <>
                    {pdfAttr.linked_form_fields_text.map((field, fieldIndex) => (
                      <div key={fieldIndex} style={{ marginTop: "4px" }}>
                        <input
                          type="text"
                          value={field}
                          onChange={(e) => updateLinkedTextField(pdfIndex, fieldIndex, e.target.value)}
                          style={{ 
                            width: "70%",
                            padding: "4px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                          }}
                        />
                        <button
                          onClick={() => removeLinkedTextField(pdfIndex, fieldIndex)}
                          style={{ 
                            marginLeft: "8px",
                            padding: "4px 8px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    No continuation fields. The primary field ({pdfAttr.formfield}) will be included automatically.
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => {
                      const newItem = { ...localItem };
                      if (!newItem.pdf_attributes?.[pdfIndex]) return;
                      if (!newItem.pdf_attributes[pdfIndex].linked_form_fields_text) {
                        // Initialize with the primary field if not already there
                        const primaryField = typeof pdfAttr.formfield === 'string' ? pdfAttr.formfield : '';
                        newItem.pdf_attributes[pdfIndex].linked_form_fields_text = primaryField ? [primaryField] : [];
                      }
                      newItem.pdf_attributes[pdfIndex].linked_form_fields_text!.push("");
                      setLocalItem(newItem);
                    }}
                    style={{ 
                      padding: "4px 8px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Add Continuation Field (Manual)
                  </button>
                  {(onStartLinking || onSaveAndStartLinking) && (
                    <button
                      onClick={() => {
                        // Initialize array with primary field if needed
                        const newItem = { ...localItem };
                        if (!newItem.pdf_attributes?.[pdfIndex]) return;
                        if (!newItem.pdf_attributes[pdfIndex].linked_form_fields_text) {
                          const primaryField = typeof pdfAttr.formfield === 'string' ? pdfAttr.formfield : '';
                          newItem.pdf_attributes[pdfIndex].linked_form_fields_text = primaryField ? [primaryField] : [];
                        }
                        
                        if (onSaveAndStartLinking) {
                          onSaveAndStartLinking(newItem, `${localItem.unique_id}.pdf.${pdfIndex}.text`, 'text');
                        } else if (onStartLinking) {
                          onSave(newItem); // Fallback to old behavior
                          onStartLinking(`${localItem.unique_id}.pdf.${pdfIndex}.text`, 'text');
                        }
                      }}
                      disabled={linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.text` && linkingMode?.linkingType === 'text'}
                      style={{ 
                        padding: "4px 8px",
                        background: (linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.text` && linkingMode?.linkingType === 'text')
                          ? "#fbbf24" 
                          : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.text` && linkingMode?.linkingType === 'text')
                          ? "not-allowed" 
                          : "pointer"
                      }}
                    >
                      {(linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.text` && linkingMode?.linkingType === 'text')
                        ? "🔗 Linking Active - Click any field in PDF" 
                        : "Add by Clicking PDF"}
                    </button>
                  )}
                </div>
              </div>

              {/* Linked Checkbox Fields */}
              {pdfAttr.linked_form_fields_checkbox && (
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontWeight: "bold" }}>Linked Checkbox Fields:</label>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    (Edit these in the checkbox options above)
                  </div>
                </div>
              )}

              {/* Linked Radio Fields */}
              {pdfAttr.linked_form_fields_radio && (
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontWeight: "bold" }}>Linked Radio Fields:</label>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    (Edit these in the radio options above)
                  </div>
                </div>
              )}
              
              {/* Linked Dates */}
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontWeight: "bold" }}>Linked Date Fields:</label>
                {pdfAttr.linked_dates?.map((dateField, dateIndex) => (
                  <div key={dateIndex} style={{ marginTop: "4px" }}>
                    <input
                      type="text"
                      value={dateField.dateFieldName}
                      onChange={(e) => {
                        const newItem = { ...localItem };
                        if (newItem.pdf_attributes?.[pdfIndex]?.linked_dates) {
                          newItem.pdf_attributes[pdfIndex].linked_dates![dateIndex] = {
                            dateFieldName: e.target.value
                          };
                          setLocalItem(newItem);
                        }
                      }}
                      placeholder="Date field name"
                      style={{ 
                        width: "70%",
                        padding: "4px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px"
                      }}
                    />
                    <button
                      onClick={() => {
                        const newItem = { ...localItem };
                        if (newItem.pdf_attributes?.[pdfIndex]?.linked_dates) {
                          newItem.pdf_attributes[pdfIndex].linked_dates!.splice(dateIndex, 1);
                          setLocalItem(newItem);
                        }
                      }}
                      style={{ 
                        marginLeft: "8px",
                        padding: "4px 8px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => {
                      const newItem = { ...localItem };
                      if (!newItem.pdf_attributes?.[pdfIndex]) return;
                      if (!newItem.pdf_attributes[pdfIndex].linked_dates) {
                        newItem.pdf_attributes[pdfIndex].linked_dates = [];
                      }
                      newItem.pdf_attributes[pdfIndex].linked_dates!.push({
                        dateFieldName: ""
                      });
                      setLocalItem(newItem);
                    }}
                    style={{ 
                      padding: "4px 8px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Add Linked Date (Manual)
                  </button>
                  {(onStartLinking || onSaveAndStartLinking) && (
                    <button
                      onClick={() => {
                        if (onSaveAndStartLinking) {
                          onSaveAndStartLinking(localItem, `${localItem.unique_id}.pdf.${pdfIndex}.date`, 'date');
                        } else if (onStartLinking) {
                          onSave(localItem); // Fallback to old behavior
                          onStartLinking(`${localItem.unique_id}.pdf.${pdfIndex}.date`, 'date');
                        }
                      }}
                      disabled={linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.date` && linkingMode?.linkingType === 'date'}
                      style={{ 
                        padding: "4px 8px",
                        background: (linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.date` && linkingMode?.linkingType === 'date')
                          ? "#fbbf24" 
                          : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.date` && linkingMode?.linkingType === 'date')
                          ? "not-allowed" 
                          : "pointer"
                      }}
                    >
                      {(linkingMode?.linkingPath === `${localItem.unique_id}.pdf.${pdfIndex}.date` && linkingMode?.linkingType === 'date')
                        ? "🔗 Linking Active - Click a grouped field in PDF" 
                        : "Add by Clicking PDF"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {(!localItem.pdf_attributes || localItem.pdf_attributes.length === 0) && (
            <button
              onClick={() => {
                const newItem = { ...localItem };
                if (!newItem.pdf_attributes) newItem.pdf_attributes = [];
                newItem.pdf_attributes.push({ formType: "", formfield: "" });
                setLocalItem(newItem);
              }}
              style={{ 
                padding: "4px 8px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Add PDF Attribute
            </button>
          )}
        </div>
      </details>

      {/* Conditional Visibility (visibleIf) */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Conditional Visibility
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            Show this field only when conditions are met
          </div>
          
          {/* Display existing conditions */}
          {localItem.display_attributes.visibleIf?.map((condition, index) => {
            const targetField = schema.find(s => s.unique_id === condition.unique_id);
            const isCheckboxField = targetField?.display_attributes.input_type === 'checkbox';
            
            return (
              <div key={index} style={{ 
                marginBottom: "12px", 
                padding: "12px", 
                border: "1px solid #d1d5db", 
                borderRadius: "6px",
                background: "#f9fafb"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <strong>Field:</strong>
                  {visibilityFieldSelectionMode === index ? (
                    <span style={{ color: "#f59e0b" }}>
                      🎯 Click on a field in the PDF to select...
                    </span>
                  ) : (
                    <span>{targetField?.display_attributes.display_name || condition.unique_id}</span>
                  )}
                  {!visibilityFieldSelectionMode && (
                    <button
                      onClick={() => {
                        if (onSaveAndStartLinking) {
                          onSaveAndStartLinking(localItem, `visibility.${index}`, 'text');
                        }
                        if (onStartVisibilityFieldSelection) {
                          onStartVisibilityFieldSelection(index);
                        }
                      }}
                      style={{
                        padding: "2px 8px",
                        fontSize: "12px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Change Field
                    </button>
                  )}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <strong>Operation:</strong>
                  <select
                    value={condition.operation}
                    onChange={(e) => {
                      const newConditions = [...(localItem.display_attributes.visibleIf || [])];
                      newConditions[index] = {
                        ...newConditions[index],
                        operation: e.target.value as any
                      };
                      setLocalItem({
                        ...localItem,
                        display_attributes: {
                          ...localItem.display_attributes,
                          visibleIf: newConditions
                        }
                      });
                    }}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  >
                    <option value="==">Equals (==)</option>
                    <option value="!==">Not Equals (!==)</option>
                    <option value=">">Greater Than (&gt;)</option>
                    <option value=">=">Greater Than or Equal (&gt;=)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="<=">Less Than or Equal (&lt;=)</option>
                    {isCheckboxField && (
                      <>
                        <option value="contains">Contains</option>
                        <option value="doesNotContain">Does Not Contain</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <strong>Value:</strong>
                  {(condition.operation === 'contains' || condition.operation === 'doesNotContain') && isCheckboxField ? (
                    <select
                      value={condition.valueChecked}
                      onChange={(e) => {
                        const newConditions = [...(localItem.display_attributes.visibleIf || [])];
                        newConditions[index] = {
                          ...newConditions[index],
                          valueChecked: e.target.value
                        };
                        setLocalItem({
                          ...localItem,
                          display_attributes: {
                            ...localItem.display_attributes,
                            visibleIf: newConditions
                          }
                        });
                      }}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        flex: 1
                      }}
                    >
                      <option value="">Select a checkbox option...</option>
                      {targetField?.display_attributes.checkbox_options?.options.map(opt => (
                        <option key={opt.databaseStored} value={opt.databaseStored}>
                          {opt.display_name} ({opt.databaseStored})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={['>', '>=', '<', '<='].includes(condition.operation) ? "number" : "text"}
                      value={condition.valueChecked}
                      onChange={(e) => {
                        const newConditions = [...(localItem.display_attributes.visibleIf || [])];
                        newConditions[index] = {
                          ...newConditions[index],
                          valueChecked: e.target.value
                        };
                        setLocalItem({
                          ...localItem,
                          display_attributes: {
                            ...localItem.display_attributes,
                            visibleIf: newConditions
                          }
                        });
                      }}
                      placeholder={['>', '>=', '<', '<='].includes(condition.operation) ? "Enter a number..." : "Enter a value..."}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        flex: 1
                      }}
                    />
                  )}
                </div>
                
                <button
                  onClick={() => {
                    const newConditions = [...(localItem.display_attributes.visibleIf || [])];
                    newConditions.splice(index, 1);
                    setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        visibleIf: newConditions.length > 0 ? newConditions : undefined
                      }
                    });
                  }}
                  style={{
                    padding: "4px 12px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Remove Condition
                </button>
              </div>
            );
          })}
          
          {/* Add new condition button */}
          <button
            onClick={() => {
              const newConditions = [...(localItem.display_attributes.visibleIf || [])];
              const newIndex = newConditions.length;
              newConditions.push({
                unique_id: "",
                operation: "==",
                valueChecked: ""
              });
              setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  visibleIf: newConditions
                }
              });
              
              // Start field selection for the new condition
              if (onSaveAndStartLinking) {
                onSaveAndStartLinking(localItem, `visibility.${newIndex}`, 'text');
              }
              if (onStartVisibilityFieldSelection) {
                onStartVisibilityFieldSelection(newIndex);
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            + Add Visibility Condition
          </button>
        </div>
      </details>

      {/* Validation Rules */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Validation Rules
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
              Loopback Validation (Regex):
            </label>
            <textarea
              value={JSON.stringify(localItem.display_attributes.validation?.loopback || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      validation: {
                        ...localItem.display_attributes.validation,
                        loopback: parsed
                      }
                    }
                  });
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='[{"regex": "^[0-9]+$", "message": "Must be a number"}]'
              style={{ 
                width: "100%", 
                minHeight: "60px",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
              Cross-Field Validation:
            </label>
            <textarea
              value={JSON.stringify(localItem.display_attributes.validation?.crossField || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      validation: {
                        ...localItem.display_attributes.validation,
                        crossField: parsed
                      }
                    }
                  });
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='[{"rule": ">", "unique_id": "other_field", "message": "Must be greater than other field"}]'
              style={{ 
                width: "100%", 
                minHeight: "60px",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "12px"
              }}
            />
          </div>
        </div>
      </details>

      {/* Special Input Configuration */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Special Input Configuration
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          
          {/* Text special input options */}
          {localItem.display_attributes.input_type === "text" && (
            <div style={{ marginBottom: "12px" }}>
              <h5 style={{ fontWeight: "bold", marginBottom: "8px" }}>Text Field Type:</h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.percentage || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            percentage: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Percentage
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.phone || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            phone: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Phone Number
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.date || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            date: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Date (January 1, 2025)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.numbered_date || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            numbered_date: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Numbered Date (01/01/2025)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.month_year || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            month_year: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Month/Year
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.currency || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            currency: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Currency
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.number || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            number: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Number Only
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.email || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            email: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Email
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.text?.url || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          text: {
                            ...localItem.display_attributes.special_input?.text,
                            url: e.target.checked
                          }
                        }
                      }
                    })}
                  /> URL
                </label>
              </div>
            </div>
          )}

          {/* Checkbox special input options */}
          {localItem.display_attributes.input_type === "checkbox" && (
            <div style={{ marginBottom: "12px" }}>
              <h5 style={{ fontWeight: "bold", marginBottom: "8px" }}>Checkbox Options:</h5>
              <label>
                <input
                  type="checkbox"
                  checked={localItem.display_attributes.special_input?.checkbox?.asRadio || false}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      special_input: {
                        ...localItem.display_attributes.special_input,
                        checkbox: {
                          ...localItem.display_attributes.special_input?.checkbox,
                          asRadio: e.target.checked
                        }
                      }
                    }
                  })}
                /> Display as Radio (single selection)
              </label>
              <div style={{ marginTop: "8px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Horizontal columns:</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={localItem.display_attributes.special_input?.checkbox?.horizontal || ""}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      special_input: {
                        ...localItem.display_attributes.special_input,
                        checkbox: {
                          ...localItem.display_attributes.special_input?.checkbox,
                          horizontal: parseInt(e.target.value) || undefined
                        }
                      }
                    }
                  })}
                  placeholder="Number of columns"
                  style={{ 
                    width: "100px", 
                    padding: "4px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
            </div>
          )}

          {/* Text area special input options */}
          {localItem.display_attributes.input_type === "text-area" && (
            <div style={{ marginBottom: "12px" }}>
              <h5 style={{ fontWeight: "bold", marginBottom: "8px" }}>Text Area Options:</h5>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Min Rows:</label>
                  <input
                    type="number"
                    min="1"
                    value={localItem.display_attributes.special_input?.textArea?.minRows || ""}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          textArea: {
                            ...localItem.display_attributes.special_input?.textArea,
                            minRows: parseInt(e.target.value) || undefined
                          }
                        }
                      }
                    })}
                    style={{ 
                      width: "80px", 
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Max Rows:</label>
                  <input
                    type="number"
                    min="1"
                    value={localItem.display_attributes.special_input?.textArea?.maxRows || ""}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          textArea: {
                            ...localItem.display_attributes.special_input?.textArea,
                            maxRows: parseInt(e.target.value) || undefined
                          }
                        }
                      }
                    })}
                    style={{ 
                      width: "80px", 
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>
              <label style={{ marginTop: "8px", display: "block" }}>
                <input
                  type="checkbox"
                  checked={localItem.display_attributes.special_input?.textArea?.autoResize || false}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      special_input: {
                        ...localItem.display_attributes.special_input,
                        textArea: {
                          ...localItem.display_attributes.special_input?.textArea,
                          autoResize: e.target.checked
                        }
                      }
                    }
                  })}
                /> Auto-resize based on content
              </label>
            </div>
          )}

          {/* File upload special input options */}
          {localItem.display_attributes.input_type === "fileUpload" && (
            <div style={{ marginBottom: "12px" }}>
              <h5 style={{ fontWeight: "bold", marginBottom: "8px" }}>File Upload Options:</h5>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Accept file types:</label>
                <input
                  type="text"
                  value={localItem.display_attributes.special_input?.fileUpload?.accept || ""}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      special_input: {
                        ...localItem.display_attributes.special_input,
                        fileUpload: {
                          ...localItem.display_attributes.special_input?.fileUpload,
                          accept: e.target.value
                        }
                      }
                    }
                  })}
                  placeholder="e.g., .pdf,.doc,.docx"
                  style={{ 
                    width: "100%", 
                    padding: "4px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Max size (MB):</label>
                  <input
                    type="number"
                    min="1"
                    value={localItem.display_attributes.special_input?.fileUpload?.maxSize || ""}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          fileUpload: {
                            ...localItem.display_attributes.special_input?.fileUpload,
                            maxSize: parseInt(e.target.value) || undefined
                          }
                        }
                      }
                    })}
                    style={{ 
                      width: "80px", 
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px" }}>Max files:</label>
                  <input
                    type="number"
                    min="1"
                    value={localItem.display_attributes.special_input?.fileUpload?.maxFiles || ""}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          fileUpload: {
                            ...localItem.display_attributes.special_input?.fileUpload,
                            maxFiles: parseInt(e.target.value) || undefined
                          }
                        }
                      }
                    })}
                    style={{ 
                      width: "80px", 
                      padding: "4px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={localItem.display_attributes.special_input?.fileUpload?.multiple || false}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      special_input: {
                        ...localItem.display_attributes.special_input,
                        fileUpload: {
                          ...localItem.display_attributes.special_input?.fileUpload,
                          multiple: e.target.checked
                        }
                      }
                    }
                  })}
                /> Allow multiple files
              </label>
            </div>
          )}

          {/* Info Field Properties */}
          {localItem.display_attributes.input_type === "info" && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
              <h4 style={{ marginBottom: "8px" }}>Info Field Settings</h4>
              
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
                  Info Style:
                </label>
                <select
                  value={localItem.display_attributes.special_input?.info?.style || "default"}
                  onChange={(e) => setLocalItem({
                    ...localItem,
                    display_attributes: {
                      ...localItem.display_attributes,
                      special_input: {
                        ...localItem.display_attributes.special_input,
                        info: {
                          ...localItem.display_attributes.special_input?.info,
                          style: e.target.value as "default" | "subtle" | "minimal" | "inline" | "compact" | "warning" | "success" | "error" | "tip"
                        }
                      }
                    }
                  })}
                  style={{ 
                    width: "200px", 
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                >
                  <option value="default">Default</option>
                  <option value="subtle">Subtle</option>
                  <option value="minimal">Minimal</option>
                  <option value="inline">Inline</option>
                  <option value="compact">Compact</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="tip">Tip</option>
                </select>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.info?.icon !== false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          info: {
                            ...localItem.display_attributes.special_input?.info,
                            icon: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Show Icon
                </label>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={localItem.display_attributes.special_input?.info?.minimizable || false}
                    onChange={(e) => setLocalItem({
                      ...localItem,
                      display_attributes: {
                        ...localItem.display_attributes,
                        special_input: {
                          ...localItem.display_attributes.special_input,
                          info: {
                            ...localItem.display_attributes.special_input?.info,
                            minimizable: e.target.checked
                          }
                        }
                      }
                    })}
                  /> Allow Minimize/Collapse
                </label>
              </div>
            </div>
          )}

        </div>
      </details>

      {/* Additional Properties */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Additional Properties
        </summary>
        <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
          <label>
            <input
              type="checkbox"
              checked={localItem.display_attributes.isRequired || false}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  isRequired: e.target.checked
                }
              })}
            /> Required
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={localItem.display_attributes.isHidden || false}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  isHidden: e.target.checked
                }
              })}
            /> Hidden
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={localItem.display_attributes.isCached || false}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  isCached: e.target.checked
                }
              })}
            /> Cached
          </label>
        </div>
      </details>

      {/* Raw JSON Editor */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Raw JSON Editor
        </summary>
        <div style={{ marginTop: "8px" }}>
          <textarea
            value={JSON.stringify(localItem, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setLocalItem(parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            style={{ 
              width: "100%", 
              minHeight: "200px",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px"
            }}
          />
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Warning: Invalid JSON will be ignored
          </div>
        </div>
      </details>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
        <button
          onClick={onCancel}
          style={{ 
            padding: "6px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(localItem)}
          disabled={!localItem.display_attributes.display_name || !localItem.display_attributes.order}
          style={{ 
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            opacity: (!localItem.display_attributes.display_name || !localItem.display_attributes.order) ? 0.5 : 1
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}