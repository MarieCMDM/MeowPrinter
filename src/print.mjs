import { CatPrinter } from "../dist/ble.js"

const printer = new CatPrinter()

await printer.scan('54:5d:f8:3a:24:de', 30000)

// await printer.sendImage('/home/mattia/Documents/GitHub/MeowPrint/assets/catprinter.jpg', true)
await printer.sendText('some text here')

await printer.disconnect()

process.exit()

// import * as cmd from "../dist/commands.js"

// function valueToByteArray(value, bytesLength) {
//     const bytesArray = [];
//     for (let i = bytesLength - 1; i >= 0; i--) {
//         const conjunctionVal = 0xFF << (i * 8);
//         const shift = i * 8;
//         bytesArray.push((value & conjunctionVal) >> shift);
//     }
//     return bytesArray;
// }

// // Example usage:
// const myValue = 81; // Some numeric value
// const myBytes = valueToByteArray(myValue, 2); // Creates a 2-byte array

// // console.log(myBytes)
// console.log(cmd.CMD_GET_DEV_STATE)

