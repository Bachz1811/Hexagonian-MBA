// Helper function to check for known error patterns
function hasKnownErrorPattern(errorMessage) {
  if (typeof errorMessage !== 'string') {
    return false; // Not a string, so not a known error
  }
  if (errorMessage.includes("Unable to parse assessment")) {
    return "The assessment could not be processed due to issues with the input data. Please review your entries and try again.";
  }
  return false;
}

// Builds the red/orange/green ring, scholarship bar, risk bars & salary delta.
// Builds the red/orange/green ring, scholarship bar, risk bars & salary delta.
function generateCandidateCard(result, baseSalary) {
  const matchScore = result.match_score || 0;
  const scholarshipProbability = result.scholarship_probability || 0;
  const fitType = result.fit_type || 'Unknown';
  const predictedSalary = result.predicted_salary || 0;
  const delta = predictedSalary - baseSalary;
  const deltaClass = delta >= 0 ? 'up' : 'down';
  const deltaText = delta >= 0
    ? `⬆️ ${predictedSalary - baseSalary >= 0 ? Math.abs(delta).toLocaleString() : ''}$`
    : `⬇️ ${Math.abs(delta).toLocaleString()}$`;

  return `
    <div class="candidate-card new-layout">
      <div class="card-header">
        <!-- MATCH SCORE RING -->
        <div class="match-column"> 
          <div class="radial-progress">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle class="circle-bg" cx="60" cy="60" r="54" fill="none" />
              <circle class="circle-progress" cx="60" cy="60" r="54" fill="none" stroke-width="8" />
            </svg>
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; line-height: 1.2; font-size: 30px;">
              <div class="percentage-text">0%</div>
            </div>
        </div>
        <div class="match-label-centered" style="font-size: 30px; font-weight: bold; color: #555; margin-top: 2px;">Matching Score</div>
        </div>


        <!-- SCHOLARSHIP & RISK -->
        <div class="info-column">
          <div class="segmented-meter-container">
            <div class="label">Scholarship Probability</div>
            <div class="frame-box"><div class="segments"></div></div>
            <div class="percent-text">${Math.round(scholarshipProbability * 100)}%</div>
          </div>
          <div class="risk-section">
            <h4>Risk Factors</h4>
            ${(
              Array.isArray(result.risk_factors) && result.risk_factors.length > 0
                ? result.risk_factors.map(r => {
                    const score = r.score || 0;
                    let barColor;
                    if (score >= 8) { // High risk: 8, 9, 10
                      barColor = '#4caf506'; // Red
                    } else if (score >= 4) { // Medium risk: 4, 5, 6, 7
                      barColor = '#ff9800'; // Orange
                    } else { // Low risk: 0, 1, 2, 3
                      barColor = '#f44336'; // Green
                    }
                    return `
                    <div class="risk-line">
                      <div class="label">${r.factor || r.name || 'Unknown'}</div>
                      <div class="bar"><div style="width:${(score * 10)}%; background-color: ${barColor}; height: 100%;"></div></div>
                      <div class="score">${score}/10</div>
                    </div>
                  `}).join('')
                : ''
            )}
          </div>
        </div>

        <!-- SALARY -->
        <div class="salary-column">
          <h3>Post-MBA salary prediction</h3>
          <div class="salary-amount" style="font-size: 60px; font-weight: bold; color: #5c9960;">$${predictedSalary.toLocaleString()}</div>
          <div class="delta-text ${deltaClass}">${deltaText}</div>
        </div>
      </div>
    </div>
  `;
}

// Animate the matching-score ring & percentage overlay
function animateMatchingScore(target, containerEl) {
  if (!containerEl) return;

  const circleEl = containerEl.querySelector('circle.circle-progress');
  const textEl = containerEl.querySelector('.percentage-text');
  if (!circleEl || !textEl) return;

  const radius = circleEl.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circleEl.style.strokeDasharray = `${circumference}`;
  circleEl.style.strokeDashoffset = `${circumference}`;

  let color = '#f44336';
  if (target >= 80) color = '#4caf50';
  else if (target >= 60) color = '#ff9800';
  circleEl.style.stroke = color;
  textEl.style.color = color;

  let progress = 0;
  const step = target > 0 ? target / 60 : 0;

  function draw() {
    if (step > 0) {
      progress = Math.min(progress + step, target);
    } else {
      progress = target;
    }

    circleEl.style.strokeDashoffset = circumference - (progress / 100) * circumference;
    textEl.textContent = `${Math.round(progress)}%`;

    if (progress < target && step > 0) {
      requestAnimationFrame(draw);
    }
  }
  requestAnimationFrame(draw);
}

