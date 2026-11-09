/* global React */
/* ============ UDJ — GRADES (Notes / الدرجات) ============ */
/* Pinned header (title + calc) + semester control · jade GPA hero · Soft Elevated subject cards · 2 sheets. */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  StatusBar, NavBar, Scrim, SheetBtn, CatIcon, Chevron,
} = window;

const G_AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const gToAr = (s) => String(s).replace(/[0-9]/g, (d) => G_AR[+d]);

const GRAD_BG = 'linear-gradient(150deg, #1D9E75, #0B5544)'; // brand anchor, identical in dark

/* mention (from GPA) → band */
const mentionBand = (gpa) => { const v = parseFloat(gpa); return v >= 16 ? 'great' : v >= 14 ? 'good' : v >= 12 ? 'ok' : v >= 10 ? 'pass' : 'low'; };
const MENTION_DOT = { great: '#7DF3C4', good: '#9CC7F5', ok: '#FFD27D', pass: '#C7D2DB', low: '#FFB4B4' };
const mentionLabel = (gpa, list) => { const v = parseFloat(gpa); return (list.find((m) => v >= m.min) || list[list.length - 1]).label; };

/* NF → level */
const nfLevel = (nf) => { const v = parseFloat(nf); return v >= 10 ? 'ok' : v >= 8 ? 'warn' : 'risk'; };
const LEVEL_STY = (T) => ({ ok: { fg: T.jadeText, bg: T.jadeFaint, bar: T.jade }, warn: { fg: T.amber, bg: T.amberBg, bar: T.amber }, risk: { fg: T.danger, bg: T.dangerBg, bar: T.danger } });

/* ---------- semester segmented control ---------- */
const SemesterControl = ({ options, value, onChange }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div style={{ display: 'flex', background: T.sunken, borderRadius: 12, padding: 3, gap: 3, margin: '4px 20px 0' }}>
      {options.map((label, i) => {
        const a = i === value;
        return (
          <div key={i} onClick={() => onChange(i)} style={{ flex: 1, textAlign: 'center', borderRadius: 9, padding: '8px 4px', cursor: 'pointer',
            background: a ? T.jade : 'transparent', boxShadow: a ? T.navShadow : 'none', transition: 'background .15s' }}>
            <span style={{ fontFamily: font, fontWeight: a ? 700 : 600, fontSize: 13.5, color: a ? '#fff' : T.text2 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- GPA hero card ---------- */
const GpaHeroCard = ({ gpa, label, mentions, credits, over, onPress }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const band = mentionBand(gpa);
  const pct = Math.round((credits.earned / credits.total) * 100);
  return (
    <div onClick={onPress} style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 20, background: GRAD_BG,
      boxShadow: '0 12px 28px rgba(15,110,86,0.30)', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 18, insetInlineEnd: 18 }}><CatIcon kind="chart" color="rgba(255,255,255,0.7)" size={16}/></div>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: rtl ? 0 : 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 42, color: '#fff', lineHeight: 1, direction: 'ltr' }}>{gpa}<span style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)' }}>{over}</span></span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', borderRadius: 9999, padding: '5px 11px', marginBottom: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: MENTION_DOT[band] }}/>
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap' }}>{mentionLabel(gpa, mentions)}</span>
        </span>
      </div>
      <div style={{ fontFamily: font, fontWeight: 400, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 14, direction: rtl ? 'rtl' : 'ltr' }}>
        {credits.label} : {rtl ? gToAr(credits.earned) : credits.earned}/{rtl ? gToAr(credits.total) : credits.total}
      </div>
      <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.25)', marginTop: 7, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: '#fff', borderRadius: 9999 }}/>
      </div>
    </div>
  );
};

/* ---------- subject card ---------- */
const StatusPill = ({ level, label }) => {
  const { T } = useUDJ(); const font = useFont();
  const sty = LEVEL_STY(T)[level];
  return <span style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: sty.fg, background: sty.bg, borderRadius: 9999, padding: '5px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>;
};
const SubjectCard = ({ subject, metrics, status, atRisk }) => {
  const { T } = useUDJ(); const font = useFont();
  const level = nfLevel(subject.nf);
  const sty = LEVEL_STY(T)[level];
  const cells = [['CC', subject.cc], ['CF', subject.cf], ['COEF', subject.coef], ['NF', subject.nf]];
  const pct = Math.min(100, (parseFloat(subject.nf) / 20) * 100);
  return (
    <div style={{ background: T.surface, borderRadius: 18, boxShadow: T.cardShadow, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.text1, lineHeight: 1.25 }}>{subject.name}</span>
        <StatusPill level={level} label={status[level]}/>
      </div>
      <div style={{ display: 'flex', background: T.surface2, borderRadius: 12, padding: '12px 8px', marginTop: 12 }}>
        {cells.map(([k, v], i) => {
          const isNF = i === 3;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderInlineStart: i === 0 ? 'none' : `1px solid ${T.hair}` }}>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3 }}>{metrics[i]}</div>
              <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 16, color: isNF ? sty.bar : T.text1, marginTop: 3, direction: 'ltr' }}>{v}</div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 6, borderRadius: 9999, background: T.sunken, marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: sty.bar, borderRadius: 9999 }}/>
      </div>
      {level === 'risk' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
          <CatIcon kind="alert" color={T.danger} size={13}/>
          <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12.5, color: T.danger }}>{atRisk}</span>
        </div>
      )}
    </div>
  );
};

