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
    strictEqual(BufferShim.from(ascii, 'ascii').toString('utf8'), Buffer.from(ascii, 'ascii').toString('UTF8' as BufferEncoding))
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

    throws(() => {
      BufferShim.from({})
    })

    ignoreNode(false)

    strictEqual(BufferShim.from(ascii).toString(), Buffer.from(ascii).toString())
    strictEqual(BufferShim.from(ascii, 'ascii').toString('utf8'), Buffer.from(ascii, 'ascii').toString('utf8'))
    strictEqual(BufferShim.from(ascii, 'hex').toString('utf8'), Buffer.from(ascii, 'hex').toString('UTF-8' as BufferEncoding))
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
    const sharedArrayBuffer = new SharedArrayBuffer(10)
    const array = Array.from(buffer)

    ignoreNode(true)

    strictEqual(BufferShim.from(arrayBuffer).toString('base64'), Buffer.from(arrayBuffer).toString('base64'))
    strictEqual(BufferShim.from(sharedArrayBuffer).toString('base64'), Buffer.from(sharedArrayBuffer).toString('base64'))
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

  it('should allocate instance by size', () => {
    const size = 10

    strictEqual(BufferShim.alloc(size).length, size)
    strictEqual(BufferShim.alloc(size, '13', 'utf8').length, size)
    strictEqual(BufferShim.allocUnsafe(size).length, size)
    strictEqual(BufferShim.allocUnsafe(size).fill('', 5, 'utf8').length, size)
    strictEqual(BufferShim.allocUnsafe(size).fill('h', 5, 6, '' as BufferEncoding).length, size)
    strictEqual(BufferShim.allocUnsafe(size).fill('hw', 5, 6, 'utf8').length, size)
    strictEqual(BufferShim.allocUnsafe(size).fill('h', 5, 6, 'binary').length, size)

    throws(() => {
      BufferShim.fill(BufferShim.allocUnsafe(42), 42, 10, 2147483648)
    })
    throws(() => {
      BufferShim.alloc(32, 'hw', 'doowop' as BufferEncoding)
    })
  })
})
