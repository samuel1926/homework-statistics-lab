# Verified experimental analysis — Homework (2)

Samuele Tortora · 2344522 · StatisticsHomeworks/HMWK3

## Design

For each sample length N = 20, 40, 80, 160, 320, 640, 1000, draw 30 samples of N letters from a **held-out** test text (not used to estimate linguistic probabilities), and draw a fresh Caesar key uniformly from 1 through 25. Use PRNG seed 20261021. The seed ensures exact reproducibility for choosing **experimental examples**; it is never used to choose ECDH ephemeral scalars. Evaluate three automated key estimators: minimum chi-square, highest bigram/trigram log score, and most-frequent-letter matching.

The source corpus is original English/Italian educational prose, not a published representative national corpus. It has limited size and topic coverage. The samples can overlap and are not wholly independent. The reported Wilson intervals therefore represent a simplified trial-success uncertainty model, not cross-corpus generalization guarantees.

## Results: English (30 trials per length)

| Alphabetic length | Chi-square correct | N-gram correct | Peak matching correct | Chi-square 95% Wilson CI |
|---:|---:|---:|---:|---:|
| 20 | 26/30 (86.7%) | 30/30 (100%) | 12/30 (40.0%) | [70.3%, 94.7%] |
| 40 | 26/30 (86.7%) | 30/30 (100%) | 13/30 (43.3%) | [70.3%, 94.7%] |
| 80 | 27/30 (90.0%) | 30/30 (100%) | 22/30 (73.3%) | [74.4%, 96.5%] |
| 160 | 21/30 (70.0%) | 30/30 (100%) | 27/30 (90.0%) | [52.1%, 83.3%] |
| 320 | 19/30 (63.3%) | 30/30 (100%) | 30/30 (100%) | [45.5%, 78.1%] |
| 640 | 27/30 (90.0%) | 30/30 (100%) | 30/30 (100%) | [74.4%, 96.5%] |
| 1000 | 28/30 (93.3%) | 30/30 (100%) | 30/30 (100%) | [78.7%, 98.2%] |

## Results: Italian (30 trials per length)

| Alphabetic length | Chi-square correct | N-gram correct | Peak matching correct |
|---:|---:|---:|---:|
| 20 | 30/30 | 30/30 | 7/30 |
| 40 | 30/30 | 30/30 | 7/30 |
| 80 | 30/30 | 30/30 | 8/30 |
| 160 | 30/30 | 30/30 | 11/30 |
| 320 | 30/30 | 30/30 | 16/30 |
| 640 | 30/30 | 30/30 | 13/30 |
| 1000 | 30/30 | 30/30 | 9/30 |

## Statistical findings

1. **Not necessarily monotonic.** In English, the chi-square accuracy decreases from 90.0% (N = 80) to 63.3% (N = 320) before recovering to 93.3% (N = 1000). This does not contradict the ideal asymptotic arguments: the testing corpus has finite size, the training/test letter distributions are not identical, and overlapping contiguous slices are not i.i.d. samples from a fixed model. Even with increasing N, finite-sample accuracy can fluctuate.
2. **N-grams can be stronger.** The combined bigram/trigram score recovers every key in this small benchmark. This is empirical evidence for *these corpora only*, not a proof of universal perfection. Prose in training and testing is stylistically similar, so this benchmark likely understates domain shift.
3. **Peak letter matching is unstable.** The peak heuristic often fails even when the cipher is trivially reversible, because the most common letter in a limited excerpt need not match the largest peak of the training corpus. Italian peak matching remains poor even with long examples, confirming that one letter is often insufficient.
4. **Uncertainty matters.** At 30/30 successes, the two-sided Wilson 95% confidence interval is approximately [88.6%, 100%], not a guarantee of 100% true success; for 19/30 successes, the interval is approximately [45.5%, 78.1%]. These confidence intervals treat trials as Bernoulli draws in the specified sampling design, with important caveats about overlapping samples.
5. **A security conclusion.** Caesar is structurally insecure even when a particular estimator fails: trying all 26 keys is always computationally trivial. The χ² score is a convenient way to rank them automatically, not a necessary condition for brute-force decryption.

## ECC key search verification

Against a public key Q = 847G on real secp256k1 with interval B = 2000:

- Bounded sequential search recovered d = 847 after 847 candidate checks.
- Baby-step giant-step recovered d = 847 after 64 measured table-build/giant-step checks, storing 45 baby-step keys.
- ECDH-derived ciphertext round-tripped correctly with a multilingual Unicode message.

These runs test actual curve point operations. Their execution times depend on hardware and are therefore not quoted as transferable measurements. A private scalar sampled uniformly from the full order n ≈ 2^256 is not vulnerable to the same small-interval enumeration; a generic best-known classical discrete-log strategy requires on the order of 2^128 group operations.

## Design risks and final conclusion

The cipher built for teaching uses ephemeral ECDH and SHA-256-derived XOR keystream blocks. It lacks authenticated encryption, so it is malleable. Proper secp256k1 arithmetic cannot compensate for unsafe key generation or poorly designed encryption protocols. The restriction d <= 50,000 is a **deliberate key-generation weakness**. The absence of authentication is a **separate protocol-design weakness**. Thus the two problems must not be confused.
