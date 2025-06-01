// Function to create an SVG radar chart for program strengths
function createStrengthsSVG(strengths, axes) {
  const size = 480;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 110;
  const n = axes.length;
  const maxValue = 100;
  const levels = 4;
  const webBlue = "#b53b1b";
  const gridColor = "#f4e1db";

  // Helper to get point on circle
  function getPoint(angle, dist) {
    return {
      x: centerX + dist * Math.cos(angle),
      y: centerY + dist * Math.sin(angle)
    };
  }

  // SVG elements as strings
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;margin:auto;">
    <g>`;

  // Draw grid polygons
  for (let level = 1; level <= levels; level++) {
    let levelRadius = radius * (level / levels);
    let points = [];
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI / n) * i - Math.PI / 2;
      const p = getPoint(angle, levelRadius);
      points.push(`${p.x},${p.y}`);
    }
    svg += `<polygon points="${points.join(' ')}" stroke="${gridColor}" stroke-width="1" fill="none" />`;
  }

  // Draw axes lines
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2;
    const p = getPoint(angle, radius);
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${p.x}" y2="${p.y}" stroke="${gridColor}" stroke-width="1" />`;
  }

  // Draw data polygon
  let dataPoints = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2;
    const r = radius * (strengths[i] / maxValue);
    const p = getPoint(angle, r);
    dataPoints.push(`${p.x},${p.y}`);
  }
  svg += `<polygon points="${dataPoints.join(' ')}" fill="${webBlue}" fill-opacity="0.13" stroke="${webBlue}" stroke-width="2" />`;

  // Draw dots and value labels
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2;
    const r = radius * (strengths[i] / maxValue);
    const p = getPoint(angle, r);
    svg += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="${webBlue}" stroke-width="2" />`;
    // Value label
    const labelOffsetX = (p.x < centerX) ? -14 : 14;
    const labelOffsetY = (p.y < centerY) ? -14 : 18;
    svg += `<text x="${p.x + labelOffsetX}" y="${p.y + labelOffsetY}" fill="#b53b1b" font-size="13" font-weight="700" text-anchor="middle">${strengths[i]}</text>`;
  }

  // Improved axis label placement with better word wrapping
  const labelRadius = radius + 120; // Move labels further out
  const maxLineLength = 6;
  const maxLines = 2;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2;
    const p = getPoint(angle, labelRadius);

    // Word wrap to maxLineLength, maxLines
    const words = axes[i].split(' ');
    let lines = [];
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length > maxLineLength) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    });
    if (currentLine) lines.push(currentLine);

    // Truncate to maxLines
    let truncated = false;
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      // Truncate the last line with ellipsis
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxLineLength - 1) + '…';
      truncated = true;
    }

    let anchor = "middle";
    if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) {
      anchor = "start";
    } else if (angle < -Math.PI * 0.25 && angle > -Math.PI * 0.75) {
      anchor = "end";
    }

    // Render each line with <tspan>
    let label = '';
    lines.forEach((line, idx) => {
      label += `<tspan x="${p.x}" dy="${idx === 0 ? 0 : 13}">${line}</tspan>`;
    });

    // Add tooltip if truncated
    const tooltip = truncated ? ` title="${axes[i].replace(/\"/g, '&quot;')}"` : '';

    svg += `<text x="${p.x}" y="${p.y + 4}" fill="#b53b1b" font-size="15" font-weight="600" text-anchor="${anchor}"${tooltip}>${label}</text>`;
  }

  svg += `</g></svg>`;
  return svg;
}

// Function to get country flag emoji
function getCountryFlag(country) {
  const codePoints = country
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

// Function to render MBA program cards
function renderMBAPrograms(programs) {
  const container = document.createElement('div');
  container.className = 'mba-programs-container';
  
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'mba-programs-scroll';
  
  programs.forEach(program => {
    const card = document.createElement('div');
    card.className = 'mba-program-card';

    // Dynamic axes and values
    let axes = [];
    let values = [];
    if (Array.isArray(program.strengths) && program.strengths.length > 0) {
      if (typeof program.strengths[0] === 'object' && program.strengths[0] !== null) {
        axes = program.strengths.map(s => s.label || s.axis || '');
        values = program.strengths.map(s => s.value || 0);
      } else {
        axes = program.strengths;
        values = Array.isArray(program.strengths_values) ? program.strengths_values : Array(program.strengths.length).fill(70);
      }
    } else {
      axes = ['Entrepreneurship', 'Innovation', 'Leadership', 'Global', 'Technology'];
      values = [70, 70, 70, 70, 70];
    }
    // Ensure at least 3 axes/values for a valid radar chart
    if (axes.length < 3) {
      const defaultAxes = ['Leadership', 'Global', 'Technology', 'Analytics', 'Strategy'];
      while (axes.length < 3) {
        axes.push(defaultAxes[axes.length % defaultAxes.length]);
        values.push(60);
      }
    }

    card.innerHTML = `
      <div class="mba-program-header">
        <img src="/static/tab6/school-logos/${program.school.toLowerCase().replace(/\s+/g, '-')}.svg" 
             alt="${program.school} logo" 
             class="school-logo"
             onerror="this.src='/static/tab6/school-logos/default.svg'">
        <div class="school-info">
          <h3 class="school-name">${program.school}</h3>
          <div class="school-location">
            ${program.location}
          </div>
        </div>
      </div>
      
      <div class="tuition"><span class="tuition-label">Tuition:</span> <span class="tuition-value">$${(program.tuition || Math.floor(Math.random() * 50000 + 50000)).toLocaleString()}</span></div>
      
      <div class="program-tags">
        ${program.program_type?.includes('Online') ? '<span class="program-tag">Online</span>' : ''}
        ${program.program_type?.includes('International') ? '<span class="program-tag">International</span>' : ''}
        ${Math.random() > 0.5 ? '<span class="program-tag">Scholarships</span>' : ''}
        ${Math.random() > 0.5 ? '<span class="program-tag">Strong Finance</span>' : ''}
      </div>
      
      <div class="strengths-chart" title="Pentagon axes: ${axes.join(', ')}"></div>
      
      <p class="fit-reason">${program.fit_reason}</p>
      
      <a href="https://www.google.com/search?q=${encodeURIComponent(program.school + ' MBA program')}" 
         target="_blank" 
         class="learn-more-btn">
        Learn More
      </a>
    `;
    
    scrollContainer.appendChild(card);
    
    // Initialize the radar chart after the card is added to the DOM
    setTimeout(() => {
      const chartContainer = card.querySelector('.strengths-chart');
      // Replace canvas with SVG radar chart
      chartContainer.innerHTML = createStrengthsSVG(values, axes);
    }, 0);
  });
  
  container.appendChild(scrollContainer);
  return container;
}

// Export the render function
window.renderMBAPrograms = renderMBAPrograms;

// --- BASIC/ADVANCED TOGGLE & BASIC FORM ---

function renderBasicFormAndResults(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Create toggle button
  const toggleDiv = document.createElement('div');
  toggleDiv.style.textAlign = 'center';
  toggleDiv.innerHTML = `
    <button class="toggle-mode-btn active" id="basicModeBtn">Basic</button>
    <button class="toggle-mode-btn" id="advancedModeBtn">Advanced</button>
  `;

  // Create form
  const formDiv = document.createElement('div');
  formDiv.className = 'basic-form-card';
  formDiv.innerHTML = `
    <form id="basicForm">
      <label for="age">Age</label>
      <input type="number" id="age" name="age" min="16" max="70" required>

      <label for="work_experience">Work Experience (years)</label>
      <input type="number" id="work_experience" name="work_experience" min="0" max="50" required>

      <label for="major">Undergraduate Major</label>
      <input type="text" id="major" name="major" maxlength="64" required>

      <label for="job_title">Current Job Title</label>
      <input type="text" id="job_title" name="job_title" maxlength="64" required>

      <label for="score">GMAT/GRE Score</label>
      <input type="number" id="score" name="score" min="200" max="800" required>

      <label for="reason">Reason for Pursuing MBA</label>
      <textarea id="reason" name="reason" maxlength="200" required placeholder="e.g., Career Growth, Industry Switch, Entrepreneurship, etc."></textarea>

      <button type="submit" class="submit-btn">Submit</button>
    </form>
  `;

  // Results card placeholder
  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'basicResultsContainer';

  // Add to container
  container.innerHTML = '';
  container.appendChild(toggleDiv);
  container.appendChild(formDiv);
  container.appendChild(resultsDiv);

  // Toggle logic
  const basicBtn = document.getElementById('basicModeBtn');
  const advBtn = document.getElementById('advancedModeBtn');
  basicBtn.onclick = () => {
    basicBtn.classList.add('active');
    advBtn.classList.remove('active');
    formDiv.style.display = '';
    resultsDiv.style.display = '';
    if (window.renderMBAPrograms) {
      document.querySelectorAll('.mba-programs-container').forEach(e => e.style.display = 'none');
    }
  };
  advBtn.onclick = () => {
    advBtn.classList.add('active');
    basicBtn.classList.remove('active');
    formDiv.style.display = 'none';
    resultsDiv.style.display = 'none';
    if (window.renderMBAPrograms) {
      document.querySelectorAll('.mba-programs-container').forEach(e => e.style.display = '');
    }
  };

  // Form submit logic
  formDiv.querySelector('form').onsubmit = async function(e) {
    e.preventDefault();
    resultsDiv.innerHTML = '<div class="basic-results-card">Loading...</div>';
    const data = {
      age: formDiv.querySelector('#age').value,
      work_experience: formDiv.querySelector('#work_experience').value,
      major: formDiv.querySelector('#major').value,
      job_title: formDiv.querySelector('#job_title').value,
      score: formDiv.querySelector('#score').value,
      reason: formDiv.querySelector('#reason').value
    };
    try {
      const resp = await fetch('/basic-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await resp.json();
      resultsDiv.innerHTML = renderBasicResults(result);
    } catch (err) {
      resultsDiv.innerHTML = '<div class="basic-results-card">Error: Could not get assessment.</div>';
    }
  };
}

function renderBasicResults(result) {
  if (!result) return '';
  return `
    <div class="basic-results-card">
      <div class="score">Match Score: ${result.match_score ?? '--'}</div>
      <div class="specialization">Best-fit Specialization: ${result.specialization ?? '--'}</div>
      <div class="summary">${result.summary ?? ''}</div>
      <div class="scholarship">Estimated Scholarship Probability: <b>${typeof result.scholarship_probability === 'number' ? (result.scholarship_probability * 100).toFixed(1) + '%' : '--'}</b></div>
      <div><b>Risk Factors:</b>
        <ul class="risk-list">
          ${(result.risks || []).map(r => `<li>${r.name} <span style="color:#7a2a0e;font-weight:600;">(Risk: ${r.risk_score}/10)</span></li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

// To use: call renderBasicFormAndResults('your-container-id') on page load. 