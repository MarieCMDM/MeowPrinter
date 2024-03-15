# BLUETOOTH THERMAL PRINTERS 
Library to print with thermal printers that using ESC/POS protocol o "CAT" protocol over bluetooth 

### EXAMPLES
##### CatPrinter
```javascript
import { CatPrinter } from "../dist/catprinter/cat_device.js"

const printer = new CatPrinter()
await printer.scan('54:5d:f8:3a:24:de', 30000)

await printer.printImage('./assets/catprinter.jpg')
await printer.printText('Some text here, some other will go in new line')

await printer.disconnect()
```