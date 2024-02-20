import React, {useEffect, useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {
  getPermissionCamera,
  getPermissionReadStorage,
  getPermissionWriteStorage,
} from '../../libs/permission';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {detectFromBase64, initTensor} from 'vision-camera-face-detection';
import {launchImageLibrary} from 'react-native-image-picker';
import {RootStackType} from '../../types/RootStackType';
import {Button} from 'react-native-paper';

interface IHome extends NativeStackScreenProps<RootStackType, 'Home'> {}

export default function Home(props: IHome) {
  const {navigation} = props;

  const [faceSample1, setFaceSample1] = useState('');
  const [faceSample2, setFaceSample2] = useState('');
  const [tensorData1, setTensorData1] = useState<number[]>([]);
  const [tensorData2, setTensorData2] = useState<number[]>([]);

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

  useEffect(() => {
    initTensor('mobile_face_net', 1)
      .then(response => console.log(response))
      .catch(error => console.log(error));
  }, []);

  const _onOpenSample1 = async () => {
    await getPermissionReadStorage().catch((error: Error) => {
      console.log(error);
      return;
    });
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    }).catch(error => {
      console.log(error);
      return;
    });
    if (
      result &&
      result.assets &&
      result.assets.length > 0 &&
      result.assets[0]?.uri &&
      result.assets[0]?.base64
    ) {
      const base64Sample1 = result.assets[0].base64;
      setFaceSample1(base64Sample1);
      const objFace1 = await detectFromBase64(base64Sample1).catch(
        (error: Error) => {
          console.log(error);
          return;
        },
      );
      console.log('objFace1 => ', objFace1);
    }
  };

  const _onOpenSample2 = async () => {
    await getPermissionReadStorage().catch((error: Error) => {
      console.log(error);
      return;
    });
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    }).catch(error => {
      console.log(error);
      return;
    });
    if (
      result &&
      result.assets &&
      result.assets.length > 0 &&
      result.assets[0]?.uri &&
      result.assets[0]?.base64
    ) {
      const base64Sample2 = result.assets[0].base64;
      setFaceSample2(base64Sample2);
      const objFace2 = await detectFromBase64(base64Sample2).catch(
        (error: Error) => {
          console.log(error);
          return;
        },
      );
      console.log('objFace2 => ', objFace2);
    }
  };

  function _onTensor() {
    for (let index = 0; index < tensorData1.length; index++) {
      let distance = 0.0;
      for (let i = 0; i < tensorData2.length; i++) {
        const diff = tensorData2[i] - tensorData1[i];
        distance += diff * diff;
      }
      console.log(`${new Date().toTimeString()} = `, distance);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.wrapSample}>
        <Button mode={'contained'} onPress={_onOpenSample1}>
          Add Image Sample 1
        </Button>
        {faceSample1.length > 0 && (
          <Image
            source={{uri: `data:image/png;base64,${faceSample1}`}}
            style={styles.imgFace}
          />
        )}
        <Button mode={'contained'} onPress={_onOpenSample2}>
          Add Image Sample 2
        </Button>
        {faceSample2.length > 0 && (
          <Image
            source={{uri: `data:image/png;base64,${faceSample2}`}}
            style={styles.imgFace}
          />
        )}
        <Button mode={'contained'} onPress={() => _onTensor()}>
          Do Tensor
        </Button>
      </View>
      <Button
        mode={'contained'}
        onPress={() =>
          navigation.push('Clocking', {tensorSample: tensorData1})
        }>
        Goto Clocking
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  wrapSample: {
    flex: 1,
    gap: 16,
  },
  imgFace: {
    height: 112,
    width: 112,
  },
});

// Byte Length for model mobile_face_net.tflite
// 150528
