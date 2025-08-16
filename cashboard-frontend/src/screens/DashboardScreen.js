import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  BarChart,
  PieChart,
} from 'react-native-gifted-charts';
import api from '../api/axios';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [expensePieData, setExpensePieData] = useState([]);
  const [incomePieData, setIncomePieData] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('transactions/?format=json');
      const trx = response.data.results; // ✅ FIXED
      setTransactions(trx);
      processChartData(trx);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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
      const dateKey = trx.date.slice(0, 10); // yyyy-mm-dd
      const amount = Number(trx.amount);

      // Daily chart
      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = { income: 0, expense: 0 };
      }
      dailyTotals[dateKey][trx.transaction_type] += amount;

      // Pie charts + recurring tracking
      if (trx.transaction_type === 'expense') {
        expenseBreakdown[trx.category] = (expenseBreakdown[trx.category] || 0) + amount;
        expenseTotal += amount;
        if (trx.is_recurring) expenseRecurringTotal += amount;
      } else {
        incomeBreakdown[trx.category] = (incomeBreakdown[trx.category] || 0) + amount;
        incomeTotal += amount;
        if (trx.is_recurring) incomeRecurringTotal += amount;
      }
    });

    // Daily Bar Chart Data
    const sortedDates = Object.keys(dailyTotals).sort();
    const barData = sortedDates.map((date) => ({
      label: date.slice(5), // show MM-DD
      income: dailyTotals[date].income,
      expense: dailyTotals[date].expense,
    }));

    setDailyData(barData);

    // Pie Data with legend formatting
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
