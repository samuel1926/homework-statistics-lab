/* Pure, dependency-free statistics engine for Statistics.Lab Lesson 06.
 * Works in browsers and Node.js. All examples are synthetic.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Stats6 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const examples = Object.freeze({
    dependent: 'X,F,count\nPhishing,Access,42\nPhishing,Blocked,8\nCredential,Access,24\nCredential,Blocked,26\nWeb,Access,9\nWeb,Blocked,41',
    independent: 'X,F,count\nPhishing,Access,25\nPhishing,Blocked,25\nCredential,Access,25\nCredential,Blocked,25\nWeb,Access,25\nWeb,Blocked,25',
    weak: 'X,F,count\nPhishing,Access,29\nPhishing,Blocked,21\nCredential,Access,25\nCredential,Blocked,25\nWeb,Access,21\nWeb,Blocked,29'
  });

  // Look only at the first physical line, disregarding delimiters inside quoted strings.
  function detectSeparator(text) {
    const first = (text.trim().split(/\r?\n/, 1)[0] || '');
    const counts = { ',': 0, ';': 0, '\t': 0 };
    let quoted = false;
    for (let i = 0; i < first.length; i++) {
      if (first[i] === '"') {
        if (quoted && first[i + 1] === '"') i++;
        else quoted = !quoted;
      } else if (!quoted && Object.hasOwn(counts, first[i])) counts[first[i]]++;
    }
    const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (!counts[best]) throw new Error('Use comma, semicolon or tab to separate the X and F columns.');
    return best;
  }

  // CSV/TSV parser with escaped double quotes and quoted multiline fields.
  function parseRecords(text, delimiter) {
    const rows = [];
    let row = [], field = '', quoted = false, endedQuote = false;
    const finishField = () => { row.push(field.trim()); field = ''; endedQuote = false; };
    const finishRow = () => {
      finishField();
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    };
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else { quoted = false; endedQuote = true; }
        } else field += ch;
      } else if (ch === '"' && field.trim() === '' && !endedQuote) {
        field = ''; quoted = true;
      } else if (ch === '"') {
        throw new Error(`Unexpected quote in record ${rows.length + 1}. Use doubled quotes inside quoted values.`);
      } else if (ch === delimiter) {
        finishField();
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        finishRow();
      } else if (endedQuote) {
        if (ch !== ' ' && ch !== '\t') throw new Error(`Unexpected character after a quoted value in record ${rows.length + 1}.`);
      } else field += ch;
    }
    if (quoted) throw new Error('An opening quote has no matching closing quote.');
    if (row.length || field.length || endedQuote) finishRow();
    return rows;
  }

  function parseDataset(input, hasHeader = true) {
    const text = String(input ?? '').replace(/^\uFEFF/, '').trim();
    if (!text) throw new Error('Enter at least one (X, F) observation.');
    if (text.length > 2_000_000) throw new Error('The input exceeds 2 MB. Use grouped X,F,count rows for larger data.');
    const rows = parseRecords(text, detectSeparator(text));
    if (hasHeader) {
      if (!rows.length || rows[0].length < 2 || rows[0].length > 3) throw new Error('The first line must contain two or three column headings.');
      rows.shift();
    }
    if (!rows.length) throw new Error('No data rows found after the header.');
    if (rows.length > 20_000) throw new Error('Too many input rows for an interactive browser lab. Compress repeated pairs using a count column.');
    let n = 0;
    const records = [];
    const distinctX = new Set(), distinctF = new Set();
    for (let i = 0; i < rows.length; i++) {
      const values = rows[i];
      if (values.length !== 2 && values.length !== 3) throw new Error(`Data record ${i + 1} needs 2 fields (X,F) or 3 fields (X,F,count).`);
      const [x, f] = values;
      if (!x || !f) throw new Error(`Data record ${i + 1} contains an empty category.`);
      if (x.length > 100 || f.length > 100) throw new Error(`Data record ${i + 1} has a category longer than 100 characters.`);
      const count = values.length === 3 ? Number(values[2]) : 1;
      if (!Number.isSafeInteger(count) || count <= 0) throw new Error(`Data record ${i + 1} has an invalid count. Counts must be positive integers.`);
      if (!Number.isSafeInteger(n + count) || n + count > 1_000_000_000) throw new Error('Total observation count cannot exceed 1 billion.');
      n += count;
      records.push({ x, f, count });
      distinctX.add(x); distinctF.add(f);
      if (distinctX.size > 40 || distinctF.size > 40) throw new Error('This interactive lab supports up to 40 distinct values per variable; group rare categories before testing.');
    }
    return { records, n, inputRows: rows.length };
  }

  // log Gamma via Lanczos, valid for the chi-square positive shape parameter a >= 0.5.
  function logGamma(z) {
    const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let sum = p[0];
    for (let i = 1; i < p.length; i++) sum += p[i] / (z + i);
    const t = z + 7.5;
    return Math.log(2 * Math.PI) / 2 + (z + 0.5) * Math.log(t) - t + Math.log(sum);
  }

  // Q(a,x) = Gamma(a,x) / Gamma(a): chi-square right-tail probability.
  function gammaQ(a, x) {
    if (!(a > 0) || !(x >= 0)) return NaN;
    if (x === 0) return 1;
    const logTerm = a * Math.log(x) - x - logGamma(a);
    const tiny = 1e-300;
    if (x < a + 1) {
      let term = 1 / a, sum = term;
      for (let k = 1; k <= 5000; k++) {
        term *= x / (a + k);
        sum += term;
        if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
      }
      return Math.max(0, Math.min(1, 1 - sum * Math.exp(logTerm)));
    }
    let b = x + 1 - a;
    if (Math.abs(b) < tiny) b = tiny;
    let c = 1 / tiny, d = 1 / b, h = d;
    for (let k = 1; k <= 5000; k++) {
      const an = -k * (k - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < tiny) d = tiny;
      c = b + an / c;
      if (Math.abs(c) < tiny) c = tiny;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-15) break;
    }
    return Math.max(0, Math.min(1, Math.exp(logTerm) * h));
  }

  function chiSquareSurvival(statistic, degrees) {
    return degrees > 0 && statistic >= 0 ? gammaQ(degrees / 2, statistic / 2) : null;
  }

  function calculate(input, hasHeader = true) {
    const { records, n, inputRows } = parseDataset(input, hasHeader);
    const xLabels = [...new Set(records.map(record => record.x))];
    const fLabels = [...new Set(records.map(record => record.f))];
    const xIndex = new Map(xLabels.map((x, i) => [x, i]));
    const fIndex = new Map(fLabels.map((f, j) => [f, j]));
    const r = xLabels.length, c = fLabels.length;
    const observed = Array.from({ length: r }, () => Array(c).fill(0));
    const rowTotals = Array(r).fill(0), colTotals = Array(c).fill(0);
    for (const { x, f, count } of records) {
      const i = xIndex.get(x), j = fIndex.get(f);
      observed[i][j] += count;
      rowTotals[i] += count;
      colTotals[j] += count;
    }
    const expected = [], contributions = [];
    let chi = 0, belowFive = 0, belowOne = 0, largest = { i: 0, j: 0, contribution: -1 };
    for (let i = 0; i < r; i++) {
      expected[i] = []; contributions[i] = [];
      for (let j = 0; j < c; j++) {
        const e = rowTotals[i] * colTotals[j] / n;
        const contribution = (observed[i][j] - e) ** 2 / e;
        expected[i][j] = e;
        contributions[i][j] = contribution;
        chi += contribution;
        if (e < 5) belowFive++;
        if (e < 1) belowOne++;
        if (contribution > largest.contribution) largest = { i, j, contribution };
      }
    }
    const df = (r - 1) * (c - 1);
    const p = chiSquareSurvival(chi, df);
    const v = df > 0 ? Math.sqrt(chi / (n * Math.min(r - 1, c - 1))) : null;
    const unreliable = belowOne > 0 || belowFive / (r * c) > 0.2;
    return { n, inputRows, xLabels, fLabels, r, c, observed, rowTotals, colTotals, expected, contributions, chi, df, p, v, belowFive, belowOne, unreliable, largest };
  }

  return { examples, parseDataset, chiSquareSurvival, calculate };
});
