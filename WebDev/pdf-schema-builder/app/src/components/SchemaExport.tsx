"use client";

import React from "react";
import { Schema } from "@/types/schema";

interface SchemaExportProps {
  schema: Schema;
  formType: string;
}

export default function SchemaExport({ schema, formType }: SchemaExportProps) {
  const generateTypeScript = (): string => {
    const schemaName = formType.replace(/[^a-zA-Z0-9]/g, "_");
    
    // Clean up empty arrays and undefined values
    const cleanedSchema = JSON.parse(JSON.stringify(schema, (key, value) => {
      // Handle function serialization for attribute operations
      if (key === "operation" || key === "reverseOperation") {
        return undefined; // Skip functions in JSON
      }
      // Remove empty linked_form_fields_text arrays
      if (key === "linked_form_fields_text" && Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      // Remove empty linked_dates arrays
      if (key === "linked_dates" && Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      // Remove other empty arrays that shouldn't be in the output
      if (key === "linkedFields" && Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      return value;
    }));
    
    const schemaString = JSON.stringify(cleanedSchema, null, 2);

    return `import { Schema, SchemaItem } from '@/types/schema';

export const ${schemaName}_schema: Schema = ${schemaString};

export default ${schemaName}_schema;`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateTypeScript());
    alert("Schema copied to clipboard!");
  };

  const downloadFile = () => {
    const blob = new Blob([generateTypeScript()], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formType}_schema.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    // Clean up empty arrays for JSON download too
    const cleanedSchema = JSON.parse(JSON.stringify(schema, (key, value) => {
      // Remove empty linked_form_fields_text arrays
      if (key === "linked_form_fields_text" && Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      // Remove empty linked_dates arrays
      if (key === "linked_dates" && Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      // Remove other empty arrays that shouldn't be in the output
      if (key === "linkedFields" && Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      return value;
    }));
    
    const blob = new Blob([JSON.stringify(cleanedSchema, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formType}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ 
        padding: "10px", 
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        gap: "10px",
        alignItems: "center"
      }}>
        <h3 style={{ margin: 0, flex: 1 }}>TypeScript Schema Export</h3>
        <button
          onClick={copyToClipboard}
          style={{ 
            padding: "6px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer"
          }}
        >
          Copy to Clipboard
        </button>
        <button
          onClick={downloadFile}
          style={{ 
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
            background: "#2563eb",
            color: "white",
            cursor: "pointer"
          }}
        >
          Download .ts
        </button>
        <button
          onClick={downloadJSON}
          style={{ 
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
            background: "#10b981",
            color: "white",
            cursor: "pointer"
          }}
        >
          Download .json
        </button>
      </div>
      
      <pre style={{ 
        flex: 1,
        margin: 0,
        padding: "20px",
        background: "#1e293b",
        color: "#e2e8f0",
        overflow: "auto",
        fontSize: "14px",
        lineHeight: "1.5"
      }}>
        <code>{generateTypeScript()}</code>
      </pre>
    </div>
  );
}