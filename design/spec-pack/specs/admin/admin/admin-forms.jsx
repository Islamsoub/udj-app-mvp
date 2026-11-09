/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Toggle */
/* ============ Unipocket Admin — ENTITY FORMS ============ */
const { Modal, FRow, FField, TextInput, Dropdown, RichText } = window;
const AdminUI = window.AdminUI;

const randPw = () => { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
const PwField = ({ value, onChange }) => (
  <FField label="Mot de passe initial" required hint="Min. 8 caractères">
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1 }}><TextInput value={value} onChange={onChange} placeholder="••••••••" mono /></div>
      <Btn kind="ghost" size="sm" icon="reset" onClick={() => onChange(randPw())}>Générer</Btn>
    </div>
  </FField>
);

/* ---------- Student ---------- */
const StudentForm = ({ edit, student }) => {
  const { FACULTIES, PROGRAMMES } = window.ADMIN_DATA2;
  const [f, setF] = React.useState(edit ? { first: student.name.split(' ')[0], last: student.name.split(' ').slice(1).join(' '), mat: student.id, email: student.email, fac: 'FST', prog: 'GINF', sem: 'S2', status: student.status, pw: '' } : { first: '', last: '', mat: 'UDJ-2024-', email: '', fac: '', prog: '', sem: 'S2', status: 'active', pw: '' });
  const [err, setErr] = React.useState({});
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.first.trim()) e.first = 'Requis'; if (!f.last.trim()) e.last = 'Requis';
    if (!/^UDJ-\d{4}-\d{3,4}$/.test(f.mat)) e.mat = 'Format UDJ-AAAA-NNNN';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(f.email)) e.email = 'E-mail invalide';
    if (!edit && !f.fac) e.fac = 'Requis'; if (!edit && !f.prog) e.prog = 'Requis';
    if (!edit && f.pw.length < 8) e.pw = 'Min. 8 caractères';
    setErr(e); if (Object.keys(e).length) return;
    AdminUI.toast(edit ? 'Modifications enregistrées' : 'Étudiant créé avec succès'); AdminUI.close();
  };
  const progs = PROGRAMMES.filter((p) => !f.fac || p.faculty === f.fac).map((p) => [p.id, p.name]);
  return (
    <Modal title={edit ? "Modifier l'étudiant" : 'Nouvel étudiant'} icon={edit ? 'edit' : 'users'} width={560}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>{edit ? 'Enregistrer' : "Créer l'étudiant"}</Btn></>}>
      <FRow><FField label="Prénom" required error={err.first}><TextInput value={f.first} onChange={(v) => set('first', v)} placeholder="Ahmed" /></FField>
        <FField label="Nom" required error={err.last}><TextInput value={f.last} onChange={(v) => set('last', v)} placeholder="Omar" /></FField></FRow>
      <FRow><FField label="Matricule" required error={err.mat}><TextInput value={f.mat} onChange={(v) => set('mat', v)} mono readOnly={edit} /></FField>
        <FField label="Email" required error={err.email}><TextInput value={f.email} onChange={(v) => set('email', v)} placeholder="prenom.nom@univ.dj" /></FField></FRow>
      <FRow><FField label="Faculté" required error={err.fac}><Dropdown value={f.fac} onChange={(v) => { set('fac', v); set('prog', ''); }} options={FACULTIES.map((x) => [x.id, x.name])} /></FField>
        <FField label="Programme" required error={err.prog}><Dropdown value={f.prog} onChange={(v) => set('prog', v)} options={progs} placeholder={f.fac ? 'Sélectionner' : "Choisir d'abord la faculté"} disabled={!f.fac} /></FField></FRow>
      <FRow><FField label="Semestre actuel" required><Dropdown value={f.sem} onChange={(v) => set('sem', v)} options={[['S1', 'Semestre 1'], ['S2', 'Semestre 2']]} /></FField>
        <FField label="Statut"><Dropdown value={f.status} onChange={(v) => set('status', v)} options={[['active', 'Actif'], ['suspended', 'Suspendu']]} /></FField></FRow>
      {!edit && <PwField value={f.pw} onChange={(v) => { set('pw', v); }} />}
      {err.pw && <div style={{ fontFamily: A_SANS, fontSize: 11.5, color: C.danger, marginTop: -8 }}>{err.pw}</div>}
    </Modal>
  );
};

