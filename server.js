import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, isValid, format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

// Set up EJS for rendering HTML
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve the homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { default: Lens } = await import('chrome-lens-ocr');
        const lens = new Lens();

        const result = await lens.scanByFile(req.file.path);
        
        // Extract just the text from each segment
        const extractedText = result.segments.map(segment => segment.text).join(' ');

        // Check for expiry date
        const expirationDate = extractExpirationDate(extractedText);

        // Render the result page with the extracted text and expiration date
        res.render('result', { result: extractedText, expirationDate: expirationDate || "not found" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Function to extract expiry date from text
function extractExpirationDate(text) {
    // Regex to match common date formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
    const dateRegex = /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{2,4}[\/-]\d{1,2}[\/-]\d{1,2})\b/g;
    const matches = text.match(dateRegex);

    if (matches) {
        // Return the first valid date found
        return matches[0]; // Return the first match or further processing as needed
    }
    return null; // Return null if no valid expiration date is found
}

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
