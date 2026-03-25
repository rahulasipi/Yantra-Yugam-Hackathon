(function () {
  if (!window.IteraGenAuth.requireLogin('/')) return;

  const { api, getToken } = window.IteraGenAPI;
  const {
    renderGauge,
    renderRadarSingle,
    renderHorizontalBars,
  } = window.IteraGenCharts;
  const { refreshUserChip } = window.IteraGenCommon;

  let currentAppId = null;
  let lastPromptId = null;
  const fields = [];

  function el(id) {
    return document.getElementById(id);
  }

  function showMsg(text, ok) {
    const m = el('dash-msg');
    m.textContent = text || '';
    m.className = `flash-msg ${ok ? 'ok' : 'error'}`;
  }

  function renderFields() {
    const list = el('field-list');
    list.innerHTML = '';
    fields.forEach((f, idx) => {
      const row = document.createElement('div');
      row.className = 'field-row';
      row.innerHTML = `
        <input type="text" data-k="label" data-i="${idx}" value="${f.label.replace(/"/g, '&quot;')}" placeholder="Field label" />
        <select data-k="fieldType" data-i="${idx}">
          <option value="text" ${f.fieldType === 'text' ? 'selected' : ''}>Text</option>
          <option value="email" ${f.fieldType === 'email' ? 'selected' : ''}>Email</option>
          <option value="number" ${f.fieldType === 'number' ? 'selected' : ''}>Number</option>
          <option value="dropdown" ${f.fieldType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
        </select>
        <button type="button" class="btn-icon" data-del="${idx}">✕</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll('input,select').forEach((node) => {
      node.addEventListener('change', (e) => {
        const i = Number(e.target.dataset.i);
        const k = e.target.dataset.k;
        if (k === 'label') fields[i].label = e.target.value;
        else fields[i].fieldType = e.target.value;
      });
    });
    list.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.del);
        fields.splice(i, 1);
        renderFields();
      });
    });
  }

  function seedFields() {
    if (fields.length) return;
    fields.push(
      { label: 'Full name', fieldType: 'text', options: [] },
      { label: 'Email', fieldType: 'email', options: [] },
      { label: 'Age', fieldType: 'number', options: [] },
      { label: 'Plan', fieldType: 'dropdown', options: ['Starter', 'Pro'] }
    );
    renderFields();
  }

  function setPreview(html) {
    const iframe = el('preview');
    if (!html) {
      iframe.removeAttribute('srcdoc');
      return;
    }
    iframe.srcdoc = html;
  }

  async function generate() {
    const promptText = el('prompt').value.trim();
    const refine = el('refine').value.trim();
    const body = {
      prompt: refine || promptText,
      fields: fields.map((f) => ({
        label: f.label,
        fieldType: f.fieldType,
        options: f.options,
      })),
    };
    if (!body.prompt) {
      showMsg('Add a short description of your app idea.', false);
      return;
    }
    if (lastPromptId && refine) body.refinedFromPromptId = lastPromptId;

    showMsg('Generating…', true);
    try {
      const data = await api('/generateApp', { method: 'POST', body: JSON.stringify(body) });
      currentAppId = data.app.id;
      lastPromptId = data.promptId;
      setPreview(data.app.scaffoldHtml);
      showMsg(`Ready · ${data.generatorSource === 'local' || data.generatorSource === 'local_fallback' ? 'Local scaffold' : 'Connected generator'}`, true);
      await runValidate(false);
    } catch (e) {
      showMsg(e.message, false);
    }
  }

  async function runValidate(showNote, refreshPreviewFromServer) {
    if (!getToken() || !currentAppId) {
      if (showNote) showMsg('Generate an app first, or sign in.', false);
      renderGauge(el('gauge-wrap'), 0);
      renderRadarSingle(el('radar'), [
        { label: 'Clarity', value: 0 },
        { label: 'Logic', value: 0 },
        { label: 'UI consistency', value: 0 },
        { label: 'Reliability', value: 0 },
      ]);
      renderHorizontalBars(el('bench-bars'), [
        { label: 'Sample A', value: 40 },
        { label: 'Sample B', value: 55 },
      ]);
      return;
    }
    try {
      const v = await api('/validateApp', {
        method: 'POST',
        body: JSON.stringify({ appId: currentAppId }),
      });
      renderGauge(el('gauge-wrap'), v.trustScore);
      renderRadarSingle(
        el('radar'),
        v.radar.map((x) => ({ label: x.label, value: x.value }))
      );
      renderHorizontalBars(el('bench-bars'), v.benchmarkBars || []);
      if (refreshPreviewFromServer && v.app && v.app.scaffoldHtml) {
        setPreview(v.app.scaffoldHtml);
      }
      if (showNote) showMsg(`Trust score: ${v.trustScore}%`, true);
    } catch (e) {
      if (showNote) showMsg(e.message, false);
    }
  }

  document.getElementById('btn-generate').addEventListener('click', generate);
  document.getElementById('btn-validate').addEventListener('click', () => runValidate(true, false));
  document.getElementById('btn-preview').addEventListener('click', () => runValidate(true, true));
  document.getElementById('btn-add-field').addEventListener('click', () => {
    fields.push({ label: 'New field', fieldType: 'text', options: [] });
    renderFields();
    // If the user has already generated an app, regenerate so the preview stays in sync.
    if (currentAppId) generate();
  });
  document.getElementById('btn-logout').addEventListener('click', () => window.IteraGenCommon.logout());

  seedFields();
  refreshUserChip();
  renderGauge(el('gauge-wrap'), 0);
  renderRadarSingle(el('radar'), [
    { label: 'Clarity', value: 54 },
    { label: 'Logic', value: 69 },
    { label: 'UI consistency', value: 47 },
    { label: 'Reliability', value: 63 },
  ]);
  renderHorizontalBars(el('bench-bars'), [
    { label: 'Demo A', value: 61 },
    { label: 'Demo B', value: 74 },
    { label: 'Demo C', value: 52 },
  ]);
})();
