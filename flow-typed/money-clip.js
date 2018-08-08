declare module 'money-clip' {
  declare export function getConfiguredCache({
    maxAge?: number,
    version?: string | number,
    lib?: any,
  }): {
    set: (string, any) => Promise<void>,
    get: string => Promise<string>,
    keys: () => Promise<Array<string>>,
    del: () => Promise<void>,
    clear: () => Promise<void>,
    getAll: () => Promise<any>,
  };
}
