/* eslint-disable */
// Polyfills for older eReader browsers (like Kindle Experimental Browser / WebKit 534)
if (typeof window !== 'undefined') {
  // 1. globalThis polyfill
  if (typeof globalThis === 'undefined') {
    (window as any).globalThis = window;
  }

  // 2. Object.setPrototypeOf polyfill (essential for ES5 transpiled class inheritance)
  if (typeof Object.setPrototypeOf === 'undefined') {
    Object.setPrototypeOf = function (obj: any, proto: any) {
      obj.__proto__ = proto;
      return obj;
    };
  }

  // 3. URLSearchParams polyfill (used by Supabase and URL polyfill)
  if (!window.URLSearchParams) {
    const URLSearchParamsPolyfill = function (this: any, queryString?: string) {
      this.params = {} as Record<string, string>;
      if (queryString) {
        const query = queryString.charAt(0) === '?' ? queryString.substring(1) : queryString;
        const pairs = query.split('&');
        for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i].split('=');
          if (pair[0]) {
            this.params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
          }
        }
      }
    };

    URLSearchParamsPolyfill.prototype.get = function (name: string) {
      return this.params[name] || null;
    };

    URLSearchParamsPolyfill.prototype.set = function (name: string, value: string) {
      this.params[name] = value;
    };

    URLSearchParamsPolyfill.prototype.toString = function () {
      const parts = [];
      for (const name in this.params) {
        if (Object.prototype.hasOwnProperty.call(this.params, name)) {
          parts.push(encodeURIComponent(name) + '=' + encodeURIComponent(this.params[name]));
        }
      }
      return parts.join('&');
    };

    (window as any).URLSearchParams = URLSearchParamsPolyfill;
  }

  // 4. URL constructor polyfill
  let urlWorks = false;
  try {
    if (window.URL) {
      const u = new window.URL('https://example.com');
      if (u.href === 'https://example.com/') {
        urlWorks = true;
      }
    }
  } catch (e) {}

  if (!urlWorks) {
    const URLPolyfill = function (this: any, url: string, base?: string) {
      let absoluteUrl = url;
      if (base) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          const baseClean = base.endsWith('/') ? base : base + '/';
          const urlClean = url.startsWith('/') ? url.substring(1) : url;
          absoluteUrl = baseClean + urlClean;
        }
      }
      this.href = absoluteUrl;

      // Parse protocol, host, pathname
      const match = absoluteUrl.match(/^https?:\/\/[^/]+/);
      this.origin = match ? match[0] : '';

      const pathAndQuery = absoluteUrl.substring(this.origin.length);
      const queryIndex = pathAndQuery.indexOf('?');
      if (queryIndex !== -1) {
        this.pathname = pathAndQuery.substring(0, queryIndex);
        this.search = pathAndQuery.substring(queryIndex);
      } else {
        this.pathname = pathAndQuery || '/';
        this.search = '';
      }

      this.searchParams = new window.URLSearchParams(this.search);
    };

    (window as any).URL = URLPolyfill;
  }

  // 5. AbortController & AbortSignal polyfills (required by Supabase client)
  if (!window.AbortController) {
    class AbortSignalPolyfill {
      aborted = false;
      _listeners: Record<string, any[]> = {};
      
      addEventListener(type: string, listener: any) {
        this._listeners[type] = this._listeners[type] || [];
        this._listeners[type].push(listener);
      }
      
      removeEventListener(type: string, listener: any) {
        if (this._listeners[type]) {
          this._listeners[type] = this._listeners[type].filter((l) => l !== listener);
        }
      }
      
      dispatchEvent(event: any) {
        if (this._listeners[event.type]) {
          this._listeners[event.type].forEach((l) => l(event));
        }
      }
    }

    class AbortControllerPolyfill {
      signal = new AbortSignalPolyfill();
      
      abort() {
        this.signal.aborted = true;
        const event = { type: 'abort' };
        this.signal.dispatchEvent(event);
        if (typeof (this.signal as any).onabort === 'function') {
          (this.signal as any).onabort(event);
        }
      }
    }

    (window as any).AbortController = AbortControllerPolyfill;
    (window as any).AbortSignal = AbortSignalPolyfill;
  }

  // 6. TextEncoder & TextDecoder polyfills (required by Next.js App Router HTML streaming/hydration)
  if (typeof window.TextEncoder === 'undefined') {
    const TextEncoderPolyfill = function () {};
    TextEncoderPolyfill.prototype.encode = function (str: string) {
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i) & 0xff;
      }
      return arr;
    };
    (window as any).TextEncoder = TextEncoderPolyfill;
  }

  if (typeof window.TextDecoder === 'undefined') {
    const TextDecoderPolyfill = function () {};
    TextDecoderPolyfill.prototype.decode = function (arr: Uint8Array) {
      if (!arr) return '';
      let str = '';
      for (let i = 0; i < arr.length; i++) {
        str += String.fromCharCode(arr[i]);
      }
      return str;
    };
    (window as any).TextDecoder = TextDecoderPolyfill;
  }

  // 7. ReadableStream polyfill (required by Next.js App Router HTML streaming/hydration)
  if (typeof window.ReadableStream === 'undefined') {
    const ReadableStreamPolyfill = function (this: any) {
      // Dummy implementation
    };
    ReadableStreamPolyfill.prototype.getReader = function () {
      return {
        read: function () {
          return Promise.resolve({ done: true, value: undefined });
        },
        releaseLock: function () {}
      };
    };
    (window as any).ReadableStream = ReadableStreamPolyfill;
  }
}
export {};
