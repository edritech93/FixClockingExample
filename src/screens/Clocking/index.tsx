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
import {useResizePlugin} from 'vision-camera-resize-plugin';
import {useTensorflowModel} from 'react-native-fast-tflite';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackType} from '../../types/RootStackType';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
const enableHdr = false;
const enableNightMode = false;
const targetFps = 30;

interface IClocking extends NativeStackScreenProps<RootStackType, 'Clocking'> {}

export default function Clocking(props: IClocking) {
  const {tensorSample} = props.route.params;

  const [hasPermission, setHasPermission] = useState<boolean>(false);
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
      // const start = performance.now();
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
        // console.log('arrayBuffer => ', arrayBuffer.byteLength);
        const array: Float32Array = new Float32Array(arrayBuffer);
        // console.log('array => ', array.length);
        const output = model.runSync([array] as any[]);
        const arrayTensor = output[0];
        // console.log(arrayTensor);
        for (let index = 0; index < arrayTensor.byteLength; index++) {
          const knownEmb = output[index];
          let distance = 0.0;
          for (let i = 0; i < tensorSample.byteLength; i++) {
            const diff = tensorSample[i] - knownEmb[i];
            distance += diff * diff;
          }
          console.log('tensorSample => ', tensorSample.length);
          // console.log('arrayTensor => ', arrayTensor.byteLength);
          // console.log(
          //   new Date().toLocaleTimeString(),
          //   ' distance => ',
          //   distance,
          // );
        }
        // const end = performance.now();
        // console.log(`Performance: ${end - start}ms`);
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
          <Button mode={'contained'} onPress={_onPressTake}>
            Take Photo
          </Button>
          <Button mode={'contained'} onPress={() => setTensorFace([])}>
            Clear Data
          </Button>
        </View>
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
});
