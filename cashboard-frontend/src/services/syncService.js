import axios from 'axios';
import { storage, getClientUUID } from '../storage';

const API_URL = 'https://YOUR_API_URL'; // put your backend URL here

export async function pushLocalData() {
  try {
    const transactions = JSON.parse(storage.getString('transactions') || '[]');
    const persons = JSON.parse(storage.getString('persons') || '[]');
    const events = JSON.parse(storage.getString('events') || '[]');
    const wishlist = JSON.parse(storage.getString('wishlist') || '[]');

    transactions.forEach(t => { if (!t.client_uuid) t.client_uuid = getClientUUID(`transaction-${t.id}`); });
    persons.forEach(p => { if (!p.client_uuid) p.client_uuid = getClientUUID(`person-${p.id}`); });
    events.forEach(e => { if (!e.client_uuid) e.client_uuid = getClientUUID(`event-${e.id}`); });
    wishlist.forEach(w => { if (!w.client_uuid) w.client_uuid = getClientUUID(`wishlist-${w.id}`); });

    const response = await axios.post(`${API_URL}/sync/push/`, {
      transactions, persons, events, wishlist,
    });

    console.log('Push successful:', response.data);
  } catch (err) {
    console.log('Push error:', err);
  }
}

export async function pullServerData(since = null) {
  try {
    const url = since ? `${API_URL}/sync/pull/?since=${since}` : `${API_URL}/sync/pull/`;
    const response = await axios.get(url);
    const data = response.data;

    storage.set('transactions', JSON.stringify(data.transactions));
    storage.set('persons', JSON.stringify(data.persons));
    storage.set('events', JSON.stringify(data.events));
    storage.set('wishlist', JSON.stringify(data.wishlist));

    console.log('Pull successful');
  } catch (err) {
    console.log('Pull error:', err);
  }
}
