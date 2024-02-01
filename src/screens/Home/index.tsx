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
import {useTensorflowModel} from 'react-native-fast-tflite';
import {RootStackType} from '../../types/RootStackType';
import {decodeBase64} from '../../libs/processing';
import {Button} from 'react-native-paper';

interface IHome extends NativeStackScreenProps<RootStackType, 'Home'> {}

export default function Home(props: IHome) {
  const {navigation} = props;

  const [faceBase64, setFaceBase64] = useState('');
  const [tensorSample, setTensorSample] = useState<string>('[]');

  const fileModel = useTensorflowModel(
    require('../../assets/mobile_face_net.tflite'),
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
      const arrayBuffer: ArrayBuffer = decodeBase64(base64Face);
      const array: Float32Array = new Float32Array(arrayBuffer);
      const output = model.runSync([array] as any);
      const arrayTensor: number[] = [];
      output[0].map((e: any) => arrayTensor.push(e));
      setTensorSample(JSON.stringify(arrayTensor));
    }
  };

  useEffect(() => {
    console.log('tensorSample => ', tensorSample);
  }, [tensorSample]);

  return (
    <View style={styles.container}>
      <Button mode={'contained'} onPress={_onOpenImage}>
        Open Image
      </Button>
      {faceBase64.length > 0 && (
        <Image
          source={{uri: `data:image/png;base64,${faceBase64}`}}
          style={styles.imgFace}
        />
      )}
      <Button
        mode={'contained'}
        onPress={() => navigation.push('Clocking', {tensorSample})}>
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
    gap: 16,
  },
  imgFace: {
    height: 112,
    width: 112,
  },
});
