/**
 * Spore Particle Canvas Animation & Interactive Ambient Field
 * Dynamic theme adaptation: Crisp, rich floating particles in Light Mode;
 * Ethereal glowing luminescence in Dark Mode with constellation links.
 */
(function() {
  'use strict';

  let globalCanvas = null;
  let globalCtx = null;
  let globalParticles = [];
  let currentTheme = 'dark';

  const DARK_COLORS = ['#60A5FA', '#818CF8', '#A78BFA', '#C084FC', '#38BDF8', '#FFFFFF', '#93C5FD'];
  const LIGHT_COLORS = ['#4F46E5', '#6366F1', '#7C3AED', '#2563EB', '#0D9488', '#0284C7', '#8B5CF6'];

  function getActiveTheme() {
    return document.documentElement.getAttribute('data-landing-theme') ||
           document.documentElement.getAttribute('data-theme') ||
           document.body.getAttribute('data-landing-theme') ||
           document.body.getAttribute('data-theme') ||
           localStorage.getItem('landing_theme') ||
           localStorage.getItem('hrm_landing_theme') ||
           'dark';
  }

  class Particle {
    constructor(canvas, theme) {
      this.canvas = canvas;
      this.theme = theme;
      this.reset(true);
    }

    reset(initial = false) {
      const isLight = this.theme === 'light';
      const colors = isLight ? LIGHT_COLORS : DARK_COLORS;

      this.x = Math.random() * (this.canvas.width || window.innerWidth);
      this.y = initial 
        ? Math.random() * (this.canvas.height || 600) 
        : (this.canvas.height || 600) + Math.random() * 25;

      this.size = isLight 
        ? (Math.random() * 2.6 + 1.4) 
        : (Math.random() * 2.2 + 0.8);

      this.speedY = -(Math.random() * 0.5 + 0.18);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.wobble = Math.random() * 1.8;
      this.wobbleSpeed = Math.random() * 0.02 + 0.01;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = isLight 
        ? (Math.random() * 0.45 + 0.40) 
        : (Math.random() * 0.65 + 0.25);
    }

    updateTheme(newTheme) {
      this.theme = newTheme;
      const isLight = newTheme === 'light';
      const colors = isLight ? LIGHT_COLORS : DARK_COLORS;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.size = isLight 
        ? (Math.random() * 2.6 + 1.4) 
        : (Math.random() * 2.2 + 0.8);
      this.alpha = isLight 
        ? (Math.random() * 0.45 + 0.40) 
        : (Math.random() * 0.65 + 0.25);
    }

    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.y * this.wobbleSpeed) * this.wobble + this.speedX;

      const h = this.canvas.height || 600;
      const w = this.canvas.width || window.innerWidth;

      if (this.y < -20 || this.x < -30 || this.x > w + 30) {
        this.reset(false);
      }
    }

    draw(ctx) {
      const isLight = this.theme === 'light';
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = isLight ? 10 : 12;
      ctx.shadowColor = isLight ? 'rgba(79, 70, 229, 0.45)' : this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initSporeCanvas() {
    const canvasElements = document.querySelectorAll('.heroSporeCanvas');
    if (!canvasElements.length) return;

    currentTheme = getActiveTheme();

    canvasElements.forEach(canvas => {
      if (canvas._initialized) {
        resizeCanvas(canvas);
        return;
      }
      canvas._initialized = true;
      globalCanvas = canvas;

      const ctx = canvas.getContext('2d');
      globalCtx = ctx;

      function resize() {
        resizeCanvas(canvas);
      }
      resize();

      const particleCount = window.innerWidth < 768 ? 40 : 95;
      globalParticles = [];

      for (let i = 0; i < particleCount; i++) {
        globalParticles.push(new Particle(canvas, currentTheme));
      }

      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const isLight = currentTheme === 'light';

        // Draw dynamic connecting constellation filaments
        const maxDist = isLight ? 75 : 65;
        const lineBaseAlpha = isLight ? 0.26 : 0.18;
        const lineStroke = isLight ? 'rgba(79, 70, 229,' : 'rgba(129, 140, 248,';

        for (let i = 0; i < globalParticles.length; i++) {
          const p1 = globalParticles[i];
          for (let j = i + 1; j < globalParticles.length; j++) {
            const p2 = globalParticles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * lineBaseAlpha;
              ctx.save();
              ctx.strokeStyle = `${lineStroke} ${alpha})`;
              ctx.lineWidth = isLight ? 1.0 : 0.8;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // Draw and update particles
        globalParticles.forEach(p => {
          p.update();
          p.draw(ctx);
        });

        requestAnimationFrame(animate);
      }

      animate();

      window.addEventListener('resize', resize, { passive: true });
    });
  }

  function resizeCanvas(canvas) {
    const parent = canvas.closest('.landing-hero') || canvas.parentElement || document.body;
    canvas.width = parent.offsetWidth || window.innerWidth;
    canvas.height = parent.offsetHeight || 600;
  }

  function setTheme(theme) {
    currentTheme = theme;
    if (globalParticles && globalParticles.length) {
      globalParticles.forEach(p => p.updateTheme(theme));
    }
    if (globalCanvas) {
      resizeCanvas(globalCanvas);
    }
  }

  // Expose global interface
  window.LandingParticles = {
    init: initSporeCanvas,
    setTheme: setTheme
  };
  window.initSporeCanvas = initSporeCanvas;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSporeCanvas);
  } else {
    setTimeout(initSporeCanvas, 60);
  }
})();
