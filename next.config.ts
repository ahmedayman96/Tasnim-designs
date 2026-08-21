import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16.3 writes an AGENTS.md (and a CLAUDE.md importing it) into the repo
  // root on dev/build. Opted out — we keep our own agent instructions.
  agentRules: false,
};

export default nextConfig;
