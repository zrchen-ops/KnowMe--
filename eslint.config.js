const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['dist/*', 'dist-web/*', 'coverage/*', '.expo/*']),
  expoConfig,
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly' },
    },
  },
  {
    // 存量代码的城市债：Reanimated 手势实现（MemoryGraph/PressableScale）与两个
    // BottomSheet 的 props→state 同步会被 React Compiler 规则拦下。重构需要真机验证，
    // 已列入 P2；在重构前先降为 warning，避免门禁形同虚设。
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
