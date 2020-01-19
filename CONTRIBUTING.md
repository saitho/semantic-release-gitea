# Contributing

Feel free to submit any new features via Pull Request.
Make sure the supplied tests still work and to add own test cases to cover your code.

## PNPM

This repository uses pnpm instead of npm for installing NPM packages.
Install it using `npm i -g pnpm` if you haven't already. All commands from npm are available with pnpm.

Install dependencies with `pnpm install`.

## Commit message hook

This project uses commizen for consistent commit message formatting.

Please setup a Git hook in `.git/hooks/prepare-commit-msg` with the following contents:

```shell script
#!/bin/bash
exec < /dev/tty && node_modules/.bin/git-cz --hook || true
```

After that, make it executable: `chmod +x .git/hooks/prepare-commit-msg`

## Running tests

Run tests by this command:

```shell script
pnpm run test
```