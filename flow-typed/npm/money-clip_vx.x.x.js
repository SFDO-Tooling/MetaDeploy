// flow-typed signature: a12c6732ce617056a2e89287473e807f
// flow-typed version: <<STUB>>/money-clip_v^3.0.0/flow_v0.88.0

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
