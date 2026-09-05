/// <reference types="astro/client" />

// Self-hosted variable fonts are side-effect imports (they inject @font-face CSS, export
// nothing). @fontsource-variable ships no type declarations, so declare the namespace as a
// valid module so `astro check` doesn't flag every `import "@fontsource-variable/x"`.
declare module "@fontsource-variable/*";

interface ImportMetaEnv {
  readonly PUBLIC_GMAPS_KEY?: string;
  readonly PUBLIC_GMAPS_MAP_ID?: string;
  readonly PUBLIC_WAYPOINT_RUNTIME_ENABLED?: "0" | "1";
}

interface ImportMeta { readonly env: ImportMetaEnv; }
