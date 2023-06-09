import React, { Component } from 'react';
import TabNavigator from './navigation/tabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { Rajdhani_600SemiBold } from '@expo-google-fonts/rajdhani';
import *as Font from 'expo-font'


export default class App extends Component {
  constructor() {
    super()
    this.state = {
      fontLoaded: false,

    }
  }
  async loadFonts() {
    await Font.loadAsync({
      Rajdhani_600SemiBold: Rajdhani_600SemiBold
    });
    this.setState({ fontLoaded: true });
  }

  componentDidMount() {
    this.loadFonts();
  }
  render() {
    const { fontLoaded } = this.state;
    if (fontLoaded) {
      return (
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      );
    }
    return null;
  }
   
  }


