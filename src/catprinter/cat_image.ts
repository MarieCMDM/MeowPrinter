import Jimp from 'jimp'

export const PRINT_WIDTH = 384

async function getBitmapArray(image: Jimp): Promise<Uint8Array> {
    const bitmapArray = []
    let buf = image.bitmap.data
    let index = 0

    for (let r = 0; r < image.bitmap.height; r++) {
        for (let col = 0; col < image.bitmap.width; col++) {
            const luminance = (( buf[index] + buf[index + 1] + buf[index + 2] ) / 3)
            if (luminance < 127) {
                bitmapArray.push(0)
            } else {
                bitmapArray.push(1)
            }
            index += 4
        }
    }

    let bitmap = []
    for (let index = 0; index < bitmapArray.length; index += 8) {
        let binary_rep = ''
        binary_rep += String(bitmapArray[index])
        binary_rep += String(bitmapArray[index + 1])
        binary_rep += String(bitmapArray[index + 2])
        binary_rep += String(bitmapArray[index + 3])
        binary_rep += String(bitmapArray[index + 4])
        binary_rep += String(bitmapArray[index + 5])
        binary_rep += String(bitmapArray[index + 6])
        binary_rep += String(bitmapArray[index + 7])

        const byte = parseInt(binary_rep, 2)
        bitmap.push(byte)
    }

    return new Uint8Array(bitmap)
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
        const factor: number = PRINT_WIDTH / image.bitmap.width 
        // Convert image to a monochrome bitmap and store in data
        await image.grayscale()
        // Resize 
        await image.resize(PRINT_WIDTH, image.bitmap.height * factor)
        // invert
        await image.invert()
        await image.write('myimg.png')

        const binarized = await getBitmapArray(image)

        return new PrinterData(image.bitmap.width, binarized)
    }

    *read(length = -1) {
        let position = 0;
        while (position < this.data.length) {
            const chunkLength = length === -1 ? this.data.length : Math.min(length, this.data.length - position);
            yield this.data.slice(position, position + chunkLength);
            position += chunkLength;
        }
    }

    static async drawText(text: string): Promise<PrinterData> {
        const width = PRINT_WIDTH
        const backgroundColor = 0xFFFFFFFF 

        // Set font properties (you can load custom fonts as well)
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
        const textHeight = Jimp.measureTextHeight(font, text, PRINT_WIDTH)

        const image = await new Jimp(width, textHeight, backgroundColor)

        // Print the text on the image
        const x = 10
        const y = 10
        image.print(font, x, y, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT })

        const factor: number = PRINT_WIDTH / image.bitmap.width 
        await image.resize(PRINT_WIDTH, image.bitmap.height * factor)
        // invert
        await image.invert()
        await image.write('myimg.png')

        const binarized = await getBitmapArray(image)

        // Save the image to the specified output path
        // await image.writeAsync('./textimg.png')

        return new PrinterData(image.bitmap.width, binarized)
    }

}