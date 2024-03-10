import { Image, createCanvas, loadImage, registerFont } from 'canvas'
import * as fs from 'fs/promises' 

const PRINT_WIDTH = 384

export class CatImage {
    private constructor(public buff: Buffer, private img: Image) { }

    // static async drawText(input: string): Promise<CatImage> {
    //     registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans' })
    
    //     const canvas = createCanvas(PRINT_WIDTH, 200)
    //     const ctx = canvas.getContext('2d')
    //     ctx.font = '30px DejaVuSans.ttf'
    //     ctx.fillText(input, 10, 190)
    
    //     const buff: Buffer = canvas.toBuffer("image/png")
    //     return new CatImage(buff, img)
    // }
    
    static async loadFromPath(path: string): Promise<CatImage> {
        const myimg = await loadImage(path)
        const canvas = createCanvas(PRINT_WIDTH, 200)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(myimg, 0 , 0, PRINT_WIDTH, 200)
        
        const imgData = ctx.getImageData(0, 0, PRINT_WIDTH, 200)
        const data = imgData.data

        const bin_image = []

        for (let i = 0; i < data.length; i += 4) {
            const isWhite = data[i] === 255 && data[i+1] === 255 && data[i+2] === 255
            bin_image.push(isWhite ? 0 : 1)
        //     const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        //     data[i] = avg // red
        //     data[i + 1] = avg // green
        //     data[i + 2] = avg // blue
        }
        // ctx.putImageData(imgData, 0, 0)

        // const buff: Buffer = canvas.toBuffer()
        // const img: Image = await loadImage(buff)
        // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // const data = imageData.data;
        // for (let i = 0; i < data.length; i += 4) {
        //     const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        //     data[i] = avg // red
        //     data[i + 1] = avg // green
        //     data[i + 2] = avg // blue
        // }
        // ctx.putImageData(imageData, 0, 0)

        const buff = Buffer.from(bin_image)

        await fs.writeFile('test.png', buff)

        return new CatImage(buff, myimg)
    }

    public getRows(): Buffer[] {
        const rows: Buffer[] = []
        let pixel: number = 0
        let img_lenght = this.buff.length / PRINT_WIDTH 
        for (let line = 0; line < img_lenght; line += 1) {
            rows.push(this.buff.subarray(pixel, pixel + PRINT_WIDTH))
            pixel += PRINT_WIDTH
        } 
        return rows
    }

    public async save(): Promise<void> {
        return await fs.writeFile('./img.png', this.buff)
    }

    public async resize() {

    }
}




