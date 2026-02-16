import { describe, it, expect } from 'vitest';
import { parseReceipt } from './receiptParser';

describe('Receipt Parser Logic', () => {
  
  it('extracts a simple total with "Total" keyword', () => {
    const rawText = `
      Burger Joint
      Burger   10.00
      Fries     5.00
      Total    15.00
      Thank you!
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(15.00);
  });

  it('handles currency symbols and spacing', () => {
    const rawText = `
      Walmart
      Amount Due: $ 1,200.50
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(1200.50);
  });

  it('ignores dates and phone numbers', () => {
    const rawText = `
      Date: 2024-05-20
      Call us: 555-0199
      Total: 25.00
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(25.00);
    // It should NOT pick 2024 or 555.0199
  });

  it('falls back to the largest number if "Total" is missing', () => {
    const rawText = `
      Item 1    10.00
      Item 2    20.00
      Subtotal  30.00
      Tax        3.00
      33.00
    `;
    // Even without the word "Total", 33.00 is the biggest number
    const result = parseReceipt(rawText);
    expect(result.total).toBe(33.00);
  });

  it('correctly handles European number formats (1.200,50)', () => {
    const rawText = `
      REWE Markt
      Summe    1.200,50
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(1200.50);
  });

  it('correctly handles US number formats (1,200.50)', () => {
    const rawText = `
      Best Buy
      Total    1,200.50
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(1200.50);
  });
  
  it('handles mixed separators correctly', () => {
     // This ensures we don't confuse "1,000" (1000) with "1,00" (1)
     const rawText = "Total 1,000.00"; 
     expect(parseReceipt(rawText).total).toBe(1000.00);
     
     const rawTextEU = "Summe 1.000,00"; 
     expect(parseReceipt(rawTextEU).total).toBe(1000.00);
  });
});