export type BenchmarkCase = {
  label: string;
  tags: string[];
  rawText: string;
  // Ground truth: what a human reading the receipt would consider correct.
  // null means "no total is recoverable from this text at all".
  expectedTotal: number | null;
  notes: string;
};

export const benchmarkCases: BenchmarkCase[] = [
  {
    label: "Starbucks - simple total",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      Starbucks Store #4521
      Grande Latte        4.95
      Blueberry Muffin     3.25
      Total               8.20
      Thank you, come again!
    `,
    expectedTotal: 8.2,
    notes: "Baseline case, clear Total keyword.",
  },
  {
    label: "Walmart grocery - tabbed items",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      WALMART
      Bananas          1.48
      Milk 2%          3.29
      Bread            2.99
      Eggs             4.19
      SUBTOTAL        11.95
      TAX              0.84
      TOTAL           12.79
    `,
    expectedTotal: 12.79,
    notes: "Standard subtotal/tax/total pattern, all-caps keywords.",
  },
  {
    label: "Uber ride receipt",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      Uber Trip Receipt
      Fare                18.50
      Booking Fee          2.25
      Promotion           -2.70
      Total charged      $23.45
    `,
    expectedTotal: 23.45,
    notes: "Currency symbol glued directly to number with 'charged' after Total.",
  },
  {
    label: "Shell gas station",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      SHELL #08841
      Pump 03
      Unleaded  10.523 gal
      Price/Gal   4.00
      Total Sale       $42.10
    `,
    expectedTotal: 42.1,
    notes: "Contains a 3-decimal quantity (10.523) that must not be picked as the total.",
  },
  {
    label: "CVS pharmacy co-pay",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      CVS PHARMACY
      Rx#0294831
      Amoxicillin 500mg
      Insurance Covered   42.00
      Total Due:           8.99
    `,
    expectedTotal: 8.99,
    notes: "Larger insurance-covered amount appears before the real total.",
  },
  {
    label: "Restaurant with tip added",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      Olive Garden
      Chicken Parm       18.00
      Iced Tea            3.00
      Subtotal           21.00
      Tax                 1.89
      Tip                 4.00
      Total              26.89
    `,
    expectedTotal: 26.89,
    notes: "Tip line sits between subtotal/tax and the final total.",
  },
  {
    label: "Hotel folio",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      Grand Plaza Hotel - Folio
      Room Charge (2 nights)   258.00
      Resort Fee                29.00
      Occupancy Tax             35.28
      Total Due Upon Checkout  322.28
    `,
    expectedTotal: 322.28,
    notes: "Multi-word keyword phrase around 'Total Due'.",
  },
  {
    label: "E-commerce order confirmation",
    tags: ["standard", "real-world-merchant"],
    rawText: `
      Order Confirmation #55291
      Wireless Mouse        24.99
      Shipping               5.00
      Estimated Tax          2.10
      Order Total:          32.09
    `,
    expectedTotal: 32.09,
    notes: "Not a printed receipt at all, but plain confirmation-email text.",
  },
  {
    label: "REWE German supermarket (Summe, no English keyword)",
    tags: ["international", "fallback"],
    rawText: `
      REWE Markt GmbH
      Apfel             1,49
      Brot              2,79
      Summe            4,28
    `,
    expectedTotal: 4.28,
    notes: "No English total keyword present at all; parser must fall back to largest number.",
  },
  {
    label: "Airport parking - Amount Due keyword",
    tags: ["standard"],
    rawText: `
      Airport Parking Garage
      Duration: 3h 15m
      Rate: $6.00/hr
      Amount Due:   19.50
    `,
    expectedTotal: 19.5,
    notes: "Uses 'Amount Due' rather than 'Total'.",
  },
  {
    label: "Coffee shop with coupon discount",
    tags: ["discount", "real-world-merchant"],
    rawText: `
      Corner Cafe
      Cappuccino          4.50
      Coupon Discount    -1.00
      Total               3.50
    `,
    expectedTotal: 3.5,
    notes: "Negative discount line precedes the real total.",
  },
  {
    label: "Electronics store - multiple tax lines",
    tags: ["standard", "tax-handling"],
    rawText: `
      Best Buy
      USB-C Cable          12.99
      State Tax             0.91
      City Tax              0.26
      Total                14.16
    `,
    expectedTotal: 14.16,
    notes: "Two separate tax lines above the total; both must be skipped for the total line itself.",
  },
  {
    label: "Grocery store - Balance keyword",
    tags: ["standard"],
    rawText: `
      Trader Joe's
      Trail Mix            5.99
      Sparkling Water      3.49
      Balance:             9.48
    `,
    expectedTotal: 9.48,
    notes: "Uses 'Balance' instead of 'Total'.",
  },
  {
    label: "Receipt with only a Subtotal line, no Total at all",
    tags: ["fallback", "subtotal-handling"],
    rawText: `
      Corner Store
      Chips        2.50
      Soda         1.50
      Subtotal     4.00
    `,
    expectedTotal: 4.0,
    notes: "No real Total line exists; Subtotal is explicitly skipped by keyword match, so the parser must recover the value via the largest-number fallback.",
  },
  {
    label: "OCR noise: currency glued to keyword, no space",
    tags: ["ocr-noise", "real-world-merchant"],
    rawText: `
      Corner Deli
      Sandwich   9.00
      Total$45.00
    `,
    expectedTotal: 45.0,
    notes: "Simulates Tesseract dropping the space between 'Total' and the currency symbol.",
  },
  {
    label: "OCR noise: 'Total' keyword broken by stray spaces",
    tags: ["ocr-noise", "known-limitation"],
    rawText: `
      Downtown Bakery
      Croissant     3.25
      T o t a l     3.25
    `,
    expectedTotal: 3.25,
    notes: "Simulates a common Tesseract artifact where letters get split by spurious spaces, breaking the 'total' substring match. Expected to fail with the current keyword-matching implementation.",
  },
  {
    label: "Whole-dollar total with no cents printed",
    tags: ["ocr-noise", "known-limitation"],
    rawText: `
      Hardware Store
      Hammer   15
      Nails     3
      Total    45
    `,
    expectedTotal: 45.0,
    notes: "Regex requires exactly 2 decimal digits, so a receipt where amounts are printed without cents cannot be matched at all.",
  },
  {
    label: "Three-decimal currency (Kuwaiti Dinar style)",
    tags: ["international", "known-limitation"],
    rawText: `
      Al Salam Store
      Item A       4.250
      Item B       3.750
      Total        8.000
    `,
    expectedTotal: 8.0,
    notes: "Regex is hardcoded to 2 decimal places; 3-decimal currencies are a known unsupported format.",
  },
  {
    label: "All-caps TOTAL with OCR garbage characters",
    tags: ["ocr-noise"],
    rawText: `
      QuickMart
      Water Bottle   1.50
      TOTAL |: 1.50
    `,
    expectedTotal: 1.5,
    notes: "Stray pipe/colon characters from OCR misreads around the amount.",
  },
  {
    label: "'Total Items' count line before the real total",
    tags: ["standard", "distractor"],
    rawText: `
      Dollar General
      Item 1         4.00
      Item 2         3.00
      Total Items: 2
      Total:         7.00
    `,
    expectedTotal: 7.0,
    notes: "'Total Items: 2' has no price match on that line, so scanning must continue to find the real Total line.",
  },
  {
    label: "Refund receipt with negative total",
    tags: ["known-limitation"],
    rawText: `
      Macy's Returns
      Returned Item      -15.00
      Total Refund:      -15.00
    `,
    expectedTotal: -15.0,
    notes: "Parser has no minus-sign handling, so refunds are expected to come back as a positive number instead of negative — a known limitation worth flagging.",
  },
  {
    label: "Minimal receipt - bare number only",
    tags: ["fallback"],
    rawText: `12.99`,
    expectedTotal: 12.99,
    notes: "No labels or keywords at all; must fall back to the single number present.",
  },
  {
    label: "Euro symbol receipt",
    tags: ["currency-format"],
    rawText: `
      Cafe Paris
      Croissant   €2.50
      Espresso    €1.80
      Total       €4.30
    `,
    expectedTotal: 4.3,
    notes: "Euro currency symbol.",
  },
  {
    label: "Pound sterling receipt",
    tags: ["currency-format"],
    rawText: `
      London Corner Shop
      Sandwich   £3.50
      Crisps     £1.20
      Total      £4.70
    `,
    expectedTotal: 4.7,
    notes: "Pound currency symbol.",
  },
  {
    label: "Large US total with thousands separator",
    tags: ["currency-format"],
    rawText: `
      Furniture Warehouse
      Sofa            1899.00
      Delivery Fee      99.00
      Sales Tax        139.90
      Total          $2,137.90
    `,
    expectedTotal: 2137.9,
    notes: "Four-digit total with comma thousands separator.",
  },
  {
    label: "Large European total with thousands separator",
    tags: ["currency-format", "international"],
    rawText: `
      Möbelhaus Berlin
      Sofa            1.799,00
      Lieferung          89,00
      MwSt              145,90
      Summe           2.033,90
    `,
    expectedTotal: 2033.9,
    notes: "European thousands/decimal formatting on a 'Summe' (no English keyword) line; also has a German tax line 'MwSt' that must not be confused with the English tax guard.",
  },
  {
    label: "Grand Total overrides earlier partial total",
    tags: ["standard", "subtotal-handling"],
    rawText: `
      Costco
      Paper Towels    14.00
      Total items: 3
      Subtotal        14.00
      Tax              1.20
      Grand Total     15.20
    `,
    expectedTotal: 15.2,
    notes: "Bottom-up scan must prefer the final 'Grand Total' line over the earlier partial matches.",
  },
  {
    label: "'Sub Total' spaced variant correctly skipped",
    tags: ["subtotal-handling"],
    rawText: `
      Target
      Notebook         4.00
      Sub Total        4.00
      Tax              0.35
      Total            4.35
    `,
    expectedTotal: 4.35,
    notes: "Spaced 'Sub Total' variant must still be recognized and skipped.",
  },
  {
    label: "'Total (incl. tax)' single line",
    tags: ["tax-handling"],
    rawText: `
      Burger King
      Whopper Meal      8.50
      Total (incl. tax) 8.50
    `,
    expectedTotal: 8.5,
    notes: "Tax-inclusive total must NOT be skipped just because the line mentions 'tax'.",
  },
  {
    label: "Date and phone number distractors",
    tags: ["distractor"],
    rawText: `
      Auto Repair Shop
      Date: 2026-07-01
      Call: 555-0142
      Oil Change      45.00
      Total:          45.00
    `,
    expectedTotal: 45.0,
    notes: "Dates and phone numbers must not be mistaken for the total.",
  },
  {
    label: "Receipt with VAT-only line correctly skipped",
    tags: ["tax-handling"],
    rawText: `
      Boots Pharmacy
      Toothpaste       3.20
      VAT: 0.53
      Total:           3.20
    `,
    expectedTotal: 3.2,
    notes: "A line mentioning VAT without 'total' must be skipped as a tax line.",
  },
];
