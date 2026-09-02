import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ProductiveSession, WeeklyGoal } from '@/lib/weeklyGoalTypes';
import type { Habit } from '@/lib/SettingsContext';

export type { ProductiveSession } from '@/lib/weeklyGoalTypes';

export interface SlideshowImage {
  id: string;
  name: string;
  data: string;
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
  slideshowImages: {
    key: string;
    value: SlideshowImage;
  };
  productiveSessions: {
    key: string;
    value: ProductiveSession;
    indexes: {
      'by-weekly-goal': string;
      'by-start-time': number;
    };
  };
  habits: {
    key: string;
    value: Habit;
  };
}

let dbInstance: IDBPDatabase<HalberdDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HalberdDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HalberdDB>('halberd-db', 6, {
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
      if (!db.objectStoreNames.contains('slideshowImages')) {
        db.createObjectStore('slideshowImages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('productiveSessions')) {
        const store = db.createObjectStore('productiveSessions', { keyPath: 'id' });
        store.createIndex('by-weekly-goal', 'weeklyGoalId');
        store.createIndex('by-start-time', 'startTime');
      }
      if (!db.objectStoreNames.contains('habits')) {
        db.createObjectStore('habits', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

export async function getHabits(): Promise<Habit[]> {
  const db = await getDB();
  return db.getAll('habits');
}

export async function setHabitsInDB(habits: Habit[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('habits', 'readwrite');
  await tx.store.clear();
  for (const habit of habits) await tx.store.put(habit);
  await tx.done;
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

export async function getProductiveSessions(options?: {
  weeklyGoalId?: string;
  startTime?: number;
  endTime?: number;
}): Promise<ProductiveSession[]> {
  const db = await getDB();
  const sessions = options?.weeklyGoalId
    ? await db.getAllFromIndex('productiveSessions', 'by-weekly-goal', options.weeklyGoalId)
    : await db.getAll('productiveSessions');

  return sessions
    .filter((session) => options?.startTime === undefined || session.startTime >= options.startTime)
    .filter((session) => options?.endTime === undefined || session.startTime <= options.endTime)
    .sort((a, b) => b.startTime - a.startTime);
}

export async function getProductiveSession(id: string): Promise<ProductiveSession | undefined> {
  const db = await getDB();
  return db.get('productiveSessions', id);
}

export async function addProductiveSessionToDB(session: ProductiveSession): Promise<void> {
  const db = await getDB();
  await db.put('productiveSessions', session);
}

export async function updateProductiveSessionInDB(
  id: string,
  updates: Partial<Omit<ProductiveSession, 'id'>>,
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('productiveSessions', id);
  if (!existing) return;
  await db.put('productiveSessions', { ...existing, ...updates, id });
}

export async function removeProductiveSessionFromDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('productiveSessions', id);
}

export async function clearProductiveSessionsFromDB(weeklyGoalId?: string): Promise<void> {
  const db = await getDB();
  if (!weeklyGoalId) {
    await db.clear('productiveSessions');
    return;
  }

  const sessions = await db.getAllFromIndex('productiveSessions', 'by-weekly-goal', weeklyGoalId);
  const transaction = db.transaction('productiveSessions', 'readwrite');
  await Promise.all(sessions.map((session) => transaction.store.delete(session.id)));
  await transaction.done;
}

export async function getSlideshowImages(): Promise<SlideshowImage[]> {
  const db = await getDB();
  return db.getAll('slideshowImages');
}

export async function setSlideshowImagesInDB(images: SlideshowImage[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('slideshowImages', 'readwrite');
  await tx.store.clear();
  for (const image of images) {
    await tx.store.put(image);
  }
  await tx.done;
}

export async function clearSlideshowImagesFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('slideshowImages');
}
