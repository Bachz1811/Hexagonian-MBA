// script.js

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sortButtons       = document.querySelectorAll('.sort-btn');
  const topReasonsContainer = document.getElementById('topReasonsScroll') || document.getElementById('topReasonsList');
  const reason1Select     = document.getElementById('reason1Select');
  const reason2Select     = document.getElementById('reason2Select');
  const compareBtn        = document.getElementById('compareBtn');
  const compareResult     = document.getElementById('compareResult');

  // State & data maps
  let currentSort = 'Male';
  const reasons   = Object.keys(genderPercentages);
  const emojiMap = {
    "Career Growth":     "🧗‍♂️",
    "Skill Enhancement": "🧠",
    "Networking":        "🤝",
    "Entrepreneurship":  "🚀"
  };
  const colorMap = {
    "Career Growth":     "#921A40",
    "Skill Enhancement": "#C75B7A",
    "Networking":        "#D9ABAB",
    "Entrepreneurship":  "#FFC6C6"
  };

  // Create external tooltip container for Chart.js
  const tooltipEl = document.createElement('div');
  tooltipEl.classList.add('chartjs-tooltip');
  document.body.appendChild(tooltipEl);

  function externalTooltipHandler(context) {
    const { chart, tooltip } = context;
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Get data value
    const dataIndex = tooltip.dataPoints[0].dataIndex;
    const value     = chart.data.datasets[0].data[dataIndex];

    // Set content
    tooltipEl.innerHTML = `<strong>${value.toFixed(1)}%</strong>`;

    // Position above the segment
    const canvasRect = chart.canvas.getBoundingClientRect();
    tooltipEl.style.left    = canvasRect.left + window.pageXOffset + tooltip.caretX + 'px';
    tooltipEl.style.top     = canvasRect.top  + window.pageYOffset + tooltip.caretY + 'px';
    tooltipEl.style.opacity = 1;
  }

    // Render a donut chart on given canvas
      function createDonut(canvasId, value, color) {
        new Chart(document.getElementById(canvasId), {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [ value, 100 - value ],
              backgroundColor: [ color, '#f0f0f0' ],
              hoverOffset: 10,
              borderWidth: 0
            }]
          },
          options: {
            cutout: '70%',
            animation: {
              animateRotate: true,
              duration: 1000
            },
            plugins: {
              tooltip: {
                enabled: false,
                external: externalTooltipHandler
              },
              legend: { display: false }
            }
          }
        });
      }

    // IntersectionObserver for visibility and auto-flip
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target;
            card.classList.add('visible');
            // Auto-flip sequence
            setTimeout(() => card.classList.add('flipped'), 800);
            setTimeout(() => card.classList.remove('flipped'), 2400);
            obs.unobserve(card);
          }
        });
      }, {
        root:      topReasonsContainer,
        threshold: 0.3
      });

  // Render top 4 reason cards
  function updateTopReasons() {
    const descriptions = {
      "Career Growth":     "Opportunities don't happen. You create them.",
      "Skill Enhancement": "The more you learn, the more you earn.",
      "Networking":        "If you want to go fast, go alone. If you want to go far, go together.",
      "Entrepreneurship":  "The best way to predict the future is to create it."
    };

    topReasonsContainer.innerHTML = '';
    let top4;

    if (currentSort === 'All') {
    top4 = reasons
      .slice()
      .sort((a, b) => {
        const totalA = ['Male', 'Female', 'Other'].reduce((sum, g) => sum + genderPercentages[a][g], 0);
        const totalB = ['Male', 'Female', 'Other'].reduce((sum, g) => sum + genderPercentages[b][g], 0);
        return totalB - totalA;
      })
      .slice(0, 4);
    } else {
    top4 = reasons
      .slice()
      .sort((a, b) => genderPercentages[b][currentSort] - genderPercentages[a][currentSort])
      .slice(0, 4);
    }
    
      top4.forEach((reason, index) => {
  const emoji = emojiMap[reason] || '📊';
  const baseColor = colorMap[reason] || '#999';
  const canvasId = `donut-${index}`;

  const genderData = ['Male', 'Female', 'Other'].map(g => genderPercentages[reason][g]);
  const genderLabels = ['Male', 'Female', 'Other'];
  const genderColors = ['#921A40', '#C75B7A', '#F0B5B5']; // consistent coloring

  const percentText = currentSort === 'All'
    ? ''
    : `<div class="percent">${genderPercentages[reason][currentSort].toFixed(1)}%</div>`;

  const card = document.createElement('div');
  card.className = 'card';
  card.style.overflow = 'hidden';

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="icon">${emoji}</div>
        <div class="reason">${reason}</div>
        <canvas id="${canvasId}" width="100" height="100"></canvas>
        ${percentText}
        ${currentSort === 'All' ? `
          <div class="multi-legend">
            <span style="color:#921A40;">● Male</span>
            <span style="color:#C75B7A;">● Female</span>
            <span style="color:#F0B5B5;">● Other</span>
          </div>
        ` : ''}
      </div>
      <div class="card-back">
        <h4 class="back-title">${reason}</h4>
        <button class="share-btn" title="Copy quote">🔗</button>
        <p>${descriptions[reason]}</p>
      </div>
    </div>
  `;

  topReasonsContainer.appendChild(card);

  if (currentSort === 'All') {
    new Chart(document.getElementById(canvasId), {
      type: 'doughnut',
      data: {
        labels: genderLabels,
        datasets: [{
          data: genderData,
          backgroundColor: genderColors,
          hoverOffset: 10,
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        animation: { animateRotate: true, duration: 1000 },
        plugins: {
          tooltip: { enabled: false, external: externalTooltipHandler },
          legend: { display: false }
        }
      }
    });
  } else {
    const value = genderPercentages[reason][currentSort];
    createDonut(canvasId, value, baseColor);
  }

  io.observe(card);

  card.querySelector('.share-btn').addEventListener('click', ev => {
    ev.stopPropagation();
    const text = `${reason}: "${descriptions[reason]}"`;
    navigator.clipboard.writeText(text)
      .then(() => alert('Quote has been copied!'))
      .catch(() => alert('Copy failed.'));
  });

  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
  });
});
}

  // Sort tabs event
  sortButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      sortButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateTopReasons();
    });
  });

  // Populate compare dropdowns
  reasons.forEach(reason => {
    const o1 = document.createElement('option');
    o1.value = o1.textContent = reason;
    reason1Select.appendChild(o1);

    const o2 = o1.cloneNode(true);
    reason2Select.appendChild(o2);
  });

  // Compare button handler
    compareBtn.addEventListener('click', () => {
      const r1 = reason1Select.value;
      const r2 = reason2Select.value;
      if (!r1 || !r2 || r1 === r2) {
        compareResult.innerHTML = `<p style="color:#999;text-align:center;">
          Please choose two <b>different</b> reasons 👀
        </p>`;
        compareResult.classList.remove('hidden');
        compareInsight.classList.add('hidden');
        return;
      }

      compareResult.innerHTML = '';
      compareInsight.innerHTML = '';

      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';

      const genders = ['Male','Female','Other'];

      [r1, r2].forEach((reasonKey, idx) => {
        const card = document.createElement('div');
        card.className = 'compare-card';
        card.style.color = colorMap[reasonKey] || '#333';

        let html = `
          <div class="icon">${emojiMap[reasonKey] || '📊'}</div>
          <div class="reason">${reasonKey}</div>
        `;
        genders.forEach(gender => {
          const val = genderPercentages[reasonKey][gender];
          html += `
            <div class="compare-bar-mini">
              <span style="width:50px;text-align:left;">${gender}</span>
              <div class="bar-box" style="width:${val}%;"></div>
              <small style="width:30px;text-align:right;">${val.toFixed(1)}%</small>
            </div>
          `;
        });
        card.innerHTML = html;
        container.appendChild(card);

        if (idx === 0) {
          const vs = document.createElement('div');
          vs.className = 'compare-vs';
          vs.textContent = 'VS';
          container.appendChild(vs);
        }
      });
      compareResult.appendChild(container);
      compareResult.classList.remove('hidden');

        // Calculate and display insights
        const rawDiffs = genders.map(gender => ({
          gender,
          diff: genderPercentages[r1][gender] - genderPercentages[r2][gender]
        }));
        const maxObj = rawDiffs.reduce((prev, curr) =>
          Math.abs(curr.diff) > Math.abs(prev.diff) ? curr : prev
        );

        const winner = maxObj.diff > 0 ? r1 : r2;
        const loser  = maxObj.diff > 0 ? r2 : r1;
        const value  = Math.abs(maxObj.diff).toFixed(1);
        const mainInsight = document.createElement('div');
        mainInsight.className = 'insight-box';
        mainInsight.innerHTML = `
          🏆 <strong>${winner}</strong> leads <strong>${loser}</strong> by 
          <strong>${value}%</strong> among <strong>${maxObj.gender}</strong>!
        `;
        compareInsight.appendChild(mainInsight);
        const detailsEl = document.createElement('details');
        detailsEl.className = 'insight-details';
          detailsEl.innerHTML = `
            <summary>See all differences</summary>
            <ul class="insight-list">
              ${
                rawDiffs.map(d => {
                  const who = d.diff > 0 ? r1 : r2;
                  return `
                    <li>
                      <span class="insight-gender">${d.gender}:</span>
                      <span class="insight-value">${Math.abs(d.diff).toFixed(1)}% (${who} higher)</span>
                    </li>
                  `;
                }).join('')
              }
            </ul>
          `;
        compareInsight.appendChild(detailsEl);
        compareInsight.classList.remove('hidden');
      });

        // Initial render
        updateTopReasons();
});
