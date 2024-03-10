import * as ble from 'node-ble'

let address = 'CC:10:24:22:F6:86'
let PrinterCharacteristic = "0000ae01-0000-1000-8000-00805f9b34fb"

const sleep = (ms) => new Promise(accept => setTimeout(accept, ms));

async function drawTestPattern(){
    const {bluetooth, destroy} = ble.createBluetooth()

    const adapter = await bluetooth.defaultAdapter()

    if (! await adapter.isDiscovering()) {
        await adapter.startDiscovery()
    }

    const device = await adapter.waitDevice(address)
    await device.connect()

    console.log('connected')
    
    const gattServer = await device.gatt()
    const services = await gattServer.services()

    let printer_characteristic

    for (let service of services) {
        let srv = await gattServer.getPrimaryService(service)
        let chars = await srv.characteristics()

        for (let char of chars) {
            const print_char = await srv.getCharacteristic(char)
            if (char == PrinterCharacteristic) {
                printer_characteristic = print_char
                console.log('find char: ', char)
            }
        }
    }

    console.log('writing')
    // # Set energy used to a moderate level
    await printer_characteristic.writeValueWithoutResponse(Buffer.from(formatMessage(SetEnergy, [0x10, 0x00]))) 
    // # Set print quality to high
    await printer_characteristic.writeValueWithoutResponse(Buffer.from(formatMessage(SetQuality, [5])))
    // # Set mode to image mode
    await printer_characteristic.writeValueWithoutResponse(Buffer.from(formatMessage(DrawingMode, [0])))

    for (let i = 0; i<100; i++) {
        // # Draw Test pattern line
        await printer_characteristic.writeValueWithoutResponse(Buffer.from(formatMessage(0xA2, [ 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ])))
        // # Advance one step
        await printer_characteristic.writeValueWithoutResponse(Buffer.from(formatMessage(FeedPaper, [0, 1])))
    }

    // # Feed extra paper for image to be visible
    await printer_characteristic.writeValueWithoutResponse(Buffer.from(formatMessage(FeedPaper, [0x70, 0x00])))

    await device.disconnect()
    destroy()
    process.exit()
}

await drawTestPattern()