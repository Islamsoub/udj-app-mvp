/* global React, ReactDOM */
const { useState } = React;

/* ============ TOKENS (per spec) ============ */
const T = {
  jade400: '#1D9E75',
  jade500: '#149E5F',
  jade600: '#0F6E56',
  jade700: '#0A3D2E',
  jadeFaint: '#E1F5F0',
  jadeFaint2: '#CCEDDF',
  bg: '#F5F7F6',
  surface: '#FFFFFF',
  text1: '#1C2320',
  text2: '#6B7B74',
  text3: '#9EADA7',
  border: '#D9D9D9',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  blue: '#3B82F6',
};
const FRAME_W = 360, FRAME_H = 780;
const fontUI = (rtl) => rtl ? "'Noto Naskh Arabic', serif" : "'Plus Jakarta Sans', sans-serif";

/* ============ STATUS BAR ============ */
const StatusBar = ({ rtl = false }) => (
  <div style={{
    height: 44, paddingTop: 14, paddingLeft: 20, paddingRight: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500,
    color: T.text1, direction: rtl ? 'rtl' : 'ltr', flexShrink: 0,
  }}>
    <span>{rtl ? '٩:٤١' : '9:41'}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="16" height="11" viewBox="0 0 16 11"><g fill={T.text1}>
        <rect x="0" y="7" width="3" height="4" rx="0.5"/>
        <rect x="4" y="5" width="3" height="6" rx="0.5"/>
        <rect x="8" y="2.5" width="3" height="8.5" rx="0.5"/>
        <rect x="12" y="0" width="3" height="11" rx="0.5"/>
      </g></svg>
      <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke={T.text1} strokeWidth="1.4" strokeLinecap="round">
        <path d="M1 4 C 4 1, 10 1, 13 4"/>
        <path d="M3 6 C 5 4.5, 9 4.5, 11 6"/>
        <path d="M5 8 C 6 7.3, 8 7.3, 9 8"/>
        <circle cx="7" cy="9.6" r="0.7" fill={T.text1} stroke="none"/>
      </svg>
      <svg width="22" height="11" viewBox="0 0 22 11">
        <rect x="0.5" y="0.5" width="19" height="10" rx="2" fill="none" stroke={T.text1} strokeOpacity="0.4"/>
        <rect x="2" y="2" width="14" height="7" rx="1" fill={T.text1}/>
        <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill={T.text1} fillOpacity="0.4"/>
      </svg>
    </div>
  </div>
);

/* ============ FRAME ============ */
const Frame = ({ children }) => (
  <div style={{
    width: FRAME_W, height: FRAME_H, background: T.bg,
    position: 'relative', overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: 'flex', flexDirection: 'column',
  }}>{children}</div>
);

/* ====================================================================
   ILLUSTRATIONS — 200×200 each, distinct but unified palette
===================================================================*/

