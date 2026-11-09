/* global React, window */
/* ============ Unipocket Admin — CORE ============ */
/* Brand tokens (extends the mobile app), Icon set, shared primitives. */

const C = {
  /* surfaces */
  bg: '#EEF2F0', surface: '#FFFFFF', surface2: '#F4F7F5', sunken: '#ECF0ED',
  /* text */
  text1: '#1C2320', text2: '#5E6E66', text3: '#93A39B',
  /* hairlines */
  hair: 'rgba(28,35,32,0.08)', hair2: 'rgba(28,35,32,0.13)',
  /* jade brand */
  jade: '#1D9E75', jade600: '#0F6E56', jade700: '#0B5544', jade900: '#0A3D2E',
  jadeFaint: 'rgba(29,158,117,0.10)', jadeFaint2: 'rgba(29,158,117,0.16)', jadeText: '#0F6E56',
  jade50: '#E6F7F1', jade100: '#C9ECDF',
  /* status accents (from the app) */
  danger: '#E1483D', dangerBg: 'rgba(225,72,61,0.10)',
  amber: '#D9821A', amberBg: 'rgba(217,130,26,0.12)',
  exam: '#7C53E0', examBg: 'rgba(124,83,224,0.12)',
  blue: '#2F7DD1', blueBg: 'rgba(47,125,209,0.12)',
  slate: '#5A6B7B', slateBg: 'rgba(90,107,123,0.12)',
  /* sidebar (dark jade) */
  sideBg: '#0A3D2E', sideBg2: '#0E4A38', sideHair: 'rgba(255,255,255,0.09)',
  sideText: '#E6F7F1', sideMuted: '#7FB6A2', sideActive: '#1D9E75',
  /* misc */
  toggleOff: '#D5DCD8',
  shadow: '0 1px 2px rgba(28,35,32,0.05), 0 4px 14px rgba(28,35,32,0.05)',
  shadowLg: '0 8px 28px rgba(28,35,32,0.10), 0 2px 6px rgba(28,35,32,0.05)',
  shadowSide: '0 8px 30px rgba(10,61,46,0.18)',
};
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

