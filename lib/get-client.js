const got = require('got');
const urljoin = require('url-join');

class GiteaClient {
  baseUrl;
  token;
  constructor(giteaToken, giteaUrl, giteaApiPathPrefix) {
      this.baseUrl = urljoin(giteaUrl, giteaApiPathPrefix);
      this.token = giteaToken;
  }

  _makeRequest(verb, apiPath, body) {
    const apiOptions = {headers: {'Authorization-TOKEN': this.token}};
    switch (verb) {
      case 'post':
        return got.post(urlJoin(this.baseUrl, apiPath), {...apiOptions, body: body}).json();
      case 'patch':
        return got.patch(urlJoin(this.baseUrl, apiPath), {...apiOptions, body: body}).json();
      default:
        return got.get(urlJoin(this.baseUrl, apiPath), apiOptions).json();
    }
  }

  createReleaseAsset(owner, repo, releaseId, asset) {
    return this._makeRequest('post', `/repos/${repo}/${owner}/releases/${releaseId}/assets`, asset);
  }

  updateRelease(owner, repo, releaseId, data) {
    return this._makeRequest('patch', `/repos/${repo}/${owner}/releases/${releaseId}`, data);
  }

  createRelease(owner, repo, release) {
    return this._makeRequest('post', `/repos/${repo}/${owner}/releases`, release);
  }

  getReleaseByTag(owner, repo, gitTag) {
    let page = 1;
    while(true) {
      const releases = this._makeRequest('get', `/repos/${repo}/${owner}?page=${page}`);
      if(!releases.length) {
        break;
      }
      for (const release of releases) {
        if (release.tag_name === gitTag) {
          return release;
        }
      }
    }
    throw {status: 404};
  }

  getRepo(repo, owner) {
    return this._makeRequest('get', `/repos/${repo}/${owner}`);
  }
}

module.exports = ({giteaToken, giteaUrl, giteaApiPathPrefix}) => {
  return new GiteaClient(giteaToken, giteaUrl, giteaApiPathPrefix);
};
