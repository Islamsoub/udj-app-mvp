/* global React */
/* ============ UDJ — APP SHELL (router, theme state, phone scaling) ============ */
const {
  UDJ_LIGHT, UDJ_DARK, UDJ_STRINGS, UDJ_FW: FW, UDJ_FH: FH, UDJCtx, UDJ_SANS: SANS,
  ProfileScreen, SettingsScreen, AccountScreen, StorageScreen, InfoScreen, PresenceScreen,
  HomeScreen, ComingSoon, NotificationsScreen, ScheduleScreen, GradesScreen, NewsScreen,
  LoginScreen,
  LanguePicker, ThemePicker, TextSizePicker, QuietHoursSheet, ClearCacheConfirm, LogoutConfirm,
  QRExpanded, SessionExpired, UploadSheet, NavBar,
} = window;

const LS = 'udj-proto-state-v2';
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } };

/* ---- app-wide type scale: reduce all font sizes ~8% for phone density ---- */
/* normal = 0.92 base; the "Taille du texte" picker steps around it. Set base to 1 to revert. */
const UDJ_TYPE_BASE = 0.92;
const UDJ_TS_MULT = { small: 0.92, normal: 1, large: 1.1 };
function applyFontScale(root, factor) {
  if (!root) return;
  const els = root.querySelectorAll('*');
  for (const el of els) {
    const inline = el.style && el.style.fontSize;
    if (inline && el.dataset.fsOrig === undefined) el.dataset.fsOrig = String(parseFloat(inline));
    if (el.dataset.fsOrig !== undefined) el.style.fontSize = (parseFloat(el.dataset.fsOrig) * factor).toFixed(2) + 'px';
  }
}

