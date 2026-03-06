(function () {
  // AUTH MODULE FLOW
  // 1) Keep session state in localStorage.
  // 2) Validate login using window.SAMPLE_ACCOUNTS.
  // 3) Expose small public API via window.Auth for other scripts.
  // 4) Route guards/UI code call these helpers to enforce access.
  // TYPE GUIDE (for this file)
  // - USER-DEFINED FUNCTION: declared in this file using `function ...`.
  // - PREDEFINED API: built-in browser/JS APIs (localStorage, JSON, Array.find, Boolean, window).
  // PREDEFINED API QUICK GUIDE (simple meaning)
  // - window: browser global object (shared place to expose data/functions).
  // - localStorage.getItem(key): read saved text by key name.
  // - localStorage.setItem(key, value): save text under a key name.
  // - localStorage.removeItem(key): delete saved text by key name.
  // - JSON.stringify(obj): convert object -> text so it can be stored.
  // - JSON.parse(text): convert stored text -> object so code can use fields.
  // - Array.find(callback): return first array item that matches a condition.
  // - Boolean(value): force any value into true/false.

  // This is only the key NAME (label) for user data in localStorage.
  // Actual user data is saved/retrieved using this label.
  const AUTH_USER_KEY = "ccs.auth.user";
  // This is only the key NAME (label) for the selected dashboard view.
  // Value is usually "student" or "organization".
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

  // Read user data from localStorage and convert JSON string back to object
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Return logged-in user from storage, or null when missing/invalid JSON.
  // PREDEFINED APIS USED: localStorage.getItem, JSON.parse.
  function getStoredUser() {
    // PREDEFINED: storage read helper returns saved text using AUTH_USER_KEY.
    const raw = readStorage(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      // PREDEFINED: JSON.parse converts stored text back into an object.
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  // Save user object in localStorage as a JSON string
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Persist session-safe user object in browser storage.
  // PREDEFINED APIS USED: localStorage.setItem, JSON.stringify.
  function setStoredUser(user) {
    // PREDEFINED: JSON.stringify converts object to text for storage.
    // PREDEFINED: storage write helper saves that text under AUTH_USER_KEY.
    writeStorage(AUTH_USER_KEY, JSON.stringify(user));
  }

  // LOGIN FLOW
  // - Find matching account by email+password
  // - Return failure payload if no match
  // - Build a reduced/safe session object (do not store password)
  // - Persist session + default UI view
  // - Return success payload to caller
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Authenticate credentials against demo data and initialize session/view.
  // PREDEFINED APIS USED: Array.find, localStorage.setItem.
  function login(email, password) {
    // PREDEFINED: Array.find checks each account and returns first match.
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
    // Default view right after login is student view
    // PREDEFINED: storage write helper saves selected view as text.
    writeStorage(AUTH_VIEW_KEY, "student");

    return { ok: true, user };
  }

  // Public helper to get currently logged-in user
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Provide a public accessor for current session user.
  function getUser() {
    return getStoredUser();
  }

  // True if logged-in user has permission to access organization dashboard
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Check if current session allows organization dashboard access.
  // PREDEFINED APIS USED: Boolean.
  function canManageOrg() {
    const user = getStoredUser();
    // PREDEFINED: Boolean(...) ensures final result is true/false only.
    return Boolean(user && user.permissions && user.permissions.organizationView);
  }

  // Role helper placeholders for future route rules (admin/faculty/dean pages).
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Check admin permission flag from stored user.
  function isAdmin() {
    const user = getStoredUser();
    // PREDEFINED: Boolean(...) ensures final result is true/false only.
    return Boolean(user && user.permissions && user.permissions.adminView);
  }

  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Check faculty permission flag from stored user.
  function isFaculty() {
    const user = getStoredUser();
    // PREDEFINED: Boolean(...) ensures final result is true/false only.
    return Boolean(user && user.permissions && user.permissions.facultyView);
  }

  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Check dean permission flag from stored user.
  function isDean() {
    const user = getStoredUser();
    // PREDEFINED: Boolean(...) ensures final result is true/false only.
    return Boolean(user && user.permissions && user.permissions.deanView);
  }


  // Get current dashboard view; default to student when missing
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Read saved UI view preference from storage.
  // PREDEFINED APIS USED: localStorage.getItem.
  function getView() {
    // PREDEFINED: storage read helper reads saved view text by key.
    return readStorage(AUTH_VIEW_KEY) || "student";
  }

  // VIEW SWITCH FLOW
  // - Accept only known view values
  // - Validate role permission for organization view
  // - Persist final view so next page load can restore it
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Validate and save the active dashboard context.
  // PREDEFINED APIS USED: localStorage.setItem.
  function setView(view) {
    // Only two valid values are accepted
    if (view !== "student" && view !== "organization") {
      return false;
    }

    // Block organization view for users without permission
    if (view === "organization" && !canManageOrg()) {
      return false;
    }

    // PREDEFINED: storage write helper saves the accepted view text.
    writeStorage(AUTH_VIEW_KEY, view);
    return true;
  }

  // End session by removing saved user and current view
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Clear session and view preference from storage.
  // PREDEFINED APIS USED: localStorage.removeItem.
  function logout() {
    // PREDEFINED: storage remove helper deletes saved entries by key.
    removeStorage(AUTH_USER_KEY);
    removeStorage(AUTH_VIEW_KEY);
  }

  // Public interface consumed by route guards, login page, and profile switch UI.
  window.Auth = {
    login,
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
