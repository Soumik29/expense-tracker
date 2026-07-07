# RAG Financial Assistant Benchmark Results

Generated: 2026-07-07T22:40:23.838Z

**Overall accuracy: 100.0% (13/13 questions)**
**Latency — avg: 1741ms, min: 198ms, max: 8496ms**

Seed data: 10 expenses + 6 incomes, deterministic amounts/categories/dates, indexed via the same `RagService.indexExpense/indexIncome` path used in production.

## Question-by-question results

| # | Question | Pass | Latency (ms) | Answer |
|---|---|---|---|---|
| 1 | What was my most recent expense? | PASS | 274 | Your most recent expense was $45 on Food at Sushi Palace on 2026-07-07. |
| 2 | What was my most recent income? | PASS | 198 | Your most recent income was $4000 from Salary on 2026-07-07. |
| 3 | How much did I spend on my flight to Chicago? | PASS | 4393 | You spent $250 on your flight to Chicago. |
| 4 | What did I spend on Netflix? | PASS | 631 | You spent $12.99 on Netflix on 2026-06-23. |
| 5 | How much is my car loan EMI payment? | PASS | 617 | Your car loan EMI payment was $300. |
| 6 | Did I receive any gift money recently? | PASS | 452 | Yes, you received a gift of $50 on 2026-06-29 from your parents. |
| 7 | What payment method did I use for my grocery shopping? | PASS | 408 | You used a DEBIT_CARD for your grocery shopping. |
| 8 | How much was my June salary? | PASS | 576 | To find your June salary, I'll look for the transaction with the description "June salary deposit" in the Additional Relevant Records section.   On 2026-06-04,  |
| 9 | What did I buy running shoes for? | PASS | 609 | You bought running shoes for $89.99 on 2026-06-30. The description for this transaction is "New running shoes." |
| 10 | Is my phone bill a recurring expense? | PASS | 615 | Yes, your phone bill is a recurring expense, as indicated by the description "Monthly phone bill" in the transaction record on 2026-07-05. |
| 11 | How much cashback reward did I get? | PASS | 819 | You earned $100 from Other as a cashback reward on 2026-05-28. |
| 12 | What did I spend money on for entertainment or games? | PASS | 8496 | You spent $15 on Games on 2026-06-27, and the most recent transaction related to entertainment or games is $45 on Food on 2026-07-07 (although this is not stric |
| 13 | How much did I spend on rent last year? | PASS | 4540 | I don't know. |