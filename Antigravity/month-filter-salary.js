(function(){
  // Month filter -> Salary section sync
  function parseNumber(txt) {
    if (txt === null || txt === undefined) return 0;
    const n = String(txt).replace(/[^\d\.\-]/g, '');
    return parseFloat(n) || 0;
  }

  function currencyPrefix() {
    const el = document.querySelector('.salaryCurrencyLabel') || document.querySelector('.modalCurrencyPrefix');
    return el ? el.textContent.trim() : '₱';
  }

  function formatCurrency(value) {
    const prefix = currencyPrefix();
    return prefix + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function updateSalarySection(month) {
    const tbody = document.getElementById('salaryTableBody');
    const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
    const monthSelector = document.getElementById('monthSelector');
    const selectedText = monthSelector ? (monthSelector.options[monthSelector.selectedIndex] && monthSelector.options[monthSelector.selectedIndex].text.trim()) : '';
    const isAll = (month === 'all');

    let sum15 = 0, sum30 = 0, totalBudget = 0, actualExp = 0, remaining = 0, projSavings = 0, actualSavings = 0;

    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      if (cells.length < 2) return;
      const monthCellText = (cells[0].textContent || '').trim();
      const matches = isAll || monthCellText.includes(selectedText) || monthCellText.includes(month);
      if (!matches) return;
      sum15 += parseNumber(cells[1] && cells[1].textContent);
      sum30 += parseNumber(cells[2] && cells[2].textContent);
      totalBudget += parseNumber(cells[3] && cells[3].textContent);
      actualExp += parseNumber(cells[4] && cells[4].textContent);
      remaining += parseNumber(cells[5] && cells[5].textContent);
      projSavings += parseNumber(cells[7] && cells[7].textContent);
      actualSavings += parseNumber(cells[8] && cells[8].textContent);
    });

    const totalIncome = sum15 + sum30;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setText('salKpiIncome15th', formatCurrency(sum15));
    setText('salKpiIncome30th', formatCurrency(sum30));
    setText('salKpiTotalIncome', formatCurrency(totalIncome));
    setText('salKpiRemaining', formatCurrency(remaining));
    setText('salKpiProjSavings', formatCurrency(projSavings));
    setText('salKpiActualSavings', formatCurrency(actualSavings));

    const safePct = (part, whole) => (whole ? ((part / whole) * 100) : 0);
    const projPct = safePct(projSavings, totalIncome);
    const actualPct = safePct(actualSavings, totalIncome);
    const projSub = document.getElementById('salKpiProjSavingsSub');
    if (projSub) projSub.textContent = `${projPct.toFixed(1)}% of income`;
    const actualSub = document.getElementById('salKpiActualSavingsSub');
    if (actualSub) actualSub.textContent = `${actualPct.toFixed(1)}% of income saved`;

    const footer = document.getElementById('salaryTableFooter');
    if (footer) {
      footer.innerHTML = `\n        <td class="py-3 px-4 font-mono">TOTAL</td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(sum15)}</td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(sum30)}</td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(totalBudget)}</td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(actualExp)}</td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(remaining)}</td>\n        <td class="py-3 px-4 text-right font-mono"></td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(projSavings)}</td>\n        <td class="py-3 px-4 text-right font-mono">${formatCurrency(actualSavings)}</td>\n      `;
    }

    window.dispatchEvent(new CustomEvent('monthFilterChanged', { detail: { month } }));
  }

  function init() {
    const monthSelector = document.getElementById('monthSelector');
    if (!monthSelector) return;
    monthSelector.addEventListener('change', (e) => updateSalarySection(e.target.value));
    // Run once on init
    updateSalarySection(monthSelector.value || 'all');

    // Allow other code to trigger recalculation after async table render
    window.recalculateSalaryForCurrentMonth = function() {
      updateSalarySection(monthSelector.value || 'all');
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