/* ---------- Admin ---------- */
const AdminForm = ({ edit, admin }) => {
  const { ROLES, FACULTIES } = window.ADMIN_DATA2;
  const [f, setF] = React.useState(edit ? { first: admin.name.split(' ')[0], last: admin.name.split(' ').slice(1).join(' '), email: admin.email, role: admin.role, scope: 'FST', pw: '' } : { first: '', last: '', email: '', role: '', scope: '', pw: '' });
  const [err, setErr] = React.useState({});
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    const e = {};
    if (!f.first.trim()) e.first = 'Requis'; if (!f.last.trim()) e.last = 'Requis';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(f.email)) e.email = 'E-mail invalide';
    if (!f.role) e.role = 'Requis'; if (f.role === 'FACULTY_ADMIN' && !f.scope) e.scope = 'Requis pour un admin faculté';
    if (!edit && f.pw.length < 8) e.pw = 'Min. 8 caractères';
    setErr(e); if (Object.keys(e).length) return;
    AdminUI.toast(edit ? 'Administrateur mis à jour' : 'Administrateur créé'); AdminUI.close();
  };
  return (
    <Modal title={edit ? 'Modifier le rôle' : 'Nouvel administrateur'} icon="shield" iconTone="exam" width={520}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>{edit ? 'Enregistrer' : 'Créer le compte'}</Btn></>}>
      <FRow><FField label="Prénom" required error={err.first}><TextInput value={f.first} onChange={(v) => set('first', v)} /></FField>
        <FField label="Nom" required error={err.last}><TextInput value={f.last} onChange={(v) => set('last', v)} /></FField></FRow>
      <div style={{ marginBottom: 14 }}><FField label="Email" required error={err.email}><TextInput value={f.email} onChange={(v) => set('email', v)} placeholder="prenom.nom@univ.dj" /></FField></div>
      <div style={{ marginBottom: 14 }}><FField label="Rôle" required error={err.role}><Dropdown value={f.role} onChange={(v) => set('role', v)} options={Object.keys(ROLES).map((k) => [k, ROLES[k].label])} /></FField></div>
      {f.role === 'FACULTY_ADMIN' && <div style={{ marginBottom: 14 }}><FField label="Périmètre (faculté)" required error={err.scope}><Dropdown value={f.scope} onChange={(v) => set('scope', v)} options={FACULTIES.map((x) => [x.id, x.name])} /></FField></div>}
      {!edit && <PwField value={f.pw} onChange={(v) => set('pw', v)} />}
      {err.pw && <div style={{ fontFamily: A_SANS, fontSize: 11.5, color: C.danger, marginTop: -8 }}>{err.pw}</div>}
    </Modal>
  );
};

/* ---------- Faculty / Programme / Subject / Semester ---------- */
const reqOK = (obj, keys) => { const e = {}; keys.forEach((k) => { if (!String(obj[k] ?? '').trim()) e[k] = 'Requis'; }); return e; };

