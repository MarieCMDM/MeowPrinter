import * as ble from 'node-ble'
import debug_lib, {Debugger} from 'debug';

const PRINT_CHARACTERISTIC = "0000ae01-0000-1000-8000-00805f9b34fb"
const NOTIFY_CHARACTERISTIC = "0000ae02-0000-1000-8000-00805f9b34fb"

const {bluetooth, destroy} = ble.createBluetooth()

export class BluetoothAdapter {
    private debugger: Debugger
    public device: ble.Device | undefined
    public print_characteristic: ble.GattCharacteristic | undefined
    public notify_characteristic: ble.GattCharacteristic | undefined

    constructor() {
        this.debugger = debug_lib('ble')
    }

    /**
     * Default constructor, scan for a device by the given address or scan for a compatible devices and connect to it
     * @param address mac address of the bluetooth printer
     * @param timeout_ms scan timeout interval in milliseconds, default 10000 
     * @returns 
     */
    public async scan(address?: string, timeout_ms?: number): Promise<void> {
        let timeout: number
        let autodiscover: boolean
        let notify_characteristic: ble.GattCharacteristic
        let printer_characteristic: ble.GattCharacteristic
        timeout_ms ? timeout = timeout_ms : timeout = 10000
        address? autodiscover = true : autodiscover = false
        const adapter = await bluetooth.defaultAdapter()

        return new Promise<void>( async (resolve, reject) => {
            async function on_timeout_reached() {
                await adapter.stopDiscovery()
                reject('Unable to find printer, make sure it is turned on and in range')
            }

            const t = setTimeout(on_timeout_reached, timeout)
            t

            if (! await adapter.isDiscovering()) {
                await adapter.startDiscovery()
            }

            if (address) {
                address = address.toLowerCase()
                this.debugger(`⏳ Looking for a BLE device with address: ${address}...`)
                try {
                    const device = await adapter.waitDevice(address)
                    this.debugger('Discovered Bluetooth printer')
                    clearTimeout(t)

                    await device.connect()
                    this.debugger('Connected to device')
                    
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
                        this.debugger(`✅ Done. Connected to ${await device.getAddress()}`)
                        this.device = device
                        this.print_characteristic = printer_characteristic
                        this.notify_characteristic = notify_characteristic
                        resolve()
                    }
                } catch (err) {
                    this.debugger('Catched error: ', err)
                    destroy()
                    reject(err)
                }
            } else {
                this.debugger(`⏳ Trying to auto-discover a printer...`)
                //TODO       
            }
        })
    }

    public async destroy(): Promise<void> {
        return await destroy()
    }
}