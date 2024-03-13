import * as ble from 'node-ble'
import { PrinterData } from "./cat_image";
import debug_lib, {Debugger} from 'debug';
import { Commander } from './cat_commands.';

import * as fs from 'fs/promises'

export interface PrinterState {
    out_of_paper: number;
    cover: number;
    overheat: number;
    low_power: number;
    pause: number;
    busy: number;
}

export enum StateFlag {
    out_of_paper = 1 << 0,
    cover = 1 << 1,
    overheat = 1 << 2,
    low_power = 1 << 3,
    pause = 1 << 4,
    busy = 0x80,
}
const {bluetooth, destroy} = ble.createBluetooth()

const sleep = (ms: number) => new Promise(accept => setTimeout(accept, ms));

export class CatPrinter extends Commander {
    public debugger: Debugger
    public device: ble.Device | undefined
    public print_characteristic: ble.GattCharacteristic | undefined
    public notify_characteristic: ble.GattCharacteristic | undefined
    private PRINT_WIDTH = 384
    private PRINT_CHARACTERISTIC = "0000ae01-0000-1000-8000-00805f9b34fb"
    private NOTIFY_CHARACTERISTIC = "0000ae02-0000-1000-8000-00805f9b34fb"
    private  WAIT_AFTER_EACH_CHUNK_MS = 20
    private  WAIT_AFTER_DATA_SENT_MS = 20000

    private constructor() {
        super()
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
                            if (char == this.NOTIFY_CHARACTERISTIC) {
                                notify_characteristic = print_char
                            }
                            if (char == this.PRINT_CHARACTERISTIC) {
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

    private  async printImage(printer_data: PrinterData): Promise<void> {
        await fs.writeFile('print.txt', '[')
        // flip(data.data, data.width, data.height, self.flip_h, self.flip_v, overwrite=True)
        await this.prepare(34, 48000)
        // TODO: consider compression on new devices
        const rows = await printer_data.read(Math.floor(this.PRINT_WIDTH / 8))
        for (let chunk of rows) {
            await fs.appendFile('print.txt', `${chunk} \n`)
            this.drawBitmap(chunk)
        }
        this.finish(100)
    }

    public async print(data: string, mode: string): Promise<void> {
        if (mode == 'text') {
            return this.printText(data)
        } else {
            const image: PrinterData = await PrinterData.loadImage(data)
            return this.printImage(image)
        }
    }


    private async printText(text: string): Promise<void> {
        //TODO
        // let img: CatImage = await CatImage.drawText(text)
        // let data = await cmd.commandsPrintImg(img, true)
        // return await this.write(data)
        return
    }

    public async disconnect(): Promise<void> {
        await sleep(this.WAIT_AFTER_DATA_SENT_MS)
        await this.device?.disconnect()
        this.debugger(`⏳ Disconnecting from the printer...`)
        destroy()
        return
    }

    async send(data: Uint8Array): Promise<void> {
        this.debugger(`⏳ Sending ${data.length} bytes of data...`)
        await this.print_characteristic!.writeValueWithoutResponse(Buffer.from(data))
        await sleep(this.WAIT_AFTER_EACH_CHUNK_MS)
        return
    }
    // async send(data: Uint8Array): Promise<void> {
    //     const chunk_size = 20
    //     this.debugger(`⏳ Sending ${data.length} bytes of data in chunks of ${chunk_size} bytes...`)
        
    //     for (const chunk of (this.chunkify(data, chunk_size))) {
    //         await this.print_characteristic!.writeValueWithoutResponse(Buffer.from(chunk))
    //         await sleep(this.WAIT_AFTER_EACH_CHUNK_MS)
    //     }
    //     // this.debugger(`✅ Done. Waiting ${WAIT_AFTER_DATA_SENT_MS}s before disconnecting...`)
    //     // await sleep(WAIT_AFTER_DATA_SENT_MS)
    //     return
    // }

    // private chunkify(data: Uint8Array, chunk_size: number): Uint8Array[] {
    //     const chunks: Uint8Array[] = []
    //     for (let i = 0; i < data.length; i += chunk_size) {
    //         chunks.push(data.slice(i, i + chunk_size))
    //     }
    //     return chunks
    // }
}
