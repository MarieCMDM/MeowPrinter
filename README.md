# Node-Catprinter
Library to print with cat-shaped or other thermal printers that use this protocol over bluetooth 

### EXAMPLES
##### CatPrinter
```javascript
import { CatPrinter } from "cat_device."
import { BluetoothAdapter } from "ble_adapter"


const adapter = new BluetoothAdapter()
await adapter.scan('54:5d:f8:3a:24:de', 30000)

const printer = new CatPrinter(adapter)

await printer.printImage('./assets/catprinter.jpg')
await printer.printText('Some text here, some other will go in new line')
await printer.disconnect()

```