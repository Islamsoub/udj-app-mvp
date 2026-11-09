/* global React, window, C, A_SANS, A_MONO, Icon, Avatar, Badge */
/* ============ Unipocket Admin — SHELL (sidebar + top bar) ============ */

const NAV_MAIN = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'grid' },
  { id: 'students', label: 'Étudiants', icon: 'users' },
  { id: 'grades', label: 'Notes', icon: 'grad' },
  { id: 'attendance', label: 'Présence', icon: 'check-cal', badge: 'pending' },
  { id: 'news', label: 'Actualités', icon: 'mega' },
];
const NAV_STRUCT = [
  { id: 'schedule', label: 'Emploi du temps', icon: 'cal' },
  { id: 'academics', label: 'Académique', icon: 'book' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
];
const NAV_ADMIN = [
  { id: 'admins', label: 'Administrateurs', icon: 'shield' },
  { id: 'audit', label: "Journal d'audit", icon: 'list' },
  { id: 'settings', label: 'Paramètres', icon: 'gear' },
];

const ULogo = ({ size = 34 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, background: 'linear-gradient(150deg, #1D9E75, #0F6E56)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
    <span style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: size * 0.5, color: '#fff' }}>U</span>
  </div>
);

const NavItem = ({ item, active, onClick, soon, pendingCount }) => {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={soon ? undefined : onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10, position: 'relative',
        cursor: soon ? 'default' : 'pointer', userSelect: 'none',
        background: active ? 'rgba(29,158,117,0.18)' : (h && !soon ? 'rgba(255,255,255,0.05)' : 'transparent'),
        transition: 'background .14s', opacity: soon ? 0.42 : 1 }}>
      {active && <div style={{ position: 'absolute', left: -10, top: 8, bottom: 8, width: 3.5, borderRadius: 3, background: C.jade }} />}
      <Icon name={item.icon} size={19} color={active ? '#fff' : C.sideMuted} sw={active ? 1.9 : 1.7} />
      <span style={{ fontFamily: A_SANS, fontWeight: active ? 700 : 500, fontSize: 13.5, color: active ? '#fff' : C.sideText, flex: 1 }}>{item.label}</span>
      {item.badge === 'pending' && pendingCount > 0 && (
        <span style={{ fontFamily: A_MONO, fontSize: 11, fontWeight: 500, color: '#fff', background: C.jade,
          minWidth: 19, height: 19, borderRadius: 999, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>
      )}
      {soon && <span style={{ fontFamily: A_MONO, fontSize: 9, letterSpacing: '0.06em', color: C.sideMuted, textTransform: 'uppercase' }}>bientôt</span>}
    </div>
  );
};

const Sidebar = ({ route, go, pendingCount }) => {
  const s = window.useScope ? window.useScope() : { role: 'REGISTRAR' };
  const persona = (window.PERSONAS || {})[s.role] || { name: 'Saïd Warsama', label: 'Scolarité' };
  const groupLabel = (t) => <div style={{ fontFamily: A_MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.sideMuted, padding: '0 12px', marginBottom: 8, marginTop: 4 }}>{t}</div>;
  return (
    <aside style={{ width: 248, flexShrink: 0, background: C.sideBg, display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0, boxShadow: C.shadowSide, zIndex: 5 }}>
      {/* brand */}
      <div style={{ padding: '20px 18px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <ULogo />
        <div>
          <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 15.5, color: '#fff', letterSpacing: '-0.01em' }}>Unipocket</div>
          <div style={{ fontFamily: A_MONO, fontSize: 10, letterSpacing: '0.12em', color: C.sideMuted, textTransform: 'uppercase' }}>Admin · UDJ</div>
        </div>
      </div>
      <div style={{ height: 1, background: C.sideHair, margin: '0 18px 12px' }} />
      {/* nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV_MAIN.map((it) => <NavItem key={it.id} item={it} active={route.page === it.id} onClick={() => go(it.id)} pendingCount={pendingCount} />)}
        <div style={{ height: 14 }} />
        {groupLabel('Structure')}
        {NAV_STRUCT.map((it) => <NavItem key={it.id} item={it} active={route.page === it.id} onClick={() => go(it.id)} />)}
        <div style={{ height: 14 }} />
        {groupLabel('Système')}
        {NAV_ADMIN.map((it) => <NavItem key={it.id} item={it} active={route.page === it.id} onClick={() => go(it.id)} />)}
      </nav>
      {/* admin user */}
      <div style={{ borderTop: `1px solid ${C.sideHair}`, padding: 14, margin: 10, marginTop: 8, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 11 }}>
        <Avatar name={persona.name} size={36} tone={C.jade} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{persona.name}</div>
          <div style={{ fontFamily: A_MONO, fontSize: 10, color: C.sideMuted, letterSpacing: '0.04em' }}>{s.role}</div>
        </div>
        <div style={{ color: C.sideMuted, cursor: 'pointer' }} title="Se déconnecter" onClick={() => go('login')}><Icon name="logout" size={18} /></div>
      </div>
    </aside>
  );
};

