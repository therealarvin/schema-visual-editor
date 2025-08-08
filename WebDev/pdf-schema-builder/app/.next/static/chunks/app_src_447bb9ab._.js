(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/src/lib/pdfStorage.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "arrayBufferToBase64": ()=>arrayBufferToBase64,
    "base64ToArrayBuffer": ()=>base64ToArrayBuffer,
    "loadPdfFromIndexedDB": ()=>loadPdfFromIndexedDB,
    "loadPdfFromLocalStorage": ()=>loadPdfFromLocalStorage,
    "persistPdf": ()=>persistPdf,
    "savePdfToIndexedDB": ()=>savePdfToIndexedDB,
    "savePdfToLocalStorage": ()=>savePdfToLocalStorage,
    "tryLoadPdf": ()=>tryLoadPdf
});
async function savePdfToIndexedDB(projectId, data) {
    if ("object" === "undefined" || !("indexedDB" in window)) {
        throw new Error("IndexedDB not available");
    }
    const db = await new Promise((resolve, reject)=>{
        const request = indexedDB.open("pdf-storage", 1);
        request.onupgradeneeded = ()=>{
            const db = request.result;
            if (!db.objectStoreNames.contains("pdfs")) {
                db.createObjectStore("pdfs");
            }
        };
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error);
    });
    await new Promise((resolve, reject)=>{
        const tx = db.transaction("pdfs", "readwrite");
        const store = tx.objectStore("pdfs");
        // Store as Blob to avoid structured clone large overhead
        const blob = new Blob([
            data
        ], {
            type: "application/pdf"
        });
        const req = store.put(blob, projectId);
        req.onsuccess = ()=>resolve();
        req.onerror = ()=>reject(req.error);
    });
}
async function loadPdfFromIndexedDB(projectId) {
    if ("object" === "undefined" || !("indexedDB" in window)) {
        return null;
    }
    const db = await new Promise((resolve, reject)=>{
        const request = indexedDB.open("pdf-storage", 1);
        request.onupgradeneeded = ()=>{
            const db = request.result;
            if (!db.objectStoreNames.contains("pdfs")) {
                db.createObjectStore("pdfs");
            }
        };
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error);
    });
    const blob = await new Promise((resolve, reject)=>{
        const tx = db.transaction("pdfs", "readonly");
        const store = tx.objectStore("pdfs");
        const req = store.get(projectId);
        req.onsuccess = ()=>resolve(req.result || null);
        req.onerror = ()=>reject(req.error);
    });
    if (!blob) return null;
    return await blob.arrayBuffer();
}
async function arrayBufferToBase64(ab) {
    // Use FileReader on a Blob to avoid large typed array conversions
    const blob = new Blob([
        ab
    ], {
        type: "application/pdf"
    });
    const dataUrl = await new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>resolve(reader.result);
        reader.onerror = ()=>reject(reader.error);
        reader.readAsDataURL(blob);
    });
    // data:[mime];base64,XXXX
    const commaIndex = dataUrl.indexOf(",");
    return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}
