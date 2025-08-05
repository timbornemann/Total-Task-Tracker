declare module "../src/shared/syncUtils.js" {
  export function mergeLists<T extends { id: string }>(a: T[], b: T[]): T[];
  export function mergeData<T>(a: T, b: T): T;
  export function applyDeletions<T>(data: T): T;
}

declare module "../../src/shared/syncUtils.js" {
  export * from "../src/shared/syncUtils.js";
}
