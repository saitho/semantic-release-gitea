/* eslint require-atomic-updates: off */

const {defaultTo, castArray} = require('lodash');
const verifyGitea = require('./lib/verify');
const addChannelGitHub = require('./lib/add-channel');
const publishGitea = require('./lib/publish');

let verified;

async function verifyConditions(pluginConfig, context) {
  const {options} = context;
  // If the Gitea publish plugin is used and has `assets`, `labels` or `assignees` configured, validate it now in order to prevent any release if the configuration is wrong
  if (options.publish) {
    const publishPlugin =
      castArray(options.publish).find(config => config.path && config.path === '@saithodev/semantic-release-gitea') || {};

    pluginConfig.assets = defaultTo(pluginConfig.assets, publishPlugin.assets);
    pluginConfig.labels = defaultTo(pluginConfig.labels, publishPlugin.labels);
    pluginConfig.assignees = defaultTo(pluginConfig.assignees, publishPlugin.assignees);
  }

  await verifyGitea(pluginConfig, context);
  verified = true;
}

async function publish(pluginConfig, context) {
  if (!verified) {
    await verifyGitea(pluginConfig, context);
    verified = true;
  }

  return publishGitea(pluginConfig, context);
}

async function addChannel(pluginConfig, context) {
  if (!verified) {
    await verifyGitea(pluginConfig, context);
    verified = true;
  }

  return addChannelGitHub(pluginConfig, context);
}

module.exports = {verifyConditions, addChannel, publish};
