# Lesson 06 — Statistical Independence

**Statistics.Lab · Samuele Tortora · 2344522**

Live lab: `homeworks/lesson-06/index.html` (also works at `homeworks/lesson-06/` on GitHub Pages).

## Homework requirements covered

- Accept paired categorical data **(X, F)** as one row per observation, or an equivalent grouped format **X,F,count**. Quoted CSV, TSV, and semicolon-separated inputs are supported.
- Construct the observed contingency table with **marginal totals** and **joint relative frequencies**.
- Calculate both conditional frequency tables: **P(F | X)** (row percentages) and **P(X | F)** (column percentages).
- Obtain expected frequencies under statistical independence: `E[i][j] = rowTotal[i] * columnTotal[j] / n`.
- Compute Pearson's statistic: `chi2 = sum((O-E)^2 / E)`, degrees of freedom `(r-1)(c-1)`, optional p-value via the upper incomplete gamma function, and Cramér's V.
- Compare observed and expected counts with side-by-side heatmaps, inspect the largest cell contribution, change the significance level, and export results as CSV.
- Interpret the null hypothesis correctly, note limitations for sparse tables, and distinguish **statistical association from causation**.

## Included data

Three **synthetic**, reproducible 3×2 examples, each with `n=150`:

- **Associated:** `[[42,8],[24,26],[9,41]]` → chi-square `43.68`, df `2`, p-value `≈3.27347e-10`.
- **Independent proportions:** `[[25,25],[25,25],[25,25]]` → chi-square `0`, df `2`, p-value `1` (a sample with exactly factorizing empirical proportions, not proof of population independence).
- **Weak association:** `[[29,21],[25,25],[21,29]]` → chi-square `2.56`, df `2`, p-value `≈0.2780373`.

## Files

- `index.html`: page layout using the same header, font palette, hero and components as Lesson 05.
- `style.css`: Lesson 05's design system with Lesson 06-specific visual extensions.
- `stats.js`: pure parsing, contingency and chi-square mathematics; no DOM dependencies.
- `app.js`: reactive data input, data tables, heatmaps, decisions, and CSV export.
- `test.js`: offline Node.js mathematical tests (run `node homeworks/lesson-06/test.js`).

No npm installation, server or external JavaScript library is required. Google Fonts enhance typography when online, with system fonts as fallbacks.

**Important:** A non-significant p-value does not demonstrate independence. A significant association alone does not establish causation. Pearson's chi-square p-value is asymptotic and unreliable with sufficiently sparse expected tables; this page highlights problematic counts and indicates when the test is not applicable.
