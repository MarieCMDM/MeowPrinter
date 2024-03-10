import { CatImage } from "./image"

export function toUnsignedByte(val: number): number {
    // Converts a byte in signed representation to unsigned. Assumes val is encoded in two's complement
    if (val >= 0) {
        return val
    } else {
        return val & 0xff
    }
}

export function byteConverter(lst: number[]): Buffer {
    /*
    This is an utility function that transforms a list of unsigned bytes (in two's complement)
    into an unsigned bytearray.

    The reason it exists is that in Java (where these commands were reverse engineered from), bytes
    are signed. Instead of manually converting them, let the computer do it for us, so it's easier
    to debug and extend it with new reverse engineered commands.
    */
    const unsigned: number[] = []
    lst.map( (elm) => {
        // console.log('pre: ', elm)
        unsigned.push(toUnsignedByte(elm))
        // console.log('post: ', elm)
    })
    // cmd_debugger(`created unsigned: ${unsigned} from ${lst}`)
    // cmd_debugger(`created buffer: ${Buffer.from(unsigned)} from ${unsigned}`)
    return Buffer.from(unsigned)
}

export const PRINT_WIDTH = 384

export const CMD_GET_DEV_STATE: Buffer = byteConverter([81, 120, -93, 0, 1, 0, 0, 0, -1])

export const CMD_SET_QUALITY_200_DPI: Buffer = byteConverter([81, 120, -92, 0, 1, 0, 50, -98, -1])

export const CMD_GET_DEV_INFO: Buffer = byteConverter([81, 120, -88, 0, 1, 0, 0, 0, -1])

export const CMD_LATTICE_START: Buffer = byteConverter([81, 120, -90, 0, 11, 0, -86, 85, 23, 56, 68, 95, 95, 95, 68, 56, 44, -95, -1])

export const CMD_LATTICE_END: Buffer = byteConverter([81, 120, -90, 0, 11, 0, -86, 85, 23, 0, 0, 0, 0, 0, 0, 0, 23, 17, -1])

export const CMD_SET_PAPER: Buffer = byteConverter([81, 120, -95, 0, 2, 0, 48, 0, -7, -1])

export const CMD_PRINT_IMG: Buffer = byteConverter([81, 120, -66, 0, 1, 0, 0, 0, -1])

export const CMD_PRINT_TEXT: Buffer = byteConverter([81, 120, -66, 0, 1, 0, 1, 7, -1])

export const CHECKSUM_TABLE: Buffer = byteConverter([
    0, 7, 14, 9, 28, 27, 18, 21, 56, 63, 54, 49, 36, 35, 42, 45, 112, 119, 126, 121,
    108, 107, 98, 101, 72, 79, 70, 65, 84, 83, 90, 93, -32, -25, -18, -23, -4, -5,
    -14, -11, -40, -33, -42, -47, -60, -61, -54, -51, -112, -105, -98, -103, -116,
    -117, -126, -123, -88, -81, -90, -95, -76, -77, -70, -67, -57, -64, -55, -50,
    -37, -36, -43, -46, -1, -8, -15, -10, -29, -28, -19, -22, -73, -80, -71, -66,
    -85, -84, -91, -94, -113, -120, -127, -122, -109, -108, -99, -102, 39, 32, 41,
    46, 59, 60, 53, 50, 31, 24, 17, 22, 3, 4, 13, 10, 87, 80, 89, 94, 75, 76, 69, 66,
    111, 104, 97, 102, 115, 116, 125, 122, -119, -114, -121, -128, -107, -110, -101,
    -100, -79, -74, -65, -72, -83, -86, -93, -92, -7, -2, -9, -16, -27, -30, -21, -20,
    -63, -58, -49, -56, -35, -38, -45, -44, 105, 110, 103, 96, 117, 114, 123, 124, 81,
    86, 95, 88, 77, 74, 67, 68, 25, 30, 23, 16, 5, 2, 11, 12, 33, 38, 47, 40, 61, 58,
    51, 52, 78, 73, 64, 71, 82, 85, 92, 91, 118, 113, 120, 127, 106, 109, 100, 99, 62,
    57, 48, 55, 34, 37, 44, 43, 6, 1, 8, 15, 26, 29, 20, 19, -82, -87, -96, -89, -78,
    -75, -68, -69, -106, -111, -104, -97, -118, -115, -124, -125, -34, -39, -48, -41,
    -62, -59, -52, -53, -26, -31, -24, -17, -6, -3, -12, -13,
])

