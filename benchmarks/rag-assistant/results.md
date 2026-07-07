# RAG Financial Assistant Benchmark Results

Generated: 2026-07-07T22:07:27.643Z

**Overall accuracy: 100.0% (13/13 questions)**
**Latency — avg: 2076ms, min: 415ms, max: 9506ms**

Seed data: 10 expenses + 6 incomes, deterministic amounts/categories/dates, indexed via the same `RagService.indexExpense/indexIncome` path used in production.

## Question-by-question results

| # | Question | Pass | Latency (ms) | Answer |
|---|---|---|---|---|
| 1 | What was my most recent expense? | PASS | 894 | Your most recent expense was $45 on Food on 2026-07-07, using a CREDIT_CARD at Sushi Palace. |
| 2 | What was my most recent income? | PASS | 558 | Your most recent income was $4000 from Salary on 2026-07-07. |
| 3 | How much did I spend on my flight to Chicago? | PASS | 473 | You spent $250 on your flight to Chicago. |
| 4 | What did I spend on Netflix? | PASS | 415 | You spent $12.99 on Netflix on 2026-06-23. |
| 5 | How much is my car loan EMI payment? | PASS | 454 | You spent $300 on car loan EMI payment on 2026-06-17. |
| 6 | Did I receive any gift money recently? | PASS | 559 | Yes, you received a gift of $50 on 2026-06-29 from your parents. |
| 7 | What payment method did I use for my grocery shopping? | PASS | 502 | You used DEBIT_CARD for your grocery shopping. |
| 8 | How much was my June salary? | PASS | 511 | To find your June salary, I'll look for the relevant records.   On 2026-06-04, I earned $3900 from Salary. Payment method: UPI. Description: June salary deposit |
| 9 | What did I buy running shoes for? | PASS | 513 | You bought running shoes for $89.99 on 2026-06-30. The description of the transaction is "New running shoes." |
| 10 | Is my phone bill a recurring expense? | PASS | 512 | Based on the provided context, your phone bill is $60 on 2026-07-05 and another $60 on 2026-07-05. This suggests that your phone bill is a recurring expense, as |
| 11 | How much cashback reward did I get? | PASS | 6449 | You earned $100 from a cashback reward on 2026-05-28. |
| 12 | What did I spend money on for entertainment or games? | PASS | 9506 | Based on the provided context, you spent money on the following entertainment or games:  - On 2026-06-27, you spent $15 on Games. Payment method: CREDIT_CARD. D |
| 13 | How much did I spend on rent last year? | PASS | 5649 | I don't know. |