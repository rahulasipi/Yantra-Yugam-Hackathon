(function (global) {
  const USER_KEY = 'iteragen_user';

  function getToken() {
    return global.IteraGenAPI.getToken();
  }

  function refreshUserChip() {
    const nameEl = document.getElementById('chip-name');
    const statusEl = document.getElementById('chip-status');
    const stored = sessionStorage.getItem(USER_KEY);
    if (!nameEl) return;
    if (!getToken() || !stored) {
      nameEl.textContent = 'Guest';
      if (statusEl) statusEl.textContent = 'Sign in';
      return;
    }
    try {
      const u = JSON.parse(stored);
      nameEl.textContent = u.name || u.email || 'Creator';
      if (statusEl) statusEl.textContent = 'Signed in';
    } catch {
      nameEl.textContent = 'Creator';
    }
  }

  function logout() {
    global.IteraGenAPI.setToken(null);
    sessionStorage.removeItem(USER_KEY);
    window.location.href = '/';
  }

  global.IteraGenCommon = { refreshUserChip, logout };
})(window);
