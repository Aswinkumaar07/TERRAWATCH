import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════ ZONE DATA ═══════════════════ */
const ZONES_LIST = [
  {
    id: "jharkhand", name: "Jharkhand", sector: "Sector 7 — Dhanbad Mining Belt",
    coords: "23.748°N · 85.341°E", lat: 23.748, lng: 85.341, defProx: "2.3 km", riskLevel: "HIGH",
    car: 0.31, ndvi: 0.24, terrain: 16, moisture: 68, seismic: 2.4,
    carTrend: [0.78, 0.75, 0.71, 0.68, 0.61, 0.54, 0.48, 0.42, 0.39, 0.35, 0.33, 0.31],
    ndviTrend: [0.65, 0.62, 0.58, 0.53, 0.49, 0.44, 0.40, 0.36, 0.32, 0.28, 0.26, 0.24],
    moistTrend: [50, 55, 60, 62, 65, 64, 66, 68, 67, 68, 69, 68],
    seismicTrend: [0.5, 0.8, 1.2, 1.5, 1.0, 2.0, 1.8, 2.2, 2.5, 2.1, 2.3, 2.4],
    blobs: [{ x: 0.38, y: 0.40, r: 0.22, c: [217, 48, 37] }, { x: 0.62, y: 0.35, r: 0.14, c: [242, 153, 0] }, { x: 0.70, y: 0.65, r: 0.16, c: [200, 60, 30] }, { x: 0.25, y: 0.60, r: 0.10, c: [27, 107, 58] }],
    alerts: [
      { time: "14:32:01", msg: "Seismic spike 2.4R — Zone 7A", level: "high" },
      { time: "14:28:45", msg: "CAR confirmed critical: 0.31", level: "high" },
      { time: "14:21:12", msg: "IoT Sensor-07 moisture critical", level: "med" },
      { time: "14:15:33", msg: "NDVI threshold breached: 0.24", level: "med" },
      { time: "14:08:07", msg: "Alert dispatched to MOEF", level: "low" }
    ]
  },
  {
    id: "odisha", name: "Odisha", sector: "Sector 3 — Sundargarh Iron Belt",
    coords: "21.932°N · 84.127°E", lat: 21.932, lng: 84.127, defProx: "5.1 km", riskLevel: "MEDIUM",
    car: 0.52, ndvi: 0.41, terrain: 38, moisture: 52, seismic: 1.2,
    carTrend: [0.82, 0.80, 0.78, 0.75, 0.72, 0.68, 0.65, 0.61, 0.58, 0.55, 0.53, 0.52],
    ndviTrend: [0.70, 0.68, 0.65, 0.62, 0.58, 0.55, 0.52, 0.49, 0.46, 0.44, 0.42, 0.41],
    moistTrend: [40, 42, 45, 48, 47, 50, 49, 52, 51, 53, 52, 52],
    seismicTrend: [0.2, 0.3, 0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 1.1, 1.0, 1.2, 1.2],
    blobs: [{ x: 0.45, y: 0.45, r: 0.18, c: [242, 153, 0] }, { x: 0.30, y: 0.55, r: 0.12, c: [242, 180, 0] }, { x: 0.65, y: 0.38, r: 0.10, c: [27, 107, 58] }],
    alerts: [
      { time: "13:55:12", msg: "Vegetation loss in grid B4", level: "med" },
      { time: "13:40:22", msg: "NDVI 72hr average: 0.41", level: "med" },
      { time: "13:28:09", msg: "IoT Sensor-03 readings nominal", level: "low" }
    ]
  },
  {
    id: "chhattisgarh", name: "Chhattisgarh", sector: "Sector 11 — Korba Coal Zone",
    coords: "22.358°N · 82.712°E", lat: 22.358, lng: 82.712, defProx: "8.7 km", riskLevel: "LOW",
    car: 0.67, ndvi: 0.58, terrain: 62, moisture: 44, seismic: 0.6,
    carTrend: [0.88, 0.87, 0.86, 0.85, 0.83, 0.81, 0.79, 0.76, 0.73, 0.70, 0.68, 0.67],
    ndviTrend: [0.78, 0.77, 0.75, 0.73, 0.71, 0.69, 0.67, 0.65, 0.63, 0.61, 0.59, 0.58],
    moistTrend: [30, 32, 35, 34, 38, 40, 39, 42, 41, 45, 43, 44],
    seismicTrend: [0.1, 0.1, 0.2, 0.1, 0.3, 0.2, 0.4, 0.3, 0.5, 0.4, 0.6, 0.6],
    blobs: [{ x: 0.50, y: 0.50, r: 0.14, c: [27, 107, 58] }, { x: 0.35, y: 0.40, r: 0.10, c: [60, 160, 90] }],
    alerts: [
      { time: "12:10:05", msg: "Routine scan complete — no anomalies", level: "low" },
      { time: "11:55:33", msg: "Carbon absorption within normal range", level: "low" }
    ]
  }
];

const RISK_COLORS = {
  HIGH: { bg: "#FEF2F2", text: "#D93025", border: "#FECACA", accent: "#D93025" },
  MEDIUM: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", accent: "#F29900" },
  LOW: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", accent: "#1B6B3A" }
};

const SHADOW = "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)";
const FONTS = { h: "'DM Sans',sans-serif", b: "'Inter',sans-serif", d: "'JetBrains Mono',monospace" };

const ALERT_POOL = [
  "Satellite sync complete", "Sensor grid recalibrating", "Minor seismic event detected",
  "UAV deployed to sector", "CAR index fluctuation", "Thermal anomaly detected",
  "Soil erosion pattern identified", "Vegetation recovery signal", "Ground station ping OK",
  "NDVI drop in sub-sector", "Mining vibration detected", "Water table shift logged"
];

/* ═══════════ UTILITY COMPONENTS ═══════════ */
const RiskBadge = ({ level }) => {
  const c = RISK_COLORS[level] || RISK_COLORS.LOW;
  return React.createElement('span', { style: { background: c.bg, color: c.text, border: "1px solid " + c.border, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: FONTS.b } }, level + " RISK");
};

/* ═══════════ ZONE MAP MARKERS ═══════════ */
const ZONE_MARKERS = {
  jharkhand: [
    { lat: 23.795, lng: 86.430, label: "Zone 7A", lvl: "HIGH", radius: 3000 },
    { lat: 23.680, lng: 86.500, label: "Zone 4B", lvl: "MED", radius: 2000 },
    { lat: 23.820, lng: 86.320, label: "Zone 2C", lvl: "LOW", radius: 1500 },
    { lat: 23.750, lng: 86.380, label: "Sensor-07", lvl: "HIGH", radius: 1000 },
    { lat: 23.710, lng: 86.460, label: "Sensor-12", lvl: "MED", radius: 800 }
  ],
  odisha: [
    { lat: 22.120, lng: 84.030, label: "Zone 3A", lvl: "MED", radius: 2500 },
    { lat: 22.050, lng: 84.150, label: "Zone 3B", lvl: "MED", radius: 2000 },
    { lat: 22.180, lng: 83.950, label: "Zone 3C", lvl: "LOW", radius: 1800 },
    { lat: 22.090, lng: 84.080, label: "Sensor-03", lvl: "LOW", radius: 800 }
  ],
  chhattisgarh: [
    { lat: 22.350, lng: 82.680, label: "Zone 11A", lvl: "LOW", radius: 2200 },
    { lat: 22.400, lng: 82.750, label: "Zone 11B", lvl: "LOW", radius: 1600 },
    { lat: 22.320, lng: 82.700, label: "Sensor-01", lvl: "LOW", radius: 800 }
  ]
};

/* ═══════════ MAP VIEW TILE CONFIGS ════════════════════════════════════════ */
const MAP_VIEWS = {
  terrain: {
    label: "Terrain", icon: "🏔️",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    maxZoom: 17,
    filter: ""
  },
  satellite: {
    label: "Satellite", icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    filter: ""
  },
  street: {
    label: "Street", icon: "🗺️",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    filter: ""
  },
  night: {
    label: "Night", icon: "🌙",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    filter: "invert(100%) hue-rotate(180deg) brightness(0.9) saturate(0.8)"
  }
};

