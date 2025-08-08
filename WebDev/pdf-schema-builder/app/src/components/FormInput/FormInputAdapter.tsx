"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Schema, SchemaItem as PDFSchemaItem } from "@/types/schema";
import { SchemaItem as RealtorSchemaItem, FormResponse } from "@/types/realtor";
import OptimizedFormInput from "./OptimizedFormInput";
import { useFieldStore } from "./stores/fieldStore";

interface FormInputAdapterProps {
  schema: Schema;
  formType: string;
}

// Convert our PDF schema to the realtor schema format
function convertSchemaItem(item: PDFSchemaItem): RealtorSchemaItem {
  return {
    unique_id: item.unique_id,
    pdf_attributes: item.pdf_attributes,
    display_attributes: {
      ...item.display_attributes,
      // Map any missing fields with defaults
      display_name: item.display_attributes.display_name || item.unique_id,
    }
  } as RealtorSchemaItem;
}

export default function FormInputAdapter({ schema, formType }: FormInputAdapterProps) {
  const { initializeFields } = useFieldStore();
  
  // Convert schema to realtor format - memoize to prevent recreation
  const realtorSchema = React.useMemo(() => schema.map(convertSchemaItem), [schema]);
  
  // Initialize form responses - memoize to prevent recreation
  const initialFormResponses = React.useMemo(() => {
    const initialValues: FormResponse = {};
    realtorSchema.forEach(item => {
      // Set default values based on field type
      if (item.display_attributes.input_type === 'checkbox') {
        initialValues[item.unique_id] = [];
      } else {
        initialValues[item.unique_id] = '';
      }
    });
    return initialValues;
  }, [realtorSchema]);

  const [formResponses, setFormResponses] = useState<FormResponse>(initialFormResponses);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the field store only once
  useEffect(() => {
    if (!isInitialized) {
      initializeFields(initialFormResponses);
      setIsInitialized(true);
    }
  }, []); // Empty dependency array - only run once

  const handleFieldUpdate = useCallback(async (fieldId: string, value: any) => {
    // Update local state
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // In a real app, you might want to save to a database here
    console.log('Field updated:', fieldId, value);
  }, []);

  const handleFormChange = useCallback((responses: FormResponse) => {
    setFormResponses(responses);
    console.log('Form changed:', responses);
  }, []);

  return (
    <div style={{ 
      background: "white",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <h2 style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "20px",
          color: "#1f2937"
        }}>
          Form Preview - {formType}
        </h2>
        
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          background: "#f9fafb"
        }}>
          <OptimizedFormInput
            schema={realtorSchema}
            initialFormResponses={formResponses}
            formResponseUpdateByField={handleFieldUpdate}
            can_edit={true}
            onFormChange={handleFormChange}
            loading={false}
          />
        </div>

        {/* Debug Panel */}
        <details style={{ marginTop: "20px" }}>
          <summary style={{ 
            cursor: "pointer",
            padding: "10px",
            background: "#f3f4f6",
            borderRadius: "4px",
            fontWeight: "bold"
          }}>
            Debug: Form Values
          </summary>
          <pre style={{
            marginTop: "10px",
            padding: "10px",
            background: "#1f2937",
            color: "#10b981",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "12px"
          }}>
            {JSON.stringify(formResponses, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}