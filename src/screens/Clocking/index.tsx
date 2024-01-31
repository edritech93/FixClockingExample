import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Dimensions, Image, ScrollView, StyleSheet, View} from 'react-native';
import {
  Camera,
  useFrameProcessor,
  type Frame,
  CameraRuntimeError,
  useCameraFormat,
  useCameraDevice,
  type PhotoFile,
} from 'react-native-vision-camera';
import {
  scanFaces,
  detectFromBase64,
  type FaceBoundType,
  type FaceType,
} from 'vision-camera-face-detection';
import Animated, {
  useSharedValue as useSharedValueR,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {Worklets, useSharedValue} from 'react-native-worklets-core';
import {ActivityIndicator, Button, Text} from 'react-native-paper';
import {getPermissionReadStorage} from '../../libs/permission';
import {launchImageLibrary} from 'react-native-image-picker';
import {useResizePlugin} from 'vision-camera-resize-plugin';
import {useTensorflowModel} from 'react-native-fast-tflite';
import {decode} from 'base64-arraybuffer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
const enableHdr = false;
const enableNightMode = false;
const targetFps = 30;
var lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);

export default function App() {
  const [faceBase64, setFaceBase64] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  // const [tensorSample, setTensorSample] = useState<number[]>([]);
  const [tensorFace, setTensorFace] = useState<number[]>([]);
  const [dataCamera, setDataCamera] = useState<string | null>(null);

  const camera = useRef<Camera>(null);
  const device = useCameraDevice('front', {
    physicalDevices: [
      'ultra-wide-angle-camera',
      'wide-angle-camera',
      'telephoto-camera',
    ],
  });
  const format = useCameraFormat(device, [
    {fps: targetFps},
    {photoAspectRatio: screenAspectRatio},
    {photoResolution: 'max'},
  ]);
  const fps = Math.min(format?.maxFps ?? 1, targetFps);
  const {resize} = useResizePlugin();
  // const faceString = useSharedValue<string>('');
  const rectWidth = useSharedValue(100); // rect width
  const rectHeight = useSharedValue(100); // rect height
  const rectX = useSharedValue(100); // rect x position
  const rectY = useSharedValue(100); // rect y position
  const rectWidthR = useSharedValueR(100); // rect width
  const rectHeightR = useSharedValueR(100); // rect height
  const rectXR = useSharedValueR(0); // rect x position
  const rectYR = useSharedValueR(0); // rect y position
  const fileModel = useTensorflowModel(
    require('../../assets/mobile_face_net.tflite'),
  );
  const model = fileModel.state === 'loaded' ? fileModel.model : undefined;

  const updateRect = Worklets.createRunInJsFn((frame: any) => {
    rectWidthR.value = frame.width;
    rectHeightR.value = frame.height;
    rectXR.value = frame.x;
    rectYR.value = frame.y;
  });
  // const updateFace = Worklets.createRunInJsFn((array: Uint8Array) => {
  //   faceString.value = image;
  // });

  useEffect(() => {
    async function _getPermission() {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    }
    _getPermission();
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      const start = performance.now();
      const dataFace: FaceType = scanFaces(frame);
      // console.log('dataFace => ', dataFace);
      // NOTE: handle face detection
      if (model && dataFace && dataFace.bounds) {
        const {width: frameWidth, height: frameHeight} = frame;
        const xFactor = SCREEN_WIDTH / frameWidth;
        const yFactor = SCREEN_HEIGHT / frameHeight;
        const bounds: FaceBoundType = dataFace.bounds;
        rectWidth.value = bounds.width * xFactor;
        rectHeight.value = bounds.height * yFactor;
        rectX.value = bounds.x * xFactor;
        rectY.value = bounds.y * yFactor;
        updateRect({
          width: rectWidth.value,
          height: rectHeight.value,
          x: rectX.value,
          y: rectY.value,
        });
        // NOTE: handle resize frame
        const arrayBuffer = resize(frame, {
          size: {
            x: rectX.value,
            y: rectY.value,
            width: 112,
            height: 112,
          },
          pixelFormat: 'rgb',
          dataType: 'float32',
        });
        console.log('arrayBuffer => ', arrayBuffer.byteLength);
        const array: Float32Array = new Float32Array(arrayBuffer);
        console.log('array => ', array.length);
        // const output = model.runSync([array] as any[]);
        // console.log('Result: ', output.length);

        // for (let index = 0; index < output.length; index++) {
        //   const knownEmb = output[index];
        //   let distance = 0.0;
        //   for (let i = 0; i < faceTensor.length; i++) {
        //     const diff = faceTensor[i] - knownEmb[i];
        //     distance += diff * diff;
        //   }
        //   console.log('distance => ', distance);
        // }
        const end = performance.now();
        console.log(`Performance: ${end - start}ms`);
      }
    },
    [model],
  );

  const faceAnimStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      backgroundColor: 'red',
      width: withSpring(rectWidthR.value),
      height: withSpring(rectHeightR.value),
      transform: [
        {translateX: withSpring(rectXR.value)},
        {translateY: withSpring(rectYR.value)},
      ],
    };
  });

  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error);
  }, []);

  const onInitialized = useCallback(() => {
    console.log('Camera initialized!');
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
      console.log('arrayBuffer => ', arrayBuffer.byteLength);
      // const buffFloat = resizeBuffer(arrayBuffer);
      // var oldBuffer = new ArrayBuffer(20);
      // var newBuffer = new ArrayBuffer(150528);
      const array: Float32Array = new Float32Array(arrayBuffer);
      console.log('array => ', array.length);
      const output = model.runSync([array] as any);
      console.log('Result: ', output.length);
    }
  };

  // function resizeBuffer(buff: ArrayBuffer) {
  //   // console.log('buff1 => ', buff.byteLength);
  //   // let newBuff: ArrayBuffer = new ArrayBuffer(150528);
  //   // for (let i = 0; i < buff.byteLength; i++) {
  //   //   newBuff[i] = buff[i];
  //   // }
  //   // buff = newBuff;
  //   // console.log('buff2 => ', buff.byteLength);
  //   // return buff;

  //   var oldBuffer = new ArrayBuffer(20);

  //   var newBuffer = new ArrayBuffer(40);
  //   new Float32Array(newBuffer).set(oldBuffer);
  // }

  function decodeBase64(base64: string) {
    var bufferLength = base64.length * 0.75;
    const len = base64.length;
    let i;
    let p = 0;
    let encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === '=') {
      bufferLength--;
      if (base64[base64.length - 2] === '=') {
        bufferLength--;
      }
    }
    var arraybuffer = new ArrayBuffer(150528),
      bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
  }

  const _onPressTake = async () => {
    if (camera.current && !dataCamera) {
      const data: PhotoFile = await camera.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'speed',
      });
      setDataCamera(`file:///${data.path}`);
    }
  };

  if (dataCamera) {
    return (
      <View style={styles.container}>
        <Image
          style={styles.imgPreview}
          source={{uri: dataCamera}}
          resizeMode={'contain'}
        />
        <Button
          mode={'contained'}
          style={styles.btnClose}
          onPress={() => setDataCamera(null)}>
          Remove
        </Button>
      </View>
    );
  } else if (device != null && format != null && hasPermission) {
    const pixelFormat = format.pixelFormats.includes('yuv') ? 'yuv' : 'native';
    return (
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          format={format}
          fps={fps}
          photoHdr={enableHdr}
          lowLightBoost={device.supportsLowLightBoost && enableNightMode}
          isActive={true}
          onInitialized={onInitialized}
          onError={onError}
          enableZoomGesture={false}
          enableFpsGraph={false}
          orientation={'portrait'}
          pixelFormat={pixelFormat}
          photo={true}
          video={false}
          audio={false}
          frameProcessor={frameProcessor}
        />
        <Animated.View style={faceAnimStyle} />
        <View style={styles.wrapBottom}>
          <Button mode={'contained'} onPress={_onOpenImage}>
            Open Image
          </Button>
          <Button mode={'contained'} onPress={_onPressTake}>
            Take Photo
          </Button>
          <Button mode={'contained'} onPress={() => setTensorFace([])}>
            Clear Data
          </Button>
        </View>
        {faceBase64.length > 0 && (
          <Image
            source={{uri: `data:image/png;base64,${faceBase64}`}}
            style={styles.imgFace}
          />
        )}
        <ScrollView>
          <Text style={styles.textResult}>{`Result: ${JSON.stringify(
            tensorFace,
          )}`}</Text>
        </ScrollView>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textResult: {
    color: 'black',
    marginHorizontal: 8,
  },
  wrapBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  imgPreview: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  btnClose: {},
  imgFace: {
    height: 112,
    width: 112,
  },
});
