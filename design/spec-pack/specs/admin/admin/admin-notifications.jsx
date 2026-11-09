/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, SectionLabel, Input, inputStyle */
/* ============ Unipocket Admin — NOTIFICATIONS (composer + history) ============ */

const notifKind = { notes: ['grad', 'jade'], news: ['mega', 'exam'], agenda: ['cal', 'blue'], presence: ['warn', 'amber'] };

const Notifications = ({ go, notify }) => {
  const { NOTIF_HISTORY, FACULTIES, PROGRAMMES } = window.ADMIN_DATA2;
  const { STUDENTS } = window.ADMIN_DATA;
  const [target, setTarget] = React.useState('program');
  const [title, setTitle] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [fac, setFac] = React.useState('FST');
  const [prog, setProg] = React.useState('GINF');
  const [chips, setChips] = React.useState([STUDENTS[0]]);
  const [sq, setSq] = React.useState('');
  const [openH, setOpenH] = React.useState(null);

  const targets = [
    ['all', 'Tous les étudiants', '2 480 destinataires'],
    ['faculty', 'Une faculté', 'Sciences et Tech. · 1 240'],
    ['program', 'Un programme', 'Génie Informatique L3 · 42'],
    ['student', 'Un étudiant', 'Destinataire unique'],
  ];
  const count = { all: 2480, faculty: 1240, program: 42, student: 1 }[target];
  const valid = title.trim() && msg.trim();

  return (
    <div>
      <window.PageHead title="Notifications" subtitle="Envoyez une notification push aux étudiants" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionLabel style={{ marginBottom: 12 }}>Destinataires</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {targets.map(([id, label, sub]) => {
                const active = target === id;
                return (
                  <div key={id} onClick={() => setTarget(id)} style={{ padding: 14, borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${active ? C.jade : C.hair2}`, background: active ? C.jadeFaint : C.surface, transition: 'all .12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: active ? C.jadeText : C.text1 }}>{label}</span>
                      <span style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${active ? C.jade : C.hair2}`, background: active ? C.jade : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <Icon name="check" size={11} color="#fff" sw={3} />}
                      </span>
                    </div>
                    <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text2, marginTop: 3 }}>{sub}</div>
                  </div>
                );
              })}
            </div>
            {target !== 'all' && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
                {target === 'faculty' && <window.FField label="Faculté"><window.Dropdown value={fac} onChange={setFac} options={FACULTIES.map((f) => [f.id, f.name])} /></window.FField>}
                {target === 'program' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <window.FField label="Faculté"><window.Dropdown value={fac} onChange={(v) => { setFac(v); setProg(''); }} options={FACULTIES.map((f) => [f.id, f.short])} /></window.FField>
                  <window.FField label="Programme"><window.Dropdown value={prog} onChange={setProg} options={PROGRAMMES.filter((p) => p.faculty === fac).map((p) => [p.id, p.name])} placeholder="Sélectionner" /></window.FField>
                </div>}
                {target === 'student' && (
                  <div>
                    <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 7 }}>Rechercher un étudiant</div>
                    {chips.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {chips.map((s) => <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.jadeText, background: C.jadeFaint, padding: '5px 10px', borderRadius: 999 }}>{s.name}<span onClick={() => setChips(chips.filter((c) => c.id !== s.id))} style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={13} /></span></span>)}
                    </div>}
                    <div style={{ position: 'relative' }}>
                      <Input icon="search" placeholder="Nom ou matricule…" value={sq} onChange={(e) => setSq(e.target.value)} />
                      {sq.trim() && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: C.surface, border: `1px solid ${C.hair2}`, borderRadius: 11, boxShadow: C.shadowLg, zIndex: 20, padding: 5, maxHeight: 200, overflowY: 'auto' }}>
                          {STUDENTS.filter((s) => (s.name.toLowerCase().includes(sq.toLowerCase()) || s.id.toLowerCase().includes(sq.toLowerCase())) && !chips.find((c) => c.id === s.id)).slice(0, 5).map((s) => (
                            <div key={s.id} onClick={() => { setChips([...chips, s]); setSq(''); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = C.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                              <window.Avatar name={s.name} size={26} /><span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text1 }}>{s.name}</span><span style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3 }}>{s.id}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 7 }}>Titre</div>
              <Input placeholder="Titre de la notification…" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 7 }}>Message</div>
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Contenu du message…" maxLength={180}
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.5 }} />
              <div style={{ textAlign: 'right', fontFamily: A_MONO, fontSize: 11, color: C.text3, marginTop: 5 }}>{msg.length}/180</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>Sera envoyé à <b style={{ color: C.text1 }}>{count.toLocaleString('fr')}</b> étudiant{count > 1 ? 's' : ''}</span>
              <div style={{ flex: 1 }} />
              <Btn kind="ghost" onClick={() => window.AdminUI.soon('Envoi planifié disponible prochainement')}>Planifier</Btn>
              <Btn kind="primary" icon="send" disabled={!valid} onClick={() => { notify(`Notification envoyée · ${count.toLocaleString('fr')} destinataires`, 'send'); setTitle(''); setMsg(''); }}>Envoyer maintenant</Btn>
            </div>
          </Card>
        </div>

        {/* phone preview */}
        <Card>
          <SectionLabel style={{ marginBottom: 12 }}>Aperçu (appareil étudiant)</SectionLabel>
          <div style={{ background: '#0E1512', borderRadius: 22, padding: 14, paddingTop: 28, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 50, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
            <div style={{ fontFamily: A_MONO, fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 10 }}>maintenant</div>
            <div style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: 13, display: 'flex', gap: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(150deg, #1D9E75, #0F6E56)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: A_SANS, fontWeight: 800, fontSize: 15, color: '#fff' }}>U</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 11.5, color: '#fff' }}>Unipocket</span>
                  <span style={{ fontFamily: A_SANS, fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>à l'instant</span>
                </div>
                <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: '#fff', marginTop: 3 }}>{title || 'Titre de la notification'}</div>
                <div style={{ fontFamily: A_SANS, fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 2, lineHeight: 1.4 }}>{msg || 'Le message apparaîtra ici…'}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* history */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 16, color: C.text1, marginBottom: 12 }}>Historique des envois</div>
        <Card pad={0}>
          {NOTIF_HISTORY.map((n, i) => {
            const [ic, tn] = notifKind[n.kind] || ['bell', 'slate'];
            const tnC = { jade: C.jadeText, exam: C.exam, blue: C.blue, amber: C.amber, slate: C.slate }[tn];
            const tnBg = { jade: C.jadeFaint, exam: C.examBg, blue: C.blueBg, amber: C.amberBg, slate: C.slateBg }[tn];
            return (
              <div key={n.id} onClick={() => setOpenH(openH === n.id ? null : n.id)} style={{ borderTop: i ? `1px solid ${C.hair}` : 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: tnBg, color: tnC, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={ic} size={17} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{n.title}</div>
                  <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, marginTop: 1 }}>{n.target}</div>
                </div>
                <Badge tone="slate">{n.count.toLocaleString('fr')} reçus</Badge>
                <span style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3, width: 110, textAlign: 'right' }}>{n.when}</span>
                <Icon name="chevron-d" size={15} color={C.text3} style={{ transform: openH === n.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
              </div>
              {openH === n.id && (
                <div style={{ padding: '0 18px 16px 66px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px' }}>
                  {[['Cible', n.target], ['Destinataires', n.count.toLocaleString('fr')], ['Envoyé le', n.when], ['Par', 'Saïd Warsama'], ['Statut', '✓ Envoyé via FCM']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: A_SANS, fontSize: 12.5 }}><span style={{ color: C.text3 }}>{k}</span><span style={{ color: k === 'Statut' ? C.jadeText : C.text1, fontWeight: 600 }}>{v}</span></div>
                  ))}
                </div>
              )}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};

Object.assign(window, { Notifications });
