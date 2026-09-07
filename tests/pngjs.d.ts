/* pngjs ships no types and this repo has no @types/pngjs. tests/visual/cover-contrast.spec.ts
   reads raw pixels from a screenshot to measure real composited contrast, and needs exactly the
   three members below. Declared standalone rather than inside the spec: an UNTYPED module cannot
   be augmented from a file that imports it (ts 2665), so the augmentation has to be ambient.
   Narrow on purpose — a wrong shape in these three is still a type error rather than `any`. */
declare module "pngjs" {
  export class PNG {
    width: number;
    height: number;
    data: Uint8Array;
    static sync: { read(buffer: Buffer): PNG };
  }
}
