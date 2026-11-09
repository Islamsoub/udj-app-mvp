/* global React, window, C, A_SANS, A_MONO, Icon, Badge */
/* ============ Unipocket Admin — CONTEXT BAR + SCOPE STORE ============ */
/* A persistent Faculty → Programme selector shared across all data pages.
   Backs UX Architecture §1 (Context Bar) and §5.1 (Schedule view modes). */

/* ---- personas per role (demo view switch) ---- */
const PERSONAS = {
  SUPER_ADMIN:   { name: 'Hassan Aden',    email: 'hassan.aden@univ.dj',    faculty: null,  label: 'Super Admin' },
  REGISTRAR:     { name: 'Saïd Warsama',   email: 'said.warsama@univ.dj',   faculty: null,  label: 'Scolarité' },
  FACULTY_ADMIN: { name: 'Safia Mohamed',  email: 'safia.mohamed@univ.dj',  faculty: 'FST', label: 'Admin Faculté' },
  NEWS_EDITOR:   { name: 'Fatouma Robleh', email: 'fatouma.robleh@univ.dj', faculty: null,  label: 'Éditeur' },
};

/* ---- global scope store (subscribe pattern, mirrors AdminUI) ---- */
const _sListeners = new Set();
const _scope = {
  role: 'REGISTRAR',
  facultyId: null,      // null = toutes les facultés
  programmeId: null,    // null = tous les programmes
  scheduleMode: 'programme', // 'programme' | 'room' | 'teacher'
  room: 'Salle C12',
  teacher: 'Pr. Hassan Robleh',
};
const AdminScope = {
  get: () => _scope,
  persona: () => PERSONAS[_scope.role],
  set(patch) { Object.assign(_scope, patch); _sListeners.forEach((l) => l({ ..._scope })); },
  setRole(role) {
    const p = PERSONAS[role];
    this.set({ role, facultyId: p.faculty, programmeId: null });
  },
  subscribe(l) { _sListeners.add(l); return () => _sListeners.delete(l); },
};
window.AdminScope = AdminScope;

function useScope() {
  const [s, setS] = React.useState({ ..._scope });
  React.useEffect(() => AdminScope.subscribe(setS), []);
  return s;
}
window.useScope = useScope;

/* pages that carry the context bar */
const SCOPED_PAGES = ['students', 'grades', 'attendance', 'schedule', 'academics', 'notifications'];
window.SCOPED_PAGES = SCOPED_PAGES;

