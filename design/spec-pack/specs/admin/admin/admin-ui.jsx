/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Avatar, SectionLabel, Input, inputStyle */
/* ============ Unipocket Admin — UI INFRA (modals, dropdowns, menus, pickers) ============ */

/* ---- global modal store ---- */
const _mListeners = new Set();
let _mCurrent = null;
const setModal = (node) => { _mCurrent = node; _mListeners.forEach((l) => l(node)); };
const AdminUI = {
  open: (node) => setModal(node),
  close: () => setModal(null),
  toast: (msg, icon = 'check') => window.__notify && window.__notify(msg, icon),
  go: (...a) => window.__go && window.__go(...a),
  soon: (label = 'Disponible prochainement') => window.__notify && window.__notify(label, 'check'),
};
window.AdminUI = AdminUI;

const ModalRoot = () => {
  const [node, setNode] = React.useState(_mCurrent);
  React.useEffect(() => { const l = (n) => setNode(n); _mListeners.add(l); return () => _mListeners.delete(l); }, []);
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') AdminUI.close(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  if (!node) return null;
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) AdminUI.close(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(16,22,20,0.45)', backdropFilter: 'blur(2px)', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .16s ease' }}>
      {node}
    </div>
  );
};

/* ---- modal shell ---- */
const Modal = ({ title, sub, icon, iconTone = 'jade', width = 480, children, footer }) => {
  const tc = { jade: C.jadeText, danger: C.danger, amber: C.amber, blue: C.blue }[iconTone];
  const tb = { jade: C.jadeFaint, danger: C.dangerBg, amber: C.amberBg, blue: C.blueBg }[iconTone];
  return (
    <div style={{ background: C.surface, borderRadius: 18, width, maxWidth: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      boxShadow: '0 24px 60px rgba(10,30,22,0.30)', overflow: 'hidden', animation: 'popIn .18s cubic-bezier(.2,.9,.3,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '18px 22px', borderBottom: `1px solid ${C.hair}` }}>
        {icon && <div style={{ width: 38, height: 38, borderRadius: 11, background: tb, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={20} /></div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 17, color: C.text1 }}>{title}</div>
          {sub && <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 1 }}>{sub}</div>}
        </div>
        <div onClick={AdminUI.close} style={{ cursor: 'pointer', color: C.text3, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.surface2; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}><Icon name="x" size={18} /></div>
      </div>
      <div style={{ padding: 22, overflowY: 'auto' }}>{children}</div>
      {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: `1px solid ${C.hair}`, background: C.surface2 }}>{footer}</div>}
    </div>
  );
};

/* ---- form helpers ---- */
const FRow = ({ children, cols = 2 }) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14, marginBottom: 14 }}>{children}</div>;
const FField = ({ label, required, error, children, hint }) => (
  <label style={{ display: 'block' }}>
    <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 6 }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</div>
    {children}
    {error && <div style={{ fontFamily: A_SANS, fontSize: 11.5, color: C.danger, marginTop: 5 }}>{error}</div>}
    {hint && !error && <div style={{ fontFamily: A_SANS, fontSize: 11.5, color: C.text3, marginTop: 5 }}>{hint}</div>}
  </label>
);
const TextInput = ({ value, onChange, placeholder, error, type = 'text', mono, readOnly }) => (
  <input value={value} onChange={(e) => onChange && onChange(e.target.value)} placeholder={placeholder} type={type} readOnly={readOnly}
    style={{ ...inputStyle, fontFamily: mono ? A_MONO : A_SANS, borderColor: error ? C.danger : C.hair2, background: readOnly ? C.surface2 : C.surface, color: readOnly ? C.text2 : C.text1, cursor: readOnly ? 'not-allowed' : 'text' }}
    onFocus={(e) => { if (readOnly) return; e.target.style.borderColor = error ? C.danger : C.jade; e.target.style.boxShadow = `0 0 0 3px ${error ? C.dangerBg : C.jadeFaint}`; }}
    onBlur={(e) => { e.target.style.borderColor = error ? C.danger : C.hair2; e.target.style.boxShadow = 'none'; }} />
);

