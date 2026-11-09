/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel, Input */
/* ============ Unipocket Admin — JOURNAL D'AUDIT ============ */

const actionMeta = (action) => {
  const v = action.split('.').pop();
  if (/create|bulkCreate|send|login/.test(v)) return ['jade', 'plus'];
  if (/update|status|publish|approve/.test(v)) return ['blue', 'edit'];
  if (/delete|reject/.test(v)) return ['danger', 'trash'];
  if (/resetPassword/.test(v)) return ['amber', 'reset'];
  return ['slate', 'dot'];
};

const Audit = ({ go }) => {
  const { AUDIT } = window.ADMIN_DATA2;
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [open, setOpen] = React.useState(null);

  const snapshot = (a) => {
    const v = a.action.split('.').pop();
    if (/create|bulkCreate/.test(v)) return { before: null, after: { entité: a.entity, cible: a.target, statut: 'actif' } };
    if (/delete/.test(v)) return { before: { entité: a.entity, cible: a.target, statut: 'publié' }, after: null };
    if (/status/.test(v)) return { before: { statut: 'actif' }, after: { statut: 'suspendu' } };
    if (/publish/.test(v)) return { before: { statut: 'brouillon', visible: 'non' }, after: { statut: 'publié', visible: 'oui' } };
    if (/approve/.test(v)) return { before: { statut: 'en attente' }, after: { statut: 'validé', absence: 'justifiée' } };
    if (/reject/.test(v)) return { before: { statut: 'en attente' }, after: { statut: 'rejeté' } };
    if (/update/.test(v)) return { before: { valeur: '11.00' }, after: { valeur: '14.00' } };
    return { before: null, after: { info: a.target } };
  };

  const groups = [['all', 'Tout'], ['grade', 'Notes'], ['student', 'Étudiants'], ['news', 'Actualités'], ['attendance', 'Présence'], ['admin', 'Admins']];
  const rows = AUDIT.filter((a) => {
    const m = filter === 'all' || a.action.startsWith(filter);
    const s = (a.target + ' ' + a.who + ' ' + a.action).toLowerCase().includes(q.toLowerCase());
    return m && s;
  });

  return (
    <div>
      <window.PageHead title="Journal d'audit" subtitle="Toute action sensible est tracée · réservé au Super Admin"
        actions={<Btn kind="ghost" icon="download" onClick={() => window.AdminUI.toast('Journal exporté (CSV)')}>Exporter (CSV)</Btn>} />

      <Card pad={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: `1px solid ${C.hair}`, flexWrap: 'wrap' }}>
          <div style={{ width: 280 }}><Input icon="search" placeholder="Rechercher une action, une cible…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 10 }}>
            {groups.map(([id, label]) => (
              <div key={id} onClick={() => setFilter(id)} style={{ padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5,
                background: filter === id ? C.surface : 'transparent', boxShadow: filter === id ? C.shadow : 'none', color: filter === id ? C.text1 : C.text2 }}>{label}</div>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <window.DatePicker valueLabel="1 juin 2026" presets={['7 jours', '30 jours', 'Ce semestre']} />
          <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>{rows.length} entrées</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ height: 38, background: C.surface2 }}>
            {[['Action'], ['Entité', 130], ['Cible'], ['Auteur', 160], ['Adresse IP', 130], ['Horodatage', 120]].map(([t, w], i) => (
              <th key={i} style={{ textAlign: 'left', padding: '0 18px', width: w }}><SectionLabel>{t}</SectionLabel></th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((a, i) => {
              const [tone, ic] = actionMeta(a.action);
              const tC = { jade: C.jadeText, blue: C.blue, danger: C.danger, amber: C.amber, slate: C.slate }[tone];
              const tBg = { jade: C.jadeFaint, blue: C.blueBg, danger: C.dangerBg, amber: C.amberBg, slate: C.slateBg }[tone];
              return (
                <React.Fragment key={a.id}>
                <tr style={{ height: 52, borderTop: i ? `1px solid ${C.hair}` : 'none', cursor: 'pointer', background: open === a.id ? C.surface2 : 'transparent' }}
                  onClick={() => setOpen(open === a.id ? null : a.id)}
                  onMouseEnter={(e) => { if (open !== a.id) e.currentTarget.style.background = C.surface2; }} onMouseLeave={(e) => { if (open !== a.id) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ padding: '0 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: tBg, color: tC, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={ic} size={15} /></div>
                      <span style={{ fontFamily: A_MONO, fontSize: 12.5, color: C.text1 }}>{a.action}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0 18px' }}><Badge tone="slate">{a.entity}</Badge></td>
                  <td style={{ padding: '0 18px', fontFamily: A_SANS, fontSize: 13, color: C.text1 }}>{a.target}</td>
                  <td style={{ padding: '0 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {a.who !== 'Système' ? <Avatar name={a.who} size={24} /> : <div style={{ width: 24, height: 24, borderRadius: 999, background: C.slateBg, color: C.slate, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="gear" size={13} /></div>}
                      <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>{a.who}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0 18px', fontFamily: A_MONO, fontSize: 11.5, color: C.text3 }}>{a.ip}</td>
                  <td style={{ padding: '0 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: A_MONO, fontSize: 11.5, color: C.text3 }}>{a.when}</span>
                      <Icon name="chevron-d" size={14} color={C.text3} style={{ transform: open === a.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                    </div>
                  </td>
                </tr>
                {open === a.id && (() => { const snap = snapshot(a); return (
                  <tr style={{ background: C.surface2 }}>
                    <td colSpan={6} style={{ padding: '4px 18px 18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[['Avant', snap.before, C.danger], ['Après', snap.after, C.jadeText]].map(([lbl, obj, col]) => (
                          <div key={lbl} style={{ background: C.surface, border: `1px solid ${C.hair}`, borderRadius: 11, padding: 14 }}>
                            <SectionLabel style={{ marginBottom: 9, color: col }}>{lbl}</SectionLabel>
                            {obj ? Object.entries(obj).map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontFamily: A_MONO, fontSize: 12 }}>
                                <span style={{ color: C.text3 }}>{k}</span><span style={{ color: C.text1 }}>{String(v)}</span>
                              </div>
                            )) : <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, fontStyle: 'italic' }}>— aucun (création/suppression)</div>}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3, marginTop: 10 }}>{a.id} · {a.entity} · horodatage immuable</div>
                    </td>
                  </tr>
                ); })()}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div style={{ padding: 40, textAlign: 'center', fontFamily: A_SANS, color: C.text3 }}>Aucune entrée.</div>}
      </Card>
    </div>
  );
};

Object.assign(window, { Audit });
