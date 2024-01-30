import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  getPermissionCamera,
  getPermissionReadStorage,
  getPermissionWriteStorage,
} from '../../libs/permission';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackType} from '../../types/RootStackType';
import {Button} from 'react-native-paper';

interface IHome extends NativeStackScreenProps<RootStackType, 'Home'> {}

export default function Home(props: IHome) {
  const {navigation} = props;

  useEffect(() => {
    async function _getPermission() {
      await getPermissionCamera().catch((error: Error) => {
        console.log(error);
        return;
      });
      await getPermissionReadStorage().catch((error: Error) => {
        console.log(error);
        return;
      });
      await getPermissionWriteStorage().catch((error: Error) => {
        console.log(error);
        return;
      });
    }
    _getPermission();
  }, []);

  return (
    <View style={styles.container}>
      <Button mode={'contained'} onPress={() => navigation.push('Clocking')}>
        Test Clocking
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
