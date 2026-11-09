/* global React */
/* ============ UDJ — SCHEDULE (Emploi du temps) ============ */
/* Pinned header (title + week nav + DayStrip) · timeline (gutter + connector + ScheduleCard) · CourseDetailSheet. */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  StatusBar, NavBar, Scrim, SheetBtn, courseColor, ScheduleCard, SCHED_STATUS,
} = window;

/* fixed "now" for the prototype: Wed 10 June 2026, 12:16 */
const NOW = new Date(2026, 5, 10, 12, 16).getTime();
const BASE_SUNDAY = new Date(2026, 5, 7); // Dim 7 juin 2026

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toAr = (s) => String(s).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
const num = (n, rtl) => (rtl ? toAr(n) : String(n));

const dayDate = (offset, idx) => {
  const d = new Date(BASE_SUNDAY);
  d.setDate(d.getDate() + offset * 7 + idx);
  return d;
};
const atTime = (date, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date); d.setHours(h, m, 0, 0); return d.getTime();
};
const statusOf = (date, c) => {
  if (NOW > atTime(date, c.end)) return 'done';
  if (NOW >= atTime(date, c.start)) return 'live';
  return 'upcoming';
};
const isToday = (date) => {
  const t = new Date(NOW);
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate();
};
const minutesBetween = (date, endPrev, startNext) => (atTime(date, startNext) - atTime(date, endPrev)) / 60000;

/* ---------- week navigation arrows ---------- */
const NavArrow = ({ dir, onClick }) => {
  const { T, rtl } = useUDJ();
  const pointLeft = dir === 'prev' ? !rtl : rtl;
  return (
    <div onClick={onClick} style={{ width: 38, height: 38, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
      <svg width="8" height="14" viewBox="0 0 7 12" style={{ transform: pointLeft ? 'none' : 'scaleX(-1)' }}>
        <path d="M6 1 L1 6 L6 11" stroke={T.text2} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
};

/* ---------- day cell ---------- */
const DayCell = ({ wd, date, selected, today, weekend, onClick }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const bg = selected ? T.jade : weekend ? T.sunken : 'transparent';
  const wdColor = selected ? '#fff' : T.text3;
  const dColor = selected ? '#fff' : weekend ? T.text3 : T.text1;
  return (
    <div onClick={onClick} style={{ flex: 1, minWidth: 0, height: 62, borderRadius: 16, background: bg, position: 'relative',
      boxShadow: selected ? T.navShadow : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer' }}>
      <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12.5, color: wdColor }}>{wd}</span>
      <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 17, color: dColor, direction: 'ltr' }}>{num(date.getDate(), rtl)}</span>
      {today && !selected && <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 9999, background: T.jade }}/>}
    </div>
  );
};

/* ---------- timeline row (connector + slot · Option 4: no gutter, time lives in the card) ---------- */
const TimelineRow = ({ dotColor, hollow, live, isLast, children }) => {
  const { T } = useUDJ();
  return (
    <div style={{ display: 'flex', paddingBottom: isLast ? 0 : 16 }}>
      <div style={{ width: 24, flexShrink: 0, position: 'relative' }}>
        {!isLast && <div style={{ position: 'absolute', insetInlineStart: '50%', transform: 'translateX(-50%)', top: 29, bottom: 0, width: 2, background: T.hair2 }}/>}
        {hollow
          ? <div style={{ position: 'absolute', insetInlineStart: '50%', transform: 'translateX(-50%)', top: 16, width: 10, height: 10, borderRadius: 9999, background: T.bg, border: `2px solid ${T.hair2}` }}/>
          : <div style={{ position: 'absolute', insetInlineStart: '50%', transform: 'translateX(-50%)', top: 15, width: 12, height: 12, borderRadius: 9999, background: dotColor,
              boxShadow: live ? `0 0 0 4px ${T.jadeFaint}` : 'none', animation: live ? 'udjPulse 1.8s ease-in-out infinite' : 'none' }}/>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
};

/* ---------- gap row ---------- */
const GapRow = ({ time, mins, isLast }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const SC = S.schedule;
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  let label;
  if (rtl) label = `${SC.breakLabel} ${m ? `${toAr(h)} س ${toAr(m)}` : `${toAr(h)} ${h > 1 ? SC.heures : SC.heure}`}`;
  else label = `${SC.breakLabel} ${m ? `${h} h ${m}` : `${h} ${h > 1 ? SC.heures : SC.heure}`}`;
  return (
    <TimelineRow time={time} hollow isLast={isLast}>
      <div style={{ paddingTop: 13, fontFamily: font, fontWeight: 500, fontSize: 14, color: T.text3 }}>{label}</div>
    </TimelineRow>
  );
};

/* ---------- empty / weekend block ---------- */
const EmptyDay = ({ weekend }) => {
  const { T, S } = useUDJ(); const font = useFont();
  const SC = S.schedule;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '54px 40px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: 9999, background: weekend ? T.surface2 : T.jadeFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {weekend
          ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h13v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M7 4c-.5.6-.5 1.4 0 2M11 4c-.5.6-.5 1.4 0 2"/></svg>
          : <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={T.jadeText} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5H20.5M8 3V6.5M16 3V6.5"/></svg>}
      </div>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.text1, marginTop: 16 }}>{weekend ? SC.weekendTitle : SC.emptyTitle}</div>
      <div style={{ fontFamily: font, fontSize: 14, color: T.text2, marginTop: 6, lineHeight: 1.5 }}>{weekend ? SC.weekendSub : SC.emptySub}</div>
    </div>
  );
};