const FacultyForm = ({ edit, faculty }) => {
  const [f, setF] = React.useState(edit ? { fr: faculty.name, ar: '', code: faculty.short, email: '', tel: '' } : { fr: '', ar: '', code: '', email: '', tel: '' });
  const [err, setErr] = React.useState({}); const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => { const e = reqOK(f, ['fr', 'ar', 'code', 'email', 'tel']); setErr(e); if (Object.keys(e).length) return; AdminUI.toast(edit ? 'Faculté mise à jour' : 'Faculté créée'); AdminUI.close(); };
  return (
    <Modal title={edit ? 'Modifier la faculté' : 'Nouvelle faculté'} icon="book" width={500}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>Enregistrer</Btn></>}>
      <FRow><FField label="Nom (FR)" required error={err.fr}><TextInput value={f.fr} onChange={(v) => set('fr', v)} /></FField>
        <FField label="Nom (AR)" required error={err.ar}><TextInput value={f.ar} onChange={(v) => set('ar', v)} /></FField></FRow>
      <FRow cols={3}><FField label="Code" required error={err.code}><TextInput value={f.code} onChange={(v) => set('code', v)} mono placeholder="FST" /></FField>
        <FField label="Téléphone" required error={err.tel}><TextInput value={f.tel} onChange={(v) => set('tel', v)} mono /></FField>
        <FField label="Email" required error={err.email}><TextInput value={f.email} onChange={(v) => set('email', v)} /></FField></FRow>
    </Modal>
  );
};

const ProgrammeForm = ({ edit, prog }) => {
  const { FACULTIES } = window.ADMIN_DATA2;
  const [f, setF] = React.useState(edit ? { fr: prog.name, ar: '', code: prog.id, fac: prog.faculty, level: 'Licence', dur: '6', cr: '180' } : { fr: '', ar: '', code: '', fac: '', level: '', dur: '6', cr: '180' });
  const [err, setErr] = React.useState({}); const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => { const e = reqOK(f, ['fr', 'ar', 'code', 'fac', 'level']); setErr(e); if (Object.keys(e).length) return; AdminUI.toast(edit ? 'Programme mis à jour' : 'Programme créé'); AdminUI.close(); };
  return (
    <Modal title={edit ? 'Modifier le programme' : 'Nouveau programme'} icon="grad" width={520}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>Enregistrer</Btn></>}>
      {edit && <div style={{ display: 'flex', gap: 20, marginBottom: 16, padding: 13, background: C.surface2, borderRadius: 11 }}>
        <div><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 18, color: C.text1 }}>{prog.students}</div><div style={{ fontFamily: A_MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase' }}>Inscrits</div></div>
        <div><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 18, color: C.text1 }}>8</div><div style={{ fontFamily: A_MONO, fontSize: 10, color: C.text3, textTransform: 'uppercase' }}>Matières</div></div></div>}
      <FRow><FField label="Nom (FR)" required error={err.fr}><TextInput value={f.fr} onChange={(v) => set('fr', v)} /></FField>
        <FField label="Nom (AR)" required error={err.ar}><TextInput value={f.ar} onChange={(v) => set('ar', v)} /></FField></FRow>
      <FRow><FField label="Code" required error={err.code}><TextInput value={f.code} onChange={(v) => set('code', v)} mono /></FField>
        <FField label="Faculté" required error={err.fac}><Dropdown value={f.fac} onChange={(v) => set('fac', v)} options={FACULTIES.map((x) => [x.id, x.short])} /></FField></FRow>
      <FRow cols={3}><FField label="Niveau" required error={err.level}><Dropdown value={f.level} onChange={(v) => set('level', v)} options={['DUT', 'Licence', 'Master', 'Doctorat']} /></FField>
        <FField label="Durée (sem.)"><TextInput value={f.dur} onChange={(v) => set('dur', v)} mono /></FField>
        <FField label="Crédits"><TextInput value={f.cr} onChange={(v) => set('cr', v)} mono /></FField></FRow>
    </Modal>
  );
};

