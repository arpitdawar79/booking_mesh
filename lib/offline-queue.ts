const DB_NAME = "ekantah-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "mutations";

export interface QueuedMutation {
  id?: number;
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
  timestamp: number;
  status: "pending" | "retrying" | "failed";
  retryCount: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

export async function enqueueMutation(
  mutation: Omit<QueuedMutation, "id" | "timestamp" | "status" | "retryCount">,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add({
      ...mutation,
      timestamp: Date.now(),
      status: "pending",
      retryCount: 0,
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("status");
    const req = index.getAll("pending");
    req.onsuccess = () => resolve(req.result as QueuedMutation[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllMutations(): Promise<QueuedMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueuedMutation[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeMutation(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateMutationStatus(
  id: number,
  status: QueuedMutation["status"],
  retryCount?: number,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const data = getReq.result as QueuedMutation;
      if (!data) return resolve();
      data.status = status;
      if (retryCount !== undefined) data.retryCount = retryCount;
      const putReq = store.put(data);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function processQueue(): Promise<{
  success: number;
  failed: number;
}> {
  const pending = await getPendingMutations();
  let success = 0;
  let failed = 0;

  for (const mut of pending) {
    if (!mut.id) continue;
    try {
      await updateMutationStatus(mut.id, "retrying", mut.retryCount + 1);
      const res = await fetch(mut.url, {
        method: mut.method,
        headers: mut.headers,
        body: mut.body,
      });
      if (res.ok) {
        await removeMutation(mut.id);
        success++;
      } else {
        if (mut.retryCount >= 2) {
          await updateMutationStatus(mut.id, "failed");
          failed++;
        } else {
          await updateMutationStatus(mut.id, "pending", mut.retryCount + 1);
        }
      }
    } catch {
      if (mut.retryCount >= 2) {
        await updateMutationStatus(mut.id, "failed");
        failed++;
      } else {
        await updateMutationStatus(mut.id, "pending", mut.retryCount + 1);
      }
    }
  }

  return { success, failed };
}

export async function clearFailedMutations(): Promise<void> {
  const all = await getAllMutations();
  for (const mut of all) {
    if (mut.status === "failed" && mut.id) {
      await removeMutation(mut.id);
    }
  }
}
