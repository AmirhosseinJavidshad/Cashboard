import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../api/axios';


I18nManager.allowRTL(true); // Force RTL layout for Persian

export default function HomeScreen() {
  const [transactions, setTransactions] = useState([]);
  const navigation = useNavigation();

  const loadData = useCallback(() => {
    api.get('transactions/')
      .then(res => setTransactions(res.data.results || res.data))
      .catch(err => console.error(err));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: '#f9f9f9' }}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionCard transaction={item} />}
      />

      {/* Floating "+" Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransactionScreen')}
      >
        <Icon name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function TransactionCard({ transaction }) {
  const {
    amount,
    transaction_type,
    category,
    date,
    note,
    is_recurring,
    recurrence_period,
    tags_people = [],
    tags_events = [],
  } = transaction;

  const categoryIcons = {
    home_utilities: '🏠',
    transportation: '🚗',
    food: '🍽️',
    health_insurance: '💊',
    savings_debt: '💰',
    personal_family: '👨‍👩‍👧‍👦',
    leisure: '🎮',
    salary: '💼',
    personal_business: '🧾',
    other: '📦',
  };

  const getPersianCategory = (key) => {
    const labels = {
      home_utilities: 'خانه و قبوض',
      transportation: 'حمل‌ونقل',
      food: 'غذا',
      health_insurance: 'سلامت و بیمه',
      savings_debt: 'پس‌انداز و بدهی',
      personal_family: 'شخصی و خانوادگی',
      leisure: 'سرگرمی',
      salary: 'حقوق',
      personal_business: 'کسب‌وکار شخصی',
      other: 'سایر',
    };
    return labels[key] || key;
  };

  const toPersianDigits = (num) =>
    num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  const sign = transaction_type === 'income' ? '+' : '-';
  const amountColor = transaction_type === 'income' ? '#27ae60' : '#c0392b';

  const formattedDate = new Date(date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const formattedTime = new Date(date).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const allTags = [...tags_people, ...tags_events];

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{formattedDate} {formattedTime}</Text>

      <View style={styles.amountRow}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {toPersianDigits(amount.toLocaleString())}
          <Text style={styles.sign}>{sign}</Text> ریال
        </Text>
      </View>

      <View style={styles.categoryRow}>
        <Text style={styles.categoryText}>
          {categoryIcons[category] || '📁'} {getPersianCategory(category)}
        </Text>
      </View>

      {is_recurring && (
        <Text style={styles.recurrence}>{recurrence_period}</Text>
      )}

      <View style={styles.bottomRow}>
        <View style={styles.tagsColumn}>
          {allTags.map((tag, idx) => (
            <Text key={idx} style={styles.tag}># {tag.name}</Text>
          ))}
        </View>
        {note ? <Text style={styles.note}>#{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'left',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  sign: {
    fontSize: 22,
    marginHorizontal: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recurrence: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tagsColumn: {
    flexDirection: 'column',
  },
  tag: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  note: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2e86de',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
