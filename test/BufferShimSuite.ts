import 'mocha'
import { BufferShim, ignoreNode } from '../index'
import { strictEqual, throws } from 'assert'
import { randomBytes } from 'crypto'

describe('BufferShim', () => {
  it('should encode and decode strings', () => {
    const ascii = 'To infinity and beyond!'
    const unicode = 'I ♡ Wisconsin! 今日は ð Ķ'
    const base64 = 'VG8gaW5maW5pdHkgYW5kIGJleW9uZCE='
    const hex = 'ac7e891e3b041a6149204b836e29cb4f'

    ignoreNode(true)

    strictEqual(BufferShim.isNodeEnv, false)
    strictEqual(BufferShim.from(ascii).toString(), Buffer.from(ascii).toString())
    strictEqual(BufferShim.from(ascii, 'ascii').toString('utf8'), Buffer.from(ascii, 'ascii').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'ascii').toString('utf-8'), Buffer.from(ascii, 'ascii').toString('utf-8'))
    strictEqual(BufferShim.from(ascii, 'ascii').toString('ascii'), Buffer.from(ascii, 'ascii').toString('ascii'))
    strictEqual(BufferShim.from(ascii, 'hex').toString('utf8'), Buffer.from(ascii, 'hex').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'binary').toString('utf8'), Buffer.from(ascii, 'binary').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'utf8').toString('base64'), Buffer.from(ascii, 'utf8').toString('base64'))
    strictEqual(BufferShim.from('T', 'utf8').toString('base64'), Buffer.from('T', 'utf8').toString('base64'))
    strictEqual(BufferShim.from(unicode, 'utf8').toString('utf8'), Buffer.from(unicode, 'utf8').toString('utf8'))
    strictEqual(BufferShim.from(unicode, 'ucs2').toString('ucs2'), Buffer.from(unicode, 'ucs2').toString('ucs2'))
    strictEqual(BufferShim.from(unicode, 'ucs2').toString('ucs-2'), Buffer.from(unicode, 'ucs2').toString('ucs-2'))
    strictEqual(BufferShim.from(base64, 'base64').toString('utf8'), Buffer.from(base64, 'base64').toString('utf8'))
    strictEqual(BufferShim.from('VA==', 'base64').toString('utf8'), Buffer.from('VA==', 'base64').toString('utf8'))
    strictEqual(BufferShim.from(hex, 'hex').toString('hex'), Buffer.from(hex, 'hex').toString('hex'))
    strictEqual(BufferShim.from(hex, 'hex').toString('binary'), Buffer.from(hex, 'hex').toString('binary'))
    strictEqual(BufferShim.from(hex, 'hex').toString('latin1'), Buffer.from(hex, 'hex').toString('latin1'))

    throws(() => {
      BufferShim.from('', 'nope' as BufferEncoding)
    })

    ignoreNode(false)

    strictEqual(BufferShim.from(ascii).toString(), Buffer.from(ascii).toString())
    strictEqual(BufferShim.from(ascii, 'ascii').toString('utf8'), Buffer.from(ascii, 'ascii').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'hex').toString('utf8'), Buffer.from(ascii, 'hex').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'binary').toString('utf8'), Buffer.from(ascii, 'binary').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'utf8').toString('base64'), Buffer.from(ascii, 'utf8').toString('base64'))
    strictEqual(BufferShim.from(unicode, 'utf8').toString('utf8'), Buffer.from(unicode, 'utf8').toString('utf8'))
    strictEqual(BufferShim.from(unicode, 'ucs2').toString('ucs2'), Buffer.from(unicode, 'ucs2').toString('ucs2'))
    strictEqual(BufferShim.from(base64, 'base64').toString('utf8'), Buffer.from(base64, 'base64').toString('utf8'))
    strictEqual(BufferShim.from(hex, 'hex').toString('hex'), Buffer.from(hex, 'hex').toString('hex'))
    strictEqual(BufferShim.from(hex, 'hex').toString('binary'), Buffer.from(hex, 'hex').toString('binary'))
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
