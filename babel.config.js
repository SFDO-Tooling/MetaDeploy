'use strict';

const presets = ['@babel/preset-react', '@babel/preset-typescript'];

module.exports = {
  presets: [
    ...presets,
    [
      '@babel/preset-env',
      {
        modules: false,
        corejs: '3',
        useBuiltIns: 'usage',
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
  ],
  env: {
    test: {
      presets: [
        ...presets,
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            corejs: '3',
            useBuiltIns: 'usage',
          },
        ],
      ],
    },
  },
};
