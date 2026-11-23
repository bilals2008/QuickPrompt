import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  { ignores: ["dist", "src-tauri"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  {
    files: ["src/**/*.{js,jsx}"],
    ignores: ["src/lib/api/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='window'][property.name=/^(db|settingsAPI|folderAPI|vaultAPI|vaultFolderAPI|backupAPI|updateAPI|shellAPI|windowAPI|notificationAPI|importExportAPI|fsAPI|appAPI)$/]",
          message: "Use the api adapter from src/lib/api instead of window.* directly.",
        },
      ],
    },
  },
];
