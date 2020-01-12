const got = require('got');
const urljoin = require('url-join');

class GiteaClient {
  baseUrl;
  token;
  constructor(giteaToken, giteaUrl, giteaApiPathPrefix) {
      this.baseUrl = urljoin(giteaUrl, giteaApiPathPrefix);
      this.token = giteaToken;
  }

  _makeRequest(apiPath) {
    return got.get(urlJoin(this.baseUrl, apiPath), {
      headers: {'Authorization': this.token},
    }).json();
  }

  getRepo(repo, owner) {
    return this._makeRequest(`/repos/${repo}/${owner}`);
  }
}

module.exports = ({giteaToken, giteaUrl, giteaApiPathPrefix}) => {
  return new GiteaClient(giteaToken, giteaUrl, giteaApiPathPrefix);
};
