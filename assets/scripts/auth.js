(function () {

  const AUTH_USER_KEY = "ccs.auth.user";
  const AUTH_VIEW_KEY = "ccs.auth.view";
  const ACCOUNT_PROFILE_OVERRIDES_KEY = "ccs.auth.accountProfileOverrides";

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

  function getProfileOverrides() {
    try {
      const raw = localStorage.getItem(ACCOUNT_PROFILE_OVERRIDES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveProfileOverrides(overrides) {
    try {
      localStorage.setItem(ACCOUNT_PROFILE_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (error) {
    }
  }

  function mergeAccountWithOverrides(account) {
    const overrides = getProfileOverrides();
    const accountOverrides = account && account.id ? (overrides[account.id] || {}) : {};
    return {
      ...(account || {}),
      ...accountOverrides
    };
  }

  function buildSessionUser(account) {
    const merged = mergeAccountWithOverrides(account);
    return {
      id: merged.id,
      name: merged.name,
      studentId: merged.studentId,
      email: merged.email,
      isFirstLogin: Boolean(merged.isFirstLogin),
      religion: merged.religion || "",
      phoneNumber: merged.phoneNumber || "",
      course: merged.course || "",
      year: merged.year || "",
      section: merged.section || "",
      permissions: merged.permissions
    };
  }

  function login(email, password) {
    const account = (window.SAMPLE_ACCOUNTS || []).find(
      (item) => item.email === email && item.password === password
    );

    if (!account) {
      return { ok: false, message: "Invalid credentials" };
    }

    if (account.id === "u-student-001") {
      const overrides = getProfileOverrides();
      overrides[account.id] = {
        ...(overrides[account.id] || {}),
        isFirstLogin: false,
        religion: "Catholic"
      };
      saveProfileOverrides(overrides);
    }

    const user = buildSessionUser(account);

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

  function updateCurrentUserProfile(profileUpdates) {
    const user = getStoredUser();
    if (!user) {
      return { ok: false, message: "No active session user." };
    }

    const updates = {
      religion: typeof profileUpdates.religion === "string" ? profileUpdates.religion : user.religion,
      phoneNumber: typeof profileUpdates.phoneNumber === "string" ? profileUpdates.phoneNumber : user.phoneNumber,
      isFirstLogin: typeof profileUpdates.isFirstLogin === "boolean" ? profileUpdates.isFirstLogin : user.isFirstLogin
    };

    const overrides = getProfileOverrides();
    overrides[user.id] = {
      ...(overrides[user.id] || {}),
      ...updates
    };
    saveProfileOverrides(overrides);

    const updatedUser = {
      ...user,
      ...updates
    };
    setStoredUser(updatedUser);

    return { ok: true, user: updatedUser };
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

  const PENDING_SIGNUPS_KEY = "ccs.pending.signups";

  function savePendingSignup(signupData) {
    try {
      let pending = [];
      const raw = localStorage.getItem(PENDING_SIGNUPS_KEY);
      if (raw) {
        try {
          pending = JSON.parse(raw);
        } catch (e) {
          pending = [];
        }
      }

      const signup = {
        id: 'PENDING-' + Date.now(),
        firstName: signupData.firstName || '',
        surname: signupData.surname || '',
        middleName: signupData.middleName || '',
        suffix: signupData.suffix || '',
        studentId: signupData.studentId || '',
        course: signupData.course || '',
        year: signupData.year || '',
        section: signupData.section || '',
        sex: signupData.sex || '',
        email: signupData.email || '',
        password: signupData.password || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      pending.push(signup);
      localStorage.setItem(PENDING_SIGNUPS_KEY, JSON.stringify(pending));
      return { ok: true, id: signup.id };
    } catch (error) {
      return { ok: false, message: 'Failed to save signup' };
    }
  }

  function getPendingSignups() {
    try {
      const raw = localStorage.getItem(PENDING_SIGNUPS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (error) {
      return [];
    }
  }

  function approvePendingSignup(signupId) {
    try {
      let pending = getPendingSignups();
      const signup = pending.find(s => s.id === signupId);
      if (!signup) {
        return { ok: false, message: 'Signup not found' };
      }

      const name = [signup.firstName, signup.middleName, signup.surname].filter(Boolean).join(' ').trim();
      const newAccount = {
        id: 'u-' + signup.studentId.toLowerCase(),
        name: name,
        studentId: signup.studentId,
        email: signup.email,
        password: signup.password,
        isFirstLogin: false,
        course: signup.course,
        year: signup.year,
        section: signup.section,
        sex: signup.sex || '',
        permissions: {
          studentView: true,
          organizationView: false,
          adminView: false,
          facultyView: false,
          deanView: false
        }
      };

      window.SAMPLE_ACCOUNTS = window.SAMPLE_ACCOUNTS || [];
      window.SAMPLE_ACCOUNTS.push(newAccount);

      pending = pending.filter(s => s.id !== signupId);
      localStorage.setItem(PENDING_SIGNUPS_KEY, JSON.stringify(pending));
      return { ok: true, account: newAccount };
    } catch (error) {
      return { ok: false, message: 'Failed to approve signup' };
    }
  }

  function rejectPendingSignup(signupId) {
    try {
      let pending = getPendingSignups();
      pending = pending.filter(s => s.id !== signupId);
      localStorage.setItem(PENDING_SIGNUPS_KEY, JSON.stringify(pending));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: 'Failed to reject signup' };
    }
  }

  window.Auth = {
    login,
    isFirstLogin,
    changePassword,
    getUser,
    updateCurrentUserProfile,
    canManageOrg,
    isAdmin,
    isFaculty,
    isDean,
    getView,
    setView,
    logout,
    savePendingSignup,
    getPendingSignups,
    approvePendingSignup,
    rejectPendingSignup
  };
})();