export function calculateCksm(bytes_array: Buffer, start: number, end: number): number {
    let checksum = 0
    const range = (start + end) - start
    for (let index = 0; index < range; index++) {
        checksum = CHECKSUM_TABLE[(checksum ^ bytes_array[index]) & 0xff]
    }
    return checksum
}

export function commandFeedPaper(lines: number): Buffer {
    const feed_lines = Number(lines.toString(16)) 
    const bytes_array = byteConverter([81, 120, -67, 0, 1, 0, feed_lines, 0, 0xff])
    bytes_array[7] = calculateCksm(bytes_array, 6, 1)
    return bytes_array
}

export function commandSetEnergy(energy: number): Buffer {
    const bytes_array = byteConverter([81, 120, -81, 0, 2, 0, ((energy >> 8) & 0xff), energy & 0xff, 0, 0xff])
    bytes_array[7] = calculateCksm(bytes_array, 6, 2)
    return bytes_array 
}

export function commandPrintRow(img_row: Buffer): Buffer {
    let bytes_array: Buffer
    // const img_len = img_row.length

    // bytes_array = Buffer.concat([byteConverter([81, 120, -94, 0, img_len, 0]), img_row, byteConverter([0, 0xff])])
    // bytes_array[-2] = calculateCksm(bytes_array, 6, img_len)
    // return bytes_array
    let line = []
    for (let i = 0; i<384; i++) {
        line.push(1)
    }

    bytes_array = Buffer.concat([byteConverter([81, 120, -94, 0, 384, 0]), byteConverter(line), byteConverter([0, 0xff])])
    bytes_array[-2] = calculateCksm(bytes_array, 6, 384)
    return bytes_array
}


export function commandsPrintImg(img: CatImage, dark_mode?: boolean): Buffer {

    let PRINTER_MODE 
    if (dark_mode == true) {
        PRINTER_MODE = CMD_PRINT_TEXT
    } else {
        PRINTER_MODE = CMD_PRINT_IMG
    } 
    let data = Buffer.concat([CMD_GET_DEV_STATE, CMD_SET_QUALITY_200_DPI, CMD_LATTICE_START])
    
    let image_rows: Buffer[] = img.getRows()

    // for (let row of image_rows) {
    //     data = Buffer.concat([data, commandPrintRow(row)])
    // }
    // console.log(commandPrintRow(image_rows[0]))
    // for ( let i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]) {
    //     data = Buffer.concat([data, commandPrintRow(image_rows[0])])
    // }

    data = Buffer.concat([data, commandFeedPaper(25), CMD_SET_PAPER, CMD_SET_PAPER, CMD_SET_PAPER, CMD_LATTICE_END, CMD_GET_DEV_STATE])
    // console.log(data)
    return data
}


// export function byte_encode(img_row: number[]) {
//     function bit_encode(chunk_start: number, bit_index: number) {
//         if (img_row[chunk_start + bit_index] != 0) {
//             return 1
//         } else {
//             return 0
//         }
//     }

//     let res: number[] = []
//     for (let chunk_start = 0; chunk_start < img_row.length; chunk_start += 8) {
//         let byte: number = 0
//         for (let bit_index in [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
//             byte |= bit_encode(chunk_start, Number(bit_index))
//         }
//         res.push(byte)
//     }
//     return res
// }
