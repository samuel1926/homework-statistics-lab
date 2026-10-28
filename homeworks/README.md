# Statistics.Lab — Lesson 03 / Stochastic Penetration Scores

Samuele Tortora · Student ID 2344522 · Third lecture

This is the **third page of the same Statistics.Lab website**, at `homeworks/lesson-03/`.
No build step, backend, package installation, CDN charting library, or user data is required. All simulation, plots and statistical calculations run offline in modern browser JavaScript (fonts may fall back when offline).

## Model and semantics

For each attacker `a = 1,...,m` and each system `i = 1,...,n`, simulate IID increments `X[a,i]`, **also independent across attackers**.

- Bernoulli: P(X=1)=p, P(X=0)=1-p, mean μ=p and variance σ²=p(1-p). `S_n` is number of successes (given the simplified interpretation that each system is a separate independent attempt).
- Rademacher: P(X=+1)=P(X=-1)=1/2, mean μ=0 and variance σ²=1. `S_n` is a **signed** net score, not a count of compromises.

The simulated system sizes are `n ∈ {25,100,400,1600}`, and number of attackers `m ∈ {100,500,1000,2000}`. All four system sizes use *prefixes of the same n=1600 paths*, for an apples-to-apples coupled comparison; their per-size distributions are still correct. Each attacker has independent draws across steps. Generator is `mulberry32`, deterministic and not cryptographically secure. Choose a different seed to change the Monte Carlo sample.

## Exact theoretical quantities

`E[S_n]=nμ`, `Var(S_n)=nσ²`.
`E[S_n/n]=μ`, `Var(S_n/n)=σ²/n`.
`E[S_n/√n]=√n μ`, `Var(S_n/√n)=σ²`.

Law of Large Numbers in probability, by Chebyshev's inequality:

`P(|S_n/n - μ| > ε) ≤ σ²/(n ε²) -> 0` for any fixed `ε>0`.

Rademacher Central Limit Theorem:

`S_n/√n ⇒ N(0,1)` as `n->∞`.

Bernoulli **requires centering and variance standardization** for a standard-normal CLT:

`(S_n - np) / √[np(1-p)] ⇒ N(0,1)` for `0<p<1`.

With `p>0`, the uncentered `S_n/√n` has mean `p√n` and is **not** asymptotically standard normal, even though its variance is constant.

## Charts and diagnostics

1. Independent attacker trajectory visualization. Shows first 14 paths for readability; all m paths are included in every estimate, histogram and diagnostic.
2. Three empirical density histograms at selected n, each overlaid with a normal approximation having its **own exact theoretical mean and variance**.
3. Theoretical variance plot on a logarithmic axis, after dividing by σ²: `n`, `1/n`, `1`.
4. Table of exact theoretical variance compared with unbiased sample variance (denominator `m-1`).
5. Empirical tail probability `P(|S_n/n-μ|>ε)` compared with Chebyshev bound capped at 1 for plotting.
6. CLT: four empirical histograms of the properly centered standardized variable, compared against N(0,1); CDF discrepancy reported by empirical Kolmogorov distance `D`.
7. Independent-attacker aggregate sum `A_mn`, whose theoretical mean is `mnμ` and variance `mnσ²`; high-score event probability uses an **exact binomial tail** calculated in log space, then `1-(1-q)^m`. It is contrasted with the observed event count across the m simulated attackers.

## Cautions

- Sample paths and empirical histograms do not prove convergence. Finite samples can fluctuate nonmonotonically, including Kolmogorov distances.
- Approximate normal curves for total and average score are descriptive overlays (exact finite-n distributions remain discrete).
- Increasing m does not alter the marginal law of one attacker's score. It provides more observations, a larger aggregate and a higher chance of seeing at least one rare event.
- The IID assumption ignores shared defense configuration, common vulnerabilities, coordination, and adaptive attackers; interpret results as a probabilistic teaching model, not an operational penetration-risk forecast.
