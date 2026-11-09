/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Avatar, SectionLabel */
/* ============ Unipocket Admin — MODALS (confirms, readers, viewers) ============ */
const { Modal, ConfirmModal, FRow, FField, TextInput } = window;
const AdminUI = window.AdminUI;

/* ---------- reset student password ---------- */
const ResetPwModal = ({ student }) => {
  const [pw, setPw] = React.useState(null);
  const gen = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = 'temp-'; for (let i = 0; i < 7; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
  return (
    <Modal title="Réinitialiser le mot de passe" icon="key" iconTone="amber" width={440}
      footer={pw ? <Btn kind="primary" onClick={AdminUI.close}>Terminé</Btn>
        : <><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="dangerSolid" onClick={() => { setPw(gen()); AdminUI.toast('Mot de passe réinitialisé'); }}>Réinitialiser</Btn></>}>
      <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, lineHeight: 1.6 }}>
        Le mot de passe de <b style={{ color: C.text1 }}>{student.name}</b> (<span style={{ fontFamily: A_MONO, fontSize: 12.5 }}>{student.id}</span>) sera remplacé par un mot de passe temporaire. L'étudiant devra se reconnecter.
      </div>
      {pw && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: C.jadeFaint, borderRadius: 11 }}>
          <span style={{ fontFamily: A_MONO, fontSize: 15, fontWeight: 500, color: C.jade700, flex: 1 }}>{pw}</span>
          <Btn kind="soft" size="sm" icon="file" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(pw); AdminUI.toast('Copié'); }}>Copier</Btn>
        </div>
      )}
    </Modal>
  );
};

/* ---------- change student status ---------- */
const StatusModal = ({ student, action }) => {
  const [reason, setReason] = React.useState('');
  const cfg = {
    suspend: { icon: 'warn', tone: 'amber', title: "Suspendre l'étudiant", body: 'ne pourra plus accéder à l\'application.', btn: 'Suspendre', kind: 'dangerSolid', note: 'Cette action est réversible.', toast: 'Étudiant suspendu' },
    graduate: { icon: 'grad', tone: 'jade', title: 'Marquer comme diplômé', body: 'sera marqué comme diplômé, accès en lecture seule.', btn: 'Diplômer', kind: 'primary', note: '', toast: 'Étudiant diplômé' },
    reactivate: { icon: 'reset', tone: 'jade', title: "Réactiver l'étudiant", body: 'retrouvera l\'accès à l\'application.', btn: 'Réactiver', kind: 'primary', note: '', toast: 'Étudiant réactivé' },
  }[action];
  return (
    <Modal title={cfg.title} icon={cfg.icon} iconTone={cfg.tone} width={440}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind={cfg.kind} onClick={() => { AdminUI.toast(cfg.toast); AdminUI.close(); }}>{cfg.btn}</Btn></>}>
      <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, lineHeight: 1.6 }}><b style={{ color: C.text1 }}>{student.name}</b> ({student.id}) {cfg.body}</div>
      <div style={{ marginTop: 14 }}><FField label="Raison (optionnel)"><TextInput value={reason} onChange={setReason} placeholder="Motif…" /></FField></div>
      {cfg.note && <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, marginTop: 12 }}>{cfg.note}</div>}
    </Modal>
  );
};