/* ---------- Icon set (stroke, 24 grid) ---------- */
const Icon = ({ name, size = 20, color = 'currentColor', sw = 1.7, fill = 'none', style }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block', ...style } };
  switch (name) {
    case 'grid': return <svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>;
    case 'users': return <svg {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17.5 14.6c2.3.5 4 2.4 4 4.9"/></svg>;
    case 'grad': return <svg {...p}><path d="M2 8.5 12 4l10 4.5L12 13 2 8.5Z"/><path d="M6 10.5V16c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-5.5"/><path d="M22 8.5v5"/></svg>;
    case 'check-cal': return <svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5H20.5M8 3v4M16 3v4"/><path d="M9 14.5l2 2 4-4"/></svg>;
    case 'mega': return <svg {...p}><path d="M4 10v4l11 4.5V5.5L4 10Z"/><path d="M4 10H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1"/><path d="M18 9a3.5 3.5 0 0 1 0 6"/><path d="M7 15v2.5a1.5 1.5 0 0 0 3 0V16"/></svg>;
    case 'cal': return <svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5H20.5M8 3v4M16 3v4"/></svg>;
    case 'book': return <svg {...p}><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z"/><path d="M18 20a2 2 0 0 0 2-2V6"/><path d="M9 8h5M9 11h5"/></svg>;
    case 'bell': return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'shield': return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/></svg>;
    case 'list': return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>;
    case 'gear': return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l1.7-1.3-1.8-3.1-2 .8a7.6 7.6 0 0 0-1.7-1l-.3-2.1H8.7l-.3 2.1a7.6 7.6 0 0 0-1.7 1l-2-.8L2.9 9.7 4.6 11a7.6 7.6 0 0 0 0 2l-1.7 1.3 1.8 3.1 2-.8c.5.4 1.1.7 1.7 1l.3 2.1h3.6l.3-2.1c.6-.3 1.2-.6 1.7-1l2 .8 1.8-3.1L19.4 13Z"/></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
    case 'chevron': return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-d': return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'arrow-l': return <svg {...p}><path d="M15 5l-7 7 7 7"/></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check': return <svg {...p}><path d="M5 12.5 10 17.5 19 6.5"/></svg>;
    case 'x': return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'sort': return <svg {...p}><path d="M8 4v16M8 4 4 8M8 4l4 4M16 20V4M16 20l-4-4M16 20l4-4"/></svg>;
    case 'filter': return <svg {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/></svg>;
    case 'upload': return <svg {...p}><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>;
    case 'download': return <svg {...p}><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>;
    case 'eye': return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'edit': return <svg {...p}><path d="M4 20h4l10.5-10.5a2 2 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/></svg>;
    case 'trash': return <svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>;
    case 'logout': return <svg {...p}><path d="M14 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M9 12h11M17 8l4 4-4 4"/></svg>;
    case 'mail': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/></svg>;
    case 'phone': return <svg {...p}><path d="M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5 2 2 0 0 1 6 3Z"/></svg>;
    case 'file': return <svg {...p}><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/></svg>;
    case 'image': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.4"/><circle cx="8.5" cy="10" r="1.7"/><path d="M21 15.5 16 11 5 19"/></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>;
    case 'warn': return <svg {...p}><path d="M12 4 22 20H2L12 4Z"/><path d="M12 10v4M12 17h.01"/></svg>;
    case 'dot': return <svg {...p} fill={color} stroke="none"><circle cx="12" cy="12" r="4"/></svg>;
    case 'more': return <svg {...p} fill={color} stroke="none"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>;
    case 'send': return <svg {...p}><path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10l18-7Z"/></svg>;
    case 'reset': return <svg {...p}><path d="M20 11a8 8 0 1 0-1 5"/><path d="M20 5v6h-6"/></svg>;
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'lock': return <svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1.3" fill={color} stroke="none"/></svg>;
    case 'grip': return <svg {...p} fill={color} stroke="none"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>;
    case 'spark': return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    default: return null;
  }
};

/* ---------- primitives ---------- */
const Btn = ({ kind = 'primary', size = 'md', icon, iconR, children, onClick, disabled, style, type }) => {
  const [h, setH] = React.useState(false);
  const pad = size === 'sm' ? '7px 12px' : size === 'lg' ? '12px 22px' : '9px 16px';
  const fs = size === 'sm' ? 12.5 : size === 'lg' ? 15 : 13.5;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    fontFamily: SANS, fontWeight: 600, fontSize: fs, lineHeight: 1, padding: pad,
    borderRadius: 10, border: '1px solid transparent', cursor: disabled ? 'default' : 'pointer',
    transition: 'all .15s', whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1, ...style,
  };
  const kinds = {
    primary: { background: h && !disabled ? C.jade600 : C.jade, color: '#fff', boxShadow: h && !disabled ? 'none' : '0 1px 2px rgba(15,110,86,0.25)' },
    ghost: { background: h ? C.sunken : 'transparent', color: C.text1, borderColor: C.hair2 },
    soft: { background: h ? C.jadeFaint2 : C.jadeFaint, color: C.jadeText },
    danger: { background: h ? C.danger : C.dangerBg, color: h ? '#fff' : C.danger },
    dangerSolid: { background: h ? '#c43a30' : C.danger, color: '#fff' },
    quiet: { background: h ? C.sunken : 'transparent', color: C.text2 },
  };
  return (
    <button type={type || 'button'} onClick={disabled ? undefined : onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ ...base, ...kinds[kind] }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {iconR && <Icon name={iconR} size={size === 'sm' ? 15 : 17} />}
    </button>
  );
};

const Badge = ({ tone = 'slate', children, dot, soft = true, style }) => {
  const map = {
    jade: [C.jadeText, C.jadeFaint], green: [C.jadeText, C.jadeFaint],
    danger: [C.danger, C.dangerBg], amber: [C.amber, C.amberBg],
    blue: [C.blue, C.blueBg], exam: [C.exam, C.examBg], slate: [C.slate, C.slateBg],
  };
  const [fg, bg] = map[tone] || map.slate;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: SANS, fontWeight: 600, fontSize: 11.5,
      padding: '3px 9px', borderRadius: 999, color: fg, background: soft ? bg : 'transparent',
      border: soft ? 'none' : `1px solid ${fg}33`, whiteSpace: 'nowrap', ...style }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: fg }} />}
      {children}
    </span>
  );
};

