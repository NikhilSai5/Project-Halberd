import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface WeeklyGoal {
  id: string;
  name: string;
  targetHours: number;
  startDate: string;
  endDate: string;
  sessions: { timeRange: string; description: string }[];
  completed: boolean;
}

interface HalberdDB extends DBSchema {
  items: {
    key: string;
    value: { id: string; data: unknown };
  };
  wallpapers: {
    key: string;
    value: { id: string; name: string; preview: string };
  };
  weeklyGoals: {
    key: string;
    value: WeeklyGoal;
  };
}

let dbInstance: IDBPDatabase<HalberdDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HalberdDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HalberdDB>('halberd-db', 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('wallpapers')) {
        db.createObjectStore('wallpapers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('weeklyGoals')) {
        db.createObjectStore('weeklyGoals', { keyPath: 'id' });
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

export async function getWallpapers(): Promise<{ id: string; name: string; preview: string }[]> {
  const db = await getDB();
  return db.getAll('wallpapers');
}

export async function addWallpaperToDB(wallpaper: { id: string; name: string; preview: string }): Promise<void> {
  const db = await getDB();
  await db.put('wallpapers', wallpaper);
}

export async function removeWallpaperFromDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('wallpapers', id);
}

export async function clearAllWallpapersFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('wallpapers');
}

export async function getWeeklyGoals(): Promise<WeeklyGoal[]> {
  const db = await getDB();
  return db.getAll('weeklyGoals');
}

export async function addWeeklyGoalToDB(goal: WeeklyGoal): Promise<void> {
  const db = await getDB();
  await db.put('weeklyGoals', goal);
}

export async function removeWeeklyGoalFromDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('weeklyGoals', id);
}

export async function clearAllWeeklyGoalsFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('weeklyGoals');
}