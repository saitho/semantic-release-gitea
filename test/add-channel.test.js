import test from 'ava';
import nock from 'nock';
import {stub} from 'sinon';
import {authenticate} from './helpers/_mock-gitea';

/* eslint camelcase: ["error", {properties: "never"}] */

// const cwd = 'test/fixtures/files';
const addChannel = require('../lib/add-channel');

test.beforeEach(t => {
  // Mock logger
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test.afterEach.always(() => {
  // Clear nock
  nock.cleanAll();
});

test.serial('Update a release', async t => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
  const pluginConfig = {};
  const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
  const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
  const releaseId = 1;
  const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;

  const gitea = authenticate(env)
    .get(`/repos/${owner}/${repo}/releases?page=1`)
    .reply(200, [{id: releaseId, tag_name: nextRelease.gitTag}])
    .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
      tag_name: nextRelease.gitTag,
      name: nextRelease.name,
      prerelease: false,
    })
    .reply(200, {url: releaseUrl});

  const result = await addChannel(pluginConfig, {
    env,
    options,
    branch: {type: 'release', main: true},
    nextRelease,
    logger: t.context.logger,
  });

  t.is(result.url, releaseUrl);
  t.deepEqual(t.context.log.args[0], ['Updated Gitea release: %s', releaseUrl]);
  t.true(gitea.isDone());
});

 test.serial('Update a maintenance release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', channel: '1.x', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;
   const releaseId = 1;

   const gitea = authenticate(env)
       .get(`/repos/${owner}/${repo}/releases?page=1`)
       .reply(200, [{id: releaseId, "tag_name": nextRelease.gitTag}])
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl});

   const result = await addChannel(pluginConfig, {
     env,
     options,
     branch: {type: 'maintenance', channel: '1.x', main: false},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['Updated Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Update a prerelease', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseId = 1;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;

   const gitea = authenticate(env)
       .get(`/repos/${owner}/${repo}/releases?page=1`)
       .reply(200, [{id: releaseId, "tag_name": nextRelease.gitTag}])
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl});

   const result = await addChannel(pluginConfig, {
     env,
     options,
     branch: {type: 'maintenance', channel: '1.x', main: false},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['Updated Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Create the new release if current one is missing', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;

   const gitea = authenticate(env)
       .get(`/repos/${owner}/${repo}/releases?page=1`)
     .reply(404)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl});

   const result = await addChannel(pluginConfig, {
     env,
     options,
     branch: {type: 'release', main: true},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['There is no release for tag %s, creating a new one', nextRelease.gitTag]);
   t.deepEqual(t.context.log.args[1], ['Published Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Throw error if cannot read current release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};

   const gitea = authenticate(env)
       .get(`/repos/${owner}/${repo}/releases?page=1`)
     .reply(500);

   await t.throwsAsync(
     addChannel(pluginConfig, {
       env,
       options,
       branch: {type: 'release', main: true},
       nextRelease,
       logger: t.context.logger,
     })
   );

   t.true(gitea.isDone());
 });

 test.serial('Throw error if cannot create missing current release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};

   const gitea = authenticate(env)
       .get(`/repos/${owner}/${repo}/releases?page=1`)
     .reply(404)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       prerelease: false,
     })
     .reply(500);

   await t.throwsAsync(
     addChannel(pluginConfig, {
       env,
       options,
       branch: {type: 'release', main: true},
       nextRelease,
       logger: t.context.logger,
     })
   );

   t.true(gitea.isDone());
 });

 test.serial('Throw error if cannot update release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseId = 1;

   const github = authenticate(env)
       .get(`/repos/${owner}/${repo}/releases?page=1`)
       .reply(200, [{id: releaseId, "tag_name": nextRelease.gitTag}])
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       prerelease: false,
     })
     .reply(404);

   await t.throwsAsync(
     addChannel(pluginConfig, {
       env,
       options,
       branch: {type: 'release', main: true},
       nextRelease,
       logger: t.context.logger,
     })
   );
   t.true(github.isDone());
 });
