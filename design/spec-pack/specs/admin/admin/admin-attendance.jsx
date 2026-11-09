/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel, fmt */
/* ============ Unipocket Admin — ATTENDANCE (justification queue) ============ */

const DocPreview = ({ j, onOpen }) => (
  <div style={{ background: C.surface2, borderRadius: 12, border: `1px solid ${C.hair}`, padding: 18, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
    {/* striped placeholder */}
    <div style={{ position: 'absolute', inset: 0, opacity: 0.5,
      backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 11px)` }} />
    <div style={{ width: 60, height: 60, borderRadius: 14, background: C.surface, border: `1px solid ${C.hair2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.jadeText, position: 'relative', boxShadow: C.shadow }}>
      <Icon name={j.docIcon} size={28} />
    </div>
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{j.reason}</div>
      <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3, marginTop: 3 }}>justificatif_{j.id}.{j.docType === 'PDF' ? 'pdf' : 'jpg'}</div>
    </div>
    <Btn kind="ghost" size="sm" icon="eye" style={{ position: 'relative' }} onClick={onOpen}>Ouvrir le document</Btn>
  </div>
);

/* ---- programme attendance overview (UX Architecture §4.7) ---- */
const AttendanceOverview = ({ go, programme }) => {
  const { ATT_OVERVIEW, ATT_THRESHOLD } = window.ADMIN_DATA;
  return (
    <Card pad={0} style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
        <div>
          <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Vue d'ensemble de l'assiduité</div>
          <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>{programme ? programme.name + (programme.id === 'GINF' ? ' L3' : '') : ''} · seuil {ATT_THRESHOLD}%</div>
        </div>
        <Badge tone="slate">{ATT_OVERVIEW.length} matières</Badge>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ height: 36, background: C.surface2 }}>
          <th style={{ textAlign: 'left', padding: '0 18px' }}><SectionLabel>Matière</SectionLabel></th>
          <th style={{ textAlign: 'center', width: 100 }}><SectionLabel style={{ textAlign: 'center' }}>Séances</SectionLabel></th>
          <th style={{ textAlign: 'center', width: 130 }}><SectionLabel style={{ textAlign: 'center' }}>Moy. classe</SectionLabel></th>
          <th style={{ textAlign: 'center', width: 150 }}><SectionLabel style={{ textAlign: 'center' }}>Étudiants à risque</SectionLabel></th>
          <th style={{ width: 60 }}></th>
        </tr></thead>
        <tbody>
          {ATT_OVERVIEW.map((o) => {
            const below = o.avg < ATT_THRESHOLD;
            return (
              <tr key={o.id} onClick={() => window.AdminUI.open(<window.AttendanceSubjectModal subject={o} />)}
                style={{ height: 56, borderTop: `1px solid ${C.hair}`, cursor: 'pointer', background: below ? C.amberBg : 'transparent', transition: 'background .12s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = below ? 'rgba(217,130,26,0.18)' : C.surface2}
                onMouseLeave={(e) => e.currentTarget.style.background = below ? C.amberBg : 'transparent'}>
                <td style={{ padding: '0 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: A_MONO, fontSize: 11.5, color: C.text3 }}>{o.id}</span>
                    <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{o.name}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontFamily: A_MONO, fontSize: 12.5, color: C.text2 }}>{o.done}/{o.total}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 15, color: below ? C.amber : C.jadeText }}>{o.avg}%</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13.5, color: o.risk > 5 ? C.danger : C.text2 }}>{o.risk}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {below
                    ? <span title={`Sous le seuil ${ATT_THRESHOLD}%`}><Icon name="warn" size={18} color={C.amber} style={{ margin: '0 auto' }} /></span>
                    : <span title="Au-dessus du seuil"><Icon name="check" size={17} color={C.jade} sw={2.4} style={{ margin: '0 auto' }} /></span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};

/* per-subject detailed attendance (opened from an overview row) */
const AttendanceSubjectModal = ({ subject }) => {
  const { STUDENTS, ATT_THRESHOLD } = window.ADMIN_DATA;
  const hash = (str) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff; return h; };
  const rows = STUDENTS.map((s) => {
    const pct = Math.max(28, Math.min(100, subject.avg + ((hash(s.id + subject.id) % 44) - 22)));
    return { s, pct };
  }).sort((a, b) => a.pct - b.pct);
  const atRisk = rows.filter((r) => r.pct < ATT_THRESHOLD).length;
  return (
    <window.Modal title={subject.name} sub={`${subject.id} · ${subject.done}/${subject.total} séances · moyenne ${subject.avg}%`} icon="check-cal" iconTone={subject.avg < ATT_THRESHOLD ? 'amber' : 'jade'} width={560}
      footer={<window.Btn kind="quiet" onClick={window.AdminUI.close}>Fermer</window.Btn>}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: 13, borderRadius: 11, background: C.jadeFaint }}><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 20, color: C.jadeText }}>{subject.avg}%</div><SectionLabel>Moy. classe</SectionLabel></div>
        <div style={{ flex: 1, padding: 13, borderRadius: 11, background: C.dangerBg }}><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 20, color: C.danger }}>{atRisk}</div><SectionLabel>Sous le seuil {ATT_THRESHOLD}%</SectionLabel></div>
        <div style={{ flex: 1, padding: 13, borderRadius: 11, background: C.surface2 }}><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 20, color: C.text1 }}>{subject.done}/{subject.total}</div><SectionLabel>Séances tenues</SectionLabel></div>
      </div>
      <div style={{ border: `1px solid ${C.hair}`, borderRadius: 12, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
        {rows.slice(0, 14).map((r, i) => (
          <div key={r.s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 14px', borderTop: i ? `1px solid ${C.hair}` : 'none' }}>
            <Avatar name={r.s.name} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: C.text1 }}>{r.s.name}</div>
              <div style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3 }}>{r.s.id}</div>
            </div>
            <div style={{ width: 90, height: 6, borderRadius: 999, background: C.sunken, overflow: 'hidden' }}>
              <div style={{ width: `${r.pct}%`, height: '100%', background: r.pct < ATT_THRESHOLD ? C.danger : r.pct < 85 ? C.amber : C.jade }} />
            </div>
            <span style={{ fontFamily: A_MONO, fontSize: 12, fontWeight: 500, color: r.pct < ATT_THRESHOLD ? C.danger : C.text2, width: 38, textAlign: 'right' }}>{r.pct}%</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3, marginTop: 10, textAlign: 'center' }}>14 des {rows.length} étudiants · triés par assiduité croissante</div>
    </window.Modal>
  );
};

