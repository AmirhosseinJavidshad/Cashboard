// db.js
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { tableSchema, appSchema } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Model } from '@nozbe/watermelondb';
import api from '../api/axios'; // axios instance

// -------------------------
// 1. SCHEMAS
// -------------------------

const TransactionsSchema = tableSchema({
  name: 'transactions',
  columns: [
    { name: 'backend_id', type: 'number', isOptional: true },
    { name: 'client_uuid', type: 'string', isOptional: true },
    { name: 'deleted_at', type: 'number', isOptional: true },
    { name: 'updated_at', type: 'number', isOptional: true },
    { name: 'amount', type: 'number' },
    { name: 'transaction_type', type: 'string' },
    { name: 'category', type: 'string' },
    { name: 'is_recurring', type: 'boolean', defaultValue: false },
    { name: 'recurrence_period', type: 'string', isOptional: true },
    { name: 'recurrence_end_date', type: 'number', isOptional: true },
    { name: 'date', type: 'number' },
    { name: 'note', type: 'string', isOptional: true },
    { name: 'bank_account', type: 'string', isOptional: true },
    { name: 'synced', type: 'boolean', defaultValue: false },
  ],
});

const PersonsSchema = tableSchema({
  name: 'persons',
  columns: [
    { name: 'backend_id', type: 'number', isOptional: true },
    { name: 'client_uuid', type: 'string', isOptional: true },
    { name: 'deleted_at', type: 'number', isOptional: true },
    { name: 'updated_at', type: 'number', isOptional: true },
    { name: 'name', type: 'string' },
    { name: 'user', type: 'number', isOptional: true },
    { name: 'synced', type: 'boolean', defaultValue: false },
  ],
});

const EventsSchema = tableSchema({
  name: 'events',
  columns: [
    { name: 'backend_id', type: 'number', isOptional: true },
    { name: 'client_uuid', type: 'string', isOptional: true },
    { name: 'deleted_at', type: 'number', isOptional: true },
    { name: 'updated_at', type: 'number', isOptional: true },
    { name: 'title', type: 'string' },
    { name: 'date', type: 'number', isOptional: true },
    { name: 'user', type: 'number', isOptional: true },
    { name: 'synced', type: 'boolean', defaultValue: false },
  ],
});

const WishlistSchema = tableSchema({
  name: 'wishlist_items',
  columns: [
    { name: 'backend_id', type: 'number', isOptional: true },
    { name: 'client_uuid', type: 'string', isOptional: true },
    { name: 'deleted_at', type: 'number', isOptional: true },
    { name: 'updated_at', type: 'number', isOptional: true },
    { name: 'url', type: 'string' },
    { name: 'title', type: 'string', isOptional: true },
    { name: 'price', type: 'string', isOptional: true },
    { name: 'image_url', type: 'string', isOptional: true },
    { name: 'user', type: 'number', isOptional: true },
    { name: 'synced', type: 'boolean', defaultValue: false },
  ],
});

export const schema = appSchema({
  version: 1,
  tables: [TransactionsSchema, PersonsSchema, EventsSchema, WishlistSchema],
});

// -------------------------
// 2. MODELS
// -------------------------

class Transaction extends Model {
  static table = 'transactions';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('amount') amount;
  @field('transaction_type') transaction_type;
  @field('category') category;
  @field('is_recurring') is_recurring;
  @field('recurrence_period') recurrence_period;
  @field('recurrence_end_date') recurrence_end_date;
  @field('date') date;
  @field('note') note;
  @field('bank_account') bank_account;
  @field('synced') synced;
}

class Person extends Model {
  static table = 'persons';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('name') name;
  @field('user') user;
  @field('synced') synced;
}

class Event extends Model {
  static table = 'events';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('title') title;
  @field('date') date;
  @field('user') user;
  @field('synced') synced;
}

class WishlistItem extends Model {
  static table = 'wishlist_items';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('url') url;
  @field('title') title;
  @field('price') price;
  @field('image_url') image_url;
  @field('user') user;
  @field('synced') synced;
}

// -------------------------
// 3. ADAPTER + DB
// -------------------------

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'cashboard',
});

export const database = new Database({
  adapter,
  modelClasses: [Transaction, Person, Event, WishlistItem],
});

// -------------------------
// 4. CRUD + SYNC
// -------------------------

