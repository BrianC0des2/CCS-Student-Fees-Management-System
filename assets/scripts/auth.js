(function () {

  const AUTH_USER_KEY = "ccs.auth.user";
  const AUTH_VIEW_KEY = "ccs.auth.view";

  function readStorage(key) {
    try {
      const fromLocal = localStorage.getItem(key);
      if (fromLocal !== null) return fromLocal;
    } catch (error) {
    }

    try {
      const fromSession = sessionStorage.getItem(key);
      if (fromSession !== null) return fromSession;
    } catch (error) {
    }

    return null;
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
    }

    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
    }

    try {
      sessionStorage.removeItem(key);
    } catch (error) {
    }
  }

  function getStoredUser() {
    const raw = readStorage(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function setStoredUser(user) {
    writeStorage(AUTH_USER_KEY, JSON.stringify(user));
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
      isFirstLogin: Boolean(account.isFirstLogin),
      permissions: account.permissions
    };

    setStoredUser(user);
    writeStorage(AUTH_VIEW_KEY, "student");

    return { ok: true, user };
  }

  function isFirstLogin() {
    const user = getStoredUser();
    return Boolean(user && user.isFirstLogin === true);
  }

  function changePassword(newPassword) {
    const trimmedPassword = String(newPassword || "").trim();
    if (trimmedPassword.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const user = getStoredUser();
    if (!user) {
      return { ok: false, message: "No active session user." };
    }

    const accounts = window.SAMPLE_ACCOUNTS || [];
    const account = accounts.find((item) => item.id === user.id || item.email === user.email);
    if (!account) {
      return { ok: false, message: "Account not found." };
    }

    account.password = trimmedPassword;
    account.isFirstLogin = false;

    const updatedUser = {
      ...user,
      isFirstLogin: false
    };
    setStoredUser(updatedUser);

    return { ok: true, user: updatedUser };
  }

  function getUser() {
    return getStoredUser();
  }

  function canManageOrg() {
    const user = getStoredUser();
    return Boolean(user && user.permissions && user.permissions.organizationView);
  }

  function isAdmin() {
    const user = getStoredUser();
    return Boolean(user && user.permissions && user.permissions.adminView);
  }

  function isFaculty() {
    const user = getStoredUser();
    return Boolean(user && user.permissions && user.permissions.facultyView);
  }

  function isDean() {
    const user = getStoredUser();
    return Boolean(user && user.permissions && user.permissions.deanView);
  }

  function getView() {
    return readStorage(AUTH_VIEW_KEY) || "student";
  }

  function setView(view) {
    const validViews = ["student", "organization", "faculty", "dean"];
    if (!validViews.includes(view)) {
      return false;
    }

    if (view === "organization" && !canManageOrg()) {
      return false;
    }

    if (view === "faculty" && !isFaculty()) {
      return false;
    }

    if (view === "dean" && !isDean()) {
      return false;
    }

    writeStorage(AUTH_VIEW_KEY, view);
    return true;
  }

  function logout() {
    removeStorage(AUTH_USER_KEY);
    removeStorage(AUTH_VIEW_KEY);
  }

  window.Auth = {
    login,
    isFirstLogin,
    changePassword,
    getUser,
    canManageOrg,
    isAdmin,
    isFaculty,
    isDean,
    getView,
    setView,
    logout
  };
})();
