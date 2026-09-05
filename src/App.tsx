import { useState, useRef, useEffect } from "react";

type Tab = "dashboard" | "outbreak" | "report" | "records" | "advisories";
type AlertLevel = "critical" | "warning" | "watch" | "safe";
type Language = "en" | "hi" | "ta" | "te" | "mr";

const RADIUS_KM = 150;
const EPICENTER = "Ranchi District, Jharkhand";

interface OutbreakAlert {
  id: string;
  disease: string;
  location: string;
  region: string;
  level: AlertLevel;
  cases: number;
  mortality: number;
  reported: string;
  distKm: number;
  lat: number;
  lng: number;
}

interface AnimalRecord {
  id: string;
  species: string;
  tagId: string;
  farmer: string;
  village: string;
  lastVaccine: string;
  vaccineType: string;
  nextDue: string;
  status: "current" | "due" | "overdue";
}

interface Advisory {
  id: string;
  disease: string;
  level: AlertLevel;
  regions: string[];
  issued: string;
  translations: Record<Language, string>;
}

const ALERT_COLORS: Record<AlertLevel, string> = {
  critical: "#d32f2f",  /* firebrick-100 */
  warning: "#ee8924",  /* darkorange-100 */
  watch: "#d97634",  /* chocolate-100 — warm amber */
  safe: "#2e7d32",  /* darkgreen-100 */
};

const ALERT_BG: Record<AlertLevel, string> = {
  critical: "#fce4ec",  /* lavenderblush-100 */
  warning: "#fff3e0",  /* oldlace-100 */
  watch: "#fef7f2",  /* seashell-100 */
  safe: "#e8f5e9",  /* honeydew-100 */
};

const ALERT_BORDER: Record<AlertLevel, string> = {
  critical: "#f8bbd0",
  warning: "#ffcc80",
  watch: "#e5d4c5",  /* antiquewhite-100 */
  safe: "#c8e6c9",
};

// All outbreaks within 150 km of Ranchi, Jharkhand
const outbreaks: OutbreakAlert[] = [
  { id: "OB-2024-001", disease: "Foot & Mouth Disease", location: "Ranchi District", region: "Jharkhand", level: "critical" as AlertLevel, cases: 1124, mortality: 38, reported: "2h ago", distKm: 0, lat: 50, lng: 50 },
  { id: "OB-2024-002", disease: "Foot & Mouth Disease", location: "Dhanbad District", region: "Jharkhand", level: "critical" as AlertLevel, cases: 387, mortality: 14, reported: "3h ago", distKm: 42, lat: 58, lng: 62 },
  { id: "OB-2024-003", disease: "Lumpy Skin Disease", location: "Jamshedpur District", region: "Jharkhand", level: "warning" as AlertLevel, cases: 214, mortality: 6, reported: "6h ago", distKm: 28, lat: 44, lng: 40 },
  { id: "OB-2024-004", disease: "Lumpy Skin Disease", location: "Bokaro District", region: "Jharkhand", level: "warning" as AlertLevel, cases: 189, mortality: 4, reported: "8h ago", distKm: 55, lat: 36, lng: 30 },
  { id: "OB-2024-005", disease: "Foot & Mouth Disease", location: "Hazaribagh District", region: "Jharkhand", level: "watch" as AlertLevel, cases: 96, mortality: 2, reported: "14h ago", distKm: 68, lat: 48, lng: 72 },
  { id: "OB-2024-006", disease: "Brucellosis", location: "Deoghar", region: "Jharkhand", level: "watch" as AlertLevel, cases: 74, mortality: 0, reported: "1d ago", distKm: 85, lat: 68, lng: 55 },
  { id: "OB-2024-007", disease: "Lumpy Skin Disease", location: "Giridih District", region: "Jharkhand", level: "watch" as AlertLevel, cases: 40, mortality: 1, reported: "1d ago", distKm: 72, lat: 62, lng: 42 },
  { id: "OB-2024-008", disease: "FMD (Suspected)", location: "Palamu", region: "Jharkhand", level: "watch" as AlertLevel, cases: 31, mortality: 0, reported: "2d ago", distKm: 62, lat: 32, lng: 22 },
].filter(o => o.distKm <= RADIUS_KM);

// Animal records within 150 km of Ranchi, Jharkhand
const animalRecords: AnimalRecord[] = [
  { id: "REC-001", species: "Cattle", tagId: "JH-BV-00412", farmer: "Ramesh Patel", village: "Ranchi Taluka", lastVaccine: "2024-03-15", vaccineType: "FMD Trivalent", nextDue: "2024-09-15", status: "due" },
  { id: "REC-002", species: "Buffalo", tagId: "JH-BF-08821", farmer: "Naresh Desai", village: "Dhanbad Rural", lastVaccine: "2024-06-02", vaccineType: "HS + BQ Combo", nextDue: "2024-12-02", status: "current" },
  { id: "REC-003", species: "Cattle", tagId: "JH-BV-03341", farmer: "Hasmukh Chauhan", village: "Jamshedpur Taluka", lastVaccine: "2023-11-20", vaccineType: "FMD Trivalent", nextDue: "2024-05-20", status: "overdue" },
  { id: "REC-004", species: "Goat", tagId: "JH-CA-00987", farmer: "Prabhaben Solanki", village: "Bokaro Dehat", lastVaccine: "2024-05-30", vaccineType: "PPR Vaccine", nextDue: "2024-11-30", status: "current" },
  { id: "REC-005", species: "Cattle", tagId: "JH-BV-12290", farmer: "Dinesh Vasava", village: "Hazaribagh Taluka", lastVaccine: "2024-07-01", vaccineType: "Lumpy Skin (LSD)", nextDue: "2024-08-01", status: "overdue" },
  { id: "REC-006", species: "Sheep", tagId: "JH-OV-44521", farmer: "Jayesh Rathod", village: "Deoghar Block", lastVaccine: "2024-04-10", vaccineType: "Enterotoxaemia", nextDue: "2024-10-10", status: "current" },
  { id: "REC-007", species: "Buffalo", tagId: "JH-BF-07712", farmer: "Savitaben Parmar", village: "Giridih District", lastVaccine: "2024-02-18", vaccineType: "FMD Trivalent", nextDue: "2024-08-18", status: "overdue" },
  { id: "REC-008", species: "Cattle", tagId: "JH-BV-09933", farmer: "Mukesh Adesara", village: "Palamu Rural", lastVaccine: "2024-06-25", vaccineType: "Lumpy Skin (LSD)", nextDue: "2024-12-25", status: "current" },
];

const LANG_LABELS: Record<Language, string> = { en: "English", hi: "हिन्दी", ta: "தமிழ்", te: "తెలుగు", mr: "मराठी" };

