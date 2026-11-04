/* STATISTICS.LAB — LESSON 04
   Welford: online, one-pass sample moments.
   Monte Carlo: independent discrete uniform integer scores X ~ Uniform{0,...,10}.
   E[X] = 5, Var(X) = 10, E[(X-5)^4] = 178.
   Seeded Mulberry32 is for reproducible educational simulation, NOT cryptography.
*/
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SIZES = [5, 10, 25, 50, 100, 400, 1600];
  const MAX_N = SIZES[SIZES.length - 1];
  const MU = 5, SIGMA2 = 10, FOURTH = 178;
  const VIOLET = '#aa99ff', TEAL = '#69ebd4', GRID = '#34415c', LABEL = '#9dacc4';
  const NS = 'http://www.w3.org/2000/svg';
  let result = null;
  const fmt = (x, digits = 3) => Number.isFinite(x) ? x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';

  // --- Part 1: small exact walkthrough ---
  const INPUTS = [2, 8, 4, 10, 6];
  const steps = [];
  let stepIndex = 0;
  {
    let mean = 0, M2 = 0;
    INPUTS.forEach((x, i) => {
      const k = i + 1, oldMean = mean, delta = x - mean;
      mean += delta / k;
      M2 += delta * (x - mean);
      steps.push({ k, x, oldMean, delta, mean, M2, variance: k > 1 ? M2 / (k - 1) : NaN });
    });
  }
  function renderStep() {
    $('step-count').textContent = String(stepIndex);
    $('step-mean').textContent = stepIndex ? fmt(steps[stepIndex - 1].mean, 3) : '0';
    $('step-m2').textContent = stepIndex ? fmt(steps[stepIndex - 1].M2, 3) : '0';
    $('step-variance').textContent = stepIndex ? fmt(steps[stepIndex - 1].variance, 3) : '—';
    $('step-prev').disabled = stepIndex === 0;
    $('step-next').disabled = stepIndex === INPUTS.length;
    $('step-next').textContent = stepIndex === INPUTS.length ? 'Sequence complete ✓' : 'Next value →';
    $('step-title').textContent = stepIndex ? `Processed ${stepIndex} of ${INPUTS.length} observations` : 'Before the first observation';
    $('step-tokens').replaceChildren(...INPUTS.map((x, i) => {
      const el = document.createElement('div');
      el.className = 'l4-step-token' + (i < stepIndex ? ' done' : '') + (i === stepIndex - 1 ? ' current' : '');
      el.textContent = String(x);
      el.setAttribute('title', `x${i + 1} = ${x}`);
      return el;
    }));
    const tbody = $('step-tbody');
    if (!stepIndex) tbody.innerHTML = '<tr><td colspan="6" class="l4-empty">No observations processed yet.</td></tr>';
    else tbody.innerHTML = steps.slice(0, stepIndex).map(s => `
      <tr ${s.k === stepIndex ? 'class="l4-highlight"' : ''}><td>${s.k}</td><td>${s.x}</td><td>${fmt(s.delta)}</td><td>${fmt(s.mean)}</td><td>${fmt(s.M2)}</td><td>${fmt(s.variance)}</td></tr>`).join('');
    if (!stepIndex) $('step-detail').textContent = 'Click “Next value” to process x₁ = 2.';
    else {
      const s = steps[stepIndex - 1];
      $('step-detail').textContent = `k = ${s.k} · x = ${s.x} · δ = ${fmt(s.x - s.oldMean)} · new mean = ${fmt(s.oldMean)} + (${fmt(s.delta)} / ${s.k}) = ${fmt(s.mean)} · SS = ${fmt(s.M2)}${s.k < 2 ? ' · sample variance undefined for k = 1' : ` · s² = ${fmt(s.variance)}`}`;
    }
  }
  $('step-prev').addEventListener('click', () => { stepIndex = Math.max(0, stepIndex - 1); renderStep(); });
  $('step-next').addEventListener('click', () => { stepIndex = Math.min(INPUTS.length, stepIndex + 1); renderStep(); });
  $('step-reset').addEventListener('click', () => { stepIndex = 0; renderStep(); });
  renderStep();

  $('uniform-bars').replaceChildren(...Array.from({ length: 11 }, (_, i) => {
    const bar = document.createElement('div');
    bar.className = 'l4-uniform-bar';
    bar.innerHTML = `<span title="P(X = ${i}) = 1/11"></span><b>${i}</b>`;
    return bar;
  }));

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const node = $(button.dataset.copy);
      if (!node) return;
      const code = node.textContent;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code);
        else {
          const tmp = document.createElement('textarea');
          tmp.value = code; tmp.style.position = 'fixed'; tmp.style.left = '-9999px';
          document.body.appendChild(tmp); tmp.select();
          const copied = document.execCommand('copy'); tmp.remove();
          if (!copied) throw new Error('Clipboard unavailable');
        }
        button.textContent = 'Copied ✓';
      } catch (_) { button.textContent = 'Select code to copy'; }
    });
  });

  // --- Part 2: seeded Monte Carlo engine with nested prefixes ---
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function moments(array) {
    // Compute dispersion of independent replications with another Welford pass.
    let mean = 0, m2 = 0;
    for (let i = 0; i < array.length; i++) {
      const delta = array[i] - mean;
      mean += delta / (i + 1);
      m2 += delta * (array[i] - mean);
    }
    return { mean, variance: array.length > 1 ? m2 / (array.length - 1) : NaN,
      sd: array.length > 1 ? Math.sqrt(m2 / (array.length - 1)) : NaN };
  }
  function readSettings() {
    const n = Number($('control-n').value), m = Number($('control-m').value);
    const seedText = $('control-seed').value.trim();
    const seedValue = Number(seedText);
    if (!seedText || !Number.isSafeInteger(seedValue) || seedValue < 0 || seedValue > 4294967295) {
      throw new Error('Seed must be an integer between 0 and 4,294,967,295.');
    }
    return { n, m, seed: seedValue >>> 0 };
  }
  function simulate(m, seed) {
    const rng = mulberry32(seed);
    const byN = new Map(SIZES.map(n => [n, { means: new Float64Array(m), variances: new Float64Array(m) }]));
    const paths = [];
    for (let attacker = 0; attacker < m; attacker++) {
      let mean = 0, M2 = 0, cp = 0;
      const path = attacker < 8 ? new Float64Array(MAX_N + 1) : null;
      for (let k = 1; k <= MAX_N; k++) {
        // All 11 integer outcomes have probability exactly 1/11 in the idealized model.
        const x = Math.floor(11 * rng());
        const delta = x - mean;
        mean += delta / k;
        M2 += delta * (x - mean);
        if (path) path[k] = mean;
        if (k === SIZES[cp]) {
          const row = byN.get(k);
          row.means[attacker] = mean;
          row.variances[attacker] = M2 / (k - 1); // unbiased, k >= 2
          cp++;
        }
      }
      if (path) paths.push(path);
    }
    const summaries = new Map(SIZES.map(n => {
      const row = byN.get(n);
      return [n, { mean: moments(row.means), variance: moments(row.variances) }];
    }));
    return { settings: { m, seed }, byN, summaries, paths };
  }

  // --- SVG graphics: no external charting libraries ---
  function el(tag, attrs = {}, label) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    if (label !== undefined) node.textContent = String(label);
    return node;
  }
  function addLine(svg, x1, y1, x2, y2, stroke = GRID, width = 1, dash = '') {
    const attrs = { x1, y1, x2, y2, stroke, 'stroke-width': width };
    if (dash) attrs['stroke-dasharray'] = dash;
    svg.append(el('line', attrs));
  }
  function addText(svg, x, y, value, anchor = 'middle', fill = LABEL, size = 11) {
    svg.append(el('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'ui-monospace, monospace' }, value));
  }
  function chartBase(container, { width = 720, height = 295, left = 58, right = 24, top = 24, bottom = 41 } = {}) {
    const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid meet' });
    container.replaceChildren(svg);
    return { svg, width, height, left, right, top, bottom, w: width - left - right, h: height - top - bottom };
  }
  function axes(ch, xmin, xmax, ymin, ymax, xTicks, yTicks, xf = v => fmt(v, 1), yf = v => fmt(v, 0)) {
    const x = v => ch.left + (v - xmin) / (xmax - xmin || 1) * ch.w;
    const y = v => ch.top + ch.h - (v - ymin) / (ymax - ymin || 1) * ch.h;
    for (const v of yTicks) {
      addLine(ch.svg, ch.left, y(v), ch.left + ch.w, y(v), GRID, 1);
      addText(ch.svg, ch.left - 10, y(v) + 4, yf(v), 'end');
    }
    for (const v of xTicks) {
      addLine(ch.svg, x(v), ch.top, x(v), ch.top + ch.h, '#2d3b55', 0.6);
      addText(ch.svg, x(v), ch.top + ch.h + 20, xf(v));
    }
    addLine(ch.svg, ch.left, ch.top + ch.h, ch.left + ch.w, ch.top + ch.h, '#7d8da9', 1);
    return { x, y };
  }
  function polyline(svg, coords, color, width, opacity = 1, dash = '') {
    if (!coords.length) return;
    const attrs = { d: coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(2)},${c[1].toFixed(2)}`).join(' '), fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity };
    if (dash) attrs['stroke-dasharray'] = dash;
    svg.append(el('path', attrs));
  }
  function histogram(container, values, target, xlabel) {
    const ch = chartBase(container, { width: 660, height: 296, left: 51, right: 24, top: 25, bottom: 45 });
    const minObs = Math.min(...values), maxObs = Math.max(...values);
    const spread = Math.max(maxObs - minObs, 0.0001);
    const pad = Math.max(spread * 0.10, Math.abs(target - minObs) * .07, Math.abs(target - maxObs) * .07, 0.0001);
    const min = Math.min(minObs, target) - pad, max = Math.max(maxObs, target) + pad;
    const bins = 25, counts = Array(bins).fill(0);
    for (const v of values) {
      const idx = Math.max(0, Math.min(bins - 1, Math.floor((v - min) / (max - min) * bins)));
      counts[idx]++;
    }
    const yMax = Math.max(5, Math.max(...counts)) * 1.16;
    const roundTick = v => v.toFixed((max - min) < 1 ? 2 : 1);
    const { x, y } = axes(ch, min, max, 0, yMax, [0,1,2,3,4].map(i => min + (max - min) * i / 4), [0,.25,.5,.75,1].map(i => yMax * i), roundTick, v => String(Math.round(v)));
    const bw = ch.w / bins;
    counts.forEach((count, i) => {
      const posX = ch.left + bw * i + .9, topY = y(count);
      ch.svg.append(el('rect', { x: posX, y: topY, width: Math.max(.8, bw - 2), height: Math.max(0, ch.top + ch.h - topY), fill: VIOLET, opacity: .8, rx: 2 }));
    });
    addLine(ch.svg, x(target), ch.top + 2, x(target), ch.top + ch.h, TEAL, 2.5, '6 5');
    addText(ch.svg, Math.min(ch.width - 72, Math.max(77, x(target))), 15, `target ${fmt(target, 0)}`, 'middle', TEAL, 11);
    addText(ch.svg, ch.width - 21, ch.height - 7, xlabel, 'end', LABEL, 10);
  }
  function drawPaths(container, paths, n) {
    const ch = chartBase(container, { width: 880, height: 323, left: 51, right: 23, top: 23, bottom: 46 });
    const samples = Math.min(n, 250);
    const times = Array.from({ length: samples }, (_, i) => Math.max(1, Math.round(1 + i * (n - 1) / Math.max(1, samples - 1))));
    const tickN = [1, Math.max(1, Math.round(n * .25)), Math.max(1, Math.round(n * .5)), Math.max(1, Math.round(n * .75)), n];
    const { x, y } = axes(ch, 1, Math.max(2, n), 0, 10, [...new Set(tickN)], [0,2,4,6,8,10], v => String(Math.round(v)), v => String(v));
    // Draw theoretical ±2 SD band, clipped to the valid score range.
    const upper = times.map(t => [x(t), y(Math.min(10, MU + 2 * Math.sqrt(SIGMA2 / t)))]);
    const lower = times.slice().reverse().map(t => [x(t), y(Math.max(0, MU - 2 * Math.sqrt(SIGMA2 / t)))]);
    ch.svg.append(el('path', { d: [...upper, ...lower].map((p,i) => `${i?'L':'M'}${p[0]},${p[1]}`).join(' ') + 'Z', fill: '#7e77b0', opacity: .16 }));
    paths.forEach((path, idx) => polyline(ch.svg, times.map(t => [x(t), y(path[t])]), idx % 2 ? '#68e0d0' : '#b19cff', 1.35, .28 + idx * .06));
    addLine(ch.svg, ch.left, y(MU), ch.left + ch.w, y(MU), TEAL, 2.1, '6 5');
    addText(ch.svg, ch.width - 21, ch.height - 7, 'systems →', 'end', LABEL, 11);
  }
  function drawConvergence(container, summaries) {
    const ch = chartBase(container, { width: 880, height: 324, left: 57, right: 24, top: 24, bottom: 49 });
    const obs = SIZES.map(n => summaries.get(n).mean.sd), th = SIZES.map(n => Math.sqrt(SIGMA2 / n));
    const yMax = Math.max(...obs, ...th) * 1.20;
    const { x, y } = axes(ch, 0, SIZES.length - 1, 0, yMax, [0,1,2,3,4,5,6], [0,.25,.5,.75,1].map(v => v * yMax), idx => SIZES[idx], v => fmt(v, 2));
    polyline(ch.svg, obs.map((v,i) => [x(i), y(v)]), VIOLET, 2.8);
    polyline(ch.svg, th.map((v,i) => [x(i), y(v)]), TEAL, 2.5, 1, '7 5');
    obs.forEach((v,i) => ch.svg.append(el('circle', { cx: x(i), cy: y(v), r: 4.1, fill: VIOLET, stroke: '#e3dcff', 'stroke-width': 1 })));
    th.forEach((v,i) => ch.svg.append(el('circle', { cx: x(i), cy: y(v), r: 3.1, fill: TEAL })));
    addText(ch.svg, ch.width - 21, ch.height - 7, 'systems per hacker (n) →', 'end', LABEL, 11);
  }
  function theoryVarS2(n) {
    // Var(s²) = [μ4 − ((n−3)/(n−1)) σ^4] / n.
    return (FOURTH - (n - 3) / (n - 1) * SIGMA2 ** 2) / n;
  }
  function render() {
    if (!result) return;
    const { settings, byN, summaries, paths } = result;
    const n = Number($('control-n').value), m = settings.m;
    const a = summaries.get(n);
    const row = byN.get(n);
    $('kpi-mean').textContent = fmt(a.mean.mean, 4);
    $('kpi-var').textContent = fmt(a.variance.mean, 4);
    $('kpi-sd-mean').textContent = fmt(a.mean.sd, 4);
    $('kpi-sd-var').textContent = fmt(a.variance.sd, 4);
    $('mean-delta').textContent = `μ = 5 · signed error ${a.mean.mean - MU >= 0 ? '+' : ''}${fmt(a.mean.mean - MU, 4)}`;
    $('var-delta').textContent = `σ² = 10 · signed error ${a.variance.mean - SIGMA2 >= 0 ? '+' : ''}${fmt(a.variance.mean - SIGMA2, 4)}`;
    $('sd-mean-target').textContent = `Theory = ${fmt(Math.sqrt(SIGMA2 / n), 4)}`;
    $('experiment-commentary').textContent = `At n = ${n} and m = ${m}, the average of means is ${fmt(a.mean.mean, 3)} versus μ = 5; the average of unbiased sample variances is ${fmt(a.variance.mean, 3)} versus σ² = 10. The observed SD of individual means is ${fmt(a.mean.sd, 3)} (theory ${fmt(Math.sqrt(SIGMA2 / n), 3)}), while the SD of individual sample variances is ${fmt(a.variance.sd, 3)} (theory ${fmt(Math.sqrt(theoryVarS2(n)), 3)}). Differences reflect finite Monte Carlo randomness.`;
    histogram($('hist-means'), row.means, MU, 'sample mean →');
    histogram($('hist-variances'), row.variances, SIGMA2, 'sample variance →');
    $('mean-plot-note').textContent = `From ${m} hackers with ${n} systems each. The center is near 5; the observed spread is ${fmt(a.mean.sd, 3)}.`;
    $('variance-plot-note').textContent = `From ${m} hackers with ${n} systems each. The center is near 10; the observed spread is ${fmt(a.variance.sd, 3)}.`;
    drawPaths($('running-paths'), paths, n);
    drawConvergence($('convergence-plot'), summaries);
    $('results-tbody').innerHTML = SIZES.map(size => {
      const s = summaries.get(size);
      return `<tr ${n === size ? 'class="l4-highlight"' : ''}><td><strong>${size}</strong></td><td>${fmt(s.mean.mean, 4)}</td><td>${fmt(s.variance.mean, 4)}</td><td>${fmt(s.mean.sd, 4)}</td><td>${fmt(Math.sqrt(SIGMA2 / size), 4)}</td><td>${fmt(s.variance.sd, 4)}</td></tr>`;
    }).join('');
    $('run-status').textContent = `Completed · ${fmt(m * MAX_N, 0)} seeded draws · ${m} independent hackers · selected n = ${n}.`;
  }
  function run() {
    try {
      const { n, m, seed } = readSettings();
      $('run-status').textContent = 'Calculating all seven sample sizes…';
      // Synchronous loop is small enough to run locally with up to 3.2M draws.
      result = simulate(m, seed);
      render();
    } catch (e) {
      $('run-status').textContent = `Invalid settings: ${e.message}`;
    }
  }
  $('run-simulation').addEventListener('click', run);
  $('control-n').addEventListener('change', () => { if (result) render(); else run(); });
  $('control-m').addEventListener('change', run);
  $('control-seed').addEventListener('change', run);
  $('change-seed').addEventListener('click', () => {
    // Randomness only used for choosing a new reproducible seed, not for X itself.
    $('control-seed').value = String(Math.floor(Math.random() * 4294967296));
    run();
  });
  $('export-csv').addEventListener('click', () => {
    if (!result) return;
    const header = 'n,m,seed,avg_sample_mean,avg_sample_variance,sd_sample_means,theoretical_sd_mean,sd_sample_variances,theoretical_sd_variance';
    const body = SIZES.map(n => {
      const s = result.summaries.get(n);
      return [n,result.settings.m,result.settings.seed,s.mean.mean,s.variance.mean,s.mean.sd,Math.sqrt(SIGMA2 / n),s.variance.sd,Math.sqrt(theoryVarS2(n))].join(',');
    });
    const blob = new Blob([[header,...body].join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `lesson04_welford_seed_${result.settings.seed}.csv`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  });
  run();
})();
