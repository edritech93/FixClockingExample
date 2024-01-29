import React, {useRef} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {RootStackType} from './types/RootStackType';
import Home from './screens/Home';
import Clocking from './screens/Clocking';

const Stack = createNativeStackNavigator<RootStackType>();

export default function StackNavigation() {
  const REF_NAV = useRef<any>();

  return (
    <NavigationContainer ref={REF_NAV}>
      <Stack.Navigator
        initialRouteName={'Home'}
        screenOptions={() => ({
          shadowColor: 'transparent',
          borderBottomWidth: 0,
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
          headerShadowVisible: false,
        })}>
        <Stack.Screen name={'Home'} component={Home} />
        <Stack.Screen name={'Clocking'} component={Clocking} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