// Advisories scoped to 150 km radius — Jharkhand districts
const advisories: Advisory[] = [
  {
    id: "ADV-2024-009",
    disease: "Foot & Mouth Disease",
    level: "critical",
    regions: ["Ranchi", "Dhanbad", "Jamshedpur", "Hazaribagh", "Palamu"],
    issued: "2024-09-04",
    translations: {
      en: "CRITICAL ALERT: FMD active across Ranchi, Dhanbad, and Jamshedpur districts (150 km zone). Immediately quarantine affected herds. Restrict all livestock movement between districts. Mass vaccination drive begins September 6 under NADCP. Contact your block veterinary officer.",
      hi: "गंभीर चेतावनी: आणंद, वडोदरा और खेड़ा जिलों में FMD सक्रिय (150 किमी क्षेत्र)। प्रभावित पशुओं को तुरंत अलग करें। जिलों के बीच पशु आवाजाही पर तत्काल प्रतिबंध लगाएं। NADCP के तहत 6 सितंबर से सामूहिक टीकाकरण शुरू।",
      ta: "அவசர எச்சரிக்கை: ஆனந்த், வடோதரா, கேடா மாவட்டங்களில் FMD செயலில் உள்ளது. பாதிக்கப்பட்ட மந்தைகளை உடனடியாக தனிமைப்படுத்தவும். மாவட்டங்களுக்கிடையே கால்நடை நடமாட்டத்தை கட்டுப்படுத்தவும்.",
      te: "అత్యవసర హెచ్చరిక: ఆనంద్, వడోదర, ఖేడా జిల్లాల్లో FMD చురుకుగా ఉంది. ప్రభావిత మందలను వెంటనే క్వారంటైన్ చేయండి. జిల్లాల మధ్య పశువుల రవాణా నిషేధించండి.",
      mr: "गंभीर इशारा: आणंद, वडोदरा आणि खेडा जिल्ह्यांमध्ये FMD सक्रिय (150 किमी क्षेत्र). बाधित कळपांना तात्काळ विलग करा. जिल्ह्यांमधील पशुधन वाहतूक तात्काळ बंद करा.",
    },
  },
  {
    id: "ADV-2024-008",
    disease: "Lumpy Skin Disease",
    level: "warning",
    regions: ["Jamshedpur", "Bokaro", "Giridih", "Dhanbad"],
    issued: "2024-09-04",
    translations: {
      en: "WARNING: Lumpy Skin Disease spreading in Jamshedpur and Bokaro districts (within 150 km of Ranchi). Vaccinate all cattle with Goat Pox vaccine (surrogate) immediately. Halt all cattle fairs, haats, and markets. Report lumps, fever, or sudden deaths to block veterinary officer within 6 hours.",
      hi: "चेतावनी: खेड़ा और अहमदाबाद जिलों में लम्पी त्वचा रोग फैल रहा है (आणंद से 150 किमी के भीतर)। सभी मवेशियों को तुरंत बकरी चेचक वैक्सीन दें। सभी पशु मेले और हाट बंद करें।",
      ta: "எச்சரிக்கை: கேடா மற்றும் அகமதாபாத் மாவட்டங்களில் LSD பரவுகிறது. அனைத்து மாடுகளுக்கும் ஆட்டுபெரியம்மை தடுப்பூசி போடவும். கால்நடை சந்தைகள் அனைத்தும் மூடவும்.",
      te: "హెచ్చరిక: ఖేడా, అహ్మదాబాద్ జిల్లాల్లో LSD వ్యాపిస్తోంది. అన్ని పశువులకు మేక అమ్మవారు టీకా వేయించండి. పశువుల సంతలు, మేళాలు నిలిపివేయండి.",
      mr: "इशारा: खेडा आणि अहमदाबाद जिल्ह्यांत LSD पसरत आहे. सर्व जनावरांना तात्काळ शेळी देवी लस द्या. पशू मेळावे व हाट बंद करा.",
    },
  },
  {
    id: "ADV-2024-007",
    disease: "Brucellosis",
    level: "watch",
    regions: ["Deoghar", "Dhanbad"],
    issued: "2024-09-03",
    translations: {
      en: "WATCH: Brucellosis cases reported in Deoghar district (85 km from Ranchi). Test all breeding cattle and buffaloes. Isolate animals with abortions or retained placentae. Wear gloves when assisting births. Report to nearest veterinary officer.",
      hi: "निगरानी: पंचमहल जिले में ब्रुसेलोसिस के मामले (आणंद से 85 किमी)। सभी प्रजनन पशुओं की जांच करें। गर्भपात या जेर रुके पशुओं को अलग करें। प्रसव सहायता में दस्ताने पहनें।",
      ta: "கவனிப்பு: பஞ்சமஹால் மாவட்டத்தில் Brucellosis (ஆனந்திலிருந்து 85 கிமீ). இனப்பெருக்க மாடுகளை பரிசோதிக்கவும். கருக்கலைப்பு நடந்த விலங்குகளை தனிமைப்படுத்தவும்.",
      te: "జాగ్రత్త: పంచమహల్ జిల్లాలో Brucellosis కేసులు (ఆనంద్ నుండి 85 km). అన్ని పెంపుడు పశువులను పరీక్షించండి. అబార్షన్ జరిగిన జంతువులను వేరుచేయండి.",
      mr: "लक्ष ठेवा: पंचमहाल जिल्ह्यात Brucellosis (आणंदपासून 85 किमी). सर्व प्रजनन जनावरांची तपासणी करा. गर्भपात झालेल्या जनावरांना वेगळे करा.",
    },
  },
];

const SPECIES_ICONS: Record<string, string> = {
  Cattle: "🐄",
  Buffalo: "🐃",
  Goat: "🐐",
  Sheep: "🐑",
  Poultry: "🐔",
};

function AlertBadge({ level }: { level: AlertLevel }) {
  return (
    <span
      className="status-badge px-2 py-0.5 rounded font-medium"
      style={{
        color: ALERT_COLORS[level],
        background: ALERT_BG[level],
        border: `1px solid ${ALERT_BORDER[level]}`,
      }}
    >
      {level === "critical" && <span className="pulse-critical inline-block mr-1">●</span>}
      {level}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5 flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
      <span className="text-3xl font-bold tracking-tight" style={{ color: color || "var(--foreground)", fontFamily: "'Outfit', sans-serif" }}>{value}</span>
      {sub && <span className="text-xs text-[var(--muted-foreground)]">{sub}</span>}
    </div>
  );
}

function Dashboard() {
  const criticalCount = outbreaks.filter(o => o.level === "critical").length;
  const totalCases = outbreaks.reduce((s, o) => s + o.cases, 0);
  const totalMortality = outbreaks.reduce((s, o) => s + o.mortality, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Critical banner */}
      {criticalCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <span className="text-red-600 text-xl pulse-critical mt-0.5">⚠</span>
          <div>
            <p className="font-semibold text-red-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {criticalCount} Active Critical Outbreak{criticalCount > 1 ? "s" : ""} Requiring Immediate Action
            </p>
            <p className="text-sm text-red-600 mt-0.5">FMD active in Ranchi and Dhanbad within the 150 km zone. Containment advisories issued for all 8 affected districts under NADCP.</p>
          </div>
        </div>
      )}

      {/* Stats grid — all 5 equal */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Active Outbreaks" value={outbreaks.length} sub={`Within ${RADIUS_KM} km · ${EPICENTER}`} color="#dc2626" />
        <StatCard label="Total Cases (7d)" value={totalCases.toLocaleString()} sub="+18% vs prior week" color="#ea580c" />
        <StatCard label="Mortality Events" value={totalMortality.toLocaleString()} sub="Case fatality: 22.1%" color="#d97706" />
        <StatCard label="Animals Monitored" value="5,84,210" sub="Updated 15 min ago" color="var(--foreground)" />
        <StatCard label="Reports (24h)" value="1,247" sub="892 from mobile" />
      </div>

      {/* Local risk map */}
      <RiskMap />
    </div>
  );
}

