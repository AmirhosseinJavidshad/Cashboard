// src/screens/TransactionsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useObservable } from '@nozbe/watermelondb/hooks';
import { syncAllData } from '../database/db';

I18nManager.allowRTL(true);

export default function TransactionsScreen({ userId }) {
  const navigation = useNavigation();
  const db = useDatabase();

  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Live query of non-deleted transactions
  const transactions = useObservable(() =>
    db.collections
      .get('transactions')
      .query(Q.where('deleted_at', null))
      .observe()
  );

  const persons = useObservable(() =>
    db.collections.get('persons').query().observe()
  );

  const events = useObservable(() =>
    db.collections.get('events').query().observe()
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await syncAllData(userId);
      setRefreshing(false);
    } catch (err) {
      console.error("Refresh failed", err);
      setRefreshing(false);
      setIsOffline(true);
      Alert.alert("Error", "Failed to refresh transactions");
    }
  };

  const toPersianDigits = (num) =>
    num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  const categoryIcons = {
    home_utilities: '🏠', transportation: '🚗', food: '🍽️', health_insurance: '💊',
    savings_debt: '💰', personal_family: '👨‍👩‍👧‍👦', leisure: '🎮',
    salary: '💼', personal_business: '🧾', other: '📦',
  };

  const categoryLabels = {
    home_utilities: 'خانه و قبوض', transportation: 'حمل‌ونقل', food: 'غذا',
    health_insurance: 'سلامت و بیمه', savings_debt: 'پس‌انداز و بدهی',
    personal_family: 'شخصی و خانوادگی', leisure: 'سرگرمی',
    salary: 'حقوق', personal_business: 'کسب‌وکار شخصی', other: 'سایر',
  };

  const getPersonName = (personId) => {
    const p = persons?.find(per => per.id === personId);
    return p ? p.name : '—';
  };

  const getEventName = (eventId) => {
    const e = events?.find(ev => ev.id === eventId);
    return e ? e.title : '—';
  };

  const handleDelete = async (tx) => {
    Alert.alert('حذف تراکنش', 'آیا مطمئن هستید؟', [
      { text: 'لغو' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.write(async () => {
              await tx.update((record) => {
                record.deleted_at = Date.now();
                record.synced = false;
              });
            });
            await syncAllData(userId);
          } catch (err) {
            console.error('Failed to delete', err);
            Alert.alert('Error', 'Failed to delete transaction');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const sign = item.transaction_type === 'income' ? '+' : '-';
    const amountColor = item.transaction_type === 'income' ? '#27ae60' : '#c0392b';
    const dateObj = new Date(item.date);
    const formattedDate = dateObj.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <Text style={styles.date}>{formattedDate} {formattedTime}</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {toPersianDigits(item.amount.toLocaleString())}
            <Text style={styles.sign}>{sign}</Text> ریال
          </Text>
        </View>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>
            {categoryIcons[item.category] || '📁'} {categoryLabels[item.category] || item.category}
          </Text>
        </View>
        {item.is_recurring ? <Text style={styles.recurrence}>{item.recurrence_period || '—'}</Text> : null}
        {item.note ? <Text style={styles.note}>#{item.note}</Text> : null}
        <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginTop: 10 }}>
          <Text style={{ color: 'red', fontWeight: 'bold' }}>حذف</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!transactions) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: '#f9f9f9' }}>
      {isOffline && <Text style={styles.offlineBanner}>حالت آفلاین: تراکنش‌ها از حافظه محلی نمایش داده می‌شوند</Text>}

      <FlatList
        data={transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransactionScreen')}>
        <Icon name="swap-horizontal-outline" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: { backgroundColor: '#ffe5b4', padding: 8, textAlign: 'center', marginBottom: 8, borderRadius: 8, color: '#a65d00', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  date: { fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'left' },
  amountRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  amount: { fontSize: 28, fontWeight: 'bold', textAlign: 'right' },
  sign: { fontSize: 22, marginHorizontal: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 6 },
  categoryText: { fontSize: 22, fontWeight: '500', color: '#333', textAlign: 'right', writingDirection: 'rtl' },
  recurrence: { fontSize: 14, color: '#888', textAlign: 'right', marginBottom: 4 },
  note: { fontSize: 13, color: '#777', fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2e86de', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
