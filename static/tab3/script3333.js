console.log("Executing script3333.js - Timestamp:", new Date().toISOString());
const customLabelsWithArrows = {
      id: 'customLabelsWithArrows',
      afterDraw(chart) {
        const { ctx } = chart;
        const meta1 = chart.getDatasetMeta(0);
        const meta2 = chart.getDatasetMeta(1);
        const entData = chart.data.datasets[0].data;
        const netData = chart.data.datasets[1].data;
        const entColors = chart.data.datasets[0].backgroundColor;
        const netColors = chart.data.datasets[1].backgroundColor;
        const entTotal = entData.reduce((a, b) => a + b, 0);
        const netTotal = netData.reduce((a, b) => a + b, 0);

        
        function drawArrowWithText(x1, y1, x2, y2, text, inside = true, color = '#000') {
          const headlen = 10;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
          ctx.lineTo(x2, y2);
          ctx.fillStyle = color;
          ctx.fill();
          const offset = inside ? -10 : 10;
          const extension = 20; // distance from arrow tip
          const textX = x2 + extension * Math.cos(angle);
          const textY = y2 + extension * Math.sin(angle);
          ctx.font = 'bold 16px Montserrat';
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, textX, textY);
          ctx.restore();
        }

        function drawLabels(meta, data, total, radiusOffset, inside = true, colors) {
          for (let i = 0; i < meta.data.length; i++) {
            const segment = meta.data[i];
            if (!segment || !segment.startAngle || data[i] <= 0) continue;
            const angle = (segment.startAngle + segment.endAngle) / 2;
let fromX, fromY, toX, toY;

if (inside) {
  // Inner ring: now outward
fromX = segment.x + (segment.innerRadius + 2) * Math.cos(angle);
fromY = segment.y + (segment.innerRadius + 2) * Math.sin(angle);
toX = segment.x + (segment.innerRadius + 25) * Math.cos(angle);
toY = segment.y + (segment.innerRadius + 25) * Math.sin(angle);
} else {
  // Outer ring: now inward
  fromX = segment.x + (segment.outerRadius - 5) * Math.cos(angle);
  fromY = segment.y + (segment.outerRadius - 5) * Math.sin(angle);
  toX = segment.x + (segment.outerRadius - 25) * Math.cos(angle);
  toY = segment.y + (segment.outerRadius - 25) * Math.sin(angle);
}
            const percent = ((data[i] / total) * 100).toFixed(2) + '%';
            drawArrowWithText(fromX, fromY, toX, toY, percent, inside, colors[i]);
          }
        }

        if (meta1 && meta2) {
          drawLabels(meta1, entData, entTotal, -25, true, entColors);
          drawLabels(meta2, netData, netTotal, 25, false, netColors);
        }
      }
    };


        let chart;
        let currentValue = 0;
        const MAX_SCROLL_VALUE = 200;

        let dataValues = { entrepreneurial: [], networking: [], entColors: [], netColors: [], labels: [] };

        async function fetchData() {
            console.log("fetchData called"); // Check if function is called
            try {
            const entRes = await fetch(`/get_chart_data/entrepreneurial`);
            const netRes = await fetch(`/get_chart_data/networking`);
        console.log("Fetch responses received:", entRes.ok, netRes.ok); // Check if fetches were successful

        if (!entRes.ok || !netRes.ok) {
            console.error("Fetch failed:", entRes.statusText, netRes.statusText);
            return;
        }

        const entData = await entRes.json();
        const netData = await netRes.json();
        console.log("Fetched Entrepreneurial Data:", JSON.stringify(entData));
        console.log("Fetched Networking Data:", JSON.stringify(netData));

        if (!entData || !entData.values || !entData.labels || !netData || !netData.values || !netData.labels) {
            console.error("Data from backend is incomplete (missing values or labels).");
            return;
        }
        if (entData.values.length === 0 || netData.values.length === 0) {
            console.error("Data values array from backend is empty.");
            
            return;
        }


        dataValues.entrepreneurial = entData.values.map(v => parseFloat(parseFloat(v).toFixed(2)));
        dataValues.networking = netData.values.map(v => parseFloat(parseFloat(v).toFixed(2)));
        
        dataValues.entColors = entData.colors || ['#8e5d2a', '#d6ac4e', '#c66e21', '#ed7e26']; // Fallback if not provided
        dataValues.netColors = netData.colors || ['#688d5c', '#1d4f43', '#6d7247', '#aa3b19']; // Fallback
        dataValues.labels = entData.labels; // Assuming entData and netData have same labels

        console.log("Processed dataValues for chart:", JSON.parse(JSON.stringify(dataValues)));
    } catch (error) {
        console.error("Error in fetchData:", error);
    }
}

        function buildLegend(containerId, title, labels, colors, values = []) {
            const container = document.getElementById(containerId);
            container.innerHTML = `<div class='legend-title'>${title}</div>` +
                labels.map((label, i) => {
                    const percentage = values[i] ? values[i].toFixed(2) + '%' : '';
                   return `<div data-index='${i}'><span class='legend-box' style='background-color:${colors[i]}'></span><strong style='color:${colors[i]}'>${percentage}</strong><br>${label}</div>`;

                }).join('');
        }

       function buildChart() {
    console.log("buildChart called"); // Check if function is called
    const canvasElement = document.getElementById('donutChart');
    if (!canvasElement) {
        console.error("Canvas element #donutChart NOT FOUND!");
        return; // Critical error, can't build chart
    }
    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
        console.error("Could not get 2D context from canvas!");
        return;
    }

    // Ensure dataValues has some content before building chart
    if (!dataValues.labels || dataValues.labels.length === 0) {
        console.warn("Building chart with no initial labels. Data might not be ready.");
    }
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [
                {
  label: 'Entrepreneurial Interest',
  data: [],
  backgroundColor: dataValues.entColors,
  borderColor: 'rgba(0,0,0,0)',  
  borderWidth: 0,               
  radius: '80%'
},
{
  label: 'Networking Importance',
  data: [],
  backgroundColor: [],
  borderColor: 'rgba(0,0,0,0)',  
  borderWidth: 0,
  radius: '80%'   
}
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            rotation: -Math.PI / 2,
            circumference: 360,
            animation: false,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false },
                title: {
                    display: true,
                }
            }, 
        },
        
       
        plugins: [  
            customLabelsWithArrows, 
                {
    id: 'gridLines',
    beforeDraw(chart) {
        
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        const centerX = chartArea.left + chartArea.width / 2;
        const centerY = chartArea.top + chartArea.height / 2;

        const dataset = chart.getDatasetMeta(0).data;
        if (!dataset.length) return;

        const radius = dataset[0].outerRadius;

        ctx.save();
        ctx.strokeStyle = '#635f39';  
        ctx.lineWidth = 2.5;
        ctx.font = 'bold 14px Montserrat';  
        ctx.fillStyle = '#635f39';          
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

  const cuts = [
  { percent: 0, label: '' },
  { percent: 0.25, label: '' },
  { percent: 0.5, label: '' },
  { percent: 0.75, label: '' }
];

        cuts.forEach(cut => {
    const angle = -0.5 * Math.PI + 2 * Math.PI * cut.percent;
    const shrinkRatio = 1; 

            // Draw line
         const innerGap = 100;       // length of the hidden center part
const lineLength = radius - 5; // full outer length (adjust as needed)

let x, y;

switch (cut.label) {
    case '0%':
        x = centerX + 5;
        y = centerY - radius - 5;
        break;
    case '25%':
        x = centerX + radius + 15;
        y = centerY ;
        break;
    case '50%':
        x = centerX ;
        y = centerY + radius + 10;
        break;
    case '75%':
        x = centerX - radius - 15;
        y = centerY;
        break;
    default:
        x = centerX;
        y = centerY;
}

ctx.fillText(cut.label, x, y);

// 1. Draw outer segment
const x1 = centerX + (innerGap + 10) * Math.cos(angle);
const y1 = centerY + (innerGap + 10) * Math.sin(angle);
const x2 = centerX + lineLength * Math.cos(angle);
const y2 = centerY + lineLength * Math.sin(angle);

ctx.beginPath();
ctx.moveTo(x1, y1);
ctx.lineTo(x2, y2);
ctx.stroke();

// 2. Draw opposite outer segment (for other side)
const x3 = centerX - (innerGap + 10) * Math.cos(angle);
const y3 = centerY - (innerGap + 10) * Math.sin(angle);
const x4 = centerX - lineLength * Math.cos(angle);
const y4 = centerY - lineLength * Math.sin(angle);

ctx.beginPath();
ctx.moveTo(x3, y3);
ctx.lineTo(x4, y4);
ctx.stroke();
            // Draw label slightly beyond the line
           const labelRadius = radius - 1; 
const labelOffset = 15

        });

        ctx.restore();
    }
}
        ]

    });
    console.log("Chart object created:", chart); // Check if chart object is made
}
    

        function calculateActiveSegments(value, values, colors) {
            let data = [];
            let bgColors = [];
            let accumulated = 0;
            for (let i = 0; i < values.length; i++) {
                if (accumulated + values[i] <= value) {
                    data.push(values[i]);
                    bgColors.push(colors[i]);
                    accumulated += values[i];
                } else {
                    let remaining = value - accumulated;
                    if (remaining > 0) {
                        data.push(remaining);
                        bgColors.push(colors[i]);
                    }
                    break;
                }
            }
            if (value < 100) {
                data.push(100 - value);
                bgColors.push("rgba(0,0,0,0)");
            }
            return { data, bgColors };
        }

        function smoothUpdate(targetValue) {
            console.log("smoothUpdate called with targetValue:", targetValue); // Check if function is called
            const entLegends = document.querySelectorAll('#ent-legend > div');
            const netLegends = document.querySelectorAll('#net-legend > div');

            const entValue = Math.min(targetValue, 100);
            const netValue = Math.max(0, targetValue - 100);

            const ent = calculateActiveSegments(entValue, dataValues.entrepreneurial, dataValues.entColors);
            const net = calculateActiveSegments(netValue, dataValues.networking, dataValues.netColors);

            console.log("Data for 'ent' segment:", JSON.stringify(ent));
            console.log("Data for 'net' segment:", JSON.stringify(net));

            if (!chart || !chart.data || !chart.data.datasets || !chart.data.datasets[0] || !chart.data.datasets[1]) {
        console.error("Chart object or its datasets are not properly initialized for smoothUpdate!");
        return;
    }
            
            chart.data.datasets[0].data = ent.data;
            chart.data.datasets[0].backgroundColor = ent.bgColors;
            chart.data.datasets[1].data = net.data;
            chart.data.datasets[1].backgroundColor = net.bgColors;
            chart.update();

            console.log("Chart data before update call:", JSON.parse(JSON.stringify(chart.data)));
            if (chart.data.labels.length === 0 && dataValues.labels && dataValues.labels.length > 0) {
        chart.data.labels = dataValues.labels;
    }
            chart.update();
            console.log("chart.update() called");

            // Update legend opacity (this part is fine)
    const entLegendEl = document.getElementById('ent-legend');
    const netLegendEl = document.getElementById('net-legend');
    if (entLegendEl && netLegendEl) {
        if (targetValue === 0) {
            entLegendEl.style.opacity = '0.3';
            netLegendEl.style.opacity = '0.3';
        } else if (targetValue > 0 && targetValue <= 100) {
            entLegendEl.style.opacity = '1';
            netLegendEl.style.opacity = '0.3';
        } else {
            entLegendEl.style.opacity = '1';
            netLegendEl.style.opacity = '1';
        }
    }
}
        

        function setupScrollResponsive() {
            let scrollQueue = 0;
            let animating = false;
            window.addEventListener('wheel', (e) => {
                const delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
                const maxQueue = 200;
                scrollQueue = Math.max(-maxQueue, Math.min(maxQueue, scrollQueue + delta));
                if (!animating) animateScroll();
            }, { passive: false });

            function animateScroll() {
                animating = true;
                let step = 0;
                let velocity = scrollQueue / 10;
                const steps = Math.max(30, Math.min(100, Math.round(Math.abs(velocity * 3))));
                const startValue = currentValue;
                const targetValue = Math.max(0, Math.min(maxValue * 2, startValue + scrollQueue));
                scrollQueue = 0;
                currentValue = targetValue;

                function frame() {
                    step++;
                    const value = startValue + (targetValue - startValue) * (step / steps);
                    smoothUpdate(value);
                    updateSingleBoxByThreshold(value);
                    if (step < steps) {
                        requestAnimationFrame(frame);
                    } else if (scrollQueue !== 0) {
                        animateScroll();
                    } else {
                        animating = false;
                    }
                }

                requestAnimationFrame(frame);
            }
        }

