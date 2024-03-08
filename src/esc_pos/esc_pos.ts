import Network from "@node-escpos/network-adapter/index";
import { Bluetooth } from "./bluetooth_adapter";
import { CustomTableItem, Image, Printer } from "@node-escpos/core";

export class ThermalPrinter extends Printer<[]> {
    constructor(adapter: Network|Bluetooth, options?: {encoding: string}) {
        const device = adapter
        try {
            device.open()
        } catch (err) {
            throw new Error(`Error: ${err}`)
        } 
        let encoding_options: {}
        (options) ? encoding_options = options : encoding_options = { encoding: "GB18030" }
        super(device, encoding_options)
    }
    public printHeader(header: string|string[]): void {
        this.align("ct")
        this.size(2, 3)
        if (typeof header === 'string') {
            this.text(header)
        } else {
            header.forEach( (line, index) => {
                if (index >= 1) {
                    this.size(1, 2)
                }
                this.text(line)
            })
        }
        this.feed(1)
        this._restoreDefaults()
    }
    public printFooter(footer: string): void {
        this.feed(1)
        this.align("ct")
        this.size(1, 1)
        this.text(footer)
        this._restoreDefaults()
    }
    public async printImage(path: string): Promise<void> {
        const image = await Image.load(path);
        this.align("ct")
        await this.image(image, "d24")
    }
    public printTable(header: string[], content: string[][], colums_percentage_width: number[]): void {
        const custom_table_header: CustomTableItem[] = []
        header.forEach( (elem, index) => {
            custom_table_header.push({ text: elem, align: "LEFT", width: colums_percentage_width[index], style: "B" })
        })
        this.tableCustom(custom_table_header)
        this.drawLine()
        
        content.forEach( (row) => {
            const customtable: CustomTableItem[] = []
            row.forEach( (elem, index) => {
                if (index == 0) {
                    customtable.push({ text: elem, align: "LEFT", width: colums_percentage_width[index], style: "B" })
                } else if (index == row.length - 1) {
                    customtable.push({ text: elem, align: "RIGHT", width: colums_percentage_width[index] })
                } else {
                    customtable.push({ text: elem, align: "LEFT", width: colums_percentage_width[index] })
                }
            })
            this.tableCustom(customtable)
        })
    }
    public async printDemo(): Promise<void> {
        this
            .font("a")
            this.align("ct")
            this.style("bu")
            this.size(1, 1)
            this.text("May the gold fill your pocket")
            this.text("恭喜发财")
            this.barcode(112233445566, "EAN13", { width: 50, height: 50 })
            this.table(["One", "Two", "Three"])
            this.tableCustom(
            [
                { text: "Left", align: "LEFT", width: 0.33, style: "B" },
                { text: "Center", align: "CENTER", width: 0.33 },
                { text: "Right", align: "RIGHT", width: 0.33 },
            ],
            { encoding: "cp857", size: [1, 1] }, // Optional
            )
    
            // inject qrimage to printer
            await this.qrimage("https://github.com/node-escpos/driver")
            this._restoreDefaults()
            this.cut()
    }
   
    private _restoreDefaults(): void {
        this.align("lt")
        this.size(1, 1)
    }
}