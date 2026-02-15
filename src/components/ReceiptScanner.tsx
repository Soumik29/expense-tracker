import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";

export default function ReceiptScanner() {
  const [image, setImage] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
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
    setRawText("");

    try {
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      setRawText(result.data.text);
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

      {rawText && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono overflow-auto max-h-40 border border-gray-200 dark:border-gray-700">
          <p className="font-bold text-gray-500 mb-1">Raw Output:</p>
          <pre className="whitespace-pre-wrap dark:text-gray-300">
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
