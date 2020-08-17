const BASE64_ENCODINGS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64_LOOKUP = new Uint8Array(256)
let IGNORE_NODE = false

/** Class extending Uint8Array to provide a partial implementation of NodeJS Buffer as a cross-platform shim. */
export class BufferShim extends Uint8Array {
  /**
   * @param {string|Buffer|BufferShim|ArrayBuffer|SharedArrayBuffer} input 
   * @param {BufferEncoding} [encoding='utf8']
   */
  constructor (input: string | Buffer | BufferShim | ArrayBuffer | SharedArrayBuffer, encoding: BufferEncoding = 'utf8') {
    const isAscii = (encoding: BufferEncoding) => ['ascii', 'latin1', 'binary'].includes(encoding)
    const isUtf16 = (encoding: BufferEncoding) => ['ucs2', 'ucs-2', 'utf16le'].includes(encoding)
    const isUtf8 = (encoding: BufferEncoding) => ['utf8', 'utf-8'].includes(encoding)
    let buffer: ArrayBuffer

    if (BASE64_LOOKUP['B'.charCodeAt(0)] === 0) {
      for (let i = 0; i < BASE64_ENCODINGS.length; i += 1) {
        BASE64_LOOKUP[BASE64_ENCODINGS.charCodeAt(i)] = i
      }
    }

    if (typeof input === 'string' && isUtf8(encoding)) {
      buffer = BufferShim.toUTF8Array(input)
    } else if (typeof input === 'string' && isUtf16(encoding)) {
      buffer = BufferShim.toUTF16Array(input)
    } else if (typeof input === 'string' && isAscii(encoding)) {
      buffer = BufferShim.toASCIIArrayOrBinaryArray(input)
    } else if (typeof input === 'string' && encoding === 'hex') {
      buffer = BufferShim.toHexArray(input)
    } else if (typeof input === 'string' && encoding === 'base64') {
      buffer = BufferShim.atob(input)
    } else if (typeof input === 'string') {
      throw new Error('Unsupported encoding ' + encoding)
    } else if (BufferShim.isBuffer(input) || BufferShim.isBufferShim(input)) {
      buffer = BufferShim.toArrayBuffer(input as Buffer)
    } else {
      buffer = input as ArrayBuffer
    }

    super(buffer)
  }

  private static atob (input: string) {
    if (BufferShim.isNodeEnv) return BufferShim.toArrayBuffer(Buffer.from(input, 'base64'))

    const getByteLength = (str: string) => {
      let bytes = str.length * 0.75

      if (str[str.length - 1] === '=') {
        bytes--
        if (str[str.length - 2] === '=') {
          bytes--
        }
      }

      return bytes
    }

    input = input.replace(/[\t\n\f\r\s]+/g, '')
    const byteLength = getByteLength(input)
    const buffer = new ArrayBuffer(byteLength)
    const dataView = new Uint8Array(buffer)
    let bytePos = 0

    for (let pos = 0; pos < input.length; pos += 4) {
      const encoded1 = BASE64_LOOKUP[input.charCodeAt(pos)]
      const encoded2 = BASE64_LOOKUP[input.charCodeAt(pos + 1)]
      const encoded3 = BASE64_LOOKUP[input.charCodeAt(pos + 2)]
      const encoded4 = BASE64_LOOKUP[input.charCodeAt(pos + 3)]

      dataView[bytePos++] = (encoded1 << 2) | (encoded2 >> 4)
      dataView[bytePos++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
      dataView[bytePos++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
    }

    return buffer
  }

  private static btoa (buffer: ArrayBuffer) {
    if (BufferShim.isNodeEnv) return BufferShim.toNodeBuffer(buffer).toString('base64')

    let base64 = ''
    let bytes = new Uint8Array(buffer)
    let byteLength = bytes.byteLength
    let byteRemainder = byteLength % 3
    let mainLength = byteLength - byteRemainder
    let a, b, c, d
    let chunk

    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63 // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += BASE64_ENCODINGS[a] + BASE64_ENCODINGS[b] + BASE64_ENCODINGS[c] + BASE64_ENCODINGS[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]

      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

      // Set the 4 least significant bits to zero
      b = (chunk & 3) << 4 // 3   = 2^2 - 1

      base64 += BASE64_ENCODINGS[a] + BASE64_ENCODINGS[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

      // Set the 2 least significant bits to zero
      c = (chunk & 15) << 2 // 15    = 2^4 - 1

      base64 += BASE64_ENCODINGS[a] + BASE64_ENCODINGS[b] + BASE64_ENCODINGS[c] + '='
    }

    return base64
  }

  private static fromUTF8ArrayOrASCIIArray (buffer: ArrayBuffer) {
    if (BufferShim.isNodeEnv) return BufferShim.toNodeBuffer(buffer).toString('utf8')

    const bytes = new Uint8Array(buffer)
    const out = []
    let pos = 0

    while (pos < bytes.length) {
      let c1 = bytes[pos++]

      if (c1 < 128) {
        out.push(String.fromCharCode(c1))
      } else if (c1 > 191 && c1 < 224) {
        let c2 = bytes[pos++]

        out.push(String.fromCharCode(((c1 & 31) << 6) | (c2 & 63)))
      } else if (c1 > 239 && c1 < 365) {
        // Surrogate Pair
        let c2 = bytes[pos++]
        let c3 = bytes[pos++]
        let c4 = bytes[pos++]
        let u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000

        out.push(String.fromCharCode(0xd800 + (u >> 10)))
        out.push(String.fromCharCode(0xdc00 + (u & 1023)))
      } else {
        let c2 = bytes[pos++]
        let c3 = bytes[pos++]

        out.push(String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)))
      }
    }

    return out.join('')
  }