const CRUMBS = {
  dashboard: ['Tableau de bord'],
  students: ['Étudiants'],
  'student-detail': ['Étudiants', 'Fiche étudiant'],
  'students-import': ['Étudiants', 'Importer'],
  grades: ['Notes'],
  'grade-entry': ['Notes', 'Saisie'],
  attendance: ['Présence'],
  'attendance-session': ['Présence', "Faire l'appel"],
  news: ['Actualités'],
  'news-create': ['Actualités', 'Nouvel article'],
  schedule: ['Emploi du temps'],
  academics: ['Académique'],
  notifications: ['Notifications'],
  admins: ['Administrateurs'],
  audit: ["Journal d'audit"],
  settings: ['Paramètres'],
};

const GlobalSearch = () => {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => { if (!open) return; const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [open]);
  const ql = q.trim().toLowerCase();
  const D = window.ADMIN_DATA, D2 = window.ADMIN_DATA2;
  const students = ql ? D.STUDENTS.filter((s) => s.name.toLowerCase().includes(ql) || s.id.toLowerCase().includes(ql)).slice(0, 3) : [];
  const subjects = ql ? D.SUBJECTS.filter((s) => s.name.toLowerCase().includes(ql) || s.id.toLowerCase().includes(ql)).slice(0, 3) : [];
  const news = ql ? D.NEWS.filter((n) => n.title.toLowerCase().includes(ql)).slice(0, 3) : [];
  const none = ql && !students.length && !subjects.length && !news.length;
  const Sec = ({ label, children }) => <><div style={{ fontFamily: A_MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.text3, padding: '8px 12px 4px' }}>{label}</div>{children}</>;
  const Row = ({ icon, title, sub, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, cursor: 'pointer' }}
      onMouseEnter={(e) => e.currentTarget.style.background = C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div><div style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3 }}>{sub}</div></div>
    </div>
  );
  const sel = (fn) => { setOpen(false); setQ(''); fn(); };
  return (
    <div ref={ref} style={{ position: 'relative', width: 280 }}>
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none' }}><Icon name="search" size={16} /></div>
      <input placeholder="Rechercher un étudiant, une matière…" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={(e) => { setOpen(true); e.target.style.borderColor = C.jade; e.target.style.background = '#fff'; }}
        onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.background = C.surface2; }}
        style={{ width: '100%', fontFamily: A_SANS, fontSize: 13, color: C.text1, background: C.surface2, border: '1px solid transparent', borderRadius: 10, padding: '9px 13px 9px 36px', outline: 'none', boxSizing: 'border-box' }} />
      {open && ql && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 12, boxShadow: C.shadowLg, zIndex: 40, padding: 5, maxHeight: 420, overflowY: 'auto' }}>
          {none && <div style={{ padding: '18px 12px', textAlign: 'center', fontFamily: A_SANS, fontSize: 13, color: C.text3 }}>Aucun résultat pour « {q} »</div>}
          {students.length > 0 && <Sec label="Étudiants">{students.map((s) => <Row key={s.id} icon="users" title={s.name} sub={s.id} onClick={() => sel(() => window.AdminUI.go('student-detail', { id: s.idx }))} />)}</Sec>}
          {subjects.length > 0 && <Sec label="Matières">{subjects.map((s) => <Row key={s.id} icon="grad" title={s.name} sub={s.id + ' · ' + s.prof} onClick={() => sel(() => window.AdminUI.go('grade-entry', { subjectId: s.id }))} />)}</Sec>}
          {news.length > 0 && <Sec label="Actualités">{news.map((n) => <Row key={n.id} icon="mega" title={n.title} sub={n.date} onClick={() => sel(() => window.AdminUI.go('news'))} />)}</Sec>}
        </div>
      )}
    </div>
  );
};

const BellMenu = ({ go }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => { if (!open) return; const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [open]);
  const pending = window.ADMIN_DATA.JUSTIFICATIONS.filter((j) => j.status === 'pending');
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{ position: 'relative', cursor: 'pointer', color: C.text2, display: 'flex' }}>
        <Icon name="bell" size={20} />
        {pending.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: C.danger, border: `2px solid ${C.surface}` }} />}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 13, boxShadow: C.shadowLg, zIndex: 40, overflow: 'hidden' }}>
          <div style={{ padding: '13px 15px', borderBottom: `1px solid ${C.hair}`, fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: C.text1 }}>Notifications</div>
          <div onClick={() => { setOpen(false); go('attendance'); }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.amberBg, color: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="clock" size={16} /></div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: C.text1 }}>Justificatifs en attente</div><div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text2 }}>{pending.length} à traiter</div></div>
            <Icon name="chevron" size={15} color={C.text3} />
          </div>
          <div style={{ padding: '11px 15px', borderTop: `1px solid ${C.hair}`, textAlign: 'center', fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.jadeText, cursor: 'pointer' }} onClick={() => { setOpen(false); go('attendance'); }}>Voir tout →</div>
        </div>
      )}
    </div>
  );
};

