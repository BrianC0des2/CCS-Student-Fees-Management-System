'use strict';

/* ─────────────────────────────────────────────────────────────────
   IMMEDIATE INIT — runs as soon as the script is parsed.
   Applies any stored theme/font preference to <html> BEFORE the
   browser paints, preventing a flash of default styles.
───────────────────────────────────────────────────────────────── */
(function applyStoredPreferences() {
    const theme = localStorage.getItem('ccs.theme') || 'light';
    const font  = localStorage.getItem('ccs.font')  || 'default';
    if (theme === 'dark')     document.documentElement.classList.add('theme-dark');
    if (font  === 'dyslexic') document.documentElement.classList.add('font-dyslexic');
}());

/* ─────────────────────────────────────────────────────────────────
   MODAL + EVENT LOGIC — runs after the DOM is ready.
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

    /* ── Inject overlay ── */
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    document.body.appendChild(overlay);

    /* ── Inject slide-in panel ── */
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.innerHTML = `
        <div class="sp-header">
            <span class="sp-title">
                <i class="bx bx-cog"></i> Settings
            </span>
            <button class="sp-close-btn" id="sp-close-btn" aria-label="Close settings">
                <i class="bx bx-x"></i>
            </button>
        </div>
        <div class="sp-body">
            <div>
                <div class="sp-section-label">Theme</div>
                <div class="sp-option-grid">
                    <button class="sp-opt" data-setting="theme" data-value="light">
                        <i class="bx bx-sun"></i>
                        <span class="sp-opt-label">Light</span>
                        <span class="sp-opt-sub">Default</span>
                    </button>
                    <button class="sp-opt" data-setting="theme" data-value="dark">
                        <i class="bx bx-moon"></i>
                        <span class="sp-opt-label">Dark</span>
                        <span class="sp-opt-sub">Easier on eyes</span>
                    </button>
                </div>
            </div>
            <div>
                <div class="sp-section-label">Accessibility — Font</div>
                <div class="sp-option-grid">
                    <button class="sp-opt" data-setting="font" data-value="default">
                        <i class="bx bx-font"></i>
                        <span class="sp-opt-label">Default</span>
                        <span class="sp-opt-sub">Poppins</span>
                    </button>
                    <button class="sp-opt font-dyslexic-preview" data-setting="font" data-value="dyslexic">
                        <i class="bx bx-font"></i>
                        <span class="sp-opt-label">Dyslexic</span>
                        <span class="sp-opt-sub">Atkinson Hyperlegible</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    /* ── Sync active state on option buttons ── */
    function syncActive() {
        const theme = localStorage.getItem('ccs.theme') || 'light';
        const font  = localStorage.getItem('ccs.font')  || 'default';
        panel.querySelectorAll('.sp-opt').forEach(function (btn) {
            const isActive =
                (btn.dataset.setting === 'theme' && btn.dataset.value === theme) ||
                (btn.dataset.setting === 'font'  && btn.dataset.value === font);
            btn.classList.toggle('active', isActive);
        });
    }

    /* ── Open / close ── */
    function openPanel() {
        panel.classList.add('sp-open');
        overlay.classList.add('sp-open');
        syncActive();
    }

    function closePanel() {
        panel.classList.remove('sp-open');
        overlay.classList.remove('sp-open');
    }

    document.getElementById('sp-close-btn').addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    /* ── Option button clicks ── */
    panel.querySelectorAll('.sp-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const setting = btn.dataset.setting;
            const value   = btn.dataset.value;

            localStorage.setItem('ccs.' + setting, value);

            if (setting === 'theme') {
                document.documentElement.classList.toggle('theme-dark', value === 'dark');
            }
            if (setting === 'font') {
                document.documentElement.classList.toggle('font-dyslexic', value === 'dyslexic');
            }

            syncActive();
        });
    });

    /* ── Hook sidebar Settings links ──
       Works for both hardcoded sidebars and sidebar-template.js.
       Any element with class "js-settings-open" will open the panel. */
    document.addEventListener('click', function (e) {
        const link = e.target.closest('.js-settings-open');
        if (link) {
            e.preventDefault();
            openPanel();
        }
    });

    /* ── Expose globally so admin renderSystem() can open the panel ── */
    window.openSettingsPanel = openPanel;
});
