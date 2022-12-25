import {
  Cookie,
  getCookies,
  setCookie,
} from "https://deno.land/std@0.168.0/http/cookie.ts";

interface CookieFactoryOptions extends Omit<Cookie, "value"> {
  secret: string;
  // secure: boolean
  // maxAge: number
  // expires: Date
}

async function createCookieFactory(options: CookieFactoryOptions) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(options.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify", "sign"],
  );

  return {
    get name() {
      return options.name;
    },
    async serialize<T = Record<string, any>>(value: T) {
      const encoded = btoa(
        myUnescape(encodeURIComponent(JSON.stringify(value))),
      );

      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(encoded),
      );
      const hash = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(
          /=+$/,
          "",
        );
      const finalEncode = encoded + "." + hash;

      const headers = new Headers();
      const cookie: Cookie = {
        name: options.name,
        value: finalEncode,
        path: options.path,
        sameSite: options.sameSite,
        httpOnly: options.httpOnly,
      };
      setCookie(headers, cookie);
      return headers.get("set-cookie") as string;
    },
    async parse<T = Record<string, any>>(
      headers: Headers,
    ): Promise<T | false> {
      const cookies = getCookies(headers);
      const cookie = cookies[options.name];

      if (!cookie) return false;

      const value = cookie.slice(0, cookie.lastIndexOf("."));
      const hash = cookie.slice(cookie.lastIndexOf(".") + 1);

      const data = encoder.encode(value);
      const signature = byteStringToUint8Array(atob(hash));
      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        signature,
        data,
      );

      return valid ? decodeData(value) : false;
    },
  };
}

function decodeData(value: string): any {
  try {
    return JSON.parse(decodeURIComponent(myEscape(atob(value))));
  } catch (error: unknown) {
    return {};
  }
}

function myUnescape(value: string): string {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, part;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (chr === "%") {
      if (str.charAt(index) === "u") {
        part = str.slice(index + 1, index + 5);
        if (/^[\da-f]{4}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 5;
          continue;
        }
      } else {
        part = str.slice(index, index + 2);
        if (/^[\da-f]{2}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 2;
          continue;
        }
      }
    }
    result += chr;
  }
  return result;
}

function myEscape(value: string): string {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, code;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (/[\w*+\-./@]/.exec(chr)) {
      result += chr;
    } else {
      code = chr.charCodeAt(0);
      if (code < 256) {
        result += "%" + hex(code, 2);
      } else {
        result += "%u" + hex(code, 4).toUpperCase();
      }
    }
  }
  return result;
}

function hex(code: number, length: number): string {
  let result = code.toString(16);
  while (result.length < length) result = "0" + result;
  return result;
}

function byteStringToUint8Array(byteString: string): Uint8Array {
  const array = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }

  return array;
}

const cookieFactory = await createCookieFactory({
  name: "__session",
  path: "/",
  secret: "sdkfjsldfd",
  sameSite: "Lax",
  httpOnly: true,
});

type Session = ReturnType<typeof createSession>;
function createSession(initialData: Record<string, any> = {}) {
  const map = new Map<string, any>(Object.entries(initialData));
  const flashPrefix = "__flash_";

  return {
    get(key: string) {
      if (map.has(key)) return map.get(key);

      const flashKey = `${flashPrefix}${key}`;
      if (map.has(flashKey)) {
        const value = map.get(flashKey);
        map.delete(flashKey);
        return value;
      }

      return undefined;
    },
    set(key: string, value: any) {
      map.set(key, value);
    },
    delete(key: string) {
      map.delete(key);
    },
    flash(key: string, value: any) {
      map.set(`${flashPrefix}${key}`, value);
    },
    data() {
      return Object.fromEntries(map);
    },
  };
}

export async function getSession(headers: Headers) {
  const data = await cookieFactory.parse(headers);
  return createSession(data || {});
}

export async function commitSession(session: Session) {
  return await cookieFactory.serialize(session.data());
}
