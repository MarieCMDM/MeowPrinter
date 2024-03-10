import { Bluetooth } from '../dist/esc_pos/bluetooth_adapter.js'
import { ThermalPrinter } from '../dist/esc_pos/esc_pos.js'
//*_________________________________________________________________________________________________________________________________________________________
const table_header = ["Descrizione", "IVA", "Prezzo"]
const table_content = [
    ["Bambino Cinese", "*ES", "1000,00"],
    ["Bambina Cinese", "*ES", "3000,00"],
    ["Adulto Cinese < 40", "*ES", "400,00"],
    ["Consegna a domicilio", "*ES", "149,99"],
    [ "", "", "--------"],
    ["Totale", "", "4549,99"]
]

//*___________________________________________________________________________________________________________________________________________________________
const adapter = await new Bluetooth('66:12:19:91:32:64');
await adapter.init()
const printer = new ThermalPrinter(adapter)
printer.printHeader(["恭喜发财", "small header"])
// printer.printTable(table_header, table_content, [0.65, 0.15, 0.20])
// await printer.printImage("./assets/logo.png")
// printer.barcode(112233445566, "EAN13", { width: 50, height: 50 })
// printer.printFooter("a footer message")
// await printer.printDemo()
printer.feed(1)
printer.cut()
printer.close()
