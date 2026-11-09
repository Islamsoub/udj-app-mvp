/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, SectionLabel, Toggle, Input, inputStyle */
/* ============ Unipocket Admin — PARAMÈTRES ============ */

const SettingsRow = ({ title, desc, children, last }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 0', borderTop: `1px solid ${C.hair}` }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{title}</div>
      {desc && <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>{desc}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const SettingsCard = ({ icon, title, children }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></div>
      <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>{title}</span>
    </div>
    {children}
  </Card>
);

/* ---- news categories: drag-to-reorder + add/delete (UX Architecture §7.2) ---- */
const CategoriesCard = () => {
  const [cats, setCats] = React.useState([
    { id: 'official', name: 'Officiel' }, { id: 'events', name: 'Événements' }, { id: 'scolarite', name: 'Scolarité' },
    { id: 'sport', name: 'Sport' }, { id: 'youth', name: 'Youth' }, { id: 'sponsors', name: 'Sponsors' },
  ]);
  const [adding, setAdding] = React.useState(false);
  const [nv, setNv] = React.useState('');
  const [dragI, setDragI] = React.useState(null);
  const [overI, setOverI] = React.useState(null);
  const drop = (i) => {
    if (dragI == null || dragI === i) { setDragI(null); setOverI(null); return; }
    setCats((c) => { const a = [...c]; const [m] = a.splice(dragI, 1); a.splice(i, 0, m); return a; });
    setDragI(null); setOverI(null);
  };
  const add = () => { if (!nv.trim()) return; setCats((c) => [...c, { id: 'c' + Date.now(), name: nv.trim() }]); setNv(''); setAdding(false); window.AdminUI.toast('Catégorie ajoutée'); };
  const del = (id) => setCats((c) => c.filter((x) => x.id !== id));
  return (
    <SettingsCard icon="mega" title="Catégories d'actualités">
      <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, margin: '4px 0 12px', lineHeight: 1.5 }}>Rubriques disponibles dans l'application étudiante. Glissez la poignée pour réordonner.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {cats.map((cat, i) => (
          <div key={cat.id} draggable onDragStart={() => setDragI(i)} onDragEnd={() => { setDragI(null); setOverI(null); }}
            onDragOver={(e) => { e.preventDefault(); if (overI !== i) setOverI(i); }} onDrop={() => drop(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10,
              border: `1px solid ${overI === i && dragI != null ? C.jade : C.hair}`, background: dragI === i ? C.surface2 : C.surface,
              opacity: dragI === i ? 0.5 : 1, boxShadow: overI === i && dragI != null && dragI !== i ? `0 -2px 0 ${C.jade}` : 'none', transition: 'border-color .12s' }}>
            <span style={{ cursor: 'grab', color: C.text3, display: 'flex' }}><Icon name="grip" size={16} /></span>
            <span style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3, width: 16 }}>{i + 1}</span>
            <span style={{ flex: 1, fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{cat.name}</span>
            <div onClick={() => del(cat.id)} title="Supprimer" style={{ cursor: 'pointer', color: C.text3, width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.danger; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text3; }}><Icon name="trash" size={15} /></div>
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input autoFocus value={nv} onChange={(e) => setNv(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setNv(''); } }} placeholder="Nom de la catégorie…"
            style={{ ...inputStyle, flex: 1, padding: '9px 12px' }}
            onFocus={(e) => { e.target.style.borderColor = C.jade; e.target.style.boxShadow = `0 0 0 3px ${C.jadeFaint}`; }} onBlur={(e) => { e.target.style.borderColor = C.hair2; e.target.style.boxShadow = 'none'; }} />
          <Btn kind="primary" size="sm" onClick={add}>Ajouter</Btn>
          <Btn kind="quiet" size="sm" onClick={() => { setAdding(false); setNv(''); }}>Annuler</Btn>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}><Btn kind="ghost" size="sm" icon="plus" onClick={() => setAdding(true)}>Ajouter une catégorie</Btn></div>
      )}
    </SettingsCard>
  );
};
window.CategoriesCard = CategoriesCard;

