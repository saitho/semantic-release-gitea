const {castArray} = require('lodash');

module.exports = (
    {
      giteaUrl,
      giteaApiPathPrefix,
      assets,
      skipUnsupportedAssets
    },
    {env}
) => ({
  giteaToken: env.GITEA_TOKEN,
  giteaUrl: giteaUrl || env.GITEA_URL,
  giteaApiPathPrefix: giteaApiPathPrefix || env.GITEA_PREFIX || '/api/v1',
  assets: assets ? castArray(assets) : assets,
  skipUnsupportedAssets: skipUnsupportedAssets || Boolean(env.GITEA_SKIP_UNSUPPORTED_ASSETS) || false,
});
