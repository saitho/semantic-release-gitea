const got = require('got');
const urlJoin = require('url-join');
const querystring = require('querystring');

class GiteaClient {
  constructor(giteaToken, giteaUrl, giteaApiPathPrefix) {
      this.baseUrl = urlJoin(giteaUrl, giteaApiPathPrefix);
      this.token = giteaToken;
  }

  _makeRequest(verb, apiPath, body) {
    const fullUrl = urlJoin(this.baseUrl, apiPath);
    const apiOptions = {headers: {'Authorization': 'token ' + this.token, 'Content-Type': 'application/json'}};
    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }
    switch (verb) {
      case 'post':
        return got.post(fullUrl, {...apiOptions, body: body});
      case 'patch':
        return got.patch(fullUrl, {...apiOptions, body: body});
      default:
        return got.get(fullUrl, apiOptions);
    }
  }

  createReleaseAsset(owner, repo, releaseId, fileName, file) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('attachment', file.file);

    return this._makeRequest(
        'post',
        `/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${querystring.escape(fileName)}`,
        {
          body: form,
          headers: {
            'content-type': file.type || 'text/plain',
            'content-length': file.size,
          },
        }
    );
  }

  updateRelease(owner, repo, releaseId, data) {
    return this._makeRequest('patch', `/repos/${owner}/${repo}/releases/${releaseId}`, data);
  }

  createRelease(owner, repo, release) {
    return this._makeRequest('post', `/repos/${owner}/${repo}/releases`, release);
  }

  async getReleaseByTag(owner, repo, gitTag) {
    let page = 1;
    while(true) {
      const request = await this._makeRequest('get', `/repos/${owner}/${repo}/releases?page=${page}`);
      const releases = JSON.parse(request.body);
      if(!releases.length) {
        break;
      }
      for (const release of releases) {
        if (release.tag_name === gitTag) {
          return release;
        }
      }
    }
    throw {response: { statusCode: 404} };
  }

  getRepo(repo, owner) {
    return this._makeRequest('get', `/repos/${owner}/${repo}`);
  }
}

module.exports = (giteaToken, giteaUrl, giteaApiPathPrefix) => {
  return new GiteaClient(giteaToken, giteaUrl, giteaApiPathPrefix);
};
