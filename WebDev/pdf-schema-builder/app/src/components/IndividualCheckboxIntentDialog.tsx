"use client";

import React, { useState, useEffect } from 'react';

interface IndividualCheckboxIntentDialogProps {
  isOpen: boolean;
  checkboxOptions: {
    fieldName: string;
    currentLabel?: string;
    page?: number;
  }[];
  onComplete: (intents: { fieldName: string; intent: string }[]) => void;
  onCancel: () => void;
  onHighlightField?: (fieldName: string | null) => void;
  onNavigateToPage?: (page: number) => void;
}

export default function IndividualCheckboxIntentDialog({
  isOpen,
  checkboxOptions,
  onComplete,
  onCancel,
  onHighlightField,
  onNavigateToPage
}: IndividualCheckboxIntentDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentIntent, setCurrentIntent] = useState('');
  const [collectedIntents, setCollectedIntents] = useState<{ fieldName: string; intent: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset when dialog opens
    if (isOpen) {
      setCurrentIndex(0);
      setCurrentIntent('');
      setCollectedIntents([]);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Highlight current field in PDF and navigate to its page
  useEffect(() => {
    if (isOpen && checkboxOptions.length > 0) {
      const currentOption = checkboxOptions[currentIndex];
      if (currentOption) {
        // Highlight the field
        if (onHighlightField) {
          onHighlightField(currentOption.fieldName);
        }
        
        // Navigate to the page containing this field
        if (onNavigateToPage && currentOption.page) {
          onNavigateToPage(currentOption.page);
        }
      }
    }
    
    // Clear highlight when dialog closes
    return () => {
      if (onHighlightField) {
        onHighlightField(null);
      }
    };
  }, [isOpen, currentIndex, checkboxOptions, onHighlightField, onNavigateToPage]);

  if (!isOpen || checkboxOptions.length === 0) return null;

  const currentOption = checkboxOptions[currentIndex];
  const progress = ((currentIndex + 1) / checkboxOptions.length) * 100;

  const handleNext = () => {
    if (!currentIntent.trim()) return;

    const newIntents = [...collectedIntents, {
      fieldName: currentOption.fieldName,
      intent: currentIntent.trim()
    }];
    setCollectedIntents(newIntents);

    if (currentIndex < checkboxOptions.length - 1) {
      // Move to next checkbox
      setCurrentIndex(currentIndex + 1);
      setCurrentIntent('');
    } else {
      // All done - submit all intents
      setIsProcessing(true);
      onComplete(newIntents);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      const previousIntent = collectedIntents[previousIndex];
      
      // Remove the previous intent from collected and set it as current
      setCollectedIntents(collectedIntents.slice(0, previousIndex));
      setCurrentIndex(previousIndex);
      setCurrentIntent(previousIntent?.intent || '');
    }
  };

  const handleSkip = () => {
    // Add empty intent for this field
    const newIntents = [...collectedIntents, {
      fieldName: currentOption.fieldName,
      intent: '' // Empty intent will use the original field name
    }];
    setCollectedIntents(newIntents);

    if (currentIndex < checkboxOptions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentIntent('');
    } else {
      setIsProcessing(true);
      onComplete(newIntents);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      zIndex: 10001,
      pointerEvents: 'none' // Allow clicks to pass through to PDF except on dialog
    }}>
      {/* Arrow pointing to the left (towards PDF) */}
      <div style={{
        position: 'fixed',
        bottom: '100px',
        right: '440px',
        width: '0',
        height: '0',
        borderTop: '15px solid transparent',
        borderBottom: '15px solid transparent',
        borderRight: '20px solid #10b981',
        filter: 'drop-shadow(-2px 0 3px rgba(0, 0, 0, 0.2))',
        animation: 'point 1.5s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        width: '420px',
        maxWidth: 'calc(100vw - 40px)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        border: '2px solid #10b981',
        pointerEvents: 'auto' // Re-enable pointer events for the dialog itself
      }}>
        {/* Compact header with progress */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#111827'
            }}>
              Describe Checkbox
            </h3>
            <span style={{
              fontSize: '13px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {currentIndex + 1} of {checkboxOptions.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div style={{
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        {/* Current checkbox field - more compact */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #10b981',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 2s infinite',
            flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              color: '#047857',
              fontWeight: '500'
            }}>
              Looking at: <strong style={{ fontFamily: 'monospace' }}>{currentOption.fieldName}</strong>
            </p>
            <p style={{
              margin: '2px 0 0',
              fontSize: '11px',
              color: '#6b7280'
            }}>
              Check the green highlighted field in the PDF
            </p>
          </div>
        </div>

        {/* Intent input - more compact */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            What does this checkbox mean?
          </label>
          <input
            type="text"
            value={currentIntent}
            onChange={(e) => setCurrentIntent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentIntent.trim()) {
                handleNext();
              }
            }}
            placeholder="E.g., 'Has parking' or 'Monthly renewal'"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'inherit'
            }}
            autoFocus
            disabled={isProcessing}
          />
          <p style={{
            margin: '6px 0 0',
            fontSize: '11px',
            color: '#6b7280'
          }}>
            Describe in plain English - AI will create a short label
          </p>
        </div>

        {/* Compact examples */}
        <details style={{ marginBottom: '16px' }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            Show examples
          </summary>
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '11px',
            color: '#4b5563',
            marginTop: '4px'
          }}>
            • "Agrees to marketing" → "Marketing emails"<br/>
            • "Has swimming pool" → "Swimming pool"<br/>
            • "Monthly notification" → "Monthly notice"
          </div>
        </details>

        {/* Compact buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: 'white',
                color: '#374151',
                fontSize: '12px',
                fontWeight: '500',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1
              }}
              title="Cancel and close"
            >
              ✕
            </button>
            
            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isProcessing}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1
                }}
              >
                ← Back
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSkip}
              disabled={isProcessing}
              style={{
                padding: '6px 12px',
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: '500',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1
              }}
            >
              Skip
            </button>
            
            <button
              onClick={handleNext}
              disabled={!currentIntent.trim() || isProcessing}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: '4px',
                background: currentIntent.trim() && !isProcessing ? '#10b981' : '#e5e7eb',
                color: currentIntent.trim() && !isProcessing ? 'white' : '#9ca3af',
                fontSize: '12px',
                fontWeight: '500',
                cursor: currentIntent.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isProcessing ? (
                <>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid #9ca3af',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </>
              ) : currentIndex === checkboxOptions.length - 1 ? (
                'Finish'
              ) : (
                'Next →'
              )}
            </button>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes point {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-10px); }
          }
        `}</style>
      </div>
    </div>
  );
}