console.log("🔥 script0.js loaded", gsap, ScrollTrigger);
gsap.registerPlugin(ScrollTrigger);

// Fade out the background image
gsap.to(".bg-img", {
  opacity: 0,
  scrollTrigger: {
    trigger: ".intro",
    start: "bottom 80%",
    end: "+=500",
    scrub: true
  }
});

// Zoom out the text illustration
gsap.to(".text-img", {
  scale: 0.9,
  opacity: 1,
  scrollTrigger: {
    trigger: ".intro",
    start: "top top",
    end: "+=500",
    scrub: true
  }
});

// --- Horizontal Scroll Timeline Animation ---
const timeline = document.querySelector('.timeline');
let stages = Array.from(document.querySelectorAll('.stage'));
let timelineInner = document.querySelector('.timeline-inner');

// Set timelineInner width dynamically
if (timelineInner) {
  timelineInner.style.width = `${stages.length * 100}vw`;
}

// Pin the timeline and animate horizontal scroll
const scrollAnim = ScrollTrigger.create({
  trigger: timeline,
  start: 'top top',
  end: () => `+=${window.innerWidth * (stages.length - 1)}`,
  pin: true,  
  scrub: true,
  anticipatePin: 1,
  onUpdate: self => {
    const progress = self.progress;
    if (timelineInner) {
      timelineInner.style.transform = `translateX(-${progress * (stages.length - 1) * 100}vw)`;
    }
  }
});

// Ensure all group and girl illustrations are visible by default
stages.forEach((stage) => {
  const group = stage.querySelector('.illust.group');
  const girl = stage.querySelector('.illust.girl');

  if (group) {
    gsap.set(group, { display: 'block', opacity: 1 });
  }

  if (girl) {
    gsap.set(girl, { display: 'block', opacity: 1 });
  }
});

// Animate each stage's group and girl illustrations
stages.forEach((stage, i) => {
  const group = stage.querySelector('.illust.group');
  const girl = stage.querySelector('.illust.girl');

  if (group) {
    gsap.set(group, { opacity: 0 });
    gsap.to(group, {
      opacity: 1,
      scrollTrigger: {
        trigger: stage,
        start: 'left center',
        end: 'center center',
        scrub: true
      }
    });
  }

  if (girl) {
    if (i === 0) {
      gsap.set(girl, { opacity: 1 });
    } else {
      gsap.set(girl, { opacity: 0 });
      gsap.to(girl, {
        opacity: 1,
        scrollTrigger: {
          trigger: stage,
          start: 'center center',
          end: 'right center',
          scrub: true
        }
      });

      if (i > 0) {
        const prevStage = stages[i - 1];
        const prevGirl = prevStage.querySelector('.illust.girl');
        if (prevGirl) {
          gsap.to(prevGirl, {
            opacity: 0,
            scrollTrigger: {
              trigger: stage,
              start: 'left center',
              end: 'center center',
              scrub: true
            }
          });
        }
      }
    }
  }
});



