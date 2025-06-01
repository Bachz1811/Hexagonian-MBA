function createSegmentedMeter(container, probability, segmentCount = 20) {
  const segmentsContainer = container.querySelector('.segments');
  const percentText = container.querySelector('.percent-text');
  segmentsContainer.innerHTML = '';
  percentText.textContent = `${(probability * 100).toFixed(1)}%`;

  const filled = Math.round(probability * segmentCount);
  let fillClass = 'filled-low';
  if (probability > 0.7) fillClass = 'filled-high';
  else if (probability > 0.3) fillClass = 'filled-medium';

  for (let i = 0; i < segmentCount; i++) {
    const seg = document.createElement('div');
    seg.classList.add('segment');
    if (i < filled) seg.classList.add(fillClass);
    segmentsContainer.appendChild(seg);
  }
}