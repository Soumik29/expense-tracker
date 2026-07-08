# RAG Financial Assistant Benchmark Results

Generated: 2026-07-08T03:55:08.804Z

**Overall accuracy: 90.5% (19/21 questions)**
**Latency — avg: 3257ms, min: 269ms, max: 15683ms**

Seed data: 10 expenses + 6 incomes, deterministic amounts/categories/dates, indexed via the same `RagService.indexExpense/indexIncome` path used in production.

## Question-by-question results

| # | Question | Pass | Latency (ms) | Answer |
|---|---|---|---|---|
| 1 | What was my most recent expense? | PASS | 910 | Your most recent expense was on **2026‑07‑07**: you spent **$45** on **Food** (Dinner at Sushi Palace, paid by CREDIT_CARD). |
| 2 | What was my most recent income? | PASS | 702 | Your most recent income was a **$4,000 Salary** received on **2026‑07‑07** via UPI. |
| 3 | How much did I spend on my flight to Chicago? | PASS | 1177 | You spent **$250** on your flight to Chicago. |
| 4 | What did I spend on Netflix? | PASS | 1078 | You spent **$12.99** on Netflix on **June 23, 2026**. |
| 5 | How much is my car loan EMI payment? | FAIL | 1229 | I’m not sure which period you’re referring to. Could you let me know the month (or date range) you’d like the EMI payment for? That way I can pull the exact amo |
| 6 | Did I receive any gift money recently? | PASS | 848 | Yes! You received a gift of **$50** on **June 29, 2026** from your parents. This is the only recent income entry in the “Gift” category. |
| 7 | What payment method did I use for my grocery shopping? | PASS | 926 | You used a **DEBIT_CARD** for your grocery shopping. |
| 8 | How much was my salary in June 2026? | PASS | 2124 | Your salary for June 2026 totaled **$3,900.00** (across one transaction). |
| 9 | What did I buy running shoes for? | PASS | 980 | You bought the running shoes for **$89.99** on 2026‑06‑30. |
| 10 | Is my phone bill a recurring expense? | PASS | 12510 | I’ve looked through your transaction history for any other “Mobile_Bill” entries. The only record I found is the $60 payment on **July 5, 2026**. Since there ar |
| 11 | How much cashback reward did I get? | PASS | 15683 | You earned **$100** in cashback rewards. |
| 12 | What did I spend money on for entertainment or games? | PASS | 8413 | Here’s what your recent spending shows for entertainment‑related categories (games and subscriptions):  | Date | Category | Amount | Payment Method | Descriptio |
| 13 | How much did I spend on rent last year? | FAIL | 7228 | I’m not finding any transactions that match “rent.” Could you let me know if you used a different category or description for your rent payments? That way I can |
| 14 | How much did I spend on Food in total? | PASS | 2357 | You’ve spent a total of **$102.50** on Food across 3 transactions. |
| 15 | What's my overall balance? Am I positive or negative? | PASS | 649 | Your overall balance is **$6,399.03**, which is a positive balance. You’ve earned $8,850.00 and spent $2,450.97. |
| 16 | What category do I spend the most money on? | PASS | 6310 | You spend the most on **Shopping** – about $1,089.98 in total. |
| 17 | What's my biggest source of income? | PASS | 2702 | Your biggest source of income is **Salary**, totaling $7,900.00. |
| 18 | What is 10 times 4? | PASS | 984 | 10 times 4 is **40**. |
| 19 | What is 100 divided by 4? | PASS | 269 | 100 divided by 4 equals **25**. |
| 20 | [memory 1/2] What was my most recent expense? | PASS | 806 | Your most recent expense was on **2026‑07‑07**:   - **Amount:** $45   - **Category:** Food   - **Payment method:** Credit card   - **Description:** Dinner at Su |
| 21 | [memory 2/2] How much was that, exactly, in dollars? | PASS | 523 | It was exactly **$45.00**. |

## Failures

- **How much is my car loan EMI payment?** — Specific-record recall.
  - Answer: I’m not sure which period you’re referring to. Could you let me know the month (or date range) you’d like the EMI payment for? That way I can pull the exact amount for you.
- **How much did I spend on rent last year?** — Out-of-context question — the assistant must decline rather than hallucinate a rent expense that was never recorded.
  - Answer: I’m not finding any transactions that match “rent.” Could you let me know if you used a different category or description for your rent payments? That way I can look it up accurately.