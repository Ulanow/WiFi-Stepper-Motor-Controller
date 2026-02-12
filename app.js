const $ = (id) => document.getElementById(id);

const state = {
  lineItems: [],
};

const formatCurrency = (num) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);

function renderLineItems() {
  const tbody = $('lineItems');
  tbody.innerHTML = '';

  state.lineItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    const lineTotal = item.qty * item.unitCost;
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${formatCurrency(item.unitCost)}</td>
      <td>${formatCurrency(lineTotal)}</td>
      <td><button data-index="${index}" class="remove-btn" type="button">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.index);
      state.lineItems.splice(i, 1);
      updateTotals();
      renderLineItems();
    });
  });

  updateTotals();
}

function updateTotals() {
  const markupPct = Number($('markupPercent').value) / 100 || 0;
  const subtotal = state.lineItems.reduce((sum, i) => sum + i.qty * i.unitCost, 0);
  const markup = subtotal * markupPct;
  const grand = subtotal + markup;

  $('subtotalValue').textContent = formatCurrency(subtotal);
  $('markupValue').textContent = formatCurrency(markup);
  $('grandTotalValue').textContent = formatCurrency(grand);
}

function setupEstimateForm() {
  $('lineItemForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('itemName').value.trim();
    const qty = Number($('itemQty').value);
    const unitCost = Number($('itemUnitCost').value);

    if (!name || qty <= 0 || unitCost < 0) {
      return;
    }

    state.lineItems.push({ name, qty, unitCost });
    event.target.reset();
    renderLineItems();
  });

  $('markupPercent').addEventListener('input', updateTotals);
}

function setupStorage() {
  $('saveApp').addEventListener('click', () => {
    const payload = {
      clientName: $('clientName').value,
      projectName: $('projectName').value,
      projectAddress: $('projectAddress').value,
      markupPercent: $('markupPercent').value,
      lineItems: state.lineItems,
    };
    localStorage.setItem('buildmate-project', JSON.stringify(payload));
    $('exportBox').textContent = 'Saved to your browser local storage.';
  });

  $('loadApp').addEventListener('click', () => {
    const raw = localStorage.getItem('buildmate-project');
    if (!raw) {
      $('exportBox').textContent = 'No saved project found yet.';
      return;
    }

    const parsed = JSON.parse(raw);
    $('clientName').value = parsed.clientName || '';
    $('projectName').value = parsed.projectName || '';
    $('projectAddress').value = parsed.projectAddress || '';
    $('markupPercent').value = parsed.markupPercent || 15;
    state.lineItems = parsed.lineItems || [];
    renderLineItems();
    $('exportBox').textContent = 'Loaded saved project from local storage.';
  });

  $('exportEstimate').addEventListener('click', () => {
    const exportData = {
      client: $('clientName').value,
      project: $('projectName').value,
      address: $('projectAddress').value,
      markupPercent: Number($('markupPercent').value),
      lineItems: state.lineItems,
      generatedAt: new Date().toISOString(),
    };

    $('exportBox').textContent = JSON.stringify(exportData, null, 2);
  });
}

function setupCanvas() {
  const canvas = $('sketchCanvas');
  const ctx = canvas.getContext('2d');
  let isDrawing = false;

  const getPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const start = (e) => {
    isDrawing = true;
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const p = getPoint(e);
    ctx.strokeStyle = $('penColor').value;
    ctx.lineWidth = Number($('penSize').value);
    ctx.lineCap = 'round';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stop = () => {
    isDrawing = false;
    ctx.closePath();
  };

  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', draw);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointerleave', stop);

  $('clearCanvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

setupEstimateForm();
setupStorage();
setupCanvas();
renderLineItems();
