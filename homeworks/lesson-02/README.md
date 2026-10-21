# Homework (2): Cryptography & Statistical Cryptanalysis

**Samuele Tortora — Student ID 2344522**  
Statistics Homeworks · Sapienza University of Rome

## Placement in the unified site

The lab is now **Lesson 02** in the common Statistics.Lab project. Open
`homeworks/lesson-02/` from the shared homepage. The older
`homeworks/HMWK3/` URL redirects here for compatibility.

All cryptographic and statistical algorithms in this directory are unchanged
from the original full laboratory; its header, navigation and accent colors
have been integrated with the main website. The shared styling is provided by
`../../assets/cryptanalysis-theme.css`.

For deployment instructions, see the repository root `README.md` and
`DEPLOY_GUIDE_ITALIANO.md`. GitHub Pages serves this over HTTPS, which
allows Web Crypto. Do not open as `file://` for testing module JavaScript.

## Included

* Caesar encryption/decryption: alphabet rotations preserving case and punctuation.
* Real secp256k1 arithmetic using native `BigInt`: prime-field Jacobian point additions, scalar multiplication, curve validation.
* Educational ephemeral ECDH + SHA-256 counter-derived XOR mask, valid reversible encoding; deliberately **no integrity authentication**, so do **not** use it for real messages.
* Attack on Caesar: trained unigram χ², peak-letter matching, and trained bigram/trigram scores; all 26 candidate shifts considered.
* Monte Carlo benchmark: 7 text lengths, 15–100 trials per length, a reproducible PRNG seed, and language-matched holdout text not used for training; 95% Wilson intervals.
* ECC key recovery: actual bounded brute-force point search and actual baby-step giant-step over the full secp256k1 group with bounded private scalar `1...50,000`.
* Comparison, correctness derivations, statistical assumptions and limitations, and final conclusion text.

## Security limitations

This implementation is a teaching tool, **not secure encryption**. Nonstandard SHA-based stream-masking lacks authentication: ciphertext is malleable. Production software must use audited libraries, proper ECIES-style KDF and authenticated encryption, scalar/point validation, protocol-specific domain separation, and full-entropy long-term keys. The scheme only limits the long-term *private* scalar; random ephemeral scalar `r` is sampled over almost all `secp256k1` order. Never input real secrets.

## Reproducibility and interpretation

The seed `20261021` is used only for reproducible **sampling of benchmark examples**, not for cryptographic randomness. Benchmark text is split into separate training and evaluation sets. An explicit run is required before any empirical chart or success rate is displayed. Samples can overlap across Monte Carlo trials, so naive binomial intervals are optimistic about corpus diversity; the report notes this. Corpus text is original educational prose rather than a verified representative-language corpus. A larger independently sampled collection would strengthen claims.

## Files

* `index.html` — the complete report and interactive controls.
* `styles.css` — responsive styles.
* `crypto.js` — real secp256k1, ECDH encryption and bounded ECDLP solvers.
* `corpus.js` — original English/Italian training and held-out test texts.
* `app.js` — ciphers, statistical estimators, Monte Carlo plots and UI.

SEC 2 reference: https://www.secg.org/sec2-v2.pdf
