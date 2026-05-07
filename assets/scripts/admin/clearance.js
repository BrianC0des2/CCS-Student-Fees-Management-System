'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    function renderClearance() {
        if (!pageContent) return;

        const activeCount = signatoryList.filter(s => s.status === 'active').length;
        const typeBadge   = { organization: 'badge-blue', faculty: 'badge-green', dean: 'badge-purple' };

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Clearance Setup</div>
                    <div class="section-sub">Configure clearance signatories and their approval workflow order</div>
                </div>
            </div>
            <div class="info-banner info-banner--blue">
                <span class="info-banner-icon">${bxi('info-circle')}</span>
                <p>The clearance workflow has <strong>${activeCount} active signatories</strong>. Disabling a signatory removes them from the student clearance checklist.</p>
            </div>
            <div id="signatory-list">
                ${signatoryList.map(s => `
                <div class="signatory-card ${s.status === 'inactive' ? 'signatory-card--disabled' : ''}">
                    <div class="signatory-num ${s.status === 'active' ? 'signatory-num--active' : 'signatory-num--inactive'}">${s.order}</div>
                    <div class="signatory-info">
                        <div class="signatory-name-row">
                            <span class="signatory-name">${s.name}</span>
                            <span class="badge ${typeBadge[s.type]}">${s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                        </div>
                        <div class="signatory-role">${s.role}</div>
                    </div>
                    <div class="signatory-actions">
                        ${(s.type === 'faculty' || s.type === 'dean') ? `
                        <select class="filter-select signatory-assign" data-id="${s.id}">
                            <option value="">Assign to…</option>
                            ${facultyList.filter(f => f.status === 'active').map(f =>
                                `<option value="${f.id}"${s.assignedTo === f.id ? ' selected' : ''}>${f.name}</option>`
                            ).join('')}
                        </select>` : ''}
                        <button class="btn ${s.status === 'active' ? 'btn-green' : 'btn-outline'} signatory-toggle-btn" data-id="${s.id}">
                            ${s.status === 'active' ? bxi('check') + ' Active' : bxi('x') + ' Disabled'}
                        </button>
                    </div>
                </div>`).join('')}
            </div>
            <div class="clearance-save-row">
                <button class="btn btn-green" id="save-clearance-btn">
                     Save Workflow
                </button>
            </div>
        `;

        document.getElementById('save-clearance-btn')?.addEventListener('click', () =>
            showToast('Clearance workflow configuration saved.')
        );
        pageContent.querySelectorAll('.signatory-toggle-btn').forEach(b => b.addEventListener('click', () => {
            signatoryList = signatoryList.map(s =>
                s.id === b.dataset.id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
            );
            showToast('Signatory status updated.'); renderClearance();
        }));
        pageContent.querySelectorAll('.signatory-assign').forEach(sel => sel.addEventListener('change', () => {
            signatoryList = signatoryList.map(s =>
                s.id === sel.dataset.id ? { ...s, assignedTo: sel.value } : s
            );
        }));
    }

    renderClearance();
});