/* ---------- news reader ---------- */
const catTone2 = { official: 'jade', events: 'blue', scolarite: 'amber', sport: 'exam', jeunesse: 'slate', sponsors: 'slate', general: 'slate' };
const NewsReader = ({ article }) => {
  const { NEWS_CATS } = window.ADMIN_DATA;
  const cl = (NEWS_CATS.find((c) => c.id === article.cat) || {}).label;
  return (
    <Modal title="Aperçu de l'article" icon="mega" iconTone="exam" width={620}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Fermer</Btn>
        <Btn kind="danger" icon="trash" onClick={() => AdminUI.open(<DeleteNewsModal article={article} />)}>Supprimer</Btn>
        <Btn kind="primary" icon="edit" onClick={() => { AdminUI.close(); AdminUI.go('news-create'); }}>Modifier</Btn></>}>
      <div style={{ height: 200, borderRadius: 13, background: C.surface2, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 11px)` }} />
        <Icon name="image" size={26} color={C.text3} style={{ position: 'relative' }} />
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 11 }}>
        <Badge tone={catTone2[article.cat]}>{cl}</Badge>
        {article.urgent && <Badge tone="danger" dot>Urgent</Badge>}
        {article.status === 'draft' && <Badge tone="amber">Brouillon</Badge>}
      </div>
      <h2 style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 23, color: C.text1, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>{article.title}</h2>
      <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, marginTop: 8, marginBottom: 16 }}>{article.source} · {article.date} à {article.time} · {article.read} de lecture</div>
      <div style={{ fontFamily: A_SANS, fontSize: 15, color: C.text1, lineHeight: 1.7 }}>{article.body}</div>
      <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
        {article.status === 'published' ? `Publié le ${article.date} à ${article.time} · ${article.views.toLocaleString('fr')} vues` : 'Brouillon — non publié'}
      </div>
    </Modal>
  );
};

const DeleteNewsModal = ({ article }) => (
  <ConfirmModal icon="trash" tone="danger" title="Supprimer l'article" confirmLabel="Supprimer" onConfirm={() => AdminUI.toast('Article supprimé')}>
    <b style={{ color: C.text1 }}>« {article.title} »</b> sera définitivement supprimé. Les étudiants ne verront plus cet article dans l'application.<br /><br />Cette action est irréversible.
  </ConfirmModal>
);

/* ---------- justification document viewer ---------- */
const DocViewer = ({ j, onApprove, onReject }) => (
  <Modal title="Justificatif d'absence" icon="file" iconTone="blue" width={560}
    footer={j.status === 'pending' ? <><Btn kind="danger" icon="x" onClick={() => { AdminUI.close(); onReject && onReject(); }}>Rejeter</Btn><Btn kind="primary" icon="check" onClick={() => { AdminUI.close(); onApprove && onApprove(); }}>Valider l'absence</Btn></> : <Btn kind="quiet" onClick={AdminUI.close}>Fermer</Btn>}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
      <Avatar name={j.student.name} size={38} />
      <div style={{ flex: 1 }}><div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14.5, color: C.text1 }}>{j.student.name}</div>
        <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>{j.subject} · absent le {j.absenceDate}</div></div>
    </div>
    <div style={{ height: 340, borderRadius: 13, background: C.surface2, border: `1px solid ${C.hair2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 13px)` }} />
      <div style={{ width: 70, height: 88, borderRadius: 8, background: C.surface, border: `1px solid ${C.hair2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.jadeText, position: 'relative', boxShadow: C.shadow }}><Icon name={j.docIcon} size={34} /></div>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{j.reason}</div>
        <div style={{ fontFamily: A_MONO, fontSize: 11.5, color: C.text3, marginTop: 3 }}>justificatif_{j.id}.{j.docType === 'PDF' ? 'pdf' : 'jpg'} · reçu {j.submitted}</div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text2, cursor: 'pointer', boxShadow: C.shadow }}>−</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text2, cursor: 'pointer', boxShadow: C.shadow }}>+</div>
      </div>
    </div>
    <div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, lineHeight: 1.5, marginTop: 14, fontStyle: 'italic' }}>« {j.note} »</div>
  </Modal>
);

/* ---------- deactivate admin ---------- */
const DeactivateAdminModal = ({ admin }) => (
  <ConfirmModal icon="x" tone="danger" title={admin.active ? 'Désactiver le compte' : 'Réactiver le compte'} confirmLabel={admin.active ? 'Désactiver' : 'Réactiver'} confirmKind={admin.active ? 'dangerSolid' : 'primary'}
    onConfirm={() => AdminUI.toast(admin.active ? 'Compte désactivé' : 'Compte réactivé')}>
    <b style={{ color: C.text1 }}>{admin.name}</b> {admin.active ? 'ne pourra plus se connecter au portail admin. Son historique d\'audit est conservé. Le compte peut être réactivé.' : 'retrouvera l\'accès au portail admin.'}
  </ConfirmModal>
);

/* ---------- close semester ---------- */
const CloseSemesterModal = ({ label = 'Semestre 2' }) => (
  <ConfirmModal icon="warn" tone="danger" title="Clôturer le semestre" confirmLabel="Clôturer" requireText={label} onConfirm={() => AdminUI.toast('Semestre clôturé')}>
    <b style={{ color: C.text1 }}>« {label} — 2025–2026 »</b> sera clôturé. Cette action :
    <ul style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
      <li>Fige les notes du semestre</li><li>Archive les relevés de présence</li><li>Prépare le prochain semestre</li>
    </ul>
  </ConfirmModal>
);

