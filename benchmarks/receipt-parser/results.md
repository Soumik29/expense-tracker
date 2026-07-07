# Receipt Parser Benchmark Results

Generated: 2026-07-07T21:34:36.985Z

**Overall accuracy: 93.5% (29/31 cases)**

## Accuracy by category

| Category | Pass | Total | Accuracy |
|---|---|---|---|
| currency-format | 4 | 4 | 100% |
| discount | 1 | 1 | 100% |
| distractor | 2 | 2 | 100% |
| fallback | 3 | 3 | 100% |
| international | 3 | 3 | 100% |
| known-limitation | 2 | 4 | 50% |
| ocr-noise | 3 | 4 | 75% |
| real-world-merchant | 10 | 10 | 100% |
| standard | 13 | 13 | 100% |
| subtotal-handling | 3 | 3 | 100% |
| tax-handling | 3 | 3 | 100% |

## Case-by-case results

| # | Label | Expected | Actual | Pass |
|---|---|---|---|---|
| 1 | Starbucks - simple total | 8.2 | 8.2 | PASS |
| 2 | Walmart grocery - tabbed items | 12.79 | 12.79 | PASS |
| 3 | Uber ride receipt | 23.45 | 23.45 | PASS |
| 4 | Shell gas station | 42.1 | 42.1 | PASS |
| 5 | CVS pharmacy co-pay | 8.99 | 8.99 | PASS |
| 6 | Restaurant with tip added | 26.89 | 26.89 | PASS |
| 7 | Hotel folio | 322.28 | 322.28 | PASS |
| 8 | E-commerce order confirmation | 32.09 | 32.09 | PASS |
| 9 | REWE German supermarket (Summe, no English keyword) | 4.28 | 4.28 | PASS |
| 10 | Airport parking - Amount Due keyword | 19.5 | 19.5 | PASS |
| 11 | Coffee shop with coupon discount | 3.5 | 3.5 | PASS |
| 12 | Electronics store - multiple tax lines | 14.16 | 14.16 | PASS |
| 13 | Grocery store - Balance keyword | 9.48 | 9.48 | PASS |
| 14 | Receipt with only a Subtotal line, no Total at all | 4 | 4 | PASS |
| 15 | OCR noise: currency glued to keyword, no space | 45 | 45 | PASS |
| 16 | OCR noise: 'Total' keyword broken by stray spaces | 3.25 | 3.25 | PASS |
| 17 | Whole-dollar total with no cents printed | 45 | null | FAIL |
| 18 | Three-decimal currency (Kuwaiti Dinar style) | 8 | 8 | PASS |
| 19 | All-caps TOTAL with OCR garbage characters | 1.5 | 1.5 | PASS |
| 20 | 'Total Items' count line before the real total | 7 | 7 | PASS |
| 21 | Refund receipt with negative total | -15 | 15 | FAIL |
| 22 | Minimal receipt - bare number only | 12.99 | 12.99 | PASS |
| 23 | Euro symbol receipt | 4.3 | 4.3 | PASS |
| 24 | Pound sterling receipt | 4.7 | 4.7 | PASS |
| 25 | Large US total with thousands separator | 2137.9 | 2137.9 | PASS |
| 26 | Large European total with thousands separator | 2033.9 | 2033.9 | PASS |
| 27 | Grand Total overrides earlier partial total | 15.2 | 15.2 | PASS |
| 28 | 'Sub Total' spaced variant correctly skipped | 4.35 | 4.35 | PASS |
| 29 | 'Total (incl. tax)' single line | 8.5 | 8.5 | PASS |
| 30 | Date and phone number distractors | 45 | 45 | PASS |
| 31 | Receipt with VAT-only line correctly skipped | 3.2 | 3.2 | PASS |

## Failures / known limitations

- **Whole-dollar total with no cents printed** — expected 45, got null. Regex requires exactly 2 decimal digits, so a receipt where amounts are printed without cents cannot be matched at all.
- **Refund receipt with negative total** — expected -15, got 15. Parser has no minus-sign handling, so refunds are expected to come back as a positive number instead of negative — a known limitation worth flagging.