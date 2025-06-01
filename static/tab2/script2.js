// static/tab2/script2.js
let data = {};
let salaryComparisonChart; // <--- RENAMED from 'chart'
let currentFlippedLevel = null; // Currently flipped level

// Load data and initialize
fetch(typeof DATA_JSON_URL !== "undefined" ? DATA_JSON_URL : "tab2/data.json")
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} for ${res.url}`);
    }
    return res.json();
  })
  .then(json => {
    data = json;
    initializeSalaryChart(); // <--- Renamed function for clarity
    attachStepListeners();
  })
  .catch(err => console.error("Cannot load data.json for Tab 2:", err));

function initializeSalaryChart() { // <--- Renamed function
  // Use a fixed order for job levels
  const levelNames = [
    "Entry Level",
    "Junior Level",
    "Experienced Level",
    "Senior Level"
  ];
  const beforeData = levelNames.map(lvl => data[lvl]?.average_salary_before ?? 0);
  const afterData = levelNames.map(lvl => data[lvl]?.average_salary_after ?? 0);

  // Color & opacity settings
  const lightB = 'rgba(170,59,25,0.7)';
  const lightA = 'rgba(29,79,67,0.7)';
  const dimB = 'rgba(170,59,25,0.3)'; // Not used in initial, but kept for consistency
  const dimA = 'rgba(29,79,67,0.3)'; // Not used in initial, but kept for consistency
  const darkB = '#aa3b19';
  const darkA = '#1d4f43';

  // Get the specific chart container and canvas for Tab 2
  // Assuming index2.html has <div class="col chart-col"><div id="salary-chart-container-tab2"><canvas id="salaryChartCanvasTab2"></canvas></div></div>
  // If not, you need to make sure the IDs are unique or use querySelector specific to Tab 2's structure.
  // For now, I'll assume your existing IDs are unique enough within index2.html's scope.
  // The original code used document.getElementById("chart-container") which could conflict if index3.html also uses that ID.
  // It's safer to use IDs specific to this tab, or query within a Tab 2 specific parent.
  // Let's stick to your original IDs for now, but be aware of potential conflicts if other tabs use the same.
  const chartDisplayContainer = document.getElementById("chart-container"); // This ID might be generic
  const canvas = document.getElementById("salaryChart"); // This ID is for the salary chart

  if (!canvas) { // Only need to check canvas as chart is drawn on it.
    console.error("Tab 2: Canvas element with ID 'salaryChart' not found! Chart will NOT render.");
    return;
  }
  // It's good practice to check the container too, but canvas is primary.
  if (!chartDisplayContainer) {
      console.warn("Tab 2: Element with ID 'chart-container' not found. Chart might render but layout could be affected.");
  }


  try {
    const ctx = canvas.getContext("2d");

    // Destroy existing chart instance if it exists
    if (salaryComparisonChart) {
      salaryComparisonChart.destroy();
    }

    salaryComparisonChart = new Chart(ctx, { // <--- USE RENAMED VARIABLE
      type: 'bar',
      data: {
        labels: levelNames,
        datasets: [
          {
            label: 'Salary Before MBA',
            data: beforeData,
            backgroundColor: beforeData.map(() => lightB),
            borderColor: beforeData.map(() => lightB), // Or use darkB for border
            borderWidth: 1
          },
          {
            label: 'Expected Salary After MBA',
            data: afterData,
            backgroundColor: afterData.map(() => lightA),
            borderColor: afterData.map(() => lightA), // Or use darkA for border
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Salary Comparison Before and After MBA',
            font: { family: 'Merriweather', size: 18, weight: 'bold' },
            color: '#000'
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { family: 'Merriweather', size: 11 },
              boxWidth: 12,
              usePointStyle: true,
              // generateLabels function seems fine, refers to chartInstance locally
            }
          }
        },
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              font: { family: 'serif', size: 12 },
              color: '#666666'
            }
          },
          y: {
            beginAtZero: true,
            max: 140000,
            ticks: {
              font: { family: 'serif', size: 12 },
              color: '#666666'
            },
            title: {
              display: true,
              text: 'Salary (USD)',
              font: { family: 'serif', size: 12 },
              color: '#666666'
            }
          }
        }
      }
    });

    if(chartDisplayContainer) chartDisplayContainer.classList.add("show"); // Check if container exists
    console.log("Tab 2: Salary chart rendered successfully!");
  } catch (e) {
    console.error("Tab 2: Salary chart failed to render!", e);
  }
}

function attachStepListeners() {
  const stepEls = document.querySelectorAll('.step'); // These are specific to Tab 2's HTML structure
  // Color constants are fine as they are local to this function or can be accessed from global if defined there
  const lightB = 'rgba(170,59,25,0.7)';
  const lightA = 'rgba(29,79,67,0.7)';
  const dimB = 'rgba(170,59,25,0.3)';
  const dimA = 'rgba(29,79,67,0.3)';
  const darkB = '#aa3b19';
  const darkA = '#1d4f43';

  stepEls.forEach(el => {
    el.addEventListener('click', () => {
      if (!salaryComparisonChart || !salaryComparisonChart.data) { // <--- Check if chart exists
          console.error("Tab 2: salaryComparisonChart not initialized before click.");
          return;
      }
      const level = el.getAttribute('data-step');
      const card = document.querySelector('.card2'); // Assumes .card2 is unique to Tab 2 or within its scope
      const back = document.querySelector('.card-back'); // Same assumption

      if (!card || !back) {
          console.error("Tab 2: Card elements not found for interaction.");
          return;
      }

      // Reset if clicking the same level
      if (currentFlippedLevel === level) {
        currentFlippedLevel = null;
        el.classList.remove('active');
        salaryComparisonChart.data.datasets[0].backgroundColor = salaryComparisonChart.data.datasets[0].data.map(() => lightB);
        salaryComparisonChart.data.datasets[1].backgroundColor = salaryComparisonChart.data.datasets[1].data.map(() => lightA);
        salaryComparisonChart.update();
        card.classList.remove('flipped');
        back.innerHTML = '';
        return;
      }

      // New selection
      stepEls.forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      currentFlippedLevel = level;
      const idx = salaryComparisonChart.data.labels.indexOf(level);

      if (idx === -1) { // Level not found in chart labels
          console.warn(`Tab 2: Level "${level}" not found in chart labels.`);
          return;
      }

      salaryComparisonChart.data.datasets[0].backgroundColor = salaryComparisonChart.data.datasets[0].data.map((_, i) => i === idx ? darkB : dimB);
      salaryComparisonChart.data.datasets[1].backgroundColor = salaryComparisonChart.data.datasets[1].data.map((_, i) => i === idx ? darkA : dimA);
      salaryComparisonChart.update();

      const info = data[level];
      if (!info) {
          console.warn(`Tab 2: Data for level "${level}" not found.`);
          back.innerHTML = `<div class="back-title"><strong>${level} Details</strong></div><div class="back-content">Data not available.</div>`;
          card.classList.add('flipped');
          return;
      }

      back.innerHTML = `
        <div class="back-title"><strong>${level} Details</strong></div>
        <div class="back-content">
          <div><strong>Work experience:</strong> ${info.experience_range}</div>
          <div><strong>Before MBA:</strong> $${info.average_salary_before}</div>
          <div><strong>After MBA:</strong> $${info.average_salary_after}</div>
        </div>
      `;
      card.classList.add('flipped');
    });
  });
}