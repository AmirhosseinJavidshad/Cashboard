import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/axios';
import { MMKV } from 'react-native-mmkv';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const storage = new MMKV({ id: 'transactions_store' });

const isLoggedIn = () => !!storage.getString('auth_token');

export default function AddTransactionScreen({ navigation }) {
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
    { value: 'home_utilities', label: 'Home & Utilities' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'food', label: 'Food' },
    { value: 'health_insurance', label: 'Health & Insurance' },
    { value: 'savings_debt', label: 'Savings & Debt' },
    { value: 'personal_family', label: 'Personal & Family' },
    { value: 'leisure', label: 'Leisure' },
  ];

  const incomeCategories = [
    { value: 'salary', label: 'Salary' },
    { value: 'personal_business', label: 'Personal Business' },
    { value: 'other', label: 'Other' },
  ];

  const recurrenceOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const saveTransactionLocally = (transaction) => {
    const current = JSON.parse(storage.getString('transactions') || '[]');
    current.unshift(transaction);
    storage.set('transactions', JSON.stringify(current));
  };

  const markTransactionSynced = (clientUUID) => {
    const current = JSON.parse(storage.getString('transactions') || '[]');
    const updated = current.map(tx =>
      tx.client_uuid === clientUUID ? { ...tx, synced: true } : tx
    );
    storage.set('transactions', JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Error', 'Please select a category.'); return; }
    const parsedAmount = parseInt(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.'); return;
    }
    if (!bankAccount.trim()) { Alert.alert('Error', 'Please enter the bank account.'); return; }
    if (isRecurring && !recurrencePeriod) { Alert.alert('Error', 'Please select a recurrence period.'); return; }

    const clientUUID = uuidv4();
    const transaction = {
      client_uuid: clientUUID,
      transaction_type: transactionType,
      category,
      amount: parsedAmount,
      date: date.toISOString(),
      bank_account: bankAccount,
      note,
      is_recurring: isRecurring,
      recurrence_period: isRecurring ? recurrencePeriod : null,
      recurrence_end_date: isRecurring ? recurrenceEndDate.toISOString().split('T')[0] : null,
      synced: false,
      deleted_at: null, // NEW: soft-delete field
    };

    saveTransactionLocally(transaction);

    if (isLoggedIn()) {
      try {
        await api.post('transactions/', transaction);
        markTransactionSynced(clientUUID);
      } catch (err) {
        console.log('Online sync failed — will retry later.', err.message);
      }
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Transaction Type */}
        <Text style={styles.label}>Transaction Type</Text>
        <Picker selectedValue={transactionType} onValueChange={(val) => { setTransactionType(val); setCategory(''); }}>
          <Picker.Item label="Expense" value="expense" />
          <Picker.Item label="Income" value="income" />
        </Picker>

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <Picker selectedValue={category} onValueChange={setCategory}>
          {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
            <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
          ))}
        </Picker>

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

        {/* Date & Time */}
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
                setDate(updated); setShowTimePicker(true);
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
              if (selectedTime) { const updated = new Date(date); updated.setHours(selectedTime.getHours(), selectedTime.getMinutes()); setDate(updated); }
            }}
          />
        )}

        {/* Bank Account */}
        <Text style={styles.label}>Bank Account</Text>
        <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} placeholder="e.g., Saman" />

        {/* Note */}
        <Text style={styles.label}>Note</Text>
        <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="optional" />

        {/* Recurring */}
        <View style={styles.switchRow}>
          <Text style={{ flex: 1 }}>Is Recurring?</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} />
        </View>
        {isRecurring && (
          <>
            <Text style={styles.label}>Recurrence Period</Text>
            <Picker selectedValue={recurrencePeriod} onValueChange={setRecurrencePeriod}>
              <Picker.Item label="Select period..." value="" />
              {recurrenceOptions.map(opt => (<Picker.Item key={opt.value} label={opt.label} value={opt.value} />))}
            </Picker>

            <Text style={styles.label}>Recurrence End Date</Text>
            <Button title={recurrenceEndDate.toLocaleDateString()} onPress={() => setShowRecurrenceEndDatePicker(true)} />
            {showRecurrenceEndDatePicker && (
              <DateTimePicker value={recurrenceEndDate} mode="date" display="default" onChange={(event, selectedDate) => { setShowRecurrenceEndDatePicker(false); if (selectedDate) setRecurrenceEndDate(selectedDate); }} />
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
