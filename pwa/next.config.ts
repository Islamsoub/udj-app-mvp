import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
