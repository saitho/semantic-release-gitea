const got = require('got');
const urlJoin = require('url-join');

class GiteaClient {
  constructor(giteaToken, giteaUrl, giteaApiPathPrefix) {
      this.baseUrl = urlJoin(giteaUrl, giteaApiPathPrefix);
      this.token = giteaToken;
  }

  _makeRequest(verb, apiPath, body) {
    const apiOptions = {headers: {'Authorization-TOKEN': this.token}};
    switch (verb) {
      case 'post':
        return got.post(urlJoin(this.baseUrl, apiPath), {...apiOptions, body: body});
      case 'patch':
        return got.patch(urlJoin(this.baseUrl, apiPath), {...apiOptions, body: body});
      default:
        return got.get(urlJoin(this.baseUrl, apiPath), apiOptions);
    }
  }

  createReleaseAsset(owner, repo, releaseId, asset) {
    return this._makeRequest('post', `/repos/${owner}/${repo}/releases/${releaseId}/assets`, asset);
  }

  updateRelease(owner, repo, releaseId, data) {
    return this._makeRequest('patch', `/repos/${owner}/${repo}/releases/${releaseId}`, data);
  }

  createRelease(owner, repo, release) {
    return this._makeRequest('post', `/repos/${owner}/${repo}/releases`, release);
  }

  getReleaseByTag(owner, repo, gitTag) {
    let page = 1;
    while(true) {
      const releases = this._makeRequest('get', `/repos/${owner}/${repo}?page=${page}`);
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
    return this._makeRequest('get', `/repos/${owner}/${repo}`);
  }
}

module.exports = (giteaToken, giteaUrl, giteaApiPathPrefix) => {
  return new GiteaClient(giteaToken, giteaUrl, giteaApiPathPrefix);
};
