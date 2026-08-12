const base = require('./webpack.config');

/**
 * Serves the real extension bundles over HTTPS for local Azure DevOps testing.
 *
 * Paired with vss-extension.dev.json, which points the installed extension's
 * baseUri at https://localhost:3000. Azure DevOps then loads the contribution
 * iframes from here instead of from the packaged .vsix, so a rebuild is all it
 * takes to see a change — no republishing.
 *
 * See docs/LOCAL_TESTING.md.
 */
module.exports = {
  ...base,
  mode: 'development',
  devServer: {
    server: 'https',
    port: 3000,
    hot: false,
    liveReload: false,
    // The Azure DevOps page is the parent frame, so the iframe is cross-origin
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    allowedHosts: 'all',
    static: false,
    devMiddleware: {
      // Serve from memory at the same paths the manifest declares
      publicPath: '/dist/'
    }
  }
};
