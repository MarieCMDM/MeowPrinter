import * as ble from 'node-ble'

const PRINT_CHARACTERISTIC = "0000ae01-0000-1000-8000-00805f9b34fb"
const NOTIFY_CHARACTERISTIC = "0000ae02-0000-1000-8000-00805f9b34fb"

const {bluetooth, destroy} = ble.createBluetooth()

const adapter = await bluetooth.defaultAdapter()

if (! await adapter.isDiscovering()) {
    await adapter.startDiscovery()
}

const compatible_devices = []

const devices = await adapter.devices()
console.log(`⏳ Looking for a BLE s`)
try {
    devices.forEach( async (address) => {
        const device = await adapter.waitDevice(address)
        console.log(`Discovered Bluetooth devic ${address}`)
        try {
            await device.connect()
            console.log('Connected to device')
        
            const gattServer = await device.gatt()
            const services = await gattServer.services()

            for (let service of services) {
                let srv = await gattServer.getPrimaryService(service)
                let chars = await srv.characteristics()

                for (let char of chars) {
                    const print_char = await srv.getCharacteristic(char)
                    if (char == NOTIFY_CHARACTERISTIC) {
                        notify_characteristic = print_char
                    }
                    if (char == PRINT_CHARACTERISTIC) {
                        printer_characteristic = print_char
                    }
                }
            }
                
            if (((printer_characteristic != undefined) && (notify_characteristic != undefined))) {
                console.log(`✅ Done. Connected to ${await device.getAddress()}`)
                // this.device = device
                // this.print_characteristic = printer_characteristic
                // this.notify_characteristic = notify_characteristic
                // resolve()
            } else {
                console.log('Not the valid device')
            }
        } catch (err) {
        }
    })
        
        
} catch (err) {
    console.log('Catched error: ', err)
    destroy()
    // reject(err)
}