import { PrinterData } from "./cat_image";
import debug_lib, {Debugger} from 'debug';
import { Commander } from './cat_commands.';
import { BluetoothAdapter } from './ble_adapter';

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

const sleep = (ms: number) => new Promise(accept => setTimeout(accept, ms));

export class CatPrinter extends Commander {
    private debugger: Debugger
    private adapter: BluetoothAdapter
    private font_size: number = 32
    private energy: number = 65500
    private speed: number = 34
    private print_width = 384
    private WAIT_AFTER_EACH_CHUNK_MS = 20
    private mtu: number = 200

    constructor(ble_adapter: BluetoothAdapter) {
        super()
        if (ble_adapter.device === undefined || ble_adapter.print_characteristic === undefined) {
            throw new Error(' Ble Adapter not valid ensure you have scan for device')
        }
        this.adapter = ble_adapter
        this.debugger = debug_lib('cat')
    }

    /**
     * Print an image loaded from local path or remote url
     * @param path location in filesystem or remote url
     * @returns 
     */
    public async printImage(path: string): Promise<void> {
        const image: PrinterData = await PrinterData.loadImage(path)
        return this.print(image)
    }

    /**
     * Print text whith default font size, to change font size use setFontSize()
     * currently only one font is supported
     * @param text the text to print 
     * @returns 
     */
    public async printText(text: string): Promise<void> {
        const image: PrinterData = await PrinterData.drawText(text, this.font_size)
        return this.print(image)
    }

    /**
     * Set the 'ink' strenght or how much dark the print will be
     * @param value number from 1 to 65500 higher is darker default 65500
     */
    public setStrenght(value: number): void {
        this.energy = value
    }

    /**
     * Set feed/retract speed hight speed can cause low quality,
     * lower is the value quicker will be the feeding
     * @param value number  >= 4 default 30
     */
    public setPrintingSpeed(value: number): void {
        this.speed = value
    }

    /**
     * Disconnect from the bluetooth printer
     * @returns 
     */
    public async disconnect(): Promise<void> {
        //TODO await to finisch print before disconnect 
        await this.adapter.device?.disconnect()
        this.debugger(`⏳ Disconnecting from the printer...`)
        this.adapter.destroy()
        return
    }

    /**
     * it will be private
     * send the protocol composed message to the printer slicing it in chunks of mtu lenght if needed
     * @param data the commad message to send
     * @returns 
     */
    async send(data: Uint8Array): Promise<void> {
        this.debugger(`⏳ Sending ${data.length} bytes of data in chunks of ${this.mtu} bytes...`)
        for (const chunk of this.chunkify(data)) {
                await this.adapter.print_characteristic!.writeValueWithoutResponse(Buffer.from(chunk))
                await sleep(this.WAIT_AFTER_EACH_CHUNK_MS)
            }
        return
    }  

    /**
     * execute the printing stack 
     * @param printer_data the data to print
     */
    private async print(printer_data: PrinterData): Promise<void> {
        await this.prepare()
        // TODO: consider compression on new devices
        const rows = await printer_data.read(Math.floor(this.print_width / 8))
        for (let row of rows) {
            this.drawBitmap(row)
        }
        this.finish(100)
    }

    /**
     * Create an array of parts of messages to send to the printer messages longher than devices' mtu will not be processed by the printer
     * @param data 
     * @returns 
     */
    private chunkify(data: Uint8Array): Uint8Array[] {
        const chunks: Uint8Array[] = []
        for (let i = 0; i < data.length; i += this.mtu) {
            chunks.push(data.slice(i, i + this.mtu))
        }
        return chunks
    }

    /**
     * Stack messages needde before sending printerData
     */
    private async prepare() {
        await this.getDeviceState()
        await this.setDpi()
        await this.setSpeed(this.speed)
        await this.setEnergy(this.energy)
        await this.applyEnergy()
        await this.updateDevice()
        await this.startLattice()
    }

    /**
     * Stack messages needed after sending printerData
     */
    private async finish(extra_feed: number) {
        await this.endLattice()
        await this.setSpeed(8)
        await this.feedPaper(extra_feed)
        await this.getDeviceState()
    }
}
