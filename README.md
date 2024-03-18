# Node-Catprinter
Nodejs library to print with cat-shaped or other thermal printers that use this protocol over bluetooth 

based on [NaitLee/kitty-printer](https://github.com/NaitLee/kitty-printer) implementation ive made this repo for more general pourpose

## Install
clone this repo, then 
```bash
cd ./meowprinter
npm install
```

## API
`async printImage('path_or_url')`  

`async printText('some text here')`  

`async drawSeparator(optional? separator height)` 

`setStrenght(value)`

`setPrintingSpeed(value)`

`setAlignment(alignment)`

`getPrinterStatus()`

`retractPaper(lines)`

`feedPaper(lines)`

`disconnect()`


## EXAMPLE
```javascript
import { CatPrinter } from "cat_device."
import { BluetoothAdapter } from "ble_adapter"

const adapter = new BluetoothAdapter()
await adapter.scan('MY_MAC_ADDRESS')

const printer = new CatPrinter(adapter)

await printer.printImage('./assets/catprinter.jpg')
await printer.printText('Some text here, some other will go in new line')
await printer.disconnect()
```

