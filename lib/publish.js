const {basename, extname, resolve} = require('path');
const {stat, readFile} = require('fs-extra');
const {isPlainObject, template} = require('lodash');
const mime = require('mime');
const debug = require('debug')('saithodev:semantic-release-gitea');
const {RELEASE_NAME} = require('./definitions/constants');
const parseGitUrl = require('./parse-git-url');
const globAssets = require('./glob-assets.js');
const resolveConfig = require('./resolve-config');
const getClient = require('./get-client');
const isPrerelease = require('./is-prerelease');

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
      const response = await gitea.createRelease(owner, repo, release);
      const parsedResponse = JSON.parse(response.body);
      const url = parsedResponse.url;

      logger.log('Published Gitea release: %s', url);
      return {url: url, name: RELEASE_NAME};
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
      const filePath = isPlainObject(asset) ? asset.path : asset;
      let file;

      try {
        file = await stat(resolve(cwd, filePath));
      } catch (_) {
        logger.error('The asset %s cannot be read, and will be ignored.', filePath);
        return;
      }

      if (!file || !file.isFile()) {
        logger.error('The asset %s is not a file, and will be ignored.', filePath);
        return;
      }

      let fileName = template(asset.name || basename(filePath))(context);
      const upload = {
          file: await readFile(resolve(cwd, filePath)),
          type: mime.getType(extname(fileName)) || 'text/plain',
          size: file.size,
      };

      debug('file path: %o', filePath);
      debug('file name: %o', fileName);

      if (isPlainObject(asset) && asset.label) {
          fileName = template(asset.label)(context);
      }

      const response = await gitea.createReleaseAsset(owner, repo, releaseId, fileName, upload);
      const parsedResponse = JSON.parse(response.body);
      const downloadUrl = parsedResponse.browser_download_url;
      logger.log('Published file %s', downloadUrl);
    })
  );

  const responseUpdate = await gitea.updateRelease(owner, repo, releaseId, {draft: false});
  const parsedResponseUpdate = JSON.parse(responseUpdate.body);
  const url = parsedResponseUpdate.url;

  logger.log('Published Gitea release: %s', url);
  return {url: url, name: RELEASE_NAME};
};
