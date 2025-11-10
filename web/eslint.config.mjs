// ESLint フラット構成: Next.js + TypeScript 推奨設定を読み込み
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Warningをerrorに変えない（ビルドを止めない）
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "error", // anyはエラーのまま
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
