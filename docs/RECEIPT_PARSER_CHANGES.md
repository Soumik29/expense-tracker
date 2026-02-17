# Receipt Parser Update Notes

---

## Overview

Fixed an issue where the parser was incorrectly identifying the Subtotal as the final Total. Implemented a new bottom-up parsing strategy and added specific rules to handle tax-inclusive totals while ignoring standalone tax lines.

## Key Changes

1. Bottom-Up Parsing Strategy

- File: `receiptParser.ts`
- Change: Switched the line iteration loop to start from the end of the receipt and move upwards (`for (let i = lines.length - 1; i >= 0; i--)`)
- Reasoning: Receipits typically list the final "Grand Total" at the bottom. By scanning bottom-up, we encounter the final total before checking earlier lines like "Subtotal" or itemized lists.

2. Strict Subtotal Exclusion

- File: receiptParser.ts
- Change: Introduced a specific regex (`/sub\s*[-]?\s*total/i`) to detect "Subtotal", "Sub-Total", or "Sub Total".
- Logic: If a line matches this regex, it is explicitly skipped (continue), ensuring we never accidentally capture the subtotal as the final amount.

3. Context-Aware Tax Handling

- File: `receiptParser.ts`
- Change: Added a conditional check for lines containing "tax" or "vat".
- Logic:
  - Skip: If a line says "Tax" or "VAT" but does not say "Total" (e.g., "Tax: $5.00").
  - Keep: If a line says "Tax" AND "Total" (e.g., "Total (incl. Tax): $55.00").
  - Code: `if ((line.includes('tax') || line.includes('vat')) && !line.includes('total')) {continue;}`

4. Test Coverage Updates

- File: receiptParser.test.ts
- New Tests:
  - 'correctly handles "Total (incl. tax)" lines': Verifies that lines like "Total (incl. tax) 5.50" are successfully captured.
  - 'prioritizes Grand Total over earlier Total lines': Verifies that the bottom-up approach correctly picks the last total in the list over the first.

### Code Snippet (Reference)

```javascript
// Bottom-up loop
for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i].toLowerCase();

  // Rule 1: Ignore subtotal strictly
  if (subtotalRegex.test(line)) {
    continue;
  }

  // Rule 2: Ignore tax/vat UNLESS it is part of the "Total" line
  if (
    (line.includes("tax") || line.includes("vat")) &&
    !line.includes("total")
  ) {
    continue;
  }

  // ... (check for total keywords)
}
```
