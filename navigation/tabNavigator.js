import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Search from "../screens/search";
import Transaction from "../screens/transaction";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="transaction" component={Transaction} />
      <Tab.Screen name="search" component={Search} />
    </Tab.Navigator>
  );
}