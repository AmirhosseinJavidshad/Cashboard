import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

import TransactionsScreen from '../screens/TransactionsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GoalsScreen from '../screens/GoalsScreen';
import AuthScreen from '../screens/AuthScreen'; // new screen

const Tab = createBottomTabNavigator();
const TransactionsStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator(); // for modal navigation

function TransactionsStackNavigator() {
  return (
    <TransactionsStack.Navigator>
      <TransactionsStack.Screen
        name="TransactionsList"
        component={TransactionsScreen}
        options={{ headerShown: false }}
      />
      <TransactionsStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'افزودن تراکنش', presentation: 'modal' }}
      />
    </TransactionsStack.Navigator>
  );
}

// Custom header with tappable user indicator
function AppHeader({ navigation }) {
  const { user, guestId } = useAuth();

  const isGuest = !user; // if no user, treat as guest
  const displayName = isGuest ? guestId : user.username;
  const dotColor = isGuest ? 'gray' : 'green';

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: 'white',
        position: 'relative',
      }}
    >
      {/* Logo in the center */}
      <Image
        source={require('../assets/logo.png')}
        style={{ width: 120, height: 40, resizeMode: 'contain' }}
      />

      {/* User status on top-right */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          position: 'absolute',
          right: 12,
        }}
        onPress={() => navigation.navigate('Auth')}
      >
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: dotColor,
            marginRight: 6,
          }}
        />
        <Text style={{ fontSize: 14, color: '#333' }}>{displayName}</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'swap-horizontal-outline';
          if (route.name === 'Dashboard') iconName = 'bar-chart-outline';
          else if (route.name === 'Goals') iconName = 'trophy-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Transactions" component={TransactionsStackNavigator} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main">
          {({ navigation }) => (
            <View style={{ flex: 1 }}>
              <AppHeader navigation={navigation} />
              <MainTabs />
            </View>
          )}
        </RootStack.Screen>
        <RootStack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
