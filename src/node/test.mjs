import Jimp from 'jimp'
import bmp from '@wokwi/bmp-ts'
import * as fs from 'fs'

        const image = await Jimp.read('./assets/catprinter.jpg');
        image.resize(384, Jimp.AUTO)
        const bmpData = {
          data: await image.getBufferAsync(Jimp.MIME_JPEG), // Buffer
          bitPP: 1, 
          width: 384, // Number
          height: image.bitmap.height// Number
        };
        
        // Compression is not supported
        const rawData = bmp.encode(bmpData);
        fs.writeFileSync('./image.bmp', rawData.data);