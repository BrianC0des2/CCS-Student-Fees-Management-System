(function () {
  const AUTH_USER_KEY = "ccs.auth.user";
  const AUTH_VIEW_KEY = "ccs.auth.view";

  function getStoredUser() {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function setStoredUser(user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  function login(email, password) {
    const account = (window.SAMPLE_ACCOUNTS || []).find(
      (item) => item.email === email && item.password === password
    );

    if (!account) {
      return { ok: false, message: "Invalid credentials" };
    }

    const user = {
      id: account.id,
      name: account.name,
      studentId: account.studentId,
      email: account.email,
      permissions: account.permissions
    };

    setStoredUser(user);
    localStorage.setItem(AUTH_VIEW_KEY, "student");

    return { ok: true, user };
  }

  function getUser() {
    return getStoredUser();
  }

  function canManageOrg() {
    const user = getStoredUser();
    return Boolean(user && user.permissions && user.permissions.organizationView);
  }

  function getView() {
    return localStorage.getItem(AUTH_VIEW_KEY) || "student";
  }

  function setView(view) {
    if (view !== "student" && view !== "organization") {
      return false;
    }

    if (view === "organization" && !canManageOrg()) {
      return false;
    }

    localStorage.setItem(AUTH_VIEW_KEY, view);
    return true;
  }

  function logout() {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_VIEW_KEY);
  }

  window.Auth = {
    login,
    getUser,
    canManageOrg,
    getView,
    setView,
    logout
  };
})();