/* ═══════════ TERRAIN MAP ═══════════ */
const TerrainMap = ({ zone, mapView = "terrain", showOverlays = true, showLabels = true, overlayOpacity = 0.35 }) => {
  const MAP_H = 400;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const overlayLayersRef = useRef([]);
  const mountedRef = useRef(true);  // guard against setState on unmounted component
  const [transitioning, setTransitioning] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const prevZoneIdRef = useRef(null);

  // ── ONE-TIME initialization on mount ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (!window.L) return;
    const L = window.L;
    const el = mapRef.current;
    if (!el) return;

    const lat = typeof zone.lat === 'number' ? zone.lat : 23.748;
    const lng = typeof zone.lng === 'number' ? zone.lng : 85.341;

    // Clear any stale Leaflet instance (React StrictMode double-mount)
    if (mapInstanceRef.current) {
      try { mapInstanceRef.current.remove(); } catch (e) { }
      mapInstanceRef.current = null;
    }
    if (el._leaflet_id) delete el._leaflet_id;
    el.innerHTML = '';

    const view = MAP_VIEWS[mapView] || MAP_VIEWS.terrain;
    let ro;
    try {
      const map = L.map(el, {
        center: [lat, lng], zoom: 10,
        zoomControl: true, attributionControl: false, scrollWheelZoom: true
      });
      L.tileLayer(view.url, { maxZoom: view.maxZoom }).addTo(map);
      tileLayerRef.current = map._layers[Object.keys(map._layers)[0]] || null;
      mapInstanceRef.current = map;
      prevZoneIdRef.current = zone.id;

      ro = new ResizeObserver(() => { try { map.invalidateSize(); } catch (e) { } });
      ro.observe(el);
      // Only set mapReady if component is still mounted
      setTimeout(() => {
        if (!mountedRef.current) return;
        try { map.invalidateSize(); } catch (e) { }
        if (mountedRef.current) setMapReady(true);
      }, 500);
    } catch (e) {
      console.error('[TerrainMap] init error:', e);
    }

    return () => {
      mountedRef.current = false;
      if (ro) ro.disconnect();
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) { }
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Zone change: flyTo + transition ──────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mountedRef.current) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    if (prevZoneIdRef.current && prevZoneIdRef.current !== zone.id) {
      if (mountedRef.current) setTransitioning(true);
      setTimeout(() => { if (mountedRef.current) setTransitioning(false); }, 700);
    }
    prevZoneIdRef.current = zone.id;
    try {
      const markers = ZONE_MARKERS[zone.id] || [];
      if (markers.length > 0) {
        // Build a LatLngBounds from all sensor positions and fit the map to it
        const bounds = window.L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true, duration: 1.0 });
      } else {
        map.flyTo([zone.lat, zone.lng], 12, { animate: true, duration: 1.0 });
      }
    } catch (e) { }
    rebuildOverlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone.id, mapReady]);


  // ── Tile layer swap on view change ────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    // Remove all existing tile layers
    map.eachLayer(layer => { if (layer instanceof L.TileLayer) map.removeLayer(layer); });
    const view = MAP_VIEWS[mapView] || MAP_VIEWS.terrain;
    L.tileLayer(view.url, { maxZoom: view.maxZoom }).addTo(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapView, mapReady]);

  // ── Overlay rebuild ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    rebuildOverlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOverlays, showLabels, overlayOpacity, mapReady]);

  function rebuildOverlays() {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    overlayLayersRef.current.forEach(l => { try { map.removeLayer(l); } catch (e) { } });
    overlayLayersRef.current = [];
    if (!showOverlays) return;
    const markers = ZONE_MARKERS[zone.id] || [];
    markers.forEach(m => {
      const color = m.lvl === "HIGH" ? "#D93025" : m.lvl === "MED" ? "#F29900" : "#1B6B3A";
      try {
        const circle = L.circle([m.lat, m.lng], {
          radius: m.radius, color, weight: 2, fillColor: color, fillOpacity: overlayOpacity,
          dashArray: m.lvl === "LOW" ? "5,5" : null
        }).addTo(map).bindPopup(`<div style="font-family:Inter,sans-serif;padding:4px"><b style="color:${color}">${m.label}</b><br><span style="font-size:11px;color:#666">Risk: ${m.lvl} · ${(m.radius / 1000).toFixed(1)}km</span></div>`);
        overlayLayersRef.current.push(circle);
        if (showLabels) {
          const dot = L.circleMarker([m.lat, m.lng], { radius: 5, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
            .addTo(map).bindTooltip(m.label, { permanent: true, direction: 'right', offset: [8, 0], className: 'zone-label' });
          overlayLayersRef.current.push(dot);
        }
      } catch (e) { }
    });
    ZONES_LIST.forEach(z => {
      if (z.id === zone.id) return;
      const rc = z.riskLevel === "HIGH" ? "#D93025" : z.riskLevel === "MEDIUM" ? "#F29900" : "#1B6B3A";
      try {
        const dot = L.circleMarker([z.lat, z.lng], { radius: 4, color: rc, weight: 1, fillColor: rc, fillOpacity: 0.5 })
          .addTo(map).bindTooltip(z.name, { direction: 'right', offset: [6, 0] });
        overlayLayersRef.current.push(dot);
      } catch (e) { }
    });
  }

  const curView = MAP_VIEWS[mapView] || MAP_VIEWS.terrain;
  return React.createElement('div', { style: { position: "relative", width: "100%", height: MAP_H, borderRadius: 8, overflow: "hidden" } },
    React.createElement('style', null, `
      .zone-label { background: rgba(0,0,0,0.75) !important; color: #fff !important; border: none !important; border-radius: 4px !important; padding: 2px 6px !important; font-size: 10px !important; font-family: 'JetBrains Mono',monospace !important; }
      .zone-label::before { border: none !important; }
      .leaflet-control-zoom a { background: rgba(0,0,0,0.7) !important; color: #fff !important; border-color: rgba(255,255,255,0.2) !important; }
      @keyframes zFade { from { opacity:0; } to { opacity:1; } }
    `),
    curView.filter && React.createElement('style', null, `.leaflet-tile-pane { filter: ${curView.filter}; }`),
    transitioning && React.createElement('div', {
      style: { position: "absolute", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", animation: "zFade 0.2s ease" }
    }, React.createElement('span', { style: { color: "#fff", fontFamily: FONTS.h, fontSize: 20, fontWeight: 700 } }, "📍 " + zone.name)),
    React.createElement('div', { ref: mapRef, style: { width: "100%", height: MAP_H } }),
    React.createElement('div', { style: { position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#9AA5B4", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontFamily: FONTS.d, zIndex: 1000, pointerEvents: "none" } }, zone.coords),
    React.createElement('div', { style: { position: "absolute", bottom: 8, left: 50, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: 4, zIndex: 1000, pointerEvents: "none" } },
      React.createElement('span', { style: { fontSize: 10, color: "#16A34A", fontFamily: FONTS.d } }, "LOW"),
      React.createElement('div', { style: { width: 60, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#1B6B3A,#F29900,#D93025)" } }),
      React.createElement('span', { style: { fontSize: 10, color: "#D93025", fontFamily: FONTS.d } }, "HIGH")
    )
  );
};


/* ═══════════ RISK GAUGE ═══════════ */



const RiskGauge = ({ zone }) => {
  const ref = useRef(null);
  const animRef = useRef({ val: 0, frame: null });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const w = 220, h = 130;
    canvas.width = w * 2; canvas.height = h * 2; // retina display
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.scale(2, 2);

    const cx = w / 2, cy = h - 20, rad = 90;
    const target = zone.riskLevel === "HIGH" ? 82 : zone.riskLevel === "MEDIUM" ? 54 : 23;
    let startVal = animRef.current.val;
    let startTime = performance.now();

    const draw = (val) => {
      // background
      ctx.fillStyle = document.body.classList.contains('dark') ? "#1a1f2e" : "#fff";
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 14;
      ctx.lineCap = "round";

      // Gradient Arc
      const grad = ctx.createLinearGradient(cx - rad, cy, cx + rad, cy);
      grad.addColorStop(0, "#16A34A"); // Low
      grad.addColorStop(0.5, "#F59E0B"); // Medium
      grad.addColorStop(1, "#DC2626"); // High

      // track
      ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, Math.PI * 2);
      ctx.strokeStyle = document.body.classList.contains('dark') ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
      ctx.stroke();

      // fill
      ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, Math.PI + (val / 100) * Math.PI);
      ctx.strokeStyle = grad;
      ctx.stroke();

      // needle
      const angle = Math.PI + (val / 100) * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * (rad - 18), cy + Math.sin(angle) * (rad - 18));
      ctx.lineWidth = 3;
      ctx.strokeStyle = document.body.classList.contains('dark') ? "#fff" : "#1A1A2E";
      ctx.stroke();

      // center dot
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = document.body.classList.contains('dark') ? "#1A1A2E" : "#fff";
      ctx.fill();
      ctx.strokeStyle = document.body.classList.contains('dark') ? "#fff" : "#1A1A2E";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    const animate = (ts) => {
      const p = Math.min((ts - startTime) / 1000, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = startVal + (target - startVal) * eased;
      draw(v);
      animRef.current.val = v;
      if (p < 1) animRef.current.frame = requestAnimationFrame(animate);
    };

    if (animRef.current.frame) cancelAnimationFrame(animRef.current.frame);
    animRef.current.frame = requestAnimationFrame(animate);

    return () => { if (animRef.current.frame) cancelAnimationFrame(animRef.current.frame); };
  }, [zone.riskLevel]);

  const rc = RISK_COLORS[zone.riskLevel];
  const score = zone.riskLevel === "HIGH" ? 82 : zone.riskLevel === "MEDIUM" ? 54 : 23;
  return React.createElement('div', { style: { textAlign: "center", position: "relative" } },
    React.createElement('canvas', { ref, style: { display: "block", margin: "0 auto" } }),
    React.createElement('div', { className: "count-anim", style: { position: "absolute", bottom: 25, left: "50%", transform: "translateX(-50%)", fontFamily: FONTS.d, fontSize: 32, fontWeight: 700, color: rc.text } }, score),
    React.createElement('div', { style: { position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" } }, "AI Risk Score")
  );
};

/* ═══════════ LINE CHART ═══════════ */
const LineChart = ({ title, datasets, height = 140, labels }) => {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const drawChart = () => {
      const parent = wrapRef.current || canvas.parentElement;
      const w = (parent ? parent.offsetWidth : 0) || 500;
      const h = height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx || !datasets || datasets.length === 0) return;
      const pad = { t: 10, r: 10, b: 22, l: 36 };
      const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
      // grid
      ctx.strokeStyle = "#F1F5F9"; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const y = pad.t + ch / 4 * i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); }
      // all datasets min/max
      let allMin = Infinity, allMax = -Infinity;
      datasets.forEach(ds => { ds.data.forEach(v => { if (v < allMin) allMin = v; if (v > allMax) allMax = v; }); });
      const range = (allMax - allMin) || 1; allMin -= range * 0.1; allMax += range * 0.1;
      const totalRange = allMax - allMin;
      // y labels
      ctx.fillStyle = "#9AA5B4"; ctx.font = "9px 'JetBrains Mono',monospace"; ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) { const v = allMax - totalRange / 4 * i; ctx.fillText(v.toFixed(2), pad.l - 4, pad.t + ch / 4 * i + 3); }
      // x labels
      ctx.textAlign = "center";
      const n = datasets[0].data.length;
      const timeLabels = labels || Array.from({ length: n }, (_, i) => (i * 2).toString().padStart(2, '0') + ":00");
      for (let i = 0; i < n; i += 2) { const x = pad.l + cw / (n - 1) * i; ctx.fillText(timeLabels[i] || "", x, h - pad.b + 14); }
      // draw each dataset
      datasets.forEach(ds => {
        const pts = ds.data.map((v, i) => ({ x: pad.l + cw / (n - 1) * i, y: pad.t + ch - (v - allMin) / totalRange * ch }));
        const grd = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
        grd.addColorStop(0, ds.color + "26"); grd.addColorStop(1, ds.color + "00");
        ctx.beginPath(); ctx.moveTo(pts[0].x, pad.t + ch);
        pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.lineTo(pts[n - 1].x, pad.t + ch);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = ds.color; ctx.lineWidth = 2; ctx.shadowBlur = 4; ctx.shadowColor = ds.color; ctx.stroke(); ctx.shadowBlur = 0;
        pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = ds.color; ctx.lineWidth = 1.5; ctx.stroke(); });
      });
    };
    setTimeout(drawChart, 60);
    const el = wrapRef.current || canvas.parentElement;
    if (el) { const ro = new ResizeObserver(drawChart); ro.observe(el); return () => ro.disconnect(); }
  }, [datasets, labels, height]);
  const onMove = (e) => {
    const canvas = ref.current, tip = tipRef.current; if (!canvas || !tip) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const n = datasets[0].data.length;
    const padL = 36, padR = 10; const cw = rect.width - padL - padR;
    const idx = Math.round((mx - padL) / cw * (n - 1));
    if (idx < 0 || idx >= n) { tip.style.display = "none"; return; }
    tip.style.display = "block"; tip.style.left = (padL + cw / (n - 1) * idx) + "px";
    tip.innerHTML = datasets.map(ds => '<div style="color:' + ds.color + '">' + ds.label + ": " + ds.data[idx].toFixed(2) + "</div>").join("");
  };
  const onLeave = () => { if (tipRef.current) tipRef.current.style.display = "none"; };
  return React.createElement('div', { ref: wrapRef, style: { position: "relative", width: "100%", minHeight: height } },
    React.createElement('canvas', { ref, style: { display: "block", width: "100%", height: height }, onMouseMove: onMove, onMouseLeave: onLeave }),
    React.createElement('div', { ref: tipRef, style: { display: "none", position: "absolute", top: 0, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontFamily: FONTS.d, boxShadow: SHADOW, pointerEvents: "none", zIndex: 10 } })
  );
};