/* ---------- account: profile + password ---------- */
const ProfileModal = () => (
  <Modal title="Mon profil" icon="users" width={420} footer={<Btn kind="quiet" onClick={AdminUI.close}>Fermer</Btn>}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
      <Avatar name="Saïd Warsama" size={52} tone={C.jade} ring />
      <div><div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 16, color: C.text1 }}>Saïd Warsama</div><div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>said.warsama@univ.dj</div></div>
    </div>
    {[['Rôle', 'Scolarité (REGISTRAR)'], ['Périmètre', 'Service Scolarité'], ['Dernière connexion', "Aujourd'hui · 14:30"]].map(([k, v], i) => (
      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: i ? `1px solid ${C.hair}` : `1px solid ${C.hair}` }}>
        <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>{k}</span><span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{v}</span>
      </div>
    ))}
  </Modal>
);

const PasswordModal = () => {
  const [f, setF] = React.useState({ cur: '', n1: '', n2: '' }); const [err, setErr] = React.useState({});
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => { const e = {}; if (!f.cur) e.cur = 'Requis'; if (f.n1.length < 8) e.n1 = 'Min. 8 caractères'; if (f.n1 !== f.n2) e.n2 = 'Ne correspond pas'; setErr(e); if (Object.keys(e).length) return; AdminUI.toast('Mot de passe mis à jour'); AdminUI.close(); };
  return (
    <Modal title="Changer le mot de passe" icon="key" width={420}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" onClick={submit}>Mettre à jour</Btn></>}>
      <div style={{ marginBottom: 14 }}><FField label="Mot de passe actuel" required error={err.cur}><TextInput type="password" value={f.cur} onChange={(v) => set('cur', v)} placeholder="••••••••" /></FField></div>
      <div style={{ marginBottom: 14 }}><FField label="Nouveau mot de passe" required error={err.n1}><TextInput type="password" value={f.n1} onChange={(v) => set('n1', v)} placeholder="••••••••" /></FField></div>
      <FField label="Confirmer le nouveau mot de passe" required error={err.n2}><TextInput type="password" value={f.n2} onChange={(v) => set('n2', v)} placeholder="••••••••" /></FField>
    </Modal>
  );
};

const ForgotModal = () => (
  <Modal title="Réinitialisation du mot de passe" icon="info" iconTone="blue" width={420} footer={<Btn kind="primary" onClick={AdminUI.close}>Compris</Btn>}>
    <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, lineHeight: 1.6 }}>Contactez un super administrateur pour réinitialiser votre mot de passe. La réinitialisation en libre-service n'est pas disponible dans cette version.</div>
  </Modal>
);

