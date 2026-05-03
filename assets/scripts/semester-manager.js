'use strict';

/**
 * Semester Manager - Handles all semester-related operations
 * Manages semester status, transitions, and auto-start functionality
 */

window.SemesterManager = {

    /**
     * Initialize semester manager - should be called on page load
     */
    init: function() {
        // Load semester data from storage
        this.loadSemesters();
        // Check for auto-transitions
        this.checkAutoTransitions();
    },

    /**
     * Load semesters from localStorage
     */
    loadSemesters: function() {
        const stored = localStorage.getItem('ccs.semesters');
        if (stored) {
            window.semesterList = JSON.parse(stored);
        }
    },

    /**
     * Save semesters to localStorage
     */
    saveSemesters: function() {
        localStorage.setItem('ccs.semesters', JSON.stringify(window.semesterList || []));
    },

    /**
     * Get current active semester
     */
    getCurrentSemester: function() {
        if (!window.semesterList) return null;
        const active = window.semesterList.find(s => s.status === 'active');
        return active || null;
    },

    /**
     * Get all semesters
     */
    getAllSemesters: function() {
        return window.semesterList || [];
    },

    /**
     * Get semester by ID
     */
    getSemesterById: function(id) {
        if (!window.semesterList) return null;
        return window.semesterList.find(s => s.id === id);
    },

    /**
     * Get semesters by school year
     */
    getSemestersByYear: function(schoolYear) {
        if (!window.semesterList) return [];
        return window.semesterList.filter(s => s.schoolYear === schoolYear);
    },

    /**
     * Set a semester as active (manual transition)
     */
    setActiveSemester: function(semesterId) {
        if (!window.semesterList) return false;

        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;

        // Deactivate current active semester
        const current = this.getCurrentSemester();
        if (current && current.id !== semesterId) {
            // Mark previous as completed if it was active
            current.status = 'completed';
            current.completedDate = new Date().toISOString();
        }

        // Activate new semester
        semester.status = 'active';
        semester.activatedDate = new Date().toISOString();
        semester.activatedBy = window.Auth?.getUser()?.id || 'admin';

        // Save changes
        this.saveSemesters();
        this.logSemesterTransition('MANUAL', current?.id, semesterId);

        return true;
    },

    /**
     * Mark semester as completed
     */
    completeSemester: function(semesterId) {
        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;

        semester.status = 'completed';
        semester.completedDate = new Date().toISOString();
        semester.completedBy = window.Auth?.getUser()?.id || 'admin';

        this.saveSemesters();
        this.logSemesterTransition('COMPLETED', semesterId, null);

        return true;
    },

    /**
     * Create a new semester
     */
    createSemester: function(data) {
        if (!window.semesterList) window.semesterList = [];

        // Check if semester already exists
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
            paymentDeadline: data.paymentDeadline || data.startDate,
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

    /**
     * Update semester details
     */
    updateSemester: function(semesterId, data) {
        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;

        // Update allowed fields
        const updatableFields = ['name', 'startDate', 'endDate', 'paymentDeadline', 'description', 'autoStartDate', 'autoStartEnabled'];
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

    /**
     * Delete a semester (only if inactive)
     */
    deleteSemester: function(semesterId) {
        const semester = this.getSemesterById(semesterId);
        if (!semester) return false;
        if (semester.status === 'active') return false; // Cannot delete active semester

        window.semesterList = window.semesterList.filter(s => s.id !== semesterId);
        this.saveSemesters();
        this.logSemesterTransition('DELETED', semesterId, null);

        return true;
    },

    /**
     * Check for auto-transitions
     * Called on page load to see if any semester should auto-start
     */
    checkAutoTransitions: function() {
        if (!window.semesterList) return;

        const now = new Date();
        let transitioned = false;

        window.semesterList.forEach(semester => {
            // Skip if not enabled or already active/completed
            if (!semester.autoStartEnabled || semester.status !== 'inactive') return;

            // Check if auto-start date has passed
            if (semester.autoStartDate) {
                const autoDate = new Date(semester.autoStartDate);
                if (now >= autoDate) {
                    // Auto-activate this semester
                    this.setActiveSemester(semester.id);
                    transitioned = true;
                }
            }
        });

        return transitioned;
    },

    /**
     * Get semester info as formatted string
     */
    formatSemesterInfo: function(semester) {
        if (!semester) return 'No semester selected';

        const statusEmoji = {
            'active': '✓',
            'inactive': '○',
            'completed': '✓'
        };

        return `S.Y. ${semester.schoolYear} • ${semester.name} ${statusEmoji[semester.status] || ''}`;
    },

    /**
     * Get semester badge HTML
     */
    getSemesterBadgeHTML: function() {
        const current = this.getCurrentSemester();
        if (!current) {
            return '<span class="semester-badge semester-badge--inactive">No semester active</span>';
        }

        const statusClass = current.status === 'active' ? 'semester-badge--active' : 'semester-badge--inactive';
        return `<span class="semester-badge ${statusClass}" title="School Year: ${current.schoolYear}">
            ${current.name} (${current.schoolYear})
        </span>`;
    },

    /**
     * Get semester badge HTML for sidebar
     */
    getSemesterSidebarBadgeHTML: function() {
        const current = this.getCurrentSemester();
        if (!current) {
            return '<span class="semester-badge semester-badge--inactive">No semester</span>';
        }

        const statusClass = current.status === 'active' ? 'semester-badge--active' : 'semester-badge--inactive';
        return `<span class="semester-badge ${statusClass}" title="School Year: ${current.schoolYear}, Status: ${current.status}">
            ${current.name} (${current.schoolYear.split('-')[1]})
        </span>`;
    },

    /**
     * Log semester transition for audit trail
     */
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

        const logEntry = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toISOString(),
            user: window.Auth?.getUser()?.name || 'System',
            role: window.Auth?.getUser()?.role || 'admin',
            action: `Semester ${action}`,
            details: details,
            ipAddress: window.location.hostname,
            type: action === 'CREATED' || action === 'UPDATED' ? 'info' : action === 'DELETED' ? 'warning' : 'success'
        };

        window.auditLogs.push(logEntry);
    },

    /**
     * Get formatted date string
     */
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Check if payment deadline has passed
     */
    isPaymentDeadlinePassed: function(semester) {
        if (!semester || !semester.paymentDeadline) return false;
        return new Date() > new Date(semester.paymentDeadline);
    },

    /**
     * Get days until deadline
     */
    daysUntilDeadline: function(semester) {
        if (!semester || !semester.paymentDeadline) return null;

        const now = new Date();
        const deadline = new Date(semester.paymentDeadline);
        const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        return days > 0 ? days : 0;
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.SemesterManager.init());
} else {
    window.SemesterManager.init();
}
