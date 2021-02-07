const CracoLessPlugin = require('craco-less');
const CracoExtendScope = require('@dvhb/craco-extend-scope');

module.exports = {
  plugins: [
    { plugin: CracoExtendScope, options: { path: '@packages' } },
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
