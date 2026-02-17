export const parseReceipt = (text: string) => {
  const lines = text.split('\n');
  let extractedTotal: number | null = null;
  
  // Regex matches both formats: 1,200.50 OR 1.200,50
  const priceRegex = /[$€£]?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;

  const totalKeywords = ['total', 'amount', 'due', 'balance', 'grand total'];

  const subtotalRegex = /sub\s*[-]?\s*total/i;

  const potentialPrices: number[] = [];

  // Helper to convert "1.200,50" or "1,200.50" to a standard JS float
  const parsePrice = (priceStr: string): number => {
    // 1. Remove currency symbols and whitespace, keep digits, dots, and commas
    let clean = priceStr.replace(/[^\d.,]/g, '');
    // 2. Detect format: If the last separator is a comma (e.g., 12,00), it's European
    if (clean.match(/,\d{2}$/)) {
      // European: Remove all dots (thousands), replace comma with dot (decimal)
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // US/Standard: Remove all commas (thousands), keep dot (decimal)
      clean = clean.replace(/,/g, '');
    }

    return parseFloat(clean);
  };

  // Pass 1: Collect all valid numbers
  const matches = text.match(priceRegex);
  if (matches) {
    matches.forEach(match => {
      const val = parsePrice(match);
      if (!isNaN(val)) {
        potentialPrices.push(val);
      }
    });
  }
  // Pass 2: Context Awareness (Look for "Total" keywords)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toLowerCase();
    // GUARD 1: Strict Subtotal Skip
    // Use regex to catch "sub total", "sub-total", etc.
    if(subtotalRegex.test(line)){
      continue;
    }
    // GUARD 2: Smart Tax Skip
    // If line mentions "tax" or "vat", ONLY skip it if it DOESN'T say "Total".
    // This allows "Total (incl. tax)" to pass, but skips "Tax: $5.00".
    if ((line.includes('tax') || line.includes('vat')) && !line.includes('total')) {
      continue;
    }

    if (totalKeywords.some(keyword => line.includes(keyword))) {
      const lineMatches = lines[i].match(priceRegex);
      if (lineMatches) {
         // We found a number on a line with "Total"!
         // But wait! If there are multiple numbers (e.g. "Total: 50.00 Tax: 5.00"), 
         // we usually want the largest one or the last one. 
         // For simplicity, let's take the last number found on the line.
         const lastMatch = lineMatches[lineMatches.length - 1];
         extractedTotal = parsePrice(lastMatch);
         break;
      }
    }
  }

  // Pass 3: Fallback to largest number found
  if (extractedTotal === null && potentialPrices.length > 0) {
    extractedTotal = Math.max(...potentialPrices);
  }

  return {
    total: extractedTotal,
    rawText: text
  };
};