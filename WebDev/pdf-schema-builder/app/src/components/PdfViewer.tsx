"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PDFField } from "@/types/schema";
import dynamic from "next/dynamic";

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// We'll set up the worker inside the component

interface PdfViewerProps {
  pdfData: ArrayBuffer;
  onFieldsExtracted: (fields: PDFField[]) => void;
  selectedFields: Set<string>;
  onFieldClick: (field: PDFField) => void;
}

export default function PdfViewer({ pdfData, onFieldsExtracted, selectedFields, onFieldClick }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfFields, setPdfFields] = useState<PDFField[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Set up worker when component mounts
  useEffect(() => {
    const setupWorker = async () => {
      if (typeof window !== "undefined") {
        const pdfjsLib = await import("react-pdf");
        const { pdfjs } = pdfjsLib;
        // Use local worker file to avoid CORS issues
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      }
    };
    setupWorker();
  }, []);

  const extractFormFields = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    try {
      const { pdfjs } = await import("react-pdf");
      // Create a copy of the ArrayBuffer to avoid detachment issues
      const pdfDataCopy = pdfData.slice(0);
      const loadingTask = pdfjs.getDocument({ data: pdfDataCopy });
      const pdf = await loadingTask.promise;
      const allFields: PDFField[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const annotations = await page.getAnnotations();

        annotations.forEach((annotation: any) => {
          if (annotation.fieldType) {
            let type: PDFField["type"] = "text";
            
            // Determine field type
            if (annotation.fieldType === "Tx") type = "text";
            else if (annotation.fieldType === "Ch") {
              if (annotation.checkBox) type = "checkbox";
              else type = "radio";
            } else if (annotation.fieldType === "Sig") type = "signature";
            else if (annotation.fieldType === "Btn") {
              if (annotation.checkBox) type = "checkbox";
              else if (annotation.radioButton) type = "radio";
              else type = "button";
            }

            const field: PDFField = {
              name: annotation.fieldName || `field_${pageNum}_${annotation.id}`,
              type,
              page: pageNum,
              rect: annotation.rect as [number, number, number, number],
              value: annotation.fieldValue,
              options: annotation.options?.map((opt: any) => opt.displayValue || opt.exportValue)
            };

            allFields.push(field);
          }
        });
      }

      setPdfFields(allFields);
      onFieldsExtracted(allFields);
    } catch (error) {
      console.error("Error extracting form fields:", error);
    }
  }, [pdfData, onFieldsExtracted]);

  useEffect(() => {
    extractFormFields();
    setIsLoading(false);
  }, [extractFormFields]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const getFieldsForCurrentPage = () => {
    return pdfFields.filter(field => field.page === currentPage);
  };

  return (
    <div className="pdf-viewer-container" style={{ position: "relative", height: "100%", overflow: "auto" }}>
      <div style={{ padding: "10px", borderBottom: "1px solid #ccc", background: "#f5f5f5" }}>
        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
          Previous
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {currentPage} of {numPages}
        </span>
        <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>
          Next
        </button>
        <span style={{ marginLeft: "20px" }}>
          Zoom:
          <button onClick={() => setScale(scale - 0.1)} style={{ marginLeft: "5px" }}>-</button>
          <span style={{ margin: "0 10px" }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(scale + 0.1)}>+</button>
        </span>
      </div>

      <div style={{ position: "relative", padding: "20px" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading PDF...</div>
        ) : pdfData ? (
          <Document 
            file={pdfData.slice(0)} 
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>No PDF data available</div>
        )}

        {/* Field Overlays */}
        {getFieldsForCurrentPage().map((field, index) => {
          const [x1, y1, x2, y2] = field.rect;
          const isSelected = selectedFields.has(field.name);
          
          return (
            <div
              key={`${field.name}_${index}_${field.page}`}
              onClick={() => onFieldClick(field)}
              style={{
                position: "absolute",
                left: `${x1 * scale + 20}px`,
                bottom: `${y1 * scale + 20}px`,
                width: `${(x2 - x1) * scale}px`,
                height: `${(y2 - y1) * scale}px`,
                border: `2px solid ${isSelected ? "#2563eb" : "#9ca3af"}`,
                backgroundColor: isSelected ? "rgba(37, 99, 235, 0.1)" : "rgba(156, 163, 175, 0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title={`${field.name} (${field.type})`}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isSelected 
                  ? "rgba(37, 99, 235, 0.2)" 
                  : "rgba(156, 163, 175, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected 
                  ? "rgba(37, 99, 235, 0.1)" 
                  : "rgba(156, 163, 175, 0.1)";
              }}
            />
          );
        })}
      </div>
    </div>
  );
}