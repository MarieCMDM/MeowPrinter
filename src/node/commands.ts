import { CatImage } from "./image"

export function toUnsignedByte(val: number): number {
    // Converts a byte in signed representation to unsigned. Assumes val is encoded in two's complement
    return val >= 0 ? val : val & 0xff;
}

export function byteConverter(lst: number[]): number[] {
    /*
    This is an utility function that transforms a list of unsigned bytes (in two's complement)
    into an unsigned bytearray.

    The reason it exists is that in Java (where these commands were reverse engineered from), bytes
    are signed. Instead of manually converting them, let the computer do it for us, so it's easier
    to debug and extend it with new reverse engineered commands.
    */
    const unsigned: number[] = []
    lst.map( (elm) => {
        unsigned.push(toUnsignedByte(elm))
    })
    return unsigned
}

export const PRINT_WIDTH = 384

export const CMD_GET_DEV_STATE: number[] = byteConverter([81, 120, -93, 0, 1, 0, 0, 0, -1])

export const CMD_SET_QUALITY_200_DPI: number[] = byteConverter([81, 120, -92, 0, 1, 0, 50, -98, -1])

export const CMD_GET_DEV_INFO: number[] = byteConverter([81, 120, -88, 0, 1, 0, 0, 0, -1])

export const CMD_LATTICE_START: number[] = byteConverter([81, 120, -90, 0, 11, 0, -86, 85, 23, 56, 68, 95, 95, 95, 68, 56, 44, -95, -1])

export const CMD_LATTICE_END: number[] = byteConverter([81, 120, -90, 0, 11, 0, -86, 85, 23, 0, 0, 0, 0, 0, 0, 0, 23, 17, -1])

export const CMD_SET_PAPER: number[] = byteConverter([81, 120, -95, 0, 2, 0, 48, 0, -7, -1])

export const CMD_PRINT_IMG: number[] = byteConverter([81, 120, -66, 0, 1, 0, 0, 0, -1])

export const CMD_PRINT_TEXT: number[] = byteConverter([81, 120, -66, 0, 1, 0, 1, 7, -1])

export const CHECKSUM_TABLE: number[] = byteConverter([
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

export function calculateCksm(bytes_array: number[], start: number, end: number): number {
    let checksum = 0
    for (let index = start; index < start + end; index++) {
        checksum = CHECKSUM_TABLE[(checksum ^ bytes_array[index]) & 0xff]
    }
    return checksum
}

export function commandFeedPaper(lines: number): number[] {
    const feed_lines = Number(lines.toString(16)) 
    const bytes_array = byteConverter([81, 120, -67, 0, 1, 0, feed_lines, 0, 0xff])
    bytes_array[7] = calculateCksm(bytes_array, 6, 1)
    return bytes_array
}

export function commandSetEnergy(energy: number): number[] {
    const bytes_array = byteConverter([81, 120, -81, 0, 2, 0, ((energy >> 8) & 0xff), energy & 0xff, 0, 0xff])
    bytes_array[7] = calculateCksm(bytes_array, 6, 2)
    return bytes_array 
}

export async function commandPrintRow(img_row: number[]): Promise<number[]> {
    // Try to use run-length compression on the image data.
    let encoded_img = runLengthEncode(img_row)
    let bytes_array: number[]

    // If the resulting compression takes more than PRINT_WIDTH // 8, it means
    // it's not worth it. So we fallback to a simpler, fixed-length encoding.
    if (encoded_img.length > PRINT_WIDTH / 8) {
        encoded_img = byteEncode(img_row)
        bytes_array = byteConverter([81, 120, -94, 0, encoded_img.length, 0, ...encoded_img, 0, 0xff])

        bytes_array[bytes_array.length -2] = calculateCksm(bytes_array, 6, encoded_img.length)

        return bytes_array
    }
    // Build the run-length encoded image command.
    bytes_array = byteConverter([81, 120, -65, 0, encoded_img.length, 0].concat(encoded_img.concat([0, 0xff])))
    bytes_array[-2] = calculateCksm(bytes_array, 6, encoded_img.length) 
    return bytes_array
}


export async function commandsPrintImg(img: CatImage, dark_mode?: boolean): Promise<number[]> {
    let PRINTER_MODE 
    if (dark_mode == true) {
        PRINTER_MODE = CMD_PRINT_TEXT
    } else {
        PRINTER_MODE = CMD_PRINT_IMG
    } 

    let data = CMD_GET_DEV_STATE.concat(CMD_SET_QUALITY_200_DPI, CMD_LATTICE_START)
    let image_rows: number[][] = await img.getRows()
    for (let row of image_rows) {
        let command_print_row = await commandPrintRow(row)
        data = data.concat(command_print_row)
    }
    data = data.concat(commandFeedPaper(25), CMD_SET_PAPER, CMD_SET_PAPER, CMD_SET_PAPER, CMD_LATTICE_END, CMD_GET_DEV_STATE)

    return data
}

function encodeRunLengthRepetition(n: number, val: number): number[] {
    let res: number[] = [];
    while (n > 0x7f) {
        res.push(0x7f | (val << 7));
        n -= 0x7f;
    }
    if (n > 0) {
        res.push((val << 7) | n);
    }
    return res;
}

function runLengthEncode(imgRow: number[]): number[] {
    let res: number[] = [];
    let count: number = 0;
    let lastVal: number = -1;
    for (let val of imgRow) {
        if (val === lastVal) {
            count += 1;
        } else {
            res.push(...encodeRunLengthRepetition(count, lastVal));
            count = 1;
        }
        lastVal = val;
    }
    if (count > 0) {
        res.push(...encodeRunLengthRepetition(count, lastVal));
    }
    return res;
}

function byteEncode(imgRow: number[]): number[] {
    function bitEncode(chunkStart: number, bitIndex: number): number {
        return imgRow[chunkStart + bitIndex] ? 1 << bitIndex : 0;
    }

    let res: number[] = [];
    for (let chunkStart = 0; chunkStart < imgRow.length; chunkStart += 8) {
        let byte: number = 0;
        for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
            byte |= bitEncode(chunkStart, bitIndex);
        }
        res.push(byte);
    }
    return res;
}
