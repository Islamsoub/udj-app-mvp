/* global React */
/* ============ UDJ — PROFILE (Soft Elevated) + QR + session expired ============ */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  StatusBar, Chevron, Gear, CatIcon, Avatar, QR, NavBar, TileGroup, TileRow, Scrim, SheetBtn,
} = window;

const ProfileScreen = ({ nav, openOverlay }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, overflow: 'hidden', direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 16, paddingTop: 2, paddingBottom: 8 }}>
        <div style={{ fontFamily: font, fontWeight: 800, fontSize: 23, letterSpacing: rtl ? 0 : -0.5, color: T.text1 }}>{S.profile}</div>
        <div onClick={() => nav.push('settings')} style={{ width: 40, height: 40, borderRadius: 9999, background: T.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.cardShadow, cursor: 'pointer' }}><Gear/></div>
      </div>
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, bottom: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 92 }}>
        {/* hero student card */}
        <div onClick={() => openOverlay('qr')} style={{ margin: '4px 16px 14px', borderRadius: 22, padding: 18, position: 'relative',
          overflow: 'hidden', cursor: 'pointer', background: `linear-gradient(150deg, ${T.jade} 0%, ${T.jade700} 100%)`,
          boxShadow: '0 12px 28px rgba(15,110,86,0.30)' }}>
          <div style={{ position: 'absolute', insetInlineEnd: -40, bottom: -50, width: 150, height: 150, borderRadius: 9999, background: 'rgba(255,255,255,0.07)' }}/>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: '#fff' }}>AO</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: '#fff' }}>{S.fullName}</div>
              <div style={{ fontFamily: MONO, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{S.studentId}</div>
              <div style={{ fontFamily: font, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{S.filiereShort}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 10 }}>
            <div style={{ background: '#fff', padding: 5, borderRadius: 9 }}><QR size={54}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: '#fff' }}>{S.accessCode}</div>
              <div style={{ fontFamily: font, fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{S.regen}</div>
            </div>
            <Chevron color="rgba(255,255,255,0.8)" size={14}/>
          </div>
        </div>

        {/* quick actions */}
        <div style={{ display: 'flex', gap: 10, margin: '0 16px 16px' }}>
          <QuickAction icon="doc" tint={T.exam} tintBg={T.examBg} label={S.quick.docs} onClick={() => nav.push('storage')}/>
          <QuickAction icon="sync" tint={T.jadeText} tintBg={T.jadeFaint} label={S.quick.presence} onClick={() => nav.push('presence')}/>
          <QuickAction icon="bell" tint={T.amber} tintBg={T.amberBg} label={S.quick.alerts} onClick={() => nav.push('settings')}/>
        </div>

        <TileGroup title={S.details}>
          <TileRow icon="user" tint={T.jadeText} tintBg={T.jadeFaint} label={S.acFaculte} value={S.faculte} onClick={() => nav.push('account')}/>
          <TileRow icon="cal" tint={T.blue} tintBg={T.blueBg} label={S.acAnnee} value={S.annee} onClick={() => nav.push('account')}/>
          <TileRow icon="phone" tint={T.slate} tintBg={T.slateBg} label={S.acPhone} value={S.phone} mono onClick={() => nav.push('account')} last/>
        </TileGroup>
      </div>
      <NavBar active="profile" onTab={(id) => nav.reset(id)}/>
    </div>
  );
};

const QuickAction = ({ icon, tint, tintBg, label, onClick }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div onClick={onClick} style={{ flex: 1, background: T.surface, borderRadius: 16, padding: '14px 8px', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 7, boxShadow: T.cardShadow, cursor: 'pointer' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CatIcon kind={icon} color={tint}/>
      </div>
      <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12, color: T.text1 }}>{label}</span>
    </div>
  );
};

/* expanded QR — fullscreen-ish overlay */
const QRExpanded = ({ onClose }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  return (
    <>
      <Scrim onClick={onClose}/>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, background: T.surface,
        borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 28, direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', animation: 'udjSheet .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 9999, background: T.hair2, margin: '12px auto 6px' }}/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 24px 0' }}>
          <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: T.text1 }}>{S.qrFull}</div>
          <div style={{ fontFamily: font, fontSize: 13, color: T.text2, marginTop: 4, textAlign: 'center' }}>{S.qrHint}</div>
          <div style={{ marginTop: 20, padding: 16, background: '#fff', borderRadius: 20, boxShadow: T.cardShadowLg }}>
            <QR size={196}/>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 15, color: T.text1, marginTop: 16, letterSpacing: 1 }}>{S.studentId}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, background: T.jadeFaint, borderRadius: 9999, padding: '6px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: 9, background: T.jade }}/>
            <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12.5, color: T.jadeText }}>{S.regen}</span>
          </div>
        </div>
      </div>
    </>
  );
};

/* session expired */
const SessionExpired = ({ onClose }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  return (
    <>
      <Scrim onClick={onClose}/>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, background: T.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '0 22px 28px', direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.2)', animation: 'udjSheet .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 9999, background: T.hair2, margin: '12px auto 18px' }}/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 9999, background: T.examBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CatIcon kind="key" color={T.exam} size={30}/>
          </div>
          <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, color: T.text1, marginTop: 16 }}>{S.sessionTitle}</div>
          <div style={{ fontFamily: font, fontSize: 14, color: T.text2, marginTop: 8, lineHeight: 1.5 }}>{S.sessionBody}</div>
        </div>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SheetBtn kind="primary" onClick={onClose}>{S.sessionLogin}</SheetBtn>
          <SheetBtn kind="outline" onClick={onClose}>{S.sessionLater}</SheetBtn>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { ProfileScreen, QRExpanded, SessionExpired });