/* ---------- Step 1 — Schedule card with floating bits ---------- */
const IlluSchedule = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg-grad-1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={T.jadeFaint}/>
        <stop offset="100%" stopColor={T.jadeFaint2}/>
      </linearGradient>
      <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0A3D2E" floodOpacity="0.18"/>
      </filter>
    </defs>
    {/* Backdrop circle */}
    <circle cx="100" cy="100" r="92" fill="url(#bg-grad-1)"/>

    {/* Floating clock pill (top-left) */}
    <g filter="url(#card-shadow)">
      <rect x="14" y="32" width="58" height="22" rx="11" fill="#fff"/>
    </g>
    <circle cx="26" cy="43" r="6" fill="none" stroke={T.jade600} strokeWidth="1.5"/>
    <path d="M26 39 V43 L29 45" stroke={T.jade600} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <text x="38" y="47" fontFamily="DM Mono, monospace" fontSize="10" fontWeight="600" fill={T.jade700}>08:00</text>

    {/* Main schedule card — slight tilt */}
    <g transform="rotate(-4 100 110)" filter="url(#card-shadow)">
      <rect x="36" y="50" width="128" height="120" rx="14" fill="#fff"/>
      {/* card header strip */}
      <rect x="36" y="50" width="128" height="28" rx="14" fill={T.jade600}/>
      <rect x="36" y="64" width="128" height="14" fill={T.jade600}/>
      <text x="48" y="69" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="11" fontWeight="700" fill="#fff" letterSpacing="0.5">LUN 12 MAI</text>
      <circle cx="150" cy="64" r="4" fill="#fff" fillOpacity="0.35"/>

      {/* time slots */}
      {/* slot 1 — jade */}
      <rect x="48" y="92" width="104" height="20" rx="4" fill={T.jadeFaint}/>
      <rect x="48" y="92" width="3" height="20" rx="1.5" fill={T.jade400}/>
      <text x="58" y="105" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="600" fill={T.text1}>Algorithmique</text>
      <text x="124" y="105" fontFamily="DM Mono, monospace" fontSize="8" fill={T.text2}>A1</text>

      {/* slot 2 — purple (exam) */}
      <rect x="48" y="118" width="104" height="20" rx="4" fill="#EDE9FE"/>
      <rect x="48" y="118" width="3" height="20" rx="1.5" fill={T.purple}/>
      <text x="58" y="131" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="600" fill={T.text1}>Stats — Examen</text>
      <text x="138" y="131" fontFamily="DM Mono, monospace" fontSize="8" fill={T.text2}>B2</text>

      {/* slot 3 — blue */}
      <rect x="48" y="144" width="104" height="20" rx="4" fill="#DBEAFE"/>
      <rect x="48" y="144" width="3" height="20" rx="1.5" fill={T.blue}/>
      <text x="58" y="157" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="600" fill={T.text1}>Anglais Tech</text>
      <text x="132" y="157" fontFamily="DM Mono, monospace" fontSize="8" fill={T.text2}>C3</text>
    </g>

    {/* Floating bell badge (top-right) */}
    <g filter="url(#card-shadow)">
      <circle cx="166" cy="40" r="16" fill={T.jade400}/>
    </g>
    <path d="M161 35 a5 5 0 0 1 10 0 v3 l1 2 H160 l1 -2 Z" fill="#fff"/>
    <path d="M164 43 a2 2 0 0 0 4 0" stroke="#fff" strokeWidth="1.4" fill="none"/>

    {/* Floating check pill (bottom-right) */}
    <g filter="url(#card-shadow)">
      <rect x="142" y="158" width="44" height="22" rx="11" fill="#fff"/>
    </g>
    <path d="M150 169 L154 173 L162 165" stroke={T.jade400} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="166" y="173" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" fill={T.jade700}>OK</text>
  </svg>
);

/* ---------- Step 2 — GPA card with upward trend ---------- */
const IlluGrades = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg-grad-2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={T.jadeFaint}/>
        <stop offset="100%" stopColor={T.jadeFaint2}/>
      </linearGradient>
      <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={T.jade400} stopOpacity="0.35"/>
        <stop offset="100%" stopColor={T.jade400} stopOpacity="0"/>
      </linearGradient>
      <filter id="card-shadow-2" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0A3D2E" floodOpacity="0.18"/>
      </filter>
    </defs>
    <circle cx="100" cy="100" r="92" fill="url(#bg-grad-2)"/>

    {/* Behind: small badge card with check */}
    <g transform="rotate(8 56 50)" filter="url(#card-shadow-2)">
      <rect x="20" y="32" width="60" height="44" rx="10" fill="#fff"/>
    </g>
    <g transform="rotate(8 56 50)">
      <text x="28" y="48" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="8" fontWeight="700" fill={T.text2} letterSpacing="0.5">CRÉDITS</text>
      <text x="28" y="66" fontFamily="DM Mono, monospace" fontSize="16" fontWeight="700" fill={T.jade600}>30/30</text>
    </g>

    {/* Main GPA card */}
    <g filter="url(#card-shadow-2)">
      <rect x="40" y="50" width="120" height="120" rx="14" fill="#fff"/>
    </g>
    {/* card content */}
    <text x="56" y="76" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" fill={T.text2} letterSpacing="0.6">MOYENNE</text>
    <text x="56" y="102" fontFamily="DM Mono, monospace" fontSize="22" fontWeight="700" fill={T.jade600}>14.20</text>
    <text x="108" y="102" fontFamily="DM Mono, monospace" fontSize="11" fill={T.text2}>/20</text>
    {/* trend pill */}
    <rect x="56" y="110" width="38" height="14" rx="7" fill={T.jadeFaint}/>
    <path d="M62 119 L66 115 L70 117 L76 113" stroke={T.jade600} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="79" y="120" fontFamily="DM Mono, monospace" fontSize="8" fontWeight="700" fill={T.jade700}>+0.8</text>

    {/* mini chart */}
    <g>
      <path d="M56 156 L74 150 L92 146 L110 134 L128 124 L146 116"
            stroke={T.jade400} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M56 156 L74 150 L92 146 L110 134 L128 124 L146 116 L146 160 L56 160 Z" fill="url(#chart-fill)"/>
      <line x1="56" y1="160" x2="146" y2="160" stroke={T.border} strokeWidth="1"/>
      {[[56,156],[74,150],[92,146],[110,134],[128,124]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#fff" stroke={T.jade400} strokeWidth="1.5"/>
      ))}
      <circle cx="146" cy="116" r="3.5" fill={T.jade400}/>
    </g>

    {/* Floating star (top-right) */}
    <g filter="url(#card-shadow-2)">
      <circle cx="170" cy="58" r="16" fill={T.jade400}/>
    </g>
    <path d="M170 50 L172.5 56 L179 56.5 L174 60.5 L175.5 67 L170 63.5 L164.5 67 L166 60.5 L161 56.5 L167.5 56 Z" fill="#fff"/>

    {/* Floating "%" pill (bottom) */}
    <g filter="url(#card-shadow-2)">
      <rect x="28" y="160" width="40" height="22" rx="11" fill="#fff"/>
    </g>
    <text x="36" y="175" fontFamily="DM Mono, monospace" fontSize="11" fontWeight="700" fill={T.jade600}>A+</text>
    <text x="54" y="175" fontFamily="DM Mono, monospace" fontSize="9" fill={T.text2}>71%</text>
  </svg>
);

