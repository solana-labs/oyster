const CracoLessPlugin = require('craco-less');
const path = require('path');
const fs = require('fs');

// Handle relative paths to sibling packages
const appDirectory = fs.realpathSync(process.cwd());
const resolvePackage = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      paths.appBuild = webpackConfig.output.path = path.resolve(
        './../../build/proposals',
      );
      return webpackConfig;
    },
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#2abdd2' },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
