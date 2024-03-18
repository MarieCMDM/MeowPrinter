import { PrinterData } from "./cat_image";
import debug_lib, {Debugger} from 'debug';
import { Commander } from './cat_commands';
import { TextEncoder, CustomFonts, TextOptions } from "./text_encoder";
import { BluetoothAdapter } from './ble_adapter';

export interface PrinterState {
    out_of_paper: boolean;
    cover: boolean;
    overheat: boolean;
    low_power: boolean;
    pause: boolean;
    busy: boolean;
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
    private text_encoder: TextEncoder
    private energy: number = 65500
    private speed: number = 54
    private print_width = 384
    private WAIT_AFTER_EACH_CHUNK_MS = 30
    private mtu: number = 200
    private state: PrinterState = { out_of_paper: false,
                                    cover: false,
                                    overheat: false,
                                    low_power: false,
                                    pause: false,
                                    busy: false
                                }

    constructor(ble_adapter: BluetoothAdapter) {
        super()
        if (ble_adapter.device === undefined || ble_adapter.print_characteristic === undefined) {
            throw new Error(' Ble Adapter not valid ensure you have scan for device')
        }
        
        this.adapter = ble_adapter
        this.debugger = debug_lib('cat')
        this.text_encoder = new TextEncoder(this.print_width)

        this.adapter.notify_characteristic?.startNotifications()
        this.adapter.notify_characteristic?.on('valuechanged', (buffer) => {
            this.updateStatus(buffer)
        })
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
    public async printText(): Promise<void> {
        const image: PrinterData = await PrinterData.drawText(this.text_encoder.getImage())
        return this.print(image)
    }

    /**
     * Draw a line
     * @param thick thickness in px of the line
     * @returns 
     */
    public async drawSeparator(thick?: number): Promise<void> {
        let line_thick: number
        thick ? line_thick = thick : line_thick = 1 
        const line: Uint8Array = new Uint8Array(48)
        line.fill(255, 0, 47)
        await this.prepare()
        while (line_thick > 0) {
            await this.drawBitmap(line)
            line_thick--
        }
        await this.finish(1)
        return
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
     * @param value number  >= 4 default 34
     */
    public setPrintingSpeed(value: number): void {
        this.speed = value
    }

    /**
     * get device Status
     * @returns PrinterState
     */
    public getPrinterStatus(): PrinterState {
        return this.state
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

    public newText(fonts?: CustomFonts[]): void { 
        this.text_encoder.newText(fonts)
    }

    public addText(text: string, options: TextOptions): void {
        this.text_encoder.addText(text, options)
    }

    public newLine(): void {
        this.text_encoder.newLine()
    }

    public loadFont(font: CustomFonts): void {
        this.text_encoder.loadFont(font)
    }

    /**
     * it will be private
     * send the protocol composed message to the printer slicing it in chunks of mtu lenght if needed
     * @param data the commad message to send
     * @returns 
     */
    protected async send(data: Uint8Array): Promise<void> {
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
        this.finish(1)
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

    private updateStatus(data: Buffer) {
        const state = data[6]
        this.state = {
            out_of_paper: (state & StateFlag.out_of_paper) == 0 ? false : true,
            cover: (state & StateFlag.cover) == 0 ? false : true,
            overheat: (state & StateFlag.overheat) == 0 ? false : true,
            low_power: (state & StateFlag.low_power) == 0 ? false : true,
            pause: (state & StateFlag.pause) == 0 ? false : true,
            busy: (state & StateFlag.busy) == 0 ? false : true
        }

        console.log(this.state)
    }
}