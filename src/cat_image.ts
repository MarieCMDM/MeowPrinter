import { createCanvas, loadImage, CanvasRenderingContext2D, Canvas, Image } from 'canvas'

export const PRINT_WIDTH = 384

export class PrinterData {
    public width: number
    public bitmap: Uint8Array

    private constructor( width: number, bitmap: Uint8Array) {
        this.width = width
        this.bitmap = bitmap
    }

    static async loadImage(source: string): Promise<PrinterData> {
        const image = await loadImage(source)
        return await this.prepareImage(image)
    }

    static async drawText(text_image: Canvas): Promise<PrinterData> {
        return await this.prepareImage(text_image)
    }

    private static async prepareImage(image: Image | Canvas): Promise<PrinterData> {
        const canvas = createCanvas(image.width, image.height)
        const ctx: CanvasRenderingContext2D = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        // Grayscale
        const grayscaleData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < grayscaleData.data.length; i += 4) {
            const luminance = ((grayscaleData.data[i] + grayscaleData.data[i + 1] + grayscaleData.data[i + 2]) / 3)
            grayscaleData.data[i] = luminance
            grayscaleData.data[i + 1] = luminance
            grayscaleData.data[i + 2] = luminance
        }
        ctx.putImageData(grayscaleData, 0, 0)

        // Resize
        const targetWidth = PRINT_WIDTH
        const scaleFactor = targetWidth / canvas.width
        const targetHeight = canvas.height * scaleFactor
        canvas.width = targetWidth
        canvas.height = targetHeight

        // Create Bitmap
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        const bitmapImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const bitmap = new Uint8Array(Math.ceil(canvas.width * canvas.height / 8))
        let index = 0
        let bitIndex = 0
        for (let i = 0; i < bitmapImageData.data.length; i += 4) {
            const average = (bitmapImageData.data[i] + bitmapImageData.data[i + 1] + bitmapImageData.data[i + 2]) / 3

            const bit = average > 127 ? 0 : 1
            bitmap[index] |= bit << (7 - bitIndex)
            bitIndex++
            if (bitIndex === 8) {
                index++
                bitIndex = 0
            }
        }
        return new PrinterData(canvas.width, bitmap)
    }

    public *read(length = -1) {
        let position = 0
        while (position < this.bitmap.length) {
            const chunkLength = length === -1 ? this.bitmap.length : Math.min(length, this.bitmap.length - position)
            yield this.bitmap.slice(position, position + chunkLength)
            position += chunkLength
        }
    }
}