/* ---------- course detail sheet ---------- */
const DetailRow = ({ label, children, mono, last }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '14px 0', borderBottom: last ? 'none' : `1px solid ${T.hair}` }}>
      <span style={{ fontFamily: font, fontWeight: 500, fontSize: 14.5, color: T.text2 }}>{label}</span>
      <span style={{ fontFamily: mono ? MONO : font, fontWeight: 600, fontSize: 14.5, color: T.text1, direction: mono ? 'ltr' : 'inherit' }}>{children}</span>
    </div>
  );
};
const CourseDetailSheet = ({ course, date, onClose }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const SC = S.schedule;
  const [note, setNote] = React.useState('');
  const rail = courseColor(T, course.course);
  const st = statusOf(date, course);
  const sty = SCHED_STATUS(T)[st];
  return (
    <>
      <Scrim onClick={onClose}/>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, background: T.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.18)', animation: 'udjSheet .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 9999, background: T.hair2, margin: '12px auto 14px' }}/>
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 9999, background: rail, flexShrink: 0 }}/>
            <span style={{ fontFamily: font, fontWeight: 800, fontSize: 22, letterSpacing: rtl ? 0 : -0.4, color: T.text1 }}>{course.title}</span>
          </div>
          <div style={{ fontFamily: font, fontWeight: 500, fontSize: 14, color: T.text2, marginTop: 3 }}>{course.prof}</div>
          <div style={{ height: 1, background: T.hair, margin: '16px 0 0' }}/>
          <DetailRow label={SC.detail.salle}>{course.room}</DetailRow>
          <DetailRow label={SC.detail.horaire} mono>{course.start} – {course.end}</DetailRow>
          <DetailRow label={SC.detail.code} mono>{course.code}</DetailRow>
          <DetailRow label={SC.detail.coef}>{num(course.coef, rtl)}</DetailRow>
          <DetailRow label={SC.detail.statut} last>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: sty.fg, background: sty.bg, borderRadius: 9999, padding: '5px 12px', whiteSpace: 'nowrap' }}>{SC.status[st]}</span>
          </DetailRow>
          <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', color: T.text3, margin: '20px 0 9px' }}>{SC.detail.notesLabel}</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={SC.detail.notePlaceholder}
            style={{ width: '100%', minHeight: 88, resize: 'none', background: T.surface2, border: `1px solid ${T.hair}`, borderRadius: 12,
              padding: '12px 14px', fontFamily: font, fontSize: 14.5, color: T.text1, outline: 'none', boxSizing: 'border-box',
              direction: rtl ? 'rtl' : 'ltr', textAlign: rtl ? 'right' : 'left' }}/>
          <div style={{ marginTop: 16 }}><SheetBtn kind="primary" onClick={onClose}>{SC.detail.save}</SheetBtn></div>
        </div>
      </div>
    </>
  );
};

