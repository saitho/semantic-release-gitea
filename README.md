# @saithodev/semantic-release-gitea

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to publish a Gitea release.

[![Build Status](https://travis-ci.com/saitho/semantic-release-gitea.svg?branch=master)](https://travis-ci.com/saitho/semantic-release-gitea)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

| Step               | Description                                                                                                                                                                                                                              |
|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `verifyConditions` | Verify the presence and the validity of the authentication (set via [environment variables](#environment-variables)) and the [assets](#assets) option configuration.                                                                     |
| `publish`          | Publish a Gitea release, optionally uploading file assets.                                                                                                                           |
| `addChannel`       | Update a Gitea release's `pre-release` field.                                                                                                                                        |

This plugin is based on the [semantic-release GitHub plugin](https://github.com/semantic-release/github). Thanks to everyone who worked on that!

## Install

```bash
$ npm install @saithodev/semantic-release-gitea -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@saithodev/semantic-release-gitea", {
      "giteaUrl": "https://try.gitea.io",
      "assets": [
        {"path": "dist/asset.min.css", "label": "CSS distribution"},
        {"path": "dist/asset.min.js", "label": "JS distribution"}
      ]
    }],
  ]
}
```

With this example Gitea releases will be published with the file `dist/asset.min.css` and `dist/asset.min.js`.

## Configuration

### Gitea authentication

The Gitea authentication configuration is **required** and can be set via [environment variables](#environment-variables).

Create a API key token via your Gitea installation’s web interface: `Settings | Applications | Generate New Token.`.
The token has to be made available in your CI environment via the `GITEA_TOKEN` environment variable.
The user associated with the token must have push permission to the repository.

### Environment variables

| Variable                       | Description                               |
| ------------------------------ | ----------------------------------------- |
| `GITEA_TOKEN`   | **Required.** The token used to authenticate with Gitea. |
| `GITEA_URL`       | **Required.** The URL to your Gitea instance.          |
| `GITEA_PREFIX` | The Gitea API prefix. (default: /api/v1)                  |

### Options

| Option               | Description                                                                                                                                                                                            | Default                                                                                                                                              |
|----------------------|--------------------------------------------------------------------|--------------------------------------|
| `giteaUrl`           | The Gitea endpoint.                                                | `GITEA_URL` environment variable.                                                                                                       |
| `giteaApiPathPrefix` | The Gitea API prefix.                                              | `GITEA_PREFIX` environment variable.                                                                                                 |
| `assets`             | An array of files to upload to the release. See [assets](#assets). | -                                                                                                                                  |

#### assets

Can be a [glob](https://github.com/isaacs/node-glob#glob-primer) or and `Array` of
[globs](https://github.com/isaacs/node-glob#glob-primer) and `Object`s with the following properties:

| Property | Description                                                                                              | Default                              |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `path`   | **Required.** A [glob](https://github.com/isaacs/node-glob#glob-primer) to identify the files to upload. | -                                    |
| `name`   | The name of the downloadable file on the GitHub release.                                                 | File name extracted from the `path`. |
| `label`  | Short description of the file displayed on the GitHub release.                                           | -                                    |

Each entry in the `assets` `Array` is globbed individually. A [glob](https://github.com/isaacs/node-glob#glob-primer)
can be a `String` (`"dist/**/*.js"` or `"dist/mylib.js"`) or an `Array` of `String`s that will be globbed together
(`["dist/**", "!**/*.css"]`).

If a directory is configured, all the files under this directory and its children will be included.

The `name` and `label` for each assets are generated with [Lodash template](https://lodash.com/docs#template). The following variables are available:

| Parameter     | Description                                                                         |
|---------------|-------------------------------------------------------------------------------------|
| `branch`      | The branch from which the release is done.                                          |
| `lastRelease` | `Object` with `version`, `gitTag` and `gitHead` of the last release.                |
| `nextRelease` | `Object` with `version`, `gitTag`, `gitHead` and `notes` of the release being done. |
| `commits`     | `Array` of commit `Object`s with `hash`, `subject`, `body` `message` and `author`.  |

**Note**: If a file has a match in `assets` it will be included even if it also has a match in `.gitignore`.

**Note**: The file types in this example are per default not allowed for release assets.
Make sure to check your Gitea configuration for allowed file types (setting `AttachmentAllowedTypes` inside `[attachment]` scope). 

##### assets examples

`'dist/*.js'`: include all the `js` files in the `dist` directory, but not in its sub-directories.

`[['dist', '!**/*.css']]`: include all the files in the `dist` directory and its sub-directories excluding the `css`
files.

`[{path: 'dist/MyLibrary.js', label: 'MyLibrary JS distribution'}, {path: 'dist/MyLibrary.css', label: 'MyLibrary CSS
distribution'}]`: include the `dist/MyLibrary.js` and `dist/MyLibrary.css` files, and label them `MyLibrary JS
distribution` and `MyLibrary CSS distribution` in the Gitea release.

`[['dist/**/*.{js,css}', '!**/*.min.*'], {path: 'build/MyLibrary.zip', label: 'MyLibrary'}]`: include all the `js` and
`css` files in the `dist` directory and its sub-directories excluding the minified version, plus the
`build/MyLibrary.zip` file and label it `MyLibrary` in the Gitea release.

`[{path: 'dist/MyLibrary.js', name: 'MyLibrary-${nextRelease.gitTag}.js', label: 'MyLibrary JS (${nextRelease.gitTag}) distribution'}]`: include the file `dist/MyLibrary.js` and upload it to the Gitea release with name `MyLibrary-v1.0.0.js` and label `MyLibrary JS (v1.0.0) distribution` which will generate the link:

> `[MyLibrary JS (v1.0.0) distribution](MyLibrary-v1.0.0.js)`
