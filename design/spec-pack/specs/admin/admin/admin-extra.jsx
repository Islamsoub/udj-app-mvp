/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel, Input, inputStyle */
/* ============ Unipocket Admin — LOGIN / IMPORT / SESSION ============ */

/* ---------------- Login (public) ---------------- */
const Login = ({ go }) => {
  const [email, setEmail] = React.useState('said.warsama@univ.dj');
  const [pw, setPw] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [err, setErr] = React.useState(false);
  const submit = () => {
    if (!pw || pw.length < 4) { setErr(true); return; }
    setErr(false); setBusy(true); setTimeout(() => { setBusy(false); go('dashboard'); }, 850);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 1fr', background: C.surface }}>
      {/* brand panel */}
      <div style={{ background: C.sideBg, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 56 }}>
        <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.30), transparent 65%)', top: -160, right: -160 }} />
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,158,117,0.18), transparent 65%)', bottom: -120, left: -100 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 13 }}>
          <window.ULogo size={40} />
          <div>
            <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 19, color: '#fff' }}>Unipocket</div>
            <div style={{ fontFamily: A_MONO, fontSize: 11, letterSpacing: '0.14em', color: C.sideMuted, textTransform: 'uppercase' }}>Admin · UDJ</div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 34, color: '#fff', lineHeight: 1.18, letterSpacing: '-0.02em' }}>Portail<br />d'administration</div>
          <div style={{ fontFamily: A_SANS, fontSize: 15, color: C.jade50, marginTop: 16, maxWidth: 360, lineHeight: 1.6, opacity: 0.85 }}>
            Gérez étudiants, emplois du temps, notes, présence et actualités de l'Université de Djibouti.
          </div>
        </div>
        <div style={{ position: 'relative', fontFamily: A_MONO, fontSize: 11.5, color: C.sideMuted }}>© 2026 Université de Djibouti · v1.0</div>
      </div>

      {/* form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 360, maxWidth: '100%' }}>
          <h1 style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 26, color: C.text1, letterSpacing: '-0.02em', margin: 0 }}>Connexion</h1>
          <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, marginTop: 6, marginBottom: 28 }}>Accédez à votre espace administrateur.</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 7 }}>Adresse e-mail</div>
            <Input icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@univ.dj" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2 }}>Mot de passe</span>
              <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.jadeText, cursor: 'pointer' }} onClick={() => window.AdminUI.open(<window.ForgotModal />)}>Mot de passe oublié ?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Input icon="key" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••"
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
              <div onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.text3, cursor: 'pointer' }}><Icon name="eye" size={17} /></div>
            </div>
          </div>
          <div onClick={() => setRemember(!remember)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: remember ? C.jade : C.surface, border: remember ? 'none' : `1.5px solid ${C.hair2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{remember && <Icon name="check" size={12} color="#fff" sw={3} />}</div>
            <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>Rester connecté sur cet appareil</span>
          </div>
          {err && <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', background: C.dangerBg, borderRadius: 10, marginBottom: 14 }}><Icon name="warn" size={16} color={C.danger} /><span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.danger, fontWeight: 600 }}>Identifiants incorrects. Veuillez réessayer.</span></div>}
          <Btn kind="primary" size="lg" style={{ width: '100%' }} onClick={submit} iconR={busy ? undefined : 'arrow-l'} icon={busy ? undefined : undefined}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </Btn>
          <div style={{ marginTop: 22, padding: 13, background: C.surface2, borderRadius: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="shield" size={17} color={C.jadeText} />
            <span style={{ fontFamily: A_SANS, fontSize: 12, color: C.text2 }}>Connexion sécurisée · accès réservé au personnel de l'UDJ.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- CSV import wizard ---------------- */
const IMPORT_ROWS = [
  { mat: 'UDJ-2024-0443', first: 'Idris', last: 'Waberi', email: 'idris.waberi@univ.dj', prog: 'Génie Informatique', ok: true },
  { mat: 'UDJ-2024-0444', first: 'Loula', last: 'Mahamoud', email: 'loula.mahamoud@univ.dj', prog: 'Génie Informatique', ok: true },
  { mat: 'UDJ-2024-0445', first: 'Tahir', last: 'Egueh', email: '', prog: 'Génie Informatique', ok: false, err: 'E-mail manquant' },
  { mat: 'UDJ-2024-0446', first: 'Samira', last: 'Bouh', email: 'samira.bouh@univ.dj', prog: 'Génie Informatique', ok: true },
  { mat: 'UDJ-2024-0432', first: 'Ahmed', last: 'Omar', email: 'ahmed.omar@univ.dj', prog: 'Génie Informatique', ok: false, err: 'Matricule déjà existant' },
  { mat: 'UDJ-2024-0447', first: 'Kadar', last: 'Ismael', email: 'kadar.ismael@univ.dj', prog: 'Génie Informatique', ok: true },
];
const ImportWizard = ({ go, notify }) => {
  const [step, setStep] = React.useState(0);
  const steps = ['Télécharger', 'Associer les colonnes', 'Vérifier', 'Importer'];
  const total = 38, errors = 2, valid = total - errors;
  const cols = [['matricule', 'Matricule'], ['prenom', 'Prénom'], ['nom', 'Nom'], ['email', 'E-mail'], ['programme', 'Programme']];

  return (
    <div>
      <window.PageHead title="Importer des étudiants" back={() => go('students')} subtitle="Ajout en masse depuis un fichier CSV" />

      {/* stepper */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: i < step ? C.jade : i === step ? C.jadeFaint : C.surface2, color: i < step ? '#fff' : i === step ? C.jadeText : C.text3,
                  border: i === step ? `1.5px solid ${C.jade}` : 'none', fontFamily: A_SANS, fontWeight: 700, fontSize: 13 }}>
                  {i < step ? <Icon name="check" size={15} color="#fff" sw={3} /> : i + 1}
                </div>
                <span style={{ fontFamily: A_SANS, fontWeight: i === step ? 700 : 600, fontSize: 13.5, color: i <= step ? C.text1 : C.text3 }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? C.jade : C.hair, margin: '0 14px', borderRadius: 2 }} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Card pad={26}>
        {step === 0 && (
          <div>
            <div style={{ height: 240, borderRadius: 16, background: C.surface2, border: `1.5px dashed ${C.hair2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 12px)` }} />
              <div style={{ width: 54, height: 54, borderRadius: 14, background: C.surface, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: C.shadow }}><Icon name="upload" size={26} /></div>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15, color: C.text1 }}>Glissez votre fichier CSV ici</div>
                <div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, marginTop: 3 }}>ou cliquez pour parcourir · max 5 Mo</div>
              </div>
              <Btn kind="ghost" size="sm" style={{ position: 'relative' }}>Choisir un fichier</Btn>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16, padding: '12px 14px', background: C.surface2, borderRadius: 11 }}>
              <Icon name="file" size={18} color={C.text3} />
              <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, flex: 1 }}>Besoin d'un modèle ? Téléchargez le gabarit avec les colonnes attendues.</span>
              <Btn kind="quiet" size="sm" icon="download">Modèle CSV</Btn>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 12, padding: '14px 16px', border: `1px solid ${C.hair2}`, borderRadius: 12 }}>
              <Icon name="file" size={20} color={C.jadeText} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>etudiants_ginf_l3.csv</div>
                <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>38 lignes · 12 Ko · prêt</div>
              </div>
              <Badge tone="jade" dot>Chargé</Badge>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ fontFamily: A_SANS, fontSize: 13.5, color: C.text2, marginBottom: 18 }}>Associez chaque colonne du fichier au champ correspondant. Détection automatique appliquée.</div>
            {cols.map(([id, label]) => (
              <div key={id} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 12, alignItems: 'center', padding: '11px 0', borderTop: `1px solid ${C.hair}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: A_MONO, fontSize: 13, color: C.text2, background: C.surface2, padding: '10px 13px', borderRadius: 9 }}>
                  <Icon name="file" size={15} color={C.text3} /> {label.toLowerCase()}
                </div>
                <Icon name="chevron" size={16} color={C.text3} style={{ margin: '0 auto' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1, border: `1px solid ${C.hair2}`, padding: '10px 13px', borderRadius: 9 }}>
                  {label} <Badge tone="jade" dot>auto</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, padding: 14, borderRadius: 12, background: C.jadeFaint }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: C.jadeText }}>{valid}</div>
                <SectionLabel>Prêts à importer</SectionLabel>
              </div>
              <div style={{ flex: 1, padding: 14, borderRadius: 12, background: C.dangerBg }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: C.danger }}>{errors}</div>
                <SectionLabel>À corriger</SectionLabel>
              </div>
              <div style={{ flex: 1, padding: 14, borderRadius: 12, background: C.surface2 }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: C.text1 }}>{total}</div>
                <SectionLabel>Total lignes</SectionLabel>
              </div>
            </div>
            <div style={{ border: `1px solid ${C.hair}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ height: 36, background: C.surface2 }}>
                  {['', 'Matricule', 'Nom', 'E-mail', 'Programme'].map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '0 14px' }}><SectionLabel>{h}</SectionLabel></th>)}
                </tr></thead>
                <tbody>
                  {IMPORT_ROWS.map((r, i) => (
                    <tr key={i} style={{ height: 46, borderTop: `1px solid ${C.hair}`, background: r.ok ? 'transparent' : C.dangerBg }}>
                      <td style={{ padding: '0 14px', width: 36 }}>{r.ok ? <Icon name="check" size={16} color={C.jade} /> : <Icon name="warn" size={16} color={C.danger} />}</td>
                      <td style={{ padding: '0 14px', fontFamily: A_MONO, fontSize: 12, color: C.text2 }}>{r.mat}</td>
                      <td style={{ padding: '0 14px', fontFamily: A_SANS, fontSize: 13, color: C.text1 }}>{r.first} {r.last}</td>
                      <td style={{ padding: '0 14px', fontFamily: A_SANS, fontSize: 12.5, color: r.email ? C.text2 : C.danger }}>{r.email || '—'}</td>
                      <td style={{ padding: '0 14px' }}>{r.ok ? <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>{r.prog}</span> : <Badge tone="danger">{r.err}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, marginTop: 10 }}>Les {errors} lignes en erreur seront ignorées. Vous pourrez les corriger et réimporter.</div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Icon name="check" size={32} sw={2.4} /></div>
            <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 21, color: C.text1 }}>{valid} étudiants importés</div>
            <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, marginTop: 6 }}>{errors} lignes ignorées · ajoutées à Génie Informatique L3.</div>
            <Btn kind="primary" style={{ marginTop: 22 }} onClick={() => go('students')}>Voir la liste des étudiants</Btn>
          </div>
        )}

        {step < 3 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.hair}` }}>
            <Btn kind="ghost" onClick={() => step === 0 ? go('students') : setStep(step - 1)}>{step === 0 ? 'Annuler' : 'Précédent'}</Btn>
            <Btn kind="primary" iconR="chevron" onClick={() => { if (step === 2) notify(`${valid} étudiants importés`, 'check'); setStep(step + 1); }}>
              {step === 2 ? `Importer ${valid} étudiants` : 'Continuer'}
            </Btn>
          </div>
        )}
      </Card>
    </div>
  );
};

/* ---------------- Session attendance marking ---------------- */
/* UX Architecture §4.2 — Présent / Partiel / Absent, hours-based. */
const SessionMarking = ({ go, notify }) => {
  const { STUDENTS } = window.ADMIN_DATA;
  const SESSION_H = 1.5;               // derived from schedule entry 13:00–14:30
  const HALF = SESSION_H / 2;
  const [marks, setMarks] = React.useState(() => { const m = {}; STUDENTS.forEach((s) => m[s.idx] = { s: 'present', h: SESSION_H }); return m; });
  const setStatus = (idx, v) => setMarks((m) => ({ ...m, [idx]: { s: v, h: v === 'present' ? SESSION_H : v === 'absent' ? 0 : (m[idx].s === 'partial' ? m[idx].h : HALF) } }));
  const setHours = (idx, delta) => setMarks((m) => { const h = Math.max(0.25, Math.min(SESSION_H - 0.25, +(m[idx].h + delta).toFixed(2))); return { ...m, [idx]: { ...m[idx], h } }; });

  const counts = { present: 0, partial: 0, absent: 0 };
  let attended = 0;
  Object.values(marks).forEach((v) => { counts[v.s]++; attended += v.s === 'present' ? SESSION_H : v.s === 'partial' ? v.h : 0; });
  const totalH = SESSION_H * STUDENTS.length;
  const opts = [['present', 'Présent', C.jade, C.jadeFaint], ['partial', 'Partiel', C.amber, C.amberBg], ['absent', 'Absent', C.danger, C.dangerBg]];

  return (
    <div style={{ paddingBottom: 76 }}>
      <window.PageHead title="Faire l'appel" back={() => go('attendance')}
        subtitle={<span>Algorithmique avancée · Séance du mer. 10 juin · 13:00–14:30 · <b style={{ color: C.text1 }}>{SESSION_H} h</b></span>}
        actions={<window.DatePicker valueLabel="10 juin 2026" allowed={[3, 10, 17, 24]} />} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[['Présents', counts.present, C.jadeText], ['Partiels', counts.partial, C.amber], ['Absents', counts.absent, C.danger], ['Heures suivies', `${attended.toFixed(1)}/${totalH.toFixed(0)} h`, C.text1]].map(([l, v, c]) => (
          <Card key={l} pad={14}><SectionLabel>{l}</SectionLabel><div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 23, color: c, marginTop: 5 }}>{v}</div></Card>
        ))}
      </div>

      <Card pad={0}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottom: `1px solid ${C.hair}` }}>
          <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: C.text1 }}>{STUDENTS.length} étudiants</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="quiet" size="sm" onClick={() => { const m = {}; STUDENTS.forEach((s) => m[s.idx] = { s: 'present', h: SESSION_H }); setMarks(m); }}>Tout présent</Btn>
          </div>
        </div>
        {STUDENTS.map((s, i) => {
          const mk = marks[s.idx];
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '10px 16px', borderTop: i ? `1px solid ${C.hair}` : 'none' }}>
              <span style={{ fontFamily: A_MONO, fontSize: 11.5, color: C.text3, width: 22 }}>{i + 1}</span>
              <Avatar name={s.name} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{s.name}</div>
                <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{s.id}</div>
              </div>
              {/* inline hours stepper — only when Partiel */}
              {mk.s === 'partial' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4, padding: '3px 4px', background: C.amberBg, borderRadius: 9 }}>
                  <div onClick={() => setHours(s.idx, -0.25)} style={{ width: 26, height: 26, borderRadius: 7, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text2, fontFamily: A_SANS, fontWeight: 700, fontSize: 16, boxShadow: C.shadow }}>−</div>
                  <span style={{ fontFamily: A_MONO, fontSize: 12, fontWeight: 500, color: C.amber, minWidth: 62, textAlign: 'center' }}>{mk.h}h / {SESSION_H}h</span>
                  <div onClick={() => setHours(s.idx, 0.25)} style={{ width: 26, height: 26, borderRadius: 7, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text2, fontFamily: A_SANS, fontWeight: 700, fontSize: 16, boxShadow: C.shadow }}>+</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 5, background: C.surface2, padding: 4, borderRadius: 10 }}>
                {opts.map(([v, label, col, bg]) => {
                  const on = mk.s === v;
                  return (
                    <div key={v} onClick={() => setStatus(s.idx, v)} style={{ padding: '6px 13px', borderRadius: 7, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5,
                      background: on ? bg : 'transparent', color: on ? col : C.text3, transition: 'all .1s' }}>{label}</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Card>

      <div style={{ position: 'fixed', bottom: 0, left: 248, right: 0, background: C.surface, borderTop: `1px solid ${C.hair2}`, boxShadow: '0 -6px 22px rgba(28,35,32,0.08)', padding: '13px 32px', display: 'flex', alignItems: 'center', gap: 16, zIndex: 6 }}>
        <span style={{ fontFamily: A_SANS, fontSize: 13.5, color: C.text1 }}>
          <b style={{ color: C.jadeText }}>{counts.present}</b> présents · <b style={{ color: C.amber }}>{counts.partial}</b> partiels · <b style={{ color: C.danger }}>{counts.absent}</b> absents
        </span>
        <span style={{ fontFamily: A_MONO, fontSize: 12, color: C.text3 }}>· {attended.toFixed(1)} h suivies sur {totalH.toFixed(0)} h</span>
        <div style={{ flex: 1 }} />
        <Btn kind="quiet" onClick={() => go('attendance')}>Annuler</Btn>
        <Btn kind="primary" icon="check" onClick={() => { notify("Appel enregistré · présence mise à jour", 'check'); go('attendance'); }}>Enregistrer l'appel</Btn>
      </div>
    </div>
  );
};

Object.assign(window, { Login, ImportWizard, SessionMarking });
