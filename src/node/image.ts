import Jimp from 'jimp'
import * as fs from 'fs/promises'
import * as b from '../catprinter/buffers'

export const PRINT_WIDTH = 384

export class CatImage {
    private constructor(private image: Jimp, public binarized: number[]) { }

    // static async drawText(input: string): Promise<CatImage> {
    //     registerFont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', { family: 'DejaVu Sans' })

    //     const canvas = createCanvas(PRINT_WIDTH, 256)
    //     const ctx = canvas.getContext('2d')
    //     ctx.font = '12px DejaVuSans.ttf'
    //     ctx.fillText(input, 10, 190)

    //     const imgData: ImageData = ctx.getImageData(0, 0, PRINT_WIDTH, 256)
    //     const data = imgData.data

    //     for (let i = 0; i < ImageData.length; i += 4) {
    //         const avg = (data[i] + data[i + 1] + data[i + 2])
    //         data[i] = avg
    //         data[i + 1] = avg
    //         data[i + 2] = avg
    //     }

    //     ctx.putImageData(imgData, 0, 0)
    //     const new_imgData = ctx.getImageData(0, 0, PRINT_WIDTH, 256)
    //     const buff: Buffer = canvas.toBuffer()
    //     return new CatImage(buff, new_imgData)
    // }

    static async loadFromPath(path: string): Promise<CatImage> {
        const myimg: Jimp = await Jimp.read(path)
        // resize
        myimg.resize(PRINT_WIDTH, Jimp.AUTO)

        // grayscale
        await myimg.grayscale()

        // myimg.contrast(0.8)


        // await fs.writeFile('original.txt', '')
        let index = 0
        let buf = myimg.bitmap.data
        console.log("H:" + myimg.bitmap.height)
        console.log("W:" + myimg.bitmap.width)
        for (let r = 0; r < myimg.bitmap.height; r++) {
            for (let col = 0; col < myimg.bitmap.width; col++) {
                if(buf[index]>127){
                    // await fs.appendFile('original.txt', String(0))
                }else{
                    // await fs.appendFile('original.txt', String(1))
                }
                index+=4
            }
            // await fs.appendFile('original.txt', '\n')
        }
        console.log(index)

        // invert
        const inverted = await myimg.invert()

        await inverted.write('myimg.png')
        const binarized = await getBitmapArray(inverted)
        return new CatImage(myimg, binarized)
    }

    public async getRows(): Promise<number[][]> {
        await fs.writeFile('bin.txt', '')
        const rows: number[][] = []
        let index = 0
        for (let r = 0; r < this.image.bitmap.height; r++) {
            const row: number[] = []
            for (let col = 0; col < this.image.bitmap.width; col++) {
                await fs.appendFile('bin.txt', String(this.binarized[index]) + ", ")
                row.push(this.binarized[index])
                index++
            }
            await fs.appendFile('bin.txt', '],\n[')
            rows.push(row)
        }
        console.log(rows.length, rows[0].length)
        // console.log(py_img.length, py_img[0].length)
        // return rows
        return b.py_img2
    }

    public async save(): Promise<void> {
        await this.image.writeAsync('bitmap.bmp')
        return
    }
}

function getBitmapArray(image: Jimp): number[] {
    console.log(image.bitmap.data.length)

    const bitmapArray: number[] = [];
    // image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    //     // Extract the red channel value (0 or 255 for 1-bit)
    //     const redValue = image.bitmap.data[idx]
    //     const greenValue = image.bitmap.data[idx + 1]
    //     const blueValue = image.bitmap.data[idx + 2]
    //     const alphaValue = image.bitmap.data[idx + 3]
    //     const lightness = ((redValue +greenValue + blueValue + alphaValue) / 4)
    //     bitmapArray.push(lightness > 127? 1 : 0);
    //     bitmapArray.push(lightness > 127? 1 : 0);
    //     bitmapArray.push(lightness > 127? 1 : 0);
    //     bitmapArray.push(lightness > 127? 1 : 0);
    // });
    let buf = image.bitmap.data
    let index = 0
    for (let r = 0; r < image.bitmap.height; r++) {
        for (let col = 0; col < image.bitmap.width; col++) {
            if(buf[index]>127){
                bitmapArray.push(1)
            }else{
                bitmapArray.push(0)
            }
            index+=4
        }
    }
    console.log(bitmapArray.length)
    return bitmapArray
}
