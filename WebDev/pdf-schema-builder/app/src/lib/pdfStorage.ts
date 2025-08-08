export async function savePdfToIndexedDB(projectId: string, data: ArrayBuffer): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("IndexedDB not available");
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pdf-storage", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("pdfs", "readwrite");
    const store = tx.objectStore("pdfs");
    // Store as Blob to avoid structured clone large overhead
    const blob = new Blob([data], { type: "application/pdf" });
    const req = store.put(blob, projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadPdfFromIndexedDB(projectId: string): Promise<ArrayBuffer | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pdf-storage", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction("pdfs", "readonly");
    const store = tx.objectStore("pdfs");
    const req = store.get(projectId);
    req.onsuccess = () => resolve((req.result as Blob) || null);
    req.onerror = () => reject(req.error);
  });

  if (!blob) return null;
  return await blob.arrayBuffer();
}

export async function arrayBufferToBase64(ab: ArrayBuffer): Promise<string> {
  // Use FileReader on a Blob to avoid large typed array conversions
  const blob = new Blob([ab], { type: "application/pdf" });
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  // data:[mime];base64,XXXX
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
}

export async function base64ToArrayBuffer(b64: string): Promise<ArrayBuffer> {
  const res = await fetch(`data:application/pdf;base64,${b64}`);
  return await res.arrayBuffer();
}

export function savePdfToLocalStorage(projectId: string, ab: ArrayBuffer): Promise<void> {
  return arrayBufferToBase64(ab).then((b64) => {
    localStorage.setItem(`pdf:${projectId}`, b64);
  });
}

export function loadPdfFromLocalStorage(projectId: string): ArrayBuffer | null {
  const b64 = localStorage.getItem(`pdf:${projectId}`);
  if (!b64) return null;
  // Convert synchronously using fetch data URL trick
  // Note: returning Promise-like via async IIFE is not ideal for sync fn; keep it simple for now
  // Caller can use the async load function below instead if desired
  return null;
}

export async function tryLoadPdf(projectId: string): Promise<ArrayBuffer | null> {
  // Try IndexedDB first
  try {
    const fromIdb = await loadPdfFromIndexedDB(projectId);
    if (fromIdb) return fromIdb;
  } catch {}
  // Fallback to localStorage
  const b64 = (typeof window !== "undefined") ? localStorage.getItem(`pdf:${projectId}`) : null;
  if (b64) {
    return await base64ToArrayBuffer(b64);
  }
  return null;
}

export async function persistPdf(projectId: string, data: ArrayBuffer): Promise<"idb" | "localStorage"> {
  // Prefer IndexedDB
  try {
    await savePdfToIndexedDB(projectId, data);
    return "idb";
  } catch {
    // Fallback to localStorage for ≤20MB (caller enforces size limit)
    await savePdfToLocalStorage(projectId, data);
    return "localStorage";
  }
}

