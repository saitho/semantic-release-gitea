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

  const release = {prerelease: isPrerelease(branch), tag_name: gitTag};
  debug('release object: %O', release);

  try {
    ({
      data: {id: releaseId},
    } = await gitea.getReleaseByTag(owner, repo, gitTag));
  } catch (error) {
    if (error.response.statusCode === 404) {
      logger.log('There is no release for tag %s, creating a new one', gitTag);

      const {
        data: {html_url: url},
      } = await gitea.createRelease(owner, repo, notes);

      logger.log('Published Gitea release: %s', url);
      return {url, name: RELEASE_NAME};
    }

    throw error;
  }

  debug('release release_id: %o', releaseId);

  const {
    data: {html_url: url},
  } = await gitea.updateRelease(owner, repo, releaseId, release);

  logger.log('Updated Gitea release: %s', url);

  return {url, name: RELEASE_NAME};
};
