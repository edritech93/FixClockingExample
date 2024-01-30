import React from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
import {PaperProvider} from 'react-native-paper';
import StackNavigation from './Router';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <PaperProvider>
        <StackNavigation />
      </PaperProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
