import { CatPrinter } from "../dist/catprinter/cat_device.js"

const printer = new CatPrinter()
await printer.scan('54:5d:f8:3a:24:de', 30000)
// await printer.scan('CC:10:24:22:F6:86', 30000)

await printer.print('./assets/catprinter.jpg', 'image')
await printer.disconnect()

process.exit()