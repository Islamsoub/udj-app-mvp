/* global React */
/* ============ UDJ — HOME (Soft Elevated + Icon-led) + tab placeholders ============ */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  StatusBar, CatIcon, NavBar, courseColor, newsColor,
} = window;

/* ---------- bell button with unread badge ---------- */
const BellButton = ({ count, onClick }) => {
  const { T } = useUDJ();
  return (
    <div onClick={onClick} style={{ width: 38, height: 38, borderRadius: 9999, background: T.surface, boxShadow: T.cardShadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
      <CatIcon kind="bell" color={T.text1} size={19}/>
      {count > 0 && (
        <div style={{ position: 'absolute', top: -1, insetInlineEnd: -1, minWidth: 9, height: 9, borderRadius: 9999,
          background: T.jade, border: `1.5px solid ${T.surface}` }}/>
      )}
    </div>
  );
};

/* ---------- flat sunken stat tile ---------- */
const StatCard = ({ label, value, sub, onClick }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div onClick={onClick} style={{ flex: 1, minWidth: 0, background: T.sunken, border: `1px solid ${T.hair}`, borderRadius: 16, padding: '14px 13px',
      cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 11.5, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 26, color: T.jade, marginTop: 4, lineHeight: 1.05 }}>{value}</div>
      <div style={{ fontFamily: font, fontWeight: 500, fontSize: 12.5, color: T.text3, marginTop: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
    </div>
  );
};

/* ---------- section header with "Voir tout" ---------- */
const SectionHeader = ({ title, action, onAction, mt = 18 }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 20px', margin: `${mt}px 0 12px` }}>
      <span style={{ fontFamily: font, fontWeight: 800, fontSize: 18, letterSpacing: -0.3, color: T.text1, whiteSpace: 'nowrap' }}>{title}</span>
      {action && <span onClick={onAction} style={{ fontFamily: font, fontWeight: 600, fontSize: 14.5, color: T.jadeText, cursor: 'pointer', whiteSpace: 'nowrap' }}>{action}</span>}
    </div>
  );
};

/* ---------- schedule card (glance = Home · timeline = Agenda) ---------- */
const SCHED_STATUS = (T) => ({
  live: { fg: T.jadeText, bg: T.jadeFaint },
  upcoming: { fg: T.blue, bg: T.blueBg },
  done: { fg: T.slate, bg: T.slateBg },
});
const ScheduleCard = ({ start, end, title, prof, room, course, status, variant = 'glance',
  liveLabel, doneLabel, statusLabels, onClick }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const rail = courseColor(T, course);
  const norm = status === 'past' ? 'done' : status;
  const dim = norm === 'done';
  const timeline = variant === 'timeline';
  const titleSize = timeline && !rtl ? 15.5 : 16.5;
  const sty = SCHED_STATUS(T)[norm];
  const labels = statusLabels || { live: liveLabel, done: doneLabel, upcoming: '' };
  const showPill = timeline ? !!sty : (norm === 'live' || norm === 'done');
  return (
    <div onClick={onClick} style={{ position: 'relative', overflow: 'hidden', background: T.surface, borderRadius: 18,
      boxShadow: T.cardShadow, padding: '14px 16px 14px 18px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: 5, background: rail }}/>
      {!timeline && <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 14, color: T.text2, direction: 'ltr', textAlign: 'start' }}>{start} - {end}</div>}
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: titleSize, color: dim ? T.text2 : T.text1, marginTop: timeline ? 0 : 5 }}>{title}</div>
      <div style={{ fontFamily: font, fontWeight: 500, fontSize: 14, color: T.text2, marginTop: 2 }}>{timeline && room ? `${prof} · ${room}` : prof}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
        {timeline
          ? <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, color: T.text2, background: T.surface2, borderRadius: 9999, padding: '5px 12px', direction: 'ltr' }}>{start} – {end}</span>
          : <span style={{ fontFamily: font, fontWeight: 600, fontSize: 13, color: T.text2, background: T.surface2, borderRadius: 9999, padding: '5px 12px' }}>{room}</span>}
        {showPill && sty && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: font, fontWeight: 700, fontSize: 13, color: sty.fg, background: sty.bg, borderRadius: 9999, padding: '5px 12px', whiteSpace: 'nowrap' }}>
            {norm === 'live' && <span style={{ width: 6, height: 6, borderRadius: 9999, background: T.jade, flexShrink: 0, animation: 'udjBlink 1.4s ease-in-out infinite' }}/>}
            {labels[norm]}
          </span>
        )}
      </div>
    </div>
  );
};