/* ---- custom dropdown / select ---- */
const Dropdown = ({ value, options, onChange, placeholder = 'Sélectionner', error, disabled, width }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const opts = options.map((o) => Array.isArray(o) ? { value: o[0], label: o[1] } : (typeof o === 'object' ? o : { value: o, label: o }));
  const sel = opts.find((o) => o.value === value);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <div onClick={() => !disabled && setOpen(!open)} style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        borderColor: open ? C.jade : (error ? C.danger : C.hair2), boxShadow: open ? `0 0 0 3px ${C.jadeFaint}` : 'none', opacity: disabled ? 0.55 : 1 }}>
        <span style={{ fontFamily: A_SANS, fontSize: 14, color: sel ? C.text1 : C.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sel ? sel.label : placeholder}</span>
        <Icon name="chevron-d" size={16} color={C.text3} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 11,
          boxShadow: C.shadowLg, zIndex: 30, maxHeight: 260, overflowY: 'auto', padding: 5 }}>
          {opts.map((o) => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
              fontFamily: A_SANS, fontSize: 13.5, fontWeight: o.value === value ? 700 : 500, color: o.value === value ? C.jadeText : C.text1, background: o.value === value ? C.jadeFaint : 'transparent' }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = C.surface2; }} onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}>
              <span>{o.label}</span>{o.badge && <Badge tone={o.badgeTone || 'jade'}>{o.badge}</Badge>}{o.value === value && !o.badge && <Icon name="check" size={15} color={C.jadeText} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---- context menu ("…") ---- */
const Menu = ({ items, align = 'right', triggerIcon = 'more', triggerSize = 'sm' }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <Btn kind="quiet" size={triggerSize} icon={triggerIcon} style={{ padding: 7 }} onClick={() => setOpen(!open)} />
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', [align]: 0, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 11,
          boxShadow: C.shadowLg, zIndex: 30, padding: 5, minWidth: 190 }}>
          {items.map((it, i) => it.divider ? <div key={i} style={{ height: 1, background: C.hair, margin: '4px 6px' }} /> : (
            <div key={i} onClick={() => { setOpen(false); it.onClick && it.onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
              fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: it.tone === 'danger' ? C.danger : C.text1 }}
              onMouseEnter={(e) => e.currentTarget.style.background = it.tone === 'danger' ? C.dangerBg : C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {it.icon && <Icon name={it.icon} size={16} color={it.tone === 'danger' ? C.danger : C.text2} />}{it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---- confirm / danger modal ---- */
const ConfirmModal = ({ icon = 'warn', tone = 'danger', title, children, confirmLabel = 'Confirmer', confirmKind = 'dangerSolid', requireText, onConfirm }) => {
  const [txt, setTxt] = React.useState('');
  const [done, setDone] = React.useState(null);
  const ok = !requireText || txt.trim() === requireText;
  return (
    <Modal title={title} icon={icon} iconTone={tone} width={440}
      footer={!done && <>
        <Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn>
        <Btn kind={confirmKind} disabled={!ok} onClick={() => { const r = onConfirm && onConfirm(); if (r && r.keep) setDone(r); else AdminUI.close(); }}>{confirmLabel}</Btn>
      </>}>
      <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, lineHeight: 1.6 }}>{children}</div>
      {requireText && (
        <div style={{ marginTop: 16 }}>
          <FField label={`Tapez « ${requireText} » pour confirmer`}>
            <TextInput value={txt} onChange={setTxt} placeholder={requireText} />
          </FField>
        </div>
      )}
    </Modal>
  );
};

/* ---- mini calendar / date picker ---- */
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DatePicker = ({ valueLabel = '20 juin 2026', presets, allowed }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const [m, setM] = React.useState(5), [y] = React.useState(2026), [sel, setSel] = React.useState(20);
  React.useEffect(() => { if (!open) return; const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [open]);
  const first = new Date(y, m, 1); let startWd = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startWd; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10, border: `1px solid ${open ? C.jade : C.hair2}`, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: C.text1, background: C.surface }}>
        <Icon name="cal" size={16} color={C.text3} /> {sel} {MONTHS[m]} {y} <Icon name="chevron-d" size={14} color={C.text3} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 13, boxShadow: C.shadowLg, zIndex: 30, padding: 14, width: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div onClick={() => setM((m + 11) % 12)} style={{ cursor: 'pointer', transform: 'rotate(180deg)', color: C.text2 }}><Icon name="chevron" size={16} /></div>
            <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13.5, color: C.text1, textTransform: 'capitalize' }}>{MONTHS[m]} {y}</span>
            <div onClick={() => setM((m + 1) % 12)} style={{ cursor: 'pointer', color: C.text2 }}><Icon name="chevron" size={16} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {WD.map((w, i) => <div key={i} style={{ textAlign: 'center', fontFamily: A_MONO, fontSize: 10, color: C.text3, padding: '4px 0' }}>{w}</div>)}
            {cells.map((d, i) => {
              const on = d === sel; const dis = allowed && d && !allowed.includes(d);
              return <div key={i} onClick={() => { if (d && !dis) { setSel(d); setOpen(false); } }} style={{ textAlign: 'center', padding: '7px 0', borderRadius: 8, cursor: d && !dis ? 'pointer' : 'default',
                fontFamily: A_SANS, fontSize: 12.5, fontWeight: on ? 700 : 500, color: !d ? 'transparent' : dis ? C.text3 : on ? '#fff' : C.text1, background: on ? C.jade : 'transparent', opacity: dis ? 0.4 : 1 }}
                onMouseEnter={(e) => { if (d && !dis && !on) e.currentTarget.style.background = C.surface2; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>{d || ''}</div>;
            })}
          </div>
          {presets && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.hair}` }}>
            {presets.map((p) => <div key={p} onClick={() => setOpen(false)} style={{ fontFamily: A_SANS, fontSize: 11.5, fontWeight: 600, color: C.jadeText, background: C.jadeFaint, padding: '5px 10px', borderRadius: 999, cursor: 'pointer' }}>{p}</div>)}
          </div>}
        </div>
      )}
    </div>
  );
};

/* ---- rich text editor (contentEditable) ---- */
const RichText = ({ placeholder = 'Rédigez…', minHeight = 200, rtl }) => {
  const ref = React.useRef(null);
  const [empty, setEmpty] = React.useState(true);
  const cmd = (c, v) => { document.execCommand(c, false, v); ref.current && ref.current.focus(); };
  const tools = [['bold', 'Gras', 'B', { fontWeight: 800 }], ['italic', 'Italique', 'I', { fontStyle: 'italic' }], ['underline', 'Souligné', 'U', { textDecoration: 'underline' }]];
  return (
    <div style={{ border: `1px solid ${C.hair2}`, borderRadius: 11, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 6, background: C.surface2, borderBottom: `1px solid ${C.hair}` }}>
        {tools.map(([c, t, lbl, st]) => <div key={c} title={t} onMouseDown={(e) => { e.preventDefault(); cmd(c); }} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: A_SANS, fontSize: 14, color: C.text2, cursor: 'pointer', ...st }} onMouseEnter={(e) => e.currentTarget.style.background = C.sunken} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>{lbl}</div>)}
        <div style={{ width: 1, background: C.hair2, margin: '4px 4px', alignSelf: 'stretch' }} />
        {[['formatBlock', 'Titre', 'H2', 'h2'], ['insertUnorderedList', 'Liste', 'list', null], ['insertOrderedList', 'Liste num.', 'list-n', null]].map(([c, t, lbl, v]) => <div key={lbl} title={t} onMouseDown={(e) => { e.preventDefault(); cmd(c, v); }} style={{ minWidth: 30, height: 30, padding: '0 8px', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: A_SANS, fontWeight: 700, fontSize: 12, color: C.text2, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = C.sunken} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>{lbl === 'list' ? <Icon name="list" size={15} /> : lbl === 'list-n' ? '1.' : lbl}</div>)}
        <div style={{ width: 1, background: C.hair2, margin: '4px 4px', alignSelf: 'stretch' }} />
        <div title="Lien" onMouseDown={(e) => { e.preventDefault(); const u = prompt('URL du lien :'); if (u) cmd('createLink', u); }} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text2, cursor: 'pointer' }}><Icon name="share" size={15} /></div>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning dir={rtl ? 'rtl' : 'ltr'} onInput={(e) => setEmpty(!e.currentTarget.textContent.trim())}
        style={{ minHeight, padding: 14, fontFamily: A_SANS, fontSize: 14.5, lineHeight: 1.6, color: C.text1, outline: 'none', position: 'relative' }}
        data-ph={placeholder} />
      <style>{`[contenteditable][data-ph]:empty:before{content:attr(data-ph);color:${C.text3};}`}</style>
    </div>
  );
};

Object.assign(window, { ModalRoot, Modal, FRow, FField, TextInput, Dropdown, Menu, ConfirmModal, DatePicker, RichText, MONTHS });
