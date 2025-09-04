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
import { getEntities, syncAllData } from '../db';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [persons, setPersons] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [expensePieData, setExpensePieData] = useState([]);
  const [incomePieData, setIncomePieData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load local cached data first
      const localTxns = await getEntities("transactions");
      const localPersons = await getEntities("persons");
      const localEvents = await getEntities("events");

      setTransactions(localTxns);
      setPersons(localPersons);
      setEvents(localEvents);
      processChartData(localTxns);

      // Sync everything with backend
      await syncAllData(userId);

      // Reload updated local data
      const updatedTxns = await getEntities("transactions");
      const updatedPersons = await getEntities("persons");
      const updatedEvents = await getEntities("events");

      setTransactions(updatedTxns);
      setPersons(updatedPersons);
      setEvents(updatedEvents);
      processChartData(updatedTxns);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    const dailyTotals = {};
    const expenseBreakdown = {};
    const incomeBreakdown = {};
    let expenseRecurringTotal = 0;
    let expenseTotal = 0;
    let incomeRecurringTotal = 0;
    let incomeTotal = 0;

    data.forEach((trx) => {
      const dateKey = trx.created_at?.slice(0, 10);
      const amount = Number(trx.amount);

      if (!dailyTotals[dateKey]) dailyTotals[dateKey] = { income: 0, expense: 0 };
      dailyTotals[dateKey][trx.transaction_type] += amount;

      if (trx.transaction_type === 'expense') {
        expenseBreakdown[trx.category] = (expenseBreakdown[trx.category] || 0) + amount;
        expenseTotal += amount;
        if (trx.recurrence) expenseRecurringTotal += amount;
      } else {
        incomeBreakdown[trx.category] = (incomeBreakdown[trx.category] || 0) + amount;
        incomeTotal += amount;
        if (trx.recurrence) incomeRecurringTotal += amount;
      }
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    setDailyData(sortedDates.map(date => ({
      label: date.slice(5),
      income: dailyTotals[date].income,
      expense: dailyTotals[date].expense,
    })));

    const formatPieData = (breakdown, total) =>
      Object.entries(breakdown).map(([category, value], index) => ({
        value,
        label: category,
        text: `${category}: ${Math.round((value / total) * 100)}%`,
        color: chartColors[index % chartColors.length],
      }));

    setExpensePieData(formatPieData(expenseBreakdown, expenseTotal));
    setIncomePieData(formatPieData(incomeBreakdown, incomeTotal));
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
      <Text style={styles.header}>Daily Cash Flow</Text>
      <ScrollView horizontal>
        <BarChart
          barWidth={24}
          data={dailyData.map(item => ({
            label: item.label,
            frontColor: '#4CAF50',
            sideColor: '#388E3C',
            topLabelComponent: () => (
              <Text style={styles.barText}>{item.income / 1000}k</Text>
            ),
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
            topLabelComponent: () => (
              <Text style={styles.barText}>{item.expense / 1000}k</Text>
            ),
            value: item.expense,
          }))}
          spacing={16}
          height={200}
          yAxisThickness={1}
          xAxisLabelTextStyle={{ color: '#777' }}
        />
      </ScrollView>

      <Text style={styles.header}>Expense Breakdown</Text>
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

      <Text style={styles.header}>Income Breakdown</Text>
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
};

const chartColors = [
  '#F44336',
  '#2196F3',
  '#4CAF50',
  '#FFC107',
  '#9C27B0',
  '#00BCD4',
  '#FF5722',
  '#8BC34A',
  '#E91E63',
  '#3F51B5',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
    color: '#333',
  },
  barText: {
    fontSize: 10,
    color: '#444',
    textAlign: 'center',
  },
  legend: {
    fontSize: 12,
    marginLeft: 10,
    marginTop: 4,
  },
});

export default DashboardScreen;
