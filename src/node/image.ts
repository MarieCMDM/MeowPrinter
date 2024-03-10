import { ImageData, createCanvas, loadImage, registerFont } from 'canvas'
import * as fs from 'fs/promises' 

export const PRINT_WIDTH = 384

export class CatImage {
    private constructor(private buff: Buffer, public imageData: ImageData) { }

    static async drawText(input: string): Promise<CatImage> {
        registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans' })
    
        const canvas = createCanvas(PRINT_WIDTH, 200)
        const ctx = canvas.getContext('2d')
        ctx.font = '12px DejaVuSans.ttf'
        ctx.fillText(input, 10, 190)
    
        const imgData: ImageData = ctx.getImageData(0, 0, PRINT_WIDTH, 200)
        const data = imgData.data
        
        for(let i = 0; i < ImageData.length; i += 4) {
            const avg = (data[i] + data[i+1] + data[i+2])
            data[i] = avg
            data[i+1] = avg
            data[i+2] = avg
        }

        ctx.putImageData(imgData, 0, 0)
        const new_imgData = ctx.getImageData(0, 0, PRINT_WIDTH, 200)
        const buff: Buffer = canvas.toBuffer()
        return new CatImage(buff, new_imgData)
    }
    
    static async loadFromPath(path: string): Promise<CatImage> {
        const myimg = await loadImage(path)
        const canvas = createCanvas(PRINT_WIDTH, 200)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(myimg, 0 , 0, PRINT_WIDTH, 200)
        
        const imgData: ImageData = ctx.getImageData(0, 0, PRINT_WIDTH, 200)
        
        const data = imgData.data
        
        for(let i = 0; i < ImageData.length; i += 4) {
            const avg = (data[i] + data[i+1] + data[i+2])
            data[i] = avg
            data[i+1] = avg
            data[i+2] = avg
        }

        ctx.putImageData(imgData, 0, 0)
        const new_imgData = ctx.getImageData(0, 0, PRINT_WIDTH, 200)
        const buff: Buffer = canvas.toBuffer()
        return new CatImage(buff, new_imgData)
    }

    public async save(): Promise<void> {
        return await fs.writeFile('./img.png', this.buff)
    }
}




