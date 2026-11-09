/* global React, ReactDOM */
/* ============ UDJ — FONT/SCHEDULE COMPARISON HARNESS ============ */
const {
  UDJ_LIGHT, UDJ_STRINGS, UDJ_FW: FW, UDJ_FH: FH, UDJCtx,
  HomeScreen, ScheduleScreen, GradesScreen, ProfileScreen,
} = window;

const DISP = 0.60;                 // shrink each 360×780 phone to fit the grid
const navStub = { push() {}, pop() {}, reset() {}, set() {} };
const noop = () => {};

/* scale only React-authored inline font sizes, computed from a stored original */
function applyScale(root, factor) {
  const els = root.querySelectorAll('*');
  for (const el of els) {
    const inline = el.style && el.style.fontSize;
    if (inline && el.dataset.fsOrig === undefined) el.dataset.fsOrig = String(parseFloat(inline));
    if (el.dataset.fsOrig !== undefined) el.style.fontSize = (parseFloat(el.dataset.fsOrig) * factor).toFixed(2) + 'px';
  }
}

const CompMiniPhone = ({ screen, shrink, factor }) => {
  const ref = React.useRef(null);
  const ctx = {
    T: UDJ_LIGHT, S: UDJ_STRINGS.fr, lang: 'fr', setLang: noop,
    themeMode: 'light', setThemeMode: noop, textSize: 'normal', setTextSize: noop,
    rtl: false, dark: false,
  };
  const screens = {
    home: <HomeScreen nav={navStub} openOverlay={noop}/>,
    schedule: <ScheduleScreen nav={navStub}/>,
    grades: <GradesScreen nav={navStub}/>,
    profile: <ProfileScreen nav={navStub} openOverlay={noop}/>,
  };
  React.useEffect(() => {
    if (!shrink || !ref.current) return;
    const root = ref.current;
    let raf = 0;
    const opts = { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] };
    const run = () => applyScale(root, factor);
    run();
    const obs = new MutationObserver(() => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { run(); obs.observe(root, opts); });
    });
    obs.observe(root, opts);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [shrink, factor]);

  return (
    <div style={{ width: FW * DISP, height: FH * DISP, position: 'relative', flexShrink: 0 }}>
      <div ref={ref} style={{ position: 'absolute', top: 0, left: 0, width: FW, height: FH, transform: `scale(${DISP})`, transformOrigin: 'top left',
        borderRadius: 38, overflow: 'hidden', background: UDJ_LIGHT.bg, boxShadow: '0 16px 40px rgba(20,40,33,0.22)',
        border: '1px solid rgba(0,0,0,0.06)' }}>
        <UDJCtx.Provider value={ctx}>{screens[screen]}</UDJCtx.Provider>
      </div>
    </div>
  );
};

const COMP_SCREENS = [['home', 'Accueil'], ['schedule', 'Agenda'], ['grades', 'Notes'], ['profile', 'Profil']];

const CompHarness = () => {
  const [factor, setFactor] = React.useState(0.92);
  React.useEffect(() => {
    const slider = document.getElementById('scale');
    const pct = document.getElementById('pct');
    const rowpct = document.getElementById('rowpct');
    const ex = document.getElementById('ex');
    const upd = () => {
      const f = parseFloat(slider.value);
      setFactor(f);
      const label = Math.round(f * 100) + '%';
      pct.textContent = label;
      if (rowpct) rowpct.textContent = label;
      const px = (n) => (n * f).toFixed(1);
      ex.innerHTML = `<span><b>Titres</b> 26→${px(26)}</span><span><b>Corps</b> 15→${px(15)}</span><span><b>Labels</b> 15.5→${px(15.5)}</span><span><b>Petits</b> 12→${px(12)}</span>`;
    };
    slider.addEventListener('input', upd);
    upd();
    return () => slider.removeEventListener('input', upd);
  }, []);

  return (
    <>
      <div className="colhead">
        <div></div>
        {COMP_SCREENS.map(([id, label]) => <div key={id} className="c">{label}</div>)}
      </div>
      <div className="grid">
        <div className="rowlab"><div className="t"><span className="dot" style={{ background: '#0F6E56' }}></span>Actuel</div><div className="s">100%</div></div>
        {COMP_SCREENS.map(([id]) => <div key={id} className="cell"><CompMiniPhone screen={id} shrink={false} factor={1}/></div>)}

        <div className="rowlab" style={{ marginTop: 14 }}><div className="t"><span className="dot" style={{ background: '#E08A1E' }}></span>Réduit</div><div className="s" id="rowpct">92%</div></div>
        {COMP_SCREENS.map(([id]) => <div key={id} className="cell"><CompMiniPhone screen={id} shrink={true} factor={factor}/></div>)}
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<CompHarness/>);
