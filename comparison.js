(function () {
  if (!window.IteraGenAuth.requireLogin('/')) return;

  const { api, getToken } = window.IteraGenAPI;
  const { renderRadarDual, renderGroupedBars } = window.IteraGenCharts;
  const { refreshUserChip } = window.IteraGenCommon;

  let apps = [];
  let versionAId = null;
  let versionBId = null;
  let lastCompare = null;

  function el(id) { return document.getElementById(id); }

  function showMsg(t, ok) {
    const m = el('cmp-msg');
    m.textContent = t || '';
    m.className = `flash-msg ${ok ? 'ok' : 'error'}`;
  }

  function snippetFromHtml(html) {
    const s = String(html || '').slice(0, 2400);
    return s.length < 50 ? 'No scaffold yet.' : `${s}\n\n… trimmed for readability`;
  }

  function bindFlip() {
    document.querySelectorAll('.btn-flip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.target;
        document.getElementById(id).classList.toggle('flipped');
      });
    });
  }

  async function loadApps() {
    if (!getToken()) {
      showMsg('Sign in on the Profile page to load your library.', false);
      return;
    }
    try {
      const data = await api('/apps');
      apps = data.apps || [];
      const sa = el('sel-a');
      const sb = el('sel-b');
      sa.innerHTML = '';
      sb.innerHTML = '';
      apps.forEach((a) => {
        const t = `${a.name} (${a.status})`;
        const o1 = document.createElement('option');
        o1.value = a.id;
        o1.textContent = t;
        sa.appendChild(o1);
        const o2 = document.createElement('option');
        o2.value = a.id;
        o2.textContent = t;
        sb.appendChild(o2);
      });
      if (apps.length >= 2) {
        sa.selectedIndex = 0;
        sb.selectedIndex = 1;
      }
    } catch (e) {
      showMsg(e.message, false);
    }
  }

  async function compare() {
    if (!getToken()) {
      showMsg('Please sign in first.', false);
      return;
    }
    const a = el('sel-a').value;
    const b = el('sel-b').value;
    if (!a || !b || a === b) {
      showMsg('Choose two different apps from your library.', false);
      return;
    }
    showMsg('Analyzing…', true);
    try {
      const data = await api('/compareApps', {
        method: 'POST',
        body: JSON.stringify({ appIdA: a, appIdB: b }),
      });
      lastCompare = data;
      versionAId = data.versionA.id;
      versionBId = data.versionB.id;
      el('iframe-a').srcdoc = data.versionA.scaffoldHtml || '';
      el('iframe-b').srcdoc = data.versionB.scaffoldHtml || '';
      el('code-a').textContent = snippetFromHtml(data.versionA.scaffoldHtml);
      el('code-b').textContent = snippetFromHtml(data.versionB.scaffoldHtml);
      el('forecast').textContent = data.stabilityForecast || '';
      const d = data.trustDeltaPercent;
      const sign = d > 0 ? '+' : '';
      el('delta').textContent = `${sign}${d}% (${data.favoring === 'b' ? 'favors B' : data.favoring === 'a' ? 'favors A' : 'balanced'})`;
      const radarItems = (data.radar || []).map((r) => ({
        label: r.label,
        a: r.a,
        b: r.b,
      }));
      renderRadarDual(el('radar-dual'), radarItems);
      renderGroupedBars(el('group-bars'), data.barMetrics || []);
      showMsg('Comparison ready. Both previews are interactive.', true);
    } catch (e) {
      showMsg(e.message, false);
    }
  }

  async function deploy(version) {
    const id = version === 'a' ? versionAId : versionBId;
    if (!id) {
      showMsg('Run a comparison first.', false);
      return;
    }
    try {
      await api('/deploy', {
        method: 'POST',
        body: JSON.stringify({ appId: id, version }),
      });
      showMsg(`Version ${version.toUpperCase()} marked as deployed.`, true);
      await loadApps();
    } catch (e) {
      showMsg(e.message, false);
    }
  }

  el('btn-compare').addEventListener('click', compare);
  el('btn-deploy-a').addEventListener('click', () => deploy('a'));
  el('btn-deploy-b').addEventListener('click', () => deploy('b'));
  el('btn-logout').addEventListener('click', () => window.IteraGenCommon.logout());
  el('btn-swap').addEventListener('click', () => {
    const sa = el('sel-a');
    const sb = el('sel-b');
    const tmp = sa.value;
    sa.value = sb.value;
    sb.value = tmp;
    if (lastCompare) compare();
  });

  bindFlip();
  refreshUserChip();
  loadApps();
})();
