(function (w) {
  w.IteraGenAuth = {
    requireLogin(redirectUrl) {
      const r = redirectUrl || '/';
      if (!w.IteraGenAPI.getToken()) {
        w.location.replace(r);
        return false;
      }
      return true;
    },
  };
})(window);
