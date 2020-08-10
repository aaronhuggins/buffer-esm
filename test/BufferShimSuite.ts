import 'mocha'
import { BufferShim, ignoreNode } from '../index'
import { strictEqual, throws } from 'assert'
import { randomBytes } from 'crypto'

describe('BufferShim', () => {
  it('should encode and decode strings', () => {
    const ascii = 'The quick brown fox jumps over the lazy dog.'
    const unicode = 'I ♡ Wisconsin! 今日は'
    const base64 = 'VGhlc2UgYXJlIHRoZSB2b3lhZ2VzLi4u'
    const hex = 'ac7e891e3b041a6149204b836e29cb4f'

    ignoreNode(true)

    strictEqual(BufferShim.isNodeEnv, false)
    strictEqual(BufferShim.from(ascii).toString(), Buffer.from(ascii).toString())
    strictEqual(BufferShim.from(ascii, 'ascii').toString('utf8'), Buffer.from(ascii, 'ascii').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'hex').toString('utf8'), Buffer.from(ascii, 'hex').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'binary').toString('utf8'), Buffer.from(ascii, 'binary').toString('utf8'))
    strictEqual(BufferShim.from(unicode, 'utf8').toString('utf8'), Buffer.from(unicode, 'utf8').toString('utf8'))
    strictEqual(BufferShim.from(unicode, 'ucs2').toString('ucs2'), Buffer.from(unicode, 'ucs2').toString('ucs2'))
    strictEqual(BufferShim.from(base64, 'base64').toString('utf8'), Buffer.from(base64, 'base64').toString('utf8'))
    strictEqual(BufferShim.from(hex, 'hex').toString('hex'), Buffer.from(hex, 'hex').toString('hex'))
    strictEqual(BufferShim.from(hex, 'hex').toString('binary'), Buffer.from(hex, 'hex').toString('binary'))

    throws(() => {
      BufferShim.from('', 'nope' as BufferEncoding)
    })

    ignoreNode(false)
  })

  it('should encode and decode buffers', () => {
    const buffer = randomBytes(16)
    const arrayBuffer = BufferShim.toArrayBuffer(buffer)
    const array = Array.from(buffer)

    ignoreNode(true)

    strictEqual(BufferShim.from(arrayBuffer).toString('base64'), Buffer.from(arrayBuffer).toString('base64'))
    strictEqual(BufferShim.from(array).toString('base64'), Buffer.from(array).toString('base64'))

    ignoreNode(false)

    strictEqual(BufferShim.from(buffer).toString('base64'), Buffer.from(buffer).toString('base64'))
  })

  it('should convert instance to other types', () => {
    const ignore = ignoreNode()

    strictEqual(ignore, false)

    const bufferShim = BufferShim.from([0])

    strictEqual(bufferShim.toUint8Array() instanceof Uint8Array, true)
    strictEqual(bufferShim.toBuffer() instanceof Buffer, true)

    ignoreNode(true)

    strictEqual(bufferShim.toBuffer() instanceof BufferShim, true)
  })
})
