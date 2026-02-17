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

  it('correctly handles "Total (incl. tax)" lines', () => {
    // Current code FAILS this because it skips any line with "tax"
    const rawText = `
      Burger King
      Burger 5.00
      Total (incl. tax) 5.50
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(5.50);
  });

  it('prioritizes Grand Total over earlier Total lines', () => {
    // Verifies bottom-up scanning
    const rawText = `
      Item A  10.00
      Total items: 2
      Subtotal 10.00
      Tax 1.00
      Grand Total 11.00
      Thank you
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(11.00);
  });

  it('ignores spaced "Sub Total" variants', () => {
    // Current code FAILS this because "Sub Total" != "subtotal"
    const rawText = `
      Item 1    10.00
      Sub Total 10.00
      Tax        1.00
      Total     11.00
    `;
    const result = parseReceipt(rawText);
    expect(result.total).toBe(11.00);
  });
});