/* ---------- grade calculator sheet ---------- */
const SheetShell = ({ children, onClose }) => {
  const { T, rtl } = useUDJ();
  return (
    <>
      <Scrim onClick={onClose}/>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, background: T.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.18)', animation: 'udjSheet .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 9999, background: T.hair2, margin: '12px auto 14px' }}/>
        {children}
      </div>
    </>
  );
};
const GradeCalculatorSheet = ({ subjects, calc, over, onClose }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const [idx, setIdx] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState('');
  const [result, setResult] = React.useState(null);
  const subj = subjects[idx];
  const label = { fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', color: T.text3 };
  const compute = () => {
    const t = parseFloat((target || '').replace(',', '.'));
    if (isNaN(t)) { setResult(null); return; }
    const need = 2 * t - parseFloat(subj.cc); // NF = (CC + CF) / 2
    if (need <= 0) setResult({ kind: 'done', text: calc.resultDone });
    else if (need > 20) setResult({ kind: 'imposs', text: calc.resultImposs });
    else setResult({ kind: 'need', text: calc.resultNeed.replace('{v}', need.toFixed(2)) });
  };
  const rc = result && (result.kind === 'done' ? { fg: T.jadeText, bg: T.jadeFaint } : result.kind === 'imposs' ? { fg: T.danger, bg: T.dangerBg } : { fg: T.jadeText, bg: T.jadeFaint });
  return (
    <SheetShell onClose={onClose}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: T.text1 }}>{calc.title}</div>
        <div style={{ fontFamily: font, fontSize: 13, color: T.text2, marginTop: 4 }}>{calc.subtitle}</div>
        <div style={{ ...label, margin: '20px 0 9px' }}>{calc.matiere}</div>
        <div onClick={() => setOpen((o) => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 50,
          background: T.surface2, border: `1px solid ${T.hair}`, borderRadius: 12, padding: '0 16px', cursor: 'pointer' }}>
          <span style={{ fontFamily: font, fontWeight: 500, fontSize: 15, color: T.text1 }}>{subj.name}</span>
          <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(90deg) scaleX(1)', display: 'flex' }}><Chevron/></span>
        </div>
        {open && (
          <div style={{ background: T.surface2, borderRadius: 12, marginTop: 8, overflow: 'hidden', border: `1px solid ${T.hair}` }}>
            {subjects.map((s, i) => (
              <div key={i} onClick={() => { setIdx(i); setOpen(false); setResult(null); }} style={{ padding: '12px 16px', cursor: 'pointer',
                borderBottom: i === subjects.length - 1 ? 'none' : `1px solid ${T.hair}`, background: i === idx ? T.jadeFaint : 'transparent' }}>
                <span style={{ fontFamily: font, fontWeight: i === idx ? 700 : 500, fontSize: 14.5, color: i === idx ? T.jadeText : T.text1 }}>{s.name}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surface2, borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
          <span style={{ fontFamily: font, fontWeight: 500, fontSize: 14.5, color: T.text2 }}>{calc.currentCC}</span>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 17, color: T.jadeText, direction: 'ltr' }}>{subj.cc}<span style={{ fontSize: 13, color: T.text3 }}>{over}</span></span>
        </div>
        <div style={{ ...label, margin: '18px 0 9px' }}>{calc.target}</div>
        <div style={{ display: 'flex', alignItems: 'center', background: T.surface2, border: `1px solid ${T.hair}`, borderRadius: 12, padding: '0 16px', minHeight: 50 }}>
          <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder={calc.targetPh}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: MONO, fontSize: 16, color: T.text1, direction: 'ltr' }}/>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.text3 }}>{over}</span>
        </div>
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: rc.bg, borderRadius: 12, padding: '12px 16px', marginTop: 14 }}>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: rc.fg }}>{result.text}</span>
          </div>
        )}
        <div style={{ marginTop: 16 }}><SheetBtn kind="primary" onClick={compute}>{calc.compute}</SheetBtn></div>
      </div>
    </SheetShell>
  );
};

