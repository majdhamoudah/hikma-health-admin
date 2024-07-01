/**
Utility function that processes the values of an object

@param {Object} obj
@oaram {(v: any) => any} func
@returns {Object}
*/
export function mapObjectValues<T>(obj: T, func: (v: any) => any): T {
  return Object.fromEntries(Object.entries(obj as any).map(([k, v]) => [k, func(v)])) as T;
}
