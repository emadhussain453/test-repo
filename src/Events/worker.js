import { parentPort } from "worker_threads";
import sharp from "sharp";
import { encode } from "blurhash";

async function processImage({ bufferImage }) {
    const componentX = 6;
    const componentY = 6;
    try {
        const { data, info } = await sharp(bufferImage)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        const imageBlurhash = encode(data, info.width, info.height, componentX, componentY);
        parentPort.postMessage({ success: true, imageBlurhash });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}

// Listen for messages from the main thread
parentPort.on("message", (message) => {
    processImage(message);
});