const SubjectForm = ({ edit, subject }) => {
  const { PROGRAMMES } = window.ADMIN_DATA2;
  const [f, setF] = React.useState(edit ? { fr: subject.name, ar: '', code: subject.id, prog: 'GINF', sem: 'S' + subject.sem, coef: String(subject.coef), cr: '6', cm: '24', td: '12', tp: '0' } : { fr: '', ar: '', code: '', prog: '', sem: '', coef: '', cr: '', cm: '0', td: '0', tp: '0' });
  const [err, setErr] = React.useState({}); const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => { const e = reqOK(f, ['fr', 'ar', 'code', 'prog', 'sem', 'coef', 'cr']); setErr(e); if (Object.keys(e).length) return; AdminUI.toast(edit ? 'Matière mise à jour' : 'Matière créée'); AdminUI.close(); };
  return (
    <Modal title={edit ? 'Modifier la matière' : 'Nouvelle matière'} icon="grad" width={540}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>Enregistrer</Btn></>}>
      <FRow><FField label="Nom (FR)" required error={err.fr}><TextInput value={f.fr} onChange={(v) => set('fr', v)} /></FField>
        <FField label="Nom (AR)" required error={err.ar}><TextInput value={f.ar} onChange={(v) => set('ar', v)} /></FField></FRow>
      <FRow cols={3}><FField label="Code" required error={err.code}><TextInput value={f.code} onChange={(v) => set('code', v)} mono placeholder="INF301" /></FField>
        <FField label="Programme" required error={err.prog}><Dropdown value={f.prog} onChange={(v) => set('prog', v)} options={PROGRAMMES.map((x) => [x.id, x.name])} /></FField>
        <FField label="Semestre" required error={err.sem}><Dropdown value={f.sem} onChange={(v) => set('sem', v)} options={[['S1', 'S1'], ['S2', 'S2']]} /></FField></FRow>
      <FRow cols={5}><FField label="Coef." required error={err.coef}><TextInput value={f.coef} onChange={(v) => set('coef', v)} mono /></FField>
        <FField label="Crédits" required error={err.cr}><TextInput value={f.cr} onChange={(v) => set('cr', v)} mono /></FField>
        <FField label="CM"><TextInput value={f.cm} onChange={(v) => set('cm', v)} mono /></FField>
        <FField label="TD"><TextInput value={f.td} onChange={(v) => set('td', v)} mono /></FField>
        <FField label="TP"><TextInput value={f.tp} onChange={(v) => set('tp', v)} mono /></FField></FRow>
    </Modal>
  );
};

const SemesterForm = ({ edit, semester }) => {
  const [f, setF] = React.useState(edit ? { lib: semester.label, year: semester.year, cur: semester.status === 'current' } : { lib: '', year: '2025–2026', cur: false });
  const [err, setErr] = React.useState({}); const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => { const e = reqOK(f, ['lib', 'year']); setErr(e); if (Object.keys(e).length) return; AdminUI.toast(edit ? 'Semestre mis à jour' : 'Semestre créé'); AdminUI.close(); };
  return (
    <Modal title={edit ? 'Modifier le semestre' : 'Nouveau semestre'} icon="cal" width={460}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>Enregistrer</Btn></>}>
      <FRow><FField label="Libellé" required error={err.lib}><TextInput value={f.lib} onChange={(v) => set('lib', v)} placeholder="Semestre 1" /></FField>
        <FField label="Année académique" required error={err.year}><TextInput value={f.year} onChange={(v) => set('year', v)} mono /></FField></FRow>
      <FRow><FField label="Date début"><window.DatePicker valueLabel="3 fév. 2026" /></FField>
        <FField label="Date fin"><window.DatePicker valueLabel="20 juin 2026" /></FField></FRow>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        <div><div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Semestre en cours</div><div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3, marginTop: 1 }}>Un seul semestre peut être courant</div></div>
        <Toggle on={f.cur} onClick={() => set('cur', !f.cur)} />
      </div>
    </Modal>
  );
};

