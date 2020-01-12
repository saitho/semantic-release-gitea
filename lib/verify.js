const {isString, isPlainObject, isNil, isArray, isNumber} = require('lodash');
const urlJoin = require('url-join');
const AggregateError = require('aggregate-error');
const parseGithubUrl = require('./parse-github-url');
const resolveConfig = require('./resolve-config');
const getClient = require('./get-client');
const getError = require('./get-error');

const isNonEmptyString = value => isString(value) && value.trim();
const isStringOrStringArray = value => isNonEmptyString(value) || (isArray(value) && value.every(isNonEmptyString));
const isArrayOf = validator => array => isArray(array) && array.every(value => validator(value));
const canBeDisabled = validator => value => value === false || validator(value);

const VALIDATORS = {
  assets: isArrayOf(
    asset => isStringOrStringArray(asset) || (isPlainObject(asset) && isStringOrStringArray(asset.path))
  ),
  successComment: canBeDisabled(isNonEmptyString),
  failTitle: canBeDisabled(isNonEmptyString),
  failComment: canBeDisabled(isNonEmptyString),
  labels: canBeDisabled(isArrayOf(isNonEmptyString)),
  assignees: isArrayOf(isNonEmptyString),
  releasedLabels: canBeDisabled(isArrayOf(isNonEmptyString)),
};

module.exports = async (pluginConfig, context) => {
  const {
    env,
    options: {repositoryUrl},
    logger,
  } = context;
  const {giteaToken, giteaUrl, giteaApiPathPrefix, ...options} = resolveConfig(pluginConfig, context);
  const gitea = getClient(giteaToken, giteaUrl, giteaApiPathPrefix);

  const errors = Object.entries({...options}).reduce(
    (errors, [option, value]) =>
      !isNil(value) && !VALIDATORS[option](value)
        ? [...errors, getError(`EINVALID${option.toUpperCase()}`, {[option]: value})]
        : errors,
    []
  );

  logger.log('Verify Gitea authentication (%s)', urlJoin(giteaUrl, giteaApiPathPrefix));

  const {repo, owner} = parseGithubUrl(repositoryUrl);
  if (!owner || !repo) {
    errors.push(getError('EINVALIDGITEAURL'));
  } else if (giteaUrl && giteaToken) {
    try {
      const {
        permissions: {
          push: {push},
        },
      } = await gitea.getRepo(repo, owner);
      if (!push) {
        errors.push(getError('EGITEANOPERMISSION', {owner, repo}));
      }
    } catch (error) {
      if (error.status === 401) {
        errors.push(getError('EINVALIDGITEATOKEN', {owner, repo}));
      } else if (error.status === 404) {
        errors.push(getError('EMISSINGREPO', {owner, repo}));
      } else {
        throw error;
      }
    }
  }

  if (!giteaUrl) {
    errors.push(getError('EINVALIDGITEAURL'));
  }

  if (!giteaToken) {
    errors.push(getError('ENOGITEATOKEN', {owner, repo}));
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};
