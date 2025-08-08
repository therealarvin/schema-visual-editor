"use client";

import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  requestId: string;
  request: {
    intent: string;
    fieldType: string;
    groupType: string;
    hasScreenshot: boolean;
  };
  response: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  openAISent?: unknown;      // What we sent to OpenAI (includes system prompt)
  openAIReceived?: unknown;   // What we got back from OpenAI
  duration?: number;
}

export default function AILogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-logs?action=recent&limit=20');
      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (requestId: string) => {
    try {
      const response = await fetch(`/api/ai-logs?action=details&requestId=${requestId}`);
      const data = await response.json();
      setSelectedLog(data);
    } catch (error) {
      console.error('Failed to fetch log details:', error);
    }
  };

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all AI logs?')) {
      try {
        await fetch('/api/ai-logs?all=true', { method: 'DELETE' });
        setLogs([]);
        setSelectedLog(null);
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  };

  const generateSummary = async () => {
    try {
      await fetch('/api/ai-logs?action=summary');
      alert('Summary report generated in ai-logs directory');
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  useEffect(() => {
    if (showViewer) {
      fetchLogs();
    }
  }, [showViewer]);

  if (!showViewer) {
    return (
      <button
        onClick={() => setShowViewer(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 1000
        }}
      >
        AI Logs
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '600px',
      maxHeight: '70vh',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>AI Request Logs</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Refresh
          </button>
          <button
            onClick={generateSummary}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Summary
          </button>
          <button
            onClick={clearLogs}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              background: '#fee2e2',
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setShowViewer(false)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {selectedLog ? (
          <div>
            <button
              onClick={() => setSelectedLog(null)}
              style={{
                marginBottom: '12px',
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              ← Back to list
            </button>
            
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Request ID:</strong> {selectedLog.requestId}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Timestamp:</strong> {selectedLog.timestamp}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Duration:</strong> {selectedLog.duration}ms
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <strong>Request:</strong>
                <pre style={{
                  background: '#f3f4f6',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.request, null, 2)}
                </pre>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <strong>Response:</strong>
                <pre style={{
                  background: selectedLog.response.success ? '#f0fdf4' : '#fef2f2',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(selectedLog.response, null, 2)}
                </pre>
              </div>

              {selectedLog.openAISent && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>OpenAI Request (includes system prompt):</strong>
                  <pre style={{
                    background: '#f9fafb',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(selectedLog.openAISent, null, 2) as React.ReactNode}
                  </pre>
                </div>
              )}

              {selectedLog.openAIReceived && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>OpenAI Response:</strong>
                  <pre style={{
                    background: '#f3f4f6',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(selectedLog.openAIReceived, null, 2) as React.ReactNode}
                  </pre>
                </div>
              )}

              {selectedLog.request.hasScreenshot && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>Screenshot:</strong>
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={`/api/ai-logs?action=screenshot&requestId=${selectedLog.requestId}`}
                      alt="Request screenshot"
                      style={{
                        maxWidth: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                No logs available
              </div>
            ) : (
              <div>
                {logs.map((log) => (
                  <div
                    key={log.requestId}
                    onClick={() => viewDetails(log.requestId)}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: log.response.success ? '#f0fdf4' : '#fef2f2'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Intent:</strong> {log.request.intent}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Type: {log.request.fieldType} | 
                      Status: {log.response.success ? '✓' : '✗'} | 
                      {log.duration}ms
                      {log.request.hasScreenshot && ' | 📷'}
                    </div>
                    {log.response.error && (
                      <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                        Error: {log.response.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}