/* ---------- GPA history sheet ---------- */
const GPAHistorySheet = ({ history, over, onClose }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const pts = history.points;
  const W = 320, H = 150, PAD_L = 30, PAD_R = 16, PAD_T = 12, PAD_B = 26;
  const x = (i) => PAD_L + (i / Math.max(1, pts.length - 1)) * (W - PAD_L - PAD_R);
  const y = (v) => PAD_T + (1 - v / 20) * (H - PAD_T - PAD_B);
  const order = rtl ? [...pts].map((_, i) => pts.length - 1 - i) : pts.map((_, i) => i);
  const line = order.map((pi, k) => `${k === 0 ? 'M' : 'L'} ${x(rtl ? pts.length - 1 - pi : pi).toFixed(1)} ${y(pts[pi].v).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const lastX = x(rtl ? 0 : pts.length - 1), lastY = y(last.v);
  return (
    <SheetShell onClose={onClose}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: T.text1 }}>{history.title}</div>
        <div style={{ fontFamily: font, fontSize: 13, color: T.text2, marginTop: 4 }}>{history.subtitle}</div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', marginTop: 16 }}>
          {[0, 5, 10, 15, 20].map((g) => (
            <g key={g}>
              <line x1={PAD_L} y1={y(g)} x2={W - PAD_R} y2={y(g)} stroke={T.hair} strokeWidth="1" strokeDasharray={g === 10 ? '4 3' : '0'}/>
              <text x={rtl ? W - PAD_R + 4 : PAD_L - 8} y={y(g) + 4} fontFamily={MONO} fontSize="11" fill={T.text3} textAnchor={rtl ? 'start' : 'end'}>{rtl ? gToAr(g) : g}</text>
            </g>
          ))}
          {/* admission band 10..20 subtle */}
          <rect x={PAD_L} y={y(20)} width={W - PAD_L - PAD_R} height={y(10) - y(20)} fill={T.jadeFaint}/>
          <path d={line} fill="none" stroke={T.jade} strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round"/>
          {pts.map((p, i) => {
            const px = x(rtl ? pts.length - 1 - i : i), py = y(p.v); const isLast = i === pts.length - 1;
            return <circle key={i} cx={px} cy={py} r={isLast ? 6 : 5} fill={isLast ? T.jade : T.surface} stroke={T.jade} strokeWidth="2.5"/>;
          })}
          {pts.map((p, i) => {
            const px = x(rtl ? pts.length - 1 - i : i);
            return <text key={i} x={px} y={H - 8} fontFamily={font} fontSize="12" fontWeight="700" fill={T.text1} textAnchor="middle">{p.label}</text>;
          })}
        </svg>
        <div style={{ position: 'relative', height: 0 }}>
          <div style={{ position: 'absolute', left: `${(lastX / W) * 100}%`, top: -150 + lastY - 26, transform: 'translateX(-50%)',
            background: T.jade, color: '#fff', borderRadius: 8, padding: '3px 9px', fontFamily: MONO, fontSize: 12, fontWeight: 500 }}>{rtl ? gToAr(last.v.toFixed(1)) : last.v.toFixed(1)}</div>
        </div>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', color: T.text3, marginTop: 18 }}>{history.current}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: 36, color: T.jadeText, direction: 'ltr' }}>{last.v.toFixed(2)}</span>
          <span style={{ fontFamily: font, fontWeight: 500, fontSize: 16, color: T.text3 }}>{over}</span>
        </div>
        <div style={{ fontFamily: font, fontSize: 13, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>{history.hint}</div>
      </div>
    </SheetShell>
  );
};

/* ---------- screen ---------- */
const GradesScreen = ({ nav }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const G = S.grades;
  const [sem, setSem] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);
  const [sheet, setSheet] = React.useState(null);
  const data = G.bySemester[sem];
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      <div style={{ flexShrink: 0, background: T.bg, zIndex: 5, position: 'relative', paddingBottom: 12,
        boxShadow: scrolled ? (T.mode === 'dark' ? 'none' : T.cardShadow) : 'none',
        borderBottom: scrolled && T.mode === 'dark' ? `1px solid ${T.hair}` : '1px solid transparent', transition: 'box-shadow .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '2px 20px 12px' }}>
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: rtl ? 26 : 24, letterSpacing: rtl ? 0 : -0.5, color: T.text1 }}>{G.title}</span>
          <div onClick={() => setSheet('calc')} style={{ width: 38, height: 38, borderRadius: 9999, background: T.surface, boxShadow: T.cardShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <CatIcon kind="calc" color={T.text1} size={19}/>
          </div>
        </div>
        <SemesterControl options={G.semesters} value={sem} onChange={setSem}/>
      </div>
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 16px', paddingBottom: 92 }}>
        <GpaHeroCard gpa={data.gpa} label={`${G.heroLabel} · ${G.semesters[sem]}`} mentions={G.mentions} over={G.over}
          credits={{ label: G.creditsLabel, earned: G.creditsEarned, total: G.creditsTotal }} onPress={() => setSheet('history')}/>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', color: T.text3, margin: '20px 4px 10px' }}>{G.perSubject}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.subjects.map((s, i) => <SubjectCard key={i} subject={s} metrics={G.metrics} status={G.status} atRisk={G.atRisk}/>)}
        </div>
        <div style={{ height: 8 }}/>
      </div>
      <NavBar active="grades" onTab={(id) => nav.reset(id)}/>
      {sheet === 'calc' && <GradeCalculatorSheet subjects={data.subjects} calc={G.calc} over={G.over} onClose={() => setSheet(null)}/>}
      {sheet === 'history' && <GPAHistorySheet history={G.history} over={G.over} onClose={() => setSheet(null)}/>}
    </div>
  );
};

Object.assign(window, { GradesScreen, GpaHeroCard, SemesterControl, SubjectCard, GradeCalculatorSheet, GPAHistorySheet });
