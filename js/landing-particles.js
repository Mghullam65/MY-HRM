/**
 * Spore Particle Canvas Animation (Automark 1.0.0 Style)
 * Renders elegant, organic floating luminescence particles
 */
(function() {
  'use strict';

  function initSporeCanvas() {
    const canvasElements = document.querySelectorAll('.heroSporeCanvas');
    if (!canvasElements.length) return;

    canvasElements.forEach(canvas => {
      if (canvas._initialized) return;
      canvas._initialized = true;

      const ctx = canvas.getContext('2d');
      function resize() {
        const parent = canvas.parentElement || document.body;
        canvas.width = parent.offsetWidth || window.innerWidth;
        canvas.height = parent.offsetHeight || 500;
      }
      resize();

      const particleColors = ['#FFFFFF', '#937AFF', '#C4B5FD', '#818CF8', '#A78BFA'];
      let particleCount = window.innerWidth < 768 ? 35 : 90;
      const particles = [];

      class Particle {
        constructor() {
          this.reset(true);
        }

        reset(initial = false) {
          this.x = Math.random() * canvas.width;
          this.y = initial ? Math.random() * canvas.height : canvas.height + Math.random() * 20;
          this.size = Math.random() * 2.2 + 0.6;
          this.speedY = -(Math.random() * 0.45 + 0.15);
          this.speedX = (Math.random() - 0.5) * 0.25;
          this.wobble = Math.random() * 1.5;
          this.wobbleSpeed = Math.random() * 0.02 + 0.01;
          this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
          this.alpha = Math.random() * 0.7 + 0.2;
        }

        update() {
          this.y += this.speedY;
          this.x += Math.sin(this.y * this.wobbleSpeed) * this.wobble + this.speedX;

          if (this.y < -15 || this.x < -20 || this.x > canvas.width + 20) {
            this.reset(false);
          }
        }

        draw() {
          ctx.save();
          ctx.globalAlpha = this.alpha;
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.update();
          p.draw();
        });
        requestAnimationFrame(animate);
      }

      animate();

      window.addEventListener('resize', () => {
        resize();
      });
    });
  }

  window.initSporeCanvas = initSporeCanvas;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSporeCanvas);
  } else {
    setTimeout(initSporeCanvas, 100);
  }
})();
