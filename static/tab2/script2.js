// static/tab2/script2.js
let data = {};
let salaryComparisonChart;
let currentFlippedLevel = null;

// Load data and initialize
fetch(typeof DATA_JSON_URL !== "undefined" ? DATA_JSON_URL : "tab2/data.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for ${res.url}`);
    return res.json();
  })
  .then(json => {
    data = json;
    initializeSalaryChart();
    attachStepListeners();
  })
  .catch(err => console.error("Cannot load data.json for Tab 2:", err));

function initializeSalaryChart() {
  const levelNames = ["Entry Level", "Junior Level", "Experienced Level", "Senior Level"];
  const beforeData = levelNames.map(lvl => data[lvl]?.average_salary_before ?? 0);
  const afterData = levelNames.map(lvl => data[lvl]?.average_salary_after ?? 0);

  const lightB = 'rgba(170,59,25,0.7)';
  const lightA = 'rgba(29,79,67,0.7)';
  const darkB = '#aa3b19';
  const darkA = '#1d4f43';

  const chartDisplayContainer = document.getElementById("chart-container");
  const canvas = document.getElementById("salaryChart");

  if (!canvas) {
    console.error("Tab 2: Canvas element with ID 'salaryChart' not found!");
    return;
  }
  if (!chartDisplayContainer) {
    console.warn("Tab 2: Element with ID 'chart-container' not found.");
  }

  try {
    const ctx = canvas.getContext("2d");

    if (salaryComparisonChart) salaryComparisonChart.destroy();

    salaryComparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: levelNames,
        datasets: [
          {
            label: 'Salary Before MBA',
            data: beforeData,
            backgroundColor: beforeData.map(() => lightB),
            borderColor: beforeData.map(() => lightB),
            borderWidth: 1
          },
          {
            label: 'Expected Salary After MBA',
            data: afterData,
            backgroundColor: afterData.map(() => lightA),
            borderColor: afterData.map(() => lightA),
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
              generateLabels: chart => {
                const idx = chart.data.labels.indexOf(currentFlippedLevel);
                return chart.data.datasets.map((ds, i) => ({
                  text: ds.label,
                  fillStyle: i === 0
                    ? (idx !== -1 ? darkB : lightB)
                    : (idx !== -1 ? darkA : lightA),
                  strokeStyle: 'transparent',
                  lineWidth: 0,
                  hidden: false,
                  index: i
                }));
              }
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

    if (chartDisplayContainer) chartDisplayContainer.classList.add("show");
    console.log("Tab 2: Salary chart rendered successfully!");
  } catch (e) {
    console.error("Tab 2: Salary chart failed to render!", e);
  }
}

function attachStepListeners() {
  const stepEls = document.querySelectorAll('.step');
  const lightB = 'rgba(170,59,25,0.7)';
  const lightA = 'rgba(29,79,67,0.7)';
  const dimB = 'rgba(170,59,25,0.3)';
  const dimA = 'rgba(29,79,67,0.3)';
  const darkB = '#aa3b19';
  const darkA = '#1d4f43';

  stepEls.forEach(el => {
    el.addEventListener('click', () => {
      if (!salaryComparisonChart || !salaryComparisonChart.data) {
        console.error("Tab 2: salaryComparisonChart not initialized before click.");
        return;
      }

      const level = el.getAttribute('data-step');
      const card = document.querySelector('.card2');
      const back = document.querySelector('.card-back');

      if (!card || !back) {
        console.error("Tab 2: Card elements not found for interaction.");
        return;
      }

      // Reset
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

      if (idx === -1) {
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
