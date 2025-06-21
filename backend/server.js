const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors());

// Rate Limiter Configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Multer Configuration with File Validation
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter,
});

// API Route for OCR
app.post('/api/upload', limiter, upload.single('receipt'), async (req, res) => {
  console.log('Received file upload request...');
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng', { logger: m => console.log(m) });
    console.log('OCR Result:\n', text);

// THE FIX IS HERE: This new regex accounts for optional currency symbols
    const amountRegex = /(?:total|amount)\s*:?\s*(?:rs\.?|[$€£])?\s*([\d,]+\.?\d*)/i;    const match = text.match(amountRegex);

    if (match && match[1]) {
      const detectedAmount = match[1].replace(/,/g, '');
      console.log(`Amount detected: ${detectedAmount}`);
      return res.json({ success: true, amount: detectedAmount, fullText: text });
    } else {
      console.log('Could not find a valid amount in the OCR text.');
      return res.json({ success: false, message: 'Could not detect a valid amount from the receipt.', fullText: text });
    }
  } catch (error) {
    console.error('Error during OCR processing:', error);
    res.status(500).json({ success: false, message: 'Server error during OCR processing.' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});