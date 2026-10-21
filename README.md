# Statistics.Lab — Interactive Cryptography Lessons

**Samuele Tortora · Student ID 2344522 · Coursework 2026**

A unified, fully static GitHub Pages site for two teaching lessons. The site retains the complete interactive experiments and theoretical material from all three original exercise submissions.

## Navigate

- **Homepage**: `/index.html` — two cards, search, lesson filters and an ECC live preview.
- **Lesson 01**: `/homeworks/lesson-01/` — one continuous page with **Part 01: Elliptic-Curve Scalar Multiplication** and **Part 02: Ethereum Wallet Derivation**. Both original experiments run inside automatically sized, same-origin embedded modules; each module retains its own JavaScript, charts, mathematical explanations, statistics and demonstrations. The parent supplies a single navigation/header. This isolation avoids conflicts between the distinct crypto engines without visually dividing the coursework into separate websites.
- **Lesson 02**: `/homeworks/lesson-02/` — Caesar cipher, secp256k1 toy encryption, distribution matching, chi-square and n-gram attacks, Monte Carlo studies, ECC private-key recovery, mathematical proofs and final conclusions, with the shared Statistics.Lab look.

### Backward compatible routes

`/homeworks/hmwk-01/` and `/homeworks/hmwk-02/` still work as standalone experiments (and serve embedded modes with `?embed=1`). `/homeworks/HMWK3/` redirects to `/homeworks/lesson-02/` so old shared URLs still work.

## Project structure

```
index.html
assets/
  site.css                original homepage visual system
  site.js                 centralized two-lesson registry and ECC preview
  unified.css             homepage adjustments
  lesson.css              shared lesson-one shell design
  lesson.js               same-origin iframe resizing and anchor navigation
  embed-lab.css           embedded presentation for original exercise modules
  embed-lab.js            iframe resizing and in-page anchor messages
  cryptanalysis-theme.css unified Lesson 02 visual treatment
homeworks/
  lesson-01/index.html    one page with two interactive parts
  lesson-02/              complete statistical cryptanalysis lab
  hmwk-01/                original ECC exercise (embedded in Part 01)
  hmwk-02/                original Ethereum wallet exercise (embedded in Part 02)
  HMWK3/index.html        backward-compatible redirect
```

## Publish to GitHub Pages

1. Create a backup copy of the existing repository or download its current ZIP.
2. Extract the delivered project ZIP. Copy **the contents of its project folder**, not its outer wrapper folder, into the root of your GitHub repository, preserving folders and relative paths. All new `assets` files and the two `homeworks/lesson-*` folders are required.
3. Replace updated existing files (`index.html`, `README.md`, `assets/site.js`, the two original `homeworks/hmwk-*/index.html`) and upload the new files. Remove outdated standalone `HMWK3` files if you want the clean redirect (GitHub's web UI does not automatically delete old files on upload).
4. In **Settings → Pages**, set **Deploy from a branch → main → /(root)**. Wait for the deployment workflow to complete; then hard-refresh the website.
5. Confirm both lesson cards, the two Part sections in Lesson 01, and the Caesar/ECC demos, Monte Carlo charts and proofs in Lesson 02.

### Safer way to replace the whole repository without manual file merging

If you use Git or GitHub Desktop, clone your repository, replace the working tree contents with the new project contents, then commit/push. This also deletes any obsolete files cleanly while preserving Git history. Avoid deleting the `.git` folder from your local clone.

## Cryptographic scope

- Lesson 01's **F₁₇** arithmetic is deliberately insecure and purely pedagogical.
- The wallet demo uses **public standard development/test vectors**; never deposit funds into these addresses or provide a private recovery mnemonic.
- Lesson 02's ECC implementation uses the actual **secp256k1** curve with an artificially restricted long-term private-key search range; its SHA-256-derived XOR scheme is an unauthenticated educational construction, not secure ECIES or a production protocol.
- Statistical results depend on the reference corpus and evaluation samples; the charts do not constitute a proof of security.

No build system, backend, external dependency installation or API key is needed. Modern browsers and an HTTPS origin are recommended. GitHub Pages provides HTTPS.