  private static toUTF8Array (input: string) {
    if (BufferShim.isNodeEnv) return BufferShim.toArrayBuffer(Buffer.from(input, 'utf8'))

    let utf8 = []

    for (let i = 0; i < input.length; i += 1) {
      let charcode = input.charCodeAt(i)

      if (charcode < 0x80) {
        utf8.push(charcode)
      } else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f))
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f))
      } else {
        // surrogate pair
        i += 1
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff))

        utf8.push(
          0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        )
      }
    }

    return new Uint8Array(utf8).buffer
  }

  private static toUTF16Array (input: string) {
    if (BufferShim.isNodeEnv) return BufferShim.toArrayBuffer(Buffer.from(input, 'utf16le'))

    const utf16 = []

    for (let i = 0; i < input.length; i += 1) {
      const c = input.charCodeAt(i)
      const hi = c >> 8
      const lo = c % 256

      utf16.push(lo)
      utf16.push(hi)
    }

    return new Uint8Array(utf16).buffer
  }

  private static fromUTF16Array (buffer: ArrayBuffer) {
    if (BufferShim.isNodeEnv) return BufferShim.toNodeBuffer(buffer).toString('utf16le')

    const bytes = new Uint8Array(buffer)
    const out = []

    for (let i = 0; i < bytes.length; i += 2) {
      out.push(String.fromCharCode(bytes[i] + bytes[i + 1] * 256))
    }

    return out.join('')
  }

  private static toASCIIArrayOrBinaryArray (input: string) {
    if (BufferShim.isNodeEnv) return BufferShim.toArrayBuffer(Buffer.from(input, 'binary'))

    const ascii = []

    for (let i = 0; i < input.length; i += 1) {
      ascii.push(input.charCodeAt(i) & 0xff)
    }

    return new Uint8Array(ascii).buffer
  }

  private static fromBinaryArray (buffer: ArrayBuffer) {
    if (BufferShim.isNodeEnv) return BufferShim.toNodeBuffer(buffer).toString('binary')

    const bytes = new Uint8Array(buffer)
    const out = []

    for (let i = 0; i < bytes.length; i += 1) {
      out.push(String.fromCharCode(bytes[i]))
    }

    return out.join('')
  }

  private static toHexArray (input: string) {
    if (BufferShim.isNodeEnv) return BufferShim.toArrayBuffer(Buffer.from(input, 'hex'))

    const HEX_LEN = 2
    const hex = []
    const length = input.length / HEX_LEN

    for (let i = 0; i < length; i += 1) {
      const parsed = parseInt(input.substr(i * HEX_LEN, HEX_LEN), 16)

      if (isNaN(parsed)) return new Uint8Array([]).buffer

      hex.push(parsed)
    }

    return new Uint8Array(hex).buffer
  }

  private static fromHexArray (buffer: ArrayBuffer) {
    if (BufferShim.isNodeEnv) return BufferShim.toNodeBuffer(buffer).toString('hex')

    const bytes = new Uint8Array(buffer)
    const out = []

    for (let i = 0; i < bytes.length; i += 1) {
      const hex = bytes[i].toString(16)

      out.push(hex.length === 1 ? '0' + hex : hex)
    }

    return out.join('')
  }

  /** Copy a Buffer or BufferShim to an ArrayBuffer.
   * @param {Buffer|BufferShim} buffer
   * @returns {ArrayBuffer}
   */
  static toArrayBuffer (buffer: Buffer | BufferShim) {
    const arrayBuffer = new ArrayBuffer(buffer.length)
    const view = new Uint8Array(arrayBuffer)

    for (let i = 0; i < buffer.length; i += 1) {
      view[i] = buffer[i]
    }
    return arrayBuffer
  }

  /** Copy an ArrayBuffer to a Buffer if possible or a BufferShim.
   * @param {ArrayBuffer} buffer
   * @returns {Buffer}
   */
  static toNodeBuffer (buffer: ArrayBuffer) {
    if (!BufferShim.isNodeEnv) return new BufferShim(buffer)

    const nodeBuffer = Buffer.alloc(buffer.byteLength)
    const view = new Uint8Array(buffer)

    for (let i = 0; i < nodeBuffer.length; i += 1) {
      nodeBuffer[i] = view[i]
    }

    return nodeBuffer
  }

  /** Returns this instance as a Uint8Array.
   * @returns {Uint8Array}
   */
  toUint8Array () {
    return new Uint8Array(this.buffer)
  }

  /** Returns this instance as a NodeJS Buffer if possible.
   * @returns {Buffer}
   */
  toBuffer () {
    return BufferShim.toNodeBuffer(this.buffer)
  }

  /** Returns this instance as a string.
   * @param {BufferEncoding} [encoding='utf8']
   * @returns {string}
   */
  toString (encoding: BufferEncoding = 'utf8'): string {
    switch (encoding) {
      case 'hex':
        return BufferShim.fromHexArray(this.buffer)
      case 'ucs-2':
      case 'ucs2':
      case 'utf16le':
        return BufferShim.fromUTF16Array(this.buffer)
      case 'latin1':
      case 'binary':
        return BufferShim.fromBinaryArray(this.buffer)
      case 'base64':
        return BufferShim.btoa(this.buffer)
      case 'ascii':
      case 'utf-8':
      case 'utf8':
      default:
        return BufferShim.fromUTF8ArrayOrASCIIArray(this.buffer)
    }
  }

  /** Tests if the current environment is using NodeJS Buffer implementation. */
  static get isNodeEnv () {
    if (IGNORE_NODE) return false

    return typeof Buffer === 'function' && typeof Buffer.from === 'function' && typeof (Buffer as any).isBufferShim === 'undefined'
  }

  /** Returns true if {buffer} is a Buffer
   * @param {any} buffer
   * @returns {boolean}
   */
  static isBuffer(buffer: any) {
    if (BufferShim.isNodeEnv) {
      return buffer instanceof Buffer
    }

    return false
  }

  /** Returns true if {buffer} is a BufferShim
   * @param {any} buffer
   * @returns {boolean}
   */
  static isBufferShim (buffer: any) {
    return buffer instanceof BufferShim
  }

  /** Creates a new BufferShim from the given value.
   * @param {string|Buffer|BufferShim|ArrayBuffer|SharedArrayBuffer|Uint8Array|number[]} input
   * @param {BufferEncoding} [encoding='utf8']
   * @returns {BufferShim}
   */
  static from (arrayBuffer: ArrayBuffer | SharedArrayBuffer): BufferShim
  static from (data: number[]): BufferShim
  static from (data: Uint8Array): BufferShim
  static from (obj: { valueOf(): string | object } | { [Symbol.toPrimitive](hint: 'string'): string }): BufferShim
  static from (str: string, encoding?: BufferEncoding): BufferShim
  static from (
    input: string | Buffer | BufferShim | ArrayBuffer | SharedArrayBuffer | Uint8Array | number[],
    encoding?: BufferEncoding
  ): BufferShim {
    if (
      typeof input !== 'string' &&
      !BufferShim.isBuffer(input) &&
      !BufferShim.isBufferShim(input) &&
      (Array.isArray(input) || input instanceof Uint8Array || typeof input[Symbol.iterator] === 'function')
    ) {
      const buffer = Uint8Array.from(input as number[] | Uint8Array).buffer

      return new BufferShim(buffer)
    }

    return new BufferShim(input as string | Buffer | BufferShim | ArrayBuffer | SharedArrayBuffer, encoding as BufferEncoding)
  }
}

/** Global function for ignoring NodeJS env in class BufferShim.
 * @param {boolean} [ignore] - Sets the global value; if no boolean is passed, it will return the current setting.
 * @returns {boolean}
 */
export function ignoreNode (ignore?: boolean): boolean {
  if (typeof ignore === 'boolean') {
    IGNORE_NODE = ignore
  }

  return IGNORE_NODE
}
