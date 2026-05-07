'use strict';

/**
 * Semester Manager - Handles all semester-related operations
 * Manages semester status, transitions, and auto-start functionality
 */

window.SemesterManager = {

    init: function() {
        this.loadSemesters();
        this.checkAutoTransitions();
    },

    loadSemesters: function() {
        const stored = localStorage.getItem('ccs.semesters');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Only load if it's a valid array (not a seeded default)
                window.semesterList = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                window.semesterList = [];
            }
        } else {
            // Do NOT seed any default semesters — admin creates them manually
            window.semesterList = [];
        }
    },

    saveSemesters: function() {
        localStorage.setItem('ccs.semesters', JSON.stringify(window.semesterList || []));
    },

    getCurrentSemester: function() {
        if (!window.semesterList) return null;
        return window.semesterList.find(s => s.status === 'active') || null;
    },

    getAllSemesters: function() {
        return window.semesterList || [];
    },

    getSemesterById: function(id) {
        if (!window.semesterList) return null;
        return window.semesterList.find(s => s.id === id) || null;
    },

    getSemestersByYear: function(schoolYear) {
        if (!window.semesterList) return [];
        return window.semesterList.filter(s => s.schoolYear === schoolYear);
    },

    setActiveSemester: function(semesterId) {
        if (!window.semesterList) return false;

        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;

        const current = this.getCurrentSemester();
        if (current && current.id !== semesterId) {
            current.status = 'completed';
            current.completedDate = new Date().toISOString();
        }

        semester.status = 'active';
        semester.activatedDate = new Date().toISOString();
        semester.activatedBy = window.Auth?.getUser()?.id || 'admin';

        this.saveSemesters();

        localStorage.setItem('ccs.academic.settings', JSON.stringify({
            academicYear: semester.schoolYear,
            semester: semester.name,
            paymentStartDate: semester.paymentStartDate || null,
            paymentDeadline: semester.paymentDeadline || null,
            semesterStartDate: semester.startDate || null,
            semesterEndDate: semester.endDate || null
        }));

        this.logSemesterTransition('MANUAL', current?.id, semesterId);
        return true;
    },

    completeSemester: function(semesterId) {
        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;

        const wasActive = semester.status === 'active';

        semester.status = 'completed';
        semester.completedDate = new Date().toISOString();
        semester.completedBy = window.Auth?.getUser()?.id || 'admin';

        this.saveSemesters();
        if (wasActive) {
            localStorage.removeItem('ccs.academic.settings');
        }
        this.logSemesterTransition('COMPLETED', semesterId, null);
        return true;
    },

    createSemester: function(data) {
        if (!window.semesterList) window.semesterList = [];

        const exists = window.semesterList.find(s =>
            s.schoolYear === data.schoolYear && s.name === data.name
        );
        if (exists) return null;

        const newSemester = {
            id: 'SEM-' + Date.now(),
            schoolYear: data.schoolYear,
            name: data.name,
            status: 'inactive',
            startDate: data.startDate,
            endDate: data.endDate,
            paymentStartDate: data.paymentStartDate,
            paymentDeadline: data.paymentDeadline,
            autoStartDate: data.autoStartDate || null,
            autoStartEnabled: data.autoStartEnabled || false,
            createdDate: new Date().toISOString(),
            createdBy: window.Auth?.getUser()?.id || 'admin',
            description: data.description || ''
        };

        window.semesterList.push(newSemester);
        this.saveSemesters();
        this.logSemesterTransition('CREATED', null, newSemester.id);
        return newSemester;
    },

    updateSemester: function(semesterId, data) {
        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;

        const updatableFields = ['name', 'startDate', 'endDate', 'paymentStartDate', 'paymentDeadline', 'description', 'autoStartDate', 'autoStartEnabled'];
        updatableFields.forEach(field => {
            if (data[field] !== undefined) {
                semester[field] = data[field];
            }
        });

        semester.lastModifiedDate = new Date().toISOString();
        semester.lastModifiedBy = window.Auth?.getUser()?.id || 'admin';

        this.saveSemesters();
        this.logSemesterTransition('UPDATED', semesterId, null);
        return true;
    },

    deleteSemester: function(semesterId) {
        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;
        if (semester.status === 'active') return false;

        window.semesterList = window.semesterList.filter(s => s.id !== semesterId);
        this.saveSemesters();
        this.logSemesterTransition('DELETED', semesterId, null);
        return true;
    },

    checkAutoTransitions: function() {
        if (!window.semesterList) return;

        const now = new Date();
        let transitioned = false;

        window.semesterList.forEach(semester => {
            if (!semester.autoStartEnabled || semester.status !== 'inactive') return;
            if (semester.autoStartDate) {
                const autoDate = new Date(semester.autoStartDate);
                if (now >= autoDate) {
                    this.setActiveSemester(semester.id);
                    transitioned = true;
                }
            }
        });

        return transitioned;
    },

    getSemesterBadgeHTML: function() {
        try {
            const raw = localStorage.getItem('ccs.academic.settings');
            if (!raw) return '';
            const parsed = JSON.parse(raw);
            if (!parsed.semester || !parsed.academicYear) return '';
            return `<span class="semester-badge semester-badge--active" title="School Year: ${parsed.academicYear}">
                S.Y. ${parsed.academicYear} | ${parsed.semester}
            </span>`;
        } catch (e) {
            return '';
        }
    },

    getSemesterSidebarBadgeHTML: function() {
        try {
            const raw = localStorage.getItem('ccs.academic.settings');
            if (!raw) return '';
            const parsed = JSON.parse(raw);
            if (!parsed.semester || !parsed.academicYear) return '';
            return `<span class="semester-badge semester-badge--active" title="School Year: ${parsed.academicYear}">
                S.Y. ${parsed.academicYear} | ${parsed.semester}
            </span>`;
        } catch (e) {
            return '';
        }
    },

    logSemesterTransition: function(action, fromSemesterId, toSemesterId) {
        if (!window.auditLogs) window.auditLogs = [];

        const details = action === 'MANUAL'
            ? `Manually activated semester ${toSemesterId}`
            : action === 'AUTO'
            ? `Automatically activated semester ${toSemesterId}`
            : action === 'COMPLETED'
            ? `Marked semester ${fromSemesterId} as completed`
            : action === 'CREATED'
            ? `Created new semester ${toSemesterId}`
            : action === 'UPDATED'
            ? `Updated semester ${fromSemesterId}`
            : action === 'DELETED'
            ? `Deleted semester ${fromSemesterId}`
            : `Semester transition: ${action}`;

        window.auditLogs.push({
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toISOString(),
            user: window.Auth?.getUser()?.name || 'System',
            role: window.Auth?.getUser()?.role || 'admin',
            action: `Semester ${action}`,
            details: details,
            ipAddress: window.location.hostname,
            type: action === 'CREATED' || action === 'UPDATED' ? 'info' : action === 'DELETED' ? 'warning' : 'success'
        });
    },
    formatSemesterInfo: function(semester) {
    if (!semester) return 'No semester selected';
    const statusEmoji = {
        'active': '✓',
        'inactive': '○',
        'completed': '✓'
    };
    return `S.Y. ${semester.schoolYear} • ${semester.name} ${statusEmoji[semester.status] || ''}`;
    },

    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    isPaymentDeadlinePassed: function(semester) {
        if (!semester || !semester.paymentDeadline) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const deadline = new Date(semester.paymentDeadline + 'T00:00:00');
        return now > deadline;
    },

    isPaymentWindowOpen: function() {
        try {
            const raw = localStorage.getItem('ccs.academic.settings');
            if (!raw) return true; // No window set = always open
            const settings = JSON.parse(raw);
            if (!settings.paymentStartDate || !settings.paymentDeadline) return true;

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const start = new Date(settings.paymentStartDate + 'T00:00:00');
            const deadline = new Date(settings.paymentDeadline + 'T00:00:00');

            return now >= start && now <= deadline;
        } catch (e) {
            return true;
        }
    },

    daysUntilDeadline: function(semester) {
        if (!semester || !semester.paymentDeadline) return null;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const deadline = new Date(semester.paymentDeadline + 'T00:00:00');
        const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SemesterManager.init());
} else {
    window.SemesterManager.init();
}
