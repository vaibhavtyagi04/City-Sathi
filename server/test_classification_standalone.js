const fs = require('fs');
const path = require('path');
const { classifyImage } = require('./utils/imageClassifier');

// Use an existing image from the project
const imagePath = path.join(__dirname, '../src/assets/report.jpg');

async function runTest() {
    console.log("Testing Image Classifier...");
    console.log(`Using image: ${imagePath}`);

    if (!fs.existsSync(imagePath)) {
        console.error("Test image not found!");
        process.exit(1);
    }

    try {
        const buffer = fs.readFileSync(imagePath);
        console.log("Image loaded, size:", buffer.length);

        console.time("Classification");
        const predictions = await classifyImage(buffer);
        console.timeEnd("Classification");

        console.log("Predictions:", JSON.stringify(predictions, null, 2));
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

runTest();
