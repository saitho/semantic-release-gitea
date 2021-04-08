import {escape} from 'querystring';
import test from 'ava';
import nock from 'nock';
import {stub} from 'sinon';
import tempy from 'tempy';
import {authenticate, upload} from './helpers/_mock-gitea';

/* eslint camelcase: ["error", {properties: "never"}] */

const cwd = 'test/fixtures/files';
const publish = require('../lib/publish');

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

 test.serial('Publish a release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/1`;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'release', main: true},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['Published Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Publish a release on a channel', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       prerelease: true,
     })
     .reply(200, {url: releaseUrl});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'release', channel: 'next', main: false},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['Published Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Publish a prerelease', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       prerelease: true,
     })
     .reply(200, {url: releaseUrl});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'prerelease', channel: 'beta'},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['Published Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Publish a maintenance release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;
   const releaseId = 1;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl, id: releaseId});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'maintenance', channel: '1.x', main: false},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.deepEqual(t.context.log.args[0], ['Published Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Publish a release with one asset', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {
     assets: [{path: '.dotfile', label: 'A dotfile with no ext'}],
   };
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const untaggedReleaseUrl = `https://gitea.io/${owner}/${repo}/releases/untagged-123`;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;
   const assetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${nextRelease.version}/.dotfile`;
   const releaseId = 1;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       draft: true,
       prerelease: false,
     })
     .reply(200, { url: untaggedReleaseUrl, id: releaseId})
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {draft: false})
     .reply(200, {url: releaseUrl});

   const giteaUpload = upload(env)
       .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('A dotfile with no ext')}`)
       .reply(200, {browser_download_url: assetUrl});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'release', main: true},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.true(t.context.log.calledWith('Published Gitea release: %s', releaseUrl));
   t.true(t.context.log.calledWith('Published file %s', assetUrl));
   t.true(gitea.isDone());
   t.true(giteaUpload.isDone());
 });

 test.serial('Publish a release with a asset containing the next release version', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const pluginConfig = {
     assets: [{path: 'my-software-v${nextRelease.version}.tar.gz', label: 'Version ${nextRelease.version} of my software'}],
   };
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body', version: '1.0.0'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const untaggedReleaseUrl = `https://gitea.io/${owner}/${repo}/releases/untagged-123`;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;
   const assetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${nextRelease.version}/my-software-v1.0.0.tar.gz`;
   const releaseId = 1;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       draft: true,
       prerelease: false,
     })
     .reply(200, { url: untaggedReleaseUrl, id: releaseId})
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {draft: false})
     .reply(200, {url: releaseUrl});

   const giteaUpload = upload(env)
       .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('Version 1.0.0 of my software')}`)
       .reply(200, {browser_download_url: assetUrl});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'release', main: true},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.true(t.context.log.calledWith('Published Gitea release: %s', releaseUrl));
   t.true(t.context.log.calledWith('Published file %s', assetUrl));
   t.true(gitea.isDone());
   t.true(giteaUpload.isDone());
 });

 test.serial('Publish a release with an array of missing assets', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const emptyDirectory = tempy.directory();
   const pluginConfig = {assets: [emptyDirectory, {path: 'missing.txt', name: 'missing.txt'}]};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const untaggedReleaseUrl = `https://gitea.io/${owner}/${repo}/releases/untagged-123`;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${nextRelease.version}`;
   const releaseId = 1;

   const gitea = authenticate(env)
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       draft: true,
       prerelease: false,
     })
     .reply(200, {url: untaggedReleaseUrl, id: releaseId})
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {draft: false})
     .reply(200, {url: releaseUrl});

   const result = await publish(pluginConfig, {
     cwd,
     env,
     options,
     branch: {type: 'release', main: true},
     nextRelease,
     logger: t.context.logger,
   });

   t.is(result.url, releaseUrl);
   t.true(t.context.log.calledWith('Published Gitea release: %s', releaseUrl));
   t.true(t.context.error.calledWith('The asset %s cannot be read, and will be ignored.', 'missing.txt'));
   t.true(t.context.error.calledWith('The asset %s is not a file, and will be ignored.', emptyDirectory));
   t.true(gitea.isDone());
 });

