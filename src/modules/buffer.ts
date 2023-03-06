
type TextDecoder = {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  decode(input?: Uint8Array): string;
};
type TextDecoderConstructor = {
  new(label: 'utf8', options: { fatal: boolean; ignoreBOM?: boolean }): TextDecoder;
};

type TextEncoder = {
  readonly encoding: string;
  encode(input?: string): Uint8Array;
};
type TextEncoderConstructor = {
  new(): TextEncoder;
};

// Web global
declare const TextDecoder: TextDecoderConstructor;
declare const TextEncoder: TextEncoderConstructor;
declare const atob: (base64: string) => string;
declare const btoa: (binary: string) => string;

type ArrayBufferViewWithTag = ArrayBufferView & {
  [Symbol.toStringTag]?: string;
};

function isReactNative() {
  const { navigator } = globalThis as { navigator?: { product?: string } };
  return typeof navigator === 'object' && navigator.product === 'ReactNative';
}

/** @internal */
export function webMathRandomBytes(byteLength: number) {
  if (byteLength < 0) {
    throw new RangeError(`The argument 'byteLength' is invalid. Received ${byteLength}`);
  }
  return webByteUtils.fromNumberArray(
    Array.from({ length: byteLength }, () => Math.floor(Math.random() * 256))
  );
}

const HEX_DIGIT = /(\d|[a-f])/i;

/** @internal */
export const webByteUtils = {
  toLocalBufferType(
    potentialUint8array: Uint8Array | ArrayBufferViewWithTag | ArrayBuffer
  ): Uint8Array {
    const stringTag =
      potentialUint8array?.[Symbol.toStringTag] ??
      Object.prototype.toString.call(potentialUint8array);

    if (stringTag === 'Uint8Array') {
      return potentialUint8array as Uint8Array;
    }

    if (ArrayBuffer.isView(potentialUint8array)) {
      return new Uint8Array(
        potentialUint8array.buffer.slice(
          potentialUint8array.byteOffset,
          potentialUint8array.byteOffset + potentialUint8array.byteLength
        )
      );
    }

    if (
      stringTag === 'ArrayBuffer' ||
      stringTag === 'SharedArrayBuffer' ||
      stringTag === '[object ArrayBuffer]' ||
      stringTag === '[object SharedArrayBuffer]'
    ) {
      return new Uint8Array(potentialUint8array);
    }

    throw new Error(`Cannot make a Uint8Array from ${String(potentialUint8array)}`);
  },

  allocate(size: number): Uint8Array {
    if (typeof size !== 'number') {
      throw new TypeError(`The "size" argument must be of type number. Received ${String(size)}`);
    }
    return new Uint8Array(size);
  },

  equals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.byteLength !== b.byteLength) {
      return false;
    }
    for (let i = 0; i < a.byteLength; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  },

  fromNumberArray(array: number[]): Uint8Array {
    return Uint8Array.from(array);
  },

  fromBase64(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  },

  toBase64(uint8array: Uint8Array): string {
    return btoa(webByteUtils.toISO88591(uint8array));
  },

  /** **Legacy** binary strings are an outdated method of data transfer. Do not add public API support for interpreting this format */
  fromISO88591(codePoints: string): Uint8Array {
    return Uint8Array.from(codePoints, c => c.charCodeAt(0) & 0xff);
  },

  /** **Legacy** binary strings are an outdated method of data transfer. Do not add public API support for interpreting this format */
  toISO88591(uint8array: Uint8Array): string {
    return Array.from(Uint16Array.from(uint8array), b => String.fromCharCode(b)).join('');
  },

  fromHex(hex: string): Uint8Array {
    const evenLengthHex = hex.length % 2 === 0 ? hex : hex.slice(0, hex.length - 1);
    const buffer: number[] = [];

    for (let i = 0; i < evenLengthHex.length; i += 2) {
      const firstDigit = evenLengthHex[i];
      const secondDigit = evenLengthHex[i + 1];

      if (!HEX_DIGIT.test(firstDigit)) {
        break;
      }
      if (!HEX_DIGIT.test(secondDigit)) {
        break;
      }

      const hexDigit = Number.parseInt(`${firstDigit}${secondDigit}`, 16);
      buffer.push(hexDigit);
    }

    return Uint8Array.from(buffer);
  },

  toHex(uint8array: Uint8Array): string {
    return Array.from(uint8array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  fromUTF8(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  },

  toUTF8(uint8array: Uint8Array): string {
    return new TextDecoder('utf8', { fatal: false }).decode(uint8array);
  },

  utf8ByteLength(input: string): number {
    return webByteUtils.fromUTF8(input).byteLength;
  },

  encodeUTF8Into(buffer: Uint8Array, source: string, byteOffset: number): number {
    const bytes = webByteUtils.fromUTF8(source);
    buffer.set(bytes, byteOffset);
    return bytes.byteLength;
  },

  randomBytes(byteLength: number) {
    // You cannot separate getRandomValues from crypto (need to have this === crypto)
    return crypto.getRandomValues(webByteUtils.allocate(byteLength));
  },

  concat(buffers: Uint8Array | Array<Uint8Array>) {
    if (!Array.isArray(buffers)) {
      buffers = [buffers]
    }
    const sum = buffers.reduce((acc, i) => (acc += i.byteLength), 0)
    const space = new Uint8Array(sum)
    let offset = 0;
    for (const b of buffers) {
      space.set(b, offset)
      offset += b.byteLength;
    }
    return space;
  }
};

export class Buffer extends Uint8Array {
  _myCustomMongoDBBuffer = true;

  constructor(buffer: ArrayBufferLike, byteOffset?: number, length?: number);
  constructor(size: number)
  constructor(...args: ConstructorParameters<Uint8ArrayConstructor>) {
    super(...args)
  }

  static isBuffer(b) {
    return !!b._myCustomMongoDBBuffer;
  }

  static byteLength(input) {
    return webByteUtils.utf8ByteLength(input)
  }

  static alloc(space) {
    return new Buffer(webByteUtils.allocate(space));
  }

  static allocUnsafe(space) {
    return this.alloc(space);
  }

  write(s: string, offset: number, format) {
    if (format !== 'utf8') throw new Error('cannot serialize not utf8!!');
    this.set(webByteUtils.fromUTF8(s), offset);
  }

  writeInt32LE(value: number, offset: number) {
    const space = new DataView(new ArrayBuffer(4));
    space.setInt32(0, value, true);
    this.set(new Uint8Array(space.buffer), offset);
  }

  writeUInt32LE(value: number, offset: number) {
    const space = new DataView(new ArrayBuffer(4));
    space.setUint32(0, value, true);
    this.set(new Uint8Array(space.buffer), offset);
  }

  readInt32LE(offset: number) {
    const dv = new DataView(this.buffer, this.byteOffset, this.byteLength);
    return dv.getInt32(offset, true);
  }

  readUInt8(offset: number) {
    const dv = new DataView(this.buffer, this.byteOffset, this.byteLength);
    return dv.getUint8(offset);
  }

  readUInt32LE(offset: number) {
    const dv = new DataView(this.buffer, this.byteOffset, this.byteLength);
    return dv.getUint32(offset, true);
  }

  static concat(buffers: Uint8Array | Array<Uint8Array>) {
    return webByteUtils.concat(buffers);
  }
}
