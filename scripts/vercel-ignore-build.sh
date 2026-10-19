#!/bin/bash
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand). Exit 0 = skip the build, 1 = build.
# Skips commits that only touch docs / scripts / tests / exports — each real build stores a
# ~100MB deployment against the team's 10GB Deployment Storage quota.
#
# Diffs against VERCEL_GIT_PREVIOUS_SHA (last successful deployment on this branch), not HEAD^,
# so a batched push of "code commit, then docs commit" still builds the code change.
# When in doubt (no base, base outside Vercel's 10-commit shallow clone, or a dashboard
# Redeploy of the same commit) it builds.

BASE="$VERCEL_GIT_PREVIOUS_SHA"
HEAD_SHA="$(git rev-parse HEAD)"

if [ -z "$BASE" ] || [ "$BASE" = "$HEAD_SHA" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  echo "▶ Build: no comparable previous deployment"
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- . \
  ':(exclude,glob)**/*.md' \
  ':(exclude)docs' \
  ':(exclude)exports' \
  ':(exclude)scripts' \
  ':(exclude)supabase' \
  ':(exclude)__tests__' \
  ':(exclude)e2e' \
  ':(exclude)test-fixtures' \
  ':(exclude).github'; then
  echo "⏭ Skip build: only docs/scripts/tests changed since $BASE"
  exit 0
fi

echo "▶ Build: app files changed since $BASE"
exit 1
