'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const welcomeName = document.getElementById('facultyWelcomeName');
  const welcomeSub = document.getElementById('facultyWelcomeSub');
  const cards = document.getElementById('facultySummaryCards');
  const tableHead = document.getElementById('facultyTableHead');
  const tableBody = document.getElementById('facultyTableBody');
  const title = document.getElementById('facultyTableTitle');
  const searchInput = document.getElementById('facultySearchInput');
  const searchBtn = document.getElementById('facultySearchBtn');
  const filtersBtn = document.getElementById('facultyFiltersBtn');
  const filtersPopover = document.getElementById('facultyFiltersPopover');
  const yearFilter = document.getElementById('facultyFilterYear');
  const courseFilter = document.getElementById('facultyFilterCourse');
  const sectionFilter = document.getElementById('facultyFilterSection');
  const clearanceFilter = document.getElementById('facultyFilterClearance');
  const applyFiltersBtn = document.getElementById('facultyApplyFilters');
  const resetFiltersBtn = document.getElementById('facultyResetFilters');
  const activeFilters = document.getElementById('facultyActiveFilters');

  if (!tableBody) return;

  const records = [
    {
      studentNo: '2022-00123',
      name: 'Maria Dela Santos',
      courseSection: 'BSCS 4-A',
      currentStep: 'Department Head',
      status: 'pending'
    },
    {
      studentNo: '2022-00124',
      name: 'Juan Dela Cruz',
      courseSection: 'BSIT 4-B',
      currentStep: 'Class Adviser',
      status: 'signed'
    },
    {
      studentNo: '2023-00201',
      name: 'Ana Reyes',
      courseSection: 'BSCS 3-A',
      currentStep: 'Student Affairs',
      status: 'blocked'
    },
    {
      studentNo: '2023-00211',
      name: 'Carlos Mendoza',
      courseSection: 'BSIT 3-B',
      currentStep: 'Department Head',
      status: 'pending'
    },
    {
      studentNo: '2023-00217',
      name: 'Lea Aguilar',
      courseSection: 'ACT-AD 2-A',
      currentStep: 'Dean',
      status: 'cleared'
    }
  ];

  const filterState = {
    query: '',
    year: '',
    course: '',
    section: '',
    clearance: ''
  };

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function statusLabel(status) {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'blocked':
        return 'Blocked';
      case 'cleared':
        return 'Cleared';
      default:
        return 'Pending';
    }
  }

  function statusClass(status) {
    switch (status) {
      case 'signed':
        return 'badge-signed';
      case 'blocked':
        return 'badge-blocked';
      case 'cleared':
        return 'badge-cleared';
      default:
        return 'badge-pending-clearance';
    }
  }

  function parseYear(courseSection) {
    const match = courseSection.match(/\b([1-4])-/);
    return match ? match[1] : '';
  }

  function parseCourse(courseSection) {
    const match = courseSection.match(/^(BSCS|BSIT|ACT-AD|ACT-NET)/i);
    return match ? match[1].toUpperCase() : '';
  }

  function parseSection(courseSection) {
    const match = courseSection.match(/\b([1-4]-[A-Z])\b/i);
    return match ? match[1].toUpperCase() : '';
  }

  function renderRows(items) {
    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No students match your current filters.</td></tr>';
      return;
    }

    tableBody.innerHTML = items
      .map((record) => {
        const label = statusLabel(record.status);
        const badgeClass = statusClass(record.status);

        return [
          '<tr>',
          `<td>${record.studentNo}</td>`,
          `<td>${record.name}</td>`,
          `<td>${record.courseSection}</td>`,
          `<td>${record.currentStep}</td>`,
          `<td><span class="status-badge ${badgeClass}">${label}</span></td>`,
          '</tr>'
        ].join('');
      })
      .join('');
  }

  function renderActiveFilterTags() {
    if (!activeFilters) return;

    const tags = [];
    if (filterState.query) tags.push({ key: 'query', label: `Search: ${filterState.query}` });
    if (filterState.year) tags.push({ key: 'year', label: `Year: ${filterState.year}` });
    if (filterState.course) tags.push({ key: 'course', label: `Course: ${filterState.course}` });
    if (filterState.section) tags.push({ key: 'section', label: `Section: ${filterState.section}` });
    if (filterState.clearance) {
      const label = filterState.clearance.charAt(0).toUpperCase() + filterState.clearance.slice(1);
      tags.push({ key: 'clearance', label: `Status: ${label}` });
    }

    if (!tags.length) {
      activeFilters.innerHTML = '';
      return;
    }

    activeFilters.innerHTML = tags
      .map((tag) => `<span class="filter-tag">${tag.label}<span class="remove" data-filter-key="${tag.key}">&times;</span></span>`)
      .join('');

    activeFilters.querySelectorAll('[data-filter-key]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.filterKey;
        if (!key || !(key in filterState)) return;
        filterState[key] = '';
        syncControlsFromState();
        applyFilters();
      });
    });
  }

  function syncStateFromControls() {
    filterState.query = normalize(searchInput && searchInput.value);
    filterState.year = normalize(yearFilter && yearFilter.value);
    filterState.course = normalize(courseFilter && courseFilter.value);
    filterState.section = normalize(sectionFilter && sectionFilter.value);
    filterState.clearance = normalize(clearanceFilter && clearanceFilter.value);
  }

  function syncControlsFromState() {
    if (searchInput) searchInput.value = filterState.query;
    if (yearFilter) yearFilter.value = filterState.year;
    if (courseFilter) courseFilter.value = filterState.course.toUpperCase();
    if (sectionFilter) sectionFilter.value = filterState.section;
    if (clearanceFilter) clearanceFilter.value = filterState.clearance;
  }

  function applyFilters() {
    const filtered = records.filter((record) => {
      const searchable = normalize(`${record.studentNo} ${record.name} ${record.courseSection}`);
      const recordYear = normalize(parseYear(record.courseSection));
      const recordCourse = normalize(parseCourse(record.courseSection));
      const recordSection = normalize(parseSection(record.courseSection));
      const recordStatus = normalize(record.status);

      const matchesQuery = !filterState.query || searchable.includes(filterState.query);
      const matchesYear = !filterState.year || recordYear === filterState.year;
      const matchesCourse = !filterState.course || recordCourse === filterState.course;
      const matchesSection = !filterState.section || recordSection === filterState.section;
      const matchesClearance = !filterState.clearance || recordStatus === filterState.clearance;

      return matchesQuery && matchesYear && matchesCourse && matchesSection && matchesClearance;
    });

    renderRows(filtered);
    renderActiveFilterTags();
  }

  function resetFilters() {
    filterState.query = '';
    filterState.year = '';
    filterState.course = '';
    filterState.section = '';
    filterState.clearance = '';
    syncControlsFromState();
    applyFilters();
  }

  function setupSectionOptions() {
    if (!sectionFilter) return;

    const sections = Array.from(
      new Set(
        records
          .map((record) => parseSection(record.courseSection))
          .filter(Boolean)
          .map((section) => section.toUpperCase())
      )
    ).sort();

    sectionFilter.innerHTML = ['<option value="">All</option>']
      .concat(sections.map((section) => `<option value="${section.toLowerCase()}">${section}</option>`))
      .join('');
  }

  if (welcomeName) welcomeName.textContent = 'Welcome, Prof. Ricardo Dela Cruz';
  if (welcomeSub) welcomeSub.textContent = 'Review and filter your student clearance queue.';

  if (cards) {
    cards.innerHTML = [
      '<div class="card"><i class="bx bx-time-five"></i><h3>Pending Signatures</h3><p>12</p></div>',
      '<div class="card"><i class="bx bx-check-circle"></i><h3>Signed Today</h3><p>8</p></div>',
      '<div class="card"><i class="bx bx-user"></i><h3>Students Assigned</h3><p>36</p></div>',
      '<div class="card"><i class="bx bx-flag"></i><h3>Flagged Cases</h3><p>3</p></div>'
    ].join('');
  }

  if (title) title.textContent = 'Faculty Clearance Queue';

  if (tableHead) {
    tableHead.innerHTML = [
      '<tr>',
      '<th>Student No.</th>',
      '<th>Name</th>',
      '<th>Course / Section</th>',
      '<th>Current Step</th>',
      '<th>Status</th>',
      '</tr>'
    ].join('');
  }

  if (title) title.textContent = 'Faculty Clearance Queue';

  setupSectionOptions();
  resetFilters();

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      syncStateFromControls();
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      syncStateFromControls();
      applyFilters();
    });
  }

  if (filtersBtn && filtersPopover) {
    filtersBtn.addEventListener('click', () => {
      filtersPopover.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (filtersBtn.contains(target) || filtersPopover.contains(target)) return;
      filtersPopover.classList.remove('show');
    });
  }

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      syncStateFromControls();
      applyFilters();
      if (filtersPopover) filtersPopover.classList.remove('show');
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      resetFilters();
      if (filtersPopover) filtersPopover.classList.remove('show');
    });
  }
});
