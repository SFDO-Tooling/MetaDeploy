declare module 'sockette' {
  declare export default class Sockette {
    constructor(url: string, opts?: { [string]: mixed }): Sockette;

    send: (data: mixed) => void;
    close: (code?: number, reason?: string) => void;
    json: (obj: { [mixed]: any }) => void;
    reconnect: () => void;
    open: () => void;
  }
}
