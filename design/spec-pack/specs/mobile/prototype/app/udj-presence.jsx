/* global React */
/* ============ UDJ — PRÉSENCE (Soft Elevated) + justificatif sheet ============ */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  Scaffold, CatIcon, Sheet, SheetBtn,
} = window;

const levelColor = (T, lvl) => lvl === 'danger' ? T.danger : lvl === 'warn' ? T.amber : T.jade;

/* circular ring drawn in white tints for the jade hero */
const HeroRing = ({ pct, size = 96 }) => {
  const r = (size - 12) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8"/>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`}/>
    </svg>
  );
};

const PresenceSubjectCard = ({ name, pct, sessions, proj, level }) => {
  const { T } = useUDJ(); const font = useFont();
  const col = levelColor(T, level);
  return (
    <div style={{ background: T.surface, borderRadius: 16, padding: 14, boxShadow: T.cardShadow }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 9, height: 9, borderRadius: 9, background: col, marginTop: 5, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font, fontWeight: 600, fontSize: 14.5, color: T.text1 }}>{name}</div>
          <div style={{ fontFamily: font, fontSize: 12.5, color: T.text3, marginTop: 1 }}>{sessions}</div>
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 17, color: col }}>{pct}%</div>
      </div>
      <div style={{ height: 6, borderRadius: 9999, background: T.hair2, marginTop: 11, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 9999 }}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
        {level !== 'ok' && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4 L22 20 H2 Z"/><path d="M12 10v4M12 17h.01"/>
          </svg>
        )}
        <span style={{ fontFamily: font, fontSize: 12.5, fontWeight: level === 'ok' ? 400 : 600, color: level === 'ok' ? T.text3 : col }}>{proj}</span>
      </div>
    </div>
  );
};

const PresenceScreen = ({ nav, openOverlay }) => {
  const { T, S } = useUDJ(); const font = useFont();
  const P = S.presence;
  return (
    <Scaffold title={P.title} onBack={() => nav.pop()} big={false}>
      {/* hero summary */}
      <div style={{ margin: '4px 16px 16px', borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(150deg, ${T.jade} 0%, ${T.jade700} 100%)`, boxShadow: '0 12px 28px rgba(15,110,86,0.30)' }}>
        <div style={{ position: 'absolute', insetInlineEnd: -40, top: -40, width: 140, height: 140, borderRadius: 9999, background: 'rgba(255,255,255,0.07)' }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <HeroRing pct={0.87}/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, color: '#fff' }}>87%</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font, fontSize: 12.5, color: 'rgba(255,255,255,0.78)' }}>{P.rateLabel}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 9999, padding: '5px 11px' }}>
              <div style={{ width: 6, height: 6, borderRadius: 9, background: '#7DF3C4' }}/>
              <span style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, color: '#fff' }}>{P.badge}</span>
            </div>
            <div style={{ fontFamily: font, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 10 }}>{P.summary}</div>
          </div>
        </div>
      </div>

      {/* subjects */}
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, color: T.text3, textTransform: 'uppercase', margin: '0 20px 10px' }}>{P.secSubjects}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
        {P.subjects.map((s, i) => <PresenceSubjectCard key={i} {...s}/>)}
      </div>

      {/* justificatif */}
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, color: T.text3, textTransform: 'uppercase', margin: '22px 20px 10px' }}>{P.secJustif}</div>
      <div style={{ padding: '0 16px' }}>
        <div onClick={() => openOverlay('upload')} style={{ background: T.surface, borderRadius: 16, padding: '16px 14px', display: 'flex',
          alignItems: 'center', gap: 13, boxShadow: T.cardShadow, cursor: 'pointer' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: T.jadeFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CatIcon kind="upload" color={T.jadeText}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: font, fontWeight: 600, fontSize: 14.5, color: T.text1 }}>{P.upload}</div>
            <div style={{ fontFamily: font, fontSize: 12.5, color: T.text3, marginTop: 1 }}>{P.uploadHint}</div>
          </div>
        </div>
      </div>
      <div style={{ height: 8 }}/>
    </Scaffold>
  );
};

const UploadSheet = ({ onClose }) => {
  const { T, S } = useUDJ(); const font = useFont();
  const P = S.presence;
  return (
    <Sheet title={P.uploadTitle} subtitle={P.uploadBody} onClose={onClose}>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ border: `1.5px dashed ${T.hair2}`, borderRadius: 16, padding: '26px 16px', display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 10, background: T.surface2 }}>
          <div style={{ width: 48, height: 48, borderRadius: 9999, background: T.jadeFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CatIcon kind="upload" color={T.jadeText} size={22}/>
          </div>
          <span style={{ fontFamily: font, fontSize: 13, color: T.text2 }}>{P.dropHint}</span>
        </div>
      </div>
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SheetBtn kind="primary" onClick={onClose}>{P.uploadCta}</SheetBtn>
        <SheetBtn kind="outline" onClick={onClose}>{S.cancel}</SheetBtn>
      </div>
    </Sheet>
  );
};

Object.assign(window, { PresenceScreen, UploadSheet });
