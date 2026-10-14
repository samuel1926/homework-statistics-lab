/*
 * HMWK 01 — Elliptic-Curve Cryptography Lab
 * Self-contained JavaScript: elliptic-curve arithmetic, interactive animation,
 * coordinate statistics, bit frequencies, correlations and SVG visualization.
 * Educational use only — NOT suitable for real cryptographic keys.
 */

/*
 * HMWK 01 — Educational elliptic-curve arithmetic over F_17.
 * Not suitable for real cryptographic use.
 */
(function (root) {
  'use strict';

  const PRIME = 17;
  const CURVE_A = 0;
  const CURVE_B = 7;
  const INFINITY = null;

  function mod(value, modulus = PRIME) {
    return ((value % modulus) + modulus) % modulus;
  }

  function inverse(value) {
    const a = mod(value);
    if (a === 0) throw new RangeError('Zero has no modular inverse.');
    for (let candidate = 1; candidate < PRIME; candidate++) {
      if (mod(a * candidate) === 1) return candidate;
    }
    throw new RangeError('Modular inverse does not exist.');
  }

  function equals(left, right) {
    return left === null || right === null
      ? left === right
      : left.x === right.x && left.y === right.y;
  }

  function isOnCurve(point) {
    return point === null ||
      (Number.isInteger(point.x) && Number.isInteger(point.y) &&
      point.x >= 0 && point.x < PRIME &&
      point.y >= 0 && point.y < PRIME &&
      mod(point.y ** 2) === mod(point.x ** 3 + CURVE_A * point.x + CURVE_B));
  }

  function describe(point) {
    return point === null ? '𝒪' : `(${point.x}, ${point.y})`;
  }

  // Both point addition and doubling use the same formulas for x3 and y3.
  // Field division must ALWAYS be implemented as multiplication by an inverse.
  function addDetailed(left, right) {
    if (!isOnCurve(left) || !isOnCurve(right)) throw new RangeError('Point is not on the curve.');

    if (left === null || right === null) {
      return {
        point: left === null ? right : left,
        kind: 'identity',
        explanation: 'The point at infinity 𝒪 is the identity: P + 𝒪 = 𝒪 + P = P.'
      };
    }

    if (left.x === right.x && mod(left.y + right.y) === 0) {
      return {
        point: INFINITY,
        kind: 'inverse',
        explanation: 'These points are inverses (or the tangent is vertical); P + (−P) = 𝒪.'
      };
    }

    const doubling = equals(left, right);
    const numerator = doubling ? mod(3 * left.x ** 2 + CURVE_A) : mod(right.y - left.y);
    const denominator = doubling ? mod(2 * left.y) : mod(right.x - left.x);
    const inv = inverse(denominator);
    const slope = mod(numerator * inv);
    const x = mod(slope ** 2 - left.x - right.x);
    const y = mod(slope * (left.x - x) - left.y);
    const point = { x, y };
    if (!isOnCurve(point)) throw new Error('Internal arithmetic error: result is off curve.');
    return {
      point, kind: doubling ? 'doubling' : 'addition',
      numerator, denominator, inverse: inv, slope,
      xTerms: [slope ** 2, left.x, right.x],
      yTerms: [slope, left.x, x, left.y]
    };
  }

  function add(left, right) { return addDetailed(left, right).point; }

  function multiply(base, scalar) {
    if (!Number.isSafeInteger(scalar) || scalar < 0) throw new RangeError('Scalar must be a nonnegative safe integer.');
    if (!isOnCurve(base)) throw new RangeError('Base point is not on the curve.');
    let result = INFINITY;
    let current = base;
    let n = scalar;
    while (n > 0) {
      if (n % 2 === 1) result = add(result, current);
      current = add(current, current);
      n = Math.floor(n / 2);
    }
    return result;
  }

  function enumeratePoints() {
    const points = [];
    for (let x = 0; x < PRIME; x++) {
      for (let y = 0; y < PRIME; y++) {
        const point = { x, y };
        if (isOnCurve(point)) points.push(point);
      }
    }
    return points;
  }

  const POINTS = Object.freeze(enumeratePoints());
  const GROUP_ORDER = POINTS.length + 1; // Includes the identity 𝒪.

  function orderOf(base) {
    if (base === null || !isOnCurve(base)) throw new RangeError('Choose a finite valid base point.');
    let current = INFINITY;
    for (let i = 1; i <= GROUP_ORDER; i++) {
      current = add(current, base);
      if (current === null) return i;
    }
    throw new Error('Could not establish the point order.');
  }

  function buildTrace(base, scalar, method = 'repeated') {
    if (!Number.isSafeInteger(scalar) || scalar < 1 || scalar > 256) throw new RangeError('Choose k between 1 and 256.');
    if (base === null || !isOnCurve(base)) throw new RangeError('Invalid base point.');
    const trace = [];
    let accumulator = INFINITY;
    if (method === 'repeated') {
      for (let i = 1; i <= scalar; i++) {
        const previous = accumulator;
        const detail = addDetailed(previous, base);
        accumulator = detail.point;
        trace.push({
          index: trace.length + 1,
          operation: 'ADD', label: `${i}G`,
          left: previous, right: base, output: accumulator,
          accumulator, detail,
          note: i === 1 ? 'Begin at 𝒪, then add G.' : `Add one more copy of G (${i} of ${scalar}).`
        });
      }
    } else if (method === 'double-add') {
      let addend = base;
      let remaining = scalar;
      let bit = 0;
      while (remaining > 0) {
        if (remaining % 2 === 1) {
          const previous = accumulator;
          const detail = addDetailed(previous, addend);
          accumulator = detail.point;
          trace.push({
            index: trace.length + 1,
            operation: 'ADD', label: `Bit ${bit} = 1`,
            left: previous, right: addend, output: accumulator,
            accumulator, detail,
            note: `The scalar's bit ${bit} is 1, so add 2^${bit}G to the accumulator.`
          });
        } else {
          trace.push({
            index: trace.length + 1,
            operation: 'SKIP', label: `Bit ${bit} = 0`,
            left: accumulator, right: null, output: accumulator,
            accumulator, detail: { kind: 'skip', point: accumulator },
            note: `Bit ${bit} is 0, so the accumulator stays unchanged.`
          });
        }
        remaining = Math.floor(remaining / 2);
        if (remaining > 0) {
          const previous = addend;
          const detail = addDetailed(previous, previous);
          addend = detail.point;
          trace.push({
            index: trace.length + 1,
            operation: 'DOUBLE', label: `${bit + 1} → 2^${bit + 1}G`,
            left: previous, right: previous, output: addend,
            accumulator, detail,
            note: `Double the addend to prepare 2^${bit + 1}G. The accumulator does not change.`
          });
        }
        bit++;
      }
    } else {
      throw new RangeError('Unknown multiplication method.');
    }
    if (!equals(accumulator, multiply(base, scalar))) {
      throw new Error('Trace and independent multiplication disagree.');
    }
    return trace;
  }

  function hammingDistance(a, b) {
    // Coordinates in F_17 are represented by exactly 5 bits each.
    const encodedA = (a.x << 5) | a.y;
    const encodedB = (b.x << 5) | b.y;
    let bits = encodedA ^ encodedB;
    let count = 0;
    while (bits) { count += bits & 1; bits >>>= 1; }
    return count;
  }

  function pearson(pairs) {
    if (pairs.length < 2) return null;
    const mx = pairs.reduce((s, [x]) => s + x, 0) / pairs.length;
    const my = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length;
    const xx = pairs.reduce((s, [x]) => s + (x - mx) ** 2, 0);
    const yy = pairs.reduce((s, [, y]) => s + (y - my) ** 2, 0);
    if (xx === 0 || yy === 0) return null;
    const xy = pairs.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
    return xy / Math.sqrt(xx * yy);
  }

  function analyze(base, count) {
    if (!Number.isInteger(count) || count < 1 || count > 256) throw new RangeError('Invalid sampling size.');
    const samples = Array.from({ length: count }, (_, i) => ({ k: i + 1, point: multiply(base, i + 1) }));
    const finite = samples.filter(({ point }) => point !== null);
    const histogramX = Array(PRIME).fill(0);
    const histogramY = Array(PRIME).fill(0);
    const bitX = Array(5).fill(0);
    const bitY = Array(5).fill(0);
    for (const { point } of finite) {
      histogramX[point.x]++;
      histogramY[point.y]++;
      for (let bit = 0; bit < 5; bit++) {
        bitX[bit] += (point.x >> bit) & 1;
        bitY[bit] += (point.y >> bit) & 1;
      }
    }
    let changedBits = 0;
    let comparisonCount = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i - 1].point !== null && samples[i].point !== null) {
        changedBits += hammingDistance(samples[i - 1].point, samples[i].point);
        comparisonCount++;
      }
    }
    return {
      samples, finite, infinityCount: samples.length - finite.length,
      uniquePoints: new Set(finite.map(({ point }) => `${point.x},${point.y}`)).size,
      histogramX, histogramY, bitX, bitY,
      correlationX: pearson(finite.map(({ k, point }) => [k, point.x])),
      correlationY: pearson(finite.map(({ k, point }) => [k, point.y])),
      meanChangedBits: comparisonCount ? changedBits / comparisonCount : null,
      comparisonCount,
      coordinateCount: finite.length
    };
  }

  const API = Object.freeze({
    PRIME, CURVE_A, CURVE_B, INFINITY, POINTS, GROUP_ORDER,
    mod, inverse, equals, isOnCurve, describe,
    add, addDetailed, multiply, orderOf, buildTrace, analyze, hammingDistance
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.ToyECC = API;
})(typeof window !== 'undefined' ? window : null);