async function pushTable(tableName, endpoint, fields, userId, token) {
  const collection = database.collections.get(tableName);
  const unsynced = await collection.query().fetch();

  await database.action(async () => {
    for (let record of unsynced.filter(r => !r.synced)) {
      try {
        const payload = {};
        fields.forEach(f => (payload[f] = record[f]));
        payload.user = userId;

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await api.post(`${endpoint}/`, payload, { headers });

        if (response.status === 200 || response.status === 201) {
          const data = response.data;
          await record.update(r => {
            r.synced = true;
            r.backend_id = data.id;
            r.updated_at = Date.now();
          });
        }
      } catch (err) {
        console.error(`Push ${tableName} error:`, err);
      }
    }
  });
}

async function pullTable(tableName, endpoint, fields, userId, token) {
  const collection = database.collections.get(tableName);

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`${endpoint}/?user=${userId}`, { headers });
    if (response.status !== 200) return;

    const data = response.data;

    await database.action(async () => {
      for (let item of data) {
        const exists = await collection.query().fetch();
        const found = exists.find(r => r.backend_id === item.id);

        const mapItem = {};
        fields.forEach(f => {
          if (f === 'date' || f === 'recurrence_end_date') {
            mapItem[f] = item[f] ? new Date(item[f]).getTime() : null;
          } else {
            mapItem[f] = item[f] ?? null;
          }
        });
        mapItem.backend_id = item.id;
        mapItem.deleted_at = item.deleted_at ? new Date(item.deleted_at).getTime() : null;
        mapItem.updated_at = item.updated_at ? new Date(item.updated_at).getTime() : null;
        mapItem.synced = true;

        if (!found) {
          await collection.create(r => Object.assign(r, mapItem));
        }
      }
    });
  } catch (err) {
    console.error(`Pull ${tableName} error:`, err);
  }
}

// --- Transactions ---
export async function addTransaction(tx) {
  const collection = database.collections.get('transactions');
  await database.action(async () => {
    await collection.create(record => {
      record.amount = tx.amount;
      record.transaction_type = tx.transaction_type;
      record.category = tx.category;
      record.is_recurring = tx.is_recurring ?? false;
      record.recurrence_period = tx.recurrence_period ?? null;
      record.recurrence_end_date = tx.recurrence_end_date ?? null;
      record.date = tx.date.getTime();
      record.note = tx.note ?? null;
      record.bank_account = tx.bank_account ?? null;
      record.synced = false;
    });
  });
}

export async function getTransactions() {
  return database.collections.get('transactions').query().fetch();
}

// --- Persons ---
export async function addPerson(p) {
  const collection = database.collections.get('persons');
  await database.action(async () => {
    await collection.create(r => {
      r.name = p.name;
      r.user = p.user ?? null;
      r.synced = false;
    });
  });
}

export async function getPersons() {
  return database.collections.get('persons').query().fetch();
}

// --- Events ---
export async function addEvent(e) {
  const collection = database.collections.get('events');
  await database.action(async () => {
    await collection.create(r => {
      r.title = e.title;
      r.date = e.date?.getTime() ?? null;
      r.user = e.user ?? null;
      r.synced = false;
    });
  });
}

export async function getEvents() {
  return database.collections.get('events').query().fetch();
}

// --- Wishlist ---
export async function addWishlistItem(item) {
  const collection = database.collections.get('wishlist_items');
  await database.action(async () => {
    await collection.create(r => {
      r.url = item.url;
      r.title = item.title ?? null;
      r.price = item.price ?? null;
      r.image_url = item.image_url ?? null;
      r.user = item.user ?? null;
      r.synced = false;
    });
  });
}

export async function getWishlistItems() {
  return database.collections.get('wishlist_items').query().fetch();
}

// --- Global Sync ---
export async function syncAllData(userId, token) {
  if (!userId) return;

  await pushTable(
    'transactions',
    'transactions',
    [
      'amount','transaction_type','category','is_recurring','recurrence_period',
      'recurrence_end_date','date','note','bank_account'
    ],
    userId,
    token
  );
  await pullTable(
    'transactions',
    'transactions',
    [
      'amount','transaction_type','category','is_recurring','recurrence_period',
      'recurrence_end_date','date','note','bank_account'
    ],
    userId,
    token
  );

  await pushTable('persons', 'persons', ['name','user'], userId, token);
  await pullTable('persons', 'persons', ['name','user'], userId, token);

  await pushTable('events', 'events', ['title','date','user'], userId, token);
  await pullTable('events', 'events', ['title','date','user'], userId, token);

  await pushTable('wishlist_items', 'wishlist', ['url','title','price','image_url','user'], userId, token);
  await pullTable('wishlist_items', 'wishlist', ['url','title','price','image_url','user'], userId, token);
}
