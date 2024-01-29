import React from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
import StackNavigation from './Router';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StackNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
