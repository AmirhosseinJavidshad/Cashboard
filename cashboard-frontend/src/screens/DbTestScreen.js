// src/screens/DbTestScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { 
  addTransaction, 
  getTransactions, 
  updateTransaction, 
  deleteTransaction 
} from '../../db';  // adjust if your db.js path is different

export default function DbTestScreen() {
  const [transactions, setTransactions] = useState([]);

  // Load all transactions from DB
  const loadData = async () => {
    const data = await getTransactions();
    setTransactions(data);
  };

  // Run once at startup
  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    await addTransaction({
      amount: 50,
      type: 'expense',
      category: 'Food',
      recurrence: 'one-time',
      bank_account_name: 'Test Bank',
      synced: 0
    });
    loadData();
  };

  const handleUpdate = async () => {
    if (transactions.length === 0) return;
    const t = transactions[0];
    await updateTransaction(t.id, { amount: 99, category: 'Updated' });
    loadData();
  };

  const handleDelete = async () => {
    if (transactions.length === 0) return;
    const t = transactions[0];
    await deleteTransaction(t.id);
    loadData();
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>SQLite CRUD Test</Text>
      <Button title="➕ Add Transaction" onPress={handleAdd} />
      <Button title="✏️ Update First Transaction" onPress={handleUpdate} />
      <Button title="🗑️ Delete First Transaction" onPress={handleDelete} />
      <Button title="🔄 Refresh" onPress={loadData} />

      {transactions.map((t) => (
        <Text key={t.id}>
          #{t.id} - {t.type} - {t.amount} - {t.category} (synced: {t.synced})
        </Text>
      ))}
    </ScrollView>
  );
}
