/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel */
/* ============ Unipocket Admin — ADMINISTRATEURS ============ */

const Admins = ({ go, notify }) => {
  const { ADMINS, ROLES } = window.ADMIN_DATA2;
  const roleKeys = Object.keys(ROLES);

  return (
    <div>
      <window.PageHead title="Administrateurs" subtitle={`${ADMINS.filter(a => a.active).length} comptes actifs · gérés par le Super Admin`}
        actions={<Btn kind="primary" icon="plus" onClick={() => window.AdminUI.open(<window.AdminForm />)}>Nouvel administrateur</Btn>} />

      {/* role legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {roleKeys.map((k) => {
          const r = ROLES[k];
          const n = ADMINS.filter((a) => a.role === k).length;
          return (
            <Card key={k} pad={15}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Badge tone={r.tone} dot>{r.label}</Badge>
                <span style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 17, color: C.text1 }}>{n}</span>
              </div>
              <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{r.desc}</div>
            </Card>
          );
        })}
      </div>

      <Card pad={0}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ height: 40, background: C.surface2 }}>
            {[['Administrateur'], ['Rôle', 160], ['Périmètre', 170], ['Dernière connexion', 160], ['Statut', 110], ['', 60]].map(([t, w], i) => (
              <th key={i} style={{ textAlign: 'left', padding: '0 18px', width: w }}><SectionLabel>{t}</SectionLabel></th>
            ))}
          </tr></thead>
          <tbody>
            {ADMINS.map((a, i) => {
              const r = window.ADMIN_DATA2.ROLES[a.role];
              return (
                <tr key={a.id} style={{ height: 60, borderTop: i ? `1px solid ${C.hair}` : 'none', opacity: a.active ? 1 : 0.6 }}>
                  <td style={{ padding: '0 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={a.name} size={38} tone={a.you ? C.jade : undefined} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{a.name}</span>
                          {a.you && <Badge tone="slate" style={{ fontSize: 10 }}>Vous</Badge>}
                        </div>
                        <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3 }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0 18px' }}><Badge tone={r.tone} dot>{r.label}</Badge></td>
                  <td style={{ padding: '0 18px', fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>{a.scope}</td>
                  <td style={{ padding: '0 18px', fontFamily: A_MONO, fontSize: 12, color: C.text3 }}>{a.last}</td>
                  <td style={{ padding: '0 18px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: A_SANS, fontSize: 13, fontWeight: 600, color: a.active ? C.jadeText : C.text3 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: a.active ? C.jade : C.text3 }} />{a.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}><window.Menu items={[
                    { icon: 'edit', label: 'Modifier le rôle', onClick: () => window.AdminUI.open(<window.AdminForm edit admin={a} />) },
                    { divider: true },
                    { icon: a.active ? 'x' : 'reset', label: a.active ? 'Désactiver' : 'Réactiver', tone: a.active ? 'danger' : undefined, onClick: () => window.AdminUI.open(<window.DeactivateAdminModal admin={a} />) },
                  ]} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 14, padding: '12px 16px', background: C.blueBg, borderRadius: 12 }}>
        <Icon name="shield" size={18} color={C.blue} />
        <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>Toute modification de rôle est enregistrée dans le <b style={{ color: C.text1, cursor: 'pointer' }} onClick={() => go('audit')}>journal d'audit</b>. Seul un Super Admin peut créer ou désactiver un compte.</span>
      </div>
    </div>
  );
};

Object.assign(window, { Admins });
