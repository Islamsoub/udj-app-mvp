/* global React */
/* ============ UDJ — NOTIFICATIONS (compact header + grouped Soft Elevated cards) ============ */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  Scaffold, CatIcon, notifColor,
} = window;

const NOTIF_ICON = { notes: 'doc', agenda: 'cal', presence: 'alert', news: 'mega', general: 'info' };

const NotifRow = ({ cat, severity, title, body, date, catLabel, read, last, onClick }) => {
  const { T } = useUDJ(); const font = useFont();
  const c = notifColor(T, cat, severity);
  const clamp2 = { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
  return (
    <div onClick={onClick} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 13, padding: 14,
      background: read ? 'transparent' : T.jadeFaint, borderBottom: last ? 'none' : `1px solid ${T.hair}`, cursor: 'pointer' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: c.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CatIcon kind={NOTIF_ICON[cat] || 'bell'} color={c.fg} size={19}/>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingInlineEnd: 12 }}>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: T.text1, lineHeight: 1.3, ...clamp2 }}>{title}</div>
        <div style={{ fontFamily: font, fontWeight: 400, fontSize: 13.5, color: T.text2, lineHeight: 1.4, marginTop: 3, ...clamp2 }}>{body}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 9 }}>
          <span style={{ fontFamily: MONO, fontWeight: 400, fontSize: 12, color: T.text3 }}>{date}</span>
          <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12, color: c.fg, background: c.bg, borderRadius: 9999, padding: '4px 10px', whiteSpace: 'nowrap' }}>{catLabel}</span>
        </div>
      </div>
      {!read && <div style={{ position: 'absolute', top: 16, insetInlineEnd: 14, width: 8, height: 8, borderRadius: 9999, background: T.jade }}/>}
    </div>
  );
};

const NotifGroup = ({ label, action, onAction, first, children }) => {
  const { T } = useUDJ(); const font = useFont();
  const arr = React.Children.toArray(children);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 20px', margin: first ? '2px 0 10px' : '22px 0 10px' }}>
        <span style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, textTransform: 'uppercase', color: T.text3, whiteSpace: 'nowrap' }}>{label}</span>
        {action && <span onClick={onAction} style={{ fontFamily: font, fontWeight: 600, fontSize: 14, color: onAction ? T.jadeText : T.text3, cursor: onAction ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>{action}</span>}
      </div>
      <div style={{ margin: '0 16px', background: T.surface, borderRadius: 16, overflow: 'hidden', boxShadow: T.cardShadow }}>
        {arr.map((c, i) => React.cloneElement(c, { last: i === arr.length - 1 }))}
      </div>
    </>
  );
};

const NotificationsScreen = ({ nav }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const N = S.notif;
  // read overrides keyed by "g-i"
  const [readSet, setReadSet] = React.useState({});
  const [snack, setSnack] = React.useState(false);
  const timer = React.useRef(null);
  const isRead = (g, i) => readSet[`${g}-${i}`] ?? N.groups[g].items[i].read;
  const markOne = (g, i) => setReadSet(s => ({ ...s, [`${g}-${i}`]: true }));
  const markAll = () => {
    const all = {}; N.groups.forEach((grp, g) => grp.items.forEach((it, i) => { all[`${g}-${i}`] = true; }));
    setReadSet(all); setSnack(true);
    clearTimeout(timer.current); timer.current = setTimeout(() => setSnack(false), 3600);
  };
  const undo = () => { setReadSet({}); setSnack(false); clearTimeout(timer.current); };
  const anyUnread = N.groups.some((grp, g) => grp.items.some((it, i) => !isRead(g, i)));
  const onRow = (g, i, cat) => { markOne(g, i); if (cat === 'presence') nav.push('presence'); };

  return (
    <Scaffold title={N.title} onBack={() => nav.pop()} big={false} padBottom={24}>
      {N.groups.map((grp, g) => (
        <NotifGroup key={g} first={g === 0} label={grp.label}
          action={g === 0 ? N.markAll : null} onAction={g === 0 && anyUnread ? markAll : null}>
          {grp.items.map((it, i) => (
            <NotifRow key={i} {...it} read={isRead(g, i)} onClick={() => onRow(g, i, it.cat)}/>
          ))}
        </NotifGroup>
      ))}
      {/* undo snackbar */}
      {snack && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 60 }}>
          <div style={{ pointerEvents: 'auto', margin: '0 16px 22px', background: T.mode === 'dark' ? '#23302A' : '#1C2320', color: '#fff',
            borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: T.cardShadowLg, maxWidth: 320 }}>
            <span style={{ fontFamily: font, fontWeight: 500, fontSize: 13.5, flex: 1 }}>{N.marked}</span>
            <span onClick={undo} style={{ fontFamily: font, fontWeight: 700, fontSize: 13.5, color: T.jade, cursor: 'pointer' }}>{N.undo}</span>
          </div>
        </div>
      )}
    </Scaffold>
  );
};

Object.assign(window, { NotificationsScreen, NotifGroup, NotifRow });
