import antfu from '@antfu/eslint-config'

export default antfu({
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'no-undef': 'off',
    'no-constant-condition': 'off',
    'curly': ['error', 'all'],
    'vue/no-irregular-whitespace': 'warn',
    'vue/max-attributes-per-line': ['error', {
      multiline: {
        max: 1,
      },
      singleline: {
        max: 1,
      },
    }],
  },
})
