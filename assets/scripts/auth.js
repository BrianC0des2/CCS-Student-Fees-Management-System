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

  function getOrganizationScope(account) {
    const merged = mergeAccountWithOverrides(account);
    const isOrganization = Boolean(merged && merged.permissions && merged.permissions.organizationView);
    if (!isOrganization) {
      return null;
    }

    return {
      orgId: merged.id || '',
      organization: merged.organization || merged.name || '',
      academicYear: merged.academicYear || 'S.Y. 2025-2026',
      semester: merged.semester || '2nd Semester'
    };
  }

  function getCurrentOrganizationScope() {
    const user = getStoredUser();
    if (!user) return null;

    const account = (window.SAMPLE_ACCOUNTS || []).find(
      (item) => item.id === user.id || item.email === user.email
    );
    if (!account) return null;

    return getOrganizationScope(account);
  }

  function getOrganizationStorageKey(baseKey, orgId) {
    const scopeId = String(orgId || (getCurrentOrganizationScope() || {}).orgId || 'global').trim() || 'global';
    return `${baseKey}::${scopeId}`;
  }

  function buildSessionUser(account) {
    const merged = mergeAccountWithOverrides(account);
    return {
      id: merged.id,
      name: merged.name,
      studentId: merged.studentId,
      email: merged.email,
      role: merged.role || (merged.permissions && merged.permissions.organizationView ? 'organization' : 'student'),
      organization: merged.organization || '',
      academicYear: merged.academicYear || '',
      semester: merged.semester || '',
      isFirstLogin: Boolean(merged.isFirstLogin),
      sex: merged.sex || "",
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

    // Clean up legacy test override that incorrectly skipped first-login for student1.
    const overrides = getProfileOverrides();
    const accountOverride = overrides[account.id];
    if (
      accountOverride &&
      accountOverride.isFirstLogin === false &&
      accountOverride.religion === "Catholic" &&
      !accountOverride.phoneNumber
    ) {
      delete overrides[account.id];
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
    const user = getStoredUser();
    if (!user) return null;

    const account = (window.SAMPLE_ACCOUNTS || []).find(
      (item) => item.id === user.id || item.email === user.email
    );

    if (!account) {
      return user;
    }

    const merged = mergeAccountWithOverrides(account);
    const hydratedUser = {
      ...user,
      id: merged.id || user.id,
      name: merged.name || user.name,
      studentId: merged.studentId || user.studentId,
      email: merged.email || user.email,
      role: merged.role || user.role || (merged.permissions && merged.permissions.organizationView ? 'organization' : 'student'),
      organization: merged.organization || user.organization || '',
      academicYear: merged.academicYear || user.academicYear || '',
      semester: merged.semester || user.semester || '',
      isFirstLogin: typeof merged.isFirstLogin === "boolean" ? merged.isFirstLogin : Boolean(user.isFirstLogin),
      sex: merged.sex || user.sex || "",
      religion: typeof merged.religion === "string" ? merged.religion : (user.religion || ""),
      phoneNumber: typeof merged.phoneNumber === "string" ? merged.phoneNumber : (user.phoneNumber || ""),
      course: merged.course || user.course || "",
      year: merged.year || user.year || "",
      section: merged.section || user.section || "",
      permissions: merged.permissions || user.permissions
    };

    setStoredUser(hydratedUser);
    return hydratedUser;
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

  window.CCSAuthHelpers = {
    getCurrentOrganizationScope,
    getOrganizationStorageKey,
    getOrganizationScope
  };

  window.CCSStudentDataKeys = window.CCSStudentDataKeys || {
    STUDENT_PAYMENTS_STORAGE_KEY: 'ccs.student.payments',
    PROMISSORY_STORAGE_KEY: 'ccs.promissory.requests'
  };

  const PAYMENTS_STORAGE_KEY = window.CCSStudentDataKeys.STUDENT_PAYMENTS_STORAGE_KEY;
  const LEGACY_PAYMENTS_STORAGE_KEY = 'ccs.payments';
  const PAYMENTS_SEED_VERSION_KEY = 'ccs.student.payments.seedVersion';
  const PAYMENTS_SEED_VERSION = String(window.SAMPLE_PAYMENTS_SEED_VERSION || 1);
  const STUDENT_FEE_STATUS_KEY = 'ccs.student.feeStatus';

  function normalizePaymentStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'confirmed' || normalized === 'paid') return 'Confirmed';
    if (normalized === 'rejected') return 'Rejected';
    if (normalized === 'pending verification' || normalized === 'pending') return 'Pending Verification';
    return 'Pending Verification';
  }

  function getFallbackOrgIdForPayment(payment) {
    const desc = String(payment && (payment.desc || payment.feeName) || '').toLowerCase();
    if (desc.includes('msa')) return 'org-msa-001';
    return 'u-org-001';
  }

  function readPayments() {
    try {
      let raw = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_PAYMENTS_STORAGE_KEY);
        if (raw) {
          localStorage.setItem(PAYMENTS_STORAGE_KEY, raw);
        }
      }

      const currentSeedVersion = localStorage.getItem(PAYMENTS_SEED_VERSION_KEY);
      if (currentSeedVersion !== PAYMENTS_SEED_VERSION) {
        const seeded = (window.SAMPLE_PAYMENTS || []).map(function (payment, index) {
          const orgId = getFallbackOrgIdForPayment(payment);
          const normalizedDate = String(payment.date || '').trim();
          return {
            id: `seed-${index}-${orgId}-${normalizedDate}`,
            orgId: orgId,
            feeId: payment.feeId || `legacy-${orgId}-${String(payment.desc || '').replace(/\s+/g, '-').toLowerCase()}`,
            feeName: payment.desc || payment.feeName || 'Fee',
            studentId: payment.studentNo || payment.studentId || '',
            studentName: payment.studentName || '',
            amount: payment.amount || '₱0.00',
            dateSubmitted: normalizedDate,
            paymentMethod: payment.method || 'Cash',
            referenceNumber: payment.referenceNumber || `PAY-${normalizedDate.slice(0, 4)}-${normalizedDate.slice(5).replace(/-/g, '')}-${String(1000 + index).slice(-4)}`,
            status: 'Confirmed',
            rejectionReason: '',
            createdAt: payment.date ? `${payment.date}T00:00:00.000Z` : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        savePayments(seeded);
        try {
          localStorage.setItem(PAYMENTS_SEED_VERSION_KEY, PAYMENTS_SEED_VERSION);
        } catch (_err) {
        }
        return seeded;
      }

      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function savePayments(payments) {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  }

  function seedPaymentsFromSamples() {
    const existing = readPayments();
    if (existing.length) return existing;

    const seeded = (window.SAMPLE_PAYMENTS || []).map(function (payment, index) {
      const orgId = getFallbackOrgIdForPayment(payment);
      const normalizedDate = String(payment.date || '').trim();
      return {
        id: `seed-${index}-${orgId}-${normalizedDate}`,
        orgId: orgId,
        feeId: payment.feeId || `legacy-${orgId}-${String(payment.desc || '').replace(/\s+/g, '-').toLowerCase()}`,
        feeName: payment.desc || payment.feeName || 'Fee',
        studentId: payment.studentNo || payment.studentId || '',
        studentName: payment.studentName || '',
        amount: payment.amount || '₱0.00',
        dateSubmitted: normalizedDate,
        paymentMethod: payment.method || 'Cash',
        referenceNumber: payment.referenceNumber || `PAY-${normalizedDate.slice(0, 4)}-${normalizedDate.slice(5).replace(/-/g, '')}-${String(1000 + index).slice(-4)}`,
        status: 'Confirmed',
        rejectionReason: '',
        createdAt: payment.date ? `${payment.date}T00:00:00.000Z` : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    savePayments(seeded);
    try {
      localStorage.setItem(PAYMENTS_SEED_VERSION_KEY, PAYMENTS_SEED_VERSION);
    } catch (_err) {
    }
    return seeded;
  }

  function getPayments() {
    return seedPaymentsFromSamples().slice();
  }

  function savePayment(payment) {
    const payments = readPayments();
    payments.push(payment);
    savePayments(payments);
    return payment;
  }

  function updatePayment(referenceNumber, updates) {
    const payments = readPayments();
    const next = payments.map(function (payment) {
      if (payment.referenceNumber !== referenceNumber) return payment;
      return {
        ...payment,
        ...updates,
        status: normalizePaymentStatus(updates.status || payment.status),
        updatedAt: new Date().toISOString()
      };
    });
    savePayments(next);
    return next.find(function (payment) { return payment.referenceNumber === referenceNumber; }) || null;
  }

  function generateReferenceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = String(Math.floor(Math.random() * 9000) + 1000);
    return `PAY-${year}-${mmdd}-${random}`;
  }

  function getPaymentsForOrg(orgId) {
    return getPayments().filter(function (payment) {
      return String(payment.orgId || '') === String(orgId || '');
    });
  }

  function getPaymentsForStudent(studentId) {
    return getPayments().filter(function (payment) {
      return String(payment.studentId || payment.studentNo || '') === String(studentId || '');
    });
  }

  function readFeeStatusMap() {
    try {
      const raw = localStorage.getItem(STUDENT_FEE_STATUS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  function saveFeeStatusMap(map) {
    localStorage.setItem(STUDENT_FEE_STATUS_KEY, JSON.stringify(map || {}));
  }

  function setFeeStatuses(studentId, feeIds, status) {
    const map = readFeeStatusMap();
    const normalized = String(status || '').trim().toLowerCase();
    const normalizedStatus = normalized === 'confirmed' || normalized === 'paid'
      ? 'paid'
      : normalized === 'rejected'
        ? 'rejected'
        : 'pending verification';
    const ids = Array.isArray(feeIds) ? feeIds : [feeIds];

    ids.forEach(function (feeId) {
      const key = `${String(studentId || '')}::${String(feeId || '')}`;
      if (!String(feeId || '').trim()) return;
      map[key] = normalizedStatus;
    });

    saveFeeStatusMap(map);
    return map;
  }

  function getFeeStatus(studentId, feeId) {
    const map = readFeeStatusMap();
    return map[`${String(studentId || '')}::${String(feeId || '')}`] || '';
  }

  window.CCSPaymentStore = {
    getPayments,
    savePayment,
    updatePayment,
    generateReferenceNumber,
    getPaymentsForOrg,
    getPaymentsForStudent,
    normalizePaymentStatus,
    setFeeStatuses,
    getFeeStatus,
    readFeeStatusMap
  };

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
