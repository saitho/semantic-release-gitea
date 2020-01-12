const {isNil, castArray} = require('lodash');

module.exports = (
    {
        giteaUrl,
        giteaApiPathPrefix,
        assets,
    },
    {env}
) => ({
    giteaToken: env.GITEA_TOKEN,
    giteaUrl: giteaUrl || env.GITEA_URL,
    giteaApiPathPrefix: giteaApiPathPrefix || env.GITEA_PREFIX || '',
    assets: assets ? castArray(assets) : assets,
});
