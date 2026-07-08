# RAG Financial Assistant Benchmark Results

Generated: 2026-07-08T03:16:27.733Z

**Overall accuracy: 100.0% (15/15 questions)**
**Latency — avg: 3647ms, min: 565ms, max: 12550ms**

Seed data: 10 expenses + 6 incomes, deterministic amounts/categories/dates, indexed via the same `RagService.indexExpense/indexIncome` path used in production.

## Question-by-question results

| # | Question | Pass | Latency (ms) | Answer |
|---|---|---|---|---|
| 1 | What was my most recent expense? | PASS | 795 | **Most recent expense**  - **Date:** 2026‑07‑07   - **Amount:** $45   - **Category:** Food   - **Payment method:** CREDIT_CARD   - **Description:** Dinner at Su |
| 2 | What was my most recent income? | PASS | 960 | Your most recent income was a **$4,000 Salary** received on **2026‑07‑07** via UPI. |
| 3 | How much did I spend on my flight to Chicago? | PASS | 2556 | You spent **$250** on your flight to Chicago. |
| 4 | What did I spend on Netflix? | PASS | 1765 | You had a single Netflix transaction:  - **Date:** 2026‑06‑23   - **Amount:** $12.99   - **Category:** Subscription   - **Payment method:** CREDIT_CARD   - **De |
| 5 | How much is my car loan EMI payment? | PASS | 675 | Your car loan EMI payment totals **$300.00** (across one transaction). |
| 6 | Did I receive any gift money recently? | PASS | 1010 | Yes – you received a gift of **$50** on **2026‑06‑29**. |
| 7 | What payment method did I use for my grocery shopping? | PASS | 1326 | You used a **DEBIT_CARD** for your grocery shopping. |
| 8 | How much was my salary in June 2026? | PASS | 565 | Your salary for June 2026 totaled **$3,900.00**. |
| 9 | What did I buy running shoes for? | PASS | 1763 | You bought the running shoes on **2026‑06‑30** for **$89.99**. |
| 10 | Is my phone bill a recurring expense? | PASS | 7430 | I only found a single entry for a phone bill:  - **2026‑07‑05** – $60 on **Mobile_Bill** (Monthly phone bill)  Since there’s no other record of a phone bill in  |
| 11 | How much cashback reward did I get? | PASS | 6012 | You earned **$100** in cashback rewards. |
| 12 | What did I spend money on for entertainment or games? | PASS | 6365 | Here’s what you spent on for entertainment or games:  | Date | Category | Amount | Payment Method | Description | |------|----------|--------|----------------|- |
| 13 | How much did I spend on rent last year? | PASS | 12550 | I couldn’t find any transactions labeled “rent” in your history. Could you let me know the exact category name or provide a bit more detail (e.g., the merchant  |
| 14 | How much did I spend on Food in total? | PASS | 5763 | You’ve spent a total of **$102.50** on Food across 3 transactions. |
| 15 | What's my overall balance? Am I positive or negative? | PASS | 5167 | Your overall balance is **$6,399.03**.   - Total earned: **$8,850.00**   - Total spent: **$2,450.97**    Since the balance is positive, you’re in the red? Actua |