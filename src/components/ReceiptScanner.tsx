import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";
import { parseReceipt } from "../utils/receiptParser"; //Import the new logic

interface ReceiptScannerProps {
  onScanComplete?: (amount: number) => void;
}

export default function ReceiptScanner({onScanComplete}: ReceiptScannerProps) {
  const [image, setImage] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<{total: number | null; rawText: string} | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
      setScannedData(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const handleScan = async () => {
    if (!image) return;

    setLoading(true);
    

    try {
      const result = await Tesseract.recognize(image, "eng");
      const parsed = parseReceipt(result.data.text);
      setScannedData(parsed);
    } catch (error) {
      console.error("Scanning failed: ", error);
      alert("Failed to scan receipt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800">
      <h3 className="text-lg font-bold mb-4 dark:text-white">Scan Receipt</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {previewURL && (
        <div className="mt-4">
          <img
            src={previewURL}
            alt="Receipt Preview"
            className="max-h-64 rounded shadow-md mx-auto"
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className={`mt-4 w-full py-2 px-4 rounded text-white font-bold transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Scanning..." : "Process Receipt"}
          </button>
        </div>
      )}

      {scannedData && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="font-bold text-green-800 dark:text-green-300 mb-2">Scan Results</h4>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 dark:text-gray-300">Detected Total:</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {scannedData.total ? `$${scannedData.total.toFixed(2)}` : 'Not found'}
            </span>
          </div>

          {scannedData.total && onScanComplete && (
            <button
              onClick={() => onScanComplete(scannedData.total!)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
            >
              Use This Amount
            </button>
          )}

          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Show Raw Text</summary>
            <pre className="mt-2 text-[10px] text-gray-500 whitespace-pre-wrap h-24 overflow-y-auto bg-gray-100 p-2 rounded">
              {scannedData.rawText}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
