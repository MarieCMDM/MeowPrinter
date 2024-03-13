import Jimp from 'jimp'
import * as fs from 'fs/promises'

export const PRINT_WIDTH = 384

async function getBitmapArray(image: Jimp): Promise<Uint8Array> {
    await fs.writeFile('bin.txt', '[')
    const bitmapArray: number[] = []
    let buf = image.bitmap.data
    let index = 0
    for (let r = 0; r < image.bitmap.height; r++) {
        for (let col = 0; col < image.bitmap.width; col++) {
            if (buf[index] > 127) {
                await fs.appendFile('bin.txt', "1, ")
                bitmapArray.push(1)
            } else {
                await fs.appendFile('bin.txt', "0, ")
                bitmapArray.push(0)
            }
            index += 4
        }
        await fs.appendFile('bin.txt', '],\n[')
    }
    return new Uint8Array(bitmapArray)
}


export class PrinterData {
    /*
     The image data to be used by `PrinterDriver`.
     Optionally give an io `file` to read PBM image data from it.
     To read the bitmap data, simply do `io` operation with attribute `data`
     */

    buffer = 4 * 1024 * 1024
    width: number    // 'Constant width'
    data_width: number    // 'Amount of data bytes per line'
    height: number    // 'Total height of bitmap data'
    data: Uint8Array    // 'Monochrome bitmap data `io`, of size `width * height // 8`'
    pages: []    // Height of every page in a `list`
    max_size: number    // 'Max size of `data`'
    max_height: number
    full: boolean    // 'Whether the data is full (i.e. have reached max size)'

    private constructor(width: number, fileBuffer: Uint8Array, max_size = 64 * 1024 * 1024) {
        this.width = width
        this.data_width = Math.floor(width / 8)
        this.height = 0
        this.max_size = max_size
        this.max_height = Math.floor(max_size / this.data_width)
        this.full = false
        this.data = fileBuffer
        this.pages = []
    }

    static async loadImage(file_path: string): Promise<PrinterData> {
        const image: Jimp = await Jimp.read(file_path)
        // Convert image to a monochrome bitmap and store in data
        await image.grayscale()
        // Resize 
        await image.resize(PRINT_WIDTH/8, Jimp.AUTO)
        // invert
        // await image.invert()
        await image.write('myimg.png')
        const binarized = await getBitmapArray(image)

        let buffer: Buffer = await image.getBufferAsync(Jimp.MIME_BMP)
        return new PrinterData(image.bitmap.width, binarized)
    }

    //   write(dataBuffer) {
    //     if (this.data.length + dataBuffer.length > this.maxSize) {
    //       this.full = true;
    //       this.data = []; // Overwrite earliest data
    //     }
    //     this.data.push(...dataBuffer);
    //     const position = this.data.length;
    //     if (!this.full) {
    //       this.height = Math.floor(position / this.dataWidth);
    //     }
    //     return position;
    //   }

    *read(length = -1) {
        let position = 0;
        while (position < this.data.length) {
            const chunkLength = length === -1 ? this.data.length : Math.min(length, this.data.length - position);
            yield this.data.slice(position, position + chunkLength);
            position += chunkLength;
        }
    }
}

// function flip(buffer: Buffer, width: number, height: number, horizontally: boolean = false, vertically: boolean = true, overwrite: boolean = false): Buffer {
//     // Flip the bitmap data
//     buffer.fill(0); // Reset buffer position
//     if (!horizontally && !vertically) {
//         return buffer;
//     }
//     const dataWidth: number = width >> 3;
//     let result0: Buffer = Buffer.alloc(dataWidth * height);
//     if (horizontally) {
//         for (let i = 0; i < height; i++) {
//             let row = Buffer.from(buffer.slice(i * dataWidth, (i + 1) * dataWidth));
//             row = row.map(reverseBits);
//             row.reverse();
//             result0.set(row, i * dataWidth);
//         }
//     } else {
//         result0 = Buffer.from(buffer);
//     }
//     let result1: Buffer = Buffer.alloc(dataWidth * height);
//     if (vertically) {
//         for (let i = 0; i < height; i++) {
//             let row = result0.slice(i * dataWidth, (i + 1) * dataWidth);
//             result1.set(row, (height - i - 1) * dataWidth);
//         }
//     } else {
//         result1 = result0;
//     }
//     if (overwrite) {
//         buffer.set(result1);
//     }
//     return result1;
// }

// function reverseBits(byte: number): number {
//     let result: number = 0;
//     for (let i = 0; i < 8; i++) {
//         result = (result << 1) | (byte & 1);
//         byte >>= 1;
//     }
//     return result;
// }