/* ---------- news card ---------- */
const NewsCard = ({ title, cat, catLabel, onClick }) => {
  const { T } = useUDJ(); const font = useFont();
  const c = newsColor(T, cat);
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, background: T.surface, borderRadius: 16,
      boxShadow: T.cardShadow, padding: 12, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: T.surface2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CatIcon kind="image" color={T.text3} size={20}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font, fontWeight: 600, fontSize: 15, color: T.text1, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</div>
        <span style={{ display: 'inline-block', fontFamily: font, fontWeight: 600, fontSize: 12, color: c.fg, background: c.bg,
          borderRadius: 9999, padding: '4px 10px', marginTop: 7 }}>{catLabel}</span>
      </div>
    </div>
  );
};

/* ---------- HOME ---------- */
const HomeScreen = ({ nav }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const H = S.home;
  const [scrolled, setScrolled] = React.useState(false);
  const statTarget = { gpa: () => nav.reset('grades'), presence: () => nav.push('presence'), credits: null };
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      {/* pinned header */}
      <div style={{ flexShrink: 0, padding: '2px 20px 16px', background: T.bg, zIndex: 5, position: 'relative',
        boxShadow: scrolled ? (T.mode === 'dark' ? 'none' : T.cardShadow) : 'none',
        borderBottom: scrolled && T.mode === 'dark' ? `1px solid ${T.hair}` : '1px solid transparent', transition: 'box-shadow .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 30 }}>
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: rtl ? 0 : 1.2, textTransform: 'uppercase', color: T.text3 }}>{H.date}</span>
          <BellButton count={4} onClick={() => nav.push('notifications')}/>
        </div>
        <div style={{ fontFamily: font, fontWeight: 800, fontSize: 26, letterSpacing: rtl ? 0 : -0.6, color: T.text1, marginTop: 14 }}>
          {S.greetingPrefix} <span style={{ color: T.jade }}>{S.firstName}</span>
        </div>
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 15, color: T.text2, marginTop: 3 }}>{H.sub}</div>
        <div style={{ height: 1, background: T.hair, marginTop: 16 }}/>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {H.stats.map(s => <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} onClick={statTarget[s.key]}/>)}
        </div>
      </div>
      {/* scrolling feed */}
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 92 }}>
        <SectionHeader title={H.agenda} action={H.seeAll} onAction={() => nav.reset('schedule')}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {H.schedule.map((c, i) => <ScheduleCard key={i} {...c} liveLabel={H.live} doneLabel={H.done}/>)}
        </div>
        <SectionHeader title={H.news} action={H.seeAll} onAction={() => nav.reset('news')} mt={26}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
          {H.newsItems.map((n, i) => <NewsCard key={i} {...n}/>)}
        </div>
        <div style={{ height: 8 }}/>
      </div>
      <NavBar active="home" onTab={(id) => nav.reset(id)}/>
    </div>
  );
};

/* ---------- tab placeholder (Agenda / Notes / Actualités) ---------- */
const ComingSoon = ({ tab, nav }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const map = { schedule: 'cal', grades: 'grad', news: 'mega' };
  const label = S.tabs[tab];
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      <div style={{ padding: '2px 20px 8px' }}>
        <div style={{ fontFamily: font, fontWeight: 800, fontSize: 25, letterSpacing: rtl ? 0 : -0.6, color: T.text1 }}>{label}</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, top: 96, bottom: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: T.jadeFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CatIcon kind={map[tab]} color={T.jadeText} size={28}/>
        </div>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: T.text1, marginTop: 16 }}>{rtl ? 'قريباً' : 'Bientôt disponible'}</div>
        <div style={{ fontFamily: font, fontSize: 14, color: T.text2, marginTop: 8, lineHeight: 1.5 }}>
          {rtl ? 'هذه الشاشة غير مضمّنة في هذه المعاينة.' : "Cet écran n'est pas inclus dans cette maquette."}
        </div>
      </div>
      <NavBar active={tab} onTab={(id) => nav.reset(id)}/>
    </div>
  );
};

Object.assign(window, { HomeScreen, ComingSoon, BellButton, StatCard, SectionHeader, ScheduleCard, NewsCard, SCHED_STATUS });