/* ---------- Step 3 — Student ID card with QR ---------- */
const IlluCard = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg-grad-3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={T.jadeFaint}/>
        <stop offset="100%" stopColor={T.jadeFaint2}/>
      </linearGradient>
      <linearGradient id="card-grad-3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={T.jade500}/>
        <stop offset="100%" stopColor={T.jade700}/>
      </linearGradient>
      <filter id="card-shadow-3" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0A3D2E" floodOpacity="0.25"/>
      </filter>
    </defs>
    <circle cx="100" cy="100" r="92" fill="url(#bg-grad-3)"/>

    {/* Back card (faint) */}
    <g transform="rotate(-9 100 110)" opacity="0.4">
      <rect x="42" y="58" width="116" height="118" rx="14" fill={T.jade700}/>
    </g>

    {/* Main student card — slight tilt */}
    <g transform="rotate(6 100 110)" filter="url(#card-shadow-3)">
      <rect x="34" y="48" width="132" height="130" rx="14" fill="url(#card-grad-3)"/>
      {/* header band */}
      <text x="46" y="68" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="11" fontWeight="800" fill="#fff" letterSpacing="0.8">UDJ</text>
      <text x="46" y="80" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7" fontWeight="600" fill="#fff" fillOpacity="0.75" letterSpacing="0.6">CARTE ÉTUDIANTE</text>
      <line x1="46" y1="86" x2="154" y2="86" stroke="#fff" strokeOpacity="0.25" strokeWidth="0.5"/>

      {/* QR */}
      <rect x="50" y="96" width="72" height="72" rx="6" fill="#fff"/>
      {/* finder marks */}
      <rect x="54" y="100" width="18" height="18" rx="2" fill="none" stroke={T.text1} strokeWidth="2.5"/>
      <rect x="59" y="105" width="8" height="8" fill={T.text1}/>
      <rect x="100" y="100" width="18" height="18" rx="2" fill="none" stroke={T.text1} strokeWidth="2.5"/>
      <rect x="105" y="105" width="8" height="8" fill={T.text1}/>
      <rect x="54" y="146" width="18" height="18" rx="2" fill="none" stroke={T.text1} strokeWidth="2.5"/>
      <rect x="59" y="151" width="8" height="8" fill={T.text1}/>
      {/* data cells */}
      {[
        [78,102],[84,102],[90,102],[78,108],[90,108],[78,114],[84,114],
        [98,124],[104,124],[110,124],[78,124],[84,130],[90,130],[104,130],
        [78,134],[90,134],[110,134],[98,140],[104,140],[110,144],
        [78,146],[84,150],[98,150],[104,150],[110,150],[78,156],[84,156],[90,156],
        [98,160],[110,160],[78,162],[90,162],[104,162]
      ].map(([x,y],i) => <rect key={i} x={x} y={y} width="3" height="3" fill={T.text1}/>)}

      {/* student info to the right */}
      <text x="128" y="108" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7" fontWeight="500" fill="#fff" fillOpacity="0.65" letterSpacing="0.5">NOM</text>
      <text x="128" y="118" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="9" fontWeight="700" fill="#fff">A. Omar</text>
      <text x="128" y="132" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7" fontWeight="500" fill="#fff" fillOpacity="0.65" letterSpacing="0.5">ID</text>
      <text x="128" y="142" fontFamily="DM Mono, monospace" fontSize="9" fontWeight="600" fill="#fff">00831</text>
      <text x="128" y="156" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="7" fontWeight="500" fill="#fff" fillOpacity="0.65" letterSpacing="0.5">EXPIRE</text>
      <text x="128" y="166" fontFamily="DM Mono, monospace" fontSize="8" fontWeight="600" fill="#fff">00:42</text>
    </g>

    {/* Floating lock badge */}
    <g filter="url(#card-shadow-3)">
      <circle cx="36" cy="38" r="16" fill="#fff"/>
    </g>
    <rect x="30" y="36" width="12" height="9" rx="2" fill="none" stroke={T.jade600} strokeWidth="1.8"/>
    <path d="M32 36 V33 a4 4 0 0 1 8 0 V36" fill="none" stroke={T.jade600} strokeWidth="1.8"/>

    {/* Floating "scan" rays — top-right */}
    <g opacity="0.85">
      <path d="M170 30 L170 38 M170 30 L162 30 M170 30 L170 22 M170 30 L178 30" stroke={T.jade600} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="170" cy="30" r="2.5" fill={T.jade400}/>
    </g>
  </svg>
);