/* ---------- screen ---------- */
const ScheduleScreen = ({ nav }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const SC = S.schedule;
  const [offset, setOffset] = React.useState(0);
  const [sel, setSel] = React.useState(3); // Wed
  const [scrolled, setScrolled] = React.useState(false);
  const [sheet, setSheet] = React.useState(null);
  const [animDx, setAnimDx] = React.useState(0);
  const [animKey, setAnimKey] = React.useState(0);
  const drag = React.useRef(null);

  const selDate = dayDate(offset, sel);
  const classes = SC.byDay[sel];
  const weekend = classes === null;
  const sundayDate = dayDate(offset, 0);
  const weekLabel = `${SC.weekOfPrefix} ${num(sundayDate.getDate(), rtl)} ${SC.months[sundayDate.getMonth()]}`;
  const atToday = offset === 0 && isToday(selDate);
  const subtitle = `${atToday ? SC.todayPrefix + ' – ' : ''}${SC.wdLong[sel]} ${num(selDate.getDate(), rtl)} ${SC.months[selDate.getMonth()]}`;

  const goDay = (next) => {
    const ns = sel + (next ? 1 : -1);
    if (ns < 0 || ns > 6) return;
    setAnimDx(next ? (rtl ? -24 : 24) : (rtl ? 24 : -24));
    setAnimKey((k) => k + 1);
    setSel(ns);
  };
  const selectDay = (i) => {
    if (i === sel) return;
    setAnimDx(i > sel ? (rtl ? -24 : 24) : (rtl ? 24 : -24));
    setAnimKey((k) => k + 1);
    setSel(i);
  };
  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) goDay(rtl ? dx > 0 : dx < 0);
  };

  // build timeline items (classes + computed gaps)
  const items = [];
  if (classes) classes.forEach((c, i) => {
    if (i > 0) {
      const gap = minutesBetween(selDate, classes[i - 1].end, c.start);
      if (gap > 30) items.push({ gap: true, time: classes[i - 1].end, mins: gap });
    }
    items.push({ ...c });
  });

  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      {/* pinned header */}
      <div style={{ flexShrink: 0, padding: '2px 20px 14px', background: T.bg, zIndex: 5, position: 'relative',
        boxShadow: scrolled ? (T.mode === 'dark' ? 'none' : T.cardShadow) : 'none',
        borderBottom: scrolled && T.mode === 'dark' ? `1px solid ${T.hair}` : '1px solid transparent', transition: 'box-shadow .2s' }}>
        <div style={{ fontFamily: font, fontWeight: 800, fontSize: rtl ? 26 : 22, letterSpacing: rtl ? 0 : -0.5, color: T.text1 }}>{SC.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <NavArrow dir="prev" onClick={() => setOffset((o) => o - 1)}/>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: font, fontWeight: 600, fontSize: 15, color: T.text1 }}>{weekLabel}</div>
          {!atToday && (
            <span onClick={() => { setOffset(0); setSel(3); setAnimDx(0); setAnimKey((k) => k + 1); }}
              style={{ fontFamily: font, fontWeight: 700, fontSize: 13, color: T.jadeText, background: T.jadeFaint, borderRadius: 9999, padding: '5px 11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{SC.todayBtn}</span>
          )}
          <NavArrow dir="next" onClick={() => setOffset((o) => o + 1)}/>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {SC.wdShort.map((wd, i) => {
            const dt = dayDate(offset, i);
            return <DayCell key={i} wd={wd} date={dt} selected={i === sel} today={offset === 0 && isToday(dt)} weekend={i >= 5} onClick={() => selectDay(i)}/>;
          })}
        </div>
        <div style={{ fontFamily: font, fontWeight: 600, fontSize: 15, color: T.jadeText, marginTop: 12 }}>{subtitle}</div>
      </div>
      {/* timeline */}
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        onPointerDown={onDown} onPointerUp={onUp}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 16, paddingBottom: 92 }}>
        <div key={animKey} style={{ padding: '0 16px', animation: 'udjDay .24s ease', ['--udj-dx']: animDx + 'px' }}>
          {weekend || items.length === 0
            ? <EmptyDay weekend={weekend}/>
            : items.map((it, i) => {
              const last = i === items.length - 1;
              if (it.gap) return <GapRow key={i} time={it.time} mins={it.mins} isLast={last}/>;
              const st = statusOf(selDate, it);
              return (
                <TimelineRow key={i} time={it.start} dotColor={st === 'live' ? T.jade : courseColor(T, it.course)} live={st === 'live'} isLast={last}>
                  <ScheduleCard {...it} variant="timeline" status={st} statusLabels={SC.status} onClick={() => setSheet(it)}/>
                </TimelineRow>
              );
            })}
        </div>
      </div>
      <NavBar active="schedule" onTab={(id) => nav.reset(id)}/>
      {sheet && <CourseDetailSheet course={sheet} date={selDate} onClose={() => setSheet(null)}/>}
    </div>
  );
};

Object.assign(window, { ScheduleScreen, CourseDetailSheet });
