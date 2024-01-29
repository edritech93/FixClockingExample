const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const {
  resolver: {sourceExts, assetExts},
} = defaultConfig;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    ...defaultConfig.resolver,
    assetExts: [...assetExts, 'tflite'],
    sourceExts: [...sourceExts, 'tflite'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
