import { defineConfig } from "eslint/config";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  {
    ignores: ["gpt-handoff/**", ".codex/**", "scripts/**"],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],

      "@typescript-eslint/no-unused-expressions": ["error", {
        allowTernary: true,
      }],

      // eslint-config-next 16 bundles a much stricter react-hooks ruleset (concurrent-
      // rendering/compiler-readiness checks) that surfaces ~90 pre-existing findings across
      // the game/dashboard components — out of scope for the Next.js CVE upgrade that
      // introduced this config. Turned off here pending a dedicated cleanup pass; see
      // fix/next16-security-upgrade branch notes.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);
