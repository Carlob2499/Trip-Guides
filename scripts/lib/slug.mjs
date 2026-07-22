// Shared slug validator (S3/S4): a guide slug is used to build filesystem paths, branch
// names, and JSON/bash strings across the pipeline scripts and workflows — an unvalidated
// slug is both a path-traversal vector (`--slug ../../x`) and a shell/JSON injection
// vector. Every entry point that accepts a slug from an external trigger (workflow_dispatch
// input, issue title, CLI arg) must validate it with this function before using it.
export function isValidSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