const Card = ({ children, pad = 20, style, onClick, hover }) => {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.hair}`, padding: pad,
        boxShadow: hover && h ? C.shadowLg : C.shadow, transition: 'box-shadow .15s, transform .15s',
        transform: hover && h ? 'translateY(-1px)' : 'none', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
};

const Avatar = ({ name = '', size = 36, tone, ring }) => {
  const init = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: tone || C.jadeFaint, color: tone ? '#fff' : C.jadeText,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontFamily: SANS, fontWeight: 700, fontSize: size * 0.4,
      boxShadow: ring ? `0 0 0 2px ${C.surface}, 0 0 0 4px ${C.jadeFaint}` : 'none' }}>{init}</div>
  );
};

const SectionLabel = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text3, ...style }}>{children}</div>
);

const Toggle = ({ on, onClick }) => (
  <div onClick={onClick} style={{ width: 40, height: 23, borderRadius: 999, position: 'relative', flexShrink: 0,
    background: on ? C.jade : C.toggleOff, transition: 'background .18s', cursor: 'pointer' }}>
    <div style={{ position: 'absolute', top: 2, left: 2, width: 19, height: 19, borderRadius: 999, background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.25)', transform: on ? 'translateX(17px)' : 'none', transition: 'transform .18s' }} />
  </div>
);

const Field = ({ label, hint, children, style }) => (
  <label style={{ display: 'block', ...style }}>
    {label && <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 7 }}>{label}</div>}
    {children}
    {hint && <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.text3, marginTop: 6 }}>{hint}</div>}
  </label>
);

const inputStyle = {
  width: '100%', fontFamily: SANS, fontSize: 14, color: C.text1, background: C.surface,
  border: `1px solid ${C.hair2}`, borderRadius: 10, padding: '10px 13px', outline: 'none', boxSizing: 'border-box',
};

const Input = ({ icon, style, ...rest }) => (
  <div style={{ position: 'relative', ...style }}>
    {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text3 }}><Icon name={icon} size={17} /></div>}
    <input {...rest} style={{ ...inputStyle, paddingLeft: icon ? 38 : 13 }}
      onFocus={(e) => { e.target.style.borderColor = C.jade; e.target.style.boxShadow = `0 0 0 3px ${C.jadeFaint}`; }}
      onBlur={(e) => { e.target.style.borderColor = C.hair2; e.target.style.boxShadow = 'none'; }} />
  </div>
);

/* status helpers shared across pages */
const mention = (nf) => nf == null ? '—' : nf >= 16 ? 'Très Bien' : nf >= 14 ? 'Bien' : nf >= 12 ? 'Assez Bien' : nf >= 10 ? 'Passable' : 'Insuffisant';
const gradeTone = (nf) => nf == null ? 'slate' : nf >= 10 ? 'jade' : nf >= 8 ? 'amber' : 'danger';
const statusMeta = {
  active: { tone: 'jade', label: 'Actif' },
  risk: { tone: 'danger', label: 'À risque' },
  suspended: { tone: 'slate', label: 'Suspendu' },
};
const fmt = (n, d = 2) => n == null ? '—' : Number(n).toFixed(d);

/* grade lifecycle stage meta (UX Architecture §3.5) */
const GRADE_STAGES = [
  null,
  { label: 'Brouillon', tone: 'slate' },
  { label: 'CC en cours', tone: 'amber' },
  { label: 'CC complet', tone: 'blue' },
  { label: 'CC publié', tone: 'jade' },
  { label: 'CF en cours', tone: 'amber' },
  { label: 'Prêt à publier', tone: 'blue' },
  { label: 'Publié', tone: 'jade' },
];
const stageMeta = (st) => GRADE_STAGES[st] || GRADE_STAGES[1];
const ccPublished = (st) => st >= 4;
const nfPublished = (st) => st >= 7;

Object.assign(window, {
  C, A_SANS: SANS, A_MONO: MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel,
  Toggle, Field, Input, inputStyle, mention, gradeTone, statusMeta, fmt,
  GRADE_STAGES, stageMeta, ccPublished, nfPublished,
});
