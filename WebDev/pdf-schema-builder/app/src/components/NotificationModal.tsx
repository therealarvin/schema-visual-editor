"use client";

import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
  title?: string;
}

export default function NotificationModal({
  isOpen,
  message,
  type = 'info',
  onClose,
  title
}: NotificationModalProps) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'success':
        return { border: '#10b981', bg: '#f0fdf4', text: '#047857', icon: '✓' };
      case 'error':
        return { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c', icon: '✕' };
      case 'warning':
        return { border: '#f59e0b', bg: '#fffbeb', text: '#92400e', icon: '⚠' };
      default:
        return { border: '#3b82f6', bg: '#eff6ff', text: '#1e40af', icon: 'ℹ' };
    }
  };

  const colors = getColors();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10002
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        border: `2px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: colors.bg,
            color: colors.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {colors.icon}
          </div>
          <div style={{ flex: 1 }}>
            {title && (
              <h3 style={{
                margin: '0 0 8px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827'
              }}>
                {title}
              </h3>
            )}
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {message}
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: colors.border,
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}