function updateSingleBoxByThreshold(value) {
    const scrollBoxesContainer = document.getElementById('scroll-boxes');
    if (!scrollBoxesContainer) return;

    const leftBoxes = document.querySelectorAll('#scroll-boxes .scroll-box.left');
    const rightBoxes = document.querySelectorAll('#scroll-boxes .scroll-box.right');
    const thresholds = [0, 17.23, 45.05, 73.4, 100, 117, 144.4, 172, 200.01]; // Added 0.01 to last for < check

    const tab3 = document.getElementById('tab3-scroll-section');
    const containerH = tab3.offsetHeight;
    const startY = 300 ;// Start at the corner
    const endY = -300; 


    leftBoxes.forEach((box, i) => {
        const rangeStart = thresholds[i];
        const rangeEnd = thresholds[i + 1];

         console.log(`Left Box ${i}: value=${value.toFixed(1)}, rs=${rangeStart}, re=${rangeEnd}, op=${box.style.opacity}`);

        if (value >= rangeStart && value < rangeEnd) {
        const segmentDuration = rangeEnd - rangeStart;
        const progressInSegment = segmentDuration > 0 ? Math.min(Math.max((value - rangeStart) / segmentDuration, 0), 1) : 1;
        
        // Animate translateY from startY to endY
        const translateY = startY - (startY - endY) * progressInSegment;
        
        box.style.transform = `translateY(${translateY}px)`;
        box.style.opacity = 1;
    } else {
        if (value < rangeStart) {
            box.style.transform = `translateY(${startY}px)`; // Reset to start pos
            box.style.opacity = 0;
        } else { value >= rangeEnd
             box.style.transform = `translateY(${endY - 50}px)`; // Move past end pos
            box.style.opacity = 0; // Disappear after passing
        }
    }
    });

    rightBoxes.forEach((box, i) => {
        const rangeStart = thresholds[i + 4];
        const rangeEnd = thresholds[i + 5];

         console.log(`Right Box ${i}: value=${value.toFixed(1)}, rs=${rangeStart}, re=${rangeEnd}, op=${box.style.opacity}`);

        if (value >= rangeStart && value < rangeEnd) {
        const segmentDuration = rangeEnd - rangeStart;
        const progressInSegment = segmentDuration > 0 ? Math.min(Math.max((value - rangeStart) / segmentDuration, 0), 1) : 1;
        
        // Animate translateY from startY to endY
        const translateY = startY - (startY - endY) * progressInSegment;
        
        box.style.transform = `translateY(${translateY}px)`;
        box.style.opacity = 1;
    } else {
        if (value < rangeStart) {
            box.style.transform = `translateY(${startY}px)`; // Reset to start pos
            box.style.opacity = 0;
        } else {  value >= rangeEnd
             box.style.transform = `translateY(${endY - 50}px)`; // Move past end pos
            box.style.opacity = 0; // Disappear after passing
        }
    }
    });
}

        function setupScrollTriggerAnimations() {
    console.log("Tab3: setupScrollTriggerAnimations called");
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        console.error("Tab3: GSAP or ScrollTrigger is not loaded!");
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Make sure the #chart-container (or a dedicated parent for Tab3 section) has enough height
    // to allow for a decent scroll duration. You might need to set min-height on it via CSS.
    // For example, if you want the animation to take 3 screen heights to complete:
    // document.getElementById('chart-container').style.minHeight = '300vh'; // Or a wrapper for tab3
    
    ScrollTrigger.create({
        trigger: "#tab3-scroll-section", // Or a wrapper specific to Tab 3 content
        pin: true,
        start: "top top", // When the top of #chart-container hits the top of the viewport
        end: () => "+=" + (window.innerHeight * 10),
        scrub: 0.3, // Smooth scrubbing (1 second to catch up)
        markers: false, // KEEP THIS FOR DEBUGGING for now
        anticipatePin: 1, // Helps prevent jitter with pinning\
        pinSpacing: true, 
        onUpdate: (self) => {
            const newScrollValue = self.progress * MAX_SCROLL_VALUE;
            smoothUpdate(newScrollValue);
            updateSingleBoxByThreshold(newScrollValue);
        },
        onEnter: () => {
            console.log("Tab3: Entered scroll trigger zone");
            smoothUpdate(0.3);
            updateSingleBoxByThreshold(0);
        },
        onLeaveBack: () => {
            console.log("Tab3: Left scroll trigger zone (scrolling up)");
            smoothUpdate(0.3);
            updateSingleBoxByThreshold(0);
        }
    });

    // Initialize the scroll boxes to their starting positions (hidden at the bottom)
    document.querySelectorAll('#scroll-boxes .scroll-box').forEach(box => {
        box.style.transform = `translateY(${window.innerHeight}px)`;
        box.style.opacity = 0;
    });
    console.log("Tab3: ScrollTrigger for #tab3-scroll-section created.");
}


window.onload = async () => {
    console.log("Tab3: window.onload called");
    await fetchData();
    console.log("Tab3: fetchData completed. Current dataValues:", JSON.parse(JSON.stringify(dataValues)));
    buildChart();
    console.log("Tab3: buildChart completed. Donut chart object:", donutChart);

    if (dataValues.labels && dataValues.labels.length > 0) {
        buildLegend('ent-legend', 'Entrepreneurial Interest', dataValues.labels, dataValues.entColors, dataValues.entrepreneurial);
        buildLegend('net-legend', 'Networking Importance', dataValues.labels, dataValues.netColors, dataValues.networking);
        console.log("Tab3: Legends built.");
    } else {
        console.warn("Tab3: Skipping legend build, dataValues.labels not ready.");
    }

    // Initial state before scrolling
    smoothUpdate(0);
    updateSingleBoxByThreshold(0); // Initialize boxes based on value 0

    setupScrollTriggerAnimations(); // NEW: Setup GSAP ScrollTrigger
    console.log("Tab3: window.onload finished, ScrollTrigger setup.");
};
