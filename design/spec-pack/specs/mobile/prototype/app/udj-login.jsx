/* global React */
/* ============ UDJ — LOGIN (clean, matches reference + deeper hero + rounded sheet) ============ */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO, CatIcon, Avatar,
} = window;

/* ---------- brand mark: U-only mark (assets/brand/unipocket-u-mark.svg). Mortarboard retired 2026-10-27. ---------- */
const UDJLogo = ({ size = 64, color = '#fff' }) => (
  <svg width={size} height={size * 1.0773} viewBox="15.06 7.89 74.15 79.88" fill={color} style={{ display: 'block' }}>
    <path d="M26.4219 14.8672C34.0805 19.5678 38.5367 28.096 38.0225 37.0674L37.1553 52.1963C36.6268 61.414 43.9595 69.1796 53.1924 69.1797C61.8981 69.1797 68.8706 61.9632 68.5713 53.2627L67.9844 36.2168C67.6906 27.6772 71.8344 19.5925 78.9385 14.8447L89.207 7.98242V57.0488C89.207 74.0141 75.4544 87.7674 58.4893 87.7676H45.7773C28.8122 87.7673 15.0596 74.014 15.0596 57.0488V7.89258L26.4219 14.8672Z"/>
  </svg>
);

/* ---------- white status bar for the green hero ---------- */
const HeroStatusBar = () => {
  const { rtl } = useUDJ();
  const c = '#fff';
  return (
    <div style={{ height: 44, paddingTop: 14, paddingLeft: 22, paddingRight: 18, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 13, fontWeight: 500, color: c, direction: 'ltr' }}>
      <span>{rtl ? '٩:٤١' : '9:41'}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="16" height="11" viewBox="0 0 16 11"><g fill={c}>
          <rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4" y="5" width="3" height="6" rx="0.5"/>
          <rect x="8" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="12" y="0" width="3" height="11" rx="0.5"/>
        </g></svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round">
          <path d="M1 4 C 4 1, 10 1, 13 4"/><path d="M3 6 C 5 4.5, 9 4.5, 11 6"/><path d="M5 8 C 6 7.3, 8 7.3, 9 8"/>
          <circle cx="7" cy="9.6" r="0.7" fill={c} stroke="none"/>
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect x="0.5" y="0.5" width="19" height="10" rx="2" fill="none" stroke={c} strokeOpacity="0.5"/>
          <rect x="2" y="2" width="14" height="7" rx="1" fill={c}/>
          <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill={c} fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
};

/* ---------- text field ---------- */
const Field = ({ value, placeholder, mono, secure, variant = 'plain', disabled, danger, autoFocus }) => {
  const { T } = useUDJ(); const font = useFont();
  const [focus, setFocus] = React.useState(false);
  // resting styles
  let bg = T.surface, border = T.hair2;
  if (variant === 'filled') { bg = T.jadeFaint; border = 'transparent'; }
  let ring = 'none';
  if (danger) { bg = T.dangerBg; border = T.danger; }
  else if (disabled) { bg = T.sunken; border = 'transparent'; }
  else if (focus) { border = T.jade; ring = `0 0 0 3px ${T.jadeFaint}`; }
  return (
    <input
      defaultValue={value}
      placeholder={placeholder}
      type={secure ? 'password' : 'text'}
      disabled={disabled}
      autoFocus={autoFocus}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ width: '100%', height: 58, borderRadius: 16, paddingLeft: 18, paddingRight: 18, outline: 'none',
        border: `1.5px solid ${border}`, background: bg, boxShadow: ring, transition: 'border-color .15s, box-shadow .15s',
        fontFamily: mono ? MONO : font, fontSize: mono ? 15 : 16, fontWeight: 500,
        letterSpacing: secure && !danger ? 3 : (mono ? 0.5 : 0),
        color: disabled ? T.text3 : T.text1, caretColor: T.jade }}/>
  );
};

const FieldLabel = ({ children, right }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 2px 9px' }}>
      <span style={{ fontFamily: font, fontWeight: 500, fontSize: 16, color: T.text1 }}>{children}</span>
      {right}
    </div>
  );
};

const ForgotLink = ({ children, big }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: big ? '6px 8px' : 0,
      fontFamily: font, fontWeight: 500, fontSize: big ? 16 : 15, color: T.jadeText }}>{children}</button>
  );
};

const Spinner = () => (
  <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff', animation: 'udjSpin .8s linear infinite' }}/>
);

