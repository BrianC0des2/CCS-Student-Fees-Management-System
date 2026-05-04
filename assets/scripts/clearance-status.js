'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── SECTION A — DATA ───────────────────────────────────────────── */
  const signatories = [
    {
      id: 1,
      name: 'CSC \u2013 College Student Council',
      role: 'CSC Officer',
      organization: 'College Student Council',
      type: 'org',
      status: 'complete',
      signedDate: 'Feb 3, 2026',
      requirement: 'CSC Fee (\u20b1200.00) must be paid',
      note: 'CSC Fee receipt required',
      contact: 'csc.ccs@wmsu.edu.ph'
    },
    {
      id: 2,
      name: 'PHICCS',
      role: 'Organization Officer',
      organization: 'Philippine ICT Students Society',
      type: 'org',
      status: 'complete',
      signedDate: 'Feb 4, 2026',
      requirement: 'PHICCS membership in good standing',
      note: 'No outstanding dues',
      contact: 'phiccs.ccs@wmsu.edu.ph'
    },
    {
      id: 3,
      name: 'Venom Publication',
      role: 'Editor-in-Chief',
      organization: 'CCS Official Publication',
      type: 'org',
      status: 'pending',
      requirement: 'No unreturned equipment or publications',
      note: 'Must submit any borrowed materials',
      contact: 'venom.ccs@wmsu.edu.ph'
    },
    {
      id: 4,
      name: 'CSC Gender Club',
      role: 'Club President',
      organization: 'CSC Gender Club',
      type: 'org',
      status: 'pending',
      requirement: 'Gender Club Membership Fee (\u20b150.00) must be paid',
      note: 'Pay at the Org Office',
      contact: 'genderclub.ccs@wmsu.edu.ph'
    },
    {
      id: 5,
      name: 'Mr. Robert Johnson, MIT',
      role: 'Department Head',
      organization: 'Department of Computer Studies',
      type: 'faculty',
      status: 'locked',
      requirement: 'Clearance from steps 1\u20134 must all be complete first',
      note: 'Schedule an appointment via the department office',
      contact: 'jcballaho@wmsu.edu.ph'
    },
    {
      id: 6,
      name: 'Class Adviser',
      role: 'Class Adviser',
      organization: 'BS Computer Science \u2013 4A',
      type: 'faculty',
      status: 'locked',
      requirement: 'Department Head clearance must be signed first',
      note: 'Bring clearance form with step 5 signed',
      contact: 'dept.ccs@wmsu.edu.ph'
    },
    {
      id: 7,
      name: 'Asst. Prof. Marjorie A. Rojas',
      role: 'Student Affairs Coordinator',
      organization: 'Office of Student Affairs, CCS',
      type: 'faculty',
      status: 'locked',
      requirement: 'All previous steps must be complete',
      note: 'Bring complete clearance form',
      contact: 'marojas@wmsu.edu.ph'
    },
    {
      id: 8,
      name: 'Prof. Mark L. Flores, PhD.',
      role: 'College Dean',
      organization: 'College of Computer Studies',
      type: 'dean',
      status: 'locked',
      requirement: 'Final step \u2013 all 7 prior signatories must be complete',
      note: "Dean's office is open Mon\u2013Fri, 8am\u20134pm",
      contact: 'mlflores@wmsu.edu.ph'
    }
  ];

  /* ─── SECTION B — PROGRESS BAR ──────────────────────────────────── */
  const completedCount = signatories.filter(s => s.status === 'complete').length;
  const percent = Math.round((completedCount / signatories.length) * 100);

  document.getElementById('progress-count').textContent = completedCount + ' / ' + signatories.length;
  document.getElementById('progress-percent').textContent = percent + '%';
  document.getElementById('progress-bar-fill').style.width = percent + '%';

  /* ─── SECTION C — RENDER SIGNATORY CARDS ────────────────────────── */
  const list = document.getElementById('signatories-list');

  /** Map<id, { detailsEl, chevronEl }> for O(1) accordion lookups */
  const cardMap = new Map();

  /** Tracks which card is currently open (null = none) */
  let currentOpenId = null;

  const badgeConfig = {
    complete: { icon: '', label: 'Signed',  cls: 'badge-complete' },
    pending:  { icon: '', label: 'Pending', cls: 'badge-pending'  },
    locked:   { icon: '', label: 'Locked',  cls: 'badge-locked'   }
  };

  const bannerConfig = {
    complete: { icon: '', text: 'This clearance has been signed and recorded.',            cls: 'banner-complete' },
    pending:  { icon: '', text: 'Action needed — please contact the signatory to proceed.', cls: 'banner-pending'  },
    locked:   { icon: '', text: 'Complete all previous steps to unlock this signatory.',    cls: 'banner-locked'   }
  };

  signatories.forEach((sig, index) => {

    /* ── Card container ── */
    const card = document.createElement('div');
    card.className = 'signatory-card status-' + sig.status;

    /* ── Header button ── */
    const header = document.createElement('button');
    header.className = 'card-header';
    header.type = 'button';

    /* Step circle */
    const circle = document.createElement('div');
    circle.className = 'step-circle type-' + sig.type;
    circle.textContent = String(index + 1);
    header.appendChild(circle);

    /* Card info block */
    const info = document.createElement('div');
    info.className = 'card-info';

    /* Name + role row */
    const nameRow = document.createElement('div');
    nameRow.className = 'card-name-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'card-name';
    nameSpan.textContent = sig.name;

    const roleSpan = document.createElement('span');
    roleSpan.className = 'card-role';
    roleSpan.textContent = sig.role;

    nameRow.appendChild(nameSpan);
    nameRow.appendChild(roleSpan);

    /* Organization */
    const orgDiv = document.createElement('div');
    orgDiv.className = 'card-org';
    orgDiv.textContent = sig.organization;

    info.appendChild(nameRow);
    info.appendChild(orgDiv);

    /* Signed date (only when complete) */
    if (sig.status === 'complete' && sig.signedDate) {
      const signedDiv = document.createElement('div');
      signedDiv.className = 'card-signed';
      signedDiv.textContent = 'Signed ' + sig.signedDate;
      info.appendChild(signedDiv);
    }

    header.appendChild(info);

    /* Card right: badge + chevron */
    const right = document.createElement('div');
    right.className = 'card-right';

    const badge = document.createElement('span');
    const bc = badgeConfig[sig.status];
    badge.className = 'status-badge ' + bc.cls;
    badge.textContent = bc.icon + ' ' + bc.label;

    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '\u203a'; /* › */

    right.appendChild(badge);
    right.appendChild(chevron);
    header.appendChild(right);

    /* ── Details panel ── */
    const details = document.createElement('div');
    details.className = 'card-details';

    /* Helper: build a detail-row */
    const makeDetailRow = (icon, label, value, extraValueClass) => {
      const row = document.createElement('div');
      row.className = 'detail-row';

      const iconEl = document.createElement('span');
      iconEl.className = 'detail-icon';
      iconEl.textContent = icon;

      const textWrap = document.createElement('div');

      const labelEl = document.createElement('div');
      labelEl.className = 'detail-label';
      labelEl.textContent = label;

      const valueEl = document.createElement('div');
      valueEl.className = 'detail-value' + (extraValueClass ? ' ' + extraValueClass : '');
      valueEl.textContent = value;

      textWrap.appendChild(labelEl);
      textWrap.appendChild(valueEl);
      row.appendChild(iconEl);
      row.appendChild(textWrap);
      return row;
    };

    /* Requirement row */
    details.appendChild(makeDetailRow('', 'Requirement', sig.requirement));

    /* Note row (optional) */
    if (sig.note) {
      details.appendChild(makeDetailRow('', 'Note', sig.note));
    }

    /* Contact row */
    if (sig.contact) {
      details.appendChild(makeDetailRow('', 'Contact', sig.contact, 'contact-email'));
    }

    /* Status banner */
    const banner = document.createElement('div');
    const bnr = bannerConfig[sig.status];
    banner.className = 'status-banner ' + bnr.cls;
    banner.textContent = bnr.icon + ' ' + bnr.text;
    details.appendChild(banner);

    /* ── Assemble card ── */
    card.appendChild(header);
    card.appendChild(details);
    list.appendChild(card);

    /* Store refs for accordion */
    cardMap.set(sig.id, { detailsEl: details, chevronEl: chevron });

    /* ── SECTION D — ACCORDION LOGIC ── */
    header.addEventListener('click', () => {
      const clickedId = sig.id;

      if (currentOpenId === clickedId) {
        /* Close the already-open card */
        details.classList.remove('expanded');
        chevron.classList.remove('open');
        currentOpenId = null;
      } else {
        /* Close the previously open card (if any) */
        if (currentOpenId !== null) {
          const prev = cardMap.get(currentOpenId);
          if (prev) {
            prev.detailsEl.classList.remove('expanded');
            prev.chevronEl.classList.remove('open');
          }
        }

        /* Open the clicked card */
        details.classList.add('expanded');
        chevron.classList.add('open');
        currentOpenId = clickedId;
      }
    });
  });

});
