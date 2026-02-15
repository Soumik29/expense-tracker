# Receipt Scanner Implementation Guide (WIP)

## Project Goal
To implement a privacy-focused, client-side receipt scanner that allows users to photograph a receipt and automatically extract the total amount using Optical Character Recognition (OCR)

Chosen Approach: "From Scratch" using `Tesseract.js`.
- Pros: Free, offline-capable, keeps data local (privacy).
- Cons: Requires custom logic to clean up messy text.

## Prerequisites:
Installation:
We are using `tesseract.js`, a pure JavaScript port of the popular Tesseract OCR engine.
```Bash
    npm install tesseract.js
```
## Key Concepts Learned
During the implementation, several web dev concepts were covered:
 1. File Access:
    - Input files are accessed via event.target.files
    - Even if multiple is not set, this is always a FileList (array-like), so we access the first item with .files?.[0]
    - Security Note: The `acccept="image/*"` attribute is just a UI hint. Real validation must happen on the backend.
 2. Image Previews (Object URLs):
    - Browsers cannot display a raw File object directly in an <img> tag.
    - We use URL.createObjectURL(file) to create a temporary blob URL (e.g., blob:http://localhost...)
    - Memory Management: These URLs stay in memory until the page closes. We must manually release them using URL.revokeObjectURL() inside a useEffect cleanup function to prevent memory leaks.
 3. OCR Process:
    - OCR is computationally heavy and asynchronous.
    - Tesseract downloads language data (like eng.traineddata) on the first run.
    - The output is "unstructured" text-it reads everything (logos, headers, footers) without knowing what is important.
## Current Implementation
File: src/components/REceiptScanner.tsx

This component handles file selection, preview, and raw text extraction.
```Typescript
import { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

export default function ReceiptScanner() {
  // State for the selected file and its preview URL
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State for the extraction process
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');

  // 1. Handle File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file); // Create temp URL
      setPreviewUrl(url);
    }
  };

  // 2. Cleanup Memory (Object URLs)
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 3. Process Image with Tesseract
  const handleScan = async () => {
    if (!image) return;
    
    setLoading(true);
    setRawText('');

    try {
      const result = await Tesseract.recognize(
        image, 
        'eng', 
        { logger: (m) => console.log(m) } // Logs progress (0-100%)
      );
      
      setRawText(result.data.text);
    } catch (error) {
      console.error("Scanning failed:", error);
      alert("Failed to scan receipt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-4 dark:text-white">Scan Receipt 🧾</h3>
      
      {/* Input Field */}
      <input 
        type="file" 
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {/* Preview & Action Area */}
      {previewUrl && (
        <div className="mt-4">
          <img src={previewUrl} alt="Receipt Preview" className="max-h-64 rounded shadow-md mx-auto" />
          
          <button 
            onClick={handleScan}
            disabled={loading}
            className={`mt-4 w-full py-2 px-4 rounded text-white font-bold transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Scanning...' : 'Process Receipt'}
          </button>
        </div>
      )}

      {/* Debug Output */}
      {rawText && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-auto max-h-40 border border-gray-200 dark:border-gray-700">
          <p className="font-bold text-gray-500 mb-1">Raw Output:</p>
          <pre className="whitespace-pre-wrap dark:text-gray-300">{rawText}</pre>
        </div>
      )}
    </div>
  );
}
```
## Next Steps (To Do)
We are currently at the stage where we have messy raw text.
- Current Challenge: The OCR returns a giant block of text containing unrelated info (addresses, phone numbers, "Thank You" messages).
- Next Action: We need to implement Regular Expressions (Regex) to search this text for specific patterns (like prices) to extract the final "Total Amount". 