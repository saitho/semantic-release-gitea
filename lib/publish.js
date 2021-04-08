const {basename, resolve} = require('path');
const {stat} = require('fs-extra');
const {isPlainObject, template} = require('lodash');
const debug = require('debug')('saithodev:semantic-release-gitea');
const {RELEASE_NAME} = require('./definitions/constants');
const parseGitUrl = require('./parse-git-url');
const globAssets = require('./glob-assets.js');
const resolveConfig = require('./resolve-config');
const getClient = require('./get-client');
const isPrerelease = require('./is-prerelease');
const getError = require('./get-error');

module.exports = async (pluginConfig, context) => {
  const {
    cwd,
    options: {repositoryUrl},
    branch,
    nextRelease: {name, gitTag, notes},
    logger,
  } = context;
  const {giteaToken, giteaUrl, giteaApiPathPrefix, assets} = resolveConfig(pluginConfig, context);
  const {owner, repo} = parseGitUrl(repositoryUrl);
  const gitea = getClient(giteaToken, giteaUrl, giteaApiPathPrefix);
  const release = {tag_name: gitTag, name, body: notes, prerelease: isPrerelease(branch)};

  debug('release object: %O', release);

  // When there are no assets, we publish a release directly
  if (!assets || assets.length === 0) {
      const responseDirectRelease = await gitea.createRelease(owner, repo, release);
      const parsedResponseDirectRelease = JSON.parse(responseDirectRelease.body);
      const releaseUrl = parsedResponseDirectRelease.url;

      logger.log('Published Gitea release: %s', releaseUrl);
      return {url: releaseUrl, name: RELEASE_NAME};
  }

  // We'll create a draft release, append the assets to it, and then publish it.
  // This is so that the assets are available when we get a Gitea release event.
  const draftRelease = {...release, draft: true};

  const response = await gitea.createRelease(owner, repo, draftRelease);
  const parsedResponse = JSON.parse(response.body);
  const releaseId = parsedResponse.id;

  // Append assets to the release
  const globbedAssets = await globAssets(context, assets);
  debug('globed assets: %o', globbedAssets);

  await Promise.all(
    globbedAssets.map(async asset => {
      const filePath = template(isPlainObject(asset) ? asset.path : asset)(context);
      const fullFilePath = resolve(cwd, filePath);
      let file;

      try {
        file = await stat(fullFilePath);
      } catch (_) {
        logger.error('The asset %s cannot be read, and will be ignored.', filePath);
        return;
      }

      if (!file || !file.isFile()) {
        logger.error('The asset %s is not a file, and will be ignored.', filePath);
        return;
      }

      let assetName = template(asset.name || basename(filePath))(context);

      debug('file path: %o', filePath);
      debug('asset name: %o', assetName);

      if (isPlainObject(asset) && asset.label) {
          assetName = template(asset.label)(context);
      }

      try {
          const responseAsset = await gitea.createReleaseAsset(owner, repo, releaseId, assetName, fullFilePath);
          const parsedResponseAsset = JSON.parse(responseAsset.body);
          const downloadUrl = parsedResponseAsset.browser_download_url;
          logger.log('Published file %s', downloadUrl);
      } catch (e) {
          logger.log('API error while publishing file %s', filePath);
          if (e.hasOwnProperty('response') && e.response.body.length) {
              const errorBody = JSON.parse(e.response.body);
              throw getError('EGITEAAPIERROR', {message: errorBody.message});
          }
          throw e;
      }
    })
  );

  const responseUpdate = await gitea.updateRelease(owner, repo, releaseId, {draft: false});
  const parsedResponseUpdate = JSON.parse(responseUpdate.body);
  const url = parsedResponseUpdate.url;

  logger.log('Published Gitea release: %s', url);
  return {url: url, name: RELEASE_NAME};
};
