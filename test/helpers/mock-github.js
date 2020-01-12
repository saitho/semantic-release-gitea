import nock from 'nock';

/**
 * Return a `nock` object setup to respond to a github authentication request. Other expectation and responses can be chained.
 *
 * @param {Object} [env={}] Environment variables.
 * @param {String} [giteaToken=env.GITEA_TOKEN || 'GITEA_TOKEN'] The github token to return in the authentication response.
 * @param {String} [giteaUrl=env.GITEA_URL || 'https://api.gitea.io'] The url on which to intercept http requests.
 * @param {String} [giteaApiPathPrefix=env.GITEA_PREFIX || ''] The GitHub Enterprise API prefix.
 * @return {Object} A `nock` object ready to respond to a github authentication request.
 */
export function authenticate(
  env = {},
  {
    giteaToken = env.GITEA_TOKEN || 'GITEA_TOKEN',
    giteaUrl = env.GITEA_URL || 'https://gitea.io',
    giteaApiPathPrefix = env.GITEA_PREFIX || '/api/v1',
  } = {}
) {
  return nock(`${giteaUrl}/${giteaApiPathPrefix}`, {reqheaders: {Authorization: `token ${giteaToken}`}});
}

/**
 * Return a `nock` object setup to respond to a github release upload request. Other expectation and responses can be chained.
 *
 * @param {Object} [env={}] Environment variables.
 * @param {String} [giteaToken=env.GITEA_TOKEN || 'GITEA_TOKEN'] The github token to return in the authentication response.
 * @param {String} [uploadUrl] The url on which to intercept http requests.
 * @return {Object} A `nock` object ready to respond to a github file upload request.
 */
export function upload(
  env = {},
  {
    giteaToken = env.GITEA_TOKEN || 'GITEA_TOKEN',
    uploadUrl,
    contentType = 'text/plain',
    contentLength,
  } = {}
) {
  return nock(uploadUrl, {
    reqheaders: {Authorization: `token ${giteaToken}`, 'content-type': contentType, 'content-length': contentLength},
  });
}
