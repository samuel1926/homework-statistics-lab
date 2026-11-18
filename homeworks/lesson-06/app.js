/* Lesson 06 · DOM presentation, independent from pure statistics calculations. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const engine = window.Stats6;
  const input = $('dataset-input');
  if (!engine || !input) return;
  let latest = null;
  let pending = null;
  const number = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  const fixed = (n, decimals = 2) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const percent = n => `${fixed(100 * n, 1)}%`;
  const pDisplay = p => p === null ? 'N/A' : p === 0 || p < 1e-12 ? '< 1e−12' : p < .0001 ? p.toExponential(3) : fixed(p, 5);
  const element = (tag, text, className) => {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = String(text);
    if (className) result.className = className;
    return result;
  };
  const appendCell = (row, tag, value, className) => row.appendChild(element(tag, value, className));

  // The last column and last row have explicit, meaningful marginal interpretations.
  function renderTable(target, data, cell, rowEnd, colEnd, total, config = {}) {
    const table = element('table');
    table.className = 'stat-table';
    const header = table.createTHead().insertRow();
    appendCell(header, 'th', 'X \\ F');
    for (const label of data.fLabels) appendCell(header, 'th', label);
    appendCell(header, 'th', config.lastColumn || 'Marginal');
    const body = table.createTBody();
    for (let i = 0; i < data.r; i++) {
      const tr = body.insertRow();
      appendCell(tr, 'td', data.xLabels[i], 'row-label');
      for (let j = 0; j < data.c; j++) appendCell(tr, 'td', cell(i, j));
      appendCell(tr, 'td', rowEnd(i), 'total-cell');
    }
    const last = body.insertRow();
    last.className = 'total-row';
    appendCell(last, 'td', config.lastRow || 'Marginal');
    for (let j = 0; j < data.c; j++) appendCell(last, 'td', colEnd(j));
    appendCell(last, 'td', total);
    $(target).replaceChildren(table);
  }

  function buildTables(d) {
    const rowContribution = i => d.contributions[i].reduce((acc, value) => acc + value, 0);
    const colContribution = j => d.contributions.reduce((acc, row) => acc + row[j], 0);
    renderTable('observed-table', d,
      (i, j) => number(d.observed[i][j]), i => number(d.rowTotals[i]), j => number(d.colTotals[j]), number(d.n),
      { lastColumn: 'Row total', lastRow: 'Column total' });
    renderTable('joint-table', d,
      (i, j) => percent(d.observed[i][j] / d.n), i => percent(d.rowTotals[i] / d.n), j => percent(d.colTotals[j] / d.n), '100%',
      { lastColumn: 'P(X)', lastRow: 'P(F)' });
    renderTable('conditional-f-table', d,
      (i, j) => percent(d.observed[i][j] / d.rowTotals[i]), () => '100%', j => percent(d.colTotals[j] / d.n), '100%',
      { lastColumn: 'Row sum', lastRow: 'Marginal F' });
    renderTable('conditional-x-table', d,
      (i, j) => percent(d.observed[i][j] / d.colTotals[j]), i => percent(d.rowTotals[i] / d.n), () => '100%', '100%',
      { lastColumn: 'Marginal X', lastRow: 'Col. sum' });
    renderTable('expected-table', d,
      (i, j) => fixed(d.expected[i][j]), i => fixed(d.rowTotals[i]), j => fixed(d.colTotals[j]), number(d.n),
      { lastColumn: 'Row total', lastRow: 'Column total' });
    renderTable('contributions-table', d,
      (i, j) => fixed(d.contributions[i][j], 3), i => fixed(rowContribution(i), 3), j => fixed(colContribution(j), 3), fixed(d.chi, 3),
      { lastColumn: 'Row χ²', lastRow: 'Column χ²' });
  }

  function renderHeatmap(target, d, matrix, color) {
    const root = $(target);
    if (d.r > 7 || d.c > 7) {
      root.replaceChildren(element('p', 'All table values remain available above. The heatmap is hidden when a variable has more than 7 categories.', 'hm-overflow'));
      return;
    }
    const max = Math.max(...matrix.flat());
    const grid = element('div');
    grid.className = 'heatmap-grid';
    grid.style.gridTemplateColumns = `minmax(90px, 1fr) repeat(${d.c}, minmax(69px, 1fr))`;
    grid.append(element('div', 'X \\ F', 'hm-axis'));
    for (const label of d.fLabels) grid.append(element('div', label, 'hm-axis'));
    for (let i = 0; i < d.r; i++) {
      grid.append(element('div', d.xLabels[i], 'hm-label'));
      for (let j = 0; j < d.c; j++) {
        const val = matrix[i][j];
        const normalized = max > 0 ? val / max : 0;
        const opacity = (0.09 + .64 * normalized).toFixed(3);
        const box = element('div', undefined, 'hm-cell');
        box.style.backgroundColor = color === 'cyan' ? `rgba(55, 201, 190, ${opacity})` : `rgba(151, 124, 242, ${opacity})`;
        box.title = `X=${d.xLabels[i]}; F=${d.fLabels[j]}; value=${fixed(val, 3)}`;
        box.append(element('strong', color === 'cyan' ? number(val) : fixed(val, 1)));
        box.append(element('small', `Δ ${d.observed[i][j] - d.expected[i][j] >= 0 ? '+' : '−'}${fixed(Math.abs(d.observed[i][j] - d.expected[i][j]), 1)}`));
        grid.append(box);
      }
    }
    root.replaceChildren(grid);
  }

  function draw(d) {
    const alpha = Number($('alpha-choice').value);
    $('metric-n').textContent = number(d.n);
    $('metric-shape').textContent = `${d.r} × ${d.c}`;
    $('metric-chi').textContent = fixed(d.chi, 4);
    $('metric-df').textContent = number(d.df);
    $('metric-p').textContent = pDisplay(d.p);
    $('metric-v').textContent = d.v === null ? 'N/A' : fixed(d.v, 4);
    const decision = $('decision-box');
    decision.classList.toggle('is-undefined', d.df === 0);
    decision.classList.toggle('is-dependent', d.df > 0 && d.p < alpha);
    const significant = d.df > 0 && d.p < alpha;
    const title = d.df === 0 ? 'The χ² test is not applicable.' : significant ? 'Evidence of statistical dependence.' : 'No significant evidence of dependence.';
    $('decision-title').textContent = title;
    $('decision-symbol').textContent = d.df === 0 ? '—' : significant ? '≠' : '≈';
    let conclusion;
    if (d.df === 0) {
      conclusion = 'At least one variable has only one observed category, so (r−1)(c−1) = 0. A meaningful Pearson independence test cannot be performed with this table.';
    } else if (significant) {
      conclusion = `χ²(${d.df}) = ${fixed(d.chi, 3)}, p = ${pDisplay(d.p)} < α = ${alpha}. Reject H₀ (independence): this sample provides statistical evidence of association between X and F.`;
    } else {
      conclusion = `χ²(${d.df}) = ${fixed(d.chi, 3)}, p = ${pDisplay(d.p)} ≥ α = ${alpha}. Do not reject H₀: there is insufficient evidence against independence. This does not prove the variables are independent.`;
    }
    if (d.unreliable && d.df > 0) {
      conclusion += ' Important: low expected counts make the asymptotic χ² p-value unreliable; this decision is only indicative.';
    }
    $('decision-description').textContent = conclusion;
    const diag = $('diagnostic-note');
    diag.replaceChildren();
    if (d.df === 0) {
      diag.append(element('span', 'ⓘ A variable with only one observed value does not give a testable contingency table.', 'warn'));
    } else if (d.unreliable) {
      diag.append(element('span', `⚠ Expected-count warning: ${d.belowFive}/${d.r * d.c} cells have E < 5; ${d.belowOne} have E < 1. The usual guideline is none below 1 and no more than 20% below 5. For a sparse 2×2 table, consider Fisher’s exact test.`, 'warn'));
    } else {
      diag.append(element('span', `✓ Expected-count check: ${d.belowFive}/${d.r * d.c} cells have E < 5; none have E < 1. The usual large-sample count guideline is satisfied.`, 'pass'));
    }
    diag.append(element('span', ` · ${d.inputRows} input data rows · ${number(d.n)} observations · Cramér's V ${d.v === null ? 'undefined' : fixed(d.v, 3)} · α=${alpha}.`));
    buildTables(d);
    renderHeatmap('observed-heatmap', d, d.observed, 'cyan');
    renderHeatmap('expected-heatmap', d, d.expected, 'purple');
    const { i, j, contribution } = d.largest;
    $('cell-insight').textContent = `Largest χ² contribution: X = “${d.xLabels[i]}” and F = “${d.fLabels[j]}”. Observed count ${number(d.observed[i][j])}, expected count ${fixed(d.expected[i][j])}, contribution ${fixed(contribution, 3)}. A large residual identifies a cell driving the association; it does not identify a causal mechanism.`;
    $('final-conclusion-heading').textContent = title;
    $('final-conclusion').textContent = `${conclusion} Even with a significant result, association does not establish causation: confounding, reverse causality and selection bias remain possible. The example datasets are synthetic.`;
  }

  function run() {
    clearTimeout(pending);
    try {
      const d = engine.calculate(input.value, $('has-header').checked);
      latest = d;
      $('results-area').hidden = false;
      $('input-error').hidden = true;
      $('export-button').disabled = false;
      $('data-hint').textContent = `${d.inputRows} rows · n = ${number(d.n)}`;
      draw(d);
    } catch (error) {
      latest = null;
      $('results-area').hidden = true;
      $('input-error').hidden = false;
      $('input-error').textContent = error.message || 'Could not parse this dataset.';
      $('export-button').disabled = true;
      $('data-hint').textContent = 'Fix the input to resume the analysis';
      $('final-conclusion-heading').textContent = 'Awaiting valid data';
      $('final-conclusion').textContent = 'Correct the dataset using the on-screen instructions; results will update automatically.';
    }
  }

  function updatePresetButtons(key) {
    document.querySelectorAll('[data-preset]').forEach(button => {
      const isActive = button.dataset.preset === key;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function csvEscape(value) {
    let text = String(value);
    // Make untrusted category values inert when opening the export in spreadsheet software.
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  }
  function exportCSV() {
    if (!latest) return;
    const d = latest;
    const lines = [['Statistics.Lab / Lesson 06', 'Statistical Independence'], ['Observations', d.n], ['Rows', d.r], ['Columns', d.c], ['Chi-square', d.chi], ['Degrees of freedom', d.df], ['p-value', d.p === null ? 'not applicable' : d.p], ["Cramer's V", d.v === null ? 'not applicable' : d.v], ['Significance level', $('alpha-choice').value], ['Chi-square approximation warning', d.unreliable ? 'yes' : 'no']];
    const sections = [
      ['Observed counts', d.observed], ['Joint probabilities', d.observed.map(row => row.map(v => v / d.n))],
      ['Conditional F given X', d.observed.map((row, i) => row.map(v => v / d.rowTotals[i]))],
      ['Conditional X given F', d.observed.map(row => row.map((v, j) => v / d.colTotals[j]))],
      ['Expected counts', d.expected], ['Chi-square contributions', d.contributions]
    ];
    for (const [name, matrix] of sections) {
      lines.push([], [name], ['X / F', ...d.fLabels]);
      matrix.forEach((row, i) => lines.push([d.xLabels[i], ...row]));
    }
    const content = '\uFEFF' + lines.map(row => row.map(csvEscape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'lesson-06-independence-results.csv';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    $('has-header').checked = true;
    input.value = engine.examples[button.dataset.preset];
    updatePresetButtons(button.dataset.preset);
    run();
  }));
  input.addEventListener('input', () => {
    updatePresetButtons('');
    clearTimeout(pending);
    pending = setTimeout(run, 300);
  });
  $('has-header').addEventListener('change', run);
  $('alpha-choice').addEventListener('change', () => latest && draw(latest));
  $('analyze-button').addEventListener('click', run);
  $('export-button').addEventListener('click', exportCSV);
  input.value = engine.examples.dependent;
  run();
})();