/* ====================================================================
   ONBOARDING STEP
===================================================================*/

const STEPS = [
  {
    illu: <IlluSchedule/>,
    fr: {
      title: 'Votre emploi du temps, toujours à jour',
      body: 'Consultez vos cours, salles et horaires en un instant — même sans connexion.',
    },
    ar: {
      title: 'جدولك الدراسي، محدّث دائمًا',
      body: 'اطّلع على محاضراتك وقاعاتك ومواعيدك بلمسة — حتى بدون اتصال.',
    },
  },
  {
    illu: <IlluGrades/>,
    fr: {
      title: 'Suivez vos résultats académiques',
      body: 'Notes, GPA et crédits disponibles dès leur publication. Calculez la note qu\'il vous faut.',
    },
    ar: {
      title: 'تابع نتائجك الأكاديمية',
      body: 'الدرجات والمعدل والرصيد متاحة فور صدورها. احسب الدرجة التي تحتاجها.',
    },
  },
  {
    illu: <IlluCard/>,
    fr: {
      title: 'Votre identité universitaire, dans votre poche',
      body: 'Carte étudiante sécurisée avec QR rotatif. Valide partout sur le campus, même hors-ligne.',
    },
    ar: {
      title: 'هويتك الجامعية في جيبك',
      body: 'بطاقة طالب رقمية مؤمّنة برمز QR متجدد. صالحة في كل الحرم، حتى بدون اتصال.',
    },
  },
];

const DotIndicator = ({ active, total = 3, rtl = false }) => {
  const dots = Array.from({ length: total }).map((_, i) => i);
  const ordered = rtl ? [...dots].reverse() : dots;
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 8,
      direction: rtl ? 'rtl' : 'ltr',
    }}>
      {ordered.map(i => {
        const isActive = i === active;
        return (
          <div key={i} style={{
            width: isActive ? 24 : 8, height: 8, borderRadius: 9999,
            background: isActive ? T.jade400 : T.border,
            transition: 'all 0.2s ease',
          }}/>
        );
      })}
    </div>
  );
};

