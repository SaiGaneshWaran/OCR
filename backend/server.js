const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');

const app = express();

// 1. Middleware
// Enable CORS for all routes to allow requests from our React frontend
app.use(cors());

// Configure multer for file uploads. We'll use memoryStorage to handle files as buffers.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 2. The API Route for OCR
// This endpoint will handle a POST request with a single file upload named 'receipt'
app.post('/api/upload', upload.single('receipt'), async (req, res) => {
  console.log('Received file upload request...');

  // Basic check to ensure a file was uploaded
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    // Tesseract.js recognizes text from the image buffer
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'eng', // Language
      { logger: m => console.log(m) } // Optional logger to see progress in the console
    );

    console.log('OCR Result:\n', text);

    // 3. Regex to find a monetary amount (e.g., Rs. 1,500.00, Amount 1500, 1500.00)
    // This is the core logic. It's flexible to catch different formats.
    const amountRegex = /(?:total|amount|rs\.?)\s*([\d,]+\.?\d{2}?)/i;
    const match = text.match(amountRegex);

    if (match && match[1]) {
      // The amount is in the first capturing group (match[1])
      const detectedAmount = match[1].replace(/,/g, ''); // Remove commas
      console.log(`Amount detected: ${detectedAmount}`);
      return res.json({
        success: true,
        amount: detectedAmount,
        fullText: text, // Send back the full text for debugging/display
      });
    } else {
      console.log('Could not find a valid amount in the OCR text.');
      return res.json({
        success: false,
        message: 'Could not detect a valid amount from the receipt.',
        fullText: text,
      });
    }
  } catch (error) {
    console.error('Error during OCR processing:', error);
    res.status(500).json({ success: false, message: 'Server error during OCR processing.' });
  }
});

// 4. Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});