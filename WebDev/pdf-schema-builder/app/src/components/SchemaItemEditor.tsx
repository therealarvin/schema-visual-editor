"use client";

import React, { useState } from "react";
import { SchemaItem } from "@/types/schema";

interface SchemaItemEditorProps {
  item: SchemaItem;
  onSave: (item: SchemaItem) => void;
  onCancel: () => void;
}

export default function SchemaItemEditor({ item, onSave, onCancel }: SchemaItemEditorProps) {
  const [localItem, setLocalItem] = useState<SchemaItem>(JSON.parse(JSON.stringify(item)));

  // Helper to update nested checkbox options
  const updateCheckboxOption = (index: number, field: string, value: any) => {
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
    (newItem.display_attributes.checkbox_options.options[index] as any)[field] = value;
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
  const updatePdfAttribute = (index: number, field: string, value: any) => {
    const newItem = { ...localItem };
    if (!newItem.pdf_attributes) {
      newItem.pdf_attributes = [];
    }
    if (!newItem.pdf_attributes[index]) {
      newItem.pdf_attributes[index] = { formType: "", formfield: "" };
    }
    (newItem.pdf_attributes[index] as any)[field] = value;
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
      background: "#f9fafb",
      maxHeight: "70vh",
      overflowY: "auto"
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
      </div>

      {/* Value details for resolved type */}
      {localItem.display_attributes.value.type === "resolved" && (
        <div style={{ marginBottom: "12px", paddingLeft: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}>
            Database Field:
          </label>
          <input
            type="text"
            value={localItem.display_attributes.value.databaseField || ""}
            onChange={(e) => setLocalItem({
              ...localItem,
              display_attributes: {
                ...localItem.display_attributes,
                value: {
                  ...localItem.display_attributes.value,
                  databaseField: e.target.value
                }
              }
            })}
            placeholder="e.g., user.name"
            style={{ 
              width: "100%", 
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px"
            }}
          />
        </div>
      )}

      {/* Checkbox Options */}
      {localItem.display_attributes.input_type === "checkbox" && (
        <details style={{ marginBottom: "12px" }} open>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
            Checkbox Options
          </summary>
          <div style={{ marginTop: "8px", paddingLeft: "16px" }}>
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

              {/* Linked Text Fields */}
              {pdfAttr.linked_form_fields_text && (
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontWeight: "bold" }}>Linked Text Fields:</label>
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
                  <button
                    onClick={() => addLinkedTextField(pdfIndex)}
                    style={{ 
                      marginTop: "4px",
                      padding: "4px 8px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Add Linked Field
                  </button>
                </div>
              )}

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
          <br />
          <label>
            <input
              type="checkbox"
              checked={localItem.display_attributes.isOnlyDisplayText || false}
              onChange={(e) => setLocalItem({
                ...localItem,
                display_attributes: {
                  ...localItem.display_attributes,
                  isOnlyDisplayText: e.target.checked
                }
              })}
            /> Only Display Text
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
              } catch (err) {
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