/*
 * HMWK 01 — Browser interface, step-by-step simulation and statistical study.
 * Depends only on ecc.js. No build process or third-party runtime required.
 */
(() => {
  'use strict';
  const E = window.ToyECC;
  if (!E) throw new Error('ecc.js must load before app.js.');
  const $ = id => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';

  const ui = {
    base: $('base-select'), key: $('scalar-input'), error: $('scalar-error'),
    buttons: document.querySelectorAll('[data-method]'),
    publicKey: $('public-key'), verified: $('curve-verification'),
    pointOrder: $('point-order'), totalSteps: $('total-steps'),
    heroKey: $('hero-key'), heroPublic: $('hero-public'), heroCheck: $('hero-check'),
    play: $('play-button'), playLabel: $('play-label'), playSymbol: $('play-symbol'),
    step: $('step-button'), reset: $('reset-button'), speed: $('speed-select'),
    plot: $('curve-plot'), accumulator: $('accumulator-value'),
    progressLabel: $('progress-label'), progressFill: $('progress-fill'),
    stateLabel: $('animation-state'), traceMode: $('trace-mode'),
    steps: $('steps-body'), traceCount: $('trace-count'),
    formulaOperation: $('formula-operation'), formulaDescription: $('formula-description'),
    formulaLines: $('formula-lines'),
    sampleCount: $('sample-count'), sampleOutput: $('sample-output'), sampleNote: $('sample-note'),
    metricFinite: $('metric-finite'), metricDistinct: $('metric-distinct'),
    metricHamming: $('metric-hamming'), metricPeriod: $('metric-period'),
    histX: $('hist-x'), histY: $('hist-y'), bitBars: $('bit-bars'),
    correlationX: $('correlation-x'), correlationY: $('correlation-y'),
    flipBefore: $('flip-before'), flipAfter: $('flip-after'),
    flipOutputs: $('flip-outputs'), flipDistance: $('flip-distance'),
    insightTitle: $('stats-insight-title'), insightText: $('stats-insight-text')
  };

  const state = {
    base: { x: 1, y: 5 }, scalar: 6, method: 'repeated',
    trace: [], currentStep: 0, playing: false, timer: null
  };

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function svgElement(tag, attributes = {}, text) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, String(value)));
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function addFormulaLine(label, value) {
    const row = element('div');
    row.append(element('span', null, label), element('code', null, value));
    ui.formulaLines.append(row);
  }

  function pointId(point) { return point === null ? 'inf' : `${point.x},${point.y}`; }

  function makeBaseOptions() {
    const fragment = document.createDocumentFragment();
    E.POINTS.forEach(point => {
      const order = E.orderOf(point);
      const option = element('option', null, `${E.describe(point)}   ·   order ${order}`);
      option.value = pointId(point);
      fragment.append(option);
    });
    ui.base.append(fragment);
    ui.base.value = pointId(state.base);
  }

  function stopAnimation() {
    if (state.timer !== null) window.clearInterval(state.timer);
    state.timer = null;
    state.playing = false;
    updatePlayButton();
  }

  function updatePlayButton() {
    ui.playLabel.textContent = state.playing ? 'Pause animation' : 'Play animation';
    ui.playSymbol.textContent = state.playing ? 'Ⅱ' : '▶';
  }

  function renderParameters() {
    const order = E.orderOf(state.base);
    const finalPoint = E.multiply(state.base, state.scalar);
    state.trace = E.buildTrace(state.base, state.scalar, state.method);
    ui.pointOrder.textContent = String(order);
    ui.totalSteps.textContent = String(state.trace.length);
    ui.publicKey.textContent = E.describe(finalPoint);
    ui.verified.textContent = finalPoint === null ? 'Identity point 𝒪 (the key wraps around)' : 'Valid point on E(𝔽₁₇)';
    ui.heroKey.textContent = `k = ${state.scalar}`;
    ui.heroPublic.textContent = E.describe(finalPoint);
    ui.heroCheck.textContent = finalPoint === null ? '// point at infinity 𝒪' : `// ${E.describe(finalPoint)} ✓ on curve`;
    ui.traceMode.textContent = state.method === 'repeated' ? 'REPEATED ADDITION' : 'DOUBLE-AND-ADD';
    ui.traceCount.textContent = `${state.trace.length} operations`;
    ui.buttons.forEach(button => {
      const active = button.dataset.method === state.method;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    buildStepsTable();
    setStep(0);
    updateStats();
  }

  function syncInputs(resetStatsSample = false) {
    stopAnimation();
    const scalar = Number(ui.key.value);
    const valid = ui.key.value.trim() !== '' && Number.isSafeInteger(scalar) && scalar >= 1 && scalar <= 256;
    ui.error.hidden = valid;
    ui.play.disabled = ui.step.disabled = !valid;
    if (!valid) {
      ui.publicKey.textContent = '—';
      ui.heroPublic.textContent = '—';
      ui.verified.textContent = 'Enter a valid private scalar';
      ui.formulaOperation.textContent = 'Invalid private scalar';
      ui.formulaDescription.textContent = 'Use an integer between 1 and 256.';
      return;
    }
    const match = E.POINTS.find(point => pointId(point) === ui.base.value);
    if (!match) throw new Error('Invalid base point selection.');
    state.scalar = scalar;
    state.base = match;
    if (resetStatsSample) {
      ui.sampleCount.value = String(Math.max(2, E.orderOf(state.base) - 1));
    }
    renderParameters();
  }

  function buildStepsTable() {
    const fragment = document.createDocumentFragment();
    state.trace.forEach((step, index) => {
      const tr = element('tr');
      tr.tabIndex = 0;
      tr.setAttribute('aria-label', `Step ${index + 1}, ${step.operation}, ${E.describe(step.output)}`);
      const number = element('td', null, String(index + 1).padStart(2, '0'));
      const operationCell = element('td');
      const operation = element('span', `action-pill ${step.operation.toLowerCase()}`, step.operation);
      operationCell.append(operation);
      const result = element('td', null, `${step.label} = ${E.describe(step.output)}`);
      tr.append(number, operationCell, result);
      tr.addEventListener('click', () => { stopAnimation(); setStep(index + 1); });
      tr.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); stopAnimation(); setStep(index + 1);
        }
      });
      fragment.append(tr);
    });
    ui.steps.replaceChildren(fragment);
  }

  function setStep(next) {
    state.currentStep = Math.max(0, Math.min(next, state.trace.length));
    const step = state.trace[state.currentStep - 1];
    ui.accumulator.textContent = step ? E.describe(step.accumulator) : '𝒪';
    ui.progressLabel.textContent = `${state.currentStep} / ${state.trace.length} operations`;
    ui.progressFill.style.width = `${state.trace.length ? 100 * state.currentStep / state.trace.length : 0}%`;
    ui.stateLabel.textContent = state.playing ? 'PLAYING' :
      state.currentStep === state.trace.length ? 'COMPLETE ✓' :
      state.currentStep === 0 ? 'READY' : 'PAUSED';
    ui.step.disabled = state.currentStep === state.trace.length;
    [...ui.steps.rows].forEach((row, index) => row.classList.toggle('is-current', index === state.currentStep - 1));
    showFormula(step);
    drawPlot();
  }

  function showFormula(step) {
    ui.formulaLines.replaceChildren();
    if (!step) {
      ui.formulaOperation.textContent = 'Ready to compute';
      ui.formulaDescription.textContent = 'Select an operation in the trace or click Play to inspect the corresponding point addition.';
      addFormulaLine('Rule', 'P + 𝒪 = P');
      addFormulaLine('Field', 'All arithmetic is modulo 17.');
      return;
    }
    const { detail, left, right, output } = step;
    ui.formulaOperation.textContent = `${step.operation}: ${E.describe(left)} + ${E.describe(right)}`;
    ui.formulaDescription.textContent = step.note;
    if (detail.kind === 'skip') {
      addFormulaLine('Scalar bit', '0 → no addition required');
      addFormulaLine('Accumulator', E.describe(step.accumulator));
      return;
    }
    if (detail.kind === 'identity' || detail.kind === 'inverse') {
      addFormulaLine('Special case', detail.explanation);
      addFormulaLine('Result', E.describe(output));
      return;
    }
    addFormulaLine('Operation', detail.kind === 'doubling' ? 'Point doubling P + P' : 'Point addition P + Q');
    addFormulaLine('Numerator', `${detail.numerator} (mod 17)`);
    addFormulaLine('Denominator', `${detail.denominator} (mod 17)`);
    addFormulaLine('Inverse', `${detail.denominator}⁻¹ ≡ ${detail.inverse} (mod 17)`);
    addFormulaLine('Slope λ', `${detail.numerator} × ${detail.inverse} ≡ ${detail.slope} (mod 17)`);
    addFormulaLine('x₃', `${detail.slope}² − ${left.x} − ${right.x} ≡ ${output.x} (mod 17)`);
    addFormulaLine('y₃', `${detail.slope}(${left.x} − ${output.x}) − ${left.y} ≡ ${output.y} (mod 17)`);
    addFormulaLine('Result', E.describe(output));
  }

  function drawPlot() {
    const svg = ui.plot;
    const X0 = 58, X1 = 571, Y0 = 448, Y1 = 37;
    const atX = x => X0 + (X1 - X0) * (x / 16);
    const atY = y => Y0 - (Y0 - Y1) * (y / 16);
    const frag = document.createDocumentFragment();
    frag.append(svgElement('rect', { x: X0, y: Y1, width: X1 - X0, height: Y0 - Y1, rx: 6, fill: '#0b1526', stroke: '#3b4963', 'stroke-width': .8 }));
    for (let n = 0; n < E.PRIME; n++) {
      frag.append(svgElement('line', { x1: atX(n), y1: Y1, x2: atX(n), y2: Y0, stroke: n % 4 === 0 ? '#2e4258' : '#1d2d40', 'stroke-width': n % 4 === 0 ? .95 : .6 }));
      frag.append(svgElement('line', { x1: X0, y1: atY(n), x2: X1, y2: atY(n), stroke: n % 4 === 0 ? '#2e4258' : '#1d2d40', 'stroke-width': n % 4 === 0 ? .95 : .6 }));
      if (n % 4 === 0) {
        frag.append(svgElement('text', { x: atX(n), y: Y0 + 26, fill: '#788da8', 'font-size': 13, 'font-family': 'DM Sans, sans-serif', 'text-anchor': 'middle' }, String(n)));
        frag.append(svgElement('text', { x: X0 - 23, y: atY(n) + 4, fill: '#788da8', 'font-size': 13, 'font-family': 'DM Sans, sans-serif', 'text-anchor': 'middle' }, String(n)));
      }
    }
    frag.append(svgElement('text', { x: (X0 + X1) / 2, y: Y0 + 48, fill: '#94a8c1', 'font-size': 13, 'font-family': 'DM Sans, sans-serif', 'text-anchor': 'middle' }, 'x coordinate'));
    frag.append(svgElement('text', { x: 17, y: 24, fill: '#94a8c1', 'font-size': 13, 'font-family': 'DM Sans, sans-serif' }, 'y'));
    // Plot each finite solution. Clicking a point selects it as the next base point.
    E.POINTS.forEach(point => {
      const circle = svgElement('circle', { cx: atX(point.x), cy: atY(point.y), r: 5.2, fill: '#657b98', opacity: .82, tabindex: 0, role: 'button', 'aria-label': `Select base point ${E.describe(point)}, order ${E.orderOf(point)}`, style: 'cursor:pointer' });
      circle.append(svgElement('title', {}, `${E.describe(point)} · order ${E.orderOf(point)} · click to select G`));
      const pick = () => { ui.base.value = pointId(point); syncInputs(true); };
      circle.addEventListener('click', pick);
      circle.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(); }
      });
      frag.append(circle);
    });
    const visited = state.trace.slice(0, state.currentStep)
      .map(step => step.output);
    // Dashed segments communicate computation order only; they are not geometric addition lines.
    let prev = null;
    visited.forEach(point => {
      if (point && prev && !E.equals(point, prev)) {
        frag.append(svgElement('line', { x1: atX(prev.x), y1: atY(prev.y), x2: atX(point.x), y2: atY(point.y), stroke: '#73b4d9', 'stroke-width': 1.5, 'stroke-dasharray': '5 7', opacity: .47 }));
      }
      prev = point;
    });
    const seen = new Set();
    visited.forEach(point => {
      if (point === null || seen.has(pointId(point))) return;
      seen.add(pointId(point));
      frag.append(svgElement('circle', { cx: atX(point.x), cy: atY(point.y), r: 10, fill: '#3f83a6', opacity: .24 }));
      frag.append(svgElement('circle', { cx: atX(point.x), cy: atY(point.y), r: 5.8, fill: '#568fbc' }));
    });
    const base = state.base;
    frag.append(svgElement('circle', { cx: atX(base.x), cy: atY(base.y), r: 12, fill: 'none', stroke: '#b49aff', 'stroke-width': 2.1 }));
    frag.append(svgElement('circle', { cx: atX(base.x), cy: atY(base.y), r: 5, fill: '#b49aff' }));
    const current = state.trace[state.currentStep - 1]?.output ?? null;
    if (current) {
      frag.append(svgElement('circle', { cx: atX(current.x), cy: atY(current.y), r: 17, fill: '#5ce3df', opacity: .14 }));
      frag.append(svgElement('circle', { cx: atX(current.x), cy: atY(current.y), r: 10, fill: 'none', stroke: '#68efe7', 'stroke-width': 2.3 }));
      frag.append(svgElement('circle', { cx: atX(current.x), cy: atY(current.y), r: 5.6, fill: '#5ce3df' }));
      const isNearRight = current.x >= 13;
      frag.append(svgElement('text', { x: atX(current.x) + (isNearRight ? -14 : 14), y: atY(current.y) - 13, fill: '#8af5ed', 'font-size': 13, 'font-weight': 700, 'font-family': 'DM Sans, sans-serif', 'text-anchor': isNearRight ? 'end' : 'start' }, `Q = ${E.describe(current)}`));
    } else if (state.currentStep && state.trace[state.currentStep - 1].output === null) {
      frag.append(svgElement('text', { x: (X0 + X1) / 2, y: Y1 + 27, 'text-anchor': 'middle', 'font-size': 13, fill: '#65e6da' }, '𝒪 · point at infinity (not on the grid)'));
    }
    frag.append(svgElement('text', { x: atX(base.x) + (base.x >= 13 ? -13 : 13), y: atY(base.y) + 23, fill: '#ccbaff', 'font-size': 13, 'font-weight': 700, 'font-family': 'DM Sans, sans-serif', 'text-anchor': base.x >= 13 ? 'end' : 'start' }, 'G'));
    svg.replaceChildren(frag);
  }

  function nextStep() {
    if (state.currentStep >= state.trace.length) {
      stopAnimation();
      setStep(state.trace.length);
      return;
    }
    setStep(state.currentStep + 1);
    if (state.currentStep >= state.trace.length) { stopAnimation(); setStep(state.currentStep); }
  }

  function togglePlay() {
    if (state.playing) { stopAnimation(); setStep(state.currentStep); return; }
    if (state.currentStep === state.trace.length) setStep(0);
    state.playing = true;
    updatePlayButton();
    nextStep();
    if (state.playing) state.timer = window.setInterval(nextStep, Number(ui.speed.value));
  }

  function renderHistogram(container, counts) {
    const maximum = Math.max(...counts, 1);
    const fragment = document.createDocumentFragment();
    counts.forEach((count, value) => {
      const col = element('div', 'bar-column');
      const bar = element('div', 'bar');
      bar.style.height = count ? `${Math.max(4, (count / maximum) * 100)}%` : '0%';
      bar.title = `Value ${value}: ${count} occurrence${count === 1 ? '' : 's'}`;
      col.append(bar);
      if (value % 4 === 0) col.append(element('span', 'bar-label', String(value)));
      fragment.append(col);
    });
    container.replaceChildren(fragment);
  }

  function renderBits(data) {
    const fragment = document.createDocumentFragment();
    [['X COORDINATE', data.bitX, false], ['Y COORDINATE', data.bitY, true]].forEach(([title, frequencies, isY]) => {
      fragment.append(element('div', 'bit-separator', title));
      frequencies.forEach((count, bit) => {
        const ratio = data.coordinateCount ? count / data.coordinateCount : 0;
        const row = element('div', `bit-row${isY ? ' y-row' : ''}`);
        const track = element('div', 'bit-track');
        const fill = element('div');
        fill.style.width = `${100 * ratio}%`;
        track.append(fill);
        row.append(element('span', 'bit-name', `bit ${bit}`), track, element('span', 'percent', `${Math.round(ratio * 100)}%`));
        fragment.append(row);
      });
    });
    ui.bitBars.replaceChildren(fragment);
  }

  function formattedCorrelation(value) { return value === null ? 'n/a' : (value >= 0 ? '+' : '') + value.toFixed(3); }

  function updateStats() {
    const count = Number(ui.sampleCount.value);
    const order = E.orderOf(state.base);
    const data = E.analyze(state.base, count);
    const finite = data.finite.length;
    ui.sampleOutput.value = String(count);
    ui.sampleOutput.textContent = String(count);
    ui.sampleNote.textContent = `${finite} finite output${finite === 1 ? '' : 's'} · ${data.infinityCount} identity 𝒪`;
    ui.metricFinite.replaceChildren(document.createTextNode(`${finite} `), element('small', null, `/ ${count}`));
    ui.metricDistinct.textContent = String(data.uniquePoints);
    ui.metricHamming.replaceChildren(document.createTextNode(data.meanChangedBits === null ? 'n/a ' : `${data.meanChangedBits.toFixed(2)} `), element('small', null, '/ 10'));
    ui.metricPeriod.textContent = String(order);
    renderHistogram(ui.histX, data.histogramX);
    renderHistogram(ui.histY, data.histogramY);
    renderBits(data);
    ui.correlationX.textContent = formattedCorrelation(data.correlationX);
    ui.correlationY.textContent = formattedCorrelation(data.correlationY);

    const switched = state.scalar ^ 1;
    const before = E.multiply(state.base, state.scalar);
    const after = E.multiply(state.base, switched);
    ui.flipBefore.textContent = `k = ${state.scalar}`;
    ui.flipAfter.textContent = `k′ = ${switched}`;
    ui.flipOutputs.textContent = `Q = ${E.describe(before)} → Q′ = ${E.describe(after)}`;
    ui.flipDistance.textContent = before && after
      ? `${E.hammingDistance(before, after)} / 10 output bits changed`
      : 'n/a — identity point has no coordinates';
    if (count >= order * 2) {
      ui.insightTitle.textContent = 'The sequence is cyclic, not random';
      ui.insightText.textContent = `G has order ${order}, so the entire sequence repeats every ${order} keys. In a sweep of ${count}, several finite points occur more than once, and each multiple of ${order} produces 𝒪. This is a structural property of the group, not a statistical flaw in a real curve.`;
    } else if (count >= order) {
      ui.insightTitle.textContent = 'One full cycle reveals the subgroup';
      ui.insightText.textContent = `With base point ${E.describe(state.base)}, all ${order} subgroup elements are reached once over k = 1, …, ${order}; one of them is the identity 𝒪, which is omitted from the x/y histograms. The next scalar produces G again.`;
    } else {
      ui.insightTitle.textContent = 'A partial subgroup, not a random sample';
      ui.insightText.textContent = `These first ${count} consecutive scalars explore only part of a subgroup of order ${order}. Coordinates need not be uniform even though the subgroup points themselves do not repeat before a full cycle. Try N = ${order} or change G to compare.`;
    }
  }

  // Inputs and animation controls.
  ui.base.addEventListener('change', () => syncInputs(true));
  ui.key.addEventListener('input', () => syncInputs(false));
  ui.buttons.forEach(button => button.addEventListener('click', () => {
    state.method = button.dataset.method;
    syncInputs(false);
  }));
  ui.play.addEventListener('click', togglePlay);
  ui.step.addEventListener('click', () => { stopAnimation(); nextStep(); });
  ui.reset.addEventListener('click', () => { stopAnimation(); setStep(0); });
  ui.speed.addEventListener('change', () => {
    if (state.playing) {
      window.clearInterval(state.timer);
      state.timer = window.setInterval(nextStep, Number(ui.speed.value));
    }
  });
  ui.sampleCount.addEventListener('input', updateStats);

  makeBaseOptions();
  renderParameters();
})();