const AvatarMenu = ({ go }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const s = window.useScope ? window.useScope() : { role: 'REGISTRAR' };
  const persona = (window.PERSONAS || {})[s.role] || { name: 'Saïd Warsama', email: 'said.warsama@univ.dj', label: 'Scolarité' };
  const ROLE_ORDER = ['SUPER_ADMIN', 'REGISTRAR', 'FACULTY_ADMIN', 'NEWS_EDITOR'];
  React.useEffect(() => { if (!open) return; const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [open]);
  const item = (icon, label, fn, tone) => (
    <div onClick={() => { setOpen(false); fn(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: tone === 'danger' ? C.danger : C.text1 }} onMouseEnter={(e) => e.currentTarget.style.background = tone === 'danger' ? C.dangerBg : C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <Icon name={icon} size={16} color={tone === 'danger' ? C.danger : C.text2} />{label}
    </div>
  );
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}><Avatar name={persona.name} size={34} tone={C.jade} /></div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 258, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 13, boxShadow: C.shadowLg, zIndex: 40, padding: 5 }}>
          <div style={{ padding: '11px 12px 12px' }}>
            <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: C.text1 }}>{persona.name}</div>
            <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text2 }}>{persona.email}</div>
            <div style={{ marginTop: 6 }}><Badge tone="jade" dot>{persona.label}</Badge></div>
          </div>
          <div style={{ height: 1, background: C.hair, margin: '2px 6px 4px' }} />
          {item('users', 'Mon profil', () => window.AdminUI.open(<window.ProfileModal />))}
          {item('key', 'Changer le mot de passe', () => window.AdminUI.open(<window.PasswordModal />))}
          <div style={{ height: 1, background: C.hair, margin: '4px 6px' }} />
          <div style={{ fontFamily: A_MONO, fontSize: 9.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.text3, padding: '6px 12px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="eye" size={12} color={C.text3} /> Vue démo · changer de rôle
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '2px 10px 8px' }}>
            {ROLE_ORDER.map((r) => {
              const on = s.role === r;
              return (
                <div key={r} onClick={() => { window.AdminScope.setRole(r); }} style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 11.5,
                  background: on ? C.jade : C.surface2, color: on ? '#fff' : C.text2, border: `1px solid ${on ? C.jade : C.hair2}` }}>{(window.PERSONAS[r] || {}).label || r}</div>
              );
            })}
          </div>
          <div style={{ height: 1, background: C.hair, margin: '4px 6px' }} />
          {item('logout', 'Se déconnecter', () => go('login'), 'danger')}
        </div>
      )}
    </div>
  );
};

const TopBar = ({ route, go, onGlobalSearch }) => {
  const crumbs = CRUMBS[route.page] || ['Tableau de bord'];
  return (
    <header style={{ height: 64, flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.hair}`,
      display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', position: 'sticky', top: 0, zIndex: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron" size={14} color={C.text3} />}
            <span style={{ fontFamily: A_SANS, fontWeight: i === crumbs.length - 1 ? 700 : 500,
              fontSize: 15, color: i === crumbs.length - 1 ? C.text1 : C.text3,
              cursor: i < crumbs.length - 1 ? 'pointer' : 'default' }}
              onClick={i === 0 && crumbs.length > 1 ? () => go(route.page.split('-')[0] === 'student' ? 'students' : route.page.split('-')[0] === 'grade' ? 'grades' : 'news') : undefined}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <GlobalSearch />
      <div title="Portail disponible en français uniquement" style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: A_MONO, fontSize: 11.5, color: C.text2, background: C.surface2, padding: '7px 11px', borderRadius: 9, cursor: 'default' }}>
        <Icon name="sun" size={15} color={C.amber} /> FR
      </div>
      <BellMenu go={go} />
      <AvatarMenu go={go} />
    </header>
  );
};

/* page header used inside content */
const PageHead = ({ title, subtitle, actions, back }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
    {back && <div onClick={back} style={{ cursor: 'pointer', marginTop: 3, color: C.text2, width: 34, height: 34, borderRadius: 9,
      border: `1px solid ${C.hair2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surface }}><Icon name="arrow-l" size={18} /></div>}
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1 style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 25, color: C.text1, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.15 }}>{title}</h1>
      {subtitle && <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, marginTop: 5 }}>{subtitle}</div>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
  </div>
);

Object.assign(window, { Sidebar, TopBar, PageHead, ULogo });
