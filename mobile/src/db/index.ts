import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

let database: Database;

export const initializeDatabase = async (): Promise<Database> => {
  if (database) {
    return database;
  }

  const adapter = new SQLiteAdapter({
    schema,
    dbName: 'immo2000',
    jsi: true,
  });

  database = new Database({
    adapter,
    modelClasses: [],
  });

  return database;
};

export const getDatabase = (): Database => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};

export const addPendingRequest = async (
  method: string,
  url: string,
  data?: any
) => {
  const db = getDatabase();
  const table = db.get('pending_requests');

  await db.write(async () => {
    await table.create((record: any) => {
      record.method = method;
      record.url = url;
      record.data = JSON.stringify(data || {});
      record.retry_count = 0;
      record.created_at = Date.now();
    });
  });
};

export const getPendingRequests = async () => {
  const db = getDatabase();
  const table = db.get('pending_requests');

  const records = await table.query().fetch();
  return records.map((r: any) => ({
    id: r.id,
    method: r.method,
    url: r.url,
    data: JSON.parse(r.data),
    retryCount: r.retry_count,
  }));
};

export const removePendingRequest = async (id: string) => {
  const db = getDatabase();
  const table = db.get('pending_requests');

  await db.write(async () => {
    const record = await table.find(id);
    await record.destroyPermanently();
  });
};

export const incrementRetryCount = async (id: string) => {
  const db = getDatabase();
  const table = db.get('pending_requests');

  await db.write(async () => {
    const record = await table.find(id);
    await record.update((r: any) => {
      r.retry_count = (r.retry_count || 0) + 1;
    });
  });
};

export const cacheListing = async (listing: any) => {
  const db = getDatabase();
  const table = db.get('listings');

  await db.write(async () => {
    await table.create((record: any) => {
      Object.assign(record, listing);
      record.synced_at = Date.now();
    });
  });
};

export const getCachedListings = async () => {
  const db = getDatabase();
  const table = db.get('listings');

  return await table.query().fetch();
};

export const clearCache = async () => {
  const db = getDatabase();

  await db.write(async () => {
    const tables = ['listings', 'messages', 'cached_data'];
    for (const tableName of tables) {
      const table = db.get(tableName);
      const records = await table.query().fetch();
      for (const record of records) {
        await record.destroyPermanently();
      }
    }
  });
};