/* ---------- primary CTA ---------- */
const Cta = ({ label, kind = 'primary' }) => {
  const { T } = useUDJ(); const font = useFont();
  const disabled = kind === 'disabled';
  const bg = disabled ? T.sunken : T.jade;
  const color = disabled ? T.text3 : '#fff';
  return (
    <button disabled={disabled} style={{ width: '100%', height: 58, borderRadius: 18, border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: bg, color, cursor: disabled ? 'default' : 'pointer',
      fontFamily: font, fontWeight: 700, fontSize: 17 }}>
      {kind === 'loading' ? <Spinner/> : label}
    </button>
  );
};

/* ---------- state cards ---------- */
const ErrorCard = () => {
  const { T } = useUDJ(); const font = useFont(); const L = useUDJ().S.login;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: T.amberBg, border: `1.5px solid ${T.amber}`,
      borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
      <CatIcon kind="alert" color={T.amber} size={24}/>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.danger }}>{L.errTitle}</div>
    </div>
  );
};

const LockCard = () => {
  const { T, dark } = useUDJ(); const font = useFont(); const L = useUDJ().S.login;
  const deep = dark ? T.amber : '#8A5512';
  return (
    <div style={{ background: T.amberBg, border: `1.5px solid ${T.amber}`, borderRadius: 20, padding: '26px 22px',
      textAlign: 'center', marginBottom: 26 }}>
      <CatIcon kind="alert" color={T.amber} size={38}/>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: deep, marginTop: 12 }}>{L.lockTitle}</div>
      <div style={{ fontFamily: font, fontSize: 14, color: deep, opacity: 0.85, marginTop: 8 }}>{L.lockBody}</div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 58, color: deep, letterSpacing: -1, lineHeight: 1.05, marginTop: 14 }}>5:00</div>
      <div style={{ fontFamily: font, fontSize: 15, color: deep, opacity: 0.85, marginTop: 4 }}>{L.lockMin}</div>
    </div>
  );
};

const SessionCard = () => {
  const { T } = useUDJ(); const font = useFont(); const L = useUDJ().S.login;
  return (
    <div style={{ display: 'flex', gap: 13, alignItems: 'center', background: T.jadeFaint, borderRadius: 16, padding: '15px 17px', marginBottom: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CatIcon kind="key" color={T.jadeText} size={22}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.jadeText }}>{L.sessTitle}</div>
        <div style={{ fontFamily: font, fontSize: 13.5, color: T.text2, marginTop: 2, lineHeight: 1.4 }}>{L.sessBody}</div>
      </div>
    </div>
  );
};

const SavedRow = () => {
  const { T } = useUDJ(); const font = useFont(); const L = useUDJ().S.login;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: T.surface, border: `1px solid ${T.hair}`,
      borderRadius: 16, padding: '13px 15px', marginBottom: 22 }}>
      <Avatar size={44} initials="AO"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font, fontWeight: 600, fontSize: 15, color: T.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L.savedName}</div>
        <div style={{ fontFamily: MONO, fontSize: 12.5, color: T.text2, marginTop: 2, whiteSpace: 'nowrap' }}>{L.savedId}</div>
      </div>
      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: font, fontWeight: 600, fontSize: 13, color: T.jadeText, whiteSpace: 'nowrap', flexShrink: 0 }}>{L.change}</button>
    </div>
  );
};

/* ---------- skeleton bones ---------- */
const Bone = ({ w, h, r = 12, mt = 0, light }) => {
  const { T } = useUDJ();
  return <div style={{ width: w, height: h, borderRadius: r, marginTop: mt,
    background: light ? 'rgba(255,255,255,0.22)' : T.sunken, animation: 'udjBone 1s ease-in-out infinite' }}/>;
};

