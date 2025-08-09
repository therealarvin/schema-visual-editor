"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { persistPdf, tryLoadPdf } from "@/lib/pdfStorage";
import { useProjectsStore } from "@/stores/projects";
import PdfViewer from "@/components/PdfViewer";
import { PDFField, Schema, FieldGroup } from "@/types/schema";
import FieldGrouping from "@/components/FieldGrouping";
import SchemaEditor from "@/components/SchemaEditor";
import SchemaExport from "@/components/SchemaExport";
import AILogsViewer from "@/components/AILogsViewer";
import { saveSchemaToIndexedDB, loadSchemaFromIndexedDB } from "@/lib/schemaStorage";
import FormInputAdapter from "@/components/FormInput/FormInputAdapter";
import NotificationModal from "@/components/NotificationModal";
import LinkConfirmPopover from "@/components/LinkConfirmPopover";

const MAX_BYTES = 20_971_520; // 20 MB
function humanSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
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
  const [fileName, setFileName] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  // Schema builder state
  const [schema, setSchema] = useState<Schema>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [extractedFields, setExtractedFields] = useState<PDFField[]>([]);
  const [showGrouping, setShowGrouping] = useState(false);
  const [currentFieldGroup, setCurrentFieldGroup] = useState<FieldGroup | undefined>();
  const [activeTab, setActiveTab] = useState<"editor" | "typescript" | "visual">("editor");
  const [linkingMode, setLinkingMode] = useState<{ linkingPath: string; linkingType: 'checkbox' | 'date' | 'text' } | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Modal state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    title?: string;
  }>({ isOpen: false, message: '', type: 'info' });
  
  // Link confirmation popover state
  const [linkConfirm, setLinkConfirm] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    field: PDFField | null;
    linkingPath: string;
    linkingType: 'checkbox' | 'date' | 'text';
  }>({ isOpen: false, position: { x: 0, y: 0 }, field: null, linkingPath: '', linkingType: 'checkbox' });

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
    } catch (e) {
      console.error(e);
      setError((e as Error)?.message || "Failed to read/save file.");
    }
  }, [projectId]);

  const onDrop = useCallback((e: React.DragEvent) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.files?.length) {
      void onFiles(dt.files);
    }
  }, [onFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void onFiles(e.target.files);
  }, [onFiles]);

  const handleFieldClick = (field: PDFField, event?: React.MouseEvent) => {
    // If in linking mode, handle linking instead of selection
    if (linkingMode) {
      const { linkingPath, linkingType } = linkingMode;
      
      // Get click position for popover
      const clickX = event?.clientX || window.innerWidth / 2;
      const clickY = event?.clientY || window.innerHeight / 2;
      
      if (linkingType === 'checkbox') {
        // For checkbox linking, require a grouped field
        const linkedSchemaItem = schema.find(item => 
          item.pdf_attributes?.some(attr => 
            attr.formfield === field.name ||
            (Array.isArray(attr.formfield) && attr.formfield.includes(field.name)) ||
            attr.linked_form_fields_text?.includes(field.name)
          )
        );
        
        if (linkedSchemaItem) {
          // Show confirmation popover
          setLinkConfirm({
            isOpen: true,
            position: { x: clickX, y: clickY },
            field,
            linkingPath,
            linkingType
          });
        } else {
          setNotification({
            isOpen: true,
            message: 'For checkbox linking, you must click on a grouped field. Please create a group first.',
            type: 'warning',
            title: 'Invalid Selection'
          });
        }
      } else if (linkingType === 'date') {
        // For date linking, require a grouped field
        const linkedSchemaItem = schema.find(item => 
          item.pdf_attributes?.some(attr => 
            attr.formfield === field.name ||
            (Array.isArray(attr.formfield) && attr.formfield.includes(field.name)) ||
            attr.linked_form_fields_text?.includes(field.name)
          )
        );
        
        if (linkedSchemaItem) {
          // Show confirmation popover
          setLinkConfirm({
            isOpen: true,
            position: { x: clickX, y: clickY },
            field,
            linkingPath,
            linkingType
          });
        } else {
          setNotification({
            isOpen: true,
            message: 'For date linking, you must click on a grouped field. Please create a group first.',
            type: 'warning',
            title: 'Invalid Selection'
          });
        }
      } else if (linkingType === 'text') {
        // For text linking, allow any field (grouped or not) - show confirmation
        setLinkConfirm({
          isOpen: true,
          position: { x: clickX, y: clickY },
          field,
          linkingPath,
          linkingType
        });
      }
      return;
    }
    
    // Normal selection mode
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field.name)) {
      newSelected.delete(field.name);
    } else {
      newSelected.add(field.name);
    }
    setSelectedFields(newSelected);
  };

  const handleLinkConfirm = () => {
    if (!linkConfirm.field) return;
    
    const { field, linkingPath, linkingType } = linkConfirm;
    
    if (linkingType === 'checkbox') {
      const linkedSchemaItem = schema.find(item => 
        item.pdf_attributes?.some(attr => 
          attr.formfield === field.name ||
          (Array.isArray(attr.formfield) && attr.formfield.includes(field.name)) ||
          attr.linked_form_fields_text?.includes(field.name)
        )
      );
      
      if (linkedSchemaItem) {
        const [schemaId, optionIndex] = linkingPath.split('.');
        const updatedSchema = schema.map(item => {
          if (item.unique_id === schemaId && item.display_attributes.checkbox_options) {
            const options = [...item.display_attributes.checkbox_options.options];
            if (options[parseInt(optionIndex)]) {
              if (!options[parseInt(optionIndex)].linkedFields) {
                options[parseInt(optionIndex)].linkedFields = [];
              }
              if (!options[parseInt(optionIndex)].linkedFields!.includes(linkedSchemaItem.unique_id)) {
                options[parseInt(optionIndex)].linkedFields!.push(linkedSchemaItem.unique_id);
              }
            }
            return {
              ...item,
              display_attributes: {
                ...item.display_attributes,
                checkbox_options: {
                  ...item.display_attributes.checkbox_options,
                  options
                }
              }
            };
          }
          return item;
        });
        setSchema(updatedSchema);
        setLinkingMode(null);
        setNotification({
          isOpen: true,
          message: `Linked checkbox option to ${linkedSchemaItem.display_attributes.display_name || linkedSchemaItem.unique_id}`,
          type: 'success',
          title: 'Link Created'
        });
      }
    } else if (linkingType === 'date') {
      const linkedSchemaItem = schema.find(item => 
        item.pdf_attributes?.some(attr => 
          attr.formfield === field.name ||
          (Array.isArray(attr.formfield) && attr.formfield.includes(field.name)) ||
          attr.linked_form_fields_text?.includes(field.name)
        )
      );
      
      if (linkedSchemaItem) {
        const pathParts = linkingPath.split('.');
        const schemaId = pathParts[0];
        const pdfIndex = parseInt(pathParts[2]);
        
        const updatedSchema = schema.map(item => {
          if (item.unique_id === schemaId && item.pdf_attributes?.[pdfIndex]) {
            const updatedPdfAttrs = [...(item.pdf_attributes || [])];
            if (!updatedPdfAttrs[pdfIndex].linked_dates) {
              updatedPdfAttrs[pdfIndex].linked_dates = [];
            }
            updatedPdfAttrs[pdfIndex].linked_dates!.push({
              dateFieldName: linkedSchemaItem.unique_id
            });
            
            return {
              ...item,
              pdf_attributes: updatedPdfAttrs
            };
          }
          return item;
        });
        setSchema(updatedSchema);
        setLinkingMode(null);
        setNotification({
          isOpen: true,
          message: `Added date field: ${linkedSchemaItem.display_attributes.display_name || linkedSchemaItem.unique_id}`,
          type: 'success',
          title: 'Date Field Added'
        });
      }
    } else if (linkingType === 'text') {
      const pathParts = linkingPath.split('.');
      const schemaId = pathParts[0];
      const pdfIndex = parseInt(pathParts[2]);
      
      const updatedSchema = schema.map(item => {
        if (item.unique_id === schemaId && item.pdf_attributes?.[pdfIndex]) {
          const updatedPdfAttrs = [...(item.pdf_attributes || [])];
          if (!updatedPdfAttrs[pdfIndex].linked_form_fields_text) {
            updatedPdfAttrs[pdfIndex].linked_form_fields_text = [];
          }
          if (!updatedPdfAttrs[pdfIndex].linked_form_fields_text!.includes(field.name)) {
            updatedPdfAttrs[pdfIndex].linked_form_fields_text!.push(field.name);
          }
          
          return {
            ...item,
            pdf_attributes: updatedPdfAttrs
          };
        }
        return item;
      });
      setSchema(updatedSchema);
      setLinkingMode(null);
      setNotification({
        isOpen: true,
        message: `Added linked text field: ${field.name}`,
        type: 'success',
        title: 'Text Field Linked'
      });
    }
    
    // Close confirmation popover
    setLinkConfirm({ isOpen: false, position: { x: 0, y: 0 }, field: null, linkingPath: '', linkingType: 'checkbox' });
  };

  const handleCreateGroup = () => {
    setShowGrouping(true);
  };

  const handleGroupCreated = (group: FieldGroup) => {
    setCurrentFieldGroup(group);
    setShowGrouping(false);
    setSelectedFields(new Set());
  };

  // Get all fields that are already grouped
  const getGroupedFields = (): Set<string> => {
    const grouped = new Set<string>();
    schema.forEach(item => {
      item.pdf_attributes?.forEach(attr => {
        if (typeof attr.formfield === 'string') {
          grouped.add(attr.formfield);
        } else if (Array.isArray(attr.formfield)) {
          attr.formfield.forEach(f => grouped.add(f));
        }
        attr.linked_form_fields_text?.forEach(f => grouped.add(f));
        attr.linked_form_fields_checkbox?.forEach(f => grouped.add(f.pdfAttribute));
        attr.linked_form_fields_radio?.forEach(f => grouped.add(f.radioField));
      });
    });
    return grouped;
  };

  // No PDF uploaded yet
  if (!pdfData) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 500,
            width: "100%",
            padding: 24,
            borderRadius: 8,
            border: "2px dashed #d1d5db",
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
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Create Group ({selectedFields.size} fields selected)
            </button>
          )}
          <button
            onClick={() => setSelectedFields(new Set())}
            style={{
              padding: "8px 16px",
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer"
            }}
            disabled={selectedFields.size === 0}
          >
            Clear Selection
          </button>
          {linkingMode && (
            <button
              onClick={() => setLinkingMode(null)}
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Cancel Linking Mode
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* PDF Viewer - Make it narrower when Visual Editor is active */}
        <div style={{ 
          flex: activeTab === "visual" ? "0 0 35%" : 1, 
          minWidth: activeTab === "visual" ? "350px" : undefined,
          borderRight: "1px solid #e5e7eb" 
        }}>
          {linkingMode && (
            <div style={{
              padding: "10px",
              background: "#fef3c7",
              borderBottom: "1px solid #fbbf24",
              fontSize: "14px"
            }}>
              🔗 Linking Mode Active: {
                linkingMode.linkingType === 'checkbox' ? 'Click on a grouped field in the PDF to link it to the checkbox option' :
                linkingMode.linkingType === 'date' ? 'Click on a grouped field in the PDF to add it as a date field' :
                'Click on any field in the PDF to add it as a linked text field'
              }
            </div>
          )}
          <PdfViewer
            pdfData={pdfData}
            onFieldsExtracted={setExtractedFields}
            selectedFields={selectedFields}
            onFieldClick={handleFieldClick}
            groupedFields={getGroupedFields()}
            linkingMode={!!linkingMode}
            highlightedField={highlightedField}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Schema Editor / TypeScript Export / Visual Editor - Give Visual Editor more space */}
        <div style={{ 
          flex: activeTab === "visual" ? "1 1 65%" : 1, 
          display: "flex", 
          flexDirection: "column",
          minWidth: 0  // Allow flexbox to shrink properly
        }}>
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
            <button
              onClick={() => setActiveTab("visual")}
              style={{
                padding: "10px 20px",
                background: activeTab === "visual" ? "white" : "transparent",
                border: "none",
                borderBottom: activeTab === "visual" ? "2px solid #2563eb" : "none",
                cursor: "pointer",
                fontWeight: activeTab === "visual" ? "bold" : "normal"
              }}
            >
              Visual Editor
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {activeTab === "editor" ? (
              <SchemaEditor
                schema={schema}
                onSchemaChange={setSchema}
                fieldGroup={currentFieldGroup}
                formType={formType}
                onStartLinking={(linkingPath: string, linkingType: 'checkbox' | 'date' | 'text') => 
                  setLinkingMode({ linkingPath, linkingType })}
                linkingMode={linkingMode}
                onHighlightField={setHighlightedField}
                onNavigateToPage={setCurrentPage}
              />
            ) : activeTab === "typescript" ? (
              <SchemaExport schema={schema} formType={formType} />
            ) : (
              <FormInputAdapter schema={schema} formType={formType} />
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
      
      {/* AI Logs Viewer - only show in development */}
      {process.env.NODE_ENV === 'development' && <AILogsViewer />}
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        title={notification.title}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
      
      {/* Link Confirmation Popover */}
      <LinkConfirmPopover
        isOpen={linkConfirm.isOpen}
        position={linkConfirm.position}
        fieldName={linkConfirm.linkingType === 'checkbox' ? 'checkbox option' : linkConfirm.linkingType}
        targetName={linkConfirm.field?.name || ''}
        onConfirm={handleLinkConfirm}
        onCancel={() => setLinkConfirm({ ...linkConfirm, isOpen: false })}
      />
    </div>
  );
}