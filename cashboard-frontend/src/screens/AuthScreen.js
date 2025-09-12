// src/screens/AuthScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../AuthContext';
import { login, register, getOrCreateGuestId } from '../api/auth';

export default function AuthScreen({ navigation }) {
  const { setUser } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false); // toggle between login/register

  async function handleSubmit() {
    try {
      const guestId = await getOrCreateGuestId(); // in case we want to merge guest data
      if (isRegister) {
        await register(username, password); // optionally merge guestId if needed
        Alert.alert('Success', 'Account created! Please log in.');
        setIsRegister(false);
        return;
      } else {
        const data = await login(username, password); // returns {access, refresh}
        setUser({ username, token: data.access }); // update AuthContext
        navigation.goBack(); // return to previous screen (app)
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Login/Register failed. Check credentials or network.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegister ? 'Sign Up' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.toggleText}>
          {isRegister ? 'Have an account? Login' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: 'white' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  toggleText: { color: '#333', textAlign: 'center', marginTop: 8 },
});
