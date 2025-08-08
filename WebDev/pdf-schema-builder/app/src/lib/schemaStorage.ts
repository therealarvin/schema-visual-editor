import { Schema } from "@/types/schema";

export async function saveSchemaToIndexedDB(projectId: string, schema: Schema): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("IndexedDB not available");
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pdf-storage", 2); // Increment version
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
      if (!db.objectStoreNames.contains("schemas")) {
        db.createObjectStore("schemas");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("schemas", "readwrite");
    const store = tx.objectStore("schemas");
    const req = store.put(schema, projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadSchemaFromIndexedDB(projectId: string): Promise<Schema | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }
  
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pdf-storage", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
      if (!db.objectStoreNames.contains("schemas")) {
        db.createObjectStore("schemas");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const schema = await new Promise<Schema | null>((resolve, reject) => {
    const tx = db.transaction("schemas", "readonly");
    const store = tx.objectStore("schemas");
    const req = store.get(projectId);
    req.onsuccess = () => resolve((req.result as Schema) || null);
    req.onerror = () => reject(req.error);
  });

  return schema;
}

export async function deleteSchemaFromIndexedDB(projectId: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pdf-storage", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs");
      }
      if (!db.objectStoreNames.contains("schemas")) {
        db.createObjectStore("schemas");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("schemas", "readwrite");
    const store = tx.objectStore("schemas");
    const req = store.delete(projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}