const Attendance = ({ go, notify }) => {
  const { JUSTIFICATIONS, ATT_SUBJECTS, STUDENTS, ATT_OVERVIEW, ATT_THRESHOLD } = window.ADMIN_DATA;
  const scope = window.useScope();
  const { PROGRAMMES } = window.ADMIN_DATA2;
  const programme = PROGRAMMES.find((p) => p.id === scope.programmeId);
  const [items, setItems] = React.useState(JUSTIFICATIONS.map((j) => ({ ...j })));
  const [tab, setTab] = React.useState('pending');
  const [selId, setSelId] = React.useState(items.find((j) => j.status === 'pending')?.id);

  const counts = {
    pending: items.filter((j) => j.status === 'pending').length,
    approved: items.filter((j) => j.status === 'approved').length,
    rejected: items.filter((j) => j.status === 'rejected').length,
  };
  const list = items.filter((j) => j.status === tab);
  const sel = items.find((j) => j.id === selId);

  const act = (id, status) => {
    setItems((it) => it.map((j) => j.id === id ? { ...j, status } : j));
    notify(status === 'approved' ? 'Justificatif validé' : 'Justificatif rejeté', status === 'approved' ? 'check' : 'x');
    const remaining = items.filter((j) => j.status === 'pending' && j.id !== id);
    setSelId(remaining[0]?.id);
  };

  React.useEffect(() => { if (!list.find((j) => j.id === selId)) setSelId(list[0]?.id); }, [tab]);

  const tabs = [['pending', 'En attente', counts.pending], ['approved', 'Validés', counts.approved], ['rejected', 'Rejetés', counts.rejected]];

  return (
    <div>
      <window.PageHead title="Présence" subtitle={programme ? `Assiduité · ${programme.name}${scope.programmeId === 'GINF' ? ' L3' : ''}` : "File des justificatifs d'absence à traiter"}
        actions={<Btn kind="ghost" icon="check-cal" onClick={() => go('attendance-session')}>Marquer une séance</Btn>} />

      {/* overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'En attente', value: counts.pending, c: C.amber, icon: 'clock', bg: C.amberBg },
          { label: 'Validés (sem.)', value: counts.approved + 8, c: C.jadeText, icon: 'check', bg: C.jadeFaint },
          { label: 'Présence moyenne', value: '87%', c: C.text1, icon: 'check-cal', bg: C.blueBg },
          { label: 'Sous le seuil 75%', value: 4, c: C.danger, icon: 'warn', bg: C.dangerBg },
        ].map((m) => (
          <Card key={m.label} pad={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={m.icon} size={18} /></div>
              <div>
                <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: m.c }}>{m.value}</div>
                <SectionLabel style={{ marginTop: 1 }}>{m.label}</SectionLabel>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* programme overview (UX Architecture §4.7) — only when a programme is scoped */}
      {scope.programmeId ? <AttendanceOverview go={go} programme={programme} /> : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '11px 15px', borderRadius: 12, background: C.surface2, border: `1px solid ${C.hair}` }}>
          <Icon name="filter" size={16} color={C.text3} />
          <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>Sélectionnez un programme dans le périmètre pour afficher la vue d'ensemble par matière. La file des justificatifs reste visible ci-dessous.</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <window.SectionLabel>File des justificatifs</window.SectionLabel>
        <div style={{ flex: 1, height: 1, background: C.hair }} />
        <span style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3 }}>Tout le périmètre · triée par ancienneté</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16, alignItems: 'start' }}>
        {/* queue list */}
        <Card pad={0}>
          <div style={{ display: 'flex', gap: 4, padding: 12, borderBottom: `1px solid ${C.hair}` }}>
            {tabs.map(([id, label, n]) => (
              <div key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 9, cursor: 'pointer',
                background: tab === id ? (id === 'pending' ? C.amberBg : C.surface2) : 'transparent',
                fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: tab === id ? (id === 'pending' ? C.amber : C.text1) : C.text2 }}>
                {label}
                <span style={{ fontFamily: A_MONO, fontSize: 11, background: tab === id ? 'rgba(255,255,255,0.6)' : C.sunken, padding: '1px 6px', borderRadius: 999, color: 'inherit' }}>{n}</span>
              </div>
            ))}
          </div>
          {list.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="check" size={26} /></div>
              <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15, color: C.text1 }}>Rien à traiter</div>
              <div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, marginTop: 4 }}>Aucun justificatif {tab === 'pending' ? 'en attente' : tab === 'approved' ? 'validé' : 'rejeté'}.</div>
            </div>
          )}
          {list.map((j) => {
            const active = j.id === selId;
            return (
              <div key={j.id} onClick={() => setSelId(j.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderTop: `1px solid ${C.hair}`, cursor: 'pointer',
                  background: active ? C.jadeFaint : 'transparent', borderLeft: `3px solid ${active ? C.jade : 'transparent'}` }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surface2; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <Avatar name={j.student.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{j.student.name}</span>
                    <Badge tone="slate" style={{ fontSize: 10.5 }}>{j.docType}</Badge>
                  </div>
                  <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>{j.reason} · <span style={{ color: C.text3 }}>{j.subject}</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: A_SANS, fontSize: 12, fontWeight: 600, color: C.text2 }}>Absent le {j.absenceDate}</div>
                  <div style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3, marginTop: 2 }}>reçu {j.submitted}</div>
                </div>
                {tab === 'pending' && <Icon name="chevron" size={16} color={active ? C.jadeText : C.text3} />}
              </div>
            );
          })}
        </Card>

        {/* detail / review pane */}
        {sel ? (
          <Card style={{ position: 'sticky', top: 84 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar name={sel.student.name} size={48} ring />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 16, color: C.text1 }}>{sel.student.name}</div>
                <div style={{ fontFamily: A_MONO, fontSize: 11.5, color: C.text3 }}>{sel.student.id}</div>
              </div>
              <Badge tone={sel.status === 'pending' ? 'amber' : sel.status === 'approved' ? 'jade' : 'danger'} dot>
                {sel.status === 'pending' ? 'En attente' : sel.status === 'approved' ? 'Validé' : 'Rejeté'}
              </Badge>
            </div>

            <DocPreview j={sel} onOpen={() => window.AdminUI.open(<window.DocViewer j={sel} onApprove={() => act(sel.id, 'approved')} onReject={() => act(sel.id, 'rejected')} />)} />

            <div style={{ marginTop: 16 }}>
              {[['Matière', sel.subject], ['Date d\'absence', sel.absenceDate], ['Motif', sel.reason], ['Référence', sel.id]].map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i ? `1px solid ${C.hair}` : 'none' }}>
                  <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>{k}</span>
                  <span style={{ fontFamily: k === 'Référence' ? A_MONO : A_SANS, fontWeight: 600, fontSize: k === 'Référence' ? 12 : 13, color: C.text1, textAlign: 'right', maxWidth: 200 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.surface2, borderRadius: 11, padding: 13, marginTop: 14 }}>
              <SectionLabel style={{ marginBottom: 6 }}>Note de l'étudiant</SectionLabel>
              <div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text1, lineHeight: 1.5, fontStyle: 'italic' }}>« {sel.note} »</div>
            </div>

            {sel.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <Btn kind="danger" icon="x" style={{ flex: 1 }} onClick={() => act(sel.id, 'rejected')}>Rejeter</Btn>
                <Btn kind="primary" icon="check" style={{ flex: 1 }} onClick={() => act(sel.id, 'approved')}>Valider l'absence</Btn>
              </div>
            ) : (
              <div style={{ marginTop: 18, textAlign: 'center', fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>
                Traité · <span style={{ fontWeight: 600, color: sel.status === 'approved' ? C.jadeText : C.danger }}>{sel.status === 'approved' ? 'Validé' : 'Rejeté'}</span>
              </div>
            )}
          </Card>
        ) : (
          <Card style={{ position: 'sticky', top: 84, textAlign: 'center', padding: 50 }}>
            <div style={{ color: C.text3, marginBottom: 10 }}><Icon name="file" size={32} color={C.text3} style={{ margin: '0 auto' }} /></div>
            <div style={{ fontFamily: A_SANS, fontSize: 13.5, color: C.text2 }}>Sélectionnez un justificatif pour le consulter.</div>
          </Card>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { Attendance, AttendanceSubjectModal });
