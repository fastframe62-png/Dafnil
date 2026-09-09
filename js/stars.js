/**
 * Atmosphere Engine (Dynamic Weather & Cosmic Effects)
 * Cycles through:
 * 1. Meteor Jatuh (Shooting Stars & Cosmic Galaxy)
 * 2. Hujan Badai (Rainstorm with gentle ambient lightning flashes)
 * 3. Salju (Soft drifting snow with gentle swaying)
 * Automatically transitions every 10 seconds.
 * Strictly contained within the mobile screen canvas.
 */

class AtmosphereEngine {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    if (!this.canvas || !this.container) return;

    this.ctx = this.canvas.getContext('2d');
    this.animationFrameId = null;

    // Modes: 'meteor', 'rainstorm', 'snow'
    this.modes = ['meteor', 'rainstorm', 'snow'];
    this.currentModeIndex = 0;
    this.currentMode = this.modes[0];
    this.modeLabels = {
      meteor: '🌠 Meteor',
      rainstorm: '⛈️ Badai',
      snow: '❄️ Salju'
    };

    // Cycle duration: 10 seconds per mode
    this.cycleInterval = 10000;
    this.lastSwitchTime = Date.now();

    // Elements pools
    this.stars = [];
    this.meteors = [];
    this.raindrops = [];
    this.snowflakes = [];
    this.lightningAlpha = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.initPools();
    this.animate();

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.initPools();
    });

    // Auto Cycle every 10s
    setInterval(() => {
      this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
      this.currentMode = this.modes[this.currentModeIndex];
      this.onModeChange(this.currentMode);
    }, this.cycleInterval);
  }

  onModeChange(mode) {
    const badge = document.getElementById('atmosphere-badge');
    if (badge) {
      badge.textContent = this.modeLabels[mode] || mode;
      badge.classList.add('pulse');
      setTimeout(() => badge.classList.remove('pulse'), 1000);
    }
  }

  setMode(mode) {
    if (this.modes.includes(mode)) {
      this.currentMode = mode;
      this.currentModeIndex = this.modes.indexOf(mode);
      this.onModeChange(mode);
    }
  }

  resizeCanvas() {
    this.width = window.innerWidth || (this.container ? this.container.getBoundingClientRect().width : 390);
    this.height = window.innerHeight || (this.container ? this.container.getBoundingClientRect().height : 844);

    this.canvas.width = this.width * (window.devicePixelRatio || 1);
    this.canvas.height = this.height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  initPools() {
    // Responsive particle density based on screen area
    const area = this.width * this.height;
    const density = Math.min(Math.max(area / (400 * 850), 0.8), 2.5);

    // 1. Stars for Meteor mode
    this.stars = [];
    const starCount = Math.floor(35 * density);
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
        speedY: -(Math.random() * 0.15 + 0.05),
        colorHue: Math.random() < 0.3 ? 210 : (Math.random() < 0.6 ? 260 : 45)
      });
    }

    // Meteors
    this.meteors = [];

    // 2. Raindrops for Rainstorm mode
    this.raindrops = [];
    const rainCount = Math.floor(70 * density);
    for (let i = 0; i < rainCount; i++) {
      this.raindrops.push({
        x: Math.random() * (this.width + 100) - 50,
        y: Math.random() * this.height,
        length: Math.random() * 16 + 10,
        speedY: Math.random() * 12 + 10,
        speedX: -2.5, // Angled rain
        alpha: Math.random() * 0.35 + 0.15,
        thickness: Math.random() * 1.2 + 0.6
      });
    }

    // 3. Snowflakes for Snow mode
    this.snowflakes = [];
    const snowCount = Math.floor(45 * density);
    for (let i = 0; i < snowCount; i++) {
      this.snowflakes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.8 + 0.4,
        swaySpeed: Math.random() * 0.03 + 0.01,
        swayAngle: Math.random() * Math.PI * 2,
        swayRadius: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.6 + 0.3
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentMode === 'meteor') {
      this.renderMeteorMode();
    } else if (this.currentMode === 'rainstorm') {
      this.renderRainstormMode();
    } else if (this.currentMode === 'snow') {
      this.renderSnowMode();
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  // ==========================================
  // 1. METEOR MODE
  // ==========================================
  renderMeteorMode() {
    // Draw background stars
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 0.8 || star.alpha < 0.15) star.twinkleSpeed = -star.twinkleSpeed;
      star.y += star.speedY;
      if (star.y < -10) {
        star.y = this.height + 10;
        star.x = Math.random() * this.width;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

      const glowRadius = star.radius * 3;
      const gradient = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);
      gradient.addColorStop(0, `hsla(${star.colorHue}, 100%, 90%, ${star.alpha})`);
      gradient.addColorStop(1, `hsla(${star.colorHue}, 80%, 60%, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.restore();
    }

    // Spawn Meteor periodically
    if (Math.random() < 0.035 && this.meteors.length < 3) {
      this.meteors.push({
        x: Math.random() * (this.width - 50) + 50,
        y: Math.random() * (this.height * 0.4),
        length: Math.random() * 80 + 60,
        speed: Math.random() * 7 + 9,
        angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), // ~45 deg
        thickness: Math.random() * 2 + 1,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }

    // Update & Draw Meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      const tailX = m.x - Math.cos(m.angle) * m.length;
      const tailY = m.y - Math.sin(m.angle) * m.length;

      this.ctx.save();
      const grad = this.ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.7, `rgba(129, 140, 248, ${m.alpha * 0.6})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${m.alpha})`);

      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = m.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(m.x, m.y);
      this.ctx.stroke();

      // Glowing head
      this.ctx.beginPath();
      this.ctx.arc(m.x, m.y, m.thickness * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#6366f1';
      this.ctx.fill();
      this.ctx.restore();

      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.alpha -= m.decay;

      if (m.alpha <= 0 || m.x > this.width + 50 || m.y > this.height + 50) {
        this.meteors.splice(i, 1);
      }
    }
  }

  // ==========================================
  // 2. RAINSTORM MODE
  // ==========================================
  renderRainstormMode() {
    // Occasional lightning flash (very gentle, subtle)
    if (Math.random() < 0.008 && this.lightningAlpha <= 0) {
      this.lightningAlpha = Math.random() * 0.12 + 0.06;
    }

    if (this.lightningAlpha > 0) {
      this.ctx.fillStyle = `rgba(147, 197, 253, ${this.lightningAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.lightningAlpha -= 0.015;
    }

    // Draw Falling Raindrops
    this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
    this.ctx.lineCap = 'round';

    for (let i = 0; i < this.raindrops.length; i++) {
      const drop = this.raindrops[i];
      this.ctx.save();
      this.ctx.lineWidth = drop.thickness;
      this.ctx.strokeStyle = `rgba(186, 230, 253, ${drop.alpha})`;
      this.ctx.beginPath();
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x + drop.speedX * (drop.length / 10), drop.y + drop.length);
      this.ctx.stroke();
      this.ctx.restore();

      drop.x += drop.speedX;
      drop.y += drop.speedY;

      if (drop.y > this.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * (this.width + 100) - 50;
      }
      if (drop.x < -60) {
        drop.x = this.width + 20;
      }
    }
  }

  // ==========================================
  // 3. SNOW MODE
  // ==========================================
  renderSnowMode() {
    for (let i = 0; i < this.snowflakes.length; i++) {
      const flake = this.snowflakes[i];
      flake.swayAngle += flake.swaySpeed;
      flake.x += Math.sin(flake.swayAngle) * flake.swayRadius;
      flake.y += flake.speedY;

      if (flake.y > this.height + 10) {
        flake.y = -10;
        flake.x = Math.random() * this.width;
      }

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

      const glow = this.ctx.createRadialGradient(
        flake.x, flake.y, 0,
        flake.x, flake.y, flake.radius * 2
      );
      glow.addColorStop(0, `rgba(255, 255, 255, ${flake.alpha})`);
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Retain backward compatibility with StarfieldEngine name
window.AtmosphereEngine = AtmosphereEngine;
window.StarfieldEngine = AtmosphereEngine;
