import Jimp from 'jimp'
import { Font } from '@jimp/plugin-print'

export const PRINT_WIDTH = 384

/**
 * compress the bitmap of the given image in a decical notation
 * @param image Jimp image to print
 * @returns 
 */
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
    public width: number = 384 
    public data_width: number
    public data: Uint8Array

    private constructor(fileBuffer: Uint8Array) {
        this.data_width = Math.floor(this.width / 8)
        this.data = fileBuffer
    }

    /**
     * load an image from path or remote url
     * @param source file path or remote url
     * @param optional //TODO 
     * @returns 
     */
    static async loadImage(source: string, optional?: {}): Promise<PrinterData> {
        const image: Jimp = await Jimp.read(source)
        return new PrinterData(await this.prepareImage(image))
    }

     /**
     * create a new image containing the given text, ot will automatically go newline 
     * @param text the text to print
     * @param font_size size of the font
     * @param optional //TODO 
     * @returns 
     */
    static async drawText(text: string, font_size:number, optional?: {}): Promise<PrinterData> {    
        const font: Font = await this.getFontBySize(font_size)
        const width = PRINT_WIDTH
        const backgroundColor = 0xFFFFFFFF 
        const lineHeight = Jimp.measureTextHeight(font, "H", PRINT_WIDTH)
        const textHeight = Jimp.measureTextHeight(font, text, PRINT_WIDTH) + lineHeight
        const image = await new Jimp(width, textHeight, backgroundColor)
        image.print(font, 0, 0, { text, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP }, PRINT_WIDTH)
        return new PrinterData(await this.prepareImage(image))
    }

    /**
     * load the correct font by the given size
     * @param size size in px of the font
     * @returns 
     */
    private static async getFontBySize(size: number): Promise<Font> {
        if (size <= 8) {
            return await Jimp.loadFont(Jimp.FONT_SANS_8_BLACK)
        } else if (size <= 10) {
            return await Jimp.loadFont(Jimp.FONT_SANS_10_BLACK)
        } else if (size <= 12) {
            return await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK)
        } else if (size <= 14) {
            return await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK)
        } else if (size <= 16) {
            return await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK)
        } else if (size <= 32) {
            return await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
        } else if (size <= 64) {
            return await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
        } else {
            return await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK)
        } 
    }

    /**
     * prepare th image to be printed, it will grayscale it, resize in a printer accettable dimension
     * and invert the colors, than it will calculate the bitmap 
     * @param image Jimp image 
     * @returns 
     */
    private static async prepareImage(image: Jimp): Promise<Uint8Array> {
        const factor: number = PRINT_WIDTH / image.bitmap.width 
        await image.resize(PRINT_WIDTH, image.bitmap.height * factor)
        await image.invert()
        return await getBitmapArray(image)
    }

    /**
     * return the bitmap data of the image in ammissible evices packege lenght slices
     * @param length 
     */
    public *read(length = -1) {
        let position = 0;
        while (position < this.data.length) {
            const chunkLength = length === -1 ? this.data.length : Math.min(length, this.data.length - position);
            yield this.data.slice(position, position + chunkLength);
            position += chunkLength;
        }
    }
}