/* ---------- screen ---------- */
const LoginScreen = ({ state = 'default', setState }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const L = S.login;
  const skeleton = state === 'skeleton';
  const submitting = state === 'submitting';
  const error = state === 'error';
  const locked = state === 'locked';
  const session = state === 'session';
  const showTagline = state === 'default' || skeleton;

  const states = [
    ['default', 'Défaut'], ['submitting', 'Connexion'], ['error', 'Erreur'],
    ['locked', 'Bloqué'], ['session', 'Session'], ['skeleton', 'Skeleton'],
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: T.surface, overflow: 'hidden', direction: rtl ? 'rtl' : 'ltr' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* ---------- HERO (deeper colour, flat & clean) ---------- */}
          <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0,
            background: `linear-gradient(160deg, ${T.jade} 0%, ${T.jade700} 100%)`, paddingBottom: 60 }}>
            <div style={{ position: 'absolute', top: -90, insetInlineStart: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
            <div style={{ position: 'absolute', top: -70, insetInlineEnd: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
            <div style={{ position: 'absolute', bottom: -40, insetInlineStart: '30%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
            <HeroStatusBar/>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 30, paddingLeft: 24, paddingRight: 24 }}>
              {skeleton ? (
                <>
                  <div style={{ width: 78, height: 84, borderRadius: 16, background: 'rgba(255,255,255,0.2)', animation: 'udjBone 1s ease-in-out infinite' }}/>
                  <Bone w={200} h={22} r={8} mt={22} light/>
                  <Bone w={150} h={14} r={7} mt={12} light/>
                </>
              ) : (
                <>
                  <UDJLogo size={64}/>
                  <div style={{ fontFamily: font, fontWeight: 800, fontSize: 24, letterSpacing: rtl ? 0 : -0.4, color: '#fff', marginTop: 20, textAlign: 'center', whiteSpace: 'nowrap' }}>{L.brand}</div>
                  {showTagline && <div style={{ fontFamily: font, fontSize: 16, color: 'rgba(255,255,255,0.82)', marginTop: 8, textAlign: 'center' }}>{L.tagline}</div>}
                </>
              )}
            </div>
          </div>

          {/* ---------- FORM SHEET (rounded top corners, lifts over hero) ---------- */}
          <div style={{ flex: 1, background: T.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30,
            marginTop: -24, position: 'relative', paddingLeft: 22, paddingRight: 22, paddingTop: 30, paddingBottom: 92 }}>

            {skeleton ? (
              <>
                <Bone w={170} h={16} r={7}/>
                <Bone w="100%" h={58} r={16} mt={11}/>
                <Bone w={130} h={16} r={7} mt={24}/>
                <Bone w="100%" h={58} r={16} mt={11}/>
                <Bone w="100%" h={58} r={18} mt={30}/>
              </>
            ) : session ? (
              <>
                <SessionCard/>
                <SavedRow/>
                <FieldLabel>{L.pwLabel}</FieldLabel>
                <Field secure value="password" variant="filled" autoFocus/>
                <div style={{ height: 28 }}/>
                <Cta label={L.signIn}/>
              </>
            ) : locked ? (
              <>
                <LockCard/>
                <FieldLabel>{L.pwLabel}</FieldLabel>
                <Field secure value="password" disabled/>
                <div style={{ height: 24 }}/>
                <Cta label={L.signIn} kind="disabled"/>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: font, fontWeight: 500, fontSize: 15, color: T.text2 }}>{L.lockHelp}</button>
                </div>
              </>
            ) : (
              <>
                <FieldLabel>{L.idLabel}</FieldLabel>
                <Field mono value={error ? '' : ''} placeholder={L.idPh} danger={error} disabled={submitting}/>
                <div style={{ height: 22 }}/>
                <FieldLabel right={state === 'default' ? <ForgotLink>{L.forgot}</ForgotLink> : null}>{L.pwLabel}</FieldLabel>
                <Field secure value={error || submitting ? 'password' : ''} placeholder={L.pwPh}
                  variant={error ? 'plain' : 'filled'} danger={error} disabled={submitting}/>
                {error && <div style={{ height: 22 }}/>}
                {error && <ErrorCard/>}
                <div style={{ height: error ? 4 : 30 }}/>
                <Cta label={submitting ? '' : (error ? L.retry : L.signIn)} kind={submitting ? 'loading' : 'primary'}/>
                {error && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                    <ForgotLink big>{L.forgot}</ForgotLink>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------- demo state switcher (minimal pills) ---------- */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, direction: rtl ? 'rtl' : 'ltr',
        background: T.mode === 'dark' ? 'rgba(23,33,29,0.92)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)', borderTop: `1px solid ${T.hair}`, padding: '10px 10px 12px' }}>
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 1 }}>
          {states.map(([id, lbl]) => {
            const a = state === id;
            return (
              <button key={id} onClick={() => setState && setState(id)} style={{ flexShrink: 0, border: 'none', cursor: 'pointer',
                borderRadius: 9999, padding: '8px 15px', fontFamily: font, fontWeight: a ? 700 : 500, fontSize: 13,
                background: a ? T.jade : T.surface2, color: a ? '#fff' : T.text2 }}>{lbl}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, UDJLogo });