const App = () => {
  const saved = load();
  const [lang, setLang] = React.useState(saved.lang || 'fr');
  const [themeMode, setThemeMode] = React.useState(saved.themeMode || 'light');
  const [textSize, setTextSize] = React.useState(saved.textSize || 'normal');
  const [stack, setStack] = React.useState(saved.stack && saved.stack.length ? saved.stack : ['home']);
  const [loginState, setLoginState] = React.useState(saved.loginState || 'default');
  const [overlay, setOverlay] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const phoneRef = React.useRef(null);

  const dark = themeMode === 'dark';
  const T = dark ? UDJ_DARK : UDJ_LIGHT;
  const rtl = lang === 'ar';
  const S = UDJ_STRINGS[lang];

  React.useEffect(() => {
    localStorage.setItem(LS, JSON.stringify({ lang, themeMode, textSize, stack, loginState }));
  }, [lang, themeMode, textSize, stack, loginState]);

  // scale phone to viewport
  React.useEffect(() => {
    const fit = () => {
      const availH = window.innerHeight - 24;
      const availW = window.innerWidth - 230; // leave room for control rail
      setScale(Math.min(1.15, availH / FH, availW / FW));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const nav = {
    push: (s) => setStack(st => [...st, s]),
    pop: () => setStack(st => st.length > 1 ? st.slice(0, -1) : st),
    reset: (s) => setStack([s]),
    set: (arr) => setStack(arr),
  };
  const openOverlay = (o) => setOverlay(o);
  const closeOverlay = () => setOverlay(null);

  const ctx = { T, S, lang, setLang, themeMode, setThemeMode, textSize, setTextSize, rtl, dark };
  const top = stack[stack.length - 1];

  // app-wide font scale (reduced base × text-size setting), reapplied as the DOM changes
  const fontFactor = UDJ_TYPE_BASE * (UDJ_TS_MULT[textSize] || 1);
  React.useLayoutEffect(() => {
    const root = phoneRef.current;
    if (!root) return;
    let raf = 0;
    const opts = { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] };
    const run = () => applyFontScale(root, fontFactor);
    run();
    const obs = new MutationObserver(() => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { run(); obs.observe(root, opts); });
    });
    obs.observe(root, opts);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [fontFactor, top, overlay, dark, lang, loginState]);

  const screens = {
    home: <HomeScreen nav={nav} openOverlay={openOverlay}/>,
    login: <LoginScreen state={loginState} setState={setLoginState}/>,
    notifications: <NotificationsScreen nav={nav}/>,
    schedule: <ScheduleScreen nav={nav}/>,
    grades: <GradesScreen nav={nav}/>,
    news: <NewsScreen nav={nav}/>,
    profile: <ProfileScreen nav={nav} openOverlay={openOverlay}/>,
    settings: <SettingsScreen nav={nav} openOverlay={openOverlay}/>,
    account: <AccountScreen nav={nav}/>,
    storage: <StorageScreen nav={nav}/>,
    info: <InfoScreen nav={nav}/>,
    presence: <PresenceScreen nav={nav} openOverlay={openOverlay}/>,
  };
  const overlays = {
    langue: <LanguePicker onClose={closeOverlay}/>,
    theme: <ThemePicker onClose={closeOverlay}/>,
    textsize: <TextSizePicker onClose={closeOverlay}/>,
    quiet: <QuietHoursSheet onClose={closeOverlay}/>,
    clear: <ClearCacheConfirm onClose={closeOverlay}/>,
    logout: <LogoutConfirm onClose={closeOverlay}/>,
    qr: <QRExpanded onClose={closeOverlay}/>,
    session: <SessionExpired onClose={closeOverlay}/>,
    upload: <UploadSheet onClose={closeOverlay}/>,
  };

  return (
    <UDJCtx.Provider value={ctx}>
      <div style={{ position: 'fixed', inset: 0, display: 'flex', background: dark ? '#070A09' : '#E7EBE8' }}>
        <ControlRail
          dark={dark} themeMode={themeMode} setThemeMode={setThemeMode}
          lang={lang} setLang={setLang} stack={stack} nav={nav}
          openOverlay={openOverlay} top={top}
          loginState={loginState} setLoginState={setLoginState}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: FW * scale, height: FH * scale, position: 'relative' }}>
            <div ref={phoneRef} style={{ position: 'absolute', top: 0, left: 0, width: FW, height: FH, transform: `scale(${scale})`, transformOrigin: 'top left',
              borderRadius: 38, overflow: 'hidden', background: T.bg, boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
              {screens[top]}
              {overlay && overlays[overlay]}
            </div>
          </div>
        </div>
      </div>
    </UDJCtx.Provider>
  );
};

/* ---------- preview control rail (outside the phone) ---------- */
const Seg = ({ options, value, onChange, dark }) => (
  <div style={{ display: 'flex', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 3, gap: 2 }}>
    {options.map(o => {
      const a = o.v === value;
      return (
        <button key={o.v} onClick={() => onChange(o.v)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8,
          padding: '7px 4px', fontFamily: SANS, fontWeight: a ? 700 : 500, fontSize: 12,
          background: a ? (dark ? '#1D9E75' : '#0F6E56') : 'transparent', color: a ? '#fff' : (dark ? '#9DB0A8' : '#6B7B74') }}>{o.label}</button>
      );
    })}
  </div>
);
const Crumb = ({ label, onClick, dark, active }) => (
  <button onClick={onClick} style={{ textAlign: 'start', border: 'none', cursor: 'pointer', borderRadius: 9, padding: '9px 11px',
    fontFamily: SANS, fontWeight: active ? 700 : 500, fontSize: 12.5, width: '100%',
    background: active ? (dark ? 'rgba(43,185,137,0.16)' : 'rgba(29,158,117,0.10)') : 'transparent',
    color: active ? (dark ? '#5FD3A6' : '#0F6E56') : (dark ? '#9DB0A8' : '#6B7B74') }}>{label}</button>
);
const ControlRail = ({ dark, themeMode, setThemeMode, lang, setLang, stack, nav, openOverlay, top, loginState, setLoginState }) => {
  const c1 = dark ? '#ECF1EE' : '#1C2320', c2 = dark ? '#9DB0A8' : '#6B7B74';
  const screens = [
    { id: 'login', label: 'Connexion', via: ['login'] },
    { id: 'home', label: 'Accueil', via: ['home'] },
    { id: 'notifications', label: '› Notifications', via: ['home', 'notifications'] },
    { id: 'schedule', label: 'Agenda', via: ['schedule'] },
    { id: 'grades', label: 'Notes', via: ['grades'] },
    { id: 'news', label: 'Actualités', via: ['news'] },
    { id: 'profile', label: 'Profil', reset: true, via: ['profile'] },
    { id: 'settings', label: '› Paramètres', reset: false, via: ['profile', 'settings'] },
    { id: 'account', label: '·· Informations du compte', via: ['profile', 'settings', 'account'] },
    { id: 'storage', label: '·· Stockage hors-ligne', via: ['profile', 'settings', 'storage'] },
    { id: 'info', label: "·· Centre d'information", via: ['profile', 'settings', 'info'] },
    { id: 'presence', label: '› Présence', via: ['profile', 'presence'] },
  ];
  const sectionTitle = { fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: dark ? '#6E847B' : '#9EADA7', margin: '0 0 8px 2px' };
  return (
    <div style={{ width: 218, flexShrink: 0, height: '100%', overflowY: 'auto', background: dark ? '#0E1512' : '#FFFFFF',
      borderInlineEnd: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, padding: '18px 14px', boxSizing: 'border-box' }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 15, color: c1, letterSpacing: -0.3 }}>UDJ · Polished</div>
      <div style={{ fontFamily: SANS, fontSize: 11.5, color: c2, marginTop: 2, lineHeight: 1.4 }}>Tap rows in the phone to navigate. Use these for quick jumps.</div>

      <div style={{ marginTop: 18 }}>
        <div style={sectionTitle}>Thème</div>
        <Seg dark={dark} value={themeMode === 'dark' ? 'dark' : 'light'} onChange={(v) => setThemeMode(v)}
          options={[{ v: 'light', label: 'Clair' }, { v: 'dark', label: 'Sombre' }]}/>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={sectionTitle}>Langue</div>
        <Seg dark={dark} value={lang} onChange={(v) => setLang(v)}
          options={[{ v: 'fr', label: 'Français' }, { v: 'ar', label: 'العربية' }]}/>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={sectionTitle}>Écrans</div>
        {screens.map(s => (
          <Crumb key={s.id} dark={dark} active={top === s.id} label={s.label}
            onClick={() => nav.set(s.via || [s.id])}/>
        ))}
      </div>

      {top === 'login' && (
        <div style={{ marginTop: 18 }}>
          <div style={sectionTitle}>Connexion · états</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[['default', 'Défaut'], ['submitting', 'Connexion'], ['error', 'Erreur'], ['locked', 'Bloqué'], ['session', 'Session'], ['skeleton', 'Skeleton']].map(([id, lbl]) => {
              const a = loginState === id;
              return (
                <button key={id} onClick={() => setLoginState(id)} style={{ border: 'none', cursor: 'pointer', borderRadius: 9,
                  padding: '7px 10px', fontFamily: SANS, fontWeight: a ? 700 : 500, fontSize: 12,
                  background: a ? (dark ? '#1D9E75' : '#0F6E56') : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                  color: a ? '#fff' : (dark ? '#9DB0A8' : '#6B7B74') }}>{lbl}</button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <div style={sectionTitle}>Overlays</div>
        {[['langue', 'Sélecteur de langue', ['profile', 'settings']], ['theme', 'Sélecteur de thème', ['profile', 'settings']],
          ['textsize', 'Taille du texte', ['profile', 'settings']], ['quiet', 'Heures de silence', ['profile', 'settings']],
          ['clear', 'Vider le cache', ['profile', 'settings']], ['logout', 'Déconnexion', ['profile', 'settings']],
          ['qr', 'Carte QR plein écran', ['profile']], ['session', 'Session expirée', ['profile']],
          ['upload', 'Envoyer un justificatif', ['profile', 'presence']]].map(([id, label, base]) => (
          <Crumb key={id} dark={dark} label={'• ' + label} onClick={() => { nav.set(base); openOverlay(id); }}/>
        ))}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
