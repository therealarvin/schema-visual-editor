import React from 'react';
import { SchemaItem } from '@/types/schema';
import TextField from './fields/TextField';
import CheckboxField from './fields/CheckboxField';
import RadioField from './fields/RadioField';
import InfoField from './fields/InfoField';
import SignatureField from './fields/SignatureField';
import FileUploadField from './fields/FileUploadField';

interface FieldRendererProps {
  schemaItem: SchemaItem;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
  allFormValues?: Record<string, any>;
  allSchemaItems?: SchemaItem[];
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  schemaItem,
  value,
  onChange,
  disabled = false,
  error,
  allFormValues = {},
  allSchemaItems = []
}) => {
  const { input_type } = schemaItem.display_attributes;

  // Render label if display_name exists
  const renderLabel = () => {
    if (!schemaItem.display_attributes.display_name) return null;
    
    return (
      <label style={{ 
        display: "block", 
        marginBottom: "4px", 
        fontSize: "14px",
        fontWeight: "500"
      }}>
        {schemaItem.display_attributes.display_name}
        {schemaItem.display_attributes.isRequired && (
          <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
        )}
      </label>
    );
  };

  const renderField = () => {
    switch (input_type) {
      case 'text':
      case 'text-area':
        return (
          <TextField
            schema={schemaItem}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case 'checkbox':
        return (
          <CheckboxField
            schema={schemaItem}
            value={value || []}
            onChange={onChange}
            disabled={disabled}
            formValues={allFormValues}
            allSchemaItems={allSchemaItems}
          />
        );

      case 'radio':
        return (
          <RadioField
            schema={schemaItem}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case 'info':
        return <InfoField schema={schemaItem} />;

      case 'signature':
        return (
          <SignatureField
            schema={schemaItem}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case 'fileUpload':
        return (
          <FileUploadField
            schema={schemaItem}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );

      default:
        return (
          <div style={{ 
            padding: "12px",
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: "4px"
          }}>
            <p style={{ fontSize: "14px", color: "#92400e" }}>
              Field type "{input_type}" not yet supported
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{ marginBottom: "8px" }}>
      {renderLabel()}
      {schemaItem.display_attributes.description && (
        <p style={{ 
          fontSize: "12px", 
          color: "#6b7280",
          marginBottom: "4px"
        }}>
          {schemaItem.display_attributes.description}
        </p>
      )}
      {renderField()}
      {error && (
        <p style={{ 
          fontSize: "12px", 
          color: "#ef4444",
          marginTop: "4px"
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FieldRenderer;