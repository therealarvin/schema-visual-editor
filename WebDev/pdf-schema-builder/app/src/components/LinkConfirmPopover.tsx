"use client";

import React from 'react';

interface LinkConfirmPopoverProps {
  isOpen: boolean;
  position: { x: number; y: number };
  fieldName: string;
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LinkConfirmPopover({
  isOpen,
  position,
  fieldName,
  targetName,
  onConfirm,
  onCancel
}: LinkConfirmPopoverProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Invisible overlay to capture clicks outside */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998
        }}
        onClick={onCancel}
      />
      
      {/* Popover */}
      <div style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px',
        background: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        minWidth: '200px',
        maxWidth: '300px'
      }}>
        {/* Arrow pointing down */}
        <div style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid white',
          filter: 'drop-shadow(0 1px 0 #d1d5db)'
        }} />
        
        <p style={{
          margin: '0 0 12px',
          fontSize: '13px',
          color: '#374151'
        }}>
          Link <strong>{fieldName}</strong> to <strong>{targetName}</strong>?
        </p>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '4px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              color: '#6b7280',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderRadius: '4px',
              background: '#10b981',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}