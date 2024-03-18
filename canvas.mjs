import {TextEncoder} from './dist/text_encoder.js'
import * as fs from 'fs/promises'

const image = new TextEncoder(384);
// image.newText([{path: './assets/Pacifico.ttf', name: 'Pacifico'}])

// image.addText('Hello, World', {font: 'Pacifico', font_size: 24, bold: true, alignment: 'center' })
// image.newLine()

// let imageBuffer = image.getImage();
// await fs.writeFile('myimg.png', imageBuffer.toBuffer())

// image.addText('here some italic!', {font: 'Pacifico', font_size: 16, italic: true, alignment: 'center' })
// // image.newLine()

// imageBuffer = image.getImage();
// await fs.writeFile('myimg2.png', imageBuffer.toBuffer())

// image.addText('here some long long long text to try, but not enought long', {font: 'Pacifico', font_size: 16})


// imageBuffer = image.getImage();
// await fs.writeFile('myimg3.png', imageBuffer.toBuffer())

// image.addText('and here it comes an ', {font: 'Pacifico', font_size: 16})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg4.png', imageBuffer.toBuffer())

// image.addText('here some long long long text to try, but not enought long', {font: 'Pacifico', font_size: 16})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg5.png', imageBuffer.toBuffer())


// image.addText('and here it comes an ', {font: 'Pacifico', font_size: 16})
// image.addText('here some long long long text to try, but not enought long', {font: 'Pacifico', font_size: 16})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg6.png', imageBuffer.toBuffer())

// image.addText('and here it comes an ', {font: 'Pacifico', font_size: 16})
// image.addText('here some long long long text to try, but not enought long', {font: 'Pacifico', font_size: 16})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg7.png', imageBuffer.toBuffer())

// image.addText('and here it comes an ', {font: 'Pacifico', font_size: 16})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg8.png', imageBuffer.toBuffer())

// imageBuffer = image.getImage();
// await fs.writeFile('myimg9.png', imageBuffer.toBuffer())

// image.newLine()
// image.addText('underlined', {font: 'Pacifico', font_size: 16, underline: true, alignment: 'center'})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg10.png', imageBuffer.toBuffer())

// image.newLine()
// image.addText('word', {font: 'Pacifico', font_size: 16})

// imageBuffer = image.getImage();
// await fs.writeFile('myimg11.png', imageBuffer.toBuffer())


image.loadFont({path: './assets/Pacifico.ttf', name: 'Pacifico'})
image.newText()

image.addText('Hello, World', {font: '', font_size: 24, bold: true, alignment: 'center' })
image.newLine()
image.addText('here some italic!', {font: '', font_size: 20, italic: true })
image.newLine()
image.addText('here some long long long text to try, but not enought long', {font: '', font_size: 20})
image.addText('and here it comes an ', {font: '', font_size: 20})
image.addText('underlined', {font: '', font_size: 20, underline: true})
image.addText('word', {font: 'Pacifico', font_size: 20})

let imageBuffer = image.getImage();
await fs.writeFile('myimg1.png', imageBuffer.toBuffer())

image.newText()

image.addText('Now i print an image', {font: '', font_size: 48, alignment: "center", bold: true})

imageBuffer = image.getImage();
await fs.writeFile('myimg2.png', imageBuffer.toBuffer())