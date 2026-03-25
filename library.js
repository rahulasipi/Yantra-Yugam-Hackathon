(function () {
  if (!window.IteraGenAuth.requireLogin('/')) return;

  const { api, getToken } = window.IteraGenAPI;
  const { renderLineProgress } = window.IteraGenCharts;
  const { refreshUserChip } = window.IteraGenCommon;

  const BADGE_META = {
    first_deploy: { icon: '⚡', label: 'First deploy' },
    speedy_creator: { icon: '⏱', label: 'Speedy creator' },
    innovator: { icon: '★', label: 'Innovator' },
    logic_master: { icon: '🛡', label: 'Logic master' },
    early_architect: { icon: '◎', label: 'Early architect' },
  };

  let pinnedIds = new Set();

  function el(id) {
    return document.getElementById(id);
  }

  function openPreview(html) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Preview</title></head><body style="margin:0"></body></html>'
    );
    w.document.close();
    const iframe = w.document.createElement('iframe');
    iframe.setAttribute('title', 'App preview');
    iframe.style.cssText = 'width:100%;height:100vh;border:0';
    iframe.srcdoc = html || '<p>No preview stored.</p>';
    w.document.body.appendChild(iframe);
  }

  function renderBadges(earnedTypes) {
    const row = el('badges');
    row.innerHTML = '';
    const all = Object.keys(BADGE_META);
    const set = new Set(earnedTypes || []);
    all.forEach((key) => {
      const meta = BADGE_META[key];
      const div = document.createElement('div');
      div.className = `badge-tile${set.has(key) ? '' : ' locked'}`;
      div.title = meta.label;
      div.innerHTML = `<span class="sparkle"></span><span>${meta.icon}</span>`;
      row.appendChild(div);
    });
  }

  function renderApps(apps) {
    const grid = el('apps-grid');
    grid.innerHTML = '';
    if (!apps.length) {
      grid.innerHTML = '<p class="inline-hint">No saved apps yet — generate one from the dashboard.</p>';
      return;
    }
    apps.forEach((a) => {
      const card = document.createElement('article');
      const isPinned = pinnedIds.has(String(a.id));
      card.className = `app-card${isPinned ? ' card-pinned' : ''}`;
      const trust = a.trustScore != null ? `${Math.round(a.trustScore)}%` : '—';
      card.innerHTML = `
        <div class="thumb">Preview
          <span class="trust-pill">${trust}</span>
        </div>
        <div class="app-card-body">
          <strong></strong>
          <span class="app-card-meta"></span>
          <div class="app-card-actions">
            <button type="button" class="btn btn-ghost btn-sm btn-explore">Explore</button>
            <button type="button" class="btn btn-ghost btn-sm btn-pin"></button>
            <button type="button" class="btn btn-violet btn-sm btn-deploy">Deploy</button>
            <a class="btn btn-primary btn-sm" href="/dashboard.html">Generate new</a>
          </div>
        </div>`;
      card.querySelector('strong').textContent = a.name;
      card.querySelector('.app-card-meta').textContent = `${a.status} · ${new Date(a.createdAt).toLocaleDateString()}`;
      const pinBtn = card.querySelector('.btn-pin');
      pinBtn.textContent = isPinned ? 'Unpin' : 'Pin';
      card.querySelector('.btn-explore').addEventListener('click', () => openPreview(a.scaffoldHtml));
      pinBtn.addEventListener('click', async () => {
        try {
          const res = await api('/togglePinApp', {
            method: 'POST',
            body: JSON.stringify({ appId: a.id }),
          });
          pinnedIds = new Set(res.pinnedAppIds || []);
          renderApps(apps);
        } catch (err) {
          alert(err.message);
        }
      });
      const deployBtn = card.querySelector('.btn-deploy');
      deployBtn.addEventListener('click', async () => {
        try {
          await api('/deploy', {
            method: 'POST',
            body: JSON.stringify({ appId: a.id, version: 'library' }),
          });
          // Refresh app list metadata (status may change)
          const appsData = await api('/apps');
          cachedApps = appsData.apps || [];
          renderApps(cachedApps);
        } catch (err) {
          alert(err.message);
        }
      });
      grid.appendChild(card);
    });
  }

  let cachedApps = [];

  async function load() {
    refreshUserChip();
    if (!getToken()) {
      window.location.replace('/');
      return;
    }
    try {
      const me = await api('/me');
      el('stat-assets').textContent = String(me.apps.length);
      const graded = me.apps.filter((x) => x.trustScore != null);
      const avg =
        graded.length === 0 ? null : graded.reduce((s, x) => s + x.trustScore, 0) / graded.length;
      el('stat-rate').textContent = avg == null ? '—' : `${avg.toFixed(1)}%`;
      el('lib-name').textContent = me.user.name;
      el('lib-email').textContent = me.user.email;
      el('lib-xp').textContent = `${me.user.xp} XP`;

      pinnedIds = new Set(me.user.pinnedAppIds || []);

      const types = (me.user.badges || []).map((b) => b.type);
      renderBadges(types);

      const appsData = await api('/apps');
      cachedApps = appsData.apps || [];
      renderApps(cachedApps);

      const points = cachedApps.slice(0, 8).map((a, i) => ({
        label: `S${i + 1}`,
        y: a.trustScore != null ? a.trustScore : 40 + i * 3,
      }));
      renderLineProgress(el('eff-chart'), points.length ? points : [{ label: '1', y: 20 }]);
    } catch (e) {
      el('stat-assets').textContent = '!';
      el('lib-email').textContent = e.message;
    }
  }

  document.getElementById('btn-logout').addEventListener('click', () => window.IteraGenCommon.logout());

  load();
})();
