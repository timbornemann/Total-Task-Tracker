declare module "../../src/shared/syncUtils.js" {
  export interface AllData {
    [key: string]: any;
  }
  export function mergeLists<T extends { id: string }>(a: T[], b: T[]): T[];
  export function mergeData<T>(a: T, b: T): T;
  export function applyDeletions<T extends AllData>(data: T): T;
}
