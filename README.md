# Buffer-ESM

A cross-platform, partial implementation shim of Node Buffer. Supports encoding and decoding strings.

## Usage

Install via [NPM](https://www.npmjs.com/package/buffer-esm) and require in your project. There is also an ESM export, for use with browser or Deno.

```js
const { BufferShim } = require('buffer-esm')

const buffer = BufferShim.from('These are the voyages...') // Assumes utf8 when no encoding is passed.
const firstByte = buffer[0] // 84
const base64 = buffer.toString('base64') // VGhlc2UgYXJlIHRoZSB2b3lhZ2VzLi4u
const utf8 = buffer.toString('utf8') // These are the voyages...
```
