// import noble from "@abandonware/noble";
import * as ble from 'node-ble'
import { commandsPrintImg } from "./commands";
// import { CatImage } from "./image";
import Image from './img';
import debug_lib, {Debugger} from 'debug';

const POSSIBLE_SERVICE_UUIDS = [
    '0000ae30-0000-1000-8000-00805f9b34fb',
    '0000af30-0000-1000-8000-00805f9b34fb',
]

// const PRINT_CHARACTERISTIC = "0000AE01-0000-1000-8000-00805F9B34FB"
// const NOTIFY_CHARACTERISTIC = "0000AE02-0000-1000-8000-00805F9B34FB"
const PRINT_CHARACTERISTIC = "0000ae01-0000-1000-8000-00805f9b34fb"
const NOTIFY_CHARACTERISTIC = "0000ae02-0000-1000-8000-00805f9b34fb"

// Wait time after sending each chunk of data through BLE.
const WAIT_AFTER_EACH_CHUNK_MS = 2

// This is a hacky solution so we don't terminate the BLE connection to the printer
// while it's still printing. A better solution is to subscribe to the RX characteristic
// and listen for printer events, so we know exactly when the printing is finished.
const WAIT_AFTER_DATA_SENT_MS = 30000
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
                            console.log(char)
                            const print_char = await srv.getCharacteristic(char)
                            if (char == NOTIFY_CHARACTERISTIC) {
                                notify_characteristic = print_char
                            }
                            if (char == PRINT_CHARACTERISTIC) {
                                console.log(await print_char.getFlags())
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
        // let img: CatImage = await CatImage.loadFromPath(image_path)
        // let data = commandsPrintImg(img, dark_mode=dark_mode)
        // await img.save()
        // return await this.write(data)
        const image = await Image.load(image_path)
        let data = commandsPrintImg(image, dark_mode=dark_mode)
        return await this.write(data)
    }

    // public async sendText(text: string): Promise<void> {
    //     let img: CatImage = await CatImage.drawText(text)
    //     let data = commandsPrintImg(img, true)
    //     await img.save()
    //     return await this.write(data)
    // }

    public async disconnect(): Promise<void> {
        await this.device?.disconnect()
        this.debugger(`⏳ Disconnecting from the printer...`)
        destroy()
        return
    }

    private async write(data: Buffer): Promise<void> {
        const chunk_size = 20//this.device!.mtu! - 3
        this.debugger(`⏳ Sending ${data.length} bytes of data in chunks of ${chunk_size} bytes...`)
        
        for (const chunk of (this.chunkify(data, chunk_size))) {
            // this.debugger(`⏳ Sending chunk`)
            this.print_characteristic!.writeValueWithoutResponse(Buffer.from(chunk))
            await sleep(WAIT_AFTER_EACH_CHUNK_MS)
        }

        this.debugger(`✅ Done. Waiting ${WAIT_AFTER_DATA_SENT_MS}s before disconnecting...`)
        await sleep(WAIT_AFTER_DATA_SENT_MS)

        return
    }

    private chunkify(data: Buffer, chunk_size: number): Buffer[] {
        const chunks: Buffer[] = []
        for (let i = 0; i < data.length; i += chunk_size) {
            chunks.push(data.subarray(i, i + chunk_size))
        }
        return chunks
    }
}
