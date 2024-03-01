const {isString, isPlainObject, isNil, isArray, isNumber, isUndefined} = require('lodash');
const urlJoin = require('url-join');
const AggregateError = require('aggregate-error');
const parseGitUrl = require('./parse-git-url');
const resolveConfig = require('./resolve-config');
const getClient = require('./get-client');
const getError = require('./get-error');

const isNonEmptyString = value => isString(value) && value.trim();
const isStringOrStringArray = value => isNonEmptyString(value) || (isArray(value) && value.every(isNonEmptyString));
const isArrayOf = validator => array => isArray(array) && array.every(value => validator(value));

const VALIDATORS = {
  /**
   * @use getError.EINVALIDASSETS
   */
  assets: isArrayOf(
    asset => isStringOrStringArray(asset) || (isPlainObject(asset) && isStringOrStringArray(asset.path)),
  ),
  additionalNotes: value => isUndefined(value) || isString(value),
};

module.exports = async (pluginConfig, context) => {
  const {
    options: {repositoryUrl},
    logger,
  } = context;
  const {giteaToken, giteaUrl, giteaApiPathPrefix, ...options} = resolveConfig(pluginConfig, context);

  const errors = Object.entries({...options}).reduce(
    (errs, [option, value]) =>
      !isNil(value) && !VALIDATORS[option](value)
        ? [...errs, getError(`EINVALID${option.toUpperCase()}`, {[option]: value})]
        : errs,
    []
  );


  const {repo, owner} = parseGitUrl(repositoryUrl);

  if (!giteaUrl) {
    errors.push(getError('ENOGITEAURL'));
  }

  if (!giteaToken) {
    errors.push(getError('ENOGITEATOKEN', {owner, repo}));
  }

  if (!owner || !repo) {
    errors.push(getError('EINVALIDGITEAURL'));
  } else if(giteaUrl && giteaToken) {
    logger.log('Verify Gitea authentication (' + urlJoin(giteaUrl, giteaApiPathPrefix) +  ')');
    try {
      const gitea = getClient(giteaToken, giteaUrl, giteaApiPathPrefix);
      const response = await gitea.getRepo(repo, owner);
      const parsedResponse = JSON.parse(response.body);
      if (!parsedResponse.permissions.push) {
        errors.push(getError('EGITEANOPERMISSION', {owner, repo}));
      }
    } catch (error) {
      if (error.hasOwnProperty('response')) {
        switch (error.response.statusCode) {
          case 401:
            errors.push(getError('EINVALIDGITEATOKEN', {owner, repo}));
            break;
          case 404:
            errors.push(getError('EMISSINGREPO', {owner, repo}));
            break;
        }
      } else {
        throw error;
      }
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};