const GradeImportModal = ({ subject }) => {
  const [step, setStep] = React.useState(0);
  const rows = [
    { name: 'Ahmed Omar', cc: 14, cf: 15.5, ok: true }, { name: 'Mukhtar Bouh', cc: 8.5, cf: 9.5, ok: true },
    { name: 'Sahra Egeh', cc: 12, cf: 8, ok: true }, { name: 'Ibrahim Abdi', cc: 18.5, cf: 14, ok: true },
    { name: 'Inconnu X', cc: 11, cf: 12, ok: false, err: 'Matricule inconnu' }, { name: 'Farhan Hassan', cc: 22, cf: 13, ok: false, err: 'Note hors barème' },
  ];
  const valid = rows.filter((r) => r.ok).length;
  return (
    <Modal title={`Importer des notes · ${subject ? subject.name : ''}`} icon="upload" width={560}
      footer={step === 0 ? <><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" iconR="chevron" onClick={() => setStep(1)}>Continuer</Btn></>
        : <><Btn kind="quiet" onClick={() => setStep(0)}>Précédent</Btn><Btn kind="primary" icon="check" onClick={() => { AdminUI.toast(`${valid} notes importées`); AdminUI.close(); }}>Importer les notes</Btn></>}>
      {step === 0 ? (
        <div>
          <div style={{ height: 180, borderRadius: 13, background: C.surface2, border: `1.5px dashed ${C.hair2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 12px)` }} />
            <div style={{ width: 46, height: 46, borderRadius: 12, background: C.surface, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: C.shadow }}><Icon name="upload" size={22} /></div>
            <div style={{ position: 'relative', fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Glissez un fichier CSV</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '11px 13px', background: C.surface2, borderRadius: 10 }}>
            <Icon name="file" size={16} color={C.text3} /><span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, flex: 1 }}>Colonnes attendues : <span style={{ fontFamily: A_MONO, fontSize: 11.5 }}>matricule, note_cc, note_cf</span></span>
            <Btn kind="quiet" size="sm" icon="download">Modèle</Btn>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, marginBottom: 12 }}><b style={{ color: C.text1 }}>{valid} notes</b> prêtes · {rows.length - valid} erreurs.</div>
          <div style={{ border: `1px solid ${C.hair}`, borderRadius: 11, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ height: 34, background: C.surface2 }}>{['', 'Étudiant', 'CC', 'CF', 'NF'].map((h, i) => <th key={i} style={{ textAlign: i > 1 ? 'center' : 'left', padding: '0 12px' }}><SectionLabel>{h}</SectionLabel></th>)}</tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={i} style={{ height: 40, borderTop: `1px solid ${C.hair}`, background: r.ok ? 'transparent' : C.dangerBg }}>
                  <td style={{ padding: '0 12px', width: 30 }}>{r.ok ? <Icon name="check" size={15} color={C.jade} /> : <Icon name="warn" size={15} color={C.danger} />}</td>
                  <td style={{ padding: '0 12px', fontFamily: A_SANS, fontSize: 13, color: C.text1 }}>{r.name}</td>
                  <td style={{ textAlign: 'center', fontFamily: A_MONO, fontSize: 12.5, color: C.text2 }}>{r.cc}</td>
                  <td style={{ textAlign: 'center', fontFamily: A_MONO, fontSize: 12.5, color: C.text2 }}>{r.ok ? r.cf : <span style={{ color: C.danger }}>{r.err}</span>}</td>
                  <td style={{ textAlign: 'center', fontFamily: A_SANS, fontWeight: 700, fontSize: 13, color: r.ok ? C.text1 : C.text3 }}>{r.ok ? (0.4 * r.cc + 0.6 * r.cf).toFixed(2) : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

/* ---------- post-publication grade correction (UX Architecture §3.4) ---------- */
const GradeCorrectionModal = ({ studentName, studentId, subjectName, col, current, onConfirm }) => {
  const [val, setVal] = React.useState(current === '—' ? '' : (current || ''));
  const [reason, setReason] = React.useState('');
  const [err, setErr] = React.useState({});
  const colLabel = col === 'cc' ? 'Contrôle continu (CC)' : 'Contrôle final (CF)';
  const submit = () => {
    const e = {};
    const n = val === '' ? NaN : Number(val);
    if (val === '' || isNaN(n) || n < 0 || n > 20) e.val = 'Note entre 0 et 20 requise';
    if (!reason.trim()) e.reason = 'Un motif est obligatoire pour toute correction après publication';
    setErr(e); if (Object.keys(e).length) return;
    onConfirm && onConfirm(String(val));
    AdminUI.close();
  };
  return (
    <Modal title="Correction de note" icon="edit" iconTone="amber" width={480}
      footer={<><Btn kind="quiet" onClick={AdminUI.close}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Enregistrer la correction</Btn></>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16, padding: '11px 13px', background: C.surface2, borderRadius: 11 }}>
        <Avatar name={studentName} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: C.text1 }}>{studentName}</div>
          <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>{subjectName} · <span style={{ fontFamily: A_MONO, fontSize: 11.5 }}>{studentId}</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 13px', background: C.amberBg, borderRadius: 10 }}>
        <Icon name="warn" size={16} color={C.amber} />
        <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>Ces notes sont publiées. La correction sera consignée au journal d'audit et notifiée à l'étudiant.</span>
      </div>
      <FRow>
        <FField label={colLabel} required error={err.val} hint={current && current !== '—' ? `Valeur actuelle : ${current}` : 'Aucune valeur saisie'}>
          <TextInput value={val} onChange={(v) => setVal(v.replace(/[^0-9.]/g, ''))} placeholder="0 – 20" mono />
        </FField>
        <div />
      </FRow>
      <FField label="Motif de la correction" required error={err.reason}>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Ex. Erreur de saisie sur la copie n°14 — recomptage validé par l'enseignant."
          style={{ width: '100%', fontFamily: window.A_SANS, fontSize: 14, color: C.text1, background: C.surface, border: `1px solid ${err.reason ? C.danger : C.hair2}`, borderRadius: 10, padding: '10px 13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }}
          onFocus={(e) => { e.target.style.borderColor = err.reason ? C.danger : C.jade; e.target.style.boxShadow = `0 0 0 3px ${err.reason ? C.dangerBg : C.jadeFaint}`; }}
          onBlur={(e) => { e.target.style.borderColor = err.reason ? C.danger : C.hair2; e.target.style.boxShadow = 'none'; }} />
      </FField>
    </Modal>
  );
};

Object.assign(window, { ResetPwModal, StatusModal, NewsReader, DeleteNewsModal, DocViewer, DeactivateAdminModal, CloseSemesterModal, ProfileModal, PasswordModal, ForgotModal, GradeImportModal, GradeCorrectionModal });
