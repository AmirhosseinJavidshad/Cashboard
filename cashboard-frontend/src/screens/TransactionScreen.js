import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, I18nManager, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../api/axios';
import { MMKV } from 'react-native-mmkv';

I18nManager.allowRTL(true);

const storage = new MMKV({ id: 'transactions_store' });

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const navigation = useNavigation();

  const loadData = useCallback(async () => {
    const localData = JSON.parse(storage.getString('transactions') || '[]');

    // Filter out deleted items
    const visibleLocal = localData.filter(tx => !tx.deleted_at);
    setTransactions(visibleLocal);

    try {
      const res = await api.get('transactions/');
      const remoteData = res.data.results || res.data;

      // Merge unsynced local items and deleted_at handling
      const unsynced = localData.filter(tx => !tx.synced);
      const merged = [...remoteData, ...unsynced];

      // Remove deleted items from visible list
      const visibleMerged = merged.filter(tx => !tx.deleted_at);

      setTransactions(visibleMerged);
      setIsOffline(false);

      // Save fresh remote to local cache
      storage.set('transactions', JSON.stringify(merged));
    } catch (err) {
      console.log('⚠ Offline mode: Using cached transactions', err.message);
      setIsOffline(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDelete = (tx) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const current = JSON.parse(storage.getString('transactions') || '[]');
        const updated = current.map(t => t.client_uuid === tx.client_uuid ? { ...t, deleted_at: new Date().toISOString(), synced: false } : t);
        storage.set('transactions', JSON.stringify(updated));
        setTransactions(prev => prev.filter(item => item.client_uuid !== tx.client_uuid));
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: '#f9f9f9' }}>
      {isOffline && <Text style={styles.offlineBanner}>حالت آفلاین: تراکنش‌ها از حافظه محلی نمایش داده می‌شوند</Text>}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.client_uuid || item.id?.toString()}
        renderItem={({ item }) => <TransactionCard transaction={item} onDelete={() => handleDelete(item)} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransactionScreen')}>
        <Icon name="swap-horizontal-outline" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function TransactionCard({ transaction, onDelete }) {
  const { amount, transaction_type, category, date, note, is_recurring, recurrence_period, tags_people = [], tags_events = [] } = transaction;

  const categoryIcons = {
    home_utilities: '🏠', transportation: '🚗', food: '🍽️', health_insurance: '💊', savings_debt: '💰',
    personal_family: '👨‍👩‍👧‍👦', leisure: '🎮', salary: '💼', personal_business: '🧾', other: '📦',
  };

  const getPersianCategory = (key) => {
    const labels = {
      home_utilities: 'خانه و قبوض', transportation: 'حمل‌ونقل', food: 'غذا', health_insurance: 'سلامت و بیمه',
      savings_debt: 'پس‌انداز و بدهی', personal_family: 'شخصی و خانوادگی', leisure: 'سرگرمی',
      salary: 'حقوق', personal_business: 'کسب‌وکار شخصی', other: 'سایر',
    };
    return labels[key] || key;
  };

  const toPersianDigits = (num) => num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  const sign = transaction_type === 'income' ? '+' : '-';
  const amountColor = transaction_type === 'income' ? '#27ae60' : '#c0392b';
  const formattedDate = new Date(date).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const formattedTime = new Date(date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const allTags = [...tags_people, ...tags_events];

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{formattedDate} {formattedTime}</Text>

      <View style={styles.amountRow}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {toPersianDigits(amount.toLocaleString())}<Text style={styles.sign}>{sign}</Text> ریال
        </Text>
      </View>

      <View style={styles.categoryRow}>
        <Text style={styles.categoryText}>{categoryIcons[category] || '📁'} {getPersianCategory(category)}</Text>
      </View>

      {is_recurring && <Text style={styles.recurrence}>{recurrence_period}</Text>}

      <View style={styles.bottomRow}>
        <View style={styles.tagsColumn}>{allTags.map((tag, idx) => <Text key={idx} style={styles.tag}># {tag.name}</Text>)}</View>
        {note ? <Text style={styles.note}>#{note}</Text> : null}
      </View>

      {/* Delete button */}
      <TouchableOpacity onPress={onDelete} style={{ marginTop: 10 }}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>حذف</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: { backgroundColor: '#ffe5b4', padding: 8, textAlign: 'center', marginBottom: 8, borderRadius: 8, color: '#a65d00', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  date: { fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'left' },
  amountRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  amount: { fontSize: 28, fontWeight: 'bold', textAlign: 'right' },
  sign: { fontSize: 22, marginHorizontal: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 },
  categoryText: { fontSize: 22, fontWeight: '500', color: '#333', textAlign: 'right', writingDirection: 'rtl' },
  recurrence: { fontSize: 14, color: '#888', textAlign: 'right', marginBottom: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tagsColumn: { flexDirection: 'column' },
  tag: { fontSize: 13, color: '#555', marginBottom: 2 },
  note: { fontSize: 13, color: '#777', fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2e86de', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