/* ---- compact scope dropdown (pill that opens a menu) ---- */
const ScopePick = ({ value, options, onChange, placeholder, muted, locked, lockLabel, icon, minWidth = 150 }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const opts = options.map((o) => Array.isArray(o) ? { value: o[0], label: o[1] } : { value: o, label: o });
  const sel = opts.find((o) => o.value === value);
  const shown = sel ? sel.label : placeholder;

  if (locked) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 9,
        background: 'rgba(255,255,255,0.7)', border: `1px solid ${C.hair2}`, minWidth, cursor: 'default' }}
        title="Périmètre verrouillé à votre faculté">
        <Icon name="shield" size={14} color={C.jadeText} />
        <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13, color: C.text1, flex: 1 }}>{lockLabel}</span>
        <Icon name="lock" size={13} color={C.text3} />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9,
        background: open ? C.surface : 'rgba(255,255,255,0.7)', border: `1px solid ${open ? C.jade : C.hair2}`,
        boxShadow: open ? `0 0 0 3px ${C.jadeFaint}` : 'none', cursor: 'pointer', minWidth, transition: 'all .12s' }}>
        {icon && <Icon name={icon} size={14} color={C.text3} />}
        <span style={{ fontFamily: A_SANS, fontWeight: sel ? 700 : 500, fontSize: 13, color: sel ? C.text1 : C.text3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shown}</span>
        <Icon name="chevron-d" size={14} color={C.text3} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: Math.max(minWidth, 200), background: C.surface,
          border: `1px solid ${C.hair2}`, borderRadius: 11, boxShadow: C.shadowLg, zIndex: 45, maxHeight: 320, overflowY: 'auto', padding: 5 }}>
          {opts.map((o) => (
            <div key={o.value ?? '_'} onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
                fontFamily: A_SANS, fontSize: 13.5, fontWeight: o.value === value ? 700 : 500, color: o.value === value ? C.jadeText : C.text1, background: o.value === value ? C.jadeFaint : 'transparent' }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = C.surface2; }}
              onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}>
              <span>{o.label}</span>{o.value === value && <Icon name="check" size={15} color={C.jadeText} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ContextBar = ({ page }) => {
  const s = useScope();
  const { FACULTIES, PROGRAMMES, ALL_SCHEDULE } = window.ADMIN_DATA2;

  // NEWS_EDITOR: hidden entirely (handled by App too, guard here)
  if (s.role === 'NEWS_EDITOR') return null;

  const facultyLocked = s.role === 'FACULTY_ADMIN';
  const faculty = FACULTIES.find((f) => f.id === s.facultyId);
  const progsInScope = PROGRAMMES.filter((p) => !s.facultyId || p.faculty === s.facultyId);
  const programme = PROGRAMMES.find((p) => p.id === s.programmeId);

  // schedule alternate modes replace the faculty/programme pair
  const scheduleAlt = page === 'schedule' && s.scheduleMode !== 'programme';
  const rooms = [...new Set((ALL_SCHEDULE || []).map((e) => e.room))].sort();
  const teachers = [...new Set((ALL_SCHEDULE || []).map((e) => e.prof))].sort();

  const active = scheduleAlt ? true : !!(s.facultyId || s.programmeId);

  return (
    <div style={{ position: 'sticky', top: 64, zIndex: 3,
      background: active ? 'linear-gradient(180deg, rgba(29,158,117,0.10), rgba(29,158,117,0.055))' : C.surface,
      borderBottom: `1px solid ${active ? 'rgba(29,158,117,0.22)' : C.hair}`,
      transition: 'background .18s' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '9px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 2 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: active ? C.jade : C.sunken, color: active ? '#fff' : C.text3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s' }}>
            <Icon name="filter" size={13} />
          </div>
          <span style={{ fontFamily: A_MONO, fontSize: 10.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: active ? C.jade700 : C.text3, fontWeight: 500 }}>Périmètre</span>
        </div>

        {scheduleAlt ? (
          <>
            <ScopePick icon={s.scheduleMode === 'room' ? 'pin' : 'users'} minWidth={190}
              value={s.scheduleMode === 'room' ? s.room : s.teacher}
              options={s.scheduleMode === 'room' ? rooms : teachers}
              onChange={(v) => AdminScope.set(s.scheduleMode === 'room' ? { room: v } : { teacher: v })} />
            <Badge tone="blue">Lecture seule</Badge>
          </>
        ) : (
          <>
            <ScopePick icon="book" placeholder="Toutes les facultés" minWidth={190}
              locked={facultyLocked} lockLabel={faculty ? faculty.short + ' · ' + faculty.name : 'Ma faculté'}
              value={s.facultyId}
              options={[['', 'Toutes les facultés'], ...FACULTIES.map((f) => [f.id, f.name])]}
              onChange={(v) => AdminScope.set({ facultyId: v || null, programmeId: null })} />
            <Icon name="chevron" size={14} color={C.text3} />
            <ScopePick icon="grad" placeholder="Tous les programmes" minWidth={200}
              value={s.programmeId}
              options={[['', 'Tous les programmes'], ...progsInScope.map((p) => [p.id, p.name + (p.id === 'GINF' ? ' L3' : '')])]}
              onChange={(v) => AdminScope.set({ programmeId: v || null })} />
          </>
        )}

        <div style={{ flex: 1 }} />

        {!scheduleAlt && !active && (
          <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>Toutes les facultés · Tous les programmes</span>
        )}
        {!scheduleAlt && active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.jade700, fontWeight: 600 }}>
              Vue filtrée{programme ? ' · ' + programme.students + ' étudiants' : ''}
            </span>
            <div onClick={() => AdminScope.set({ facultyId: facultyLocked ? s.facultyId : null, programmeId: null })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, cursor: 'pointer',
                fontFamily: A_SANS, fontWeight: 600, fontSize: 12, color: C.jade700, background: 'rgba(255,255,255,0.65)', border: `1px solid rgba(29,158,117,0.28)` }}>
              <Icon name="x" size={12} /> Réinitialiser
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { ContextBar, PERSONAS });
