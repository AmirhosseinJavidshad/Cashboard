// src/database/db.js
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { tableSchema, appSchema } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Model } from '@nozbe/watermelondb';
import api from '../api/axios'; // axios instance

// -------------------------
// 1. SCHEMAS (unchanged)
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
    { name: 'synced', type: 'boolean', defaultValue: false },
  ],
});

const WishlistSchema = tableSchema({
  name: 'wishlist_items',
  columns: [
    { name: 'backend_id', type: 'number', isOptional: true },
    { name: 'client_uuid', type: 'string', isOptional: true },
    { name: 'url', type: 'string' },
    { name: 'title', type: 'string', isOptional: true },
    { name: 'price', type: 'string', isOptional: true },
    { name: 'image_url', type: 'string', isOptional: true },
    { name: 'deleted_at', type: 'number', isOptional: true },
    { name: 'updated_at', type: 'number', isOptional: true },
    { name: 'synced', type: 'boolean', defaultValue: false },
  ],
});

export const schema = appSchema({
  version: 1,
  tables: [TransactionsSchema, PersonsSchema, EventsSchema, WishlistSchema],
});

// -------------------------
// 2. MODELS (unchanged)
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
// 4. CRUD + SYNC (updated)
// -------------------------

async function pushTable(tableName, endpoint, fields, token) {
  const collection = database.collections.get(tableName);
  const unsynced = await collection.query().fetch();

  await database.action(async () => {
    for (let record of unsynced.filter(r => !r.synced)) {
      try {
        const payload = {};
        fields.forEach(f => (payload[f] = record[f]));

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

async function pullTable(tableName, endpoint, fields, token) {
  const collection = database.collections.get(tableName);

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get(`${endpoint}/`, { headers });
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

// -------------------------
// 5. Global Sync
// -------------------------

export async function syncAllData(token, options = {}) {
  const { pushOnly = false, pullOnly = false } = options;

  const tables = [
    {
      name: 'transactions',
      endpoint: 'transactions',
      fields: [
        'amount','transaction_type','category','is_recurring','recurrence_period',
        'recurrence_end_date','date','note','bank_account'
      ],
    },
    { name: 'persons', endpoint: 'persons', fields: ['name'] },
    { name: 'events', endpoint: 'events', fields: ['title','date'] },
    { name: 'wishlist_items', endpoint: 'wishlist', fields: ['url','title','price','image_url'] },
  ];

  for (let t of tables) {
    if (!pullOnly) await pushTable(t.name, t.endpoint, t.fields, token);
    if (!pushOnly) await pullTable(t.name, t.endpoint, t.fields, token);
  }
}
