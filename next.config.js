/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  webpack: (config, { isServer, dev }) => {
    // Common ignore patterns for both build and dev
    const ignoredPatterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/Application Data/**',
      '**/AppData/**',
      '**/Program Files/**',
      '**/Program Files (x86)/**',
      '**/Windows/**',
      '**/Users/**/Application Data/**',
      '**/Users/**/AppData/**',
      '**/Users/**/Cookies/**',
      '**/Users/**/Local Settings/**',
      '**/Users/**/Application Data/**',
      '**/Users/**/AppData/**',
      '**/Users/**/Cookies/**',
      '**/Users/**/Local Settings/**',
      '**/Users/**/My Documents/**',
      '**/Users/**/Documents/**',
      '**/Users/**/Downloads/**',
      '**/Users/**/Desktop/**',
      '**/Users/**/Favorites/**',
      '**/Users/**/Links/**',
      '**/Users/**/Music/**',
      '**/Users/**/Pictures/**',
      '**/Users/**/Videos/**',
      '**/Users/**/Saved Games/**',
      '**/Users/**/Searches/**',
      '**/Users/**/Start Menu/**',
      '**/Users/**/Templates/**',
      '**/Users/**/Recent/**',
      '**/Users/**/SendTo/**',
      '**/Users/**/PrintHood/**',
      '**/Users/**/NetHood/**',
      '**/Users/**/LocalLow/**',
      '**/Users/**/AppData/Local/**',
      '**/Users/**/AppData/LocalLow/**',
      '**/Users/**/AppData/Roaming/**',
    ];

    if (dev) {
      // Development-specific configuration
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ignoredPatterns,
      };
    }

    // Add a custom plugin to handle file system access during build
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.beforeRun.tap('IgnoreSystemDirs', (compilation) => {
          if (compilation.options && compilation.options.watchOptions) {
            compilation.options.watchOptions.ignored = ignoredPatterns;
          }
        });
      },
    });

    return config;
  },
  // Disable file system caching during build
  experimental: {
    turbotrace: {
      logLevel: 'error',
      logDetail: false,
      memoryLimit: 4096,
    },
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig; 