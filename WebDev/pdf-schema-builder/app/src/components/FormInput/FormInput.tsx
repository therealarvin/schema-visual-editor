"use client";

import React, { useState, useCallback } from "react";
import { SchemaItem, Schema } from "@/types/schema";
import FieldRenderer from "./FieldRenderer";

interface FormInputProps {
  schema: Schema;
  initialValues?: Record<string, any>;
  onFieldChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export default function FormInput({ 
  schema, 
  initialValues = {}, 
  onFieldChange,
  readOnly = false 
}: FormInputProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sort schema items by order
  const sortedSchema = [...schema].sort((a, b) => a.display_attributes.order - b.display_attributes.order);

  // Group schema items into rows based on width and breakBefore
  const rows: SchemaItem[][] = [];
  let currentRow: SchemaItem[] = [];
  let currentRowWidth = 0;

  sortedSchema.forEach((item) => {
    const width = item.display_attributes.width || 12;
    const breakBefore = item.display_attributes.breakBefore || false;

    if (breakBefore || currentRowWidth + width > 12) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [item];
      currentRowWidth = width;
    } else {
      currentRow.push(item);
      currentRowWidth += width;
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Group rows by block
  const blocks: { name?: string; style?: any; rows: SchemaItem[][] }[] = [];
  let currentBlock: { name?: string; style?: any; rows: SchemaItem[][] } | null = null;

  rows.forEach((row) => {
    const firstItem = row[0];
    const blockName = firstItem.display_attributes.block;
    
    if (blockName) {
      if (!currentBlock || currentBlock.name !== blockName) {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          name: blockName,
          style: firstItem.display_attributes.block_style,
          rows: [row]
        };
      } else {
        currentBlock.rows.push(row);
      }
    } else {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      blocks.push({ rows: [row] });
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    if (onFieldChange) {
      onFieldChange(fieldId, value);
    }
  }, [onFieldChange]);

  const checkVisibility = (item: SchemaItem): boolean => {
    if (!item.display_attributes.visibleIf || item.display_attributes.visibleIf.length === 0) {
      return true;
    }

    return item.display_attributes.visibleIf.every(condition => {
      const fieldValue = formValues[condition.unique_id];
      const checkValue = condition.valueChecked;

      switch (condition.operation) {
        case "==":
          return fieldValue == checkValue;
        case "!==":
          return fieldValue != checkValue;
        case "contains":
          return fieldValue && String(fieldValue).includes(checkValue);
        case "doesNotContain":
          return !fieldValue || !String(fieldValue).includes(checkValue);
        case ">":
          return Number(fieldValue) > Number(checkValue);
        case ">=":
          return Number(fieldValue) >= Number(checkValue);
        case "<":
          return Number(fieldValue) < Number(checkValue);
        case "<=":
          return Number(fieldValue) <= Number(checkValue);
        default:
          return true;
      }
    });
  };

  const getBlockColorClasses = (colorTheme?: string) => {
    switch (colorTheme) {
      case "blue":
        return "border-blue-200 bg-blue-50";
      case "green":
        return "border-green-200 bg-green-50";
      case "purple":
        return "border-purple-200 bg-purple-50";
      case "orange":
        return "border-orange-200 bg-orange-50";
      case "gray":
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {blocks.map((block, blockIndex) => {
        const hasBlockStyle = block.name && block.style;
        const blockColorClasses = getBlockColorClasses(block.style?.color_theme);

        return (
          <div
            key={blockIndex}
            style={{
              marginBottom: "24px",
              ...(hasBlockStyle ? {
                border: "1px solid",
                borderRadius: "8px",
                padding: "16px",
              } : {})
            }}
            className={hasBlockStyle ? blockColorClasses : ""}
          >
            {hasBlockStyle && (
              <div style={{ marginBottom: "16px" }}>
                {block.style?.title && (
                  <h3 style={{ 
                    fontSize: "18px", 
                    fontWeight: "bold",
                    marginBottom: "4px"
                  }}>
                    {block.style.title}
                  </h3>
                )}
                {block.style?.description && (
                  <p style={{ 
                    fontSize: "14px", 
                    color: "#6b7280"
                  }}>
                    {block.style.description}
                  </p>
                )}
              </div>
            )}

            {block.rows.map((row, rowIndex) => (
              <div 
                key={rowIndex}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, 1fr)",
                  gap: "16px",
                  marginBottom: rowIndex < block.rows.length - 1 ? "16px" : "0"
                }}
              >
                {row.map((item) => {
                  const isVisible = checkVisibility(item);
                  const width = item.display_attributes.width || 12;

                  if (!isVisible) {
                    return null;
                  }

                  return (
                    <div
                      key={item.unique_id}
                      style={{
                        gridColumn: `span ${width}`,
                        ...(item.display_attributes.isHidden ? { display: "none" } : {})
                      }}
                    >
                      <FieldRenderer
                        schemaItem={item}
                        value={formValues[item.unique_id]}
                        onChange={(value) => handleFieldChange(item.unique_id, value)}
                        disabled={readOnly}
                        error={fieldErrors[item.unique_id]}
                        allFormValues={formValues}
                        allSchemaItems={schema}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}