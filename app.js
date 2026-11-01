// 3D Print Cost & Pricing Calculator
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  let state = {
    spoolCost: 20,
    partWeight: 65,
    printHours: 4,
    printMins: 30,
    powerWatts: 120,
    kwhRate: 0.16,
    machineDeprec: 0.40,
    failureRisk: 0.05,
    laborMins: 10,
    laborRate: 20,
    profitMargin: 0.50
  };

  function calculate() {
    // 1. Material Cost: (partWeight / 1000g) * spoolCost
    const materialCost = (state.partWeight / 1000) * state.spoolCost;

    // 2. Electricity Cost: totalHours * (watts / 1000) * kwhRate
    const totalHours = state.printHours + (state.printMins / 60);
    const electricityKwh = totalHours * (state.powerWatts / 1000);
    const electricityCost = electricityKwh * state.kwhRate;

    // 3. Machine Wear / Depreciation
    const machineCost = totalHours * state.machineDeprec;

    // 4. Labor Cost: (laborMins / 60) * laborRate
    const laborCost = (state.laborMins / 60) * state.laborRate;

    // Subtotal before failure buffer
    const subtotal = materialCost + electricityCost + machineCost + laborCost;

    // 5. Failure Buffer
    const failureBufferCost = subtotal * state.failureRisk;

    // Total Base Manufacturing Cost
    const totalBaseCost = subtotal + failureBufferCost;

    // 6. Final Quote Price with Profit Margin
    const quotePrice = totalBaseCost * (1 + state.profitMargin);

    return {
      materialCost,
      electricityCost,
      machineCost,
      laborCost,
      failureBufferCost,
      totalBaseCost,
      quotePrice,
      totalHours
    };
  }

  function render() {
    const res = calculate();

    $('#base-cost-display').textContent = res.totalBaseCost.toFixed(2);
    $('#quote-price-display').textContent = res.quotePrice.toFixed(2);

    // Breakdown bar
    const bar = $('#breakdown-bar');
    const legend = $('#cost-legend');
    bar.innerHTML = '';
    legend.innerHTML = '';

    const segments = [
      { name: 'Filament', cost: res.materialCost, color: '#3b82f6' },
      { name: 'Power', cost: res.electricityCost, color: '#eab308' },
      { name: 'Machine', cost: res.machineCost, color: '#8b5cf6' },
      { name: 'Labor', cost: res.laborCost, color: '#10b981' },
      { name: 'Risk', cost: res.failureBufferCost, color: '#f97316' }
    ];

    segments.forEach(seg => {
      const pct = (seg.cost / res.totalBaseCost) * 100;
      if (pct > 1) {
        const span = document.createElement('div');
        span.className = 'bar-segment';
        span.style.width = `${pct}%`;
        span.style.backgroundColor = seg.color;
        span.title = `${seg.name}: $${seg.cost.toFixed(2)} (${pct.toFixed(0)}%)`;
        bar.appendChild(span);
      }

      const leg = document.createElement('div');
      leg.className = 'legend-item';
      leg.innerHTML = `
        <span class="legend-dot" style="background-color: ${seg.color}"></span>
        <span class="legend-name">${seg.name}:</span>
        <span class="legend-val">$${seg.cost.toFixed(2)}</span>
      `;
      legend.appendChild(leg);
    });
  }

  // Bind inputs
  $('#part-weight').oninput = e => { state.partWeight = parseFloat(e.target.value) || 0; render(); };
  $('#spool-cost').oninput = e => { state.spoolCost = parseFloat(e.target.value) || 0; render(); };
  $('#print-hours').oninput = e => { state.printHours = parseInt(e.target.value, 10) || 0; render(); };
  $('#print-minutes').oninput = e => { state.printMins = parseInt(e.target.value, 10) || 0; render(); };
  $('#power-watts').oninput = e => { state.powerWatts = parseFloat(e.target.value) || 0; render(); };
  $('#kwh-rate').oninput = e => { state.kwhRate = parseFloat(e.target.value) || 0; render(); };
  $('#machine-deprec').oninput = e => { state.machineDeprec = parseFloat(e.target.value) || 0; render(); };
  $('#labor-mins').oninput = e => { state.laborMins = parseFloat(e.target.value) || 0; render(); };
  $('#labor-rate').oninput = e => { state.laborRate = parseFloat(e.target.value) || 0; render(); };

  $('#material-type').onchange = e => {
    if (e.target.value !== 'custom') {
      state.spoolCost = parseFloat(e.target.value);
      $('#spool-cost').value = state.spoolCost;
      render();
    }
  };

  $('#failure-risk').onchange = e => {
    state.failureRisk = parseFloat(e.target.value);
    render();
  };

  // Profit Margin buttons
  $$('#markup-control .seg-btn').forEach(btn => {
    btn.onclick = () => {
      $$('#markup-control .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.profitMargin = parseFloat(btn.dataset.margin);
      render();
    };
  });

  // Copy Quote
  $('#btn-copy-quote').onclick = () => {
    const res = calculate();
    const btn = $('#btn-copy-quote');
    const text = `3D Print Commercial Estimate:
• Part Weight: ${state.partWeight}g
• Estimated Print Time: ${state.printHours}h ${state.printMins}m
--------------------------
• Material Cost: $${res.materialCost.toFixed(2)}
• Electricity & Machine Wear: $${(res.electricityCost + res.machineCost).toFixed(2)}
• Post-processing Labor: $${res.laborCost.toFixed(2)}
• Manufacturing Cost: $${res.totalBaseCost.toFixed(2)}
==========================
ESTIMATED PRICE: $${res.quotePrice.toFixed(2)}

Calculated with: https://sebiglesias.com.ar/3d-print-cost/`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> Quote Copied to Clipboard!';
        btn.style.background = '#059669';
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = '';
        }, 2500);
      });
    }
  };

  render();
});