// Segmented bar of 20 blocks, colored by scholarship %
function initSegmentedMeter(container, probability, segments = 20) {
  if (!container) return;
  const segContainer = container.querySelector('.segments');
  if (!segContainer) return;

  segContainer.innerHTML = '';
  for (let i = 0; i < segments; i++) {
    const seg = document.createElement('div');
    seg.classList.add('segment');
    segContainer.appendChild(seg);
  }

  let percent = probability;
  if (percent > 1 && percent <= 100) percent = percent / 100;
  percent = Math.min(Math.max(percent, 0), 1);
  const filledSegments = Math.round(percent * segments);

  let fillClass = '';
  if (percent * 100 <= 30) fillClass = 'filled-low';
  else if (percent * 100 <= 70) fillClass = 'filled-medium';
  else fillClass = 'filled-high';

  segContainer.querySelectorAll('.segment').forEach((seg, idx) => {
    seg.classList.remove('filled-low', 'filled-medium', 'filled-high');
    if (idx < filledSegments) seg.classList.add(fillClass);
  });

  const percentTextEl = container.querySelector('.percent-text');
  if (percentTextEl) {
    percentTextEl.textContent = `${Math.round(percent * 100)}%`;
  }
}

// Helper function to process markdown-like highlighting
function applyHighlighting(text) {
  if (typeof text !== 'string') return String(text); // Ensure it's a string
  // Convert **bold** to <strong>bold</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function updateSliderFill(slider) {
  const min = +slider.min || 0;
  const max = +slider.max || 100;
  const pct = ((+slider.value - min) / (max - min)) * 100;
  slider.style.setProperty('--val', `${pct}%`);
}

