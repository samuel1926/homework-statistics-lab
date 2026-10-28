/* Statistics.Lab / Lecture 03. Original standalone, dependency-free Monte Carlo engine.
 * The generator is deterministic for a given 32-bit seed; it is not cryptographic.
 * Across all m attacker paths, increments are generated IID in the specified model.
 * The same 1,600-step paths provide four nested sample sizes (25/100/400/1600).
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SIZES = [25, 100, 400, 1600], END = SIZES.at(-1), SHOWN = 14;
  const SVG_NS = 'http://www.w3.org/2000/svg', SQRT2PI = Math.sqrt(2 * Math.PI);
  const COLORS = { purple: '#a497ff', mint: '#68e9d3', orange: '#eeac77' };
  const logFactorials = new Float64Array(END + 1);
  for (let i = 2; i <= END; i++) logFactorials[i] = logFactorials[i - 1] + Math.log(i);
  let experiment;

  function seededRandom(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function settings() {
    const model = document.querySelector('input[name="model"]:checked').value;
    return { model, n: Number($('control-n').value), m: Number($('control-m').value),
      p: Number($('control-p').value), seed: Number($('control-seed').value) >>> 0,
      mu: model === 'rademacher' ? 0 : Number($('control-p').value),
      v: model === 'rademacher' ? 1 : Number($('control-p').value) * (1 - Number($('control-p').value)) };
  }
  function simulate(s) {
    const rng = seededRandom(s.seed), distributions = Object.fromEntries(SIZES.map(n => [n, []]));
    const paths = [];
    for (let attacker = 0; attacker < s.m; attacker++) {
      let cumulative = 0, checkpointIndex = 0;
      const path = attacker < SHOWN ? new Int16Array(END + 1) : null;
      for (let t = 1; t <= END; t++) {
        const u = rng();
        cumulative += s.model === 'rademacher' ? (u < 0.5 ? 1 : -1) : (u < s.p ? 1 : 0);
        if (path) path[t] = cumulative;
        if (t === SIZES[checkpointIndex]) {
          distributions[t].push(cumulative);
          checkpointIndex++;
        }
      }
      if (path) paths.push(path);
    }
    return { s, distributions, paths, cache: new Map() };
  }
  function samples(n, quantity) {
    const key = n + '_' + quantity;
    if (experiment.cache.has(key)) return experiment.cache.get(key);
    const multiplier = quantity === 'total' ? 1 : quantity === 'average' ? 1 / n : 1 / Math.sqrt(n);
    const values = experiment.distributions[n].map(v => v * multiplier);
    experiment.cache.set(key, values);
    return values;
  }
  function theory(n, quantity) {
    const { mu, v } = experiment.s;
    if (quantity === 'total') return { mean: n * mu, variance: n * v };
    if (quantity === 'average') return { mean: mu, variance: v / n };
    if (quantity === 'normalized') return { mean: mu * Math.sqrt(n), variance: v };
    throw new Error('Unknown quantity');
  }
  function moments(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
    return { mean, variance };
  }
  function number(v, digits = 3) {
    if (!Number.isFinite(v)) return '—';
    if (v === 0) return '0';
    if (digits === 0) return Math.round(v).toLocaleString('en-US');
    const a = Math.abs(v);
    if (a >= 100000) return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);
    if (a >= 1000) return Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(v);
    if (a < 0.0001) return v.toExponential(2);
    if (a < 0.01) return v.toFixed(5).replace(/0+$/, '').replace(/\.$/, '');
    return v.toFixed(digits).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  const percent = v => (100 * v).toFixed(v < 0.01 ? 2 : 1) + '%';
  function create(tag, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, String(val));
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function line(parent, x1, y1, x2, y2, color, width = 1, dash = '') {
    const attrs = { x1, y1, x2, y2, stroke: color, 'stroke-width': width };
    if (dash) attrs['stroke-dasharray'] = dash;
    parent.append(create('line', attrs));
  }
  function path(parent, d, cssClass = '', stroke = null, width = null) {
    const attrs = { d, class: cssClass };
    if (stroke) attrs.stroke = stroke;
    if (width) attrs['stroke-width'] = width;
    const el = create('path', attrs); parent.append(el); return el;
  }
  function text(parent, x, y, label, anchor = 'middle', klass = '') {
    parent.append(create('text', { x, y, 'text-anchor': anchor, class: klass }, label));
  }
  function svgChart(container, { width = 720, height = 300, xmin = 0, xmax = 1, ymin = 0, ymax = 1, xTicks = [], yTicks = [], margin = { left: 64, right: 20, top: 19, bottom: 40 }, yFormat = number, xFormat = number }) {
    const svg = create('svg', { viewBox: `0 0 ${width} ${height}`, xmlns: SVG_NS, 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid meet' });
    const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
    const x = v => margin.left + (v - xmin) / (xmax - xmin) * plotW;
    const y = v => margin.top + (1 - (v - ymin) / (ymax - ymin)) * plotH;
    for (const t of yTicks) {
      line(svg, margin.left, y(t), width - margin.right, y(t), '#36415a', 1);
      text(svg, margin.left - 11, y(t) + 4, yFormat(t), 'end');
    }
    for (const t of xTicks) {
      line(svg, x(t), margin.top, x(t), height - margin.bottom, '#2e3a52', 0.7);
      text(svg, x(t), height - margin.bottom + 19, xFormat(t));
    }
    line(svg, margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, '#687591', 1.1);
    container.replaceChildren(svg);
    return { svg, x, y, width, height, margin, plotW, plotH };
  }
  function updateKpis() {
    const s = experiment.s, raw = samples(s.n, 'total'), mean = moments(samples(s.n, 'average'));
    $('kpi-trials').textContent = number(s.n * s.m, 0);
    $('kpi-mean').textContent = number(mean.mean, 4);
    $('kpi-mean-note').textContent = 'Theoretical μ = ' + number(s.mu, 3);
    $('kpi-var').textContent = number(moments(samples(s.n, 'normalized')).variance, 4);
    $('kpi-var-note').textContent = 'Theoretical σ² = ' + number(s.v, 4);
    $('kpi-max').textContent = number(Math.max(...raw), 0);
    $('kpi-max-note').textContent = 'Largest of ' + number(s.m, 0) + ' paths';
  }
  function renderTrajectories() {
    const s = experiment.s, mode = document.querySelector('input[name="path-stat"]:checked').value;
    const n = s.n, scale = (v, t) => mode === 'total' ? v : mode === 'average' ? v / t : v / Math.sqrt(t);
    const timing = Array.from({ length: Math.min(n, 235) + 1 }, (_, i) => Math.max(1, Math.round(i * n / Math.min(n, 235))));
    timing[0] = 1; timing[timing.length - 1] = n;
    const mu = t => scale(t * s.mu, t);
    const sd = t => Math.sqrt(t * s.v) / (mode === 'total' ? 1 : mode === 'average' ? t : Math.sqrt(t));
    const ys = timing.flatMap(t => [mu(t) - 2 * sd(t), mu(t) + 2 * sd(t), ...experiment.paths.map(p => scale(p[t], t))]);
    if (mode !== 'average') ys.push(0);
    const low = Math.min(...ys), high = Math.max(...ys), padding = Math.max((high - low) * 0.08, 0.1);
    const bottom = low - padding, top = high + padding;
    const yTicks = Array.from({ length: 5 }, (_, i) => bottom + (top - bottom) * i / 4);
    const xTicks = [0, .25, .5, .75, 1].map(f => Math.round(1 + f * (n - 1)));
    const { svg, x, y } = svgChart($('trajectory-plot'), { width: 1050, height: 350, xmin: 1, xmax: n, ymin: bottom, ymax: top, xTicks, yTicks, yFormat: v => number(v, 2), xFormat: v => number(v, 0) });
    let band = timing.map((t, i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(mu(t) + 2 * sd(t)).toFixed(1)}`).join(' ');
    band += ' ' + timing.slice().reverse().map(t => `L${x(t).toFixed(1)},${y(mu(t) - 2 * sd(t)).toFixed(1)}`).join(' ') + ' Z';
    path(svg, band, 'band-fill');
    for (const [index, scores] of experiment.paths.entries()) {
      const d = timing.map((t, j) => `${j ? 'L' : 'M'}${x(t).toFixed(2)},${y(scale(scores[t], t)).toFixed(2)}`).join(' ');
      path(svg, d, index === 0 ? 'path-line path-highlight' : 'path-line');
    }
    path(svg, timing.map((t, i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(mu(t)).toFixed(1)}`).join(' '), 'theory-line');
    $('trajectories-caption').textContent = `First ${SHOWN} of ${s.m} simulated attackers · ${n} IID steps each · ${mode} score`;
    $('path-interpretation').textContent = mode === 'total' ? 'Raw totals: the uncertainty band spreads with √t. The mean is ' + (s.model === 'bernoulli' ? 'p × t, so successful attacks accumulate with the number of systems.' : 'zero, but individual signed walks can drift far away from it.') : mode === 'average' ? `Averages: the band contracts as 1/√t around μ = ${number(s.mu)}. This is the Law of Large Numbers in action (and a finite-t uncertainty envelope).` : `Root-t totals: the standard deviation remains σ = ${number(Math.sqrt(s.v))}. ${s.model === 'bernoulli' ? 'The mean still increases as p√t, so this is NOT a standard-normal limit.' : 'The mean remains zero, making the standard-normal CLT possible.'}`;
  }
  function normalDensity(x, mu, sd) { const z = (x - mu) / sd; return Math.exp(-z * z / 2) / (SQRT2PI * sd); }
  function bins(values, xmin, xmax, count) {
    const result = Array(count).fill(0), step = (xmax - xmin) / count;
    for (const v of values) result[Math.max(0, Math.min(count - 1, Math.floor((v - xmin) / step)))]++;
    return result.map(v => v / (values.length * step));
  }
  function densityChart(container, values, { mean = 0, sd = 1, fixedRange = null, count = 24, compact = false } = {}) {
    const minSample = Math.min(...values), maxSample = Math.max(...values);
    const xMin = fixedRange ? fixedRange[0] : Math.min(minSample, mean - 3.8 * sd);
    const xMax = fixedRange ? fixedRange[1] : Math.max(maxSample, mean + 3.8 * sd);
    const density = bins(values, xMin, xMax, count), barWidth = (xMax - xMin) / count;
    const yMax = Math.max(...density, normalDensity(mean, mean, sd)) * 1.16;
    const { svg, x, y } = svgChart(container, { width: compact ? 520 : 450, height: compact ? 235 : 255,
      xmin: xMin, xmax: xMax, ymin: 0, ymax: yMax,
      margin: { left: compact ? 43 : 46, right: 14, top: 12, bottom: 31 },
      xTicks: [xMin, (xMin + xMax) / 2, xMax], yTicks: [0, yMax / 2, yMax],
      xFormat: v => number(v, 2), yFormat: v => number(v, 2) });
    density.forEach((d, i) => {
      const bx = x(xMin + i * barWidth) + 0.4;
      svg.append(create('rect', { class: 'bar', x: bx, y: y(d), width: Math.max(0.1, x(xMin + (i + 1) * barWidth) - bx - 0.9), height: Math.max(0, y(0) - y(d)) }));
    });
    let d = '';
    for (let i = 0; i <= 130; i++) {
      const xx = xMin + (xMax - xMin) * i / 130;
      d += `${i ? 'L' : 'M'}${x(xx).toFixed(2)},${y(normalDensity(xx, mean, sd)).toFixed(2)} `;
    }
    path(svg, d, 'normal-line');
  }
  function renderDistributions() {
    const n = experiment.s.n;
    for (const quantity of ['total', 'average', 'normalized']) {
      const values = samples(n, quantity), target = theory(n, quantity), measured = moments(values);
      densityChart($(`hist-${quantity}`), values, { mean: target.mean, sd: Math.sqrt(target.variance) });
      $(`hist-${quantity}-mean`).textContent = `${number(measured.mean)} / ${number(target.mean)}`;
      $(`hist-${quantity}-var`).textContent = `${number(measured.variance)} / ${number(target.variance)}`;
    }
    $('distribution-interpretation').innerHTML = experiment.s.model === 'rademacher' ?
      '<strong>Symmetric case:</strong> The total broadens as n grows, the average concentrates at zero, and the root-n normalized total keeps variance 1 and mean 0. The latter is the CLT scale.' :
      '<strong>Positive-drift case:</strong> The average concentrates around p, while the total increases with n. The variance of S<sub>n</sub>/√n stays at p(1−p), but its mean is p√n and moves right: it does <em>not</em> converge to N(0,1) without centering.';
  }
  function renderVariancePlot() {
    const logScale = v => Math.log10(v), maxN = END;
    const { svg, x, y } = svgChart($('variance-plot'), { width: 620, height: 315, xmin: 0, xmax: 3, ymin: -3.6, ymax: 3.6,
      xTicks: [0, 1, 2, 3], yTicks: [-3, -2, -1, 0, 1, 2, 3],
      xFormat: v => number(SIZES[v], 0), yFormat: v => '10^' + number(v, 0) });
    const curves = [
      [n => n, COLORS.purple], [n => 1 / n, COLORS.mint], [() => 1, COLORS.orange]
    ];
    curves.forEach(([fn, color]) => {
      const d = SIZES.map((n, i) => `${i ? 'L' : 'M'}${x(i)},${y(logScale(fn(n)))}`).join(' ');
      path(svg, d, '', color, 3);
      for (let i = 0; i < 4; i++) svg.append(create('circle', { cx: x(i), cy: y(logScale(fn(SIZES[i]))), r: 4.5, fill: color, stroke: '#151b2c', 'stroke-width': 2 }));
    });
    text(svg, 325, 309, 'SYSTEM COUNT n', 'middle', 'axis-label');
  }
  function renderVarianceTable() {
    const tbody = $('variance-table'); tbody.replaceChildren();
    for (const n of SIZES) {
      const tr = document.createElement('tr');
      const makeCell = (head, observed) => { const td = document.createElement('td');
        const left = document.createElement('span'); left.textContent = number(head, 5) + ' → ';
        const b = document.createElement('b'); b.textContent = number(observed, 5);
        td.append(left, b); return td; };
      const nCell = document.createElement('td'); nCell.textContent = n; tr.append(nCell);
      for (const quantity of ['total', 'average', 'normalized']) tr.append(makeCell(theory(n, quantity).variance, moments(samples(n, quantity)).variance));
      tr.append(makeCell(experiment.s.mu, moments(samples(n, 'average')).mean));
      tbody.append(tr);
    }
  }
  function renderLLN() {
    const { s } = experiment, epsilon = Number($('control-epsilon').value);
    $('epsilon-label').textContent = epsilon.toFixed(2);
    const obs = SIZES.map(n => samples(n, 'average').filter(v => Math.abs(v - s.mu) > epsilon + 1e-12).length / s.m);
    const bound = SIZES.map(n => Math.min(1, s.v / (n * epsilon * epsilon)));
    const { svg, x, y } = svgChart($('lln-plot'), { width: 620, height: 315, xmin: -.6, xmax: 3.6, ymin: 0, ymax: 1.05,
      xTicks: [0, 1, 2, 3], yTicks: [0, .25, .5, .75, 1],
      xFormat: v => number(SIZES[v], 0), yFormat: v => number(v, 2) });
    SIZES.forEach((n, i) => {
      for (const [dx, val, color] of [[-.16, obs[i], COLORS.purple], [.16, bound[i], COLORS.orange]]) {
        const width = 33, xx = x(i + dx) - width / 2;
        svg.append(create('rect', { x: xx, y: y(val), width, height: Math.max(0, y(0) - y(val)), rx: 2, fill: color, opacity: .87 }));
      }
      text(svg, x(i), y(1.015), number(obs[i], 2), 'middle', 'axis-label');
    });
    text(svg, 340, 309, 'SYSTEM COUNT n', 'middle', 'axis-label');
    $('lln-note').textContent = `At n = ${END}, ${obs.at(-1) * s.m} of ${s.m} attackers had |Sₙ/n − μ| > ${epsilon.toFixed(2)}. Chebyshev: P(deviation) ≤ σ²/(n ε²) = ${number(bound.at(-1), 5)} (clipped at 1 in plot).`;
  }
  // Abramowitz-Stegun normal-CDF approximation. Error < 1e-7 for finite x.
  function normalCDF(z) {
    const a = Math.abs(z), t = 1 / (1 + .2316419 * a), d = Math.exp(-a * a / 2) / SQRT2PI;
    const tail = d * t * (.319381530 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + 1.330274429 * t))));
    return z < 0 ? tail : 1 - tail;
  }
  function ksDistance(data) {
    const values = data.slice().sort((a, b) => a - b);
    let maxD = 0;
    values.forEach((z, i) => { const p = normalCDF(z); maxD = Math.max(maxD, Math.abs(i / values.length - p), Math.abs((i + 1) / values.length - p)); });
    return maxD;
  }
  function renderCLT() {
    const s = experiment.s, isSym = s.model === 'rademacher';
    $('clt-lead').innerHTML = isSym ?
      'In the Rademacher case, <strong>S<sub>n</sub>/√n converges in distribution to the standard normal N(0,1).</strong> Compare histograms across increasing n.' :
      'In the Bernoulli case, <strong>S<sub>n</sub>/√n does not approach N(0,1)</strong> because its mean grows as p√n. Instead, compare the <em>centered and standardized</em> totals below.';
    $('clt-equation').innerHTML = isSym ? 'Z<sub>n</sub> = S<sub>n</sub> / √n ⇒ N(0, 1)' : 'Z<sub>n</sub> = (S<sub>n</sub> − np) / √(np(1−p)) ⇒ N(0, 1)';
    $('clt-equation-note').textContent = isSym ? 'Mean 0, variance 1 exactly for each n; the shape becomes Gaussian as n grows.' : 'Centering removes the growing mean; division by the true standard deviation makes variance 1.';
    $('clt-warning').innerHTML = isSym ?
      '<strong>What convergence means.</strong> The distribution of the normalized sum approaches N(0,1), not an individual path. D is the observed CDF distance; with a finite number of attackers, it need not decrease strictly with n.' :
      '<strong>Do not confuse the normalizations.</strong> For Bernoulli, S<sub>n</sub>/√n has constant variance p(1−p) but mean p√n. The CLT requires the centered variable (S<sub>n</sub>−np)/√(np(1−p)). The plots show this latter quantity, <em>not</em> uncentered S<sub>n</sub>/√n.';
    for (const n of SIZES) {
      const scores = experiment.distributions[n];
      const z = scores.map(v => (v - n * s.mu) / Math.sqrt(n * s.v));
      densityChart($(`clt-${n}`), z, { mean: 0, sd: 1, fixedRange: [-4, 4], count: 30, compact: true });
      $(`clt-d-${n}`).textContent = 'D = ' + number(ksDistance(z), 3);
    }
  }
  function exactUpperTail(n, p, cutoff) {
    const k0 = Math.max(0, Math.ceil(cutoff - 1e-10));
    if (k0 <= 0) return 1;
    if (k0 > n) return 0;
    let result = 0;
    for (let k = k0; k <= n; k++) {
      const logProb = logFactorials[n] - logFactorials[k] - logFactorials[n - k] + k * Math.log(p) + (n - k) * Math.log1p(-p);
      result += Math.exp(logProb);
    }
    return Math.min(1, Math.max(0, result));
  }
  function renderAttackers() {
    const s = experiment.s, totals = experiment.distributions[s.n], actualSum = totals.reduce((a, b) => a + b, 0);
    $('agg-score').textContent = number(actualSum, 0);
    $('agg-mean').textContent = number(s.m * s.n * s.mu, 0);
    $('agg-var').textContent = number(s.m * s.n * s.v, 1);
    const threshold = s.n * s.mu + 3 * Math.sqrt(s.n * s.v);
    const successes = totals.filter(v => v >= threshold).length;
    const cutoff = s.model === 'rademacher' ? (threshold + s.n) / 2 : threshold;
    const q = exactUpperTail(s.n, s.model === 'rademacher' ? 0.5 : s.p, cutoff);
    const chance = -Math.expm1(s.m * Math.log1p(-q));
    $('risk-threshold').textContent = number(threshold, 2);
    $('risk-q').textContent = percent(q);
    $('risk-any').textContent = percent(Math.min(1, Math.max(0, chance)));
    $('risk-note').textContent = `The exact IID-model one-attacker tail probability is q = ${number(q, 6)} (binomial tail with the discrete threshold). The simulation observed ${successes} of ${s.m} attackers exceeding it. The at-least-one probability uses the exact q and independence; small empirical counts can be noisy.`;
  }
  function render() {
    updateKpis(); renderTrajectories(); renderDistributions(); renderVariancePlot();
    renderVarianceTable(); renderLLN(); renderCLT(); renderAttackers();
  }
  function run() {
    const s = settings();
    experiment = simulate(s);
    render();
    $('run-status').textContent = `Complete · ${number(s.m, 0)} paths × ${END} draws · seed ${s.seed} · viewing n=${s.n}`;
  }
  const pSlider = $('control-p');
  function updateProbabilityControl() {
    const symmetric = document.querySelector('input[name="model"]:checked').value === 'rademacher';
    pSlider.disabled = symmetric;
    $('p-label').textContent = Number(pSlider.value).toFixed(2);
    $('p-help').textContent = symmetric ? 'Inactive: P(+1) = P(−1) = 0.5 by definition.' : 'Success chance for every Bernoulli attempt.';
  }
  document.querySelectorAll('input[name="model"]').forEach(input => input.addEventListener('change', () => { updateProbabilityControl(); run(); }));
  for (const id of ['control-n', 'control-m']) $(id).addEventListener('change', run);
  pSlider.addEventListener('input', () => { $('p-label').textContent = Number(pSlider.value).toFixed(2); });
  pSlider.addEventListener('change', run);
  $('control-seed').addEventListener('change', () => {
    const num = Number($('control-seed').value);
    if (!Number.isInteger(num) || num < 0 || num > 4294967295) $('control-seed').value = '20261028';
    run();
  });
  $('new-seed').addEventListener('click', () => { $('control-seed').value = String((Number($('control-seed').value) + 1) >>> 0); run(); });
  $('run-simulation').addEventListener('click', run);
  document.querySelectorAll('input[name="path-stat"]').forEach(input => input.addEventListener('change', renderTrajectories));
  $('control-epsilon').addEventListener('input', () => { if (experiment) renderLLN(); });
  updateProbabilityControl(); run();
})();
