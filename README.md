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
print the image from the given path or url

`async printText()`  
print the text after newText() has ben created

`newText(fonts:? CustomFonts[])`  
create new textarea to print optionally can be loades some customfonts

`addText(text: string, options: TextOptions)`  
add text to the textarea with the given TextOptions

`newLine()`  
goes new line in the textarea

`loadFont(font: CustomFonts)`  
load a custom font

`async drawSeparator(optional? separator height)`   
draw a line optionalli can be specified the line deept
 
`setStrenght(value)`  
set the strength of the printing

`setPrintingSpeed(value)`  
set the printing speed

`getPrinterStatus()`  
get the printer status

`retractPaper(lines)`  
retract the paper by the given amount

`feedPaper(lines)`  
feed the papaer by the given amount

`disconnect()`  
disconnect from the ble device


## EXAMPLE
```javascript
import { CatPrinter } from "cat_device."
import { BluetoothAdapter } from "ble_adapter"


const adapter = new BluetoothAdapter()

const isonprinter = new CatPrinter(await adapter.scan('MY_MAC_ADDRESS', 30000))

const printer = new CatPrinter(adapter)

await printer.printImage('./assets/catprinter.jpg')
printer.newText()
printer.addText('Hello, World', {font: '', font_size: 24, bold: true, alignment: 'center' })
printer.newLine()
await printer.printText()
await printer.disconnect()
```