document.querySelectorAll('input[type="range"]').forEach(slider => {
  updateSliderFill(slider);             // init on page load
  slider.addEventListener('input', () => {
    updateSliderFill(slider);           // update as you drag
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("mbaFormTab6");
  const toggle = document.getElementById('assessment-toggle');
  const basicFields = document.querySelector('.basic-fields');
  const advancedFields = document.querySelector('.advanced-fields');
  const assessmentTypeInput = document.getElementById('assessment_type');
  const basicLabel = document.getElementById('basic-label');
  const advancedLabel = document.getElementById('advanced-label');
  const resultDiv = document.getElementById("result");

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        updateSliderFill(slider);
        slider.addEventListener('input', function() {
            updateSliderFill(this);
        });
    });
});
  function updateFormFieldsState() {
    if (!toggle || !assessmentTypeInput || !basicLabel || !advancedLabel || !basicFields || !advancedFields) return;
    const isAdvanced = toggle.checked;
    assessmentTypeInput.value = isAdvanced ? 'advanced' : 'basic';

    basicLabel.classList.toggle('active', !isAdvanced);
    advancedLabel.classList.toggle('active', isAdvanced);
    basicFields.style.display = isAdvanced ? 'none' : 'contents';
    advancedFields.style.display = isAdvanced ? 'grid' : 'none';

    basicFields.querySelectorAll('input, select, textarea').forEach(f => f.disabled = isAdvanced);
    advancedFields.querySelectorAll('input, select, textarea').forEach(f => f.disabled = !isAdvanced);
  }

  updateFormFieldsState();
  if (toggle) toggle.addEventListener('change', updateFormFieldsState);

  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    updateFormFieldsState();

    if (!resultDiv) return;
    resultDiv.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <div style="font-size:18px; margin-bottom:10px;">Processing your profile...</div>
        <div style="color:#666;">This may take a few moments</div>
      </div>
    `;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const currentAssessmentType = data.assessment_type;

    try {
      const response = await fetch('/submit_mba_profile_tab6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
      });
      const result = await response.json();
      // After you get 'result' from the backend, before rendering:
      if ((!result.improvements || !result.improvements.length) && result.rcm_improvement) {
        // If rcm_improvement is a string, split into array by period or newline
        if (typeof result.rcm_improvement === 'string') {
          result.improvements = result.rcm_improvement
            .split(/\.|\n/) // Split by period OR newline
            .map(s => s.trim())
            .filter(Boolean);
        } else if (Array.isArray(result.rcm_improvement)) {
          result.improvements = result.rcm_improvement;
        }
      }
      
      if (!response.ok) {
        throw new Error(result.error || result.message || `Server error: ${response.status}`);
      }
      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      }

      if (currentAssessmentType === 'basic') {
        // detect logical/parsing errors without shadowing the helper function
        const isLogicalError = 
          (result.recommended_mba_field?.toLowerCase() === "error") ||
          (result.summary?.toLowerCase().includes("unable to parse assessment"));
        const customMsg = hasKnownErrorPattern(result.summary || '');

        if (isLogicalError) {
          resultDiv.innerHTML = `
            <div class="card-header" style="justify-content:center;">
              <div class="info-column" style="text-align:center; width:100%; padding:20px; background:#fff8f8; border:1px solid #d9534f; border-radius:8px;">
                <h3 style="color:#d9534f;">Assessment Processing Error</h3>
                <p>We encountered an issue while processing your basic assessment details.</p>
                <p style="font-size:0.9em; color:#555;">
                  Specialization: "${result.recommended_mba_field || 'N/A'}"<br>
                  Summary: "${result.summary || 'N/A'}"
                </p>
                <p>${customMsg || "Please try again or check your inputs."}</p>
              </div>
            </div>
          `;
        } else {
          // normal basic display
          resultDiv.innerHTML = `
            <div class="basic-result-container">
              <div class="basic-top-row"> <!-- NEW WRAPPER for side-by-side layout -->
                <div class="basic-columns">
                  <div class="basic-match-col">
                    <div class="radial-progress">
                      <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle class="circle-bg" cx="60" cy="60" r="54" fill="none" />
                        <circle class="circle-progress" cx="60" cy="60" r="54" fill="none" stroke-width="8" />
                      </svg>
                      <div class="percentage-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 32px; color: #4caf50;">0%</div>
                    </div>
                    <div class="match-label-centered">Matching Score</div>
                  </div>
                  <div class="basic-scholarship-col">
                    <div class="scholarship-label-top"> Scholarship probability </div>
                    <div class="segmented-meter-container" id="basic-scholarship-meter">
                      <div class="frame-box">
                      <div class="segments"></div></div>
                      <div class="percent-text scholarship-percent">${Math.round((result.scholarship_probability || 0) * 100)}%</div>
                    </div>
                  </div>
                </div>
                <div class="basic-skills-col">
                  <div class="skills-section">
                    <h4>Skills to Build</h4>
                    <ul class="skills-list" style="padding-left: 0; list-style-type: none;">
                      ${
                          (result.recommended_skills || [])
                              .filter(skill => skill && String(skill).trim() !== '' && String(skill).toLowerCase() !== 'undefined')
                              .map((skill, idx) => `
                                  <li style="margin-bottom: 6px; display: flex; align-items: center;">
                                      <input 
                                          type="checkbox" 
                                          id="skill-checkbox-${idx}"
                                          name="skill_checkbox_${idx}" 
                                          checked 
                                          disabled 
                                          style="margin-right: 8px; accent-color: #4CAF50; cursor: default; width: 1em; height: 1em;"
                                      >
                                      <label 
                                          for="skill-checkbox-${idx}"
                                          style="cursor: default; vertical-align: middle;"
                                      >${skill}</label>
                                  </li>
                              `).join('')
                      }
                    </ul>
                  </div>
                </div>
              </div> <!-- END basic-top-row -->
            <div class="info-column">
              <h3>Recommended Specialization</h3>
              <p>${result.recommended_mba_field || "N/A"}</p>
              <h3>Executive Summary</h3>
              <p>${result.summary || "N/A"}</p>
            </div>
            <div class="risk-section">
              <h4>Risk Factors</h4>
              ${(Array.isArray(result.risk_factors) ? result.risk_factors : []).map(r => {
                const score = Number(r.score) || 0; // Ensure score is a number (0-10)
                const percentage = score * 10; // Convert to 0-100%
                let riskLevelClass = '';

                if (score <= 3) { // 0-3 is low
                  riskLevelClass = 'risk-level-low';
                } else if (score <= 7) { // 4-7 is medium
                  riskLevelClass = 'risk-level-medium';
                } else { // 8-10 is high
                  riskLevelClass = 'risk-level-high';
                }

                return `
                  <div class="risk-line">
                    <div class="label">${r.factor || 'Unknown'}</div>
                    <div class="risk-meter ${riskLevelClass}" style="--value: ${percentage}%"></div>
                    <div class="score">${score}/10</div>
                  </div>
                `;
              }).join('')}
            </div>
           </div>
          `;
        }
        // Animate the radial progress ring in Basic mode
        const basicRing = resultDiv.querySelector('.radial-progress');
        animateMatchingScore(result.match_score || 0, basicRing);
  
        // Initialize scholarship meter for Basic mode (if not in error state)
        const basicScholarshipMeter = resultDiv.querySelector('#basic-scholarship-meter');
        if (basicScholarshipMeter) {
            initSegmentedMeter(basicScholarshipMeter, result.scholarship_probability || 0);
        }
      } else { // advanced
        // 1) render the card
        const baseSalary = parseFloat(data.Adv_Annual_Salary_Before_MBA || 0);
        const cardHTML = generateCandidateCard(result, baseSalary);

        // 2) details below
        const details = `
          <h2>Result Summary</h2>
          <p><strong>📚 Recommended Field:</strong> ${result.recommended_mba_field}</p>
          <p><strong>🧾 Executive Summary:</strong> ${result.summary}</p>

          <h3>🔧 Improvements</h3>
          <ol>
            ${
              Array.isArray(result.improvements) && result.improvements.length
                ? result.improvements.map(imp => `<li>${applyHighlighting(imp)}</li>`).join('')
                : (typeof result.improvements === 'string' && result.improvements.trim())
                  ? `<li>${applyHighlighting(result.improvements)}</li>`
                  : (Array.isArray(result.improvements) && result.improvements.length === 0)
                    ? '<li>No specific improvements suggested.</li>'
                    : (typeof result.improvements === 'object' && result.improvements !== null)
                      ? Object.values(result.improvements).map(imp => `<li>${applyHighlighting(imp)}</li>`).join('')
                      : '<li>No specific improvements suggested.</li>'
            }
          </ol>

          <h3>🚀 Career Path</h3>
          <ul>${(result.career_path||[]).map(r=>`<li>${r.step || r.description || (typeof r === 'string' ? r : JSON.stringify(r))}</li>`).join('')}</ul>

          <h3>🧠 Skills to Build</h3>
          <ul>${(result.recommended_skills||[]).map(s=>`<li>${s}</li>`).join('')}</ul>

          <h3>🌍 Best Locations</h3>
          <div id="map" style="height:300px;margin-bottom:20px"></div>
        `;

        resultDiv.innerHTML = cardHTML + details;
        const ring = resultDiv.querySelector('.radial-progress');
        animateMatchingScore(result.match_score || 0, ring);

         // Add the recommended programs using the renderMBAPrograms function
        if (result.recommended_mba_programs && result.recommended_mba_programs.length > 0 && typeof window.renderMBAPrograms === 'function') {
            const programsContainer = window.renderMBAPrograms(result.recommended_mba_programs);
            resultDiv.appendChild(programsContainer);
        }

        // 3) wire up meters & animations
        document.querySelectorAll('.segmented-meter-container').forEach(c =>
          initSegmentedMeter(c, result.scholarship_probability || 0)
        );
        const ringContainer = resultDiv.querySelector('.matching-container .radial-progress');
        animateMatchingScore(result.match_score || 0, ringContainer);

        // 4) map callbacks
        if (typeof loadInteractiveMap === 'function' && result.best_locations) {
          loadInteractiveMap(result.best_locations);
          setTimeout(() => {
            document.getElementById('map')?.classList.add('map-ready');
          }, 100);
        }
        if (typeof initializeMap === 'function' && result.best_locations?.length) {
          initializeMap(result.best_locations);
        }
      }

    } catch (error) {
      console.error('Error during form submission or processing:', error);
      resultDiv.innerHTML = `
        <div class="error-message" style="color:#d9534f; padding:20px; border:1px solid #d9534f; border-radius:8px; text-align:center; background:#fff8f8;">
          <h3 style="color:#d9534f;">An Error Occurred</h3>
          <p>${error.message}</p>
          <p>Please check the console and try again.</p>
        </div>
      `;
    }
  });
});
