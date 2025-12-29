module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],        // src 폴더를 루트로 설정
        alias: {
          '@': './src',         // @ = ./src 매핑
        },
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.tsx',
          '.js',
          '.jsx',
          '.json',
        ],
      },
    ],
  ],
};
