import { Adapter } from "@node-escpos/adapter";
import noble from "@abandonware/noble";
import { TextEncoder } from "util";
import { resolve } from "path";
// // @ts-ignore
// const noble = new Noble({ extended: false });
export interface Device {
  peripheral: noble.Peripheral
  characteristic: noble.Characteristic
}
/**
 * Bluetooth device
 * @param {[type]} port
 * @param {[type]} options
 */
export class Bluetooth extends Adapter<[timeout?: number]> {
  private device: Device;
  private address: string;
  private constructor(address: string, devices: Device) {
    super();
    this.device = devices
    this.address = address;
  }
  static async create(address: string): Promise<Bluetooth> {
    return new Promise<Bluetooth>( (resolve, reject) => {
      noble.on('stateChange', async (state: string) => {
        if (state === 'poweredOn') {
          await noble.startScanningAsync(['18f0']);
        }
      });
  
      noble.on('discover', async (peripheral: noble.Peripheral) => {
        //!______________________________________________________________________________________________________________________________________________
        console.log('Discovered device:', peripheral.address);
        
        if( peripheral.address == '66:12:19:91:32:64') {
          //!______________________________________________________________________________________________________________________________________________
          console.log('Discovered Bluetooth printer')
          noble.stopScanning()
       
          if (peripheral.state !== 'connected') {
            try {
              await peripheral.connectAsync();
              //!______________________________________________________________________________________________________________________________________________
              console.log('Connected to device: ', peripheral)
            } catch (err) {
              //!______________________________________________________________________________________________________________________________________________
              console.error('Catched error: ', err)
              reject(err)
            }
            
            try {
              const { services, characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(['18f0'], ['2af1']);
            
              //!______________________________________________________________________________________________________________________________________________
              console.log('Discovered services: \n', services)
              console.log('Discovered characteristics: \n', characteristics)
              
              const characteristic = characteristics[0];
    
              const device = { peripheral, characteristic };
              resolve(new Bluetooth(address, device))
            } catch (err) {
              console.error(err)
              reject(err)
            }
          
          }
        }
      });
    })
  }
  /**
   * List Printers
   * @returns {[Device]}
   */
  list(): Device {
    return this.device;
  }
  // get device(): Device | null {
  //   let device = this.devices.find(d => d.peripheral.address === this.address);
  //   if (device === undefined) {
  //     device = this.devices.find(d => !d.peripheral.address);
  //   }
  //   return device || null;
  // }
  /**
   * open device
   * @param  {Function} callback
   * @return {[type]}
   */
  open(callback?: (error: Error | null) => void) {
    const device = this.device;
    if (device === null) {
      throw new Error("Bluetooth device disconnected");
    } else {
      if (device.peripheral.state !== 'connected') {
        device.peripheral.connect((error) => {
          if (callback !== undefined) {
            callback(error ? new Error(error) : null);
          }
        });
      } else if (callback !== undefined) {
        callback(null);
      }
    }
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
    device.characteristic.write(message, false, (error) => {
      if (callback) callback(error ? new Error(error) : null);
    });
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
    device.peripheral.disconnect(() => {
      if (callback) {
        callback(null, device);
      }
    });
    return this;
  }
  /**
   * read buffer from the printer
   * @param  {Function} callback
   * @return {Serial}
   */
  read(callback?: (data: Buffer) => void) {
    const device = this.device;
    if (device === null) throw new Error("Bluetooth device disconnected");
    device.characteristic.read((error, data) => {
      if (callback && !error) {
        callback(data);
      }
    })
    return this;
  }
}