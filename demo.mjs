import { CatPrinter } from "./dist/cat_device.js"
import { BluetoothAdapter } from "./dist/ble_adapter.js"

const adapter = new BluetoothAdapter()

const printer = new CatPrinter(await adapter.scan('54:5d:f8:3a:24:de', 30000))
// const myprinter = new CatPrinter(await adapter.scan('cc:10:24:22:f6:86', 30000))

// for (let printer of [isonprinter, myprinter]) {
    // printer.loadFont({path: './assets/Pacifico.ttf', name: 'Pacifico'})
    printer.newText()

    printer.addText('Hello, World', {font: '', font_size: 24, bold: true, alignment: 'center' })
    printer.newLine()
    printer.addText('qua stampo del corsivo!', {font: '', font_size: 20, italic: true })
    printer.newLine()
    printer.addText('qua stampo del testo lungo per mostrare che va a capo da solo', {font: '', font_size: 20})
    printer.addText('e ora sto per scrivere una parola', {font: '', font_size: 20})
    printer.addText('sottolineata', {font: '', font_size: 20, underline: true})
    printer.addText('e anche quello funziona', {font: 'Pacifico', font_size: 20})

    await printer.printText()

    printer.newText()

    printer.addText('Ora Stampo un immagine', {font: '', font_size: 48, alignment: "center", bold: true})

    await printer.printText()

    await printer.printImage('./assets/catprinter.jpg')

    await printer.feedPaper(150)
    await printer.feedPaper(150)

    await printer.disconnect()
// }

process.exit()