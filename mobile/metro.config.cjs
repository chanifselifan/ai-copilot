const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Override the default config to prevent compatibility issues
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  platforms: ['ios', 'android', 'native', 'web'],
};

// Add transformer configuration
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Disable the problematic serializer plugins
config.serializer = {
  ...config.serializer,
  customSerializer: undefined,
};

module.exports = config;