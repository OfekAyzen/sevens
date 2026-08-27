---
name: ship-apk
description: Build and publish the Sevens Android APK by pushing a tag and watching the GitHub Actions release build.
when_to_use: Invoke explicitly when you want to cut an APK for the group to install.
disable-model-invocation: true
argument-hint: "[version, e.g. v0.2.0]"
allowed-tools: Bash Read
---

# Ship an APK

This skill pushes and publishes. It is deliberately marked
`disable-model-invocation: true` so that Claude cannot decide on its own that the
code looks ready to release — that call is yours.

## Preflight

Refuse to continue if any of these fail:

```bash
npm run verify           # the gate must be fully green
git status --porcelain   # must be empty
git branch --show-current
```

A release from a dirty tree produces an APK nobody can reproduce.

## Cut the release

```bash
git tag "$1" -m "Sevens $1"
git push origin "$1"
```

The `android` workflow builds on the tag and attaches the APK to a GitHub
release.

## Watch it

```bash
gh run list --workflow=android.yml --limit 1
gh run watch "$(gh run list --workflow=android.yml --limit 1 --json databaseId -q '.[0].databaseId')"
```

If it fails, pull the log for the failing job, diagnose, fix on a branch, and cut
a new tag. Never retag an existing version — friends who already installed the
old APK will not get an update prompt from a moved tag.

## Report

Give the release URL and the direct APK download link, then state the install
step your friends need: enable "install unknown apps" for their browser, open the
link, install. Say the build number so everyone can confirm they have the same one.
