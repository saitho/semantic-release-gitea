const debug = require('debug')('saithodev:semantic-release-gitea');
const {RELEASE_NAME} = require('./definitions/constants');
const parseGitUrl = require('./parse-git-url');
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
  const {owner, repo} = parseGitUrl(repositoryUrl);
  const gitea = getClient(giteaToken, giteaUrl, giteaApiPathPrefix);
  let releaseId;

  const release = {prerelease: isPrerelease(branch), tag_name: gitTag, name: name};
  debug('release object: %O', release);

  let hasTag = true;
  try {
    const releaseByTag = await gitea.getReleaseByTag(owner, repo, gitTag);
    releaseId = releaseByTag.id;
  } catch (error) {
    if (error.hasOwnProperty('response') && error.response.statusCode === 404) {
        hasTag = false;
    } else {
      throw error;
    }
  }

  let url = '';

  if (!hasTag) {
    logger.log('There is no release for tag %s, creating a new one', gitTag);

    release.body = notes;
    const response = await gitea.createRelease(owner, repo, release);
    const parsedResponse = JSON.parse(response.body);
    url = parsedResponse.url;

    logger.log('Published Gitea release: %s', url);
  } else {
    debug('release release_id: %o', releaseId);

    const responseUpdate = await gitea.updateRelease(owner, repo, releaseId, release);
    const parsedResponseUpdate = JSON.parse(responseUpdate.body);
    url = parsedResponseUpdate.url;

    logger.log('Updated Gitea release: %s', url);
  }
  
  return {url, name: RELEASE_NAME};
};
