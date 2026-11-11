# Reproducibility and mathematical checks

Run the included test script with `node LESSON5/test.js` from the repository root. The tests check continuous functions, discontinuities, singularities, pathological cases, numerical convergence and Gaussian CDF methods across negative and positive z-values.

## Expected integrals

| f(x) | domain | correct mathematical status | value |
|---|---|---|---:|
| sin(x) | [0,π] | Riemann + Lebesgue | 2 |
| x² | [0,1] | Riemann + Lebesgue | 1/3 |
| 1 for x<0.5; 3 else | [0,1] | Riemann + Lebesgue | 2 |
| abs(x−0.5) | [0,1] | Riemann + Lebesgue | 1/4 |
| x^(−1/2) | (0,1] | improper Riemann + Lebesgue (not proper Riemann) | 2 |
| 1 for x<0.5; 0 else | [0,1] | Riemann + Lebesgue | 1/2 |
| sin(x)/x with f(0)=1 | [0,π] | Riemann + Lebesgue | Si(π) ≈ 1.851937051982466 |
| Dirichlet χ_Q | [0,1] | **not** Riemann; Lebesgue | 0 (Lebesgue only) |
| Thomae | [0,1] | Riemann + Lebesgue | 0 |

## Methodology caveats

1. Value preimage measures are obtained by math formulas, not estimated by floating-point equality: μ{sin(x)≤y}=2arcsin(y), μ{x²≤y}=√y, μ{|x−0.5|≤y}=2y, μ{sinc(x)≤y}=π−sinc⁻¹(y). This allows meaningful domain vs range comparison, at the cost of assuming structural knowledge of the functions.
2. The Dirichlet and Thomae Lebesgue integrals are mathematical results from null support; they are not inferred from a finite sample. Uniform sample midpoints are rational.
3. For Thomae, an upper Darboux-sum bound is constructed by enumerating fractions of reduced denominator q≤Q. The remaining values are bounded by 1/(Q+1). This is a *valid upper bound*, not the exact upper Darboux sum.
4. Performance times measured in the browser are approximate and depend on the runtime, CPU, power state and JIT; operation count is the repeatable metric.
5. The NIST normal tables typically have 5 decimal places; the included high-precision lookup from SciPy `ndtr` is the numerical comparison baseline, with NIST independently supporting published key values.
