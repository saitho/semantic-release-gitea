const debug = require('debug')('semantic-release:github');
const {RELEASE_NAME} = require('./definitions/constants');
const parseGithubUrl = require('./parse-github-url');
const resolveConfig = require('./resolve-config');
const getClient = require('./get-client');
const isPrerelease = require('./is-prerelease');

module.exports = async (pluginConfig, context) => {
  const {
    options: {repositoryUrl},
    branch,
    nextRelease: {name, gitTag, notes},
    logger,
  } = context;
  const {giteaToken, giteaUrl, giteaApiPathPrefix} = resolveConfig(pluginConfig, context);
  const {owner, repo} = parseGithubUrl(repositoryUrl);
  const gitea = getClient(giteaToken, giteaUrl, giteaApiPathPrefix);
  let releaseId;

  const release = {prerelease: isPrerelease(branch), tag_name: gitTag, name: name};
  debug('release object: %O', release);

  try {
    const release = await gitea.getReleaseByTag(owner, repo, gitTag);
    releaseId = release.id;
  } catch (error) {
    if (error.hasOwnProperty('response')) {
      if (error.response.statusCode === 404) {
        logger.log('There is no release for tag %s, creating a new one', gitTag);

        release.body = notes;
        const response = await gitea.createRelease(owner, repo, release);
        const parsedResponse = JSON.parse(response.body);
        const url = parsedResponse.url;

        logger.log('Published Gitea release: %s', url);
        return {url, name: RELEASE_NAME};
      }
    }
    throw error;
  }

  debug('release release_id: %o', releaseId);

  const response = await gitea.updateRelease(owner, repo, releaseId, release);
  const parsedResponse = JSON.parse(response.body);
  const url = parsedResponse.url;

  logger.log('Updated Gitea release: %s', url);

  return {url, name: RELEASE_NAME};
};
