import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface HalberdDB extends DBSchema {
  items: {
    key: string;
    value: { id: string; data: unknown };
  };
}

let dbInstance: IDBPDatabase<HalberdDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HalberdDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HalberdDB>('halberd-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}