async function base64ToArrayBuffer(b64) {
    const res = await fetch("data:application/pdf;base64,".concat(b64));
    return await res.arrayBuffer();
}
function savePdfToLocalStorage(projectId, ab) {
    return arrayBufferToBase64(ab).then((b64)=>{
        localStorage.setItem("pdf:".concat(projectId), b64);
    });
}
function loadPdfFromLocalStorage(projectId) {
    const b64 = localStorage.getItem("pdf:".concat(projectId));
    if (!b64) return null;
    // Convert synchronously using fetch data URL trick
    // Note: returning Promise-like via async IIFE is not ideal for sync fn; keep it simple for now
    // Caller can use the async load function below instead if desired
    return null;
}
async function tryLoadPdf(projectId) {
    // Try IndexedDB first
    try {
        const fromIdb = await loadPdfFromIndexedDB(projectId);
        if (fromIdb) return fromIdb;
    } catch (e) {}
    // Fallback to localStorage
    const b64 = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem("pdf:".concat(projectId)) : "TURBOPACK unreachable";
    if (b64) {
        return await base64ToArrayBuffer(b64);
    }
    return null;
}
async function persistPdf(projectId, data) {
    // Prefer IndexedDB
    try {
        await savePdfToIndexedDB(projectId, data);
        return "idb";
    } catch (e) {
        // Fallback to localStorage for ≤20MB (caller enforces size limit)
        await savePdfToLocalStorage(projectId, data);
        return "localStorage";
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/lib/schemaStorage.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "deleteSchemaFromIndexedDB": ()=>deleteSchemaFromIndexedDB,
    "loadSchemaFromIndexedDB": ()=>loadSchemaFromIndexedDB,
    "saveSchemaToIndexedDB": ()=>saveSchemaToIndexedDB
});
async function saveSchemaToIndexedDB(projectId, schema) {
    if ("object" === "undefined" || !("indexedDB" in window)) {
        throw new Error("IndexedDB not available");
    }
    const db = await new Promise((resolve, reject)=>{
        const request = indexedDB.open("pdf-storage", 2); // Increment version
        request.onupgradeneeded = ()=>{
            const db = request.result;
            if (!db.objectStoreNames.contains("pdfs")) {
                db.createObjectStore("pdfs");
            }
            if (!db.objectStoreNames.contains("schemas")) {
                db.createObjectStore("schemas");
            }
        };
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error);
    });
    await new Promise((resolve, reject)=>{
        const tx = db.transaction("schemas", "readwrite");
        const store = tx.objectStore("schemas");
        const req = store.put(schema, projectId);
        req.onsuccess = ()=>resolve();
        req.onerror = ()=>reject(req.error);
    });
}
async function loadSchemaFromIndexedDB(projectId) {
    if ("object" === "undefined" || !("indexedDB" in window)) {
        return null;
    }
    const db = await new Promise((resolve, reject)=>{
        const request = indexedDB.open("pdf-storage", 2);
        request.onupgradeneeded = ()=>{
            const db = request.result;
            if (!db.objectStoreNames.contains("pdfs")) {
                db.createObjectStore("pdfs");
            }
            if (!db.objectStoreNames.contains("schemas")) {
                db.createObjectStore("schemas");
            }
        };
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error);
    });
    const schema = await new Promise((resolve, reject)=>{
        const tx = db.transaction("schemas", "readonly");
        const store = tx.objectStore("schemas");
        const req = store.get(projectId);
        req.onsuccess = ()=>resolve(req.result || null);
        req.onerror = ()=>reject(req.error);
    });
    return schema;
}
async function deleteSchemaFromIndexedDB(projectId) {
    if ("object" === "undefined" || !("indexedDB" in window)) {
        return;
    }
    const db = await new Promise((resolve, reject)=>{
        const request = indexedDB.open("pdf-storage", 2);
        request.onupgradeneeded = ()=>{
            const db = request.result;
            if (!db.objectStoreNames.contains("pdfs")) {
                db.createObjectStore("pdfs");
            }
            if (!db.objectStoreNames.contains("schemas")) {
                db.createObjectStore("schemas");
            }
        };
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error);
    });
    await new Promise((resolve, reject)=>{
        const tx = db.transaction("schemas", "readwrite");
        const store = tx.objectStore("schemas");
        const req = store.delete(projectId);
        req.onsuccess = ()=>resolve();
        req.onerror = ()=>reject(req.error);
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/stores/projects.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "useProjectsStore": ()=>useProjectsStore
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
"use client";
;
;
function genId() {
    // Simple unique-ish id for local usage
    return Math.random().toString(36).slice(2, 10);
}
const useProjectsStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        projects: [],
        addProject: (project)=>{
            var _project_id;
            const id = (_project_id = project.id) !== null && _project_id !== void 0 ? _project_id : genId();
            set((state)=>({
                    projects: [
                        ...state.projects,
                        {
                            id,
                            name: project.name,
                            formType: project.formType
                        }
                    ]
                }));
            return id;
        },
        renameProject: (id, name)=>set((state)=>({
                    projects: state.projects.map((p)=>p.id === id ? {
                            ...p,
                            name
                        } : p)
                })),
        deleteProject: (id)=>set((state)=>({
                    projects: state.projects.filter((p)=>p.id !== id)
                })),
        replaceAll: (projects)=>set({
                projects
            })
    }), {
    name: "psb_projects",
    version: 1,
    partialize: (state)=>({
            projects: state.projects
        }),
    // migrate just in case future shapes change
    migrate: (persisted, version)=>{
        if (!persisted) return {
            projects: []
        };
        return persisted;
    }
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/components/PdfViewer.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>PdfViewer
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
;
;
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// Dynamically import react-pdf to avoid SSR issues
const Document = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.r("[project]/node_modules/react-pdf/dist/index.js [app-client] (ecmascript, next/dynamic entry, async loader)")(__turbopack_context__.i).then((mod)=>mod.Document), {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-pdf/dist/index.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
_c = Document;
const Page = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.r("[project]/node_modules/react-pdf/dist/index.js [app-client] (ecmascript, next/dynamic entry, async loader)")(__turbopack_context__.i).then((mod)=>mod.Page), {
    loadableGenerated: {
        modules: [
            "[project]/node_modules/react-pdf/dist/index.js [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
_c1 = Page;
function PdfViewer(param) {
    let { pdfData, onFieldsExtracted, selectedFields, onFieldClick } = param;
    _s();
    const [numPages, setNumPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [scale, setScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1.0);
    const [pdfFields, setPdfFields] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Set up worker when component mounts
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PdfViewer.useEffect": ()=>{
            const setupWorker = {
                "PdfViewer.useEffect.setupWorker": async ()=>{
                    if ("TURBOPACK compile-time truthy", 1) {
                        const pdfjsLib = await __turbopack_context__.r("[project]/node_modules/react-pdf/dist/index.js [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
                        const { pdfjs } = pdfjsLib;
                        // Use local worker file to avoid CORS issues
                        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
                    }
                }
            }["PdfViewer.useEffect.setupWorker"];
            setupWorker();
        }
    }["PdfViewer.useEffect"], []);
    const extractFormFields = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "PdfViewer.useCallback[extractFormFields]": async ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            try {
                const { pdfjs } = await __turbopack_context__.r("[project]/node_modules/react-pdf/dist/index.js [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
                // Create a copy of the ArrayBuffer to avoid detachment issues
                const pdfDataCopy = pdfData.slice(0);
                const loadingTask = pdfjs.getDocument({
                    data: pdfDataCopy
                });
                const pdf = await loadingTask.promise;
                const allFields = [];
                for(let pageNum = 1; pageNum <= pdf.numPages; pageNum++){
                    const page = await pdf.getPage(pageNum);
                    const annotations = await page.getAnnotations();
                    annotations.forEach({
                        "PdfViewer.useCallback[extractFormFields]": (annotation)=>{
                            if (annotation.fieldType) {
                                var _annotation_options;
                                let type = "text";
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
                                const field = {
                                    name: annotation.fieldName || "field_".concat(pageNum, "_").concat(annotation.id),
                                    type,
                                    page: pageNum,
                                    rect: annotation.rect,
                                    value: annotation.fieldValue,
                                    options: (_annotation_options = annotation.options) === null || _annotation_options === void 0 ? void 0 : _annotation_options.map({
                                        "PdfViewer.useCallback[extractFormFields]": (opt)=>opt.displayValue || opt.exportValue
                                    }["PdfViewer.useCallback[extractFormFields]"])
                                };
                                allFields.push(field);
                            }
                        }
                    }["PdfViewer.useCallback[extractFormFields]"]);
                }
                setPdfFields(allFields);
                onFieldsExtracted(allFields);
            } catch (error) {
                console.error("Error extracting form fields:", error);
            }
        }
    }["PdfViewer.useCallback[extractFormFields]"], [
        pdfData,
        onFieldsExtracted
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PdfViewer.useEffect": ()=>{
            extractFormFields();
            setIsLoading(false);
        }
    }["PdfViewer.useEffect"], [
        extractFormFields
    ]);
    function onDocumentLoadSuccess(param) {
        let { numPages } = param;
        setNumPages(numPages);
    }
    const getFieldsForCurrentPage = ()=>{
        return pdfFields.filter((field)=>field.page === currentPage);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "pdf-viewer-container",
        style: {
            position: "relative",
            height: "100%",
            overflow: "auto"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "10px",
                    borderBottom: "1px solid #ccc",
                    background: "#f5f5f5"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage(Math.max(1, currentPage - 1)),
                        disabled: currentPage <= 1,
                        children: "Previous"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            margin: "0 10px"
                        },
                        children: [
                            "Page ",
                            currentPage,
                            " of ",
                            numPages
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage(Math.min(numPages, currentPage + 1)),
                        disabled: currentPage >= numPages,
                        children: "Next"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            marginLeft: "20px"
                        },
                        children: [
                            "Zoom:",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setScale(scale - 0.1),
                                style: {
                                    marginLeft: "5px"
                                },
                                children: "-"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/PdfViewer.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    margin: "0 10px"
                                },
                                children: [
                                    Math.round(scale * 100),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/components/PdfViewer.tsx",
                                lineNumber: 127,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setScale(scale + 0.1),
                                children: "+"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/PdfViewer.tsx",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/PdfViewer.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "relative",
                    padding: "20px"
                },
                children: [
                    isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: "center",
                            padding: "40px"
                        },
                        children: "Loading PDF..."
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 134,
                        columnNumber: 11
                    }, this) : pdfData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Document, {
                        file: pdfData.slice(0),
                        onLoadSuccess: onDocumentLoadSuccess,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Page, {
                            pageNumber: currentPage,
                            scale: scale,
                            renderAnnotationLayer: false,
                            renderTextLayer: false
                        }, void 0, false, {
                            fileName: "[project]/app/src/components/PdfViewer.tsx",
                            lineNumber: 140,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 136,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: "center",
                            padding: "40px"
                        },
                        children: "No PDF data available"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/PdfViewer.tsx",
                        lineNumber: 148,
                        columnNumber: 11
                    }, this),
                    getFieldsForCurrentPage().map((field, index)=>{
                        const [x1, y1, x2, y2] = field.rect;
                        const isSelected = selectedFields.has(field.name);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onClick: ()=>onFieldClick(field),
                            style: {
                                position: "absolute",
                                left: "".concat(x1 * scale + 20, "px"),
                                bottom: "".concat(y1 * scale + 20, "px"),
                                width: "".concat((x2 - x1) * scale, "px"),
                                height: "".concat((y2 - y1) * scale, "px"),
                                border: "2px solid ".concat(isSelected ? "#2563eb" : "#9ca3af"),
                                backgroundColor: isSelected ? "rgba(37, 99, 235, 0.1)" : "rgba(156, 163, 175, 0.1)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            },
                            title: "".concat(field.name, " (").concat(field.type, ")"),
                            onMouseEnter: (e)=>{
                                e.currentTarget.style.backgroundColor = isSelected ? "rgba(37, 99, 235, 0.2)" : "rgba(156, 163, 175, 0.2)";
                            },
                            onMouseLeave: (e)=>{
                                e.currentTarget.style.backgroundColor = isSelected ? "rgba(37, 99, 235, 0.1)" : "rgba(156, 163, 175, 0.1)";
                            }
                        }, "".concat(field.name, "_").concat(index, "_").concat(field.page), false, {
                            fileName: "[project]/app/src/components/PdfViewer.tsx",
                            lineNumber: 157,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/PdfViewer.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/src/components/PdfViewer.tsx",
        lineNumber: 113,
        columnNumber: 5
    }, this);
}
_s(PdfViewer, "hCd5sB50bXBHqvkz4hUgNN2W5qI=");
_c2 = PdfViewer;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Document");
__turbopack_context__.k.register(_c1, "Page");
__turbopack_context__.k.register(_c2, "PdfViewer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/components/FieldGrouping.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>FieldGrouping
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function FieldGrouping(param) {
    let { selectedFields, onCreateGroup, onCancel } = param;
    _s();
    const [groupType, setGroupType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [displayName, setDisplayName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Determine available group types based on selected fields
    const getAvailableGroupTypes = ()=>{
        if (selectedFields.length === 0) return [];
        const fieldTypes = new Set(selectedFields.map((f)=>f.type));
        if (fieldTypes.size === 1) {
            const type = selectedFields[0].type;
            if (type === "text") {
                return [
                    {
                        value: "text-continuation",
                        label: "Text Continuation (single value across multiple fields)"
                    },
                    {
                        value: "text-same-value",
                        label: "Same Value Linked Fields (duplicate value in each field)"
                    }
                ];
            } else if (type === "checkbox") {
                return [
                    {
                        value: "checkbox",
                        label: "Checkbox Group"
                    }
                ];
            } else if (type === "radio") {
                return [
                    {
                        value: "radio",
                        label: "Radio Button Group"
                    }
                ];
            }
        }
        return [];
    };
    const availableTypes = getAvailableGroupTypes();
    const handleCreate = ()=>{
        if (!groupType || !displayName) {
            alert("Please select a group type and enter a display name");
            return;
        }
        onCreateGroup({
            fields: selectedFields,
            groupType: groupType,
            displayName
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: "fixed",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "400px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                style: {
                    marginTop: 0
                },
                children: "Create Field Group"
            }, void 0, false, {
                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "15px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginBottom: "5px",
                            fontWeight: "bold"
                        },
                        children: [
                            "Selected Fields (",
                            selectedFields.length,
                            "):"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/FieldGrouping.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            maxHeight: "150px",
                            overflow: "auto",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            padding: "8px"
                        },
                        children: selectedFields.map((field)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "4px",
                                    background: "#f3f4f6",
                                    marginBottom: "4px",
                                    borderRadius: "2px",
                                    fontSize: "14px"
                                },
                                children: [
                                    field.name,
                                    " (",
                                    field.type,
                                    ")"
                                ]
                            }, field.name, true, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 83,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/FieldGrouping.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            availableTypes.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: "15px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: {
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold"
                                },
                                children: "Group Type:"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 99,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: groupType,
                                onChange: (e)=>setGroupType(e.target.value),
                                style: {
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Select a type..."
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                        lineNumber: 112,
                                        columnNumber: 15
                                    }, this),
                                    availableTypes.map((type)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: type.value,
                                            children: type.label
                                        }, type.value, false, {
                                            fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                            lineNumber: 114,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 102,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/FieldGrouping.tsx",
                        lineNumber: 98,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: "20px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                style: {
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "bold"
                                },
                                children: "Display Name:"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 122,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: displayName,
                                onChange: (e)=>setDisplayName(e.target.value),
                                placeholder: "Enter display name for this group",
                                style: {
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px"
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/FieldGrouping.tsx",
                        lineNumber: 121,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "10px",
                            justifyContent: "flex-end"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onCancel,
                                style: {
                                    padding: "8px 16px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    background: "white",
                                    cursor: "pointer"
                                },
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleCreate,
                                style: {
                                    padding: "8px 16px",
                                    border: "none",
                                    borderRadius: "4px",
                                    background: "#2563eb",
                                    color: "white",
                                    cursor: "pointer"
                                },
                                children: "Create Group"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/FieldGrouping.tsx",
                        lineNumber: 139,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    color: "#6b7280",
                    textAlign: "center",
                    padding: "20px"
                },
                children: "Please select fields of the same type to create a group."
            }, void 0, false, {
                fileName: "[project]/app/src/components/FieldGrouping.tsx",
                lineNumber: 168,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/src/components/FieldGrouping.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_s(FieldGrouping, "6wJciHFO6m/BGV8LTAc+BV85amA=");
_c = FieldGrouping;
var _c;
__turbopack_context__.k.register(_c, "FieldGrouping");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/components/SchemaItemEditor.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>SchemaItemEditor
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function SchemaItemEditor(param) {
    let { item, onSave, onCancel } = param;
    var _localItem_display_attributes_checkbox_options, _localItem_display_attributes_display_radio_options, _localItem_pdf_attributes;
    _s();
    const [localItem, setLocalItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(JSON.parse(JSON.stringify(item)));
    // Helper to update nested checkbox options
    const updateCheckboxOption = (index, field, value)=>{
        const newItem = {
            ...localItem
        };
        if (!newItem.display_attributes.checkbox_options) {
            newItem.display_attributes.checkbox_options = {
                options: []
            };
        }
        if (!newItem.display_attributes.checkbox_options.options[index]) {
            newItem.display_attributes.checkbox_options.options[index] = {
                display_name: "",
                databaseStored: "",
                linkedFields: []
            };
        }
        newItem.display_attributes.checkbox_options.options[index][field] = value;
        setLocalItem(newItem);
    };
    // Helper to add a new checkbox option
    const addCheckboxOption = ()=>{
        const newItem = {
            ...localItem
        };
        if (!newItem.display_attributes.checkbox_options) {
            newItem.display_attributes.checkbox_options = {
                options: []
            };
        }
        newItem.display_attributes.checkbox_options.options.push({
            display_name: "",
            databaseStored: "",
            linkedFields: []
        });
        setLocalItem(newItem);
    };
    // Helper to remove a checkbox option
    const removeCheckboxOption = (index)=>{
        var _newItem_display_attributes_checkbox_options;
        const newItem = {
            ...localItem
        };
        if ((_newItem_display_attributes_checkbox_options = newItem.display_attributes.checkbox_options) === null || _newItem_display_attributes_checkbox_options === void 0 ? void 0 : _newItem_display_attributes_checkbox_options.options) {
            newItem.display_attributes.checkbox_options.options.splice(index, 1);
        }
        setLocalItem(newItem);
    };
    // Helper to update PDF attributes
    const updatePdfAttribute = (index, field, value)=>{
        const newItem = {
            ...localItem
        };
        if (!newItem.pdf_attributes) {
            newItem.pdf_attributes = [];
        }
        if (!newItem.pdf_attributes[index]) {
            newItem.pdf_attributes[index] = {
                formType: "",
                formfield: ""
            };
        }
        newItem.pdf_attributes[index][field] = value;
        setLocalItem(newItem);
    };
    // Helper to add linked text field
    const addLinkedTextField = (pdfIndex)=>{
        var _newItem_pdf_attributes;
        const newItem = {
            ...localItem
        };
        if (!((_newItem_pdf_attributes = newItem.pdf_attributes) === null || _newItem_pdf_attributes === void 0 ? void 0 : _newItem_pdf_attributes[pdfIndex])) return;
        if (!newItem.pdf_attributes[pdfIndex].linked_form_fields_text) {
            newItem.pdf_attributes[pdfIndex].linked_form_fields_text = [];
        }
        newItem.pdf_attributes[pdfIndex].linked_form_fields_text.push("");
        setLocalItem(newItem);
    };
    // Helper to update linked text field
    const updateLinkedTextField = (pdfIndex, fieldIndex, value)=>{
        var _newItem_pdf_attributes_pdfIndex, _newItem_pdf_attributes;
        const newItem = {
            ...localItem
        };
        if ((_newItem_pdf_attributes = newItem.pdf_attributes) === null || _newItem_pdf_attributes === void 0 ? void 0 : (_newItem_pdf_attributes_pdfIndex = _newItem_pdf_attributes[pdfIndex]) === null || _newItem_pdf_attributes_pdfIndex === void 0 ? void 0 : _newItem_pdf_attributes_pdfIndex.linked_form_fields_text) {
            newItem.pdf_attributes[pdfIndex].linked_form_fields_text[fieldIndex] = value;
            setLocalItem(newItem);
        }
    };
    // Helper to remove linked text field
    const removeLinkedTextField = (pdfIndex, fieldIndex)=>{
        var _newItem_pdf_attributes_pdfIndex, _newItem_pdf_attributes;
        const newItem = {
            ...localItem
        };
        if ((_newItem_pdf_attributes = newItem.pdf_attributes) === null || _newItem_pdf_attributes === void 0 ? void 0 : (_newItem_pdf_attributes_pdfIndex = _newItem_pdf_attributes[pdfIndex]) === null || _newItem_pdf_attributes_pdfIndex === void 0 ? void 0 : _newItem_pdf_attributes_pdfIndex.linked_form_fields_text) {
            newItem.pdf_attributes[pdfIndex].linked_form_fields_text.splice(fieldIndex, 1);
            setLocalItem(newItem);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            background: "#f9fafb",
            maxHeight: "70vh",
            overflowY: "auto"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                style: {
                    marginBottom: "12px",
                    fontWeight: "bold"
                },
                children: "Basic Properties"
            }, void 0, false, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        },
                        children: "Unique ID:"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: localItem.unique_id || "",
                        onChange: (e)=>setLocalItem({
                                ...localItem,
                                unique_id: e.target.value
                            }),
                        style: {
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        },
                        children: "Display Name (Required):"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: localItem.display_attributes.display_name || "",
                        onChange: (e)=>setLocalItem({
                                ...localItem,
                                display_attributes: {
                                    ...localItem.display_attributes,
                                    display_name: e.target.value
                                }
                            }),
                        style: {
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        },
                        children: "Order (Required):"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "number",
                        value: localItem.display_attributes.order,
                        onChange: (e)=>setLocalItem({
                                ...localItem,
                                display_attributes: {
                                    ...localItem.display_attributes,
                                    order: parseInt(e.target.value) || 0
                                }
                            }),
                        style: {
                            width: "100px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        },
                        children: "Input Type:"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 174,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: localItem.display_attributes.input_type,
                        onChange: (e)=>setLocalItem({
                                ...localItem,
                                display_attributes: {
                                    ...localItem.display_attributes,
                                    input_type: e.target.value
                                }
                            }),
                        style: {
                            width: "200px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "text",
                                children: "Text"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 193,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "text-area",
                                children: "Text Area"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 194,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "radio",
                                children: "Radio"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "checkbox",
                                children: "Checkbox"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 196,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "signature",
                                children: "Signature"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 197,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "fileUpload",
                                children: "File Upload"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 198,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "info",
                                children: "Info"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 199,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 177,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        },
                        children: "Value Type:"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 204,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: localItem.display_attributes.value.type,
                        onChange: (e)=>setLocalItem({
                                ...localItem,
                                display_attributes: {
                                    ...localItem.display_attributes,
                                    value: {
                                        ...localItem.display_attributes.value,
                                        type: e.target.value
                                    }
                                }
                            }),
                        style: {
                            width: "200px",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "manual",
                                children: "Manual"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 226,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "resolved",
                                children: "Resolved (from database)"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 227,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "reserved",
                                children: "Reserved (computed)"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 228,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 203,
                columnNumber: 7
            }, this),
            localItem.display_attributes.value.type === "resolved" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginBottom: "12px",
                    paddingLeft: "20px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            fontWeight: "bold",
                            marginBottom: "4px"
                        },
                        children: "Database Field:"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 235,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: localItem.display_attributes.value.databaseField || "",
                        onChange: (e)=>setLocalItem({
                                ...localItem,
                                display_attributes: {
                                    ...localItem.display_attributes,
                                    value: {
                                        ...localItem.display_attributes.value,
                                        databaseField: e.target.value
                                    }
                                }
                            }),
                        placeholder: "e.g., user.name",
                        style: {
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 238,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 234,
                columnNumber: 9
            }, this),
            localItem.display_attributes.input_type === "checkbox" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                style: {
                    marginBottom: "12px"
                },
                open: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        style: {
                            cursor: "pointer",
                            fontWeight: "bold"
                        },
                        children: "Checkbox Options"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 265,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "8px",
                            paddingLeft: "16px"
                        },
                        children: [
                            (_localItem_display_attributes_checkbox_options = localItem.display_attributes.checkbox_options) === null || _localItem_display_attributes_checkbox_options === void 0 ? void 0 : _localItem_display_attributes_checkbox_options.options.map((option, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        border: "1px solid #d1d5db",
                                        borderRadius: "4px",
                                        padding: "8px",
                                        marginBottom: "8px"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginBottom: "4px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: option.display_name,
                                                onChange: (e)=>updateCheckboxOption(index, "display_name", e.target.value),
                                                placeholder: "Display Name",
                                                style: {
                                                    width: "45%",
                                                    marginRight: "10px",
                                                    padding: "4px",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "4px"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                lineNumber: 277,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: option.databaseStored,
                                                onChange: (e)=>updateCheckboxOption(index, "databaseStored", e.target.value),
                                                placeholder: "Database Value",
                                                style: {
                                                    width: "45%",
                                                    padding: "4px",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "4px"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                lineNumber: 290,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>removeCheckboxOption(index),
                                                style: {
                                                    marginLeft: "8px",
                                                    padding: "4px 8px",
                                                    background: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer"
                                                },
                                                children: "Remove"
                                            }, void 0, false, {
                                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                lineNumber: 302,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                        lineNumber: 276,
                                        columnNumber: 17
                                    }, this)
                                }, index, false, {
                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                    lineNumber: 270,
                                    columnNumber: 15
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: addCheckboxOption,
                                style: {
                                    padding: "4px 8px",
                                    background: "#10b981",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                },
                                children: "Add Option"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 319,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 268,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 264,
                columnNumber: 9
            }, this),
            localItem.display_attributes.input_type === "radio" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                style: {
                    marginBottom: "12px"
                },
                open: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        style: {
                            cursor: "pointer",
                            fontWeight: "bold"
                        },
                        children: "Radio Options"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 339,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "8px",
                            paddingLeft: "16px"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                            value: ((_localItem_display_attributes_display_radio_options = localItem.display_attributes.display_radio_options) === null || _localItem_display_attributes_display_radio_options === void 0 ? void 0 : _localItem_display_attributes_display_radio_options.join("\n")) || "",
                            onChange: (e)=>setLocalItem({
                                    ...localItem,
                                    display_attributes: {
                                        ...localItem.display_attributes,
                                        display_radio_options: e.target.value.split("\n").filter((s)=>s.trim())
                                    }
                                }),
                            placeholder: "Enter radio options (one per line)",
                            style: {
                                width: "100%",
                                minHeight: "80px",
                                padding: "8px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px"
                            }
                        }, void 0, false, {
                            fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                            lineNumber: 343,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 342,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 338,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                style: {
                    marginBottom: "12px"
                },
                open: true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        style: {
                            cursor: "pointer",
                            fontWeight: "bold"
                        },
                        children: "PDF Attributes"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 367,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "8px",
                            paddingLeft: "16px"
                        },
                        children: [
                            (_localItem_pdf_attributes = localItem.pdf_attributes) === null || _localItem_pdf_attributes === void 0 ? void 0 : _localItem_pdf_attributes.map((pdfAttr, pdfIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        border: "1px solid #d1d5db",
                                        borderRadius: "4px",
                                        padding: "8px",
                                        marginBottom: "8px"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginBottom: "8px"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        fontWeight: "bold"
                                                    },
                                                    children: "Form Type:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 379,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: pdfAttr.formType || "",
                                                    onChange: (e)=>updatePdfAttribute(pdfIndex, "formType", e.target.value),
                                                    style: {
                                                        marginLeft: "8px",
                                                        padding: "4px",
                                                        border: "1px solid #d1d5db",
                                                        borderRadius: "4px"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 380,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                            lineNumber: 378,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginBottom: "8px"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        fontWeight: "bold"
                                                    },
                                                    children: "Form Field:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 394,
                                                    columnNumber: 17
                                                }, this),
                                                Array.isArray(pdfAttr.formfield) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                    value: pdfAttr.formfield.join("\n"),
                                                    onChange: (e)=>updatePdfAttribute(pdfIndex, "formfield", e.target.value.split("\n").filter((s)=>s.trim())),
                                                    placeholder: "Enter form fields (one per line)",
                                                    style: {
                                                        width: "100%",
                                                        minHeight: "60px",
                                                        marginTop: "4px",
                                                        padding: "4px",
                                                        border: "1px solid #d1d5db",
                                                        borderRadius: "4px"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 19
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: pdfAttr.formfield || "",
                                                    onChange: (e)=>updatePdfAttribute(pdfIndex, "formfield", e.target.value),
                                                    style: {
                                                        marginLeft: "8px",
                                                        padding: "4px",
                                                        border: "1px solid #d1d5db",
                                                        borderRadius: "4px"
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 410,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                            lineNumber: 393,
                                            columnNumber: 15
                                        }, this),
                                        pdfAttr.linked_form_fields_text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginBottom: "8px"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        fontWeight: "bold"
                                                    },
                                                    children: "Linked Text Fields:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 427,
                                                    columnNumber: 19
                                                }, this),
                                                pdfAttr.linked_form_fields_text.map((field, fieldIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            marginTop: "4px"
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "text",
                                                                value: field,
                                                                onChange: (e)=>updateLinkedTextField(pdfIndex, fieldIndex, e.target.value),
                                                                style: {
                                                                    width: "70%",
                                                                    padding: "4px",
                                                                    border: "1px solid #d1d5db",
                                                                    borderRadius: "4px"
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                                lineNumber: 430,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>removeLinkedTextField(pdfIndex, fieldIndex),
                                                                style: {
                                                                    marginLeft: "8px",
                                                                    padding: "4px 8px",
                                                                    background: "#ef4444",
                                                                    color: "white",
                                                                    border: "none",
                                                                    borderRadius: "4px",
                                                                    cursor: "pointer"
                                                                },
                                                                children: "Remove"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                                lineNumber: 441,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, fieldIndex, true, {
                                                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                        lineNumber: 429,
                                                        columnNumber: 21
                                                    }, this)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>addLinkedTextField(pdfIndex),
                                                    style: {
                                                        marginTop: "4px",
                                                        padding: "4px 8px",
                                                        background: "#10b981",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer"
                                                    },
                                                    children: "Add Linked Field"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 457,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                            lineNumber: 426,
                                            columnNumber: 17
                                        }, this),
                                        pdfAttr.linked_form_fields_checkbox && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginBottom: "8px"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        fontWeight: "bold"
                                                    },
                                                    children: "Linked Checkbox Fields:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 477,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "12px",
                                                        color: "#666",
                                                        marginTop: "4px"
                                                    },
                                                    children: "(Edit these in the checkbox options above)"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 478,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                            lineNumber: 476,
                                            columnNumber: 17
                                        }, this),
                                        pdfAttr.linked_form_fields_radio && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginBottom: "8px"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    style: {
                                                        fontWeight: "bold"
                                                    },
                                                    children: "Linked Radio Fields:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 487,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: "12px",
                                                        color: "#666",
                                                        marginTop: "4px"
                                                    },
                                                    children: "(Edit these in the radio options above)"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                                    lineNumber: 488,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                            lineNumber: 486,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, pdfIndex, true, {
                                    fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                    lineNumber: 372,
                                    columnNumber: 13
                                }, this)),
                            (!localItem.pdf_attributes || localItem.pdf_attributes.length === 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    const newItem = {
                                        ...localItem
                                    };
                                    if (!newItem.pdf_attributes) newItem.pdf_attributes = [];
                                    newItem.pdf_attributes.push({
                                        formType: "",
                                        formfield: ""
                                    });
                                    setLocalItem(newItem);
                                },
                                style: {
                                    padding: "4px 8px",
                                    background: "#10b981",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                },
                                children: "Add PDF Attribute"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 497,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 370,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 366,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        style: {
                            cursor: "pointer",
                            fontWeight: "bold"
                        },
                        children: "Additional Properties"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 521,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "8px",
                            paddingLeft: "16px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: localItem.display_attributes.isRequired || false,
                                        onChange: (e)=>setLocalItem({
                                                ...localItem,
                                                display_attributes: {
                                                    ...localItem.display_attributes,
                                                    isRequired: e.target.checked
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                        lineNumber: 526,
                                        columnNumber: 13
                                    }, this),
                                    " Required"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 525,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 538,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: localItem.display_attributes.isHidden || false,
                                        onChange: (e)=>setLocalItem({
                                                ...localItem,
                                                display_attributes: {
                                                    ...localItem.display_attributes,
                                                    isHidden: e.target.checked
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                        lineNumber: 540,
                                        columnNumber: 13
                                    }, this),
                                    " Hidden"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 539,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 552,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: localItem.display_attributes.isCached || false,
                                        onChange: (e)=>setLocalItem({
                                                ...localItem,
                                                display_attributes: {
                                                    ...localItem.display_attributes,
                                                    isCached: e.target.checked
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                        lineNumber: 554,
                                        columnNumber: 13
                                    }, this),
                                    " Cached"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 553,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 566,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: localItem.display_attributes.isOnlyDisplayText || false,
                                        onChange: (e)=>setLocalItem({
                                                ...localItem,
                                                display_attributes: {
                                                    ...localItem.display_attributes,
                                                    isOnlyDisplayText: e.target.checked
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                        lineNumber: 568,
                                        columnNumber: 13
                                    }, this),
                                    " Only Display Text"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 567,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 524,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 520,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                style: {
                    marginBottom: "12px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                        style: {
                            cursor: "pointer",
                            fontWeight: "bold"
                        },
                        children: "Raw JSON Editor"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 585,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "8px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: JSON.stringify(localItem, null, 2),
                                onChange: (e)=>{
                                    try {
                                        const parsed = JSON.parse(e.target.value);
                                        setLocalItem(parsed);
                                    } catch (err) {
                                    // Invalid JSON, don't update
                                    }
                                },
                                style: {
                                    width: "100%",
                                    minHeight: "200px",
                                    padding: "8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    fontFamily: "monospace",
                                    fontSize: "12px"
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 589,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: "12px",
                                    color: "#666",
                                    marginTop: "4px"
                                },
                                children: "Warning: Invalid JSON will be ignored"
                            }, void 0, false, {
                                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                                lineNumber: 609,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 588,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 584,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "16px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onCancel,
                        style: {
                            padding: "6px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            background: "white",
                            cursor: "pointer"
                        },
                        children: "Cancel"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 617,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>onSave(localItem),
                        disabled: !localItem.display_attributes.display_name || !localItem.display_attributes.order,
                        style: {
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            background: "#2563eb",
                            color: "white",
                            cursor: "pointer",
                            opacity: !localItem.display_attributes.display_name || !localItem.display_attributes.order ? 0.5 : 1
                        },
                        children: "Save"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                        lineNumber: 629,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
                lineNumber: 616,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/src/components/SchemaItemEditor.tsx",
        lineNumber: 98,
        columnNumber: 5
    }, this);
}
_s(SchemaItemEditor, "BbYVIl7sVUJ+NFA/avM9VdulKK4=");
_c = SchemaItemEditor;
var _c;
__turbopack_context__.k.register(_c, "SchemaItemEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/components/SchemaEditor.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>SchemaEditor
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaItemEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/components/SchemaItemEditor.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function SchemaEditor(param) {
    let { schema, onSchemaChange, fieldGroup, formType } = param;
    _s();
    const [editingItem, setEditingItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [newItem, setNewItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Generate schema item from field group
    const generateSchemaItem = (group)=>{
        const firstField = group.fields[0];
        const uniqueId = firstField.name;
        const baseItem = {
            unique_id: uniqueId,
            display_attributes: {
                display_name: group.displayName || "",
                input_type: "text",
                order: schema.length + 1,
                value: {
                    type: "manual"
                }
            }
        };
        // Generate pdf_attributes based on group type
        if (group.groupType === "text-continuation") {
            baseItem.display_attributes.input_type = "text";
            baseItem.pdf_attributes = [
                {
                    formType,
                    formfield: firstField.name,
                    linked_form_fields_text: group.fields.slice(1).map((f)=>f.name)
                }
            ];
        } else if (group.groupType === "text-same-value") {
            baseItem.display_attributes.input_type = "text";
            baseItem.pdf_attributes = group.fields.map((field)=>({
                    formType,
                    formfield: field.name
                }));
        } else if (group.groupType === "checkbox") {
            baseItem.display_attributes.input_type = "checkbox";
            baseItem.display_attributes.checkbox_options = {
                options: group.fields.map((field)=>({
                        display_name: field.name,
                        databaseStored: field.name,
                        linkedFields: []
                    }))
            };
            baseItem.pdf_attributes = [
                {
                    formType,
                    formfield: firstField.name,
                    linked_form_fields_checkbox: group.fields.map((field)=>({
                            fromDatabase: field.name,
                            pdfAttribute: field.name
                        }))
                }
            ];
        } else if (group.groupType === "radio") {
            baseItem.display_attributes.input_type = "radio";
            baseItem.display_attributes.display_radio_options = group.fields.map((f)=>f.name);
            baseItem.pdf_attributes = [
                {
                    formType,
                    formfield: group.fields.map((f)=>f.name),
                    linked_form_fields_radio: group.fields.map((field)=>({
                            radioField: field.name,
                            displayName: field.name
                        }))
                }
            ];
        }
        return baseItem;
    };
    // Add new schema item from field group
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "SchemaEditor.useEffect": ()=>{
            if (fieldGroup) {
                const newSchemaItem = generateSchemaItem(fieldGroup);
                setNewItem(newSchemaItem);
                setEditingItem(newSchemaItem.unique_id);
            }
        }
    }["SchemaEditor.useEffect"], [
        fieldGroup
    ]);
    const handleSaveItem = (item)=>{
        if (newItem && item.unique_id === newItem.unique_id) {
            // Adding new item
            onSchemaChange([
                ...schema,
                item
            ]);
            setNewItem(null);
        } else {
            // Updating existing item
            onSchemaChange(schema.map((s)=>s.unique_id === item.unique_id ? item : s));
        }
        setEditingItem(null);
    };
    const handleDeleteItem = (uniqueId)=>{
        onSchemaChange(schema.filter((s)=>s.unique_id !== uniqueId));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: "100%",
            overflow: "auto",
            padding: "20px"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Schema Editor"
            }, void 0, false, {
                fileName: "[project]/app/src/components/SchemaEditor.tsx",
                lineNumber: 109,
                columnNumber: 7
            }, this),
            newItem && editingItem === newItem.unique_id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "New Schema Item"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaEditor.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaItemEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        item: newItem,
                        onSave: handleSaveItem,
                        onCancel: ()=>setEditingItem(null)
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaEditor.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaEditor.tsx",
                lineNumber: 112,
                columnNumber: 9
            }, this),
            schema.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "12px"
                    },
                    children: editingItem === item.unique_id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaItemEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        item: item,
                        onSave: handleSaveItem,
                        onCancel: ()=>setEditingItem(null)
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaEditor.tsx",
                        lineNumber: 130,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: item.display_attributes.display_name || item.unique_id
                                        }, void 0, false, {
                                            fileName: "[project]/app/src/components/SchemaEditor.tsx",
                                            lineNumber: 139,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: "14px",
                                                color: "#6b7280"
                                            },
                                            children: [
                                                "Type: ",
                                                item.display_attributes.input_type,
                                                " | Order: ",
                                                item.display_attributes.order
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/src/components/SchemaEditor.tsx",
                                            lineNumber: 140,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/src/components/SchemaEditor.tsx",
                                    lineNumber: 138,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: "flex",
                                        gap: "8px"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setEditingItem(item.unique_id),
                                            style: {
                                                padding: "4px 8px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "4px",
                                                background: "white",
                                                cursor: "pointer",
                                                fontSize: "14px"
                                            },
                                            children: "Edit"
                                        }, void 0, false, {
                                            fileName: "[project]/app/src/components/SchemaEditor.tsx",
                                            lineNumber: 145,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handleDeleteItem(item.unique_id),
                                            style: {
                                                padding: "4px 8px",
                                                border: "1px solid #ef4444",
                                                borderRadius: "4px",
                                                background: "#fee2e2",
                                                color: "#dc2626",
                                                cursor: "pointer",
                                                fontSize: "14px"
                                            },
                                            children: "Delete"
                                        }, void 0, false, {
                                            fileName: "[project]/app/src/components/SchemaEditor.tsx",
                                            lineNumber: 158,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/src/components/SchemaEditor.tsx",
                                    lineNumber: 144,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/src/components/SchemaEditor.tsx",
                            lineNumber: 137,
                            columnNumber: 15
                        }, this)
                    }, void 0, false)
                }, item.unique_id, false, {
                    fileName: "[project]/app/src/components/SchemaEditor.tsx",
                    lineNumber: 123,
                    columnNumber: 9
                }, this)),
            schema.length === 0 && !newItem && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: "center",
                    padding: "40px",
                    color: "#6b7280"
                },
                children: "Select fields from the PDF to create schema items."
            }, void 0, false, {
                fileName: "[project]/app/src/components/SchemaEditor.tsx",
                lineNumber: 180,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/src/components/SchemaEditor.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, this);
}
_s(SchemaEditor, "T3H1QTl0VemEyIIpZ764t+KXrnE=");
_c = SchemaEditor;
var _c;
__turbopack_context__.k.register(_c, "SchemaEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/components/SchemaExport.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>SchemaExport
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function SchemaExport(param) {
    let { schema, formType } = param;
    const generateTypeScript = ()=>{
        const schemaName = formType.replace(/[^a-zA-Z0-9]/g, "_");
        const schemaString = JSON.stringify(schema, (key, value)=>{
            // Handle function serialization for attribute operations
            if (key === "operation" || key === "reverseOperation") {
                return undefined; // Skip functions in JSON
            }
            return value;
        }, 2);
        return "import { Schema, SchemaItem } from '@/types/schema';\n\nexport const ".concat(schemaName, "_schema: Schema = ").concat(schemaString, ";\n\nexport default ").concat(schemaName, "_schema;");
    };
    const copyToClipboard = ()=>{
        navigator.clipboard.writeText(generateTypeScript());
        alert("Schema copied to clipboard!");
    };
    const downloadFile = ()=>{
        const blob = new Blob([
            generateTypeScript()
        ], {
            type: "text/typescript"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "".concat(formType, "_schema.ts");
        a.click();
        URL.revokeObjectURL(url);
    };
    const downloadJSON = ()=>{
        const blob = new Blob([
            JSON.stringify(schema, null, 2)
        ], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "".concat(formType, "_schema.json");
        a.click();
        URL.revokeObjectURL(url);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: "100%",
            display: "flex",
            flexDirection: "column"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "10px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        style: {
                            margin: 0,
                            flex: 1
                        },
                        children: "TypeScript Schema Export"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaExport.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: copyToClipboard,
                        style: {
                            padding: "6px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            background: "white",
                            cursor: "pointer"
                        },
                        children: "Copy to Clipboard"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaExport.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: downloadFile,
                        style: {
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            background: "#2563eb",
                            color: "white",
                            cursor: "pointer"
                        },
                        children: "Download .ts"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaExport.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: downloadJSON,
                        style: {
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            background: "#10b981",
                            color: "white",
                            cursor: "pointer"
                        },
                        children: "Download .json"
                    }, void 0, false, {
                        fileName: "[project]/app/src/components/SchemaExport.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/components/SchemaExport.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                style: {
                    flex: 1,
                    margin: 0,
                    padding: "20px",
                    background: "#1e293b",
                    color: "#e2e8f0",
                    overflow: "auto",
                    fontSize: "14px",
                    lineHeight: "1.5"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                    children: generateTypeScript()
                }, void 0, false, {
                    fileName: "[project]/app/src/components/SchemaExport.tsx",
                    lineNumber: 115,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/src/components/SchemaExport.tsx",
                lineNumber: 105,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/src/components/SchemaExport.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_c = SchemaExport;
var _c;
__turbopack_context__.k.register(_c, "SchemaExport");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/src/app/[projectId]/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": ()=>ProjectPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$lib$2f$pdfStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/lib/pdfStorage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$lib$2f$schemaStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/lib/schemaStorage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$stores$2f$projects$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/stores/projects.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$PdfViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/components/PdfViewer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$FieldGrouping$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/components/FieldGrouping.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/components/SchemaEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaExport$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/src/components/SchemaExport.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
function humanSize(bytes) {
    if (bytes < 1024) return "".concat(bytes, " B");
    if (bytes < 1024 * 1024) return "".concat((bytes / 1024).toFixed(1), " KB");
    return "".concat((bytes / (1024 * 1024)).toFixed(2), " MB");
}
function ProjectPage() {
    _s();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const projectId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ProjectPage.useMemo[projectId]": ()=>{
            var _params_projectId, _ref;
            return String((_ref = (_params_projectId = params === null || params === void 0 ? void 0 : params.projectId) !== null && _params_projectId !== void 0 ? _params_projectId : params === null || params === void 0 ? void 0 : params.projectid) !== null && _ref !== void 0 ? _ref : "unknown");
        }
    }["ProjectPage.useMemo[projectId]"], [
        params
    ]);
    // Get project from store to get formType
    const projects = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$stores$2f$projects$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProjectsStore"])({
        "ProjectPage.useProjectsStore[projects]": (s)=>s.projects
    }["ProjectPage.useProjectsStore[projects]"]);
    const project = projects.find((p)=>p.id === projectId);
    const formType = (project === null || project === void 0 ? void 0 : project.formType) || "default";
    const [pdfData, setPdfData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [fileName, setFileName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Schema builder state
    const [schema, setSchema] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedFields, setSelectedFields] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [extractedFields, setExtractedFields] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [showGrouping, setShowGrouping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentFieldGroup, setCurrentFieldGroup] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("editor");
    // Load PDF and schema on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProjectPage.useEffect": ()=>{
            let mounted = true;
            ({
                "ProjectPage.useEffect": async ()=>{
                    const loaded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$lib$2f$pdfStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["tryLoadPdf"])(projectId);
                    if (mounted && loaded) {
                        setPdfData(loaded);
                        setStatus("Loaded PDF from storage");
                    }
                    const loadedSchema = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$lib$2f$schemaStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["loadSchemaFromIndexedDB"])(projectId);
                    if (mounted && loadedSchema) {
                        setSchema(loadedSchema);
                    }
                }
            })["ProjectPage.useEffect"]();
            return ({
                "ProjectPage.useEffect": ()=>{
                    mounted = false;
                }
            })["ProjectPage.useEffect"];
        }
    }["ProjectPage.useEffect"], [
        projectId
    ]);
    // Save schema whenever it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProjectPage.useEffect": ()=>{
            if (schema.length > 0) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$lib$2f$schemaStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveSchemaToIndexedDB"])(projectId, schema).catch(console.error);
            }
        }
    }["ProjectPage.useEffect"], [
        schema,
        projectId
    ]);
    const onFiles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProjectPage.useCallback[onFiles]": async (files)=>{
            setError(null);
            setStatus(null);
            const file = files && files[0];
            if (!file) return;
            if (file.type !== "application/pdf") {
                setError("Please upload a PDF file.");
                return;
            }
            if (file.size > MAX_BYTES) {
                setError("File too large. Max size is 20 MB. Selected: ".concat(humanSize(file.size)));
                return;
            }
            try {
                setFileName(file.name);
                const arrayBuffer = await file.arrayBuffer();
                setPdfData(arrayBuffer);
                const where = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$lib$2f$pdfStorage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persistPdf"])(projectId, arrayBuffer);
                setStatus("Saved to ".concat(where));
            } catch (e) {
                console.error(e);
                setError((e === null || e === void 0 ? void 0 : e.message) || "Failed to read/save file.");
            }
        }
    }["ProjectPage.useCallback[onFiles]"], [
        projectId
    ]);
    const onDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProjectPage.useCallback[onDrop]": (e)=>{
            var _dt_files;
            e.preventDefault();
            e.stopPropagation();
            const dt = e.dataTransfer;
            if (dt === null || dt === void 0 ? void 0 : (_dt_files = dt.files) === null || _dt_files === void 0 ? void 0 : _dt_files.length) {
                void onFiles(dt.files);
            }
        }
    }["ProjectPage.useCallback[onDrop]"], [
        onFiles
    ]);
    const onDragOver = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProjectPage.useCallback[onDragOver]": (e)=>{
            e.preventDefault();
            e.stopPropagation();
        }
    }["ProjectPage.useCallback[onDragOver]"], []);
    const onInputChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ProjectPage.useCallback[onInputChange]": (e)=>{
            if (e.target.files) void onFiles(e.target.files);
        }
    }["ProjectPage.useCallback[onInputChange]"], [
        onFiles
    ]);
    const handleFieldClick = (field)=>{
        const newSelected = new Set(selectedFields);
        if (newSelected.has(field.name)) {
            newSelected.delete(field.name);
        } else {
            newSelected.add(field.name);
        }
        setSelectedFields(newSelected);
    };
    const handleCreateGroup = ()=>{
        const selected = extractedFields.filter((f)=>selectedFields.has(f.name));
        if (selected.length === 0) {
            alert("Please select at least one field");
            return;
        }
        setShowGrouping(true);
    };
    const handleGroupCreated = (group)=>{
        setCurrentFieldGroup(group);
        setShowGrouping(false);
        setSelectedFields(new Set());
    };
    if (!pdfData) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                padding: 24
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: [
                        "Project: ",
                        projectId
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/src/app/[projectId]/page.tsx",
                    lineNumber: 142,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onDrop: onDrop,
                    onDragOver: onDragOver,
                    style: {
                        marginTop: 16,
                        border: "2px dashed #999",
                        borderRadius: 12,
                        padding: 32,
                        textAlign: "center",
                        background: "#fafafa",
                        cursor: "pointer"
                    },
                    onClick: ()=>{
                        const input = document.getElementById("pdf-input");
                        input === null || input === void 0 ? void 0 : input.click();
                    },
                    role: "button",
                    "aria-label": "Upload PDF",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                marginBottom: 8
                            },
                            children: "Drag and drop a PDF here, or click to select"
                        }, void 0, false, {
                            fileName: "[project]/app/src/app/[projectId]/page.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            id: "pdf-input",
                            type: "file",
                            accept: "application/pdf",
                            style: {
                                display: "none"
                            },
                            onChange: onInputChange
                        }, void 0, false, {
                            fileName: "[project]/app/src/app/[projectId]/page.tsx",
                            lineNumber: 163,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                fontSize: 12,
                                color: "#666"
                            },
                            children: "Max size: 20 MB"
                        }, void 0, false, {
                            fileName: "[project]/app/src/app/[projectId]/page.tsx",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/src/app/[projectId]/page.tsx",
                    lineNumber: 143,
                    columnNumber: 9
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        color: "#b00020",
                        marginTop: 12
                    },
                    children: error
                }, void 0, false, {
                    fileName: "[project]/app/src/app/[projectId]/page.tsx",
                    lineNumber: 174,
                    columnNumber: 11
                }, this),
                status && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        color: "#0a7",
                        marginTop: 12
                    },
                    children: status
                }, void 0, false, {
                    fileName: "[project]/app/src/app/[projectId]/page.tsx",
                    lineNumber: 177,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/src/app/[projectId]/page.tsx",
            lineNumber: 141,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: "100vh",
            display: "flex",
            flexDirection: "column"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    padding: "10px 20px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        style: {
                            margin: 0,
                            fontSize: "20px"
                        },
                        children: [
                            "Project: ",
                            (project === null || project === void 0 ? void 0 : project.name) || projectId,
                            " (",
                            formType,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/app/[projectId]/page.tsx",
                        lineNumber: 193,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            gap: "10px"
                        },
                        children: [
                            selectedFields.size > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleCreateGroup,
                                style: {
                                    padding: "8px 16px",
                                    background: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                },
                                children: [
                                    "Create Group (",
                                    selectedFields.size,
                                    " fields selected)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                lineNumber: 198,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSelectedFields(new Set()),
                                disabled: selectedFields.size === 0,
                                style: {
                                    padding: "8px 16px",
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    opacity: selectedFields.size === 0 ? 0.5 : 1
                                },
                                children: "Clear Selection"
                            }, void 0, false, {
                                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/app/[projectId]/page.tsx",
                        lineNumber: 196,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                lineNumber: 185,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    flex: 1,
                    display: "flex",
                    overflow: "hidden"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "50%",
                            borderRight: "1px solid #e5e7eb",
                            overflow: "auto"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$PdfViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            pdfData: pdfData,
                            onFieldsExtracted: setExtractedFields,
                            selectedFields: selectedFields,
                            onFieldClick: handleFieldClick
                        }, void 0, false, {
                            fileName: "[project]/app/src/app/[projectId]/page.tsx",
                            lineNumber: 236,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/src/app/[projectId]/page.tsx",
                        lineNumber: 231,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "50%",
                            display: "flex",
                            flexDirection: "column"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    borderBottom: "1px solid #e5e7eb",
                                    background: "#f9fafb"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setActiveTab("editor"),
                                        style: {
                                            padding: "10px 20px",
                                            background: activeTab === "editor" ? "white" : "transparent",
                                            border: "none",
                                            borderBottom: activeTab === "editor" ? "2px solid #2563eb" : "none",
                                            cursor: "pointer",
                                            fontWeight: activeTab === "editor" ? "bold" : "normal"
                                        },
                                        children: "Schema Editor"
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                        lineNumber: 251,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setActiveTab("typescript"),
                                        style: {
                                            padding: "10px 20px",
                                            background: activeTab === "typescript" ? "white" : "transparent",
                                            border: "none",
                                            borderBottom: activeTab === "typescript" ? "2px solid #2563eb" : "none",
                                            cursor: "pointer",
                                            fontWeight: activeTab === "typescript" ? "bold" : "normal"
                                        },
                                        children: "TypeScript Export"
                                    }, void 0, false, {
                                        fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                        lineNumber: 264,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                lineNumber: 246,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    overflow: "auto"
                                },
                                children: activeTab === "editor" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    schema: schema,
                                    onSchemaChange: setSchema,
                                    fieldGroup: currentFieldGroup,
                                    formType: formType
                                }, void 0, false, {
                                    fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                    lineNumber: 281,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$SchemaExport$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    schema: schema,
                                    formType: formType
                                }, void 0, false, {
                                    fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                    lineNumber: 288,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                                lineNumber: 279,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/src/app/[projectId]/page.tsx",
                        lineNumber: 245,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                lineNumber: 229,
                columnNumber: 7
            }, this),
            showGrouping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$components$2f$FieldGrouping$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                selectedFields: extractedFields.filter((f)=>selectedFields.has(f.name)),
                onCreateGroup: handleGroupCreated,
                onCancel: ()=>setShowGrouping(false)
            }, void 0, false, {
                fileName: "[project]/app/src/app/[projectId]/page.tsx",
                lineNumber: 296,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/src/app/[projectId]/page.tsx",
        lineNumber: 184,
        columnNumber: 5
    }, this);
}
_s(ProjectPage, "1HlGGP31kN79SkFE682ubN85DIc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$src$2f$stores$2f$projects$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProjectsStore"]
    ];
});
_c = ProjectPage;
var _c;
__turbopack_context__.k.register(_c, "ProjectPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_src_447bb9ab._.js.map