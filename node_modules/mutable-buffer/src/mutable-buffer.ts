const DEFAULT_INITIAL_SIZE = 1024;
const DEFAULT_BLOCK_SIZE = 1024;

export class MutableBuffer {
  protected _initialSize: number;
  protected _blockSize: number;
  protected _size: number;
  protected _buffer: Buffer;

  get size() {
    return this._size;
  }

  get buffer(): Buffer {
    return this._buffer;
  }

  get nativeBuffer() {
    return this._buffer;
  }

  constructor(size?: number, blockSize?: number) {
    this._initialSize = size ?? DEFAULT_INITIAL_SIZE;
    this._blockSize = blockSize ?? DEFAULT_BLOCK_SIZE;

    this._buffer = Buffer.alloc(this._initialSize);
    this._size = 0;
  }

  //resize internal buffer if not enough size left
  _ensure(size: number) {
    const remaining = this._buffer.length - this._size;
    if (remaining < size) {
      const factor = Math.ceil((size - remaining) / this._blockSize);

      const oldBuffer = this._buffer;
      this._buffer = Buffer.alloc(oldBuffer.length + this._blockSize * factor);
      oldBuffer.copy(this._buffer);
    }
  }

  capacity() {
    return this._buffer.length;
  }

  clear() {
    this._size = 0;
  }

  join() {
    return this._buffer.slice(0, this._size);
  }

  flush() {
    const result = this.join();
    this.clear();
    return result;
  }

  write(data: any, encoding?: BufferEncoding) {
    if (Buffer.isBuffer(data)) {
      this._ensure(data.length);
      data.copy(this._buffer, this._size);
      this._size += data.length;
    } else if (Array.isArray(data)) {
      this._ensure(data.length);
      for (let i = 0; i < data.length; i++) {
        this._buffer[this._size + i] = data[i];
      }
      this._size += data.length;
    } else if (data?.buffer && data.size) {
      this._ensure(data.size);
      data.buffer.copy(this._buffer, this._size);
      this._size += data.size;
    } else {
      data = data + '';
      const len = Buffer.byteLength(data, encoding);
      this._ensure(len);
      this._buffer.write(data, this._size, len, encoding);
      this._size += len;
    }
    return this;
  }

  writeCString(data?: string | Buffer, encoding?: BufferEncoding) {
    //just write a 0 for empty or null strings
    if (!data) {
      this._ensure(1);
    } else if (Buffer.isBuffer(data)) {
      this._ensure(data.length);
      data.copy(this._buffer, this._size);
      this._size += data.length;
    } else {
      const len = Buffer.byteLength(data, encoding);
      this._ensure(len + 1); //+1 for null terminator
      this._buffer.write(data, this._size, len, encoding);
      this._size += len;
    }

    this._buffer[this._size++] = 0; // null terminator
    return this;
  }

  writeChar(c: string) {
    this._ensure(1);
    this._buffer.write(c, this._size, 1);
    this._size++;
    return this;
  }

  writeUIntLE(value: number, byteLength: number) {
    this._ensure(byteLength >>> 0);
    this._size = this._buffer.writeUIntLE(value, this._size, byteLength);
    return this;
  }

  writeUIntBE(value: number, byteLength: number) {
    this._ensure(byteLength >>> 0);
    this._size = this._buffer.writeUIntBE(value, this._size, byteLength);
    return this;
  }

  writeUInt8(value: number) {
    this._ensure(1);
    this._size = this._buffer.writeUInt8(value, this._size);
    return this;
  }

  writeUInt16LE(value: number) {
    this._ensure(2);
    this._size = this._buffer.writeUInt16LE(value, this._size);
    return this;
  }

  writeUInt16BE(value: number) {
    this._ensure(2);
    this._size = this._buffer.writeUInt16BE(value, this._size);
    return this;
  }

  writeUInt32LE(value: number) {
    this._ensure(4);
    this._size = this._buffer.writeUInt32LE(value, this._size);
    return this;
  }

  writeUInt32BE(value: number) {
    this._ensure(4);
    this._size = this._buffer.writeUInt32BE(value, this._size);
    return this;
  }

  writeIntLE(value: number, byteLength: number) {
    this._ensure(byteLength >>> 0);
    this._size = this._buffer.writeIntLE(value, this._size, byteLength);
    return this;
  }

  writeIntBE(value: number, byteLength: number) {
    this._ensure(byteLength >>> 0);
    this._size = this._buffer.writeIntBE(value, this._size, byteLength);
    return this;
  }

  writeInt8(value: number) {
    this._ensure(1);
    this._size = this._buffer.writeInt8(value, this._size);
    return this;
  }

  writeInt16LE(value: number) {
    this._ensure(2);
    this._size = this._buffer.writeInt16LE(value, this._size);
    return this;
  }

  writeInt16BE(value: number) {
    this._ensure(2);
    this._size = this._buffer.writeInt16BE(value, this._size);
    return this;
  }

  writeInt32LE(value: number) {
    this._ensure(4);
    this._size = this._buffer.writeInt32LE(value, this._size);
    return this;
  }

  writeInt32BE(value: number) {
    this._ensure(4);
    this._size = this._buffer.writeInt32BE(value, this._size);
    return this;
  }

  writeFloatLE(value: number) {
    this._ensure(4);
    this._size = this._buffer.writeFloatLE(value, this._size);
    return this;
  }

  writeFloatBE(value: number) {
    this._ensure(4);
    this._size = this._buffer.writeFloatBE(value, this._size);
    return this;
  }

  writeDoubleLE(value: number) {
    this._ensure(8);
    this._size = this._buffer.writeDoubleLE(value, this._size);
    return this;
  }

  writeDoubleBE(value: number) {
    this._ensure(8);
    this._size = this._buffer.writeDoubleBE(value, this._size);
    return this;
  }

  trim() {
    if (this.size <= 0) {
      return this;
    }

    let begin = 0;
    let end = 0;

    for (let i = 0; i < this.size; i++) {
      if (this._buffer[i]) {
        begin = i;
        break;
      }
    }

    for (let i = this.size; i > 0; i--) {
      if (this._buffer[i - 1]) {
        end = i;
        break;
      }
    }

    if (begin === 0 && end === this.size) {
      return this;
    }

    this._buffer = this._buffer.slice(begin, end);
    this._size = end - begin;
    return this;
  }

  trimLeft() {
    if (this.size <= 0 || this._buffer[0]) {
      return this;
    }

    for (let i = 0; i < this.size; i++) {
      if (this._buffer[i]) {
        this._buffer = this._buffer.slice(i);
        this._size = this.size - i;
        return this;
      }
    }
    if (this.size > 0) {
      this._size = 0;
    }
    return this;
  }

  trimRight() {
    if (this.size <= 0 || this._buffer[this.size - 1]) {
      return this;
    }

    for (let i = this.size; i > 0; i--) {
      if (this._buffer[i - 1]) {
        this._buffer = this._buffer.slice(0, i);
        this._size = i;
        return this;
      }
    }

    if (this.size > 0) {
      this._size = 0;
    }
    return this;
  }
}
