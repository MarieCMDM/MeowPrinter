import { Adapter } from "@node-escpos/adapter";
import * as ble from 'node-ble'
import { TextEncoder } from "util";

const PRINT_CHARACTERISTIC = '0x2af1'

export interface Device {
  peripheral: ble.Device
  characteristic: ble.GattCharacteristic
}

/**
 * Bluetooth device
 * @param {[type]} port
 * @param {[type]} options
 */
export class Bluetooth extends Adapter<[timeout?: number]> {
  private devices: Device[] = []
  private address: string;

  constructor(address: string, options: any) {
    super();
    this.address = address;
  }

  async init(): Promise<void> {
    const {bluetooth, destroy} = ble.createBluetooth()
    const adapter = await bluetooth.defaultAdapter()
    let printer_characteristic: ble.GattCharacteristic

    return new Promise<void>( async (resolve, reject) => {
      async function on_timeout_reached() {
          await adapter.stopDiscovery()
          destroy()
          reject('Unable to find printer, make sure it is turned on and in range')
      }

      const t = setTimeout(on_timeout_reached, 10000)
      t

      if (! await adapter.isDiscovering()) {
          await adapter.startDiscovery()
      }

      try {
          const device = await adapter.waitDevice(this.address)
          clearTimeout(t)

          await device.connect()
          
          const gattServer = await device.gatt()
          const services = await gattServer.services()

          for (let service of services) {
              let srv = await gattServer.getPrimaryService(service)
              let chars = await srv.characteristics()

              for (let char of chars) {
                console.log(char)
                  const print_char = await srv.getCharacteristic(char)
                  if (char == PRINT_CHARACTERISTIC) {
                      printer_characteristic = print_char
                  }
              }
          }
              
          if (printer_characteristic != undefined) {
              this.devices.push({peripheral: device, characteristic: printer_characteristic})
              resolve()
          }
      } catch (err) {
          destroy()
          reject(err)
      }
    })
  }

  /**
   * List Printers
   * @returns {[Device]}
   */
  list() {
    return this.devices;
  }

  get device(): Device | null {
    // let device = this.devices.find(d => await d.peripheral.getAddress() === this.address);
    // if (device === undefined) {
    //   device = this.devices.find(d => !d.peripheral.address);
    // }
    return this.devices[0] || null;
  }

  /**
   * open device
   * @param  {Function} callback
   * @return {[type]}
   */
  open(callback?: (error: Error | null) => void) {
    // const device = this.device;
    // if (device === null)
    //   throw new Error("Bluetooth device disconnected");
    // else {
    //   if (device.peripheral.state !== 'connected') {
    //     device.peripheral.connect((error) => {
    //       if (callback !== undefined) {
    //         callback(error ? new Error(error) : null);
    //       }
    //     });
    //   } else if (callback !== undefined) {
    //     callback(null);
    //   }
    // }
    return this;
  }

  /**
   * write data to bluetooth device
   * @param  {[type]}   data      [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  write(data: Buffer | string, callback?: (error: Error | null) => void) {
    const device = this.device;
    if (device === null) throw new Error("Bluetooth device disconnected");
    const message = typeof data === 'string' ? Buffer.from(new TextEncoder().encode(data).buffer) : data;
    device.characteristic.writeValueWithoutResponse(message)
    return this;
  }

  /**
   * close device
   * @param  {Function} callback  [description]
   * @param  {int}      timeout   [allow manual timeout for emulated COM ports (bluetooth, ...)]
   * @return {[type]} [description]
   */
  close(callback?: (error: Error | null, device: Device) => void, timeout = 0) {
    const device = this.device;
    if (device === null) return this;

    device.peripheral.disconnect()
    return this;
  }

  /**
   * read buffer from the printer
   * @param  {Function} callback
   * @return {Serial}
   */
  read(callback?: (data: Buffer) => void) {
  //   const device = this.device;
  //   if (device === null) throw new Error("Bluetooth device disconnected");
  //   device.characteristic.read((error, data) => {
  //     if (callback && !error) {
  //       callback(data);
  //     }
  //   })
    return this;
  }
}