function OutbreakAlerts() {
  const criticalCount = outbreaks.filter(o => o.level === "critical").length;
  const totalCases = outbreaks.reduce((s, o) => s + o.cases, 0);
  const totalMortality = outbreaks.reduce((s, o) => s + o.mortality, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Active Outbreaks</span>
          <span className="text-3xl font-bold" style={{ color: "#d32f2f", fontFamily: "'Outfit', sans-serif" }}>{outbreaks.length}</span>
          <span className="text-xs text-[var(--muted-foreground)]">{criticalCount} critical · within {RADIUS_KM} km</span>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Total Cases</span>
          <span className="text-3xl font-bold" style={{ color: "#ee8924", fontFamily: "'Outfit', sans-serif" }}>{totalCases.toLocaleString()}</span>
          <span className="text-xs text-[var(--muted-foreground)]">Across Jharkhand zone</span>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Mortality</span>
          <span className="text-3xl font-bold" style={{ color: "#d97634", fontFamily: "'Outfit', sans-serif" }}>{totalMortality}</span>
          <span className="text-xs text-[var(--muted-foreground)]">Case fatality rate: {((totalMortality / totalCases) * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Outbreak list */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Active Outbreak Alerts — {RADIUS_KM} km Zone
          </h3>
          <span className="status-badge px-2 py-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">NADCP · AI Triage Active</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {outbreaks.map(ob => (
            <div key={ob.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[var(--muted)] transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ALERT_COLORS[ob.level] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-[var(--foreground)]">{ob.disease}</span>
                  <AlertBadge level={ob.level} />
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5 font-mono">
                  {ob.id} · {ob.location} · {ob.distKm === 0 ? "Epicenter" : `${ob.distKm} km`}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-[var(--foreground)]">{ob.cases.toLocaleString()} cases</div>
                <div className="text-xs text-[var(--muted-foreground)]">{ob.mortality} deaths · {ob.reported}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportForm({ submitted, setSubmitted }: { submitted: boolean; setSubmitted: (v: boolean) => void }) {
  const [species, setSpecies] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);

  const SYMPTOM_LIST = ["Fever", "Nasal discharge", "Blistering/sores", "Sudden death", "Lameness", "Respiratory distress", "Diarrhea", "Loss of appetite", "Skin lesions", "Neurological signs", "Abortions", "Swollen lymph nodes"];

  const toggleSymptom = (s: string) => setSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-8 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-2xl">✓</div>
          <h3 className="font-semibold text-lg text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>Report Submitted</h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">Your report has been received and queued for AI triage. Reference ID:</p>
          <span className="font-mono text-sm bg-[var(--muted)] px-3 py-1.5 rounded text-[var(--foreground)]">RPT-{Date.now().toString().slice(-8)}</span>
          <p className="text-xs text-[var(--muted-foreground)]">A district veterinary officer will review within 2 hours. For emergencies call DAHD helpline: <strong>1800-180-1551</strong></p>
          <button onClick={() => { setSubmitted(false); setSpecies(""); setSymptoms([]); }} className="mt-2 px-5 py-2 rounded bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">Submit Another Report</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 text-sm text-amber-800">
        <strong>Field Report Form</strong> — Works offline. Reports sync automatically when connectivity is restored.
      </div>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 flex flex-col gap-5">
        <h3 className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>Symptom & Mortality Report</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Farmer / Reporter Name</label>
            <input className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" placeholder="Full name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Village / Location</label>
            <input className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" placeholder="Village name or GPS coordinates" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Animal Species</label>
            <select value={species} onChange={e => setSpecies(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition">
              <option value="">Select species</option>
              {Object.entries(SPECIES_ICONS).map(([sp, icon]) => <option key={sp} value={sp}>{icon} {sp}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Animals Affected</label>
            <input type="number" className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" placeholder="Number of animals" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Deaths (last 48h)</label>
            <input type="number" className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" placeholder="Mortality count" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Onset Date</label>
            <input type="date" className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Observed Symptoms (select all that apply)</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {SYMPTOM_LIST.map(sym => (
              <button
                key={sym}
                onClick={() => toggleSymptom(sym)}
                className="text-left text-sm px-3 py-2 rounded border transition-all"
                style={{
                  background: symptoms.includes(sym) ? "var(--secondary)" : "var(--background)",
                  borderColor: symptoms.includes(sym) ? "var(--accent)" : "var(--border)",
                  color: symptoms.includes(sym) ? "var(--primary)" : "var(--foreground)",
                  fontWeight: symptoms.includes(sym) ? 500 : 400,
                }}
              >
                {symptoms.includes(sym) ? "✓ " : ""}{sym}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Additional Notes</label>
          <textarea rows={3} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition resize-none" placeholder="Describe any other observations, recent movements, or contact with other herds..." />
        </div>

        <div className="flex gap-3 pt-1">
          <button className="px-4 py-2.5 rounded text-sm border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">
            Save Offline
          </button>
        </div>
      </div>
    </div>
  );
}

function RiskMap() {
  const localAreas = [
    { id: "D1", name: "Ranchi", dist: 0, cases: 1124, mortality: 38, disease: "Foot & Mouth Disease", level: "critical" as AlertLevel, x: 50, y: 50 },
    { id: "D2", name: "Dhanbad", dist: 42, cases: 387, mortality: 14, disease: "Foot & Mouth Disease", level: "critical" as AlertLevel, x: 58, y: 63 },
    { id: "D3", name: "Jamshedpur", dist: 28, cases: 214, mortality: 6, disease: "Lumpy Skin Disease", level: "warning" as AlertLevel, x: 44, y: 38 },
    { id: "D4", name: "Bokaro", dist: 55, cases: 189, mortality: 4, disease: "Lumpy Skin Disease", level: "warning" as AlertLevel, x: 34, y: 28 },
    { id: "D5", name: "Hazaribagh", dist: 68, cases: 96, mortality: 2, disease: "Foot & Mouth Disease", level: "watch" as AlertLevel, x: 46, y: 74 },
    { id: "D6", name: "Deoghar", dist: 85, cases: 74, mortality: 0, disease: "Brucellosis", level: "watch" as AlertLevel, x: 70, y: 57 },
    { id: "D7", name: "Giridih", dist: 72, cases: 40, mortality: 1, disease: "Lumpy Skin Disease", level: "watch" as AlertLevel, x: 63, y: 42 },
    { id: "D8", name: "Palamu", dist: 62, cases: 31, mortality: 0, disease: "Foot & Mouth Disease", level: "watch" as AlertLevel, x: 30, y: 20 },
  ];

  const uniqueDiseases = Array.from(new Set(localAreas.map(a => a.disease)));
  const [diseaseFilter, setDiseaseFilter] = useState<string>("All");
  const [selectedArea, setSelectedArea] = useState<typeof localAreas[0] | null>(null);
  const [hoveredArea, setHoveredArea] = useState<typeof localAreas[0] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showRings, setShowRings] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 46 }); // viewBox center
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

  // Dynamic radius
  const [radiusKm, setRadiusKm] = useState(150);
  const PRESET_RADII = [50, 100, 150];
  const KM_TO_SVG = 38 / 150; // 150km = 38 SVG units
  const activeRadiusSvg = radiusKm * KM_TO_SVG;

  const visibleAreas = (diseaseFilter === "All" ? localAreas : localAreas.filter(a => a.disease === diseaseFilter))
    .filter(a => a.dist <= radiusKm);
  const maxCases = Math.max(...localAreas.map(a => a.cases));

  const CX = 50; const CY = 50;
  const R50 = 12.7; const R100 = 25.3; const R150 = 38;

  // District polygon data paired with area ids
  const districtPolygons: { id: string; points: string }[] = [
    { id: "D8", points: "22,8 42,6 46,22 36,28 22,24" },          // Palamu
    { id: "D4", points: "22,24 36,28 32,40 18,42 14,32" },         // Bokaro
    { id: "D3", points: "36,28 46,22 50,36 44,44 32,40" },         // Jamshedpur
    { id: "D1", points: "46,22 62,20 64,36 56,46 50,36" },         // Ranchi (epicenter)
    { id: "D7", points: "62,20 76,18 78,32 70,40 64,36" },         // Giridih
    { id: "D6", points: "64,36 78,32 82,50 72,58 62,48" },         // Deoghar
    { id: "D2", points: "50,36 62,48 60,62 48,68 44,54 56,46" },   // Dhanbad
    { id: "D5", points: "44,54 48,68 46,82 32,84 28,70 38,60" },   // Hazaribagh
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header + controls */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Local Risk Map
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                ⊕ RANCHI DISTRICT, JHARKHAND · FMD EPICENTER · {visibleAreas.length} DISTRICTS IN VIEW
              </p>
            </div>
            {/* Map layer toggles + fullscreen */}
            <div className="flex gap-2 items-center flex-wrap">
              <button onClick={() => setFullscreen(true)} title="View fullscreen"
                className="px-3 py-1 rounded text-xs font-medium border transition-all flex items-center gap-1.5"
                style={{ background: "transparent", color: "#d97634", borderColor: "#d97634" }}>
                <span style={{ fontSize: 11 }}>⛶</span> Fullscreen
              </button>
            </div>
          </div>

          {/* Disease filter pills */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-[var(--muted-foreground)] font-medium mr-1" style={{ fontFamily: "'Inter', sans-serif" }}>FILTER:</span>
            {["All", ...uniqueDiseases].map(d => {
              const active = diseaseFilter === d;
              const areaForDisease = localAreas.find(a => a.disease === d);
              const col = d === "All" ? "#3d405b" : areaForDisease ? ALERT_COLORS[areaForDisease.level] : "#3d405b";
              const totalCasesForDisease = localAreas.filter(a => a.disease === d).reduce((s, a) => s + a.cases, 0);
              return (
                <button key={d} onClick={() => { setDiseaseFilter(d); setSelectedArea(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{ background: active ? col : "var(--card)", color: active ? "var(--primary-foreground)" : col, borderColor: col }}>
                  {d !== "All" && <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: active ? "var(--primary-foreground)" : col }} />}
                  {d === "All" ? "All Diseases" : d}
                  {d !== "All" && <span className="opacity-75 font-mono">{totalCasesForDisease.toLocaleString()}</span>}
                </button>
              );
            })}
          </div>

          {/* Dynamic radius control */}
          <div className="flex items-center gap-3 flex-wrap py-1 px-3 rounded-lg" style={{ background: "var(--muted)" }}>
            <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>RADIUS:</span>
            {/* Preset buttons */}
            <div className="flex gap-1">
              {PRESET_RADII.map(r => (
                <button key={r} onClick={() => { setRadiusKm(r); setSelectedArea(null); }}
                  className="px-2.5 py-1 rounded text-xs font-semibold border transition-all"
                  style={{
                    background: radiusKm === r ? "#d97634" : "var(--card)",
                    color: radiusKm === r ? "var(--primary-foreground)" : "#d97634",
                    borderColor: "#d97634",
                  }}>
                  {r} km
                </button>
              ))}
            </div>
            {/* Slider */}
            <input type="range" min={10} max={150} step={5} value={radiusKm}
              onChange={e => { setRadiusKm(Number(e.target.value)); setSelectedArea(null); }}
              className="flex-1 min-w-24 max-w-40 accent-[#d97634] cursor-pointer"
              style={{ accentColor: "#d97634" }} />
            <span className="text-xs font-bold min-w-12 text-right" style={{ color: "#d97634", fontFamily: "'Inter', sans-serif" }}>{radiusKm} km</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {visibleAreas.length} districts</span>
          </div>

          {/* Alert level legend */}
          <div className="flex gap-4 flex-wrap">
            {(Object.entries(ALERT_COLORS) as [AlertLevel, string][]).map(([level, color]) => (
              <span key={level} className="flex items-center gap-1.5 text-xs" style={{ fontFamily: "'Inter', sans-serif", color: "#555" }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-xs ml-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#999" }}>
              ● Bubble size = case count
            </span>
          </div>
        </div>

        {/* Map + detail panel side by side */}
        <div className="flex" style={{ height: fullscreen ? "100%" : 260 }}>
          {/* SVG map */}
          <div className="relative flex-1" style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(241, 245, 249, 0.7) 50%, rgba(255, 255, 255, 0.5) 100%)" }}>
            <svg viewBox={viewBox} className="w-full h-full" style={{ display: "block" }} onWheel={handleWheel}>
              <defs>
                <radialGradient id="epicenterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <filter id="blur2">
                  <feGaussianBlur stdDeviation="1.5" />
                </filter>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* Background grid covering the whole box */}
              {Array.from({length: 60}, (_, i) => -250 + i * 10).map(v => (
                <g key={v} opacity="0.12">
                  <line x1={v} y1="-250" x2={v} y2="350" stroke="var(--foreground)" strokeWidth="0.3" />
                  <line x1="-250" y1={v} x2="350" y2={v} stroke="var(--foreground)" strokeWidth="0.3" />
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
                    fill={isVisible && showHeatmap ? color : "#c8dfc8"}
                    fillOpacity={isVisible && showHeatmap ? 0.12 + intensity * 0.28 : 0.18}
                    stroke={isVisible ? color : "#a8c8a8"}
                    strokeWidth={selectedArea?.id === area.id ? 0.7 : 0.35}
                    strokeOpacity={isVisible ? 0.6 : 0.3}
                    style={{ cursor: "pointer", transition: "fill-opacity 0.25s" }}
                    onClick={() => setSelectedArea(selectedArea?.id === area.id ? null : area)}
                    onMouseEnter={() => setHoveredArea(area)}
                    onMouseLeave={() => setHoveredArea(null)}
                  />
                );
              })}

              {/* Rivers */}
              <path d="M30,6 Q33,22 33,40 Q33,58 30,78" stroke="#90caf9" strokeWidth="0.6" fill="none" opacity="0.45" strokeLinecap="round" />
              <path d="M14,42 Q28,47 42,50 Q54,53 64,62" stroke="#90caf9" strokeWidth="0.5" fill="none" opacity="0.35" strokeLinecap="round" />
              {/* River labels */}
              <text x="21" y="32" fontSize="1.6" fill="#6baed6" fontFamily="JetBrains Mono, monospace" opacity="0.7" transform="rotate(-80, 21, 32)">Subarnarekha</text>
              <text x="32" y="58" fontSize="1.6" fill="#6baed6" fontFamily="JetBrains Mono, monospace" opacity="0.7">Damodar River</text>

              {/* Pseudo radius rings — 50, 100, 150 km */}
              {showRings && <>
                {[
                  { km: 50, r: R50, label: "50km" },
                  { km: 100, r: R100, label: "100km" },
                  { km: 150, r: R150, label: "150km" },
                ].map(ring => {
                  const isActive = radiusKm === ring.km;
                  const isBeyond = ring.km > radiusKm;
                  return (
                    <g key={ring.km}>
                      <circle cx={CX} cy={CY} r={ring.r}
                        fill={isActive ? "rgba(217,118,52,0.07)" : "none"}
                        stroke={isActive ? "#d97634" : "#3d405b"}
                        strokeWidth={isActive ? 0.6 : 0.3}
                        strokeDasharray={isActive ? "2,1.2" : "1.5,1.5"}
                        opacity={isBeyond ? 0.12 : isActive ? 1 : 0.3} />
                      <text x={CX + ring.r - 1} y={CY - 1} fontSize="1.6"
                        fill={isActive ? "#d97634" : "#3d405b"}
                        fontFamily="JetBrains Mono, monospace"
                        opacity={isBeyond ? 0.2 : isActive ? 0.95 : 0.45}>
                        {ring.label}
                      </text>
                    </g>
                  );
                })}
                {/* Active dynamic radius ring (when not on a preset) */}
                {!PRESET_RADII.includes(radiusKm) && (
                  <g>
                    <circle cx={CX} cy={CY} r={activeRadiusSvg}
                      fill="rgba(217,118,52,0.07)" stroke="#d97634"
                      strokeWidth="0.6" strokeDasharray="2,1.2" />
                    <text x={CX + activeRadiusSvg - 2} y={CY - 1} fontSize="1.6"
                      fill="#d97634" fontFamily="JetBrains Mono, monospace" opacity="0.95">
                      {radiusKm}km
                    </text>
                  </g>
                )}
              </>}

              {/* Heatmap blur blobs for visible critical/warning areas */}
              {showHeatmap && visibleAreas.filter(a => a.level === "critical" || a.level === "warning").map(area => (
                <circle key={area.id + "-heat"} cx={area.x} cy={area.y}
                  r={3 + (area.cases / maxCases) * 5}
                  fill={ALERT_COLORS[area.level]} opacity="0.07" filter="url(#blur2)" />
              ))}

              {/* Dimmed markers (filtered out) */}
              {localAreas.filter(a => !visibleAreas.includes(a)).map(area => (
                <g key={area.id + "-dim"} opacity="0.3">
                  <circle cx={area.x} cy={area.y} r="2.2" fill="#aaa" stroke="var(--card)" strokeWidth="0.5" />
                  <text x={area.x + 3} y={area.y + 1} fontSize="2" fill="#aaa" fontFamily="Instrument Sans, sans-serif">{area.name}</text>
                </g>
              ))}

              {/* Active markers */}
              {visibleAreas.map(area => {
                const isSelected = selectedArea?.id === area.id;
                const isHovered = hoveredArea?.id === area.id;
                const r = 1.4 + (area.cases / maxCases) * 1.8;
                return (
                  <g key={area.id} style={{ cursor: "pointer" }}
                    onClick={() => setSelectedArea(isSelected ? null : area)}
                    onMouseEnter={() => setHoveredArea(area)}
                    onMouseLeave={() => setHoveredArea(null)}>
                    {/* Pulse rings for critical */}
                    {/* Selection ring */}
                    {isSelected && <circle cx={area.x} cy={area.y} r={r + 1.5} fill="none" stroke={ALERT_COLORS[area.level]} strokeWidth="0.8" opacity="0.6" />}
                    {/* Hover ring */}
                    {isHovered && !isSelected && <circle cx={area.x} cy={area.y} r={r + 1.8} fill="none" stroke={ALERT_COLORS[area.level]} strokeWidth="0.5" opacity="0.5" />}
                    {/* Main dot */}
                    <circle cx={area.x} cy={area.y} r={r} fill={ALERT_COLORS[area.level]} stroke="var(--card)" strokeWidth="0.7" filter="url(#shadow)" opacity={isSelected || isHovered ? 1 : 0.88} />
                    {/* Case count inside big markers */}
                    {r > 99 && <text x={area.x} y={area.y + 0.8} fontSize="2" fill="white" fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="bold">{area.cases > 999 ? `${(area.cases / 1000).toFixed(1)}k` : area.cases}</text>}
                    {/* Name label */}
                    <text x={area.x} y={area.y + r + 3} fontSize="2.2" fill="#2a2d3e" fontFamily="Instrument Sans, sans-serif" fontWeight="600" textAnchor="middle">{area.name}</text>
                    <text x={area.x} y={area.y + r + 5.5} fontSize="1.7" fill="#666" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.8">{area.dist === 0 ? "Epicenter" : `${area.dist}km`}</text>
                  </g>
                );
              })}

              {/* Epicenter marker */}
              <g>
                <circle cx={CX} cy={CY} r="10" fill="url(#epicenterGlow)" />
                <line x1={CX - 3} y1={CY} x2={CX + 3} y2={CY} stroke="var(--foreground)" strokeWidth="1" />
                <line x1={CX} y1={CY - 3} x2={CX} y2={CY + 3} stroke="var(--foreground)" strokeWidth="1" />
                <circle cx={CX} cy={CY} r="1.4" fill="var(--foreground)" stroke="var(--card)" strokeWidth="0.5" />
              </g>

              {/* Compass rose — top right */}
              <g transform="translate(88,8)">
                <circle cx="0" cy="0" r="4" fill="white" opacity="0.85" stroke="#ddd" strokeWidth="0.3" />
                <text x="0" y="-2" fontSize="2" fill="var(--foreground)" fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="bold">N</text>
                <text x="0" y="3.5" fontSize="1.6" fill="#999" fontFamily="JetBrains Mono, monospace" textAnchor="middle">S</text>
                <text x="-3" y="0.8" fontSize="1.6" fill="#999" fontFamily="JetBrains Mono, monospace" textAnchor="middle">W</text>
                <text x="3" y="0.8" fontSize="1.6" fill="#999" fontFamily="JetBrains Mono, monospace" textAnchor="middle">E</text>
                <line x1="0" y1="-1.5" x2="0" y2="-3.2" stroke="#d32f2f" strokeWidth="0.5" />
                <line x1="0" y1="1.5" x2="0" y2="3.2" stroke="#aaa" strokeWidth="0.4" />
              </g>

              {/* Scale bar — bottom left */}
              <g transform="translate(4,86)">
                <rect x="0" y="0" width="24" height="4" rx="0.5" fill="white" opacity="0.85" />
                <rect x="1" y="1.2" width="10" height="1.6" rx="0.3" fill="var(--foreground)" />
                <rect x="11" y="1.2" width="12" height="1.6" rx="0.3" fill="#aaa" />
                <text x="1" y="5.5" fontSize="1.5" fill="#666" fontFamily="JetBrains Mono, monospace">0</text>
                <text x="9" y="5.5" fontSize="1.5" fill="#666" fontFamily="JetBrains Mono, monospace">~40km</text>
                <text x="20" y="5.5" fontSize="1.5" fill="#666" fontFamily="JetBrains Mono, monospace">90km</text>
              </g>
            </svg>

            {/* Zoom controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1">
              {[
                { label: "+", title: "Zoom in", action: handleZoomIn, disabled: zoom >= MAX_ZOOM },
                { label: "−", title: "Zoom out", action: handleZoomOut, disabled: zoom <= MIN_ZOOM },
                { label: "⊙", title: "Reset view", action: handleReset, disabled: zoom === 1 },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} title={btn.title} disabled={btn.disabled}
                  className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold shadow transition-all"
                  style={{
                    background: btn.disabled ? "var(--muted)" : "var(--card)",
                    color: btn.disabled ? "var(--muted-foreground)" : "var(--foreground)",
                    border: "1px solid var(--border)",
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Zoom level badge */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs"
              style={{ background: "rgba(61,64,91,0.75)", color: "var(--primary-foreground)", fontFamily: "'Inter', sans-serif" }}>
              {zoom.toFixed(1)}×
            </div>

            {/* Hover tooltip */}
            {hoveredArea && !selectedArea && (
              <div className="absolute pointer-events-none px-3 py-2 rounded-lg shadow-lg text-xs"
                style={{ bottom: 16, left: 16, background: "var(--foreground)", color: "var(--primary-foreground)", fontFamily: "'Outfit', sans-serif" }}>
                <div className="font-semibold">{hoveredArea.name} District</div>
                <div className="opacity-75 mt-0.5">{hoveredArea.cases.toLocaleString()} cases · {hoveredArea.mortality} deaths</div>
                <div className="opacity-60 text-xs mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{hoveredArea.disease}</div>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="border-l border-[var(--border)] flex flex-col" style={{ width: 240, background: "#fafafa" }}>
            {selectedArea ? (
              <>
                <div className="px-4 py-4 border-b border-[var(--border)]" style={{ background: ALERT_BG[selectedArea.level] }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif", color: ALERT_COLORS[selectedArea.level] }}>{selectedArea.name} District</p>
                      <p className="text-xs mt-0.5" style={{ color: ALERT_COLORS[selectedArea.level], opacity: 0.8 }}>{selectedArea.dist === 0 ? "Epicenter" : `${selectedArea.dist} km from epicenter`}</p>
                    </div>
                    <button onClick={() => setSelectedArea(null)} className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1">✕</button>
                  </div>
                  <div className="mt-2"><AlertBadge level={selectedArea.level} /></div>
                </div>
                <div className="px-4 py-4 flex flex-col gap-3 flex-1">
                  {/* Big case count */}
                  <div>
                    <p className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif", color: ALERT_COLORS[selectedArea.level] }}>{selectedArea.cases.toLocaleString()}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Active cases</p>
                  </div>
                  {/* Case bar */}
                  <div>
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                      <span>Case load vs. zone max</span>
                      <span>{Math.round((selectedArea.cases / maxCases) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(selectedArea.cases / maxCases) * 100}%`, background: ALERT_COLORS[selectedArea.level] }} />
                    </div>
                  </div>
                  {/* Stats */}
                  {[
                    { label: "Deaths", val: selectedArea.mortality, mono: true },
                    { label: "CFR", val: selectedArea.mortality > 0 ? `${((selectedArea.mortality / selectedArea.cases) * 100).toFixed(1)}%` : "0%", mono: true },
                    { label: "Disease", val: selectedArea.disease, mono: false },
                    { label: "Distance", val: selectedArea.dist === 0 ? "Epicenter" : `${selectedArea.dist} km`, mono: true },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-start gap-2 py-2 border-b border-[var(--border)] last:border-0">
                      <span className="text-xs text-[var(--muted-foreground)]">{s.label}</span>
                      <span className="text-xs font-medium text-right text-[var(--foreground)]" style={s.mono ? { fontFamily: "'Inter', sans-serif" } : {}}>{s.val}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <button className="w-full py-2 rounded text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: ALERT_COLORS[selectedArea.level], fontFamily: "'Outfit', sans-serif" }}>
                    File Report for {selectedArea.name}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 px-4 text-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: "var(--muted)" }}>◎</div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>Select a district</p>
                </div>
                <div className="w-full mt-2 flex flex-col gap-1.5 overflow-y-auto">
                  {localAreas.slice().sort((a, b) => b.cases - a.cases).slice(0, 4).map(a => (
                    <button key={a.id} onClick={() => setSelectedArea(a)}
                      className="flex items-center gap-2 px-3 py-2 rounded text-left hover:bg-[var(--muted)] transition-colors w-full">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ALERT_COLORS[a.level] }} />
                      <span className="text-xs flex-1 text-[var(--foreground)]">{a.name}</span>
                      <span className="text-xs font-mono text-[var(--muted-foreground)]">{a.cases.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Districts Data Table (Restored & Enhanced) */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden mt-6 shadow-sm">
        <div className="px-5 py-4 border-b border-[var(--border)]" style={{ background: "rgba(0,0,0,0.02)" }}>
          <h3 className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>District Outbreak Data</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Detailed metrics for all districts within the selected radius.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12 }}>
                <th className="px-5 py-3 font-medium uppercase tracking-wider">District</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wider">Active Cases</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wider">Mortality</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wider">Primary Disease</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wider">Distance</th>
              </tr>
            </thead>
            <tbody>
              {visibleAreas.sort((a, b) => b.cases - a.cases).map(area => (
                <tr key={area.id} 
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer" 
                    onClick={() => {
                        setSelectedArea(area);
                        // smooth scroll to top of map if needed, but selecting it is enough
                    }}>
                  <td className="px-5 py-4 font-semibold" style={{ color: "var(--foreground)" }}>{area.name}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `var(--card)`, color: ALERT_COLORS[area.level], border: `1px solid ${ALERT_COLORS[area.level]}40` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ALERT_COLORS[area.level] }} />
                      {area.level.charAt(0).toUpperCase() + area.level.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-medium" style={{ color: "var(--foreground)" }}>{area.cases.toLocaleString()}</td>
                  <td className="px-5 py-4 font-mono" style={{ color: area.mortality > 0 ? "#ef4444" : "var(--muted-foreground)" }}>{area.mortality}</td>
                  <td className="px-5 py-4" style={{ color: "var(--foreground)" }}>{area.disease}</td>
                  <td className="px-5 py-4 font-mono text-[var(--muted-foreground)]">{area.dist === 0 ? "Epicenter" : `${area.dist} km`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleAreas.length === 0 && (
            <div className="p-8 text-center text-[var(--muted-foreground)]">No districts match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}


function Records() {
  const [filter, setFilter] = useState<"all" | "overdue" | "due" | "current">("all");

  const filtered = filter === "all" ? animalRecords : animalRecords.filter(r => r.status === filter);

  const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
    current: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    due: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    overdue: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["all", "current", "due", "overdue"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded text-sm font-medium border transition-all capitalize"
            style={{
              background: filter === f ? "var(--primary)" : "var(--background)",
              color: filter === f ? "white" : "var(--muted-foreground)",
              borderColor: filter === f ? "var(--primary)" : "var(--border)",
            }}
          >
            {f} {f !== "all" && `(${animalRecords.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              {["Species", "Tag ID", "Farmer", "Village", "Last Vaccine", "Type", "Next Due", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(rec => (
              <tr key={rec.id} className="hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3">{SPECIES_ICONS[rec.species]} {rec.species}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{rec.tagId}</td>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">{rec.farmer}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{rec.village}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{rec.lastVaccine}</td>
                <td className="px-4 py-3 text-xs text-[var(--foreground)]">{rec.vaccineType}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{rec.nextDue}</td>
                <td className="px-4 py-3">
                  <span className="status-badge px-2 py-0.5 rounded" style={{ color: STATUS_STYLE[rec.status].color, background: STATUS_STYLE[rec.status].bg, border: `1px solid ${STATUS_STYLE[rec.status].border}` }}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Advisories() {
  const [lang, setLang] = useState<Language>("en");
  const [expanded, setExpanded] = useState<string | null>(advisories[0].id);

  return (
    <div className="flex flex-col gap-4">
      {/* Language selector */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 flex items-center gap-4">
        <span className="text-sm font-medium text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>ADVISORY LANGUAGE:</span>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(LANG_LABELS) as [Language, string][]).map(([code, name]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className="px-3 py-1.5 rounded text-sm border transition-all"
              style={{
                background: lang === code ? "var(--primary)" : "var(--background)",
                color: lang === code ? "white" : "var(--foreground)",
                borderColor: lang === code ? "var(--primary)" : "var(--border)",
                fontWeight: lang === code ? 600 : 400,
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">SMS · Push · Offline print available</span>
      </div>

      {/* Advisory cards */}
      <div className="flex flex-col gap-3">
        {advisories.map(adv => (
          <div key={adv.id} className="bg-[var(--card)] rounded-lg border overflow-hidden transition-all" style={{ borderColor: ALERT_BORDER[adv.level] }}>
            <button
              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[var(--muted)] transition-colors"
              onClick={() => setExpanded(expanded === adv.id ? null : adv.id)}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ALERT_COLORS[adv.level] }} />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>{adv.disease}</span>
                  <AlertBadge level={adv.level} />
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">{adv.id}</span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Regions: {adv.regions.join(", ")} · Issued {adv.issued}</div>
              </div>
              <span className="text-[var(--muted-foreground)] text-sm">{expanded === adv.id ? "▲" : "▼"}</span>
            </button>

            {expanded === adv.id && (
              <div className="px-5 pb-5 border-t border-[var(--border)]" style={{ background: ALERT_BG[adv.level] }}>
                <p className="text-sm leading-relaxed mt-4 text-[var(--foreground)]">{adv.translations[lang]}</p>
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:opacity-90 transition-opacity">Send via SMS</button>
                  <button className="px-4 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card)] transition-colors">Print / Offline PDF</button>
                  <button className="px-4 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card)] transition-colors">Push Notification</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

const BOT_SCRIPT: { role: "bot"; text: string; field?: string }[] = [
  { role: "bot", text: "Hello! I'm PashuSetu AI. Let's file a case together. First — what species is affected?", field: "species" },
  { role: "bot", text: "Got it. What symptoms are you observing? (e.g. fever, blistering, lameness, nasal discharge)", field: "symptoms" },
  { role: "bot", text: "How many animals are affected and how many have died (if any)?", field: "count" },
  { role: "bot", text: "What district / village is the farm located in?", field: "location" },
  { role: "bot", text: "Any additional observations — recent livestock movement, contact with other herds?", field: "notes" },
];

function ReportModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"pick" | "form" | "chat">("pick");

  // Chat state
  const [chatStep, setChatStep] = useState(0);
  const [chatAnswers, setChatAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([
    { role: "bot", text: BOT_SCRIPT[0].text },
  ]);
  const [chatDone, setChatDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function sendChat() {
    if (!input.trim()) return;
    const field = BOT_SCRIPT[chatStep].field!;
    const next = [...messages, { role: "user" as const, text: input }];
    const answers = { ...chatAnswers, [field]: input };
    setChatAnswers(answers);
    setInput("");
    const nextStep = chatStep + 1;
    if (nextStep < BOT_SCRIPT.length) {
      setTimeout(() => {
        setMessages([...next, { role: "bot", text: BOT_SCRIPT[nextStep].text }]);
        setChatStep(nextStep);
      }, 400);
    } else {
      setTimeout(() => {
        setMessages([...next, { role: "bot", text: "Thank you! Your report has been submitted for AI triage. A veterinary officer will follow up within 2 hours. Reference: RPT-" + Date.now().toString().slice(-8) }]);
        setChatDone(true);
      }, 400);
    }
    setMessages(next);
  }

  // Form state
  const [fSpecies, setFSpecies] = useState("");
  const [fSymptoms, setFSymptoms] = useState<string[]>([]);
  const [fCount, setFCount] = useState("");
  const [fDeaths, setFDeaths] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fVet, setFVet] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fTests, setFTests] = useState<string[]>([]);
  const [fTestResults, setFTestResults] = useState<Record<string, string>>({});
  const [fSampleDate, setFSampleDate] = useState("");
  const [fLab, setFLab] = useState("");
  const [fFormTab, setFFormTab] = useState<"report" | "tests">("report");
  const [formDone, setFormDone] = useState(false);
  const SYM = ["Fever", "Nasal discharge", "Blistering/sores", "Sudden death", "Lameness", "Respiratory distress", "Diarrhea", "Loss of appetite", "Skin lesions", "Neurological signs"];
  const TESTS = ["ELISA", "PCR", "Virus Isolation", "Lateral Flow Assay", "Agar Gel Immunodiffusion", "Complement Fixation", "Serum Neutralization", "Haemadsorption", "Blood smear", "Necropsy"];
  const RESULT_OPTIONS = ["Positive", "Negative", "Pending", "Inconclusive"];
  const toggleSym = (s: string) => setFSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleTest = (t: string) => {
    setFTests(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
    setFTestResults(r => { const n = { ...r }; if (n[t]) delete n[t]; return n; });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(61,64,91,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg bg-[var(--card)] rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            {mode !== "pick" && (
              <button onClick={() => { setMode("pick"); setFormDone(false); setChatDone(false); setChatStep(0); setMessages([{ role: "bot", text: BOT_SCRIPT[0].text }]); setChatAnswers({}); }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-lg leading-none mr-1">←</button>
            )}
            <span className="font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
              {mode === "pick" ? "File a Case Report" : mode === "form" ? "Report Form" : "AI Assistant"}
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl leading-none">×</button>
        </div>

        {/* Pick mode */}
        {mode === "pick" && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-[var(--muted-foreground)]">Choose how you want to file this case:</p>
            <button onClick={() => setMode("form")}
              className="flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-[#3d405b]"
              style={{ borderColor: "var(--border)" }}>
              <span className="text-2xl mt-0.5">📋</span>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--foreground)", fontFamily: "'Outfit', sans-serif" }}>Fill a Form</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Structured fields — species, symptoms, count, location, notes.</div>
              </div>
            </button>
            <button onClick={() => setMode("chat")}
              className="flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-[#d97634]"
              style={{ borderColor: "var(--border)" }}>
              <span className="text-2xl mt-0.5">🤖</span>
              <div>
                <div className="font-semibold text-sm" style={{ color: "#d97634", fontFamily: "'Outfit', sans-serif" }}>Chat with AI Assistant</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">Answer a few guided questions — faster and conversational.</div>
              </div>
            </button>
          </div>
        )}

        {/* Form mode */}
        {mode === "form" && !formDone && (
          <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            {/* Sub-tabs */}
            <div className="flex border-b border-[var(--border)] px-5 gap-4">
              {(["report", "tests"] as const).map(t => (
                <button key={t} onClick={() => setFFormTab(t)}
                  className="py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all -mb-px"
                  style={{
                    borderColor: fFormTab === t ? "#3d405b" : "transparent",
                    color: fFormTab === t ? "#3d405b" : "var(--muted-foreground)",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                  {t === "report" ? "Case Report" : "Tests Done"}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto p-5 flex flex-col gap-4 flex-1">
              {fFormTab === "report" && (<>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Species *</label>
                  <select value={fSpecies} onChange={e => setFSpecies(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                    <option value="">Select species</option>
                    {["Cattle", "Buffalo", "Goat", "Sheep", "Pig", "Poultry", "Horse"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Symptoms Observed</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SYM.map(s => (
                      <button key={s} onClick={() => toggleSym(s)} type="button"
                        className="px-2.5 py-1 rounded-full text-xs border transition-all"
                        style={{ background: fSymptoms.includes(s) ? "var(--foreground)" : "transparent", color: fSymptoms.includes(s) ? "var(--primary-foreground)" : "var(--foreground)", borderColor: "var(--foreground)" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Animals Affected</label>
                    <input type="number" value={fCount} onChange={e => setFCount(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="e.g. 12" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Deaths</label>
                    <input type="number" value={fDeaths} onChange={e => setFDeaths(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="e.g. 2" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Location *</label>
                    <input type="text" value={fLocation} onChange={e => setFLocation(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Village / District" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Reporting Vet</label>
                    <input type="text" value={fVet} onChange={e => setFVet(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Dr. Name / ID" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Additional Notes</label>
                  <textarea rows={3} value={fNotes} onChange={e => setFNotes(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none" placeholder="Recent livestock movement, contact with other herds..." />
                </div>
              </>)}

              {fFormTab === "tests" && (<>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Sample Collection Date</label>
                    <input type="date" value={fSampleDate} onChange={e => setFSampleDate(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Laboratory</label>
                    <input type="text" value={fLab} onChange={e => setFLab(e.target.value)} className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="e.g. NRC-FMD Mukteswar" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Tests Performed</label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {TESTS.map(t => (
                      <button key={t} onClick={() => toggleTest(t)} type="button"
                        className="px-2.5 py-1 rounded-full text-xs border transition-all"
                        style={{ background: fTests.includes(t) ? "#d97634" : "transparent", color: fTests.includes(t) ? "var(--primary-foreground)" : "#d97634", borderColor: "#d97634" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {fTests.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>Test Results</label>
                    {fTests.map(t => (
                      <div key={t} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "var(--secondary)" }}>
                        <span className="text-xs font-medium flex-1" style={{ color: "var(--foreground)" }}>{t}</span>
                        <div className="flex gap-1">
                          {RESULT_OPTIONS.map(r => (
                            <button key={r} onClick={() => setFTestResults(prev => ({ ...prev, [t]: r }))} type="button"
                              className="px-2 py-0.5 rounded text-xs border transition-all"
                              style={{
                                background: fTestResults[t] === r ? (r === "Positive" ? "#d32f2f" : r === "Negative" ? "#2e7d32" : r === "Pending" ? "#ffca6e" : "#888") : "transparent",
                                color: fTestResults[t] === r ? "var(--primary-foreground)" : "var(--muted-foreground)",
                                borderColor: fTestResults[t] === r ? "transparent" : "var(--border)",
                              }}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {fTests.length === 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] italic">Select tests above to record results.</p>
                )}
              </>)}
            </div>

            <div className="p-4 border-t border-[var(--border)] flex gap-2">
              {fFormTab === "report" && (
                <button onClick={() => setFFormTab("tests")}
                  className="flex-1 py-2.5 rounded font-semibold text-sm border transition-colors"
                  style={{ borderColor: "var(--foreground)", color: "var(--foreground)", fontFamily: "'Outfit', sans-serif" }}>
                  Add Tests Done →
                </button>
              )}
              <button onClick={() => setFormDone(true)} disabled={!fSpecies}
                className="flex-1 py-2.5 rounded font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--foreground)", fontFamily: "'Outfit', sans-serif" }}>
                Submit Report
              </button>
            </div>
          </div>
        )}

        {/* Form success */}
        {mode === "form" && formDone && (
          <div className="p-7 flex flex-col items-center gap-4 text-center overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-2xl">✓</div>
            <div className="font-semibold text-lg" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Report Submitted</div>
            <span className="font-mono text-sm bg-[var(--muted)] px-3 py-1.5 rounded">RPT-{Date.now().toString().slice(-8)}</span>
            <div className="w-full text-left bg-[var(--secondary)] rounded-xl p-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Species</span><span className="font-medium" style={{ color: "var(--foreground)" }}>{fSpecies}</span></div>
              {fSymptoms.length > 0 && <div className="flex justify-between gap-4"><span className="text-[var(--muted-foreground)] flex-shrink-0">Symptoms</span><span className="font-medium text-right" style={{ color: "var(--foreground)" }}>{fSymptoms.join(", ")}</span></div>}
              {fCount && <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Affected</span><span className="font-medium" style={{ color: "var(--foreground)" }}>{fCount} animals{fDeaths ? ` · ${fDeaths} deaths` : ""}</span></div>}
              {fLocation && <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Location</span><span className="font-medium" style={{ color: "var(--foreground)" }}>{fLocation}</span></div>}
              {fTests.length > 0 && (
                <div className="border-t border-[var(--border)] pt-2 mt-1 flex flex-col gap-1">
                  <span className="text-[var(--muted-foreground)] mb-0.5">Tests Recorded</span>
                  {fTests.map(t => (
                    <div key={t} className="flex justify-between">
                      <span style={{ color: "var(--foreground)" }}>{t}</span>
                      <span className="font-semibold" style={{ color: fTestResults[t] === "Positive" ? "#d32f2f" : fTestResults[t] === "Negative" ? "#2e7d32" : "#888" }}>{fTestResults[t] || "Pending"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Queued for AI triage. A veterinary officer will follow up within 2 hours.<br />DAHD helpline: <strong>1800-180-1551</strong></p>
            <button onClick={onClose} className="px-6 py-2 rounded-full bg-[#3d405b] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Done</button>
          </div>
        )}

        {/* Chat mode */}
        {mode === "chat" && (
          <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: m.role === "bot" ? "var(--muted)" : "var(--foreground)",
                      color: m.role === "bot" ? "var(--foreground)" : "var(--primary-foreground)",
                      borderRadius: m.role === "bot" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                    }}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {!chatDone && (
              <div className="p-3 border-t border-[var(--border)] flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  className="flex-1 border border-[var(--border)] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] bg-[var(--background)]"
                  placeholder="Type your answer…"
                />
                <button onClick={sendChat}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#d97634" }}>
                  Send
                </button>
              </div>
            )}
            {chatDone && (
              <div className="p-3 border-t border-[var(--border)] flex justify-center">
                <button onClick={onClose} className="px-5 py-2 rounded-full bg-[#3d405b] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Done</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "outbreak", label: "Outbreak", icon: "⚠" },
  { id: "records", label: "Vaccination Records", icon: "▤" },
  { id: "advisories", label: "Advisories", icon: "⚑" },
];

type UserRole = "admin" | "vet" | "farmer" | null;

function LoginScreen({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [role, setRole] = useState<"admin" | "vet" | "farmer">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      onLogin(role);
    } else {
      setError("Invalid username or password (use admin/admin for demo)");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 pb-6 text-center border-b border-[var(--border)] bg-[var(--muted)]">
          <h1 className="text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>PashuSetu</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">Animal Health Surveillance System</p>
        </div>
        <div className="p-8">
          <div className="flex gap-2 mb-6 bg-[var(--muted)] p-1 rounded-xl">
            {(["admin", "vet", "farmer"] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: role === r ? "var(--foreground)" : "transparent",
                  color: role === r ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  boxShadow: role === r ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {r}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-[var(--border)] bg-[var(--background)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]" 
                placeholder="Enter username (admin)" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Password</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-[var(--border)] bg-[var(--background)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]" 
                placeholder="Enter password (admin)" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full mt-2 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#d97634" }}
            >
              Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FarmerAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Namaste! I am PashuMitra, your AI Vet Assistant. How can I help your livestock today?", sender: "ai" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { text: input, sender: "user" }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "I can help with that. Are there any other symptoms you've noticed, such as reduced milk yield or fever?", sender: "ai" }]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#d97634] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="p-4 bg-[#d97634] text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">PM</div>
          <div>
            <h3 className="font-bold text-sm leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>PashuMitra AI</h3>
            <span className="text-xs opacity-80">Always here to help</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-[var(--muted)] flex flex-col gap-3" style={{ height: "320px" }}>
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender === "ai" ? "bg-[var(--card)] text-[var(--foreground)] self-start border border-[var(--border)] rounded-tl-sm shadow-sm" : "bg-[#d97634] text-white self-end rounded-tr-sm shadow-sm"}`}>
            {m.text}
          </div>
        ))}
      </div>

      {/* Suggested chips */}
      <div className="px-3 py-2 bg-[var(--card)] border-t border-[var(--border)] flex gap-2 overflow-x-auto hide-scrollbar">
        {["Report Symptom", "Vaccine Info", "Talk to Vet"].map(chip => (
          <button 
            key={chip} 
            onClick={() => setInput(chip)}
            className="whitespace-nowrap px-3 py-1 bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium rounded-full hover:bg-[var(--border)] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-[var(--card)] border-t border-[var(--border)] flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type or use voice..." 
          className="flex-1 bg-[var(--muted)] border border-[var(--border)] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d97634] text-[var(--foreground)]"
        />
        <button onClick={handleSend} className="w-9 h-9 flex items-center justify-center bg-[#d97634] text-white rounded-full shrink-0 hover:bg-[#c2662c] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function FarmerPortal({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"dashboard" | "reports" | "new_report">("dashboard");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Floating pill header */}
      <div className="sticky top-0 z-20 px-5 pt-4 pb-2">
        <header
          className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 py-3 bg-[var(--card)]"
          style={{
            borderRadius: 999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Brand */}
          <span
            className="text-base font-semibold whitespace-nowrap flex-shrink-0"
            style={{ color: "var(--foreground)", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.01em" }}
          >
            PashuSetu Farmer
          </span>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "reports", label: "My Reports" },
              { id: "new_report", label: "Submit Report" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className="relative px-4 py-1.5 rounded-full text-sm transition-all whitespace-nowrap"
                style={{
                  color: tab === t.id ? "var(--primary-foreground)" : "var(--foreground)",
                  background: tab === t.id ? "var(--foreground)" : "transparent",
                  fontWeight: tab === t.id ? 500 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex gap-2">
            <button
              onClick={onLogout}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium border border-[var(--border)] transition-opacity hover:bg-[var(--muted)]"
              style={{
                borderRadius: 999,
                fontFamily: "'Outfit', sans-serif",
                color: "var(--foreground)"
              }}
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Mobile tab row */}
        <div className="md:hidden flex gap-1 overflow-x-auto mt-2 pb-1">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "reports", label: "My Reports" },
            { id: "new_report", label: "Submit Report" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all"
              style={{
                background: tab === t.id ? "var(--foreground)" : "var(--card)",
                color: tab === t.id ? "var(--primary-foreground)" : "var(--foreground)",
                borderColor: tab === t.id ? "var(--foreground)" : "var(--border)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-5 max-w-4xl mx-auto w-full flex flex-col gap-6">
        {tab === "dashboard" && (
          <div className="flex flex-col gap-6">
            {/* Welcome Section */}
            <div className="bg-[#fef7f2] border border-[#e5d4c5] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-[#3d405b] mb-2">Welcome, Ramesh Patel</h2>
              <p className="text-sm text-[#3d405b] opacity-80">Your herd is currently safe. 1 upcoming vaccination due.</p>
              <div className="mt-4 flex gap-3">
                 <button onClick={() => setTab("new_report")} className="px-5 py-2.5 rounded-lg font-semibold text-white transition-opacity shadow-md whitespace-nowrap" style={{ background: "#d32f2f" }}>
                   Report Sick Animal
                 </button>
                 <button className="px-5 py-2.5 rounded-lg font-semibold border border-[#e5d4c5] bg-white text-[#3d405b] whitespace-nowrap hover:bg-gray-50 transition-colors">
                   Call Vet
                 </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Advisories */}
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>Local Advisories</h3>
                <div className="bg-[#fff3e0] border border-[#ffcc80] rounded-xl p-4 flex gap-3 items-start">
                  <span className="text-[#ee8924] mt-0.5">⚠</span>
                  <div>
                    <p className="font-bold text-[#b45f06]">Lumpy Skin Disease Alert</p>
                    <p className="text-sm text-[#b45f06] mt-1 opacity-90">Cases reported within 30km. Ensure all cattle are vaccinated. Restrict movement to haats.</p>
                  </div>
                </div>
              </div>

              {/* My Animals */}
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>My Livestock</h3>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] overflow-hidden">
                   {[
                     { id: "JH-BV-00412", species: "Cattle", status: "Due for FMD", healthy: true },
                     { id: "JH-BV-00413", species: "Cattle", status: "Up to date", healthy: true },
                     { id: "JH-BF-08821", species: "Buffalo", status: "Up to date", healthy: true },
                   ].map(a => (
                     <div key={a.id} className="p-4 flex justify-between items-center hover:bg-[var(--muted)] transition-colors">
                       <div className="flex items-center gap-3">
                         <span className="text-2xl">{SPECIES_ICONS[a.species]}</span>
                         <div>
                           <p className="font-semibold text-sm text-[var(--foreground)]">{a.id}</p>
                           <p className="text-xs text-[var(--muted-foreground)]">{a.status}</p>
                         </div>
                       </div>
                       <span className="px-3 py-1 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full border border-[#c8e6c9]">
                         Healthy
                       </span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[var(--foreground)]" style={{ fontFamily: "'Outfit', sans-serif" }}>My Submitted Reports</h2>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
              {[
                { id: "RPT-9812423", date: "2024-08-20", species: "Cattle", issues: "Fever, Loss of appetite", status: "Resolved", vetNotes: "Administered paracetamol and antibiotics." },
                { id: "RPT-6632121", date: "2024-05-11", species: "Buffalo", issues: "Lameness", status: "Resolved", vetNotes: "Advised rest and calcium supplements." }
              ].map(r => (
                <div key={r.id} className="p-5 flex flex-col gap-2 hover:bg-[var(--muted)] transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-bold text-[var(--foreground)] font-mono">{r.id}</span>
                      <span className="text-sm text-[var(--muted-foreground)] ml-3">{r.date}</span>
                    </div>
                    <span className="px-3 py-1 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-full border border-[#c8e6c9]">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground)] mt-1"><strong>Species:</strong> {r.species}</p>
                  <p className="text-sm text-[var(--foreground)]"><strong>Symptoms:</strong> {r.issues}</p>
                  <div className="mt-2 p-3 bg-[var(--muted)] rounded-lg text-sm text-[var(--foreground)] border border-[var(--border)]">
                    <strong className="text-[var(--muted-foreground)] block mb-1">Vet Notes:</strong> {r.vetNotes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "new_report" && (
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Submit a New Report</h2>
            <ReportForm submitted={reportSubmitted} setSubmitted={setReportSubmitted} />
          </div>
        )}
      </main>

      {/* AI Chatbot Floating Widget */}
      <FarmerAIChatbot />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  
  const [tab, setTab] = useState<Tab>("dashboard");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (userRole === "farmer") {
    return <FarmerPortal onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-full bg-[var(--background)] flex flex-col">
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}
      {/* Floating pill header */}
      <div className="sticky top-0 z-20 px-5 pt-4 pb-2">
        <header
          className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 py-3 bg-[var(--card)]"
          style={{
            borderRadius: 999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Brand */}
          <span
            className="text-base font-semibold whitespace-nowrap flex-shrink-0"
            style={{ color: "var(--foreground)", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.01em" }}
          >
            PashuSetu
          </span>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative px-4 py-1.5 rounded-full text-sm transition-all whitespace-nowrap"
                style={{
                  color: tab === t.id ? "var(--primary-foreground)" : "var(--foreground)",
                  background: tab === t.id ? "var(--foreground)" : "transparent",
                  fontWeight: tab === t.id ? 500 : 400,
                }}
              >
                {t.label}
                {(t.id === "outbreak" || t.id === "advisories") && (
                  <span className="ml-1.5 inline-flex w-4 h-4 rounded-full items-center justify-center font-bold"
                    style={{ background: "#d32f2f", color: "var(--primary-foreground)", fontSize: "0.6rem" }}>2</span>
                )}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium border border-[var(--border)] transition-opacity hover:bg-[var(--muted)]"
              style={{
                borderRadius: 999,
                fontFamily: "'Outfit', sans-serif",
                color: "var(--foreground)"
              }}
            >
              Log Out
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-shrink-0 px-5 py-2 text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-80"
              style={{
                background: "var(--foreground)",
                color: "var(--primary-foreground)",
                borderRadius: 999,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              &nbsp;&nbsp;Report
            </button>
          </div>
        </header>

        {/* Mobile tab row */}
        <div className="md:hidden flex gap-1 overflow-x-auto mt-2 pb-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all"
              style={{
                background: tab === t.id ? "var(--foreground)" : "var(--card)",
                color: tab === t.id ? "var(--primary-foreground)" : "var(--foreground)",
                borderColor: tab === t.id ? "var(--foreground)" : "var(--border)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-4">
        {tab === "dashboard" && <Dashboard />}
        {tab === "outbreak" && <OutbreakAlerts />}
        {tab === "report" && <ReportForm submitted={reportSubmitted} setSubmitted={setReportSubmitted} />}
        {tab === "records" && <Records />}
        {tab === "advisories" && <Advisories />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--card)] px-5 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[var(--muted-foreground)]" style={{ fontFamily: "'Inter', sans-serif" }}>
          <span>PashuSetu v2.4.1 · AI Triage Engine Online · Last sync: 2 min ago</span>
          <span>DAHD Helpline: 1800-180-1551 · Pashu Poshan App · Available offline</span>
        </div>
      </footer>
    </div>
  );
}
