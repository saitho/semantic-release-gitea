import test from 'ava';
import nock from 'nock';
import {stub} from 'sinon';
import {authenticate} from './helpers/mock-github';

/* eslint camelcase: ["error", {properties: "never"}] */

const verify = require('../lib/verify');

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

test.serial('Verify package, token and repository access', async t => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
  const assets = [{path: 'lib/file.js'}, 'file.js'];
  const gitea = authenticate(env)
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {permissions: {push: true}});

  await t.notThrowsAsync(
    verify(
      {assets},
      {env, options: {repositoryUrl: `git+https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger}
    )
  );
  t.true(gitea.isDone());
});

test.serial(
  'Verify package, token and repository access with "asset" set to "null"',
  async t => {
    const owner = 'test_user';
    const repo = 'test_repo';
    const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
    const assets = null;
    const gitea = authenticate(env)
      .get(`/repos/${owner}/${repo}`)
      .reply(200, {permissions: {push: true}});
    await t.notThrowsAsync(
      verify(
        {assets},
        {env, options: {repositoryUrl: `git+https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger}
      )
    );
    t.true(gitea.isDone());
  }
);

test.serial('Verify package, token and repository with environment variables', async t => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const env = {
    GITEA_URL: 'https://gitea.io',
    GITEA_TOKEN: 'gitea_token',
    GITEA_PREFIX: 'prefix',
  };
  const gitea = authenticate(env)
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {permissions: {push: true}});
  await t.notThrowsAsync(
    verify({}, {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger})
  );
  t.true(gitea.isDone());
  t.assert(t.context.log.args[0], 'Verify Gitea authentication (https://gitea.io/prefix)');
});

test.serial('Verify package, token and repository access with alternative environment varialbes', async t => {
  const owner = 'test_user';
  const repo = 'test_repo';
  const env = {
    GITEA_URL: 'https://gitea.io',
    GITEA_TOKEN: 'gitea_token',
    GITEA_PREFIX: 'prefix',
  };
  const gitea = authenticate(env)
    .get(`/repos/${owner}/${repo}`)
    .reply(200, {permissions: {push: true}});
  await t.notThrowsAsync(
    verify({}, {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger})
  );
  t.true(gitea.isDone());
});


 test.serial('Verify "assets" is a String', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io',GITEA_TOKEN: 'gitea_token'};
   const assets = 'file2.js';
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.true(gitea.isDone());
 });

 test.serial('Verify "assets" is an Object with a path property', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io',GITEA_TOKEN: 'gitea_token'};
   const assets = {path: 'file2.js'};
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.true(gitea.isDone());
 });

 test.serial('Verify "assets" is an Array of Object with a path property', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io',GITEA_TOKEN: 'gitea_token'};
   const assets = [{path: 'file1.js'}, {path: 'file2.js'}];
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.true(gitea.isDone());
 });

 test.serial('Verify "assets" is an Array of glob Arrays', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io',GITEA_TOKEN: 'gitea_token'};
   const assets = [['dist/**', '!**/*.js'], 'file2.js'];
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.true(gitea.isDone());
 });

 test.serial('Verify "assets" is an Array of Object with a glob Arrays in path property', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io',GITEA_TOKEN: 'gitea_token'};
   const assets = [{path: ['dist/**', '!**/*.js']}, {path: 'file2.js'}];
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   await t.notThrowsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `git@gitea.io:${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.true(gitea.isDone());
 });

 test.serial('Throw SemanticReleaseError for invalid token', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(401);

   const [error, ...errors] = await t.throwsAsync(
     verify({}, {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger})
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EINVALIDGITEATOKEN');
   t.true(gitea.isDone());
 });

 test('Throw SemanticReleaseError if no Gitea URL is provided', async t => {
   const env = {GITEA_TOKEN: 'gitea_token'};

   const [error, ...errors] = await t.throwsAsync(
     verify({}, {env, options: {repositoryUrl: 'https://gitea.io/${owner}/${repo}.git'}, logger: t.context.logger})
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'ENOGITEAURL');
 });

 test('Throw SemanticReleaseError for invalid repositoryUrl', async t => {
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};

   const [error, ...errors] = await t.throwsAsync(
     verify({}, {env, options: {repositoryUrl: 'invalid_url'}, logger: t.context.logger})
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EINVALIDGITEAURL');
 });

 test.serial("Throw SemanticReleaseError if token doesn't have the push permission on the repository", async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: false}});

   const [error, ...errors] = await t.throwsAsync(
     verify({}, {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger})
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EGITEANOPERMISSION');
   t.true(gitea.isDone());
 });

 test.serial("Throw SemanticReleaseError if the repository doesn't exist", async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(404);

   const [error, ...errors] = await t.throwsAsync(
     verify({}, {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger})
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EMISSINGREPO');
   t.true(gitea.isDone());
 });

 test.serial("Throw error if Gitea return any other errors", async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(500);

   await t.throwsAsync(
     verify({}, {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger})
   );
   t.true(gitea.isDone());
 });

 test.serial('Throw SemanticReleaseError if "assets" option is not a String or an Array of Objects', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = 42;
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   const [error, ...errors] = await t.throwsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EINVALIDASSETS');
   t.true(gitea.isDone());
 });

 test.serial('Throw SemanticReleaseError if "assets" option is an Array with invalid elements', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = ['file.js', 42];
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   const [error, ...errors] = await t.throwsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EINVALIDASSETS');
   t.true(gitea.isDone());
 });

 test.serial('Throw SemanticReleaseError if "assets" option is an Object missing the "path" property', async t => {
   const owner = 'test_user';
   const repo = 'test_repo';
   const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
   const assets = {name: 'file.js'};
   const gitea = authenticate(env)
     .get(`/repos/${owner}/${repo}`)
     .reply(200, {permissions: {push: true}});

   const [error, ...errors] = await t.throwsAsync(
     verify(
       {assets},
       {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger}
     )
   );

   t.is(errors.length, 0);
   t.is(error.name, 'SemanticReleaseError');
   t.is(error.code, 'EINVALIDASSETS');
   t.true(gitea.isDone());
 });

 test.serial(
   'Throw SemanticReleaseError if "assets" option is an Array with objects missing the "path" property',
   async t => {
     const owner = 'test_user';
     const repo = 'test_repo';
     const env = {GITEA_URL: 'https://gitea.io', GITEA_TOKEN: 'gitea_token'};
     const assets = [{path: 'lib/file.js'}, {name: 'file.js'}];
     const gitea = authenticate(env)
       .get(`/repos/${owner}/${repo}`)
       .reply(200, {permissions: {push: true}});

     const [error, ...errors] = await t.throwsAsync(
       verify(
         {assets},
         {env, options: {repositoryUrl: `https://gitea.io/${owner}/${repo}.git`}, logger: t.context.logger}
       )
     );

     t.is(errors.length, 0);
     t.is(error.name, 'SemanticReleaseError');
     t.is(error.code, 'EINVALIDASSETS');
     t.true(gitea.isDone());
   }
 );
