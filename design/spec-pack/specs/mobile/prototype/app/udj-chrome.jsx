/* global React */
/* ============ UDJ polished prototype — CHROME ============ */
/* Floating nav, sheet/popover shells, screen scaffold, row primitives. */
const {
  useUDJ, UDJ_SANS: SANS, UDJ_ARFONT: ARFONT, UDJ_MONO: MONO, UDJ_FH: FH,
  StatusBar, Chevron, Back, Gear, Check, CatIcon, Toggle,
} = window;

/* font helper — Arabic uses Naskh */
const useFont = () => { const { rtl } = useUDJ(); return rtl ? ARFONT : SANS; };

/* ---------- floating bottom nav (app-wide) ---------- */
/* Each icon is normalized into ONE shared 24×24 frame: the source glyph is
   centered and optically scaled (filled icons slightly smaller, stroke icons
   slightly larger) so all five carry equal visual weight. Rendered uniformly. */
const NavGlyph = ({ kind, c }) => {
  const box = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none' };
  switch (kind) {
    // home — fill, native 16×18 → optical 19, centered
    case 'home': return (
      <svg {...box}>
        <g transform="translate(3.556 2.5) scale(1.05556)">
          <path fill={c} d="M2 15.5H5V10.5C5 10.2167 5.096 9.97933 5.288 9.788C5.48 9.59667 5.71733 9.50067 6 9.5H10C10.2833 9.5 10.521 9.596 10.713 9.788C10.905 9.98 11.0007 10.2173 11 10.5V15.5H14V6.5L8 2L2 6.5V15.5ZM0 15.5V6.5C0 6.18333 0.0709998 5.88333 0.213 5.6C0.355 5.31667 0.550667 5.08333 0.8 4.9L6.8 0.4C7.15 0.133333 7.55 0 8 0C8.45 0 8.85 0.133333 9.2 0.4L15.2 4.9C15.45 5.08333 15.646 5.31667 15.788 5.6C15.93 5.88333 16.0007 6.18333 16 6.5V15.5C16 16.05 15.804 16.521 15.412 16.913C15.02 17.305 14.5493 17.5007 14 17.5H10C9.71667 17.5 9.47933 17.404 9.288 17.212C9.09667 17.02 9.00067 16.7827 9 16.5V11.5H7V16.5C7 16.7833 6.904 17.021 6.712 17.213C6.52 17.405 6.28267 17.5007 6 17.5H2C1.45 17.5 0.979333 17.3043 0.588 16.913C0.196666 16.5217 0.000666667 16.0507 0 15.5Z"/>
        </g>
      </svg>);
    // agenda — fill, native 20×20 → optical 19.5, centered
    case 'schedule': return (
      <svg {...box}>
        <g transform="translate(2.25 2.25) scale(0.975)">
          <path fill={c} d="M17 2H15V1C15 0.734784 14.8946 0.48043 14.7071 0.292893C14.5196 0.105357 14.2652 0 14 0C13.7348 0 13.4804 0.105357 13.2929 0.292893C13.1054 0.48043 13 0.734784 13 1V2H7V1C7 0.734784 6.89464 0.48043 6.70711 0.292893C6.51957 0.105357 6.26522 0 6 0C5.73478 0 5.48043 0.105357 5.29289 0.292893C5.10536 0.48043 5 0.734784 5 1V2H3C2.20435 2 1.44129 2.31607 0.87868 2.87868C0.316071 3.44129 0 4.20435 0 5V17C0 17.7956 0.316071 18.5587 0.87868 19.1213C1.44129 19.6839 2.20435 20 3 20H17C17.7956 20 18.5587 19.6839 19.1213 19.1213C19.6839 18.5587 20 17.7956 20 17V5C20 4.20435 19.6839 3.44129 19.1213 2.87868C18.5587 2.31607 17.7956 2 17 2ZM18 17C18 17.2652 17.8946 17.5196 17.7071 17.7071C17.5196 17.8946 17.2652 18 17 18H3C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V10H18V17ZM18 8H2V5C2 4.73478 2.10536 4.48043 2.29289 4.29289C2.48043 4.10536 2.73478 4 3 4H5V5C5 5.26522 5.10536 5.51957 5.29289 5.70711C5.48043 5.89464 5.73478 6 6 6C6.26522 6 6.51957 5.89464 6.70711 5.70711C6.89464 5.51957 7 5.26522 7 5V4H13V5C13 5.26522 13.1054 5.51957 13.2929 5.70711C13.4804 5.89464 13.7348 6 14 6C14.2652 6 14.5196 5.89464 14.7071 5.70711C14.8946 5.51957 15 5.26522 15 5V4H17C17.2652 4 17.5196 4.10536 17.7071 4.29289C17.8946 4.48043 18 4.73478 18 5V8Z"/>
        </g>
      </svg>);
    // notes — fill, native 18×12 → optical width 19.5, centered vertically
    case 'grades': return (
      <svg {...box}>
        <g transform="translate(2.25 5.5) scale(1.08333)">
          <path fill={c} d="M1 12C0.71667 12 0.479337 11.904 0.288004 11.712C0.0966702 11.52 0.000670115 11.2827 3.44827e-06 11C-0.000663218 10.7173 0.0953369 10.48 0.288004 10.288C0.48067 10.096 0.718003 10 1 10H11C11.2833 10 11.521 10.096 11.713 10.288C11.905 10.48 12.0007 10.7173 12 11C11.9993 11.2827 11.9033 11.5203 11.712 11.713C11.5207 11.9057 11.2833 12.0013 11 12H1ZM1 7C0.71667 7 0.479337 6.904 0.288004 6.712C0.0966702 6.52 0.000670115 6.28267 3.44827e-06 6C-0.000663218 5.71733 0.0953369 5.48 0.288004 5.288C0.48067 5.096 0.718003 5 1 5H17C17.2833 5 17.521 5.096 17.713 5.288C17.905 5.48 18.0007 5.71733 18 6C17.9993 6.28267 17.9033 6.52033 17.712 6.713C17.5207 6.90567 17.2833 7.00133 17 7H1ZM1 2C0.71667 2 0.479337 1.904 0.288004 1.712C0.0966702 1.52 0.000670115 1.28267 3.44827e-06 1C-0.000663218 0.717333 0.0953369 0.48 0.288004 0.288C0.48067 0.0960001 0.718003 0 1 0H17C17.2833 0 17.521 0.0960001 17.713 0.288C17.905 0.48 18.0007 0.717333 18 1C17.9993 1.28267 17.9033 1.52033 17.712 1.713C17.5207 1.90567 17.2833 2.00133 17 2H1Z"/>
        </g>
      </svg>);
    // actus — stroke, native 21×21 → optical 21, centered (stroke 1.5)
    case 'news': return (
      <svg {...box}>
        <g transform="translate(1.5 1.5)">
          <path fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" d="M0.750168 17.9082V13.2572C0.750168 12.5472 0.750168 12.1932 0.881168 12.1532C1.01317 12.1132 1.21417 12.4192 1.61617 13.0302C3.00817 15.1442 5.35617 17.4922 7.47017 18.8842C8.08017 19.2862 8.38617 19.4872 8.34717 19.6192C8.30717 19.7492 7.95317 19.7492 7.24317 19.7492H2.59217C1.72417 19.7492 1.28917 19.7492 1.02017 19.4802C0.750168 19.2102 0.750168 18.7762 0.750168 17.9082ZM19.7502 2.59224V7.24324C19.7502 7.95324 19.7502 8.30724 19.6202 8.34724C19.4882 8.38624 19.2872 8.08124 18.8842 7.47024C17.4922 5.35624 15.1442 3.00824 13.0302 1.61624C12.4202 1.21424 12.1142 1.01324 12.1542 0.881244C12.1942 0.750244 12.5482 0.750244 13.2572 0.750244H17.9092C18.7772 0.750244 19.2112 0.750244 19.4812 1.02024C19.7512 1.29024 19.7502 1.72424 19.7502 2.59224ZM0.750168 2.65024V4.87624C0.750168 5.65324 0.750168 6.04124 0.895168 6.39024C1.03917 6.74024 1.31417 7.01424 1.86317 7.56324L12.9372 18.6372C13.4872 19.1872 13.7612 19.4612 14.1102 19.6052C14.4592 19.7492 14.8472 19.7502 15.6242 19.7502H17.8502C18.7462 19.7502 19.1932 19.7502 19.4722 19.4722C19.7502 19.1932 19.7502 18.7462 19.7502 17.8502V15.6242C19.7502 14.8472 19.7502 14.4592 19.6052 14.1102C19.4612 13.7602 19.1862 13.4862 18.6372 12.9372L7.56317 1.86324C7.01317 1.31324 6.73917 1.03924 6.39017 0.895244C6.04117 0.751244 5.65317 0.750244 4.87617 0.750244H2.65017C1.75417 0.750244 1.30617 0.750244 1.02817 1.02824C0.750168 1.30724 0.750168 1.75424 0.750168 2.65024Z"/>
        </g>
      </svg>);
    // profile — stroke, native 24×24 → optical 21, centered (stroke kept ~1.5)
    case 'profile': return (
      <svg {...box}>
        <g transform="translate(1.5 1.5) scale(0.875)">
          <path fill="none" stroke={c} strokeWidth="1.714" strokeLinejoin="round" d="M4 18C4 16.9391 4.42143 15.9217 5.17157 15.1716C5.92172 14.4214 6.93913 14 8 14H16C17.0609 14 18.0783 14.4214 18.8284 15.1716C19.5786 15.9217 20 16.9391 20 18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18Z"/>
          <path fill="none" stroke={c} strokeWidth="1.714" strokeLinejoin="round" d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10Z"/>
        </g>
      </svg>);
    default: return null;
  }
};
const NavBar = ({ active = 'profile', onTab }) => {
  const { T, S, rtl } = useUDJ();
  const ids = ['home', 'schedule', 'grades', 'news', 'profile'];
  const order = rtl ? [...ids].reverse() : ids;
  return (
    <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, height: 60, background: T.surface,
      borderRadius: 22, display: 'flex', alignItems: 'center', boxShadow: T.navShadow,
      border: T.mode === 'dark' ? `1px solid ${T.hair}` : 'none', direction: rtl ? 'rtl' : 'ltr' }}>
      {order.map(id => {
        const a = id === active;
        return (
          <div key={id} onClick={() => onTab && onTab(id)} style={{ flex: 1, display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 46, height: 46,
              justifyContent: 'center', borderRadius: 15, background: a ? T.jade : 'transparent' }}>
              <NavGlyph kind={id} c={a ? '#fff' : T.text2}/>
              {a ? <div style={{ width: 4, height: 4, borderRadius: 9, background: 'rgba(255,255,255,0.9)' }}/> : <div style={{ width: 4, height: 4 }}/>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- scaffold: status bar + optional large-title header + scroll body ---------- */
const Scaffold = ({ title, onBack, right, children, padBottom = 92, scroll = true, big = true }) => {
  const { T, rtl } = useUDJ();
  const font = useFont();
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, overflow: 'hidden', direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      {title !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 14, paddingTop: 2, paddingBottom: 8 }}>
          {onBack && (
            <div onClick={onBack} style={{ width: 38, height: 38, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: T.surface, boxShadow: T.cardShadow, cursor: 'pointer', flexShrink: 0 }}>
              <Back/>
            </div>
          )}
          <div style={{ flex: 1, fontFamily: font, fontWeight: 800, fontSize: big ? 25 : 20, letterSpacing: rtl ? 0 : -0.6, color: T.text1,
            paddingLeft: onBack ? 2 : 6 }}>{title}</div>
          {right}
        </div>
      )}
      <div style={{ position: 'absolute', top: title !== undefined ? 96 : 52, left: 0, right: 0, bottom: 0,
        overflowY: scroll ? 'auto' : 'hidden', overflowX: 'hidden', paddingBottom: padBottom }}>
        {children}
      </div>
    </div>
  );
};

/* ---------- inset grouped list (Settings direction) ---------- */
const InsetLabel = ({ children }) => {
  const { T } = useUDJ(); const font = useFont();
  return <div style={{ fontFamily: font, fontWeight: 600, fontSize: 13, color: T.text2, margin: '22px 20px 9px' }}>{children}</div>;
};
const InsetGroup = ({ children }) => {
  const { T } = useUDJ();
  const arr = React.Children.toArray(children);
  return (
    <div style={{ margin: '0 16px', background: T.surface, borderRadius: 16, overflow: 'hidden', boxShadow: T.cardShadow }}>
      {arr.map((c, i) => (
        <div key={i} style={{ borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${T.hair}` }}>{c}</div>
      ))}
    </div>
  );
};
const InsetRow = ({ label, value, mono, toggle, on, onToggle, destructive, chevron, onClick }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', minHeight: 52, paddingLeft: 16, paddingRight: 16,
      gap: 10, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ flex: 1, fontFamily: font, fontWeight: 500, fontSize: 15.5, color: destructive ? T.danger : T.text1 }}>{label}</span>
      {value !== undefined && <span style={{ fontFamily: mono ? MONO : font, fontSize: 15, color: T.text2, whiteSpace: 'nowrap' }}>{value}</span>}
      {toggle && <Toggle on={on} onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}/>}
      {chevron && <Chevron/>}
    </div>
  );
};

/* ---------- icon-led list (Profile direction) ---------- */
const TileGroup = ({ title, children }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div style={{ margin: '0 16px 14px' }}>
      {title && <div style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.3, color: T.text3,
        textTransform: 'uppercase', margin: '0 4px 8px' }}>{title}</div>}
      <div style={{ background: T.surface, borderRadius: 18, paddingLeft: 4, paddingRight: 4, boxShadow: T.cardShadow }}>{children}</div>
    </div>
  );
};
const TileRow = ({ icon, tint, tintBg, label, sub, value, mono, toggle, on, onToggle, destructive, chevron, onClick, last }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', minHeight: 58, paddingLeft: 14, paddingRight: 16, gap: 13,
      borderBottom: last ? 'none' : `1px solid ${T.hair}`, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 34, height: 34, borderRadius: 11, background: tintBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CatIcon kind={icon} color={tint}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font, fontWeight: 600, fontSize: 15, color: destructive ? T.danger : T.text1 }}>{label}</div>
        {sub && <div style={{ fontFamily: font, fontSize: 12.5, color: T.text3, marginTop: 1 }}>{sub}</div>}
      </div>
      {value !== undefined && <span style={{ fontFamily: mono ? MONO : font, fontSize: 14, fontWeight: 500, color: T.text2, whiteSpace: 'nowrap' }}>{value}</span>}
      {toggle && <Toggle on={on} onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}/>}
      {chevron && <Chevron/>}
    </div>
  );
};

/* ---------- overlays: bottom sheet + popover ---------- */
const Scrim = ({ onClick }) => {
  const { T } = useUDJ();
  return <div onClick={onClick} style={{ position: 'absolute', inset: 0, background: T.scrim, zIndex: 40 }}/>;
};
const Sheet = ({ title, subtitle, children, onClose }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  return (
    <>
      <Scrim onClick={onClose}/>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, background: T.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, direction: rtl ? 'rtl' : 'ltr',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.18)', animation: 'udjSheet .26s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 9999, background: T.hair2, margin: '12px auto 14px' }}/>
        {title && <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: T.text1, padding: '0 20px' }}>{title}</div>}
        {subtitle && <div style={{ fontFamily: font, fontSize: 13, color: T.text2, padding: '4px 20px 0', lineHeight: 1.4 }}>{subtitle}</div>}
        <div style={{ marginTop: title ? 12 : 4 }}>{children}</div>
      </div>
    </>
  );
};
const Popover = ({ title, children, onClose }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  return (
    <>
      <Scrim onClick={onClose}/>
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ width: '84%', background: T.surface, borderRadius: 18, overflow: 'hidden', pointerEvents: 'auto',
          direction: rtl ? 'rtl' : 'ltr', boxShadow: T.cardShadowLg, animation: 'udjPop .2s ease' }}>
          {title && <div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.text1, padding: '16px 20px 4px' }}>{title}</div>}
          <div style={{ paddingTop: title ? 4 : 8, paddingBottom: 6 }}>{children}</div>
        </div>
      </div>
    </>
  );
};

/* option row used in pickers */
const OptionRow = ({ label, sub, selected, onClick, preview, last }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', minHeight: 54, padding: '10px 20px', gap: 12, cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${T.hair}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 15, color: T.text1 }}>{label}</div>
        {sub && <div style={{ fontFamily: font, fontSize: 12.5, color: T.text3, marginTop: 1 }}>{sub}</div>}
        {preview && <div style={{ fontFamily: font, fontSize: preview.size, color: T.text2, marginTop: 6, lineHeight: 1.35 }}>{preview.text}</div>}
      </div>
      <div style={{ width: 23, height: 23, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: selected ? 'none' : `2px solid ${T.hair2}`, background: selected ? T.jade : 'transparent' }}>
        {selected && <Check size={13}/>}
      </div>
    </div>
  );
};

/* full-width button used in sheets */
const SheetBtn = ({ kind = 'primary', children, onClick }) => {
  const { T } = useUDJ(); const font = useFont();
  const base = { height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: font, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', width: '100%' };
  const styleByKind = {
    primary: { background: T.jade, color: '#fff' },
    danger: { background: T.danger, color: '#fff' },
    outline: { background: 'transparent', color: T.text1, border: `1px solid ${T.hair2}`, fontWeight: 600 },
  };
  return <button onClick={onClick} style={{ ...base, ...styleByKind[kind] }}>{children}</button>;
};

Object.assign(window, {
  useFont, NavBar, Scaffold, InsetLabel, InsetGroup, InsetRow,
  TileGroup, TileRow, Sheet, Popover, OptionRow, SheetBtn, Scrim,
});
