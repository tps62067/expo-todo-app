// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'wasm' to assetExts
if (config.resolver) {
  config.resolver.assetExts = config.resolver.assetExts
    ? config.resolver.assetExts.filter(ext => ext !== 'wasm').concat('wasm')
    : ['wasm'];
  
  // 添加路径别名配置
  config.resolver.alias = {
    '@': path.resolve(__dirname, 'src'),
    '@/components': path.resolve(__dirname, 'src/components'),
    '@/contexts': path.resolve(__dirname, 'src/contexts'),
    '@/constants': path.resolve(__dirname, 'src/constants'),
    '@/hooks': path.resolve(__dirname, 'src/hooks'),
    '@/utils': path.resolve(__dirname, 'src/utils'),
  };
} else {
  config.resolver = {
    assetExts: ['wasm'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/contexts': path.resolve(__dirname, 'src/contexts'),
      '@/constants': path.resolve(__dirname, 'src/constants'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
    }
  };
}

module.exports = config;
