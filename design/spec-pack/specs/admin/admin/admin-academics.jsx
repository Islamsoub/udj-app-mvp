/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, SectionLabel, Input */
/* ============ Unipocket Admin — ACADÉMIQUE ============ */

const Tabs = ({ tabs, value, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 11, width: 'fit-content' }}>
    {tabs.map(([id, label, n]) => (
      <div key={id} onClick={() => onChange(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
        background: value === id ? C.surface : 'transparent', boxShadow: value === id ? C.shadow : 'none',
        fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: value === id ? C.text1 : C.text2 }}>
        {label}{n != null && <span style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{n}</span>}
      </div>
    ))}
  </div>
);

const TableShell = ({ head, children }) => (
  <Card pad={0}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr style={{ height: 40, background: C.surface2 }}>
        {head.map((h, i) => <th key={i} style={{ textAlign: h.r ? 'right' : 'left', padding: '0 18px', width: h.w }}><SectionLabel style={{ textAlign: h.r ? 'right' : 'left' }}>{h.t}</SectionLabel></th>)}
      </tr></thead>
      <tbody>{children}</tbody>
    </table>
  </Card>
);

const Academics = ({ go }) => {
  const { FACULTIES, PROGRAMMES, SEMESTERS } = window.ADMIN_DATA2;
  const { SUBJECTS } = window.ADMIN_DATA;
  const [tab, setTab] = React.useState('programmes');
  const [fac, setFac] = React.useState('all');
  const facName = (id) => (FACULTIES.find((f) => f.id === id) || {}).short || id;

  return (
    <div>
      <window.PageHead title="Structure académique" subtitle="Facultés, programmes, matières et semestres"
        actions={<Btn kind="primary" icon="plus" onClick={() => window.AdminUI.open(
          tab === 'faculties' ? <window.FacultyForm /> : tab === 'subjects' ? <window.SubjectForm /> : tab === 'semesters' ? <window.SemesterForm /> : <window.ProgrammeForm />
        )}>Ajouter</Btn>} />

      <div style={{ marginBottom: 18 }}>
        <Tabs value={tab} onChange={setTab} tabs={[['faculties', 'Facultés', FACULTIES.length], ['programmes', 'Programmes', PROGRAMMES.length], ['subjects', 'Matières', SUBJECTS.length], ['semesters', 'Semestres', SEMESTERS.length]]} />
      </div>

      {tab === 'faculties' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {FACULTIES.map((f) => (
            <Card key={f.id} hover>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: A_SANS, fontWeight: 800, fontSize: 14 }}>{f.short}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>{f.name}</div>
                  <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>Doyen · {f.dean}</div>
                </div>
                <window.Menu items={[
                  { icon: 'edit', label: 'Modifier', onClick: () => window.AdminUI.open(<window.FacultyForm edit faculty={f} />) },
                  { icon: 'grad', label: 'Voir les programmes', onClick: () => setTab('programmes') },
                ]} />
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
                <div><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 18, color: C.text1 }}>{f.programmes}</div><SectionLabel>Programmes</SectionLabel></div>
                <div><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 18, color: C.text1 }}>{f.students.toLocaleString('fr')}</div><SectionLabel>Étudiants</SectionLabel></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'programmes' && (
        <div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
            {[['all', 'Toutes facultés'], ...FACULTIES.map((f) => [f.id, f.short])].map(([id, label]) => (
              <div key={id} onClick={() => setFac(id)} style={{ padding: '6px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5,
                background: fac === id ? C.jade : C.surface, color: fac === id ? '#fff' : C.text2, border: `1px solid ${fac === id ? C.jade : C.hair2}` }}>{label}</div>
            ))}
          </div>
          <TableShell head={[{ t: 'Programme' }, { t: 'Faculté', w: 130 }, { t: 'Niveaux', w: 160 }, { t: 'Étudiants', w: 110, r: true }, { t: '', w: 50 }]}>
            {PROGRAMMES.filter((p) => fac === 'all' || p.faculty === fac).map((p, i) => (
              <tr key={p.id} onClick={() => window.AdminUI.open(<window.ProgrammeForm edit prog={p} />)} style={{ height: 56, borderTop: i ? `1px solid ${C.hair}` : 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '0 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{p.name}</span>
                    {p.current && <Badge tone="jade" dot>Actif</Badge>}
                  </div>
                  <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3, marginTop: 2 }}>{p.id}</div>
                </td>
                <td style={{ padding: '0 18px' }}><Badge tone="slate">{facName(p.faculty)}</Badge></td>
                <td style={{ padding: '0 18px', fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>{p.levels}</td>
                <td style={{ padding: '0 18px', textAlign: 'right', fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: C.text1 }}>{p.students}</td>
                <td style={{ textAlign: 'center', color: C.text3 }}><Icon name="chevron" size={16} /></td>
              </tr>
            ))}
          </TableShell>
        </div>
      )}

      {tab === 'subjects' && (
        <TableShell head={[{ t: 'Matière' }, { t: 'Code', w: 110 }, { t: 'Enseignant', w: 200 }, { t: 'Semestre', w: 110 }, { t: 'Coef.', w: 80, r: true }, { t: '', w: 50 }]}>
          {SUBJECTS.map((s, i) => (
            <tr key={s.id} onClick={() => window.AdminUI.open(<window.SubjectForm edit subject={s} />)} style={{ height: 54, borderTop: i ? `1px solid ${C.hair}` : 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '0 18px', fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{s.name}</td>
              <td style={{ padding: '0 18px', fontFamily: A_MONO, fontSize: 12.5, color: C.text2 }}>{s.id}</td>
              <td style={{ padding: '0 18px', fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>{s.prof}</td>
              <td style={{ padding: '0 18px' }}><Badge tone={s.sem === 1 ? 'blue' : 'amber'}>Semestre {s.sem}</Badge></td>
              <td style={{ padding: '0 18px', textAlign: 'right', fontFamily: A_MONO, fontSize: 13, color: C.text1 }}>{s.coef}</td>
              <td style={{ textAlign: 'center', color: C.text3 }}><Icon name="edit" size={15} /></td>
            </tr>
          ))}
        </TableShell>
      )}

      {tab === 'semesters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SEMESTERS.map((s) => {
            const meta = s.status === 'current' ? ['jade', 'En cours'] : s.status === 'closed' ? ['amber', 'Clôturé'] : ['slate', 'Archivé'];
            return (
              <Card key={s.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.status === 'current' ? C.jadeFaint : C.surface2, color: s.status === 'current' ? C.jadeText : C.text3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="cal" size={22} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>{s.label} · {s.year}</span>
                      <Badge tone={meta[0]} dot>{meta[1]}</Badge>
                    </div>
                    <div style={{ fontFamily: A_MONO, fontSize: 12, color: C.text3, marginTop: 3 }}>{s.start} → {s.end}</div>
                  </div>
                  {s.status === 'current'
                    ? <Btn kind="ghost" size="sm" icon="gear" onClick={() => window.AdminUI.open(<window.SemesterForm edit semester={s} />)}>Gérer</Btn>
                    : s.status === 'closed' ? <Btn kind="soft" size="sm" onClick={() => window.AdminUI.toast('Semestre défini comme courant')}>Définir comme courant</Btn>
                    : <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>Lecture seule</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { Academics, Tabs, TableShell });