const SkipButton = ({ rtl = false, hidden = false }) => (
  <div style={{
    height: 44, paddingLeft: 16, paddingRight: 16,
    display: 'flex', alignItems: 'center',
    justifyContent: rtl ? 'flex-start' : 'flex-end',
    flexShrink: 0,
    visibility: hidden ? 'hidden' : 'visible',
  }}>
    <button style={{
      minWidth: 44, height: 44, background: 'transparent', border: 'none',
      padding: '0 8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: fontUI(rtl), fontWeight: 600, fontSize: 14, color: T.jade600,
    }}>
      <span>{rtl ? 'تخطي' : 'Passer'}</span>
      <span style={{
        display: 'inline-block',
        fontSize: 18, lineHeight: 1, transform: rtl ? 'scaleX(-1)' : 'none',
        marginTop: -1,
      }}>›</span>
    </button>
  </div>
);

const OnboardStep = ({ index, rtl = false }) => {
  const step = STEPS[index];
  const copy = rtl ? step.ar : step.fr;
  const isLast = index === 2;
  const ctaLabel = isLast
    ? (rtl ? 'هيا نبدأ' : 'Commencer')
    : (rtl ? 'التالي' : 'Suivant');
  return (
    <Frame>
      <StatusBar rtl={rtl}/>
      <SkipButton rtl={rtl} hidden={isLast}/>
      {/* Center: illu + copy */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingLeft: 16, paddingRight: 16,
        direction: rtl ? 'rtl' : 'ltr',
      }}>
        <div style={{
          width: 200, height: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{step.illu}</div>
        <div style={{
          marginTop: 32,
          fontFamily: fontUI(rtl),
          fontWeight: 700, fontSize: 22,
          color: T.text1, textAlign: 'center',
          lineHeight: 1.3, maxWidth: 300,
        }}>{copy.title}</div>
        <div style={{
          marginTop: 12,
          fontFamily: fontUI(rtl),
          fontWeight: 400, fontSize: 14,
          color: T.text2, textAlign: 'center',
          lineHeight: 1.7, maxWidth: 280,
        }}>{copy.body}</div>
      </div>
      {/* Bottom: dots + CTA */}
      <div style={{
        paddingLeft: 16, paddingRight: 16, paddingBottom: 28,
        flexShrink: 0,
      }}>
        <div style={{ marginBottom: 20 }}>
          <DotIndicator active={index} rtl={rtl}/>
        </div>
        <button style={{
          width: '100%', height: 56, borderRadius: 12,
          background: T.jade400, color: '#fff', border: 'none',
          cursor: 'pointer',
          fontFamily: fontUI(rtl), fontWeight: 600, fontSize: 16,
        }}>{ctaLabel}</button>
      </div>
    </Frame>
  );
};

/* ====================================================================
   APP — canvas
===================================================================*/

const App = () => {
  const { DesignCanvas, DCSection, DCArtboard } = window;
  return (
    <DesignCanvas
      title="Unipocket — Onboarding"
      subtitle="3-step welcome · French + Arabic / RTL"
    >
      <DCSection id="onb-fr" title="Onboarding — French">
        <DCArtboard id="o1-fr" label="01 Step 1 — Schedule" width={FRAME_W} height={FRAME_H}>
          <OnboardStep index={0}/>
        </DCArtboard>
        <DCArtboard id="o2-fr" label="02 Step 2 — Grades" width={FRAME_W} height={FRAME_H}>
          <OnboardStep index={1}/>
        </DCArtboard>
        <DCArtboard id="o3-fr" label="03 Step 3 — Student ID" width={FRAME_W} height={FRAME_H}>
          <OnboardStep index={2}/>
        </DCArtboard>
      </DCSection>
      <DCSection id="onb-ar" title="Onboarding — Arabic / RTL">
        <DCArtboard id="o1-ar" label="04 Step 1 — Schedule (RTL)" width={FRAME_W} height={FRAME_H}>
          <OnboardStep index={0} rtl/>
        </DCArtboard>
        <DCArtboard id="o2-ar" label="05 Step 2 — Grades (RTL)" width={FRAME_W} height={FRAME_H}>
          <OnboardStep index={1} rtl/>
        </DCArtboard>
        <DCArtboard id="o3-ar" label="06 Step 3 — Student ID (RTL)" width={FRAME_W} height={FRAME_H}>
          <OnboardStep index={2} rtl/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
