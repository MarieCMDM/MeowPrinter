import * as ble from 'node-ble'
import { CatImage} from "./image";
import debug_lib, {Debugger} from 'debug';
import * as cmd from './commands';

const POSSIBLE_SERVICE_UUIDS = [
    '0000ae30-0000-1000-8000-00805f9b34fb',
    '0000af30-0000-1000-8000-00805f9b34fb',
]

const PRINT_CHARACTERISTIC = "0000ae01-0000-1000-8000-00805f9b34fb"
const NOTIFY_CHARACTERISTIC = "0000ae02-0000-1000-8000-00805f9b34fb"

// Wait time after sending each chunk of data through BLE.
const WAIT_AFTER_EACH_CHUNK_MS = 20

// This is a hacky solution so we don't terminate the BLE connection to the printer
// while it's still printing. A better solution is to subscribe to the RX characteristic
// and listen for printer events, so we know exactly when the printing is finished.
const WAIT_AFTER_DATA_SENT_MS = 20000

const {bluetooth, destroy} = ble.createBluetooth()

const sleep = (ms: number) => new Promise(accept => setTimeout(accept, ms));

export class CatPrinter {
    private debugger: Debugger
    public device: ble.Device | undefined
    public print_characteristic: ble.GattCharacteristic | undefined
    public notify_characteristic: ble.GattCharacteristic | undefined

    private constructor() {
        this.debugger = debug_lib('cat')
    }

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
                destroy()
                reject('Unable to find printer, make sure it is turned on and in range')
            }

            const t = setTimeout(on_timeout_reached, timeout)
            t

            if (! await adapter.isDiscovering()) {
                await adapter.startDiscovery()
            }

            if (address) {
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
                        this.device = device
                        this.print_characteristic = printer_characteristic
                        this.notify_characteristic = notify_characteristic
                        this.debugger(`✅ Done. Connected to ${await this.device.getAddress()}`)
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

    public async sendImage(image_path: string, dark_mode?: boolean): Promise<void> {
        let img: CatImage = await CatImage.loadFromPath(image_path)
        //!
        img.save()
        //!
        let data = await cmd.commandsPrintImg(img, dark_mode=dark_mode)
        await this.write(data)
        return
    }


    // public async sendText(text: string): Promise<void> {
    //     let img: CatImage = await CatImage.drawText(text)
    //     let data = await cmd.commandsPrintImg(img, true)
    //     return await this.write(data)
    // }

    public async disconnect(): Promise<void> {
        await this.device?.disconnect()
        this.debugger(`⏳ Disconnecting from the printer...`)
        destroy()
        return
    }

    private async write(data: number[]): Promise<void> {
        const chunk_size = 20
        this.debugger(`⏳ Sending ${data.length} bytes of data in chunks of ${chunk_size} bytes...`)
        
        for (const chunk of (this.chunkify(data, chunk_size))) {
            this.print_characteristic!.writeValueWithoutResponse(Buffer.from(chunk))
            await sleep(WAIT_AFTER_EACH_CHUNK_MS)
        }
        this.debugger(`✅ Done. Waiting ${WAIT_AFTER_DATA_SENT_MS}s before disconnecting...`)
        await sleep(WAIT_AFTER_DATA_SENT_MS)
        return
    }

    private chunkify(data: number[], chunk_size: number): number[][] {
        const chunks: number[][] = []
        for (let i = 0; i < data.length; i += chunk_size) {
            chunks.push(data.slice(i, i + chunk_size))
        }
        return chunks
    }
}
