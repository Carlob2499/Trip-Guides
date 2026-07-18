/// <reference types="astro/client" />

// Self-hosted variable fonts are side-effect imports (they inject @font-face CSS, export
// nothing). @fontsource-variable ships no type declarations, so declare the namespace as a
// valid module so `astro check` doesn't flag every `import "@fontsource-variable/x"`.
declare module "@fontsource-variable/*";
