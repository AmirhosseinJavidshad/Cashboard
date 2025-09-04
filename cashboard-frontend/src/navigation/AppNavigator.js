import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import TransactionsScreen from './screens/TransactionsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import DashboardScreen from './screens/DashboardScreen';
import GoalsScreen from './screens/GoalsScreen';
import DbTestScreen from './screens/DbTestScreen';


const Tab = createBottomTabNavigator();
const TransactionsStack = createNativeStackNavigator();

function TransactionsStackNavigator() {
  return (
    <TransactionsStack.Navigator>
      <TransactionsStack.Screen
        name="TransactionsList"
        component={TransactionsScreen}
        options={{ title: 'تراکنش‌ها' }}
      />
      <TransactionsStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'افزودن تراکنش', presentation: 'modal' }}
      />
    </TransactionsStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = 'swap-horizontal-outline'; // default transaction icon
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
        <Tab.Screen name="DBTest" component={DbTestScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
