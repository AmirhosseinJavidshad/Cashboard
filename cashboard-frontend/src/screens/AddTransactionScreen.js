// src/screens/AddTransactionScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Switch, ScrollView,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addTransaction, syncAllData } from '../database/db';

export default function AddTransactionScreen({ navigation, userId }) {
  const [transactionType, setTransactionType] = useState('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [bankAccount, setBankAccount] = useState('');
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);

  const expenseCategories = [
    'home_utilities', 'transportation', 'food', 'health_insurance',
    'savings_debt', 'personal_family', 'leisure'
  ];

  const incomeCategories = ['salary', 'personal_business', 'other'];

  const recurrenceOptions = ['daily', 'weekly', 'monthly', 'yearly'];

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Error', 'Please select a category.'); return; }
    const parsedAmount = parseInt(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { Alert.alert('Error', 'Please enter a valid amount.'); return; }
    if (isRecurring && !recurrencePeriod) { Alert.alert('Error', 'Please select a recurrence period.'); return; }

    const transaction = {
      transaction_type: transactionType,
      category,
      amount: parsedAmount,
      bank_account: bankAccount || null,
      note: note || null,
      is_recurring: isRecurring,
      recurrence_period: isRecurring ? recurrencePeriod : null,
      recurrence_end_date: isRecurring ? recurrenceEndDate.getTime() : null,
      date: date.getTime(), // store as timestamp
    };

    try {
      await addTransaction(transaction);

      if (userId) {
        await syncAllData(userId);
      }

      navigation.goBack();
    } catch (err) {
      console.error('Error saving transaction locally', err);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Transaction Type</Text>
        <Picker
          selectedValue={transactionType}
          onValueChange={(val) => { setTransactionType(val); setCategory(''); }}
        >
          <Picker.Item label="Expense" value="expense" />
          <Picker.Item label="Income" value="income" />
        </Picker>

        <Text style={styles.label}>Category</Text>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Date & Time</Text>
        <Button title={date.toLocaleString()} onPress={() => setShowDatePicker(true)} />
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const updated = new Date(date);
                updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                setDate(updated);
                setShowTimePicker(true);
              }
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const updated = new Date(date);
                updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
                setDate(updated);
              }
            }}
          />
        )}

        <Text style={styles.label}>Bank Account</Text>
        <TextInput
          style={styles.input}
          value={bankAccount}
          onChangeText={setBankAccount}
          placeholder="optional"
        />

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="optional"
        />

        <View style={styles.switchRow}>
          <Text style={{ flex: 1 }}>Is Recurring?</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} />
        </View>

        {isRecurring && (
          <>
            <Text style={styles.label}>Recurrence Period</Text>
            <Picker selectedValue={recurrencePeriod} onValueChange={setRecurrencePeriod}>
              <Picker.Item label="Select period..." value="" />
              {recurrenceOptions.map(opt => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>

            <Text style={styles.label}>Recurrence End Date</Text>
            <Button
              title={recurrenceEndDate.toLocaleDateString()}
              onPress={() => setShowRecurrenceEndDatePicker(true)}
            />
            {showRecurrenceEndDatePicker && (
              <DateTimePicker
                value={recurrenceEndDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowRecurrenceEndDatePicker(false);
                  if (selectedDate) setRecurrenceEndDate(selectedDate);
                }}
              />
            )}
          </>
        )}

        <View style={{ marginVertical: 30 }}>
          <Button title="Save Transaction" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  label: { marginTop: 20, marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
});
