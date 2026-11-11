# Statistics.Lab — Homework collection

**Samuele Tortora · Student ID 2344522 · 2026**

This is a static site (HTML/CSS/JavaScript) with five interactive lessons. No backend, build step or API key is needed.

## Published lessons

| Lesson | What it contains | URL |
| --- | --- | --- |
| 01 | Elliptic curves and Ethereum wallet derivation | `homeworks/lesson-01/` |
| 02 | Caesar cipher, statistical cryptanalysis and small ECC keys | `homeworks/lesson-02/` |
| 03 | Bernoulli/Rademacher penetration scores, LLN and CLT | `homeworks/lesson-03/` |
| 04 | Welford recurrences and sampling mean and variance | `homeworks/lesson-04/` |
| 05 | Riemann/Lebesgue integration, Dirichlet/Thomae, Normal CDF and Liouville | `homeworks/lesson-05/` |

Each card on the homepage is maintained in the `HOMEWORKS` array in `assets/site.js`. Search, filters, and number of lessons are generated from that array. Each lesson keeps its separate scripts and styles. The original demos are preserved in their original directories.

## Lesson 05

Exercise 1 contrasts numerical partitioning of the **domain** (Riemann) and partitioning the **range** via measurable preimages (Lebesgue-inspired), with nine examples and an explanation of pathological functions. Exercise 2 computes the normal CDF using trapezoids, Simpson, a Taylor series, and an erf approximation, comparing against a separately precomputed SciPy reference table. Interactive controls and timing benchmarks run in the browser.

The previous URLs `LESSON5/` and `homeworks/LESSON5/` redirect to `homeworks/lesson-05/` so older links continue to work.

## Local preview and mathematical tests

From the root of the repository:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. To test Lesson 05 calculations with Node.js:

```bash
node homeworks/lesson-05/test.js
```

## Publish on GitHub Pages

Copy the **contents** of this repository folder to your GitHub repository root. `index.html` and `assets/` must be at the root, not nested within another folder. In **Settings → Pages**, choose **Deploy from a branch**, `main`, `/(root)`. Once deployed, open the homepage and choose **Lesson 05**.

See `DEPLOY_GUIDE_ITALIANO.md` and `LESSON5_FIX_GUIDE.md` for an Italian step-by-step walkthrough and the exact fix.

Educational cryptographic experiments here are intentionally simplified and must not be used for real keys.
