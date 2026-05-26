const programSelect = document.getElementById('programSelect');
const semesterSelect = document.getElementById('semesterSelect');
const subjectTable = document.getElementById('subjectTable').querySelector('tbody');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const selectedSemesterLabel = document.getElementById('selectedSemester');
const semesterSGPAValue = document.getElementById('semesterSGPA');
const totalCreditsValue = document.getElementById('totalCredits');
const totalSubjectsValue = document.getElementById('totalSubjects');
const cgpaValue = document.getElementById('cgpaValue');
const overallPercentageValue = document.getElementById('overallPercentage');
const passedCountValue = document.getElementById('passedCount');
const failedCountValue = document.getElementById('failedCount');
const performanceList = document.getElementById('performanceList');
const sgpaChartCanvas = document.getElementById('sgpaChart');
const gradeChartCanvas = document.getElementById('gradeChart');

const programConfig = {
  ugArts: { label: 'UG Arts & Science', semesters: 6, maxSubjects: 8 },
  ugEng: { label: 'UG Engineering', semesters: 8, maxSubjects: 10 },
  pg: { label: 'PG', semesters: 4, maxSubjects: 8 }
};

let activeProgram = 'ugArts';
let semesterData = {};
let sgpaChart;
let gradeChart;

function start() {
  programSelect.addEventListener('change', onProgramChange);
  semesterSelect.addEventListener('change', renderSemester);
  addSubjectBtn.addEventListener('click', addSubjectRow);
  calculateBtn.addEventListener('click', calculateAll);
  resetBtn.addEventListener('click', resetSemester);
  initSemesterData();
  createSemesterOptions();
  renderSemester();
  initCharts();
}

function initSemesterData() {
  const { semesters } = programConfig[activeProgram];
  semesterData = {};
  for (let i = 1; i <= semesters; i += 1) {
    semesterData[i] = {
      subjects: Array.from({ length: 6 }, (_, index) => ({
        name: `Subject ${index + 1}`,
        marks: 0,
        credits: 4
      }))
    };
  }
}

function createSemesterOptions() {
  semesterSelect.innerHTML = '';
  const { semesters } = programConfig[activeProgram];
  for (let i = 1; i <= semesters; i += 1) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Semester ${i}`;
    semesterSelect.appendChild(option);
  }
}

function onProgramChange() {
  activeProgram = programSelect.value;
  initSemesterData();
  createSemesterOptions();
  renderSemester();
  calculateAll();
}

function renderSemester() {
  const semesterIndex = parseInt(semesterSelect.value, 10) || 1;
  selectedSemesterLabel.textContent = semesterIndex;
  subjectTable.innerHTML = '';
  const semester = semesterData[semesterIndex];

  semester.subjects.forEach((subject, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${subject.name}" data-field="name" data-subject-index="${index}" /></td>
      <td><input type="number" min="0" max="100" value="${subject.marks}" data-field="marks" data-subject-index="${index}" /></td>
      <td><input type="number" min="1" max="10" value="${subject.credits}" data-field="credits" data-subject-index="${index}" /></td>
      <td class="grade-value">${getGrade(subject.marks)}</td>
      <td class="gradepoint-value">${getGradePoint(subject.marks)}</td>
      <td><button class="danger delete-btn" data-subject-index="${index}">Delete</button></td>
    `;

    row.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', onSubjectInputChange);
    });

    row.querySelector('.delete-btn').addEventListener('click', () => removeSubject(index));
    subjectTable.appendChild(row);
  });
}

function onSubjectInputChange(event) {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.subjectIndex);
  const semesterIndex = parseInt(semesterSelect.value, 10) || 1;
  const semester = semesterData[semesterIndex];
  const value = event.target.value;

  if (field === 'marks') {
    semester.subjects[index].marks = Math.min(100, Math.max(0, Number(value)));
  } else if (field === 'credits') {
    semester.subjects[index].credits = Math.max(1, Number(value));
  } else {
    semester.subjects[index].name = value;
  }

  updateGradeInRow(index);
}

function updateGradeInRow(index) {
  const semesterIndex = parseInt(semesterSelect.value, 10) || 1;
  const semester = semesterData[semesterIndex];
  const row = subjectTable.querySelector(`button[data-subject-index="${index}"]`)?.closest('tr');
  if (!row) return;
  row.querySelector('.grade-value').textContent = getGrade(semester.subjects[index].marks);
  row.querySelector('.gradepoint-value').textContent = getGradePoint(semester.subjects[index].marks);
}

function getGrade(marks) {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 40) return 'D';
  return 'F';
}

function addSubjectRow() {
  const semesterIndex = parseInt(semesterSelect.value, 10) || 1;
  const semester = semesterData[semesterIndex];
  semester.subjects.push({ name: `Subject ${semester.subjects.length + 1}`, marks: 0, credits: 4 });
  renderSemester();
}

function removeSubject(index) {
  const semesterIndex = parseInt(semesterSelect.value, 10) || 1;
  const semester = semesterData[semesterIndex];
  if (semester.subjects.length <= 1) return;
  semester.subjects.splice(index, 1);
  renderSemester();
}

function resetSemester() {
  const semesterIndex = parseInt(semesterSelect.value, 10) || 1;
  const semester = semesterData[semesterIndex];
  semester.subjects = semester.subjects.map((subject, index) => ({
    name: subject.name || `Subject ${index + 1}`,
    marks: 0,
    credits: 4
  }));
  renderSemester();
  calculateAll();
}

