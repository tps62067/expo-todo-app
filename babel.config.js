module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/contexts': './src/contexts',
          '@/constants': './src/constants',
          '@/hooks': './src/hooks',
          '@/utils': './src/utils',
        }
      }]
    ],
  };
}; 