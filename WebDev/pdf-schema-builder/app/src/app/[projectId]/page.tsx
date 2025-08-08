"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { persistPdf, tryLoadPdf } from "@/lib/pdfStorage";
import { saveSchemaToIndexedDB, loadSchemaFromIndexedDB } from "@/lib/schemaStorage";
import { useProjectsStore } from "@/stores/projects";
import { Schema, PDFField, FieldGroup } from "@/types/schema";
import PdfViewer from "@/components/PdfViewer";
import FieldGrouping from "@/components/FieldGrouping";
import SchemaEditor from "@/components/SchemaEditor";
import SchemaExport from "@/components/SchemaExport";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = useMemo(() => String(params?.projectId ?? params?.projectid ?? "unknown"), [params]);
  
  // Get project from store to get formType
  const projects = useProjectsStore((s) => s.projects);
  const project = projects.find(p => p.id === projectId);
  const formType = project?.formType || "default";

  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Schema builder state
  const [schema, setSchema] = useState<Schema>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [extractedFields, setExtractedFields] = useState<PDFField[]>([]);
  const [showGrouping, setShowGrouping] = useState(false);
  const [currentFieldGroup, setCurrentFieldGroup] = useState<FieldGroup | undefined>();
  const [activeTab, setActiveTab] = useState<"editor" | "typescript">("editor");

  // Load PDF and schema on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await tryLoadPdf(projectId);
      if (mounted && loaded) {
        setPdfData(loaded);
        setStatus("Loaded PDF from storage");
      }
      
      const loadedSchema = await loadSchemaFromIndexedDB(projectId);
      if (mounted && loadedSchema) {
        setSchema(loadedSchema);
      }
    })();
    return () => { mounted = false; };
  }, [projectId]);

  // Save schema whenever it changes
  useEffect(() => {
    if (schema.length > 0) {
      saveSchemaToIndexedDB(projectId, schema).catch(console.error);
    }
  }, [schema, projectId]);

  const onFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setStatus(null);
    const file = files && files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large. Max size is 20 MB. Selected: ${humanSize(file.size)}`);
      return;
    }

    try {
      setFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      setPdfData(arrayBuffer);
      const where = await persistPdf(projectId, arrayBuffer);
      setStatus(`Saved to ${where}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to read/save file.");
    }
  }, [projectId]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.files?.length) {
      void onFiles(dt.files);
    }
  }, [onFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void onFiles(e.target.files);
  }, [onFiles]);

  const handleFieldClick = (field: PDFField) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field.name)) {
      newSelected.delete(field.name);
    } else {
      newSelected.add(field.name);
    }
    setSelectedFields(newSelected);
  };

  const handleCreateGroup = () => {
    const selected = extractedFields.filter(f => selectedFields.has(f.name));
    if (selected.length === 0) {
      alert("Please select at least one field");
      return;
    }
    setShowGrouping(true);
  };

  const handleGroupCreated = (group: FieldGroup) => {
    setCurrentFieldGroup(group);
    setShowGrouping(false);
    setSelectedFields(new Set());
  };

  if (!pdfData) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Project: {projectId}</h1>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          style={{
            marginTop: 16,
            border: "2px dashed #999",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            background: "#fafafa",
            cursor: "pointer",
          }}
          onClick={() => {
            const input = document.getElementById("pdf-input") as HTMLInputElement | null;
            input?.click();
          }}
          role="button"
          aria-label="Upload PDF"
        >
          <p style={{ marginBottom: 8 }}>Drag and drop a PDF here, or click to select</p>
          <input
            id="pdf-input"
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={onInputChange}
          />
          <p style={{ fontSize: 12, color: "#666" }}>Max size: 20 MB</p>
        </div>

        {error && (
          <div style={{ color: "#b00020", marginTop: 12 }}>{error}</div>
        )}
        {status && (
          <div style={{ color: "#0a7", marginTop: 12 }}>{status}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ 
        padding: "10px 20px", 
        borderBottom: "1px solid #e5e7eb",
        background: "#f9fafb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h1 style={{ margin: 0, fontSize: "20px" }}>
          Project: {project?.name || projectId} ({formType})
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          {selectedFields.size > 0 && (
            <button
              onClick={handleCreateGroup}
              style={{
                padding: "8px 16px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Create Group ({selectedFields.size} fields selected)
            </button>
          )}
          <button
            onClick={() => setSelectedFields(new Set())}
            disabled={selectedFields.size === 0}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              opacity: selectedFields.size === 0 ? 0.5 : 1
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* PDF Viewer - Left Side */}
        <div style={{ 
          width: "50%", 
          borderRight: "1px solid #e5e7eb",
          overflow: "auto"
        }}>
          <PdfViewer
            pdfData={pdfData}
            onFieldsExtracted={setExtractedFields}
            selectedFields={selectedFields}
            onFieldClick={handleFieldClick}
          />
        </div>

        {/* Schema Editor - Right Side */}
        <div style={{ width: "50%", display: "flex", flexDirection: "column" }}>
          <div style={{ 
            display: "flex", 
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb"
          }}>
            <button
              onClick={() => setActiveTab("editor")}
              style={{
                padding: "10px 20px",
                background: activeTab === "editor" ? "white" : "transparent",
                border: "none",
                borderBottom: activeTab === "editor" ? "2px solid #2563eb" : "none",
                cursor: "pointer",
                fontWeight: activeTab === "editor" ? "bold" : "normal"
              }}
            >
              Schema Editor
            </button>
            <button
              onClick={() => setActiveTab("typescript")}
              style={{
                padding: "10px 20px",
                background: activeTab === "typescript" ? "white" : "transparent",
                border: "none",
                borderBottom: activeTab === "typescript" ? "2px solid #2563eb" : "none",
                cursor: "pointer",
                fontWeight: activeTab === "typescript" ? "bold" : "normal"
              }}
            >
              TypeScript Export
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {activeTab === "editor" ? (
              <SchemaEditor
                schema={schema}
                onSchemaChange={setSchema}
                fieldGroup={currentFieldGroup}
                formType={formType}
              />
            ) : (
              <SchemaExport schema={schema} formType={formType} />
            )}
          </div>
        </div>
      </div>

      {/* Field Grouping Dialog */}
      {showGrouping && (
        <FieldGrouping
          selectedFields={extractedFields.filter(f => selectedFields.has(f.name))}
          onCreateGroup={handleGroupCreated}
          onCancel={() => setShowGrouping(false)}
        />
      )}
    </div>
  );
}

