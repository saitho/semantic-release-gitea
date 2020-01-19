/**
 * Return a `nock` object setup to respond to a Gitea authentication request. Other expectation and responses can be chained.
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
    giteaToken = env.GITEA_TOKEN,
    giteaUrl = env.GITEA_URL,
    giteaApiPathPrefix = env.GITEA_PREFIX || '/api/v1',
  } = {}
) {
    const urlJoin = require('url-join');
    const nock = require('nock');
    return nock(
        urlJoin(giteaUrl, giteaApiPathPrefix),
        {reqheaders: {'Authorization': 'token ' + giteaToken, 'Content-Type': 'application/json'}}
    );
}
