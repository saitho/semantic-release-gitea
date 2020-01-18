const {inspect} = require('util');
const {isString} = require('lodash');
const pkg = require('../../package.json');

const [homepage] = pkg.homepage.split('#');
const stringify = obj => (isString(obj) ? obj : inspect(obj, {breakLength: Infinity, depth: 2, maxArrayLength: 5}));
const linkify = file => `${homepage}/blob/master/${file}`;

module.exports = {
  EINVALIDASSETS: ({assets}) => ({
    message: 'Invalid `assets` option.',
    details: `The [assets option](${linkify(
      'README.md#assets'
    )}) must be an \`Array\` of \`Strings\` or \`Objects\` with a \`path\` property.

Your configuration for the \`assets\` option is \`${stringify(assets)}\`.`,
  }),
  ENOGITEAURL: () => ({
    message: 'No Gitea URL was provided.',
    details: `The [Gitea URL](${linkify(
        'README.md#gitea-authentication'
    )}) configured in the \`GITEA_URL\` environment variable must be a valid Gitea url.`,
  }),
  EINVALIDGITEAURL: () => ({
    message: 'The git repository URL is not a valid Gitea URL.',
    details: `The **semantic-release** \`repositoryUrl\` option must a valid GitHub URL with the format \`<Gitea_URL>/<owner>/<repo>.git\`.

By default the \`repositoryUrl\` option is retrieved from the \`repository\` property of your \`package.json\` or the [git origin url](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes) of the repository cloned by your CI environment.`,
  }),
  EMISSINGREPO: ({owner, repo}) => ({
    message: `The repository ${owner}/${repo} doesn't exist.`,
    details: `The **semantic-release** \`repositoryUrl\` option must refer to your GitHub repository. The repository must be accessible with the [GitHub API](https://developer.github.com/v3).

By default the \`repositoryUrl\` option is retrieved from the \`repository\` property of your \`package.json\` or the [git origin url](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes) of the repository cloned by your CI environment.

If you are using [GitHub Enterprise](https://enterprise.github.com) please make sure to configure the \`githubUrl\` and \`githubApiPathPrefix\` [options](${linkify(
      'README.md#options'
    )}).`,
  }),
  EGITEANOPERMISSION: ({owner, repo}) => ({
    message: `The Gitea token doesn't allow to push on the repository ${owner}/${repo}.`,
    details: `The user associated with the [Gitea token](${linkify(
      'README.md#gitea-authentication'
    )}) configured in the \`GITEA_TOKEN\` environment variable must allows to push to the repository ${owner}/${repo}.

Please make sure the Gitea user associated with the token is an [owner](https://help.github.com/articles/permission-levels-for-a-user-account-repository/#owner-access-on-a-repository-owned-by-a-user-account) or a [collaborator](https://help.github.com/articles/permission-levels-for-a-user-account-repository/#collaborator-access-on-a-repository-owned-by-a-user-account) if the reposotory belong to a user account or has [write permissions](https://help.github.com/articles/managing-team-access-to-an-organization-repository) if the repository [belongs to an organization](https://help.github.com/articles/repository-permission-levels-for-an-organization).`,
  }),
  EINVALIDGITEATOKEN: ({owner, repo}) => ({
    message: 'Invalid Gitea token.',
    details: `The [Gitea token](${linkify(
      'README.md#gitea-authentication'
    )}) configured in the \`GITEA_TOKEN\` environment variable must be a valid [personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) allowing to push to the repository ${owner}/${repo}.

Please make sure to set the \`GITEA_TOKEN\` environment variable in your CI with the exact value of the GitHub personal token.`,
  }),
  ENOGITEATOKEN: ({owner, repo}) => ({
    message: 'No Gitea token specified.',
    details: `A [Gitea personal token](${linkify(
      'README.md#gitea-authentication'
    )}) must be created and set in the \`GITEA_TOKEN\` environment variable on your CI environment.

Please make sure to create a [Gitea personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line) and to set it in the \`GITEA_TOKEN\` environment variable on your CI environment. The token must allow to push to the repository ${owner}/${repo}.`,
  }),
};
