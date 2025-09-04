import * as SQLite from 'expo-sqlite';
import api from './axios'; // axios instance with baseURL and timeout
const db = SQLite.openDatabase('cashboard.db');

// --- Table Initialization ---
export async function initDb() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backend_id INTEGER,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income','expense')) NOT NULL,
      category TEXT NOT NULL,
      recurrence TEXT,
      date TEXT NOT NULL,
      note TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backend_id INTEGER,
      name TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backend_id INTEGER,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backend_id INTEGER,
      url TEXT NOT NULL,
      title TEXT,
      price REAL,
      image_url TEXT,
      synced INTEGER DEFAULT 0
    );
  `);
}

// --- Generic Helpers ---
async function pushTable(table, endpoint, fields, userId, token = null) {
  const unsynced = await db.getAllAsync(`SELECT * FROM ${table} WHERE synced = 0`);
  for (let row of unsynced) {
    try {
      const payload = { ...Object.fromEntries(fields.map(f => [f, row[f]])), user: userId };
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await api.post(`${endpoint}/`, payload, { headers });
      if (response.status === 201 || response.status === 200) {
        const data = response.data;
        await db.runAsync(
          `UPDATE ${table} SET synced = 1, backend_id = ? WHERE id = ?`,
          [data.id, row.id]
        );
      }
    } catch (e) {
      console.error(`Push ${table} error:`, e);
    }
  }
}

async function pullTable(table, endpoint, fields, userId, token = null) {
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await api.get(`${endpoint}/?user=${userId}`, { headers });

    if (response.status !== 200) return;

    const data = response.data;
    for (let item of data) {
      const exists = await db.getFirstAsync(`SELECT id FROM ${table} WHERE backend_id = ?`, [item.id]);
      if (!exists) {
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(f => item[f] ?? null);
        await db.runAsync(
          `INSERT INTO ${table} (${fields.join(', ')}, backend_id, synced) VALUES (${placeholders}, ?, 1)`,
          [...values, item.id]
        );
      }
    }
  } catch (e) {
    console.error(`Pull ${table} error:`, e);
  }
}

// --- CRUD & Sync Wrappers ---
// Transactions
export async function addTransaction(tx) {
  await db.runAsync(
    `INSERT INTO transactions (amount, type, category, recurrence, date, note, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [tx.amount, tx.type, tx.category, tx.recurrence || null, tx.date, tx.note || null]
  );
}

export async function getTransactions() {
  return await db.getAllAsync(`SELECT * FROM transactions ORDER BY date DESC`);
}

async function pushTransactions(userId, token) {
  return pushTable('transactions', 'transactions', ['amount', 'type', 'category', 'recurrence', 'date', 'note'], userId, token);
}

async function pullTransactions(userId, token) {
  return pullTable('transactions', 'transactions', ['amount', 'type', 'category', 'recurrence', 'date', 'note'], userId, token);
}

// Persons
export async function addPerson(name) {
  await db.runAsync(`INSERT INTO persons (name, synced) VALUES (?, 0)`, [name]);
}

export async function getPersons() {
  return await db.getAllAsync(`SELECT * FROM persons`);
}

async function pushPersons(userId, token) {
  return pushTable('persons', 'persons', ['name'], userId, token);
}

async function pullPersons(userId, token) {
  return pullTable('persons', 'persons', ['name'], userId, token);
}

// Events
export async function addEvent(event) {
  await db.runAsync(`INSERT INTO events (title, date, synced) VALUES (?, ?, 0)`, [event.title, event.date]);
}

export async function getEvents() {
  return await db.getAllAsync(`SELECT * FROM events ORDER BY date ASC`);
}

async function pushEvents(userId, token) {
  return pushTable('events', 'events', ['title', 'date'], userId, token);
}

async function pullEvents(userId, token) {
  return pullTable('events', 'events', ['title', 'date'], userId, token);
}

// Wishlist Items
export async function addWishlistItem(item) {
  await db.runAsync(
    `INSERT INTO wishlist_items (url, title, price, image_url, synced) VALUES (?, ?, ?, ?, 0)`,
    [item.url, item.title || null, item.price || null, item.image_url || null]
  );
}

export async function getWishlistItems() {
  return await db.getAllAsync(`SELECT * FROM wishlist_items`);
}

async function pushWishlist(userId, token) {
  return pushTable('wishlist_items', 'wishlist', ['url', 'title', 'price', 'image_url'], userId, token);
}

async function pullWishlist(userId, token) {
  return pullTable('wishlist_items', 'wishlist', ['url', 'title', 'price', 'image_url'], userId, token);
}

// --- Global Sync ---
export async function syncAllData(userId, token) {
  if (!userId) return;

  await pushTransactions(userId, token);
  await pullTransactions(userId, token);

  await pushPersons(userId, token);
  await pullPersons(userId, token);

  await pushEvents(userId, token);
  await pullEvents(userId, token);

  await pushWishlist(userId, token);
  await pullWishlist(userId, token);
}