function calculateSemester(semesterIndex) {
  const semester = semesterData[semesterIndex];
  let totalPoints = 0;
  let totalCredits = 0;
  let passed = 0;
  let failed = 0;
  let totalMarks = 0;

  semester.subjects.forEach((subject) => {
    const gradePoint = convertMarksToPoints(subject.marks);
    totalPoints += gradePoint * subject.credits;
    totalCredits += subject.credits;
    totalMarks += subject.marks;
    if (subject.marks >= 40) passed += 1;
    else failed += 1;
  });

  const sgpa = totalCredits ? totalPoints / totalCredits : 0;
  return {
    sgpa: parseFloat(sgpa.toFixed(2)),
    credits: totalCredits,
    passed,
    failed,
    average: semester.subjects.length ? totalMarks / semester.subjects.length : 0
  };
}

function getGradePoint(marks) {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 40) return 5;
  return 0;
}

function convertMarksToPoints(marks) {
  return getGradePoint(marks);
}

function calculateAll() {
  const selectedSemester = parseInt(semesterSelect.value, 10) || 1;
  const activeSemester = calculateSemester(selectedSemester);

  selectedSemesterLabel.textContent = selectedSemester;
  semesterSGPAValue.textContent = activeSemester.sgpa.toFixed(2);

  const semesterEntries = Object.keys(semesterData).map((key) => {
    return { index: Number(key), ...calculateSemester(Number(key)) };
  });

  const cgpa = computeCgpa(semesterEntries);
  cgpaValue.textContent = cgpa.toFixed(2);
  overallPercentageValue.textContent = `${computeOverallPercentage(semesterEntries).toFixed(1)}%`;
  totalCreditsValue.textContent = semesterEntries.reduce((sum, sem) => sum + sem.credits, 0);
  totalSubjectsValue.textContent = Object.values(semesterData).reduce((sum, semester) => sum + semester.subjects.length, 0);
  passedCountValue.textContent = semesterEntries.reduce((sum, sem) => sum + sem.passed, 0);
  failedCountValue.textContent = semesterEntries.reduce((sum, sem) => sum + sem.failed, 0);

  renderPerformanceList();
  updateCharts(semesterEntries);
}

function computeCgpa(semesterEntries) {
  let weightedPoints = 0;
  let totalCredits = 0;

  semesterEntries.forEach((semester) => {
    const semesterObj = semesterData[semester.index];
    const credits = semester.credits;
    weightedPoints += semester.sgpa * credits;
    totalCredits += credits;
  });

  return totalCredits ? weightedPoints / totalCredits : 0;
}

function computeOverallPercentage(semesterEntries) {
  let totalMarks = 0;
  let count = 0;

  semesterEntries.forEach((semester) => {
    const semesterObj = semesterData[semester.index];
    semesterObj.subjects.forEach((subject) => {
      totalMarks += subject.marks;
      count += 1;
    });
  });

  return count ? totalMarks / count : 0;
}

function renderPerformanceList() {
  performanceList.innerHTML = '';
  const allSubjects = [];

  Object.entries(semesterData).forEach(([semesterIndex, semester]) => {
    semester.subjects.forEach((subject) => {
      allSubjects.push({
        semester: Number(semesterIndex),
        name: subject.name || 'Unnamed subject',
        marks: subject.marks,
        grade: getGrade(subject.marks),
        status: subject.marks >= 40 ? 'Pass' : 'Fail'
      });
    });
  });

  allSubjects.sort((a, b) => b.marks - a.marks);
  allSubjects.slice(0, 12).forEach((subject) => {
    const card = document.createElement('div');
    card.className = 'performance-card';
    card.innerHTML = `
      <strong>${subject.name} (Sem ${subject.semester})</strong>
      <div>Marks: ${subject.marks}%</div>
      <div>Grade: ${subject.grade}</div>
      <div>Status: <span class="badge ${subject.status === 'Pass' ? 'badge-success' : 'badge-danger'}">${subject.status}</span></div>
    `;
    performanceList.appendChild(card);
  });
}

function initCharts() {
  sgpaChart = new Chart(sgpaChartCanvas, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Semester SGPA',
        data: [],
        backgroundColor: '#2f6bef',
        borderRadius: 12,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: { beginAtZero: true, max: 10 }
      }
    }
  });

  gradeChart = new Chart(gradeChartCanvas, {
    type: 'doughnut',
    data: {
      labels: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: ['#0b6e4f', '#1f8aee', '#4c8dff', '#95a7ff', '#c4c9ff', '#f7d86b', '#ff6b6b']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function updateCharts(semesterEntries) {
  sgpaChart.data.labels = semesterEntries.map((entry) => `Sem ${entry.index}`);
  sgpaChart.data.datasets[0].data = semesterEntries.map((entry) => entry.sgpa);
  sgpaChart.update();

  const gradeCounts = { 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0 };
  Object.values(semesterData).forEach((semester) => {
    semester.subjects.forEach((subject) => {
      gradeCounts[getGrade(subject.marks)] += 1;
    });
  });

  gradeChart.data.datasets[0].data = Object.values(gradeCounts);
  gradeChart.update();
}

start();
