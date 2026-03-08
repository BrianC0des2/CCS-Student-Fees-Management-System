'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const filtersBtn = document.getElementById('filtersBtn');
  const filtersPopover = document.getElementById('filtersPopover');
  const activeFilters = document.getElementById('activeFilters');
  const yearSelect = document.getElementById('yearLevel');
  const courseSelect = document.getElementById('course');
  const sectionSelect = document.getElementById('section');
  const schoolYearSelect = document.getElementById('schoolYear');
  const semesterSelect = document.getElementById('semester');
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  const table = document.querySelector('.members-table table');
  const tableBody = table ? table.querySelector('tbody') : null;

  if (!tableBody || !searchInput) return;

  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const isHistoryPage = Boolean(schoolYearSelect && semesterSelect);
  const colSpan = table ? table.querySelectorAll('thead th').length : 1;

  const noResultsRow = document.createElement('tr');
  noResultsRow.className = 'no-results-row';
  noResultsRow.innerHTML = `<td colspan="${colSpan}">No records matched your current filters.</td>`;
  noResultsRow.style.display = 'none';
  tableBody.appendChild(noResultsRow);

  const filterState = {
    query: '',
    yearLevel: '',
    course: '',
    section: '',
    schoolYear: '',
    semester: ''
  };

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getCellText(row, index) {
    const cells = row.querySelectorAll('td');
    return cells[index] ? cells[index].textContent.trim() : '';
  }

  function getYearFromText(value) {
    const match = String(value).match(/([1-4])(?:st|nd|rd|th)?/i);
    return match ? match[1] : '';
  }

  function getSectionFromText(value) {
    const match = String(value).match(/(CS\s*\d-[A-Z]|[1-4]-[A-Z])/i);
    return match ? match[1].replace(/\s+/g, ' ').toUpperCase() : '';
  }

  function getSemesterValue(value) {
    const normalized = normalize(value);
    if (normalized.includes('1st')) return '1st';
    if (normalized.includes('2nd')) return '2nd';
    return '';
  }

  function getCourseFromRow(row, yearSectionText) {
    if (isHistoryPage) {
      return normalize(getCellText(row, 2)).toUpperCase();
    }

    if (normalize(yearSectionText).includes('cs')) return 'BSCS';
    return 'BSCS';
  }

  function buildRowMeta(row) {
    const studentNo = getCellText(row, 0);
    const name = getCellText(row, 1);
    const yearSection = isHistoryPage ? getCellText(row, 3) : getCellText(row, 2);
    const schoolYear = isHistoryPage ? getCellText(row, 4) : '';
    const semester = isHistoryPage ? getCellText(row, 5) : '';

    return {
      row,
      searchable: normalize(`${studentNo} ${name}`),
      yearLevel: normalize(getYearFromText(yearSection)),
      course: normalize(getCourseFromRow(row, yearSection)),
      section: normalize(getSectionFromText(yearSection)),
      schoolYear: normalize(schoolYear),
      semester: getSemesterValue(semester)
    };
  }

  const rowMeta = rows.map(buildRowMeta);

  function getFilterCount() {
    return Object.values(filterState).filter(Boolean).length;
  }

  function updateFilterCountBadge() {
    if (!filtersBtn) return;

    const existingBadge = filtersBtn.querySelector('.filter-count');
    if (existingBadge) existingBadge.remove();

    const count = getFilterCount();
    if (!count) return;

    const badge = document.createElement('span');
    badge.className = 'filter-count';
    badge.textContent = String(count);
    filtersBtn.appendChild(badge);
  }

  function optionText(selectEl, value) {
    if (!selectEl || !value) return '';
    const option = Array.from(selectEl.options).find((item) => normalize(item.value) === normalize(value));
    return option ? option.textContent.trim() : value;
  }

  function renderActiveFilters() {
    if (!activeFilters) return;

    const tags = [];
    if (filterState.query) tags.push({ key: 'query', label: `Search: ${filterState.query}` });
    if (filterState.yearLevel) tags.push({ key: 'yearLevel', label: `Year: ${optionText(yearSelect, filterState.yearLevel)}` });
    if (filterState.course) tags.push({ key: 'course', label: `Course: ${optionText(courseSelect, filterState.course.toUpperCase())}` });
    if (filterState.section) tags.push({ key: 'section', label: `Section: ${optionText(sectionSelect, filterState.section.toUpperCase())}` });
    if (filterState.schoolYear && schoolYearSelect) {
      tags.push({ key: 'schoolYear', label: `School Year: ${optionText(schoolYearSelect, filterState.schoolYear)}` });
    }
    if (filterState.semester && semesterSelect) {
      tags.push({ key: 'semester', label: `Semester: ${optionText(semesterSelect, filterState.semester)}` });
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
    filterState.query = normalize(searchInput.value);
    filterState.yearLevel = normalize(yearSelect && yearSelect.value);
    filterState.course = normalize(courseSelect && courseSelect.value);
    filterState.section = normalize(sectionSelect && sectionSelect.value);
    filterState.schoolYear = normalize(schoolYearSelect && schoolYearSelect.value);
    filterState.semester = normalize(semesterSelect && semesterSelect.value);
  }

  function syncControlsFromState() {
    searchInput.value = filterState.query;
    if (yearSelect) yearSelect.value = filterState.yearLevel;
    if (courseSelect) courseSelect.value = filterState.course.toUpperCase();
    if (sectionSelect) sectionSelect.value = filterState.section.toUpperCase();
    if (schoolYearSelect) schoolYearSelect.value = filterState.schoolYear;
    if (semesterSelect) semesterSelect.value = filterState.semester;
  }

  function applyFilters() {
    let visibleCount = 0;

    rowMeta.forEach((meta) => {
      const matchesQuery = !filterState.query || meta.searchable.includes(filterState.query);
      const matchesYear = !filterState.yearLevel || meta.yearLevel === filterState.yearLevel;
      const matchesCourse = !filterState.course || meta.course === filterState.course;
      const matchesSection = !filterState.section || meta.section === filterState.section;
      const matchesSchoolYear = !filterState.schoolYear || meta.schoolYear === filterState.schoolYear;
      const matchesSemester = !filterState.semester || meta.semester === filterState.semester;

      const matches = matchesQuery && matchesYear && matchesCourse && matchesSection && matchesSchoolYear && matchesSemester;
      meta.row.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });

    noResultsRow.style.display = visibleCount ? 'none' : '';
    renderActiveFilters();
    updateFilterCountBadge();
  }

  function resetFilters() {
    filterState.query = '';
    filterState.yearLevel = '';
    filterState.course = '';
    filterState.section = '';
    filterState.schoolYear = '';
    filterState.semester = '';
    syncControlsFromState();
    applyFilters();
  }

  if (filtersBtn && filtersPopover) {
    filtersBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      filtersPopover.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (filtersPopover.contains(target) || filtersBtn.contains(target)) return;
      filtersPopover.classList.remove('show');
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      syncStateFromControls();
      applyFilters();
    });
  }

  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    syncStateFromControls();
    applyFilters();
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      syncStateFromControls();
      applyFilters();
      if (filtersPopover) filtersPopover.classList.remove('show');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFilters();
      if (filtersPopover) filtersPopover.classList.remove('show');
    });
  }

  applyFilters();
});
