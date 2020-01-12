const {isNil, castArray} = require('lodash');

module.exports = (
    {
        giteaUrl,
        giteaApiPathPrefix,
        assets,
        successComment,
        failTitle,
        failComment,
        labels,
        assignees,
        releasedLabels,
    },
    {env}
) => ({
    giteaToken: env.GITEA_TOKEN,
    giteaUrl: giteaUrl || env.GITEA_URL,
    giteaApiPathPrefix: giteaApiPathPrefix || env.GITEA_PREFIX || '',
    assets: assets ? castArray(assets) : assets,
    successComment,
    failTitle: isNil(failTitle) ? 'The automated release is failing 🚨' : failTitle,
    failComment,
    labels: isNil(labels) ? ['semantic-release'] : labels === false ? false : castArray(labels),
    assignees: assignees ? castArray(assignees) : assignees,
    releasedLabels: isNil(releasedLabels)
        ? [`released<%= nextRelease.channel ? \` on @\${nextRelease.channel}\` : "" %>`]
        : releasedLabels === false
            ? false
            : castArray(releasedLabels),
});
