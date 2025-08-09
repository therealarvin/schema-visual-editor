"use client";

import React from 'react';
import { BeautificationIteration } from '@/lib/aiService';

interface BeautificationModalProps {
  isOpen: boolean;
  blockName: string;
  currentIteration: number;
  totalIterations: number;
  iterations: BeautificationIteration[];
  onClose: () => void;
}

export default function BeautificationModal({
  isOpen,
  blockName,
  currentIteration,
  totalIterations,
  iterations,
  onClose
}: BeautificationModalProps) {
  if (!isOpen) return null;

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
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1200px',
        height: '90%',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              ✨ Beautifying: {blockName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Iteration {currentIteration} of {totalIterations}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          padding: '0 20px',
          marginTop: '10px'
        }}>
          <div style={{
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
              width: `${(currentIteration / totalIterations) * 100}%`,
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {iterations.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '20px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #8b5cf6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                  Initializing beautification process...
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                  Capturing screenshot and preparing for AI analysis
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {iterations.map((iteration, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {/* Iteration Header */}
                  <div style={{
                    background: iteration.isComplete ? '#f0fdf4' : '#faf5ff',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: iteration.isComplete ? '#10b981' : '#8b5cf6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {iteration.iteration}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                          Iteration {iteration.iteration}
                          {iteration.isComplete && ' - Complete ✓'}
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                          {iteration.changes.length} improvements made
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      AI Analysis:
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.6',
                      background: '#f9fafb',
                      padding: '12px',
                      borderRadius: '6px',
                      margin: '0 0 16px'
                    }}>
                      {iteration.reasoning}
                    </p>

                    {/* Changes */}
                    {iteration.changes.length > 0 && (
                      <>
                        <h4 style={{ margin: '16px 0 8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          Changes Applied:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {iteration.changes.map((change, changeIndex) => (
                            <div key={changeIndex} style={{
                              background: '#f3f4f6',
                              padding: '10px',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{
                                  background: '#8b5cf6',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}>
                                  {change.unique_id}
                                </span>
                                <span style={{ color: '#6b7280' }}>
                                  {change.field}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ color: '#ef4444' }}>Before:</span>
                                <code style={{
                                  background: 'white',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  fontSize: '12px'
                                }}>
                                  {JSON.stringify(change.oldValue)}
                                </code>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ color: '#10b981' }}>After:</span>
                                <code style={{
                                  background: 'white',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  fontSize: '12px'
                                }}>
                                  {JSON.stringify(change.newValue)}
                                </code>
                              </div>
                              {change.reason && (
                                <div style={{
                                  marginTop: '6px',
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  fontStyle: 'italic'
                                }}>
                                  Reason: {change.reason}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Screenshot Preview */}
                    {iteration.screenshot && (
                      <>
                        <h4 style={{ margin: '16px 0 8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          Screenshot:
                        </h4>
                        <div style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          maxHeight: '300px',
                          position: 'relative'
                        }}>
                          <img 
                            src={iteration.screenshot} 
                            alt={`Iteration ${iteration.iteration} screenshot`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Processing indicator for next iteration */}
              {currentIteration > iterations.length && currentIteration <= totalIterations && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #8b5cf6',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                      Processing iteration {currentIteration}...
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                      Analyzing design and generating improvements
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}