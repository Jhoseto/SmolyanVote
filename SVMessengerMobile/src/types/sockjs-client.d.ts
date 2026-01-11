/**
 * Type declarations for sockjs-client
 */
declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    transports?: string | string[];
    sessionId?: number | (() => number);
    timeout?: number;
    devel?: boolean;
    debug?: boolean;
    protocols_whitelist?: string[];
    [key: string]: any;
  }

  class SockJS {
    constructor(url: string, protocols?: string | string[] | null, options?: SockJSOptions);
    readyState: number;
    protocol: string | null;
    url: string;
    onopen: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    send(data: string): void;
    close(code?: number, reason?: string): void;
  }

  export = SockJS;
}
