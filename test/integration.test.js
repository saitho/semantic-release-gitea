import path from 'path';
import {escape} from 'querystring';
import test from 'ava';
import {stat} from 'fs-extra';
import nock from 'nock';
import {stub} from 'sinon';
import proxyquire from 'proxyquire';
import clearModule from 'clear-module';
import SemanticReleaseError from '@semantic-release/error';
import {authenticate, upload} from './helpers/mock-github';

const cwd = 'test/fixtures/files';
const client = require('../lib/get-client');

test.beforeEach(t => {
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = proxyquire('..', {
    './lib/verify': proxyquire('../lib/verify', {'./get-client': client}),
    './lib/publish': proxyquire('../lib/publish', {'./get-client': client}),
  });
  // Stub the logger
  t.context.log = stub();
  t.context.error = stub();
  t.context.logger = {log: t.context.log, error: t.context.error};
});

test.afterEach.always(() => {
  // Clear nock
  nock.cleanAll();
});

test.serial('Verify Gitea auth', async t => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
  const options = {repositoryUrl: `git+https://gitea.io/${owner}/${repo}.git`};
  const gitea = authenticate(env)
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {permissions: {push: true}});

  await t.notThrowsAsync(t.context.m.verifyConditions({}, {cwd, env, options, logger: t.context.logger}));

  t.true(gitea.isDone());
});

 test.serial('Verify Gitea auth with publish options', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const options = {
     publish: {path: '@saithodev/semantic-release-gitea'},
     repositoryUrl: `git+https://gitea.io/${owner}/${repo}.git`,
   };
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(t.context.m.verifyConditions({}, {cwd, env, options, logger: t.context.logger}));

   t.true(gitea.isDone());
 });

 test.serial('Verify Gitea auth and assets config', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = [
     {path: 'lib/file.js'},
     'file.js',
     ['dist/**'],
     ['dist/**', '!dist/*.js'],
     {path: ['dist/**', '!dist/*.js']},
   ];
   const options = {
     publish: [{path: '@semantic-release/npm'}],
     repositoryUrl: `git+https://gitea.io/${owner}/${repo}.git`,
   };
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(t.context.m.verifyConditions({assets}, {cwd, env, options, logger: t.context.logger}));

   t.true(gitea.isDone());
 });

 test.serial('Throw SemanticReleaseError if invalid config', async t => {
   const env = {};
   const assets = [{wrongProperty: 'lib/file.js'}];
   const options = {
     publish: [
       {path: '@semantic-release/npm'},
       {path: '@saithodev/semantic-release-gitea', assets},
     ],
     repositoryUrl: 'invalid_url',
   };

   const errors = [
     ...(await t.throwsAsync(t.context.m.verifyConditions({}, {cwd, env, options, logger: t.context.logger}))),
   ];

   t.is(errors[0].name, 'SemanticReleaseError');
   t.is(errors[0].code, 'EINVALIDASSETS');
   t.is(errors[1].name, 'SemanticReleaseError');
   t.is(errors[1].code, 'ENOGITEAURL');
   t.is(errors[2].name, 'SemanticReleaseError');
   t.is(errors[2].code, 'ENOGITEATOKEN');
 });

 test.serial('Publish a release with an array of assets', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = [
     {path: ['upload.txt'], name: 'upload_file_name.txt'},
     {path: ['upload_other.txt'], name: 'other_file.txt', label: 'Other File'},
   ];
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseId = 1;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;
   const assetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${releaseId}/upload.txt`;
   const otherAssetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${releaseId}/other_file.txt`;
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}})
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       draft: true,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl, id: releaseId})
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {draft: false})
     .reply(200, {url: releaseUrl})
     .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('upload_file_name.txt')}`)
     .reply(200, {browser_download_url: assetUrl})
     .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('Other File')}`)
     .reply(200, {browser_download_url: otherAssetUrl});

   const result = await t.context.m.publish(
     {assets},
     {cwd, env, options, branch: {type: 'release', main: true}, nextRelease, logger: t.context.logger}
   );

   t.is(result.url, releaseUrl);
   t.regex(t.context.log.args[0][0], new RegExp('^Verify Gitea authentication \(.*\)$'));
   t.true(t.context.log.calledWith('Published file %s', otherAssetUrl));
   t.true(t.context.log.calledWith('Published file %s', assetUrl));
   t.true(t.context.log.calledWith('Published Gitea release: %s', releaseUrl));
   t.true(gitea.isDone());
 });

 test.serial('Publish a release with release information in assets', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = [
     {
       path: ['upload.txt'],
       name: `file_with_release_\${nextRelease.gitTag}_in_filename.txt`,
       label: `File with release \${nextRelease.gitTag} in label`,
     },
   ];
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseId = 1;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;
   const assetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${releaseId}/file_with_release_v1.0.0_in_filename.txt`;
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}})
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       target_commitish: options.branch,
       name: nextRelease.gitTag,
       body: nextRelease.notes,
       draft: true,
     })
     .reply(200, {url: releaseUrl, id: releaseId})
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
       draft: false,
     })
     .reply(200, {url: releaseUrl})
     .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('File with release v1.0.0 in label')}`)
     .reply(200, {browser_download_url: assetUrl});

   const result = await t.context.m.publish(
     {assets},
     {cwd, env, options, branch: {type: 'release'}, nextRelease, logger: t.context.logger}
   );

   t.is(result.url, releaseUrl);
   t.regex(t.context.log.args[0][0], new RegExp('^Verify Gitea authentication \(.*\)$'));
   t.true(t.context.log.calledWith('Published file %s', assetUrl));
   t.true(t.context.log.calledWith('Published Gitea release: %s', releaseUrl));
   t.true(gitea.isDone());
 });

 test.serial('Update a release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const options = {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`};
   const releaseId = 1;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;

   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}})
     .get(`/repos/${owner}/${repo}/releases?page=1`)
     .reply(200, [{id: releaseId, tag_name: nextRelease.gitTag}])
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl});

   const result = await t.context.m.addChannel(
     {},
     {cwd, env, options, branch: {type: 'release', main: true}, nextRelease, logger: t.context.logger}
   );

   t.is(result.url, releaseUrl);
   t.regex(t.context.log.args[0][0], new RegExp('^Verify Gitea authentication \(.*\)$'));
   t.deepEqual(t.context.log.args[1], ['Updated Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });

 test.serial('Verify and release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = ['upload.txt', {path: 'upload_other.txt', name: 'other_file.txt', label: 'Other File'}];
   const options = {
     publish: [{path: '@semantic-release/npm'}, {path: '@saithodev/semantic-release-gitea', assets}],
     repositoryUrl: `https://gitea.io/${owner}/${repo}.git`,
   };
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const releaseId = 1;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;
   const assetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${releaseId}/upload.txt`;
   const otherAssetUrl = `https://gitea.io/${owner}/${repo}/releases/download/${releaseId}/other_file.txt`;
   const github = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}})
     .post(`/repos/${owner}/${repo}/releases`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       body: nextRelease.notes,
       draft: true,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl, id: releaseId})
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {draft: false})
     .reply(200, {url: releaseUrl})
     .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('upload.txt')}`)
     .reply(200, {browser_download_url: assetUrl})
     .post(`/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${escape('Other File')}`)
     .reply(200, {browser_download_url: otherAssetUrl});

   await t.notThrowsAsync(t.context.m.verifyConditions({}, {cwd, env, options, logger: t.context.logger}));
   await t.context.m.publish(
     {assets},
     {cwd, env, options, branch: {type: 'release', main: true}, nextRelease, logger: t.context.logger}
   );

   t.regex(t.context.log.args[0][0], new RegExp('^Verify Gitea authentication \(.*\)$'));
   t.true(t.context.log.calledWith('Published file %s', otherAssetUrl));
   t.true(t.context.log.calledWith('Published file %s', assetUrl));
   t.true(t.context.log.calledWith('Published Gitea release: %s', releaseUrl));
   t.true(github.isDone());
 });

 test.serial('Verify and update release', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const options = {
     publish: [{path: '@semantic-release/npm'}, {path: '@saithodev/semantic-release-gitea'}],
     repositoryUrl: `https://gitea.io/${owner}/${repo}.git`,
   };
   const nextRelease = {gitTag: 'v1.0.0', name: 'v1.0.0', notes: 'Test release note body'};
   const releaseId = 1;
   const releaseUrl = `https://gitea.io/${owner}/${repo}/releases/${releaseId}`;
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}})
     .get(`/repos/${owner}/${repo}/releases?page=1`)
     .reply(200, [{id: releaseId, tag_name: nextRelease.gitTag}])
     .patch(`/repos/${owner}/${repo}/releases/${releaseId}`, {
       tag_name: nextRelease.gitTag,
       name: nextRelease.name,
       prerelease: false,
     })
     .reply(200, {url: releaseUrl});

   await t.notThrowsAsync(t.context.m.verifyConditions({}, {cwd, env, options, logger: t.context.logger}));
   await t.context.m.addChannel(
     {},
     {cwd, env, branch: {type: 'release', main: true}, nextRelease, options, logger: t.context.logger}
   );

   t.regex(t.context.log.args[0][0], new RegExp('^Verify Gitea authentication \(.*\)$'));
   t.deepEqual(t.context.log.args[1], ['Updated Gitea release: %s', releaseUrl]);
   t.true(gitea.isDone());
 });
