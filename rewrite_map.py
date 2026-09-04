import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Find the start of RiskMap
start_idx = content.find('function RiskMap() {')
if start_idx == -1:
    print("Could not find RiskMap")
    exit(1)

# Find the end of RiskMap by finding the next function
end_idx = content.find('function Records() {', start_idx)
if end_idx == -1:
    print("Could not find Records")
    exit(1)

before = content[:start_idx]
after = content[end_idx:]

new_riskmap = """function RiskMap() {
  const localAreas = [
    { id: "D1", name: "Anand", dist: 0, cases: 1124, mortality: 38, disease: "Foot & Mouth Disease", level: "critical" as AlertLevel, x: 50, y: 50 },
    { id: "D2", name: "Vadodara", dist: 42, cases: 387, mortality: 14, disease: "Foot & Mouth Disease", level: "critical" as AlertLevel, x: 58, y: 63 },
    { id: "D3", name: "Kheda", dist: 28, cases: 214, mortality: 6, disease: "Lumpy Skin Disease", level: "warning" as AlertLevel, x: 44, y: 38 },
    { id: "D4", name: "Ahmedabad", dist: 55, cases: 189, mortality: 4, disease: "Lumpy Skin Disease", level: "warning" as AlertLevel, x: 34, y: 28 },
    { id: "D5", name: "Bharuch", dist: 68, cases: 96, mortality: 2, disease: "Foot & Mouth Disease", level: "watch" as AlertLevel, x: 46, y: 74 },
    { id: "D6", name: "Panchmahals", dist: 85, cases: 74, mortality: 0, disease: "Brucellosis", level: "watch" as AlertLevel, x: 70, y: 57 },
    { id: "D7", name: "Mahisagar", dist: 72, cases: 40, mortality: 1, disease: "Lumpy Skin Disease", level: "watch" as AlertLevel, x: 63, y: 42 },
    { id: "D8", name: "Gandhinagar", dist: 62, cases: 31, mortality: 0, disease: "Foot & Mouth Disease", level: "watch" as AlertLevel, x: 30, y: 20 },
  ];

  const uniqueDiseases = Array.from(new Set(localAreas.map(a => a.disease)));
  const [diseaseFilter, setDiseaseFilter] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<typeof localAreas[0] | null>(null);
  const [hoveredArea, setHoveredArea] = useState<typeof localAreas[0] | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 46 });
  const MIN_ZOOM = 1; const MAX_ZOOM = 5;
  const VW = 100; const VH = 92;

  const viewBox = `${pan.x - VW / 2 / zoom} ${pan.y - VH / 2 / zoom} ${VW / zoom} ${VH / zoom}`;

  const handleZoomIn = () => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z * 1.5).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z / 1.5).toFixed(2))));
  const handleReset = () => { setZoom(1); setPan({ x: 50, y: 46 }); };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn(); else handleZoomOut();
  };

  const [radiusKm, setRadiusKm] = useState(150);
  const PRESET_RADII = [50, 100, 150];
  const KM_TO_SVG = 38 / 150;
  const activeRadiusSvg = radiusKm * KM_TO_SVG;

  const visibleAreas = (diseaseFilter === "All" ? localAreas : localAreas.filter(a => a.disease === d))
    .filter(a => a.dist <= radiusKm);
  const maxCases = Math.max(...localAreas.map(a => a.cases));

  const CX = 50; const CY = 50;

  const districtPolygons = [
    { id: "D8", points: "22,8 42,6 46,22 36,28 22,24" },
    { id: "D4", points: "22,24 36,28 32,40 18,42 14,32" },
    { id: "D3", points: "36,28 46,22 50,36 44,44 32,40" },
    { id: "D1", points: "46,22 62,20 64,36 56,46 50,36" },
    { id: "D7", points: "62,20 76,18 78,32 70,40 64,36" },
    { id: "D6", points: "64,36 78,32 82,50 72,58 62,48" },
    { id: "D2", points: "50,36 62,48 60,62 48,68 44,54 56,46" },
    { id: "D5", points: "44,54 48,68 46,82 32,84 28,70 38,60" },
  ];

  return (
    <div className={`relative flex flex-col overflow-hidden bg-[var(--background)] transition-all ${fullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[600px] rounded-2xl border border-[var(--border)] shadow-sm'}`}>
      
      {/* SVG Map Layer */}
      <div className="absolute inset-0 z-0 bg-slate-50 dark:bg-zinc-950">
        <svg viewBox={viewBox} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ display: "block" }} onWheel={handleWheel}>
          <defs>
            <radialGradient id="epicenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <filter id="shadow"><feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodOpacity="0.1" /></filter>
          </defs>

          {/* Minimalist Grid */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(v => (
            <g key={v} opacity="0.06">
              <line x1={v} y1="0" x2={v} y2="92" stroke="var(--foreground)" strokeWidth="0.2" />
              <line x1="0" y1={v} x2="100" y2={v} stroke="var(--foreground)" strokeWidth="0.2" />
            </g>
          ))}

          {/* Choropleth district fills */}
          {districtPolygons.map(dp => {
            const area = localAreas.find(a => a.id === dp.id);
            if (!area) return null;
            const isVisible = visibleAreas.includes(area);
            const intensity = area.cases / maxCases;
            const color = ALERT_COLORS[area.level];
            return (
              <polygon
                key={dp.id}
                points={dp.points}
                fill={isVisible ? color : "var(--muted)"}
                fillOpacity={isVisible ? 0.05 + intensity * 0.15 : 0.05}
                stroke={isVisible ? color : "var(--border)"}
                strokeWidth={selectedArea?.id === area.id ? 0.8 : 0.3}
                strokeOpacity={isVisible ? 0.8 : 0.4}
                style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                onClick={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
                onMouseEnter={() => setHoveredArea(area)}
                onMouseLeave={() => setHoveredArea(null)}
              />
            );
          })}

          {/* Rivers */}
          <path d="M30,6 Q33,22 33,40 Q33,58 30,78" stroke="#3b82f6" strokeWidth="0.4" fill="none" opacity="0.3" strokeLinecap="round" />
          <path d="M14,42 Q28,47 42,50 Q54,53 64,62" stroke="#3b82f6" strokeWidth="0.3" fill="none" opacity="0.2" strokeLinecap="round" />
          
          {/* Radius rings */}
          <circle cx={CX} cy={CY} r={activeRadiusSvg} fill="rgba(99,102,241,0.03)" stroke="var(--foreground)" strokeWidth="0.2" strokeDasharray="1,1.5" opacity="0.4" />
          
          {/* Active markers */}
          {visibleAreas.map(area => {
            const isSelected = selectedArea?.id === area.id;
            const isHovered = hoveredArea?.id === area.id;
            const r = 1.2 + (area.cases / maxCases) * 2;
            return (
              <g key={area.id} style={{ cursor: "pointer" }}
                onClick={() => setSelectedArea(isSelected ? null : area)}
                onMouseEnter={() => setHoveredArea(area)}
                onMouseLeave={() => setHoveredArea(null)}>
                {isSelected && <circle cx={area.x} cy={area.y} r={r + 1} fill="none" stroke={ALERT_COLORS[area.level]} strokeWidth="0.6" opacity="0.6" />}
                <circle cx={area.x} cy={area.y} r={r} fill={ALERT_COLORS[area.level]} stroke="var(--background)" strokeWidth="0.5" filter="url(#shadow)" opacity={isSelected || isHovered ? 1 : 0.9} />
                <text x={area.x} y={area.y + r + 2.5} fontSize="1.8" fill="var(--foreground)" fontFamily="'Inter', sans-serif" fontWeight="500" textAnchor="middle" opacity={isSelected || isHovered ? 1 : 0.7}>{area.name}</text>
              </g>
            );
          })}

          {/* Epicenter */}
          <g>
            <circle cx={CX} cy={CY} r="15" fill="url(#epicenterGlow)" />
            <circle cx={CX} cy={CY} r="1.2" fill="var(--foreground)" stroke="var(--background)" strokeWidth="0.4" />
          </g>
        </svg>
      </div>

      {/* Floating Controls Overlay - Mapbox Style */}
      
      {/* Top Left: Title & Filters Card */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        <div className="bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-lg p-4 w-[340px]">
          <h3 className="font-semibold text-[var(--foreground)] text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>Local Risk Map</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Anand, Gujarat Epicenter · {visibleAreas.length} districts in view</p>
          
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Disease Filter</span>
              <div className="flex gap-1.5 flex-wrap">
                {["All", ...uniqueDiseases].map(d => {
                  const active = diseaseFilter === d;
                  const col = d === "All" ? "var(--foreground)" : (localAreas.find(a => a.disease === d) ? ALERT_COLORS[localAreas.find(a => a.disease === d)!.level] : "var(--foreground)");
                  return (
                    <button key={d} onClick={() => { setDiseaseFilter(d); setSelectedArea(null); }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all"
                      style={{ background: active ? col : "transparent", color: active ? "var(--background)" : "var(--foreground)", borderColor: active ? col : "var(--border)" }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Radius ({radiusKm} km)</span>
              </div>
              <input type="range" min={10} max={150} step={5} value={radiusKm}
                onChange={e => { setRadiusKm(Number(e.target.value)); setSelectedArea(null); }}
                className="w-full accent-[var(--primary)] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Right: Zoom & Fullscreen Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-lg shadow-md flex flex-col overflow-hidden">
          {[
            { label: "+", action: handleZoomIn, disabled: zoom >= MAX_ZOOM },
            { label: "−", action: handleZoomOut, disabled: zoom <= MIN_ZOOM },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
              className="w-9 h-9 flex items-center justify-center text-lg font-medium transition-colors hover:bg-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed border-b border-[var(--border)] last:border-0"
              style={{ color: "var(--foreground)" }}>
              {btn.label}
            </button>
          ))}
        </div>
        <button onClick={() => setFullscreen(!fullscreen)}
          className="w-9 h-9 bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-lg shadow-md flex items-center justify-center transition-colors hover:bg-[var(--muted)]"
          title="Toggle Fullscreen" style={{ color: "var(--foreground)" }}>
          {fullscreen ? "↙" : "⛶"}
        </button>
      </div>

      {/* Right Sidebar: District Details (Floating) */}
      <div className={`absolute top-4 bottom-4 right-16 w-72 bg-[var(--card)]/85 backdrop-blur-xl border border-[var(--border)] rounded-xl shadow-xl transition-transform duration-300 flex flex-col overflow-hidden ${selectedArea ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'}`}>
        {selectedArea && (
          <>
            <div className="px-5 py-4 border-b border-[var(--border)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ background: ALERT_COLORS[selectedArea.level] }} />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg" style={{ fontFamily: "'Outfit', sans-serif", color: ALERT_COLORS[selectedArea.level] }}>{selectedArea.name}</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">{selectedArea.dist === 0 ? "Epicenter" : `${selectedArea.dist} km away`}</p>
                </div>
                <button onClick={() => setSelectedArea(null)} className="w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[10px] hover:bg-[var(--muted)] transition-colors">✕</button>
              </div>
              <div className="relative z-10 mt-3"><AlertBadge level={selectedArea.level} /></div>
            </div>
            
            <div className="px-5 py-5 flex flex-col gap-4 flex-1 overflow-y-auto">
              <div>
                <p className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif", color: ALERT_COLORS[selectedArea.level] }}>{selectedArea.cases.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">ACTIVE CASES</p>
              </div>
              
              <div className="space-y-3 mt-2">
                {[
                  { label: "Mortality", val: selectedArea.mortality, mono: true },
                  { label: "Fatality Rate", val: selectedArea.mortality > 0 ? `${((selectedArea.mortality / selectedArea.cases) * 100).toFixed(1)}%` : "0%", mono: true },
                  { label: "Primary Disease", val: selectedArea.disease, mono: false },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-[var(--border)]/50 last:border-0">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{s.label}</span>
                    <span className="text-sm font-medium text-[var(--foreground)]" style={s.mono ? { fontFamily: "'Inter', sans-serif" } : {}}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-[var(--muted)] border-t border-[var(--border)]">
              <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
                style={{ background: ALERT_COLORS[selectedArea.level], fontFamily: "'Inter', sans-serif" }}>
                File Field Report
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
"""

with open('src/App.tsx', 'w') as f:
    f.write(before + new_riskmap + "\n" + after)
