/**
 * SmartRide AI - Interactive Live Map & GPS Fleet Radar
 * High-performance HTML5 Canvas simulation rendering:
 * - Animated Cyber Grid & Road Network
 * - Real-time Cab Fleet visualization (SmartRide EV, Uber, Ola, Rapido)
 * - User GPS Blue Dot with animated radar wave ring
 * - Route Polyline connecting Pickup to Dropoff
 * - Interactive click-to-set pickup/dropoff
 */

export class FleetRadarMap {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = options;

    // Viewport & Map center (simulated GPS coordinates)
    this.center = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.radarAngle = 0;
    this.pulseRadius = 0;

    // Route points - Blue Pin positioned in dead-center of the frame
    this.pickup = { x: 0, y: 0, name: 'Current Location' };
    this.dropoff = { x: 160, y: -110, name: 'Tidel Park, OMR Tech Corridor' };

    // Nearby Simulated Fleet
    this.cabs = [
      { id: 'sr1', type: 'SmartRide EV', color: '#00D8FF', x: -60, y: 30, vx: 0.4, vy: -0.2, icon: '🚗', rating: 4.9 },
      { id: 'sr2', type: 'SmartRide Bike', color: '#00D8FF', x: 20, y: 80, vx: -0.5, vy: 0.3, icon: '🏍️', rating: 4.8 },
      { id: 'ub1', type: 'Uber Go', color: '#FFFFFF', x: 110, y: -40, vx: -0.3, vy: -0.4, icon: '🚗', rating: 4.7 },
      { id: 'ub2', type: 'Uber Auto', color: '#FFFFFF', x: -90, y: -70, vx: 0.2, vy: 0.3, icon: '🛺', rating: 4.6 },
      { id: 'ol1', type: 'Ola Prime', color: '#E0F838', x: 80, y: 110, vx: 0.3, vy: -0.3, icon: '🚗', rating: 4.8 },
      { id: 'rp1', type: 'Rapido Bike', color: '#FFDD00', x: -160, y: -30, vx: 0.6, vy: 0.4, icon: '🏍️', rating: 4.9 },
      { id: 'ny1', type: 'Namma Yatri', color: '#FF9900', x: 40, y: -100, vx: -0.2, vy: 0.5, icon: '🛺', rating: 4.7 },
    ];

    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse & Touch interactions
    this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) this.onPointerMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => (this.isDragging = false));

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', () => (this.isDragging = false));

    // Wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.6, Math.min(2.2, this.zoom * zoomFactor));
    }, { passive: false });

    // Click on canvas to pick dropoff or pickup
    this.canvas.addEventListener('click', (e) => {
      if (this.dragDist > 5) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - this.width / 2) / this.zoom - this.center.x;
      const clickY = (e.clientY - rect.top - this.height / 2) / this.zoom - this.center.y;
      this.setDropoff(clickX, clickY, `Point (${Math.round(clickX)}, ${Math.round(clickY)})`);
    });

    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : window.innerWidth;
    this.height = parent ? parent.clientHeight : 420;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  onPointerDown(x, y) {
    this.isDragging = true;
    this.lastMouse = { x, y };
    this.dragDist = 0;
  }

  onPointerMove(x, y) {
    const dx = x - this.lastMouse.x;
    const dy = y - this.lastMouse.y;
    this.dragDist += Math.abs(dx) + Math.abs(dy);
    this.center.x += dx / this.zoom;
    this.center.y += dy / this.zoom;
    this.lastMouse = { x, y };
  }

  setRoute(pickupName, dropoffName) {
    this.pickup.name = pickupName || 'Current Location';
    this.dropoff.name = dropoffName || 'Destination';

    // Generates deterministic route points based on names
    const hash = Math.abs((pickupName + dropoffName).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
    this.dropoff.x = 120 + (hash % 120);
    this.dropoff.y = -100 - ((hash >> 2) % 80);
    this.recenter();
  }

  setDropoff(x, y, name = 'Selected Point') {
    this.dropoff.x = x;
    this.dropoff.y = y;
    this.dropoff.name = name;
    if (this.options.onDestinationSelect) {
      this.options.onDestinationSelect(name);
    }
  }

  recenter() {
    this.center = { x: 0, y: 0 };
    this.zoom = 1.0;
  }

  zoomIn() {
    this.zoom = Math.min(2.2, this.zoom * 1.2);
  }

  zoomOut() {
    this.zoom = Math.max(0.6, this.zoom / 1.2);
  }

  updateFleet() {
    // Smooth Brownian wander for cabs inside bounds
    this.cabs.forEach((cab) => {
      cab.x += cab.vx;
      cab.y += cab.vy;

      if (cab.x > 300 || cab.x < -300) cab.vx *= -1;
      if (cab.y > 220 || cab.y < -220) cab.vy *= -1;

      // Slight steer change
      if (Math.random() < 0.02) {
        cab.vx += (Math.random() - 0.5) * 0.2;
        cab.vy += (Math.random() - 0.5) * 0.2;
        cab.vx = Math.max(-0.8, Math.min(0.8, cab.vx));
        cab.vy = Math.max(-0.8, Math.min(0.8, cab.vy));
      }
    });

    // Radar scan loop
    this.radarAngle = (this.radarAngle + 0.025) % (Math.PI * 2);
    this.pulseRadius = (this.pulseRadius + 0.8) % 70;
  }

  draw() {
    const { ctx, width, height, zoom } = this;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Center coordinate origin
    ctx.translate(width / 2 + this.center.x * zoom, height / 2 + this.center.y * zoom);
    ctx.scale(zoom, zoom);

    // 1. Draw Road Network / Futuristic City Grid
    this.drawCityGrid(ctx);

    // 2. Draw Simulated Active Route Polyline
    this.drawRoute(ctx);

    // 3. Draw Radar Sweep Area
    this.drawRadarSweep(ctx);

    // 4. Draw Nearby Fleet Vehicles
    this.drawFleet(ctx);

    // 5. Draw Pickup / User Live Location Beacon
    this.drawUserBeacon(ctx);

    // 6. Draw Destination Dropoff Pin
    this.drawDestinationPin(ctx);

    ctx.restore();
  }

  drawCityGrid(ctx) {
    const extent = 650;
    const gridSize = 60;

    // 1. Urban City Blocks / Neighborhood outlines (High contrast)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.2;

    for (let x = -extent; x <= extent; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -extent);
      ctx.lineTo(x, extent);
      ctx.stroke();
    }
    for (let y = -extent; y <= extent; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-extent, y);
      ctx.lineTo(extent, y);
      ctx.stroke();
    }

    // 2. City Arterial Roads (Bright, visible slate roads)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 3.5;
    [-180, -60, 60, 180].forEach(offset => {
      ctx.beginPath();
      ctx.moveTo(-extent, offset);
      ctx.lineTo(extent, offset);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offset, -extent);
      ctx.lineTo(offset, extent);
      ctx.stroke();
    });

    // 3. Major Expressways & Highways (Glowing Cyan & Indigo)
    const highways = [
      { y1: -70, y2: -70, name: '🛣️ Poonamallee High Road (NH48)' },
      { y1: 70, y2: 70, name: '🛣️ OMR IT Express Corridor' },
      { x1: -80, x2: -80, vertical: true, name: '🛣️ Inner Ring Road (100ft)' },
      { x1: 90, x2: 90, vertical: true, name: '🛣️ GST Road / Airport Link' }
    ];

    highways.forEach(hw => {
      ctx.save();
      // Outer neon road glow
      ctx.strokeStyle = 'rgba(0, 216, 255, 0.65)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      if (hw.vertical) {
        ctx.moveTo(hw.x1, -extent);
        ctx.lineTo(hw.x2, extent);
      } else {
        ctx.moveTo(-extent, hw.y1);
        ctx.lineTo(extent, hw.y2);
      }
      ctx.stroke();

      // Inner bright road core
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (hw.vertical) {
        ctx.moveTo(hw.x1, -extent);
        ctx.lineTo(hw.x2, extent);
      } else {
        ctx.moveTo(-extent, hw.y1);
        ctx.lineTo(extent, hw.y2);
      }
      ctx.stroke();

      // Highway text label
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.fillStyle = '#00D8FF';
      ctx.textAlign = 'left';
      if (hw.vertical) {
        ctx.save();
        ctx.translate(hw.x1 + 10, -180);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(hw.name, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(hw.name, -260, hw.y1 - 6);
      }
      ctx.restore();
    });
  }

  drawRoute(ctx) {
    const { pickup, dropoff } = this;

    // Glowing outer line
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 216, 255, 0.35)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([12, 6]);

    ctx.beginPath();
    ctx.moveTo(pickup.x, pickup.y);
    // Interpolated bezier corner for realistic road curve
    const midX = (pickup.x + dropoff.x) / 2 + 30;
    const midY = (pickup.y + dropoff.y) / 2 - 40;
    ctx.quadraticCurveTo(midX, midY, dropoff.x, dropoff.y);
    ctx.stroke();

    // Solid core line
    ctx.strokeStyle = '#00D8FF';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pickup.x, pickup.y);
    ctx.quadraticCurveTo(midX, midY, dropoff.x, dropoff.y);
    ctx.stroke();
    ctx.restore();
  }

  drawRadarSweep(ctx) {
    const { pickup, radarAngle } = this;
    ctx.save();
    ctx.translate(pickup.x, pickup.y);

    // Radar cone gradient
    const radius = 180;
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
    grad.addColorStop(0, 'rgba(0, 216, 255, 0.18)');
    grad.addColorStop(1, 'rgba(0, 216, 255, 0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, radarAngle - 0.4, radarAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Static distance rings
    ctx.strokeStyle = 'rgba(0, 216, 255, 0.15)';
    ctx.lineWidth = 1;
    [60, 120, 180].forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawFleet(ctx) {
    this.cabs.forEach((cab) => {
      ctx.save();
      ctx.translate(cab.x, cab.y);

      // Cab halo glow
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = cab.color === '#00D8FF' ? 'rgba(0, 216, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();

      // Cab background badge
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#0F1623';
      ctx.strokeStyle = cab.color;
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();

      // Vehicle emoji/icon
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cab.icon, 0, 1);

      // Provider label tag
      ctx.font = '10px Outfit, sans-serif';
      ctx.fillStyle = '#F1F5F9';
      ctx.fillText(cab.type, 0, 20);

      ctx.restore();
    });
  }

  drawUserBeacon(ctx) {
    const { pickup, pulseRadius } = this;
    ctx.save();
    ctx.translate(pickup.x, pickup.y);

    // 1. Dual-wave animated expanding radar pulse waves
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 216, 255, ${Math.max(0, 1 - pulseRadius / 70)})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const secondPulse = (pulseRadius + 35) % 70;
    ctx.beginPath();
    ctx.arc(0, 0, secondPulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 216, 255, ${Math.max(0, 0.7 - secondPulse / 70)})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 2. High-visibility semi-transparent accuracy aura
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 216, 255, 0.28)';
    ctx.fill();

    // 3. Solid center GPS blue pin / dot with bold white border
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#00D8FF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00D8FF';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // 4. Center Blue Pin Label Badge
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = '#00D8FF';
    ctx.textAlign = 'center';
    ctx.fillText('📍 CURRENT LOCATION (GPS)', 0, -22);

    ctx.restore();
  }

  drawDestinationPin(ctx) {
    const { dropoff } = this;
    ctx.save();
    ctx.translate(dropoff.x, dropoff.y);

    // Glowing dropoff pulse
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fill();

    // Pin core
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Dropoff label
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#EF4444';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 DESTINATION', 0, -16);

    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(dropoff.name.length > 20 ? dropoff.name.slice(0, 18) + '...' : dropoff.name, 0, 22);

    ctx.restore();
  }

  animate() {
    this.updateFleet();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
