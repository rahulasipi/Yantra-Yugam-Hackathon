(function () {
  const { api, getToken, setToken } = window.IteraGenAPI;

  const USER_KEY = 'iteragen_user';

  if (getToken()) {
    window.location.replace('/dashboard.html');
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function showMsg(text, ok) {
    const m = el('auth-msg');
    m.textContent = text || '';
    m.className = `flash-msg ${ok ? 'ok' : 'error'}`;
  }

  function setTab(which) {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === which);
    });
    el('form-login').style.display = which === 'in' ? 'flex' : 'none';
    el('form-register').style.display = which === 'up' ? 'flex' : 'none';
  }

  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => setTab(t.dataset.tab));
  });

  el('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await api('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
        }),
      });
      setToken(data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      showMsg('Signed in. Opening your dashboard…', true);
      window.location.replace('/dashboard.html');
    } catch (err) {
      showMsg(err.message, false);
    }
  });

  el('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const data = await api('/register', {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
          name: fd.get('name'),
        }),
      });
      setToken(data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      showMsg('Welcome aboard. Opening your dashboard…', true);
      window.location.replace('/dashboard.html');
    } catch (err) {
      showMsg(err.message, false);
    }
  });

  setTab('in');
})();