const Settings = ({ go, notify }) => {
  const [cc, setCc] = React.useState(40);
  const [threshold, setThreshold] = React.useState(75);
  const [justifDelay, setJustifDelay] = React.useState(8);
  const [tg, setTg] = React.useState({ autoPublish: false, gradeNotif: true, presenceAlert: true, weeklyDigest: false });
  const tt = (k) => setTg((s) => ({ ...s, [k]: !s[k] }));

  const mentions = [['Très Bien', '≥ 16'], ['Bien', '14 – 15.99'], ['Assez Bien', '12 – 13.99'], ['Passable', '10 – 11.99'], ['Insuffisant', '< 10']];

  return (
    <div>
      <window.PageHead title="Paramètres" subtitle="Configuration du système · réservé au Super Admin"
        actions={<Btn kind="primary" icon="check" onClick={() => notify('Paramètres enregistrés', 'check')}>Enregistrer</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SettingsCard icon="cal" title="Période académique">
            <SettingsRow title="Semestre courant" desc="Affiché par défaut dans toute l'application">
              <div style={{ width: 230 }}><window.Dropdown value="S2-2526" onChange={() => window.AdminUI.toast('Semestre courant mis à jour')} options={window.ADMIN_DATA2.SEMESTERS.map((s) => [s.id, `${s.label} · ${s.year}${s.status === 'current' ? ' (en cours)' : ''}`])} /></div>
            </SettingsRow>
            <SettingsRow title="Année universitaire" desc="Calendrier de référence">
              <span style={{ fontFamily: A_MONO, fontSize: 13, color: C.text1 }}>2025 – 2026</span>
            </SettingsRow>
            <SettingsRow title="Semaine de cours" desc="Jours ouvrés (Djibouti)">
              <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: C.text1 }}>Dim → Jeu</span>
            </SettingsRow>
          </SettingsCard>

          <SettingsCard icon="grad" title="Barème de notation">
            <div style={{ paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Pondération CC / CF</span>
                <span style={{ fontFamily: A_MONO, fontSize: 13, color: C.jadeText }}>NF = {(cc / 100).toFixed(2)}·CC + {(1 - cc / 100).toFixed(2)}·CF</span>
              </div>
              {/* split bar */}
              <div style={{ display: 'flex', height: 40, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.hair}` }}>
                <div style={{ width: `${cc}%`, background: C.jadeFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', borderRight: `2px solid ${C.jade}` }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13, color: C.jadeText }}>CC {cc}%</span>
                </div>
                <div style={{ flex: 1, background: C.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13, color: C.blue }}>CF {100 - cc}%</span>
                </div>
              </div>
              <input type="range" min="20" max="60" step="5" value={cc} onChange={(e) => setCc(+e.target.value)}
                style={{ width: '100%', marginTop: 12, accentColor: C.jade }} />
              <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3, marginTop: 4 }}>Contrôle continu vs. examen final. Appliqué au calcul de toutes les notes.</div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
              <SectionLabel style={{ marginBottom: 10 }}>Mentions</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {mentions.map(([m, r]) => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge tone={m === 'Insuffisant' ? 'danger' : m === 'Passable' ? 'amber' : 'jade'}>{m}</Badge>
                    <span style={{ fontFamily: A_MONO, fontSize: 12.5, color: C.text2 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SettingsCard icon="check-cal" title="Assiduité">
            <div style={{ paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Seuil d'assiduité</span>
                <span style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: threshold < 70 ? C.amber : C.jadeText }}>{threshold}%</span>
              </div>
              <input type="range" min="50" max="90" step="5" value={threshold} onChange={(e) => setThreshold(+e.target.value)} style={{ width: '100%', accentColor: C.jade }} />
              <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 6 }}>En-dessous de ce taux, l'étudiant est signalé « non-assidu » et reçoit une alerte.</div>
            </div>
            <SettingsRow title="Délai de justification" desc="Les étudiants ne pourront plus soumettre de justificatif après ce délai.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min={1} max={30} value={justifDelay} onChange={(e) => setJustifDelay(Math.max(1, Math.min(30, +e.target.value || 1)))}
                  style={{ ...inputStyle, width: 66, textAlign: 'center', padding: '8px 10px', fontFamily: A_MONO }}
                  onFocus={(e) => { e.target.style.borderColor = C.jade; e.target.style.boxShadow = `0 0 0 3px ${C.jadeFaint}`; }}
                  onBlur={(e) => { e.target.style.borderColor = C.hair2; e.target.style.boxShadow = 'none'; }} />
                <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>jours</span>
              </div>
            </SettingsRow>
            <SettingsRow title="Alerte automatique" desc="Notifier l'étudiant sous le seuil">
              <Toggle on={tg.presenceAlert} onClick={() => tt('presenceAlert')} />
            </SettingsRow>
          </SettingsCard>

          <window.CategoriesCard />

          <SettingsCard icon="bell" title="Automatisations">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '4px 0 4px', padding: '10px 13px', background: C.jadeFaint, borderRadius: 10 }}>
              <Icon name="check" size={16} color={C.jadeText} sw={2.4} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, lineHeight: 1.5 }}>Notifications automatiques toujours actives. Publication des notes, changements d'emploi du temps et justificatifs déclenchent des notifications gérées par le système.</span>
            </div>
            <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
              <SettingsRow title="Publication auto des notes" desc="Remplacé par la publication manuelle en deux temps (CC / NF)">
                <Toggle on={false} onClick={() => {}} />
              </SettingsRow>
              <SettingsRow title="Notification à la publication" desc="Toujours active — non désactivable">
                <Toggle on={true} onClick={() => {}} />
              </SettingsRow>
              <SettingsRow title="Récapitulatif hebdomadaire" desc="Email du lundi aux administrateurs">
                <Toggle on={false} onClick={() => {}} />
              </SettingsRow>
            </div>
          </SettingsCard>

          <SettingsCard icon="gear" title="Préférences régionales">
            <SettingsRow title="Langue par défaut" desc="Interface de l'application étudiante">
              <div title="Configuration de la langue par défaut — prochainement" style={{ display: 'flex', gap: 4, background: C.surface2, padding: 3, borderRadius: 9, cursor: 'default' }}>
                {['Français', 'العربية'].map((l, i) => (
                  <div key={l} style={{ padding: '6px 13px', borderRadius: 7, fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                    background: i === 0 ? C.surface : 'transparent', boxShadow: i === 0 ? C.shadow : 'none', color: i === 0 ? C.text1 : C.text2 }}>{l}</div>
                ))}
              </div>
            </SettingsRow>
            <SettingsRow title="Fuseau horaire" desc="Africa/Djibouti (GMT+3)">
              <span style={{ fontFamily: A_MONO, fontSize: 13, color: C.text1 }}>GMT+3</span>
            </SettingsRow>
          </SettingsCard>
        </div>
      </div>

      {/* danger zone */}
      <div style={{ marginTop: 16, padding: '16px 20px', borderRadius: 14, border: `1px solid ${C.danger}33`, background: C.dangerBg, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Icon name="warn" size={20} color={C.danger} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: C.text1 }}>Clôturer le semestre</div>
          <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 1 }}>Verrouille la saisie des notes et archive les données. Action irréversible.</div>
        </div>
        <Btn kind="danger" icon="x" onClick={() => window.AdminUI.open(<window.CloseSemesterModal label="Semestre 2" />)}>Clôturer le semestre</Btn>
      </div>
    </div>
  );
};

Object.assign(window, { Settings });
