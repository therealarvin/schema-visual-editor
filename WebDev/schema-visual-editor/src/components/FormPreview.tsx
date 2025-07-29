'use client';

import React, { useState } from 'react';
import { Schema, FormResponse, SignatureInput } from '@/types/schema';
import FormInput from './FormInput';
import { TooltipProvider } from '@/components/ui/tooltip';

interface FormPreviewProps {
  schema: Schema;
}

export default function FormPreview({ schema }: FormPreviewProps) {
  const [formResponses, setFormResponses] = useState<FormResponse>({});

  const handleFieldUpdate = async (itemKey: string, newValue: string | string[] | SignatureInput) => {
    setFormResponses(prev => ({
      ...prev,
      [itemKey]: newValue
    }));
  };

  const handleFileUpload = async (files: File[], fieldId: string) => {
    // In a real implementation, this would upload files to a server
    console.log(`Uploading ${files.length} file(s) for field ${fieldId}`);
    
    // For now, just store file names in the form responses
    const fileNames = files.map(f => f.name);
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: {
        files: fileNames,
        count: files.length
      }
    }));
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Form Preview</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <FormInput
            schema={schema}
            formResponseUpdateByField={handleFieldUpdate}
            initialFormResponses={formResponses}
            can_edit={true}
            isLoading={false}
            showProgress={true}
            handleFileUpload={handleFileUpload}
          />
          
          {/* Debug view of form responses */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Form Responses (Debug)</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(formResponses, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}