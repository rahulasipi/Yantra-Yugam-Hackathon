(function () {
  if (!window.IteraGenAuth.requireLogin('/')) return;

  const { api, getToken, setToken } = window.IteraGenAPI;
  const { refreshUserChip } = window.IteraGenCommon;

  const USER_KEY = 'iteragen_user';

  const BADGE_META = {
    first_deploy: { icon: '⚡', label: 'First deploy' },
    speedy_creator: { icon: '⏱', label: 'Speedy creator' },
    innovator: { icon: '★', label: 'Innovator' },
    logic_master: { icon: '🛡', label: 'Logic master' },
    early_architect: { icon: '◎', label: 'Early architect' },
  };

  function el(id) {
    return document.getElementById(id);
  }

  function renderBadges(earnedTypes) {
    const row = el('profile-badges');
    if (!row) return;
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

  function showProfileMsg(text, ok) {
    const m = el('profile-msg');
    m.textContent = text || '';
    m.className = `flash-msg ${ok ? 'ok' : 'error'}`;
  }

  async function loadProfile() {
    try {
      const me = await api('/me');
      el('prof-apps').textContent = String(me.apps.length);
      el('prof-xp').textContent = String(me.user.xp);
      el('prof-badges').textContent = String((me.user.badges || []).length);
      renderBadges((me.user.badges || []).map((b) => b.type));

      const body = el('archive-body');
      body.innerHTML = '';
      if (!me.apps.length) {
        body.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">No apps yet — use the generator to create one.</td></tr>';
      } else {
        me.apps.forEach((a) => {
          const tr = document.createElement('tr');
          const pct = a.trustScore != null ? Math.min(100, Math.max(0, a.trustScore)) : 0;
          const w = a.trustScore != null ? pct : 12;
          tr.innerHTML = `<td>${a.name}</td><td>${new Date(a.createdAt).toLocaleString()}</td><td><div class="progress-mini"><div style="width:${w}%"></div></div></td><td>${a.status}</td>`;
          body.appendChild(tr);
        });
      }

      const sel = el('fb-app');
      sel.innerHTML = '<option value="">Choose an app…</option>';
      me.apps.forEach((a) => {
        const o = document.createElement('option');
        o.value = a.id;
        o.textContent = a.name;
        sel.appendChild(o);
      });

      sessionStorage.setItem(USER_KEY, JSON.stringify({ name: me.user.name, email: me.user.email }));
      refreshUserChip();
      showProfileMsg('', true);
    } catch (e) {
      setToken(null);
      sessionStorage.removeItem(USER_KEY);
      refreshUserChip();
      window.location.replace('/');
    }
  }

  el('form-feedback').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!getToken()) {
      window.location.replace('/');
      return;
    }
    const fd = new FormData(e.target);
    try {
      await api('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          appId: fd.get('appId'),
          comments: fd.get('comments'),
          rating: fd.get('rating'),
        }),
      });
      const box = el('fb-success');
      box.classList.remove('show');
      void box.offsetWidth;
      box.classList.add('show');
      e.target.reset();
      el('fb-app').selectedIndex = 0;
      showProfileMsg('Feedback saved.', true);
    } catch (err) {
      showProfileMsg(err.message, false);
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => window.IteraGenCommon.logout());

  refreshUserChip();
  loadProfile();
})();
