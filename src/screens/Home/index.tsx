import React, {useEffect, useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {
  getPermissionCamera,
  getPermissionReadStorage,
  getPermissionWriteStorage,
} from '../../libs/permission';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {detectFromBase64} from 'vision-camera-face-detection';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  loadTensorflowModel,
  useTensorflowModel,
} from 'react-native-fast-tflite';
import {RootStackType} from '../../types/RootStackType';
import {base64ToFloat32Array, decodeBase64} from '../../libs/processing';
import {Button} from 'react-native-paper';
import {decode} from 'base64-arraybuffer';

interface IHome extends NativeStackScreenProps<RootStackType, 'Home'> {}

export default function Home(props: IHome) {
  const {navigation} = props;

  const [faceBase64, setFaceBase64] = useState('');
  const [faceBase64R, setFaceBase64R] = useState('');
  const [tensorSample, setTensorSample] = useState<number[]>([]);
  const [tensorR, setTensorR] = useState<number[]>([]);

  const fileModel = useTensorflowModel(
    require('../../assets/mobile_face_net.tflite'),
    'core-ml',
  );
  const model = fileModel.state === 'loaded' ? fileModel.model : undefined;

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

  const _onOpenImage = async () => {
    // const model = await loadTensorflowModel(
    //   require('../../assets/mobile_face_net.tflite'),
    //   'core-ml',
    // );
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
      result.assets[0]?.base64 &&
      model
    ) {
      const base64Face = await detectFromBase64(result.assets[0].base64).catch(
        (error: Error) => {
          console.log(error);
          return;
        },
      );
      if (!base64Face) {
        return;
      }
      setFaceBase64(base64Face);
      const array: Float32Array = base64ToFloat32Array(base64Face);
      const output = model.runSync([array] as any);
      console.log('output => ', output);
      // const arrayTensor: number[] = [];
      // output[0].map((e: any) => arrayTensor.push(e));
      // setTensorSample(arrayTensor);
      // console.log('arrayTensor => ', arrayTensor);
    }
  };

  const _onOpenImageR = async () => {
    // const model = await loadTensorflowModel(
    //   require('../../assets/mobile_face_net.tflite'),
    //   'core-ml',
    // );
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
      result.assets[0]?.base64 &&
      model
    ) {
      const base64Face = await detectFromBase64(result.assets[0].base64).catch(
        (error: Error) => {
          console.log(error);
          return;
        },
      );
      if (!base64Face) {
        return;
      }
      setFaceBase64R(base64Face);
      const array: Float32Array = base64ToFloat32Array(base64Face);
      const output = model.runSync([array] as any);
      console.log('output => ', output);
      // const arrayTensor: number[] = [];
      // output[0].map((e: any) => arrayTensor.push(e));
      // setTensorR(arrayTensor);
      // console.log('arrayTensor => ', arrayTensor);
    }
  };

  function _onTensor() {
    console.log('tensorSample => ', tensorSample.length);
    console.log('tensorR => ', tensorR.length);
    for (let index = 0; index < tensorSample.length; index++) {
      let distance = 0.0;
      for (let i = 0; i < tensorR.length; i++) {
        const diff = tensorR[i] - tensorSample[i];
        distance += diff * diff;
      }
      console.log(`${new Date().toTimeString()} = `, distance);
    }
  }

  return (
    <View style={styles.container}>
      <Button mode={'contained'} onPress={_onOpenImage}>
        Add Image Sample
      </Button>
      {faceBase64.length > 0 && (
        <Image
          source={{uri: `data:image/png;base64,${faceBase64}`}}
          style={styles.imgFace}
        />
      )}
      <Button mode={'contained'} onPress={_onOpenImageR}>
        Add Image R
      </Button>
      {faceBase64R.length > 0 && (
        <Image
          source={{uri: `data:image/png;base64,${faceBase64R}`}}
          style={styles.imgFace}
        />
      )}
      <Button
        mode={'contained'}
        onPress={() => _onTensor()}
        // onPress={() => navigation.push('Clocking', {tensorSample})}
      >
        Test Clocking
      </Button>
      <Button
        mode={'contained'}
        onPress={() => navigation.push('Clocking', {tensorSample})}>
        Goto Clocking
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  imgFace: {
    height: 112,
    width: 112,
  },
});

// Byte Length for model mobile_face_net.tflite
// 150528
