const DB_NAME = "pixl-retail-scan";
const DB_VERSION = 1;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function openDatabase() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    const stores = db.createObjectStore("stores", { keyPath: "id" });
    stores.createIndex("name", "name");
    const scans = db.createObjectStore("scans", { keyPath: "code" });
    scans.createIndex("storeId", "storeId");
    scans.createIndex("scannedAt", "scannedAt");
  };
  return requestResult(request);
}

export function getAll(db, storeName) {
  return requestResult(db.transaction(storeName).objectStore(storeName).getAll());
}

export function put(db, storeName, value) {
  return requestResult(db.transaction(storeName, "readwrite").objectStore(storeName).put(value));
}

export function add(db, storeName, value) {
  return requestResult(db.transaction(storeName, "readwrite").objectStore(storeName).add(value));
}

export function get(db, storeName, key) {
  return requestResult(db.transaction(storeName).objectStore(storeName).get(key));
}

export function getByIndex(db, storeName, indexName, key) {
  return requestResult(db.transaction(storeName).objectStore(storeName).index(indexName).getAll(key));
}
