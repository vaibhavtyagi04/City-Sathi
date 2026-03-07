const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

// Polyfill fetch for tfjs/mobilenet model loading
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

let model;

/**
 * Load the MobileNet model.
 */
const loadModel = async () => {
    if (!model) {
        console.log("Loading MobileNet model...");
        try {
            // Force CPU backend since we are in Node
            await tf.setBackend('cpu');
            await tf.ready();

            model = await mobilenet.load({ version: 2, alpha: 1.0 });
            console.log("MobileNet model loaded successfully");
        } catch (error) {
            console.error("Failed to load MobileNet model:", error);
            throw error;
        }
    }
    return model;
};

/**
 * Convert Image Buffer to 3D Tensor
 */
const imageToTensor = (buffer) => {
    let raw;
    let width, height, data;

    // Try JPEG first
    try {
        raw = jpeg.decode(buffer, { useTArray: true });
        width = raw.width;
        height = raw.height;
        data = raw.data;
    } catch (e) {
        // Not JPEG
    }

    // Try PNG if not JPEG
    if (!raw) {
        try {
            const png = PNG.sync.read(buffer);
            width = png.width;
            height = png.height;
            data = png.data;
        } catch (e) {
            throw new Error("Unsupported image format. Only JPEG and PNG are supported.");
        }
    }

    // Create a buffer for the RGB values (dropping Alpha)
    // data is [R, G, B, A, R, G, B, A, ...]
    const values = new Int32Array(width * height * 3);
    let offset = 0;
    for (let i = 0; i < width * height * 4; i += 4) {
        values[offset] = data[i];     // R
        values[offset + 1] = data[i + 1]; // G
        values[offset + 2] = data[i + 2]; // B
        offset += 3;
    }

    // Create tensor
    const tensor = tf.tensor3d(values, [height, width, 3]);
    return tensor;
};

/**
 * Classify an image buffer.
 */
const classifyImage = async (imageBuffer) => {
    try {
        const net = await loadModel();

        const tfImage = imageToTensor(imageBuffer);

        const predictions = await net.classify(tfImage);

        tfImage.dispose();

        return predictions;
    } catch (error) {
        console.error("Image classification error:", error);
        throw error;
    }
};

module.exports = { classifyImage };