/* ---------- Schedule entry ---------- */
const ScheduleForm = ({ edit, entry }) => {
  const { SUBJECTS } = window.ADMIN_DATA; const { PROGRAMMES, DAYS, ALL_SCHEDULE } = window.ADMIN_DATA2;
  const [f, setF] = React.useState(edit ? { subj: entry.subjectId, prog: 'GINF', prof: entry.prof, room: entry.room, day: String(entry.day), start: entry.start, end: entry.end, type: 'CM', sem: 'S2' } : { subj: '', prog: 'GINF', prof: '', room: '', day: '', start: '', end: '', type: 'CM', sem: 'S2' });
  const [err, setErr] = React.useState({}); const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const conflict = React.useMemo(() => {
    if (!f.room || f.day === '' || !f.start || !f.end) return null;
    const tm = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return (ALL_SCHEDULE || []).find((e) => e.room === f.room && String(e.day) === String(f.day)
      && tm(e.start) < tm(f.end) && tm(f.start) < tm(e.end)
      && !(edit && entry && e.room === entry.room && String(e.day) === String(entry.day) && e.start === entry.start)) || null;
  }, [f.room, f.day, f.start, f.end]);
  const submit = () => {
    const e = reqOK(f, ['subj', 'prog', 'prof', 'room', 'day', 'start', 'end']);
    if (f.start && f.end && f.end <= f.start) e.end = 'Doit être après le début';
    setErr(e); if (Object.keys(e).length) return;
    AdminUI.toast(edit ? 'Séance mise à jour' : 'Séance créée'); AdminUI.close();
  };
  const times = []; for (let h = 8; h <= 17; h++) { times.push([`${String(h).padStart(2, '0')}:00`, `${h}:00`]); times.push([`${String(h).padStart(2, '0')}:30`, `${h}:30`]); }
  return (
    <Modal title={edit ? 'Modifier la séance' : 'Nouvelle séance'} icon="cal" width={540}
      footer={<>{edit && <Btn kind="danger" icon="trash" style={{ marginRight: 'auto' }} onClick={() => { AdminUI.toast('Séance supprimée'); AdminUI.close(); }}>Supprimer</Btn>}<Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>{edit ? 'Enregistrer' : 'Créer la séance'}</Btn></>}>
      <FRow><FField label="Matière" required error={err.subj}><Dropdown value={f.subj} onChange={(v) => set('subj', v)} options={SUBJECTS.map((x) => [x.id, x.name])} /></FField>
        <FField label="Programme" required error={err.prog}><Dropdown value={f.prog} onChange={(v) => set('prog', v)} options={PROGRAMMES.filter((p) => p.faculty === 'FST').map((x) => [x.id, x.name])} /></FField></FRow>
      <FRow><FField label="Enseignant" required error={err.prof}><TextInput value={f.prof} onChange={(v) => set('prof', v)} placeholder="Pr. Nom" /></FField>
        <FField label="Salle" required error={err.room}><TextInput value={f.room} onChange={(v) => set('room', v)} placeholder="Amphi A1" /></FField></FRow>
      {conflict && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '-4px 0 14px', padding: '10px 13px', background: C.amberBg, borderRadius: 10, border: `1px solid ${C.amber}33` }}>
          <window.Icon name="warn" size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text1, lineHeight: 1.5 }}>Salle {f.room} est déjà réservée par <b>{conflict.name}</b> ({conflict.programme}) à ce créneau.</span>
            <div style={{ fontFamily: A_SANS, fontSize: 11.5, color: C.text3, marginTop: 2 }}>Vous pouvez tout de même enregistrer (partage de salle autorisé).</div>
          </div>
        </div>
      )}
      <FRow cols={4}><FField label="Jour" required error={err.day}><Dropdown value={f.day} onChange={(v) => set('day', v)} options={DAYS.map((d, i) => [String(i), d.slice(0, 3)])} /></FField>
        <FField label="Début" required error={err.start}><Dropdown value={f.start} onChange={(v) => set('start', v)} options={times} /></FField>
        <FField label="Fin" required error={err.end}><Dropdown value={f.end} onChange={(v) => set('end', v)} options={times} /></FField>
        <FField label="Type"><Dropdown value={f.type} onChange={(v) => set('type', v)} options={['CM', 'TD', 'TP', 'Examen']} /></FField></FRow>
    </Modal>
  );
};

Object.assign(window, { StudentForm, AdminForm, FacultyForm, ProgrammeForm, SubjectForm, SemesterForm, ScheduleForm });
