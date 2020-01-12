const {isNil, castArray} = require('lodash');

module.exports = (
  {
    githubUrl,
    githubApiPathPrefix,
    proxy,
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
  githubToken: env.GITEA_TOKEN,
  githubUrl: githubUrl || env.GITEA_URL,
  githubApiPathPrefix: githubApiPathPrefix || env.GITEA_PREFIX || '',
  proxy: proxy || env.HTTP_PROXY,
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
