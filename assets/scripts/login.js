(function () {
            function getDashboardPath(user) {
                if (!user || !user.permissions) return 'pages/student/student-dashboard.html';
                if (user.permissions.deanView) return 'pages/dean/dean-dashboard.html';
                if (user.permissions.facultyView) return 'pages/faculty/faculty-dashboard.html';
                if (user.permissions.adminView) return 'pages/admin/admin-dashboard.html';
                if (user.permissions.organizationView) return 'pages/organization/organization-dashboard.html';
                return 'pages/student/student-dashboard.html';
            }

            function appPath(targetPath) {
                var isInsidePagesDir = window.location.pathname.indexOf('/pages/') !== -1;
                if (!isInsidePagesDir) return targetPath;
                return '../../' + targetPath;
            }

            function navigateTo(targetPath) {
                window.location.replace(appPath(targetPath));
            }

            var loginForm = document.getElementById('login-form');
            if (!loginForm) return;

            var forgotLink = document.getElementById('forgot-password-link');
            var forgotOverlay = document.getElementById('forgot-password-overlay');
            var forgotCloseBtn = document.getElementById('fp-close-btn');
            var forgotSendBtn = document.getElementById('send-reset-btn');
            var forgotBackBtn = document.getElementById('fp-back-btn');
            var forgotStep1 = document.getElementById('forgot-step-1');
            var forgotStep2 = document.getElementById('forgot-step-2');
            var forgotIdentifier = document.getElementById('reset-email');
            var forgotEmailError = document.getElementById('email-error');

            function resetForgotPasswordModal() {
                if (!forgotStep1 || !forgotStep2) return;
                forgotStep1.style.display = 'block';
                forgotStep2.style.display = 'none';
                forgotStep1.setAttribute('aria-hidden', 'false');
                forgotStep2.setAttribute('aria-hidden', 'true');
                if (forgotEmailError) {
                    forgotEmailError.style.display = 'none';
                }
            }

            function openForgotPasswordModal() {
                if (!forgotOverlay) return;
                resetForgotPasswordModal();
                forgotOverlay.classList.add('is-open');
                forgotOverlay.setAttribute('aria-hidden', 'false');

                if (forgotIdentifier) {
                    forgotIdentifier.value = '';
                    setTimeout(function () {
                        forgotIdentifier.focus();
                    }, 40);
                }
            }

            function closeForgotPasswordModal() {
                if (!forgotOverlay) return;
                forgotOverlay.classList.remove('is-open');
                forgotOverlay.setAttribute('aria-hidden', 'true');
                resetForgotPasswordModal();
            }

            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();

                var emailInput = document.getElementById('user-email');
                var passwordInput = document.getElementById('user-password');
                var email = emailInput ? emailInput.value.trim() : '';
                var password = passwordInput ? passwordInput.value.trim() : '';

                if (!email || !password) {
                    alert('Please enter both email and password');
                    return;
                }

                if (!window.Auth) {
                    alert('Authentication module failed to load. Please refresh and try again.');
                    return;
                }

                var result = window.Auth.login(email, password);
                if (!result.ok) {
                    alert(result.message);
                    return;
                }

                var user = window.Auth.getUser();
                var dashboardPath = getDashboardPath(user);

                navigateTo(dashboardPath);
            }, true);

            // Password change flow removed - students login directly without forced password change

            if (forgotLink) {
                forgotLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    openForgotPasswordModal();
                });
            }

            if (forgotSendBtn) {
                forgotSendBtn.addEventListener('click', function () {
                    var emailInput = document.getElementById('reset-email');
                    var errorMsg = document.getElementById('email-error');

                    if (!emailInput || !errorMsg) return;

                    if (!emailInput.value || !emailInput.validity.valid) {
                        errorMsg.style.display = 'block';
                        return;
                    }

                    errorMsg.style.display = 'none';
                    document.getElementById('forgot-step-1').style.display = 'none';
                    document.getElementById('forgot-step-2').style.display = 'block';
                    if (forgotStep1) {
                        forgotStep1.setAttribute('aria-hidden', 'true');
                    }
                    forgotStep2.setAttribute('aria-hidden', 'false');
                });
            }

            if (forgotCloseBtn) {
                forgotCloseBtn.addEventListener('click', function () {
                    closeForgotPasswordModal();
                });
            }

            if (forgotBackBtn) {
                forgotBackBtn.addEventListener('click', function () {
                    closeForgotPasswordModal();
                });
            }

            if (forgotOverlay) {
                forgotOverlay.addEventListener('click', function (e) {
                    if (e.target === forgotOverlay) {
                        closeForgotPasswordModal();
                    }
                });
            }
        })();


const togglePassword = document.getElementById(
    'togglePassword'
);
const passwordField = document.getElementById(
    'user-password'
);
const toggleIcon = togglePassword.querySelector('i');

togglePassword.addEventListener('click', function() {
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.className = 'bx bx-show';
    } else {
        passwordField.type = 'password';
        toggleIcon.className = 'bx bx-hide';
    }
});

(function () {
    function parseJsonArray(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_err) {
            return [];
        }
    }

    function parseJsonObject(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_err) {
            return {};
        }
    }

    function resetDemoData() {
        // Clear everything in localStorage completely
        localStorage.clear();
        
        // Also clear sessionStorage
        sessionStorage.clear();
        
        // Confirm reset
        return {
            ok: true,
            message: 'Demo data reset complete. Please refresh the page.'
        };
    }

    window.resetDemoData = resetDemoData;

    const hiddenResetBtn = document.getElementById('reset-demo-data-btn');
    if (hiddenResetBtn) {
        hiddenResetBtn.addEventListener('click', function () {
            resetDemoData();
        });
    }
})();

