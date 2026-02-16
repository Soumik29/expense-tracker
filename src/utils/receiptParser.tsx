export const parseReceipt = (text: string) => {
    const lines = text.split('\n');
    let extractedTotal: number | null = null;

    //Regex to match this pattern (e.g., 12.99, 100.00)
    //Matches option $ symbol followed by an optional space, then numbers ranging 1 to 3 digits, then a decimal point, then 2 digits.
    const priceRegex = /[$]?\s?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;

    //Keywords that appear in a receipt
    const totalKeywords = ['total', 'amount', 'due','balance', 'grand total'];

    const potentialPrices: number[] = [];

    const matches = text.match(priceRegex);
    if (matches) {
        matches.forEach(match => {
            const cleanNumber = match.replace(/[^0-9.]/g, '');
            const val = parseFloat(cleanNumber);
            if (!isNaN(val)) {
                potentialPrices.push(val);
            }
        });
    }

    for (let i = 0; i < lines.length; i++){
        const line = lines[i].toLowerCase();

        if (totalKeywords.some(keyword => line.includes(keyword))){
            const lineMatches = lines[i].match(priceRegex);
            if (lineMatches) {
                const clean = lineMatches[0].replace(/[^0-9.]/g, '');
                extractedTotal = parseFloat(clean);
                break;
            }
        }
    }

    if (!extractedTotal && potentialPrices.length > 0) {
        extractedTotal = Math.max(...potentialPrices);
    }

    return {
        total: extractedTotal,
        rawText: text
    };
};