/* ═══════════ MINI SPARKLINE ═══════════ */
const MiniSparkline = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 60, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return React.createElement('svg', { width: w, height: h, style: { overflow: "visible" } },
    React.createElement('polyline', { points: pts, fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" })
  );
};

/* ═══════════ METRIC CARD ═══════════ */
const MetricCard = ({ icon, label, value, unit, max = 1, color, trend, status, loading }) => {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    if (loading) return;
    const target = typeof value === "number" ? value : parseFloat(value) || 0;
    let start = null;
    const duration = 800;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // cubic ease out
      setDisplayVal(target * eased);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, loading]);

  const pct = Math.min((displayVal) / (max || 1) * 100, 100);
  const trendVal = trend && trend.length >= 2 ? (((trend[trend.length - 1] - trend[0]) / Math.abs(trend[0] || 1)) * 100).toFixed(1) : null;
  const isUp = trendVal && parseFloat(trendVal) > 0;
  const bg = color === "#D93025" ? "rgba(254,242,242,0.5)" : color === "#F29900" ? "rgba(255,251,235,0.5)" : "rgba(240,253,244,0.5)";

  const trendColor = isUp ? "#D93025" : "#16A34A";

  if (loading) return React.createElement('div', { className: "glass-card", style: { flex: 1, minWidth: 160, borderRadius: 12, boxShadow: SHADOW, border: "1px solid var(--border)", padding: "16px 18px", height: 130 } },
    React.createElement('div', { className: "skeleton", style: { width: 32, height: 32, borderRadius: "50%", marginBottom: 12 } }),
    React.createElement('div', { className: "skeleton", style: { width: "60%", height: 12, borderRadius: 4, marginBottom: 16 } }),
    React.createElement('div', { className: "skeleton", style: { width: "80%", height: 28, borderRadius: 6 } })
  );

  return React.createElement('div', { className: "glass-card hover-card count-anim", style: { flex: 1, minWidth: 160, borderRadius: 12, boxShadow: SHADOW, borderLeft: "3px solid " + (color || "#1B6B3A"), padding: "16px 18px", position: "relative", overflow: "hidden" } },
    React.createElement('div', { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: bg, opacity: 0.3, pointerEvents: "none" } }),
    React.createElement('div', { style: { position: "relative", zIndex: 1 } },
      React.createElement('div', { style: { fontSize: 20, marginBottom: 4 } }, icon),
      React.createElement('div', { style: { fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: FONTS.b } }, label),
      React.createElement('div', { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement('div', { style: { display: "flex", alignItems: "baseline", gap: 6 } },
          React.createElement('span', { className: "count-anim", style: { fontFamily: FONTS.d, fontSize: 26, fontWeight: 700, color: color || "var(--text-primary)" } },
            typeof value === "number" && value.toFixed ? displayVal.toFixed(value % 1 === 0 ? 0 : 2) : value
          ),
          trendVal && React.createElement('span', { style: { fontSize: 11, fontWeight: 600, color: trendColor } }, isUp ? "↑" : "↓", Math.abs(parseFloat(trendVal)) + "%")
        ),
        trend && React.createElement(MiniSparkline, { data: trend, color: trendColor })
      ),
      React.createElement('div', { style: { fontSize: 11, color: "var(--text-secondary)", marginTop: 6, fontFamily: FONTS.b } }, unit + (status ? " · " + status : "")),
      React.createElement('div', { style: { width: "100%", height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2, marginTop: 10, overflow: "hidden" } },
        React.createElement('div', { style: { width: pct + "%", height: "100%", background: color || "#1B6B3A", borderRadius: 2, transition: "width 0.6s ease" } })
      )
    )
  );
};

/* ═══════════ SIDEBAR ═══════════ */
const Sidebar = ({ activePage, setActivePage, activeZone, setActiveZone, alertCount }) => {
  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "terrain", icon: "🗺️", label: "Terrain Map" },
    { id: "analytics", icon: "📈", label: "CAR Analytics" },
    { id: "alerts", icon: "🔔", label: "Alerts" }
  ];
  return React.createElement('div', { style: { width: 220, background: "linear-gradient(180deg, #164E2B 0%, #1B6B3A 100%)", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 100 } },
    React.createElement('div', { style: { padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.15)" } },
      React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: 0.8 } }, "TERRAWATCH"),
      React.createElement('div', { style: { fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 6, fontFamily: FONTS.b, letterSpacing: 0.3 } }, "Carbon & Terrain Intelligence")
    ),
    React.createElement('div', { style: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6 } },
      navItems.map(item => React.createElement('button', {
        key: item.id, onClick: () => setActivePage(item.id),
        onMouseEnter: (e) => { if (activePage !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; },
        onMouseLeave: (e) => { if (activePage !== item.id) e.currentTarget.style.background = "transparent"; },
        style: {
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONTS.b, outline: "none", transition: "all 0.2s",
          background: activePage === item.id ? "#fff" : "transparent", color: activePage === item.id ? "#1B6B3A" : "#fff"
        }
      },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10 } }, item.icon, item.label),
        item.id === "alerts" && alertCount > 0 && React.createElement('span', { style: { background: "#D93025", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99 } }, alertCount)
      ))
    ),
    React.createElement('div', { style: { padding: "12px", borderTop: "1px solid rgba(255,255,255,0.15)" } },
      React.createElement('div', { style: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 600, letterSpacing: 1, fontFamily: FONTS.b } }, "SELECT ZONE"),
      ZONES_LIST.map(z => React.createElement('button', {
        key: z.id, onClick: () => setActiveZone(z.id), style: {
          display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 12px", marginBottom: 4, border: activeZone === z.id ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)", borderRadius: 8, cursor: "pointer",
          background: activeZone === z.id ? "rgba(255,255,255,0.15)" : "transparent", color: "#fff", fontSize: 12, fontFamily: FONTS.b, fontWeight: 500, outline: "none"
        }
      }, z.name, React.createElement(RiskBadge, { level: z.riskLevel })))
    )
  );
};

/* ═══════════ HEADER ═══════════ */
const Header = ({ pageTitle, zone, clock, darkMode, setDarkMode, setChatOpen }) => {
  return React.createElement('div', { style: { height: 56, background: "var(--bg-header)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", transition: "all 0.3s" } },
    React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 18, fontWeight: 600, color: "var(--text-primary)" } }, pageTitle),
    React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 16 } },
      // PDF Export
      React.createElement('button', {
        onClick: () => {
          const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          const score = zone.riskLevel === "HIGH" ? 82 : zone.riskLevel === "MEDIUM" ? 54 : 23;
          const riskColor = zone.riskLevel === "HIGH" ? "#D93025" : zone.riskLevel === "MEDIUM" ? "#F29900" : "#16A34A";
          const html = `<!DOCTYPE html><html><head><title>TERRAWATCH Report — ${zone.name}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:32px;color:#1a1a2e;background:#fff}
  h1{font-size:24px;color:#1B6B3A;margin:0 0 4px}
  .sub{font-size:13px;color:#666;margin-bottom:24px}
  .badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;color:#fff;background:${riskColor};margin-left:10px}
  table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
  th{background:#f4f6f9;padding:10px 14px;text-align:left;color:#555;font-weight:600;border-bottom:2px solid #e2e8f0}
  td{padding:10px 14px;border-bottom:1px solid #f1f5f9}
  .section{margin:24px 0 8px;font-size:15px;font-weight:700;color:#1B6B3A;border-bottom:2px solid #1B6B3A;padding-bottom:4px}
  .footer{margin-top:40px;font-size:11px;color:#999;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px}
  @media print{body{margin:0;padding:20px}}
</style></head><body>
<h1>🌿 TERRAWATCH Carbon & Terrain Intelligence Report <span class="badge">${zone.riskLevel} RISK</span></h1>
<div class="sub">Generated: ${now} &nbsp;|&nbsp; Zone: ${zone.sector}</div>

<div class="section">Zone Overview</div>
<table>
  <tr><th>Parameter</th><th>Value</th></tr>
  <tr><td>Zone Name</td><td>${zone.name}</td></tr>
  <tr><td>Sector</td><td>${zone.sector}</td></tr>
  <tr><td>Coordinates</td><td>${zone.coords}</td></tr>
  <tr><td>Deforestation Proximity</td><td>${zone.defProx}</td></tr>
  <tr><td>Risk Level</td><td style="color:${riskColor};font-weight:700">${zone.riskLevel}</td></tr>
  <tr><td>AI Risk Score</td><td style="color:${riskColor};font-weight:700">${score}/100</td></tr>
</table>

<div class="section">Environmental Metrics</div>
<table>
  <tr><th>Metric</th><th>Current Value</th><th>Status</th></tr>
  <tr><td>Carbon Absorption Rate (CAR)</td><td>${zone.car}</td><td style="color:${riskColor}">${zone.riskLevel}</td></tr>
  <tr><td>NDVI (Vegetation Health)</td><td>${zone.ndvi}</td><td style="color:${zone.ndvi > 0.5 ? '#16A34A' : '#D93025'}">${zone.ndvi > 0.5 ? 'Healthy' : 'Degraded'}</td></tr>
  <tr><td>Terrain Stability Index</td><td>${zone.terrain}%</td><td>${zone.terrain < 30 ? 'Unstable' : 'Stable'}</td></tr>
  <tr><td>Soil Moisture</td><td>${zone.moisture}%</td><td>${zone.moisture > 60 ? 'High' : zone.moisture > 40 ? 'Moderate' : 'Low'}</td></tr>
  <tr><td>Seismic Activity</td><td>${zone.seismic}R</td><td style="color:${zone.seismic > 2 ? '#D93025' : '#16A34A'}">${zone.seismic > 2 ? 'Elevated' : 'Normal'}</td></tr>
</table>

<div class="section">Active Alerts</div>
<table>
  <tr><th>Time</th><th>Alert</th><th>Level</th></tr>
  ${zone.alerts.map(a => `<tr><td>${a.time}</td><td>${a.msg}</td><td style="color:${a.level === 'high' ? '#D93025' : a.level === 'med' ? '#F29900' : '#16A34A'};font-weight:600">${a.level.toUpperCase()}</td></tr>`).join('')}
</table>

<div class="footer">TERRAWATCH | Carbon & Terrain Intelligence Platform &nbsp;·&nbsp; Report ID: TW-${Date.now()} &nbsp;·&nbsp; ${now}</div>
</body></html>`;
          const win = window.open('', '_blank');
          if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
          else { alert('Pop-up blocked! Please allow pop-ups for this site and try again.'); }
        },
        style: { background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "var(--text-primary)", fontSize: 13, fontWeight: 600, outline: "none", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }
      }, "📄 Export PDF"),

      // AI Chat toggle
      React.createElement('button', {
        onClick: () => setChatOpen(true),
        style: { background: "rgba(27, 107, 58, 0.1)", border: "1px solid rgba(27, 107, 58, 0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#1B6B3A", fontSize: 13, fontWeight: 600, outline: "none", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }
      }, "🤖 AI Assistant"),
      // Dark mode toggle
      React.createElement('button', {
        onClick: () => setDarkMode(!darkMode),
        style: { background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "all 0.2s" }
      }, darkMode ? "☀️" : "🌙"),
      // Zone Info
      React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6, background: "var(--bg-hover)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 99 } },
        React.createElement('span', { style: { fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: FONTS.b } }, zone.name),
        React.createElement(RiskBadge, { level: zone.riskLevel })
      ),
      // Live Status
      React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 6 } },
        React.createElement('div', { className: "live-dot", style: { width: 8, height: 8, borderRadius: "50%", background: "#1B6B3A" } }),
        React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-primary)" } }, "Live")
      ),
      // Clock
      React.createElement('div', { style: { fontFamily: FONTS.d, fontSize: 14, color: "var(--text-secondary)" } }, clock)
    )
  );
};

