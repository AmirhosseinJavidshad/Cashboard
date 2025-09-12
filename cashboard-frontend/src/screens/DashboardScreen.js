// src/screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { useObservable } from '@nozbe/watermelondb/hooks';
import { syncAllData } from '../database/db';
import { useAuth } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;
const chartColors = [
  '#F44336', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0',
  '#00BCD4', '#FF5722', '#8BC34A', '#E91E63', '#3F51B5',
];

export default function DashboardScreen() {
  const db = useDatabase();
  const { token } = useAuth();

  const transactions = useObservable(() =>
    db.collections.get('transactions').query().observe()
  );

  const [dailyData, setDailyData] = useState([]);
  const [expensePieData, setExpensePieData] = useState([]);
  const [incomePieData, setIncomePieData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processTransactions(transactions || []);
  }, [transactions]);

  useEffect(() => {
    const syncData = async () => {
      try {
        if (!token) return;
        setLoading(true);
        await syncAllData(token);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard sync failed:', err);
        setLoading(false);
      }
    };
    syncData();
  }, [token]);

  const processTransactions = (data) => {
    const dailyTotals = {};
    const expenseBreakdown = {};
    const incomeBreakdown = {};

    data.forEach((trx) => {
      if (trx.deleted_at) return; // skip deleted
      const dateKey = new Date(trx.date).toISOString().slice(0, 10);
      const amount = Number(trx.amount);

      if (!dailyTotals[dateKey]) dailyTotals[dateKey] = { income: 0, expense: 0 };
      dailyTotals[dateKey][trx.transaction_type] += amount;

      if (trx.transaction_type === 'expense') {
        expenseBreakdown[trx.category] = (expenseBreakdown[trx.category] || 0) + amount;
      } else {
        incomeBreakdown[trx.category] = (incomeBreakdown[trx.category] || 0) + amount;
      }
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    setDailyData(sortedDates.map(date => ({
      label: date.slice(5),
      income: dailyTotals[date].income,
      expense: dailyTotals[date].expense,
    })));

    const formatPieData = (breakdown) =>
      Object.entries(breakdown).map(([category, value], index) => ({
        value,
        label: category,
        text: `${category}: ${Math.round((value / Object.values(breakdown).reduce((a,b)=>a+b,0)) * 100)}%`,
        color: chartColors[index % chartColors.length],
      }));

    setExpensePieData(formatPieData(expenseBreakdown));
    setIncomePieData(formatPieData(incomeBreakdown));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>نقدینگی روزانه</Text>
      <ScrollView horizontal>
        <BarChart
          barWidth={24}
          data={dailyData.map(item => ({
            label: item.label,
            frontColor: '#4CAF50',
            sideColor: '#388E3C',
            topLabelComponent: () => <Text style={styles.barText}>{item.income / 1000}k</Text>,
            value: item.income,
          }))}
          spacing={16}
          height={200}
          yAxisThickness={1}
          xAxisLabelTextStyle={{ color: '#777' }}
        />
        <BarChart
          barWidth={24}
          data={dailyData.map(item => ({
            label: item.label,
            frontColor: '#F44336',
            sideColor: '#D32F2F',
            topLabelComponent: () => <Text style={styles.barText}>{item.expense / 1000}k</Text>,
            value: item.expense,
          }))}
          spacing={16}
          height={200}
          yAxisThickness={1}
          xAxisLabelTextStyle={{ color: '#777' }}
        />
      </ScrollView>

      <Text style={styles.header}>تجزیه هزینه‌ها</Text>
      <PieChart
        data={expensePieData}
        donut
        showText
        textColor="black"
        radius={100}
        innerRadius={60}
        textSize={12}
      />
      {expensePieData.map((item, index) => (
        <Text key={index} style={styles.legend}>
          <Text style={{ color: item.color }}>■ </Text>
          {item.text}
        </Text>
      ))}

      <Text style={styles.header}>تجزیه درآمدها</Text>
      <PieChart
        data={incomePieData}
        donut
        showText
        textColor="black"
        radius={100}
        innerRadius={60}
        textSize={12}
      />
      {incomePieData.map((item, index) => (
        <Text key={index} style={styles.legend}>
          <Text style={{ color: item.color }}>■ </Text>
          {item.text}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 18, fontWeight: '600', marginVertical: 12, color: '#333' },
  barText: { fontSize: 10, color: '#444', textAlign: 'center' },
  legend: { fontSize: 12, marginLeft: 10, marginTop: 4 },
});
