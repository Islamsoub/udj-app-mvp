import type { NextConfig } from 'next';

/**
 * One id per deploy, shared by Next and the service worker.
 *
 * The page registers /sw.js?build=<this id>, so each deploy is a new worker
 * script URL: the browser installs the new worker, it waits, and the student is
 * offered the update (components/pwa). The worker also names its caches after
 * it, so a deploy's caches are discarded when its successor activates.
 *
 * The commit SHA when the platform provides one (Vercel sets it on every build);
 * otherwise the build time, which still changes on every build.
 *
 * Stored in process.env on first evaluation: `next build` loads this file more
 * than once (and in child processes, which inherit the environment), and a
 * timestamp recomputed on each load gave the worker URL and Next's own build id
 * different values within one build.
 */
const BUILD_ID = (process.env.UNIPOCKET_BUILD_ID ||=
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.GIT_COMMIT_SHA?.slice(0, 12) ||
  `t${Date.now().toString(36)}`);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => BUILD_ID,
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  devIndicators: false,
  // pwa/ installs independently (its own node_modules + lockfile), exactly like
  // admin/. Without this, Turbopack walks up and infers the repo root — which
  // holds the React Native app's lockfile — as the workspace root.
  turbopack: {
    root: __dirname,
  },
  // `next dev` otherwise writes its own AGENTS.md/CLAUDE.md into pwa/, which
  // would shadow the repo-level CLAUDE.md for anything working in this folder.
  agentRules: false,
};

export default nextConfig;
