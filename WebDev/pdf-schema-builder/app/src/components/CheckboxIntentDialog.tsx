"use client";

import React, { useState } from 'react';

interface CheckboxIntentDialogProps {
  isOpen: boolean;
  checkboxOptions: {
    fieldName: string;
    currentLabel?: string;
  }[];
  onSubmit: (intent: string) => void;
  onCancel: () => void;
}

export default function CheckboxIntentDialog({
  isOpen,
  checkboxOptions,
  onSubmit,
  onCancel
}: CheckboxIntentDialogProps) {
  const [intent, setIntent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (intent.trim()) {
      onSubmit(intent.trim());
      setIntent('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ 
          margin: '0 0 8px', 
          fontSize: '20px', 
          fontWeight: '600',
          color: '#111827'
        }}>
          🎯 Describe Checkbox Purpose
        </h2>
        
        <p style={{ 
          margin: '0 0 20px', 
          fontSize: '14px', 
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          Help the AI generate better labels by describing what these checkbox options are for.
        </p>

        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <p style={{ 
            margin: '0 0 8px', 
            fontSize: '13px', 
            fontWeight: '500',
            color: '#374151'
          }}>
            Checkbox fields detected:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {checkboxOptions.map((opt, index) => (
              <span key={index} style={{
                background: '#8b5cf6',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {opt.currentLabel || opt.fieldName}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            What are these checkboxes asking about?
          </label>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Example: 'These checkboxes ask about property amenities like parking, pool, gym' or 'These are yes/no questions about tenant preferences' or 'These options let users select which utilities are included'"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            autoFocus
          />
          <p style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Be specific about what the user is selecting or agreeing to. This helps generate clear, contextual labels.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!intent.trim()}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: intent.trim() ? '#8b5cf6' : '#e5e7eb',
              color: intent.trim() ? 'white' : '#9ca3af',
              fontSize: '14px',
              fontWeight: '500',
              cursor: intent.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Generate Labels
          </button>
        </div>
      </div>
    </div>
  );
}