/* ═══════════ NOTIFICATION STRIP ═══════════ */
const NotifStrip = ({ zone, dismissed, onDismiss }) => {
  if (dismissed) return null;
  if (zone.riskLevel === "LOW") return null;
  const rc = RISK_COLORS[zone.riskLevel];
  const topAlert = zone.alerts[0];
  return React.createElement('div', { style: { background: rc.bg, borderBottom: "1px solid " + rc.border, padding: "8px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: rc.text, fontWeight: 500, fontFamily: FONTS.b } },
    React.createElement('span', null, "⚠ " + zone.name + ": " + (topAlert ? topAlert.msg : "Alert active")),
    React.createElement('button', { onClick: onDismiss, style: { background: "transparent", border: "none", color: rc.text, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 } }, "×")
  );
};

/* ═══════════ DASHBOARD PAGE ═══════════ */
const Dashboard = ({ zone, alerts, setActivePage }) => {
  const [loading, setLoading] = useState(true);

  // Simulate network loading when zone changes
  useEffect(() => {
    setLoading(true);
    const tm = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(tm);
  }, [zone.id]);

  const riskC = zone.car < 0.4 ? "#D93025" : zone.car < 0.6 ? "#F29900" : "#1B6B3A";
  const ndviC = zone.ndvi < 0.3 ? "#D93025" : zone.ndvi < 0.5 ? "#F29900" : "#2E9E5B";
  const terrC = zone.terrain < 30 ? "#D93025" : zone.terrain < 50 ? "#F29900" : "#1B6B3A";
  const hazards = zone.riskLevel === "HIGH" ? [
    { tag: "HIGH", color: "#D93025", bg: "#FEF2F2", text: "Landslide probability 78% — active mining subsidence" },
    { tag: "HIGH", color: "#D93025", bg: "#FEF2F2", text: "Sinkhole formation risk — underground void detected" },
    { tag: "MED", color: "#D97706", bg: "#FFFBEB", text: "Soil erosion accelerating — 12% increase this quarter" },
    { tag: "LOW", color: "#16A34A", bg: "#F0FDF4", text: "Water table within safe parameters" }
  ] : zone.riskLevel === "MEDIUM" ? [
    { tag: "MED", color: "#D97706", bg: "#FFFBEB", text: "Moderate subsidence detected in grid sector B4" },
    { tag: "MED", color: "#D97706", bg: "#FFFBEB", text: "Iron ore extraction affecting root stability" },
    { tag: "LOW", color: "#16A34A", bg: "#F0FDF4", text: "Seismic activity within baseline range" }
  ] : [
    { tag: "LOW", color: "#16A34A", bg: "rgba(22,163,74,0.1)", text: "All terrain metrics within safe parameters" },
    { tag: "LOW", color: "#16A34A", bg: "rgba(22,163,74,0.1)", text: "Carbon absorption rate stable and improving" }
  ];
  const card = (s, children) => React.createElement('div', { className: "glass-card hover-card", style: { borderRadius: 12, boxShadow: SHADOW, overflow: "hidden", ...s } }, children);
  const cardHead = (title, right) => React.createElement('div', { style: { padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" } },
    React.createElement('span', { style: { fontFamily: FONTS.h, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" } }, title), right || null
  );
  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 20 } },
    // ROW 1: Metric cards
    React.createElement('div', { style: { display: "flex", gap: 14, flexWrap: "wrap" } },
      React.createElement(MetricCard, { loading, icon: "🌿", label: "CAR Index", value: zone.car, unit: "Carbon Absorption Rate", max: 1, color: riskC, trend: zone.carTrend, status: zone.car < 0.4 ? "Critical" : "Nominal" }),
      React.createElement(MetricCard, { loading, icon: "🍃", label: "NDVI Score", value: zone.ndvi, unit: "Vegetation Index", max: 1, color: ndviC, trend: zone.ndviTrend, status: zone.ndvi < 0.3 ? "Critical" : "Active" }),
      React.createElement(MetricCard, { loading, icon: "⛰️", label: "Terrain Stability", value: zone.terrain, unit: "% Stability Index", max: 100, color: terrC, trend: zone.seismicTrend, status: zone.terrain < 30 ? "Unstable" : "Stable" }),
      React.createElement(MetricCard, { loading, icon: "💧", label: "Soil Moisture", value: zone.moisture, unit: "% Volumetric", max: 100, color: "#3B82F6", trend: zone.moistTrend, status: "Monitoring" }),
      React.createElement(MetricCard, { loading, icon: "📡", label: "Seismic", value: zone.seismic, unit: "Richter Scale", max: 5, color: zone.seismic > 2 ? "#D93025" : "#1B6B3A", trend: zone.seismicTrend, status: zone.seismic > 2 ? "Elevated" : "Normal" })
    ),
    // ROW 2: Risk Assessment + Alerts
    React.createElement('div', { style: { display: "flex", gap: 16 } },
      // Risk Assessment
      card({ flex: "0.9" },
        React.createElement('div', null,
          // Risk status box
          React.createElement('div', { style: { margin: 16, padding: 16, background: RISK_COLORS[zone.riskLevel].bg, border: "1px solid " + RISK_COLORS[zone.riskLevel].border, borderRadius: 10, textAlign: "center" } },
            React.createElement(RiskBadge, { level: zone.riskLevel }),
            React.createElement('div', { style: { fontSize: 12, color: "#4A5568", marginTop: 8, fontFamily: FONTS.b } }, zone.sector),
            React.createElement('div', { style: { display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 11, color: "#4A5568", fontFamily: FONTS.d } },
              React.createElement('span', null, "DEF: " + zone.defProx),
              React.createElement('span', null, "CAR: " + zone.car),
              React.createElement('span', null, "NDVI: " + zone.ndvi)
            )
          ),
          // Gauge
          React.createElement('div', { style: { padding: "8px 16px" } }, React.createElement(RiskGauge, { zone })),
          // Hazards
          React.createElement('div', { style: { padding: "0 16px 8px" } },
            React.createElement('div', { style: { fontSize: 11, color: "#9AA5B4", fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" } }, "Hazard Predictions"),
            hazards.map((h, i) => React.createElement('div', { key: i, style: { display: "flex", gap: 8, padding: "8px 10px", background: h.bg, borderRadius: 8, marginBottom: 6, alignItems: "flex-start" } },
              React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: h.color, marginTop: 4, flexShrink: 0 } }),
              React.createElement('div', null,
                React.createElement('span', { style: { fontSize: 10, fontWeight: 700, color: h.color, marginRight: 6 } }, h.tag),
                React.createElement('span', { style: { fontSize: 12, color: "#4A5568" } }, h.text)
              )
            ))
          ),
          // Alert timeline
          React.createElement('div', { style: { padding: "0 16px 16px" } },
            React.createElement('div', { style: { fontSize: 11, color: "#9AA5B4", fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" } }, "Live Alerts"),
            React.createElement('div', { style: { borderLeft: "2px solid #E2E8F0", marginLeft: 6, paddingLeft: 14 } },
              alerts.slice(0, 5).map((al, i) => {
                const dotC = al.level === "high" ? "#D93025" : al.level === "med" ? "#F29900" : "#1B6B3A";
                return React.createElement('div', { key: i, style: { position: "relative", marginBottom: 12 } },
                  React.createElement('div', { style: { position: "absolute", left: -21, top: 4, width: 10, height: 10, borderRadius: "50%", background: "#fff", border: "2px solid " + dotC } }),
                  React.createElement('div', { style: { fontSize: 10, color: "#9AA5B4", fontFamily: FONTS.d } }, al.time),
                  React.createElement('div', { style: { fontSize: 12, color: "#1A1A2E", fontWeight: 500 } }, al.msg)
                );
              })
            ),
            React.createElement('div', { onClick: () => setActivePage("alerts"), style: { fontSize: 12, fontWeight: 600, color: "#2E9E5B", cursor: "pointer", textAlign: "center", marginTop: 8 } }, "View all alerts →")
          )
        )
      )
    ),
    // ROW 3: Charts
    React.createElement('div', { style: { display: "flex", gap: 16 } },
      card({ flex: 1 },
        cardHead("CAR & NDVI — 12 Hour Trend", React.createElement('div', { style: { display: "flex", gap: 12 } },
          React.createElement('span', { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4A5568" } }, React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: "#1B6B3A" } }), "CAR"),
          React.createElement('span', { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4A5568" } }, React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: "#2E9E5B" } }), "NDVI")
        )),
        React.createElement('div', { style: { padding: 12 } }, React.createElement(LineChart, { datasets: [{ data: zone.carTrend, color: "#1B6B3A", label: "CAR" }, { data: zone.ndviTrend, color: "#2E9E5B", label: "NDVI" }] }))
      ),
      card({ flex: 1 },
        cardHead("Moisture & Seismic — Hourly", React.createElement('div', { style: { display: "flex", gap: 12 } },
          React.createElement('span', { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4A5568" } }, React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" } }), "Moisture"),
          React.createElement('span', { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4A5568" } }, React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" } }), "Seismic")
        )),
        React.createElement('div', { style: { padding: 12 } }, React.createElement(LineChart, { datasets: [{ data: zone.moistTrend, color: "#3B82F6", label: "Moisture" }, { data: zone.seismicTrend.map(x => x * 10), color: "#F59E0B", label: "Seismic×10" }] }))
      )
    )
  );
};

/* ═══════════ TERRAIN MAP PAGE ═══════════ */
const TerrainMapPage = ({ zone, activeZone, setActiveZone }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapView, setMapView] = useState("terrain");
  const [showOverlays, setShowOverlays] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.35);
  const [showCustomize, setShowCustomize] = useState(false);

  const btnStyle = (active) => ({
    padding: "6px 12px", borderRadius: 8, border: active ? "1.5px solid #1B6B3A" : "1px solid var(--border)",
    background: active ? "rgba(27,107,58,0.12)" : "var(--bg-main)",
    color: active ? "#1B6B3A" : "var(--text-secondary)",
    fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", outline: "none",
    display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s", fontFamily: FONTS.b
  });

  const containerStyle = isFullscreen
    ? { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2000, background: "var(--bg-main)", display: "flex", flexDirection: "column" }
    : { display: "flex", flexDirection: "column", gap: 20 };

  return React.createElement('div', { style: containerStyle },
    React.createElement('div', { className: "glass-card", style: { flex: isFullscreen ? 1 : "none", display: "flex", flexDirection: "column", background: "var(--bg-card)", borderRadius: isFullscreen ? 0 : 12, boxShadow: SHADOW, border: isFullscreen ? "none" : "1px solid var(--border)", overflow: "hidden" } },

      // ── Header ──
      React.createElement('div', { style: { padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 } },
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 12 } },
          React.createElement('span', { style: { fontFamily: FONTS.h, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" } }, "📍 " + zone.name + " — Terrain Analysis"),
          React.createElement('span', { style: { fontSize: 11, color: "var(--text-secondary)", fontFamily: FONTS.d } }, zone.coords)
        ),
        React.createElement('div', { style: { display: "flex", gap: 8, alignItems: "center" } },
          // Fullscreen button
          React.createElement('button', { onClick: () => setIsFullscreen(!isFullscreen), style: btnStyle(false) }, isFullscreen ? "↙️ Exit" : "↗️ Fullscreen")
        )
      ),

      // ── Map View Switcher + Customize Toolbar ──
      React.createElement('div', { style: { padding: "10px 18px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "var(--bg-main)" } },
        React.createElement('span', { style: { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: FONTS.b, marginRight: 4, textTransform: "uppercase", letterSpacing: 1 } }, "Map View:"),
        Object.entries(MAP_VIEWS).map(([key, v]) =>
          React.createElement('button', { key, onClick: () => setMapView(key), style: btnStyle(mapView === key) },
            v.icon, " ", v.label
          )
        ),
        React.createElement('div', { style: { flex: 1 } }),
        // Customize toggle
        React.createElement('button', { onClick: () => setShowCustomize(!showCustomize), style: { ...btnStyle(showCustomize), marginLeft: 8 } },
          "⚙️ Customize"
        )
      ),

      // ── Options Panel (expandable) ──
      showCustomize && React.createElement('div', { style: { padding: "12px 18px", background: "var(--bg-hover)", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" } },
        // Toggle: zone overlays
        React.createElement('label', { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer", fontFamily: FONTS.b } },
          React.createElement('input', { type: "checkbox", checked: showOverlays, onChange: e => setShowOverlays(e.target.checked), style: { accentColor: "#1B6B3A", width: 16, height: 16 } }),
          "Risk Zone Overlays"
        ),
        // Toggle: zone labels
        React.createElement('label', { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", cursor: "pointer", fontFamily: FONTS.b } },
          React.createElement('input', { type: "checkbox", checked: showLabels, onChange: e => setShowLabels(e.target.checked), style: { accentColor: "#1B6B3A", width: 16, height: 16 } }),
          "Zone Labels"
        ),
        // Opacity slider
        React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement('span', { style: { fontSize: 12, color: "var(--text-secondary)", fontFamily: FONTS.b } }, "Overlay Opacity:"),
          React.createElement('input', {
            type: "range", min: 0.05, max: 0.75, step: 0.05, value: overlayOpacity,
            onChange: e => setOverlayOpacity(parseFloat(e.target.value)),
            style: { width: 100, accentColor: "#1B6B3A", cursor: "pointer" }
          }),
          React.createElement('span', { style: { fontSize: 12, fontFamily: FONTS.d, color: "var(--text-primary)", minWidth: 34 } }, Math.round(overlayOpacity * 100) + "%")
        )
      ),

      // ── Map ──
      React.createElement('div', { style: { flex: 1, minHeight: isFullscreen ? 0 : 400, position: "relative" } },
        React.createElement(TerrainMap, { zone, height: isFullscreen ? "100%" : 400, mapView, showOverlays, showLabels, overlayOpacity })
      )
    ),

    // ── Zone Selector Cards ──
    !isFullscreen && React.createElement('div', { style: { display: "flex", gap: 16 } },
      ZONES_LIST.map(z => {
        const active = z.id === activeZone;
        const rc = RISK_COLORS[z.riskLevel];
        return React.createElement('div', {
          key: z.id, onClick: () => setActiveZone(z.id), className: "glass-card hover-card",
          style: {
            flex: 1, borderRadius: 12, boxShadow: SHADOW,
            border: active ? "2px solid #1B6B3A" : "1px solid var(--border)",
            padding: 20, cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: active ? "translateY(-3px)" : "translateY(0)",
            boxShadow: active ? "0 8px 24px rgba(27,107,58,0.2)" : SHADOW
          }
        },
          React.createElement('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 12 } },
            React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 8 } },
              active && React.createElement('div', { style: { width: 6, height: 6, borderRadius: "50%", background: "#1B6B3A", boxShadow: "0 0 6px #1B6B3A", animation: "pulseDot 1.5s infinite" } }),
              React.createElement('span', { style: { fontFamily: FONTS.h, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" } }, z.name)
            ),
            React.createElement(RiskBadge, { level: z.riskLevel })
          ),
          React.createElement('div', { style: { fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 } }, z.sector),
          React.createElement('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, fontFamily: FONTS.d, color: "var(--text-primary)" } },
            React.createElement('span', null, "CAR: " + z.car),
            React.createElement('span', null, "NDVI: " + z.ndvi),
            React.createElement('span', null, "Terrain: " + z.terrain + "%"),
            React.createElement('span', null, "Seismic: " + z.seismic + "R"),
            React.createElement('span', { style: { gridColumn: "1/3" } }, "Defense: " + z.defProx)
          )
        );
      })
    )
  );
};

/* ═══════════ TOAST NOTIFICATIONS ═══════════ */
const Toast = ({ msg, level, onClose }) => {
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setExiting(true); setTimeout(onClose, 300); }, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = level === "high" ? "#FEF2F2" : level === "med" ? "#FFFBEB" : "#F0FDF4";
  const border = level === "high" ? "#DC2626" : level === "med" ? "#F59E0B" : "#16A34A";
  const icon = level === "high" ? "🚨" : level === "med" ? "⚠️" : "ℹ️";
  return React.createElement('div', { className: `glass-card ${exiting ? "toast-exit" : "toast-enter"}`, style: { background: bg, borderLeft: `4px solid ${border}`, padding: "12px 16px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", gap: 12, alignItems: "center", minWidth: 280, pointerEvents: "auto" } },
    React.createElement('div', { style: { fontSize: 20 } }, icon),
    React.createElement('div', { style: { flex: 1 } },
      React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: FONTS.h } }, level === "high" ? "Critical Alert" : level === "med" ? "Warning" : "Notice"),
      React.createElement('div', { style: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 } }, msg)
    ),
    React.createElement('button', { onClick: () => { setExiting(true); setTimeout(onClose, 300); }, style: { background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-secondary)" } }, "×")
  );
};

/* ═══════════ AI CHATBOT ═══════════ */
const Chatbot = ({ isOpen, onClose, zone }) => {
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([
    { role: "ai", text: `I'm EcoTwin AI. I'm currently monitoring ${zone.name}. Ask me about risk factors, CAR index, or mitigation strategies.` }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setHistory([{ role: "ai", text: `I'm EcoTwin AI. I'm currently monitoring ${zone.name}. Ask me about risk factors, CAR index, or mitigation strategies.` }]);
    }
  }, [isOpen, zone.name]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!msg.trim() || sending) return;
    const userMsg = msg;
    setHistory(p => [...p, { role: "user", text: userMsg }]);
    setMsg("");
    setSending(true);
    setHistory(p => [...p, { role: "ai", text: "⏳ Analyzing..." }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, zoneContext: zone })
      });
      const data = await res.json();
      setHistory(p => [...p.slice(0, -1), { role: "ai", text: data.reply || "Sorry, I couldn't process that." }]);
    } catch (e) {
      setHistory(p => [...p.slice(0, -1), { role: "ai", text: "Connection error — backend may be offline. Start the server with: cd server && node index.js" }]);
    } finally {
      setSending(false);
    }
  };

  return React.createElement('div', { style: { position: "fixed", top: 0, right: isOpen ? 0 : -400, width: 380, height: "100vh", background: "var(--bg-card)", borderLeft: "1px solid var(--border)", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 1000, display: "flex", flexDirection: "column" } },
    // Header
    React.createElement('div', { style: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg, #1B6B3A 0%, #2E9E5B 100%)", color: "#fff" } },
      React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
        React.createElement('div', { style: { fontSize: 24 } }, "🤖"),
        React.createElement('div', null,
          React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 16, fontWeight: 600 } }, "EcoTwin AI"),
          React.createElement('div', { style: { fontSize: 11, color: "rgba(255,255,255,0.8)" } }, "Expert Assistant")
        )
      ),
      React.createElement('button', { onClick: onClose, style: { background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, "×")
    ),
    // Chat Area
    React.createElement('div', { style: { flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-main)" } },
      history.map((m, i) => React.createElement('div', { key: i, style: { display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 4 } },
        React.createElement('div', { style: { fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" } }, m.role === "ai" ? "EcoTwin" : "You"),
        React.createElement('div', { style: { background: m.role === "user" ? "#1B6B3A" : "var(--bg-card)", color: m.role === "user" ? "#fff" : "var(--text-primary)", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0", fontSize: 13, lineHeight: 1.5, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: m.role === "user" ? "none" : "1px solid var(--border)", maxWidth: "85%" } }, m.text)
      )),
      React.createElement('div', { ref: endRef })
    ),
    // Input Area
    React.createElement('div', { style: { padding: 20, borderTop: "1px solid var(--border)", background: "var(--bg-card)" } },
      React.createElement('div', { style: { display: "flex", gap: 8 } },
        React.createElement('input', {
          placeholder: "Ask about " + zone.name + "...", value: msg,
          onChange: e => setMsg(e.target.value),
          onKeyDown: e => e.key === "Enter" && handleSend(),
          style: { flex: 1, padding: "12px 16px", borderRadius: 99, border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: FONTS.d }
        }),
        React.createElement('button', { onClick: handleSend, style: { background: "#1B6B3A", color: "#fff", border: "none", width: 42, height: 42, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "transform 0.2s" }, onMouseEnter: e => e.currentTarget.style.transform = "scale(1.05)", onMouseLeave: e => e.currentTarget.style.transform = "scale(1)" }, "↑")
      )
    )
  );
};

/* ═══════════ HEADER DROPDOWN & SETTINGS (PLACEHOLDERS) ═══════════ */
const CARAnalytics = ({ zone }) => {
  const [area, setArea] = useState(500);
  const [months, setMonths] = useState(6);
  const [year, setYear] = useState(2026);

  // Calculate dynamic data based on the year slider
  // 2026 = current data, 2020 = baseline data
  // We'll simulate historical data by linearly interpolating between a 2020 baseline and the current 2026 data.
  const yearRatio = (year - 2020) / (2026 - 2020);

  // Baseline historical values (better CAR/NDVI, assuming degradation over time)
  const baselineCAR = 0.85;
  const baselineNDVI = 0.80;

  // Dynamic current values based on slider
  const dynamicCAR = baselineCAR - (baselineCAR - zone.car) * yearRatio;
  const dynamicNDVI = baselineNDVI - (baselineNDVI - zone.ndvi) * yearRatio;

  // Calculate impact using dynamic CAR
  const carbonLost = ((baselineCAR - dynamicCAR) * area * (months / 12)).toFixed(1);
  const creditVal = (parseFloat(carbonLost) * 850).toFixed(0);
  const trees = Math.ceil(parseFloat(carbonLost) * 5);
  const vegCov = (dynamicNDVI * 100).toFixed(1);

  // Dynamic trend data generation for charts
  const generateTrend = (currentTrend, baseValue) => {
    return currentTrend.map(val => baseValue - (baseValue - val) * yearRatio);
  };

  const jharkhandCAR = generateTrend(ZONES_LIST[0].carTrend, 0.85);
  const odishaCAR = generateTrend(ZONES_LIST[1].carTrend, 0.85);
  const chhattisgarhCAR = generateTrend(ZONES_LIST[2].carTrend, 0.88);

  const jharkhandNDVI = generateTrend(ZONES_LIST[0].ndviTrend, 0.80);
  const odishaNDVI = generateTrend(ZONES_LIST[1].ndviTrend, 0.80);
  const chhattisgarhNDVI = generateTrend(ZONES_LIST[2].ndviTrend, 0.82);

  const card = (s, ...children) => React.createElement('div', { className: "glass-card hover-card", style: { borderRadius: 12, boxShadow: SHADOW, overflow: "hidden", ...s } }, ...children);
  const cardH = (t) => React.createElement('div', { style: { padding: "14px 18px", borderBottom: "1px solid var(--border)", fontFamily: FONTS.h, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" } }, t);

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 20 } },

    // Historical Timeline Slider
    React.createElement('div', { className: "glass-card", style: { padding: "16px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 24, boxShadow: SHADOW } },
      React.createElement('div', { style: { fontFamily: FONTS.h, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" } }, "Historical View"),
      React.createElement('input', {
        type: "range", min: 2020, max: 2026, value: year, onChange: e => setYear(Number(e.target.value)),
        style: { flex: 1, accentColor: "#1B6B3A", cursor: "pointer" }
      }),
      React.createElement('div', { style: { fontFamily: FONTS.d, fontSize: 18, fontWeight: 700, color: "#1B6B3A", width: 60, textAlign: "right" } }, year)
    ),

    // Summary stats
    React.createElement('div', { style: { display: "flex", gap: 16 } },
      [{ icon: "🏭", label: "Total Carbon Lost", val: carbonLost + " tonnes", color: year < 2022 ? "#1B6B3A" : year < 2025 ? "#F29900" : "#D93025" },
      { icon: "💰", label: "Carbon Credit Value", val: "₹" + Number(creditVal).toLocaleString(), color: year < 2022 ? "#1B6B3A" : year < 2025 ? "#F29900" : "#D93025" },
      { icon: "🌱", label: "Vegetation Coverage", val: vegCov + "%", color: parseFloat(vegCov) > 60 ? "#1B6B3A" : parseFloat(vegCov) > 40 ? "#F29900" : "#D93025" }].map((s, i) =>
        React.createElement('div', { key: i, className: "glass-card hover-card count-anim", style: { flex: 1, borderRadius: 12, boxShadow: SHADOW, borderLeft: "3px solid " + s.color, padding: 20 } },
          React.createElement('div', { style: { fontSize: 22, marginBottom: 4 } }, s.icon),
          React.createElement('div', { style: { fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: FONTS.b } }, s.label),
          React.createElement('div', { key: s.val, className: "count-anim", style: { fontFamily: FONTS.d, fontSize: 24, fontWeight: 700, color: s.color } }, s.val)
        )
      )
    ),
    // Multi-zone CAR chart
    card({},
      React.createElement('div', { style: { padding: "14px 18px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        React.createElement('span', { style: { fontFamily: FONTS.h, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" } }, `CAR Trend — All Zones (${year})`),
        React.createElement('div', { style: { display: "flex", gap: 12 } },
          ["Jharkhand|#1B6B3A", "Odisha|#3B82F6", "Chhattisgarh|#2E9E5B"].map(s => { const [n, c] = s.split("|"); return React.createElement('span', { key: n, style: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4A5568" } }, React.createElement('div', { style: { width: 8, height: 8, borderRadius: "50%", background: c } }), n); })
        )
      ),
      React.createElement('div', { style: { padding: 12 }, key: `car-chart-${year}` }, React.createElement(LineChart, {
        height: 200,
        labels: ["2020", "2021", "2022", "2023", "2024", "2025", "2026"],
        datasets: [
          { data: jharkhandCAR, color: "#1B6B3A", label: "Jharkhand" },
          { data: odishaCAR, color: "#3B82F6", label: "Odisha" },
          { data: chhattisgarhCAR, color: "#2E9E5B", label: "Chhattisgarh" }
        ]
      }))
    ),
    // NDVI chart
    card({},
      cardH(`NDVI Analysis — All Zones (${year})`),
      React.createElement('div', { style: { padding: 12 }, key: `ndvi-chart-${year}` }, React.createElement(LineChart, {
        height: 160,
        labels: ["2020", "2021", "2022", "2023", "2024", "2025", "2026"],
        datasets: [
          { data: jharkhandNDVI, color: "#1B6B3A", label: "Jharkhand" },
          { data: odishaNDVI, color: "#3B82F6", label: "Odisha" },
          { data: chhattisgarhNDVI, color: "#2E9E5B", label: "Chhattisgarh" }
        ]
      }))
    ),
    // Calculator
    card({},
      cardH("Carbon Loss Calculator"),
      React.createElement('div', { style: { padding: 20, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" } },
        React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 12, minWidth: 200 } },
          React.createElement('label', { style: { fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 } },
            "Area (hectares)",
            React.createElement('input', { type: "number", value: area, onChange: e => setArea(Number(e.target.value)), style: { display: "block", width: "100%", marginTop: 4, padding: "8px 12px", border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)", borderRadius: 8, fontFamily: FONTS.d, fontSize: 14, outline: "none" } })
          ),
          React.createElement('label', { style: { fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 } },
            "Time Period (months)",
            React.createElement('input', { type: "number", value: months, onChange: e => setMonths(Number(e.target.value)), style: { display: "block", width: "100%", marginTop: 4, padding: "8px 12px", border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-primary)", borderRadius: 8, fontFamily: FONTS.d, fontSize: 14, outline: "none" } })
          ),
          React.createElement('div', { style: { fontSize: 10, color: "var(--text-secondary)", fontFamily: FONTS.d } }, "Formula: (baselineCAR-dynamicCAR)×area×(months/12)", "\nBaseline CAR: " + baselineCAR + " | Current Dynamic: " + dynamicCAR.toFixed(2))
        ),
        React.createElement('div', { style: { display: "flex", gap: 16, flexWrap: "wrap" } },
          [{ label: "Total CO₂ Lost", val: carbonLost + " tonnes", color: "#D93025" }, { label: "Credit Loss", val: "₹" + Number(creditVal).toLocaleString(), color: "#F29900" }, { label: "Trees Needed", val: trees.toLocaleString() + " trees", color: "#1B6B3A" }].map((r, i) =>
            React.createElement('div', { key: i, style: { background: i === 0 ? "rgba(220,38,38,0.1)" : i === 1 ? "rgba(245,158,11,0.1)" : "rgba(22,163,74,0.1)", borderRadius: 10, padding: "16px 20px", minWidth: 140 } },
              React.createElement('div', { style: { fontSize: 10, color: "var(--text-secondary)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 } }, r.label),
              React.createElement('div', { className: "count-anim", style: { fontFamily: FONTS.d, fontSize: 22, fontWeight: 700, color: r.color } }, r.val)
            )
          )
        )
      )
    ),

    // Zone Comparison Table
    card({},
      cardH("Cross-Zone Comparison"),
      React.createElement('div', { style: { overflowX: "auto" } },
        React.createElement('table', { style: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13, fontFamily: FONTS.b } },
          React.createElement('thead', { style: { background: "var(--bg-main)", color: "var(--text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 } },
            React.createElement('tr', null,
              ["Zone Name", "Risk Level", "CAR Index", "NDVI", "Terrain Stability", "Seismic Activity"].map(h =>
                React.createElement('th', { key: h, style: { padding: "12px 18px", fontWeight: 600, borderBottom: "1px solid var(--border)" } }, h)
              )
            )
          ),
          React.createElement('tbody', null,
            ZONES_LIST.map((z, i) => {
              // Interpolate values for this specific zone based on yearRatio
              const zDynamicCAR = baselineCAR - (baselineCAR - z.car) * yearRatio;
              const zDynamicNDVI = baselineNDVI - (baselineNDVI - z.ndvi) * yearRatio;

              // Simulate less degradation in terrain/seismic for historical views
              const baselineTerrain = Math.max(0, z.terrain - 25);
              const zDynamicTerrain = baselineTerrain + (z.terrain - baselineTerrain) * yearRatio;

              const baselineSeismic = Math.max(0, z.seismic - 1.5);
              const zDynamicSeismic = baselineSeismic + (z.seismic - baselineSeismic) * yearRatio;

              // Evaluate risk level historically
              let riskLvl = "LOW";
              if (zDynamicCAR < 0.35 || zDynamicTerrain > 60 || zDynamicSeismic > 2.0) riskLvl = "HIGH";
              else if (zDynamicCAR < 0.60 || zDynamicTerrain > 30 || zDynamicSeismic > 1.0) riskLvl = "MEDIUM";

              return React.createElement('tr', { key: z.id, style: { borderBottom: i === ZONES_LIST.length - 1 ? "none" : "1px solid var(--border)", background: zone.id === z.id ? "var(--bg-hover)" : "transparent" } },
                React.createElement('td', { style: { padding: "12px 18px", fontWeight: 600, color: "var(--text-primary)" } }, z.name),
                React.createElement('td', { style: { padding: "12px 18px" } }, React.createElement(RiskBadge, { level: riskLvl })),
                React.createElement('td', { style: { padding: "12px 18px", fontFamily: FONTS.d, color: zDynamicCAR < 0.4 ? "#D93025" : "inherit" } }, zDynamicCAR.toFixed(2)),
                React.createElement('td', { style: { padding: "12px 18px", fontFamily: FONTS.d, color: zDynamicNDVI < 0.3 ? "#D93025" : "inherit" } }, zDynamicNDVI.toFixed(2)),
                React.createElement('td', { style: { padding: "12px 18px", fontFamily: FONTS.d } }, zDynamicTerrain.toFixed(1) + "%"),
                React.createElement('td', { style: { padding: "12px 18px", fontFamily: FONTS.d } }, zDynamicSeismic.toFixed(1) + "R")
              );
            })
          )
        )
      )
    )
  );
};

/* ═══════════ ALERTS PAGE ═══════════ */
const AlertsPage = ({ allAlerts, setAlerts, alertFilter, setAlertFilter, expandedAlert, setExpandedAlert }) => {
  const filters = ["all", "high", "med", "low"];
  const filtered = alertFilter === "all" ? allAlerts : allAlerts.filter(al => al.level === alertFilter);
  const counts = { high: allAlerts.filter(a => a.level === "high").length, med: allAlerts.filter(a => a.level === "med").length, low: allAlerts.filter(a => a.level === "low").length };
  const exportCSV = () => {
    const rows = [["Time", "Zone", "Level", "Message"], ...allAlerts.map(a => [a.time, a.zone || "—", a.level, a.msg])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "terrawatch_alerts.csv"; link.click();
    URL.revokeObjectURL(url);
  };
  const actions = { high: "Initiate evacuation assessment. Deploy ground team within 2km radius.", med: "Increase monitoring frequency. Notify local district authority.", low: "Log and archive. Continue standard monitoring cycle." };
  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 16 } },
    // Stats row
    React.createElement('div', { style: { display: "flex", gap: 16 } },
      [{ label: "High Alerts", val: counts.high, color: "#D93025", bg: "#FEF2F2" }, { label: "Medium Alerts", val: counts.med, color: "#D97706", bg: "#FFFBEB" }, { label: "Low Alerts", val: counts.low, color: "#16A34A", bg: "#F0FDF4" }].map((s, i) =>
        React.createElement('div', { key: i, style: { flex: 1, background: s.bg, borderRadius: 12, padding: "16px 20px", border: "1px solid #E2E8F0" } },
          React.createElement('div', { style: { fontSize: 11, color: s.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 } }, s.label),
          React.createElement('div', { style: { fontFamily: FONTS.d, fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 } }, s.val)
        )
      )
    ),
    // Filter bar
    React.createElement('div', { style: { display: "flex", gap: 8, alignItems: "center" } },
      filters.map(f => React.createElement('button', {
        key: f, onClick: () => setAlertFilter(f), style: {
          padding: "6px 14px", borderRadius: 99, border: "1px solid " + (alertFilter === f ? "#1B6B3A" : "#E2E8F0"),
          background: alertFilter === f ? "#1B6B3A" : "#fff", color: alertFilter === f ? "#fff" : "#4A5568",
          fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.b, outline: "none", textTransform: "capitalize"
        }
      }, f)),
      React.createElement('div', { style: { flex: 1 } }),
      React.createElement('button', { onClick: () => setAlerts([]), style: { padding: "6px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#D93025", fontSize: 12, cursor: "pointer", fontFamily: FONTS.b, fontWeight: 500 } }, "Clear All"),
      React.createElement('button', { onClick: exportCSV, style: { padding: "6px 14px", borderRadius: 8, border: "1px solid #1B6B3A", background: "#1B6B3A", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: FONTS.b, fontWeight: 500 } }, "Export CSV")
    ),
    // Alert cards
    filtered.map((al, i) => {
      const rc = al.level === "high" ? { bg: "#FEF2F2", border: "#FECACA", text: "#D93025" } : al.level === "med" ? { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706" } : { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A" };
      const isExp = expandedAlert === i;
      return React.createElement('div', {
        key: i, onClick: () => setExpandedAlert(isExp ? null : i), style: {
          background: "#fff", borderRadius: 10, borderLeft: "4px solid " + rc.text, boxShadow: SHADOW, padding: "14px 18px", cursor: "pointer", transition: "all 0.2s"
        }
      },
        React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement('span', { style: { background: rc.bg, color: rc.text, border: "1px solid " + rc.border, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600 } }, al.level.toUpperCase()),
            al.zone && React.createElement('span', { style: { fontSize: 11, color: "#9AA5B4", fontFamily: FONTS.b } }, al.zone),
            React.createElement('span', { style: { fontSize: 11, color: "#9AA5B4", fontFamily: FONTS.d } }, al.time)
          ),
          React.createElement('span', { style: { fontSize: 12, color: "#9AA5B4" } }, isExp ? "▲" : "▼")
        ),
        React.createElement('div', { style: { fontSize: 13, color: "#1A1A2E", fontWeight: 500, marginTop: 6 } }, al.msg),
        isExp && React.createElement('div', { style: { marginTop: 12, padding: 12, background: rc.bg, borderRadius: 8, fontSize: 12, color: "#4A5568" } },
          React.createElement('div', { style: { fontWeight: 600, marginBottom: 4, color: rc.text } }, "Recommended Action:"),
          React.createElement('div', null, actions[al.level] || actions.low),
          React.createElement('div', { style: { marginTop: 8, fontFamily: FONTS.d, fontSize: 10, color: "#9AA5B4" } }, "Sensor ID: SNS-" + String(Math.floor(Math.random() * 99) + 1).padStart(3, "0") + " | Confidence: " + (70 + Math.floor(Math.random() * 25)) + "%")
        )
      );
    })
  );
};

/* ═══════════ ABOUT PAGE ═══════════ */
const About = () => {
  const team = [
    { name: "Divyanshi Shrivastava", role: "Project Lead", color: "#1B6B3A" },
    { name: "Pranjal Dubey", role: "AI/ML Developer", color: "#2E9E5B" },
    { name: "Abhinav Ojha", role: "AI/ML Developer", color: "#7C3AED" },
    { name: "Arvind", role: "Backend Developer", color: "#3B82F6" },
    { name: "Runtime Rebels", role: "Team", color: "#F59E0B" }
  ];
  const problems = [
    { icon: "🏭", title: "Illegal Mining", desc: "Unregulated mining causing irreversible terrain damage across central India" },
    { icon: "🌳", title: "Deforestation", desc: "Rapid vegetation loss threatening carbon absorption capacity" },
    { icon: "⚠️", title: "Terrain Instability", desc: "Subsidence and landslide risks near defense installations" },
    { icon: "📉", title: "Carbon Credit Loss", desc: "Billions in carbon credit value lost due to unmonitored degradation" }
  ];
  const features = [
    { icon: "🛰️", title: "Satellite Intelligence", desc: "Sentinel-2 SAR data for real-time terrain monitoring" },
    { icon: "📊", title: "CAR Index", desc: "Proprietary Carbon Absorption Rate index for vegetation health" },
    { icon: "🤖", title: "AI Risk Engine", desc: "ML-powered risk scoring using multi-sensor fusion" },
    { icon: "🗺️", title: "Terrain Heatmaps", desc: "Canvas-rendered instability maps with zone-level detail" },
    { icon: "💰", title: "Carbon Calculator", desc: "Real-time carbon credit loss estimation and projections" }
  ];
  const techs = ["React", "Vite", "Canvas API", "Sentinel-2 SAR", "IoT Sensors", "TensorFlow", "Python", "Node.js"];
  return React.createElement('div', { style: { maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 } },
    // Hero
    React.createElement('div', { style: { textAlign: "center", padding: "40px 0" } },
      React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 36, fontWeight: 700, color: "#1B6B3A", marginBottom: 8 } }, "TERRAWATCH"),
      React.createElement('div', { style: { fontSize: 16, color: "#4A5568", marginBottom: 16 } }, "Carbon & Terrain Intelligence Platform"),
      React.createElement('div', { style: { display: "inline-block", background: "#E8F5EE", color: "#1B6B3A", padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600 } }, "🏆 Cresciton Hackathon 2026 · PS_CTH02")
    ),
    // Problems
    React.createElement('div', null,
      React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 20, fontWeight: 600, color: "#1A1A2E", marginBottom: 16 } }, "The Problem"),
      React.createElement('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
        problems.map((p, i) => React.createElement('div', { key: i, style: { background: "#fff", borderRadius: 12, boxShadow: SHADOW, padding: 20, border: "1px solid #E2E8F0" } },
          React.createElement('div', { style: { fontSize: 28, marginBottom: 8 } }, p.icon),
          React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 15, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 } }, p.title),
          React.createElement('div', { style: { fontSize: 13, color: "#4A5568", lineHeight: 1.5 } }, p.desc)
        ))
      )
    ),
    // Solution
    React.createElement('div', null,
      React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 20, fontWeight: 600, color: "#1A1A2E", marginBottom: 16 } }, "Our Solution"),
      React.createElement('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 } },
        features.map((f, i) => React.createElement('div', { key: i, style: { background: "#fff", borderRadius: 12, boxShadow: SHADOW, padding: 20, border: "1px solid #E2E8F0", textAlign: "center" } },
          React.createElement('div', { style: { fontSize: 28, marginBottom: 8 } }, f.icon),
          React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 13, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 } }, f.title),
          React.createElement('div', { style: { fontSize: 12, color: "#4A5568", lineHeight: 1.4 } }, f.desc)
        ))
      )
    ),
    // Team
    React.createElement('div', null,
      React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 20, fontWeight: 600, color: "#1A1A2E", marginBottom: 16 } }, "The Team"),
      React.createElement('div', { style: { display: "flex", gap: 16, flexWrap: "wrap" } },
        team.map((m, i) => React.createElement('div', { key: i, style: { flex: 1, minWidth: 140, background: "#fff", borderRadius: 12, boxShadow: SHADOW, padding: 24, textAlign: "center", border: "1px solid #E2E8F0" } },
          React.createElement('div', { style: { width: 56, height: 56, borderRadius: "50%", background: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 18, fontWeight: 700, fontFamily: FONTS.h } }, m.name.split(" ").map(w => w[0]).join("").substring(0, 2)),
          React.createElement('div', { style: { fontFamily: FONTS.b, fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 4 } }, m.name),
          React.createElement('div', { style: { fontSize: 12, color: "#4A5568" } }, m.role)
        ))
      )
    ),
    // Tech stack
    React.createElement('div', null,
      React.createElement('div', { style: { fontFamily: FONTS.h, fontSize: 20, fontWeight: 600, color: "#1A1A2E", marginBottom: 16 } }, "Tech Stack"),
      React.createElement('div', { style: { display: "flex", gap: 10, flexWrap: "wrap" } },
        techs.map(t => React.createElement('span', { key: t, style: { background: "#E8F5EE", color: "#1B6B3A", padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 500 } }, t))
      )
    ),
    React.createElement('div', { style: { textAlign: "center", padding: "24px 0", fontSize: 12, color: "#9AA5B4", fontFamily: FONTS.b } }, "Cresciton Hackathon · KEC · PS_CTH02 · March 2026")
  );
};

/* ═══════════ ROOT APP COMPONENT ═══════════ */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg-main,#F7F9FC); font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; transition: background 0.3s, color 0.3s; color: var(--text-primary); }
  body.dark { --bg-main:#0b0f19; --bg-card:#131b2f; --bg-header:#0d1322; --border:#1e293b; --text-primary:#f8fafc; --text-secondary:#94a3b8; --bg-hover:rgba(255,255,255,0.06); }
  body:not(.dark) { --bg-main:#F7F9FC; --bg-card:#ffffff; --bg-header:#ffffff; --border:#E2E8F0; --text-primary:#0f172a; --text-secondary:#475569; --bg-hover:rgba(0,0,0,0.03); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-main,#F7F9FC); }
  ::-webkit-scrollbar-thumb { background: var(--border,#E2E8F0); border-radius: 3px; }
  @keyframes pulse-live { 0%,100%{box-shadow:0 0 0 0 rgba(27,107,58,0.7)} 50%{box-shadow:0 0 0 6px rgba(27,107,58,0)} }
  .live-dot { animation: pulse-live 1.5s ease-in-out infinite; }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .page-fade { animation: fadeSlideIn 0.35s ease-out; }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .skeleton { background: linear-gradient(90deg,var(--border,#E2E8F0) 25%,var(--bg-main,#F7F9FC) 50%,var(--border,#E2E8F0) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius:8px; }
  @keyframes toastIn { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes toastOut { from{transform:translateX(0);opacity:1} to{transform:translateX(120%);opacity:0} }
  .toast-enter { animation: toastIn 0.3s ease-out forwards; }
  .toast-exit { animation: toastOut 0.3s ease-in forwards; }
  .glass-card { backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); background:rgba(255,255,255,0.75)!important; border:1px solid rgba(255,255,255,0.3)!important; }
  body.dark .glass-card { background:rgba(26,31,46,0.8)!important; border:1px solid rgba(255,255,255,0.08)!important; }
  .hover-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .hover-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.12)!important; }
  @keyframes countUp { from{opacity:0.3} to{opacity:1} }
  .count-anim { animation: countUp 0.4s ease-out; }
`;

const PAGE_TITLES = { dashboard: "Dashboard", terrain: "Terrain Map", analytics: "CAR Analytics", alerts: "Alerts" };
const ToastContainer = ({ toasts, removeToast }) => {
  return React.createElement('div', { style: { position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 12, zIndex: 9999, pointerEvents: "none" } },
    toasts.map(t => React.createElement(Toast, { key: t.id, msg: t.msg, level: t.level, onClose: () => removeToast(t.id) }))
  );
};

export default function App() {
  const [activeZone, setActiveZone] = useState("jharkhand");
  const [activePage, setActivePage] = useState("dashboard");
  const [clock, setClock] = useState(new Date().toLocaleTimeString("en-US", { hour12: false }));
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [alertFilter, setAlertFilter] = useState("all");
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isChatOpen, setChatOpen] = useState(false);
  const [liveZones, setLiveZones] = useState(null);   // zones from backend
  const [nasaEvents, setNasaEvents] = useState([]);    // NASA EONET events
  const [backendOnline, setBackendOnline] = useState(false);

  const addToast = useCallback((msg, level) => {
    setToasts([{ id: Date.now() + Math.random(), msg, level }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (darkMode) document.body.classList.add("dark");
    else document.body.classList.remove("dark");
  }, [darkMode]);

  // ── Load alerts from backend on mount ──
  const initAlerts = useCallback(() => {
    const all = [];
    ZONES_LIST.forEach(z => z.alerts.forEach(al => all.push({ ...al, zone: z.name })));
    return all;
  }, []);
  const [allAlerts, setAllAlerts] = useState(initAlerts);

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllAlerts(data);
          setBackendOnline(true);
        }
      })
      .catch(() => { }); // Backend offline — use local data
  }, []);

  // ── Load NASA EONET events ──
  useEffect(() => {
    fetch('/api/nasa/events')
      .then(r => r.json())
      .then(events => {
        if (Array.isArray(events) && events.length > 0) {
          setNasaEvents(events);
          // Add high-priority NASA events as alerts
          const nasaAlerts = events.slice(0, 3).map(ev => ({
            time: ev.date,
            zone: 'NASA EONET',
            level: ev.category === 'Wildfires' ? 'high' : 'med',
            msg: `🛸 ${ev.title}`,
          }));
          setAllAlerts(prev => [...nasaAlerts, ...prev]);
        }
      })
      .catch(() => { });
  }, []);

  // ── WebSocket — live zone & alert updates from backend ──
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(`ws://${window.location.hostname}:3001`);
      ws.onmessage = (e) => {
        const payload = JSON.parse(e.data);
        if (payload.type === 'ZONES_UPDATE') {
          setLiveZones(payload.zones);
        } else if (payload.type === 'NEW_ALERT') {
          const al = payload.alert;
          setAllAlerts(prev => [al, ...prev]);
          setDashAlerts(prev => [al, ...prev].slice(0, 20));
          if (al.level === 'high' || al.level === 'med') addToast(al.msg, al.level);
        }
      };
      ws.onerror = () => { }; // Silently ignore if backend offline
    } catch (e) { }
    return () => ws && ws.close();
  }, [addToast]);

  // Dashboard live alerts (zone-specific)
  const [dashAlerts, setDashAlerts] = useState([]);

  // Use live backend data if available, fall back to static ZONES_LIST
  const zoneData = liveZones || ZONES_LIST;
  const zone = zoneData.find(z => z.id === activeZone) || zoneData[0];

  // Reset notif on zone switch
  useEffect(() => {
    setNotifDismissed(false);
    setDashAlerts([...zone.alerts]);
  }, [activeZone]);

  // Clock
  useEffect(() => {
    const iv = setInterval(() => setClock(new Date().toLocaleTimeString("en-US", { hour12: false })), 1000);
    return () => clearInterval(iv);
  }, []);

  // Dashboard live alerts (fallback when backend offline)
  useEffect(() => {
    if (backendOnline) return; // Backend WS handles this
    const iv = setInterval(() => {
      const msg = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
      const lvls = ["high", "med", "low"];
      const lvl = zone.riskLevel === "HIGH" ? lvls[Math.floor(Math.random() * 2)] : zone.riskLevel === "MEDIUM" ? lvls[1] : lvls[2];
      const t = new Date().toLocaleTimeString("en-US", { hour12: false });
      setDashAlerts(prev => [{ time: t, msg, level: lvl }, ...prev].slice(0, 20));
      if (lvl === "high" || lvl === "med") addToast(msg, lvl);
    }, 45000);
    return () => clearInterval(iv);
  }, [zone, addToast, backendOnline]);

  // Alerts page auto-add every 45s (fallback when backend offline)
  useEffect(() => {
    if (backendOnline) return;
    const iv = setInterval(() => {
      const rz = ZONES_LIST[Math.floor(Math.random() * ZONES_LIST.length)];
      const msg = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
      const lvls = ["high", "med", "low"];
      const lvl = rz.riskLevel === "HIGH" ? lvls[Math.floor(Math.random() * 2)] : rz.riskLevel === "MEDIUM" ? lvls[Math.floor(Math.random() * 2) + 1] : lvls[2];
      const t = new Date().toLocaleTimeString("en-US", { hour12: false });
      setAllAlerts(prev => [{ time: t, msg, level: lvl, zone: rz.name }, ...prev]);
    }, 45000);
    return () => clearInterval(iv);
  }, [backendOnline]);

  return React.createElement(React.Fragment, null,
    React.createElement('style', null, globalCSS),
    React.createElement('div', { style: { display: "flex", width: "100vw", height: "100vh", overflow: "hidden" } },
      React.createElement(Sidebar, { activePage, setActivePage, activeZone, setActiveZone, alertCount: dashAlerts.filter(a => a.level === 'high').length }),
      React.createElement('div', { style: { flex: 1, marginLeft: 220, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", position: "relative" } },
        React.createElement(Header, { pageTitle: PAGE_TITLES[activePage] || "Dashboard", zone, clock, darkMode, setDarkMode, setChatOpen }),
        React.createElement(NotifStrip, { zone, dismissed: notifDismissed, onDismiss: () => setNotifDismissed(true) }),
        React.createElement('div', { key: activePage, className: "page-fade", style: { flex: 1, overflow: "auto", padding: 24 } },
          activePage === "dashboard" && React.createElement(Dashboard, { zone, alerts: dashAlerts, setActivePage }),
          activePage === "terrain" && React.createElement(TerrainMapPage, { zone, activeZone, setActiveZone }),
          activePage === "analytics" && React.createElement(CARAnalytics, { zone }),
          activePage === "alerts" && React.createElement(AlertsPage, { allAlerts, setAlerts: setAllAlerts, alertFilter, setAlertFilter, expandedAlert, setExpandedAlert })
        ),
        React.createElement('div', { style: { height: 32, borderTop: "1px solid var(--border)", background: "var(--bg-header)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, fontFamily: FONTS.b } },
          React.createElement('span', null, "TERRAWATCH Platform v2.0"),
          React.createElement('span', null, "RUNTIME REBELS · PS_CTH02 · CRESCITON · KEC"),
          React.createElement('span', null, "Carbon & Terrain Intelligence Platform")
        )
      ),
      React.createElement(Chatbot, { isOpen: isChatOpen, onClose: () => setChatOpen(false), zone }),
      React.createElement(ToastContainer, { toasts, removeToast })
    )
  );
}
