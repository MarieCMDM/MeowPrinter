import { CatPrinter } from "./dist/catprinter/cat_device.js"
import { BluetoothAdapter } from "./dist/catprinter/ble_adapter.js"

const adapter = new BluetoothAdapter()
await adapter.scan('54:5d:f8:3a:24:de', 30000)

const printer = new CatPrinter(adapter)

await printer.printImage('./assets/catprinter.jpg')
await printer.printText('Some text here, some other will go in new line')
await printer.disconnect()

process.exit()