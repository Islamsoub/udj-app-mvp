/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel, Input, fmt, mention, gradeTone, stageMeta, ccPublished, nfPublished */
/* ============ Unipocket Admin — GRADES (picker + entry table) ============ */
/* UX Architecture §3: two-phase publish (CC / NF), lifecycle badges,
   lock-after-publish + single-cell "Modifier la note" correction. */

/* ---------- shared mutable grade-lifecycle store ---------- */
const _gListeners = new Set();
const _stages = { ...window.ADMIN_DATA.SUBJECT_STAGE };
const GradeState = {
  stage: (id) => _stages[id],
  all: () => ({ ..._stages }),
  set(id, st) { _stages[id] = st; this._emit(); },
  publishSemester(sem, type) {
    window.ADMIN_DATA.SUBJECTS.filter((s) => s.sem === sem).forEach((s) => {
      if (type === 'cc' && _stages[s.id] < 4) _stages[s.id] = 4;
      if (type === 'nf') _stages[s.id] = 7;
    });
    this._emit();
  },
  _emit() { _gListeners.forEach((l) => l()); },
  subscribe(l) { _gListeners.add(l); return () => _gListeners.delete(l); },
};
window.GradeState = GradeState;
function useStages() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => GradeState.subscribe(force), []);
  return GradeState;
}
window.useStages = useStages;

/* ---------- subject picker ---------- */
const Grades = ({ go }) => {
  const { SUBJECTS, STUDENTS, GRADEBOOK, NF } = window.ADMIN_DATA;
  const scope = window.useScope();
  const stages = useStages();
  const [sem, setSem] = React.useState(2);

  const subjAvg = (id) => {
    let w = 0, c = 0;
    STUDENTS.forEach((s) => { const g = GRADEBOOK[s.idx][id]; const nf = NF(g.cc, g.cf); if (nf != null) { w += nf; c++; } });
    return c ? w / c : null;
  };
  const enteredCC = (id) => STUDENTS.filter((s) => GRADEBOOK[s.idx][id].cc != null).length;

  // programme selection required (UX Architecture §3.1)
  if (!scope.programmeId) {
    return (
      <div>
        <window.PageHead title="Notes" subtitle="Publication et saisie des notes par programme" />
        <Card style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Icon name="grad" size={30} /></div>
          <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 19, color: C.text1 }}>Sélectionnez un programme pour voir les matières</div>
          <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Utilisez le sélecteur de périmètre en haut de page pour choisir une faculté puis un programme. Les matières et les actions de publication s'afficheront ici.
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '9px 14px', borderRadius: 10, background: C.surface2, fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>
            <Icon name="filter" size={15} color={C.jadeText} /> Périmètre requis
          </div>
        </Card>
      </div>
    );
  }

  const subs = SUBJECTS.filter((s) => s.sem === sem);
  const st = (id) => stages.stage(id);
  const allCcPub = subs.every((s) => ccPublished(st(s.id)));
  const allNfPub = subs.every((s) => nfPublished(st(s.id)));
  const allCcEntered = subs.every((s) => st(s.id) >= 3);
  const allNfComputed = subs.every((s) => st(s.id) >= 6);
  const missingCc = subs.filter((s) => st(s.id) < 3).length;
  const missingNf = subs.filter((s) => st(s.id) < 6).length;

  const publishCc = () => { GradeState.publishSemester(sem, 'cc'); window.__notify(`Notes CC publiées · Semestre ${sem} · ${STUDENTS.length} étudiants notifiés`, 'send'); };
  const publishNf = () => { GradeState.publishSemester(sem, 'nf'); window.__notify(`Résultats finaux publiés · Semestre ${sem} · ${STUDENTS.length} étudiants notifiés`, 'send'); };

  let actions;
  if (!allCcPub) {
    actions = (
      <div title={allCcEntered ? '' : `Saisie CC incomplète — ${missingCc} matière${missingCc > 1 ? 's' : ''}`}>
        <Btn kind="primary" icon="send" disabled={!allCcEntered} onClick={publishCc}>Publier les notes CC</Btn>
      </div>
    );
  } else if (!allNfPub) {
    actions = (
      <div title={allNfComputed ? '' : `Notes finales incomplètes — ${missingNf} matière${missingNf > 1 ? 's' : ''}`}>
        <Btn kind="primary" icon="send" disabled={!allNfComputed} onClick={publishNf}>Publier les résultats finaux</Btn>
      </div>
    );
  } else {
    actions = (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 10, background: C.jadeFaint, color: C.jadeText, fontFamily: A_SANS, fontWeight: 700, fontSize: 13.5 }}>
        <Icon name="check" size={16} sw={2.4} /> Résultats publiés · Semestre {sem}
      </div>
    );
  }

  return (
    <div>
      <window.PageHead title="Notes" subtitle="Publication et saisie des notes par programme"
        actions={<>
          <Btn kind="ghost" icon="download" onClick={() => window.AdminUI.soon('Export disponible prochainement')}>Exporter le relevé</Btn>
          {actions}
        </>} />

      {/* publish-state helper strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '11px 15px', borderRadius: 12,
        background: allNfPub ? C.jadeFaint : allCcPub ? 'rgba(47,125,209,0.08)' : C.surface2, border: `1px solid ${allNfPub ? 'rgba(29,158,117,0.25)' : allCcPub ? 'rgba(47,125,209,0.22)' : C.hair}` }}>
        <Icon name={allNfPub ? 'check-cal' : allCcPub ? 'clock' : 'grad'} size={17} color={allNfPub ? C.jadeText : allCcPub ? C.blue : C.text3} />
        <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>
          {allNfPub
            ? <><b style={{ color: C.text1, fontWeight: 700 }}>Semestre {sem} clôturé</b> — CC et résultats finaux publiés pour toutes les matières.</>
            : allCcPub
              ? <><b style={{ color: C.text1, fontWeight: 700 }}>Notes CC publiées</b> — les étudiants voient leurs contrôles continus. En attente des résultats finaux.</>
              : <><b style={{ color: C.text1, fontWeight: 700 }}>Saisie en cours</b> — publiez les notes CC une fois toutes les matières complétées.</>}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 11, width: 'fit-content', marginBottom: 18 }}>
        {[1, 2].map((n) => (
          <div key={n} onClick={() => setSem(n)} style={{ padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5,
            background: sem === n ? C.surface : 'transparent', boxShadow: sem === n ? C.shadow : 'none', color: sem === n ? C.text1 : C.text2 }}>Semestre {n}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {subs.map((su) => {
          const stg = st(su.id);
          const meta = stageMeta(stg);
          const avg = subjAvg(su.id);
          const ccN = enteredCC(su.id);
          return (
            <Card key={su.id} hover onClick={() => go('grade-entry', { subjectId: su.id })}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="grad" size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>{su.name}</div>
                  <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>
                    <span style={{ fontFamily: A_MONO, fontSize: 11.5 }}>{su.id}</span> · {su.prof} · Coef. {su.coef}
                  </div>
                </div>
                <Badge tone={meta.tone} dot>{meta.label}</Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18 }}>
                <div style={{ display: 'flex', gap: 20, flex: 1 }}>
                  <div>
                    <SectionLabel>CC saisis</SectionLabel>
                    <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15, color: ccN === STUDENTS.length ? C.jadeText : C.amber, marginTop: 3 }}>{ccN}/{STUDENTS.length}</div>
                  </div>
                  <div>
                    <SectionLabel>{ccPublished(stg) ? 'Verrouillage' : 'État'}</SectionLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      {ccPublished(stg) ? <><Icon name="lock" size={13} color={C.text2} /><span style={{ fontFamily: A_SANS, fontSize: 12.5, fontWeight: 600, color: C.text2 }}>{nfPublished(stg) ? 'Tout' : 'CC'}</span></> : <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>Éditable</span>}
                    </div>
                  </div>
                </div>
                <div style={{ width: 1, height: 34, background: C.hair }} />
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 19, color: C.text1 }}>{fmt(avg, 1)}</div>
                  <SectionLabel>Moy. classe</SectionLabel>
                </div>
                <div style={{ color: C.text3 }}><Icon name="chevron" size={18} /></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- grade cell (shared with student detail) ---------- */
const GradeCell = ({ value, invalid, dirty, locked, onChange, onKey, onUnlock, inputRef }) => {
  if (locked) {
    return (
      <div onClick={onUnlock} title="Notes publiées — cliquer pour modifier"
        style={{ width: 64, height: 38, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontFamily: A_MONO, fontSize: 14, fontWeight: 500, color: C.text2, background: C.sunken, borderRadius: 9, cursor: 'pointer',
          border: `1.5px solid transparent`, transition: 'background .12s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = C.hair}
        onMouseLeave={(e) => e.currentTarget.style.background = C.sunken}>
        {value === '' ? '—' : value}<Icon name="lock" size={11} color={C.text3} />
      </div>
    );
  }
  return (
    <input ref={inputRef} value={value} inputMode="decimal" placeholder="—"
      onChange={(e) => onChange(e.target.value)} onKeyDown={onKey}
      onFocus={(e) => { e.target.select(); if (!invalid) e.target.style.borderColor = C.jade; e.target.style.boxShadow = `0 0 0 3px ${invalid ? C.dangerBg : C.jadeFaint}`; }}
      onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = invalid ? C.danger : (dirty ? C.jade : 'transparent'); }}
      style={{ width: 64, height: 38, textAlign: 'center', fontFamily: A_MONO, fontSize: 14, fontWeight: 500,
        color: invalid ? C.danger : C.text1, background: invalid ? C.dangerBg : (dirty ? C.jadeFaint : C.surface2),
        border: `1.5px solid ${invalid ? C.danger : (dirty ? C.jade : 'transparent')}`, borderRadius: 9, outline: 'none', transition: 'background .12s' }} />
  );
};
window.GradeCell = GradeCell;
const numGrade = (v) => v === '' ? null : Number(v);
const isInvalidGrade = (v) => v !== '' && (isNaN(numGrade(v)) || numGrade(v) < 0 || numGrade(v) > 20);
window.isInvalidGrade = isInvalidGrade;

const GradeEntry = ({ go, subjectId, notify }) => {
  const { SUBJECTS, STUDENTS, GRADEBOOK, NF } = window.ADMIN_DATA;
  const stages = useStages();
  const subject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  const stg = stages.stage(subject.id);
  const ccLocked = ccPublished(stg);
  const nfLocked = nfPublished(stg);
  const toStr = (v) => v == null ? '' : String(v);

  const init = React.useMemo(() => STUDENTS.map((s) => ({
    idx: s.idx, name: s.name, id: s.id,
    cc: toStr(GRADEBOOK[s.idx][subject.id].cc), cf: toStr(GRADEBOOK[s.idx][subject.id].cf),
    cc0: toStr(GRADEBOOK[s.idx][subject.id].cc), cf0: toStr(GRADEBOOK[s.idx][subject.id].cf),
  })), [subject.id]);

  const [rows, setRows] = React.useState(init);
  React.useEffect(() => setRows(init), [init]);
  const [q, setQ] = React.useState('');
  const [unlocked, setUnlocked] = React.useState(() => new Set());  // keys `${idx}-cc`
  React.useEffect(() => setUnlocked(new Set()), [subject.id]);
  const refs = React.useRef({});

  const cellLocked = (idx, col) => {
    const key = `${idx}-${col}`;
    if (unlocked.has(key)) return false;
    if (nfLocked) return true;
    if (col === 'cc' && ccLocked) return true;
    return false;
  };

  const rowDirty = (r) => r.cc !== r.cc0 || r.cf !== r.cf0;
  const dirtyCount = rows.filter(rowDirty).length;
  const invalidCount = rows.filter((r) => isInvalidGrade(r.cc) || isInvalidGrade(r.cf)).length;
  const enteredCount = rows.filter((r) => r.cf !== '' && r.cc !== '').length;

  const set = (idx, col, v) => { v = v.replace(/[^0-9.]/g, ''); setRows((rs) => rs.map((r) => r.idx === idx ? { ...r, [col]: v } : r)); };
  const visible = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()));

  const onKey = (e, vIndex, col) => {
    const cols = ['cc', 'cf'];
    const move = (vi, c) => { const r = visible[vi]; if (!r) return; if (cellLocked(r.idx, cols[c])) return; const el = refs.current[`${r.idx}-${cols[c]}`]; if (el) { el.focus(); e.preventDefault(); } };
    if (e.key === 'Enter' || e.key === 'ArrowDown') move(vIndex + 1, col);
    else if (e.key === 'ArrowUp') move(vIndex - 1, col);
    else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) move(vIndex, Math.min(col + 1, 1));
    else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) move(vIndex, Math.max(col - 1, 0));
  };

  const requestUnlock = (r, col) => {
    window.AdminUI.open(<window.GradeCorrectionModal studentName={r.name} studentId={r.id} subjectName={subject.name}
      col={col} current={col === 'cc' ? r.cc : r.cf}
      onConfirm={(newVal) => {
        set(r.idx, col, newVal);
        setUnlocked((u) => new Set(u).add(`${r.idx}-${col}`));
        notify('Correction enregistrée · consignée au journal d\'audit', 'check');
      }} />);
  };

  const save = () => {
    if (invalidCount) return;
    setRows((rs) => rs.map((r) => ({ ...r, cc0: r.cc, cf0: r.cf })));
    notify(`${dirtyCount} note${dirtyCount > 1 ? 's' : ''} enregistrée${dirtyCount > 1 ? 's' : ''}`, 'check');
  };
  const reset = () => { setRows((rs) => rs.map((r) => ({ ...r, cc: r.cc0, cf: r.cf0 }))); setUnlocked(new Set()); };

  const classAvg = (() => { let w = 0, c = 0; rows.forEach((r) => { const nf = NF(numGrade(r.cc), numGrade(r.cf)); if (nf != null) { w += nf; c++; } }); return c ? w / c : null; })();

  return (
    <div style={{ paddingBottom: dirtyCount ? 76 : 0 }}>
      <window.PageHead title={subject.name} back={() => go('grades')}
        subtitle={<span><span style={{ fontFamily: A_MONO, fontSize: 12.5 }}>{subject.id}</span> · {subject.prof} · Coef. {subject.coef} · Semestre {subject.sem}</span>}
        actions={<Btn kind="ghost" icon="upload" onClick={() => window.AdminUI.open(<window.GradeImportModal subject={subject} />)} disabled={nfLocked}>Importer</Btn>} />

      {/* lock status line (UX Architecture §3.4) */}
      {(ccLocked || nfLocked) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '11px 15px', borderRadius: 12,
          background: nfLocked ? C.jadeFaint : 'rgba(47,125,209,0.08)', border: `1px solid ${nfLocked ? 'rgba(29,158,117,0.25)' : 'rgba(47,125,209,0.22)'}` }}>
          <Icon name="lock" size={16} color={nfLocked ? C.jadeText : C.blue} />
          <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2 }}>
            {nfLocked
              ? <><b style={{ color: C.text1, fontWeight: 700 }}>Résultats publiés</b> — toutes les notes sont verrouillées. Cliquez une cellule pour saisir une correction.</>
              : <><b style={{ color: C.text1, fontWeight: 700 }}>Notes CC publiées</b> — les colonnes CC sont verrouillées ; les CF restent modifiables.</>}
          </span>
        </div>
      )}

      {/* metric strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Étudiants', value: STUDENTS.length, c: C.text1 },
          { label: 'Notes saisies', value: `${enteredCount}/${STUDENTS.length}`, c: enteredCount === STUDENTS.length ? C.jadeText : C.amber },
          { label: 'Moyenne classe', value: fmt(classAvg, 2), c: C.text1 },
          { label: 'Modifications', value: dirtyCount, c: dirtyCount ? C.jade : C.text3 },
        ].map((m) => (
          <Card key={m.label} pad={14}>
            <SectionLabel>{m.label}</SectionLabel>
            <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 23, color: m.c, marginTop: 5 }}>{m.value}</div>
          </Card>
        ))}
      </div>

      <Card pad={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ width: 280 }}><Input icon="search" placeholder="Filtrer un étudiant…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>
            <Icon name="spark" size={15} color={C.text3} />
            <span><b style={{ fontWeight: 700, color: C.text1 }}>Astuce :</b> <kbd style={kbd}>Entrée</kbd> ou <kbd style={kbd}>↓</kbd> pour la ligne suivante · <kbd style={kbd}>→</kbd> vers CF</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead><tr style={{ height: 38, background: C.surface2 }}>
              <th style={{ width: 44, textAlign: 'center' }}><SectionLabel>#</SectionLabel></th>
              <th style={{ textAlign: 'left', padding: '0 14px' }}><SectionLabel>Étudiant</SectionLabel></th>
              <th style={{ width: 90, textAlign: 'center' }}><SectionLabel style={{ textAlign: 'center' }}>CC /20</SectionLabel></th>
              <th style={{ width: 90, textAlign: 'center' }}><SectionLabel style={{ textAlign: 'center' }}>CF /20</SectionLabel></th>
              <th style={{ width: 80, textAlign: 'center' }}><SectionLabel style={{ textAlign: 'center' }}>NF</SectionLabel></th>
              <th style={{ width: 140, textAlign: 'left', padding: '0 14px' }}><SectionLabel>Mention</SectionLabel></th>
            </tr></thead>
            <tbody>
              {visible.map((r, vi) => {
                const nf = NF(numGrade(r.cc), numGrade(r.cf));
                const dirty = rowDirty(r);
                const lcc = cellLocked(r.idx, 'cc'), lcf = cellLocked(r.idx, 'cf');
                return (
                  <tr key={r.idx} style={{ height: 52, borderTop: `1px solid ${C.hair}`, background: dirty ? 'rgba(29,158,117,0.03)' : 'transparent' }}>
                    <td style={{ textAlign: 'center', fontFamily: A_MONO, fontSize: 12, color: C.text3 }}>{r.idx + 1}</td>
                    <td style={{ padding: '0 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Avatar name={r.name} size={32} />
                        <div>
                          <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{r.name}</div>
                          <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <GradeCell value={r.cc} locked={lcc} invalid={isInvalidGrade(r.cc)} dirty={r.cc !== r.cc0} onChange={(v) => set(r.idx, 'cc', v)} onKey={(e) => onKey(e, vi, 0)} onUnlock={() => requestUnlock(r, 'cc')} inputRef={(el) => refs.current[`${r.idx}-cc`] = el} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <GradeCell value={r.cf} locked={lcf} invalid={isInvalidGrade(r.cf)} dirty={r.cf !== r.cf0} onChange={(v) => set(r.idx, 'cf', v)} onKey={(e) => onKey(e, vi, 1)} onUnlock={() => requestUnlock(r, 'cf')} inputRef={(el) => refs.current[`${r.idx}-cf`] = el} />
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: A_SANS, fontWeight: 700, fontSize: 14.5, color: nf == null ? C.text3 : nf < 10 ? C.danger : C.text1 }}>{fmt(nf)}</td>
                    <td style={{ padding: '0 14px' }}>{nf == null ? <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>En attente</span> : <Badge tone={gradeTone(nf)}>{mention(nf)}</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <div style={{ padding: 40, textAlign: 'center', fontFamily: A_SANS, color: C.text3 }}>Aucun étudiant.</div>}
      </Card>

      {/* sticky save bar */}
      {dirtyCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 248, right: 0, background: C.surface, borderTop: `1px solid ${C.hair2}`,
          boxShadow: '0 -6px 22px rgba(28,35,32,0.08)', padding: '13px 32px', display: 'flex', alignItems: 'center', gap: 16, zIndex: 6 }}>
          <div style={{ width: 9, height: 9, borderRadius: 999, background: invalidCount ? C.danger : C.jade }} />
          <span style={{ fontFamily: A_SANS, fontSize: 13.5, color: C.text1 }}>
            {invalidCount > 0
              ? <span style={{ color: C.danger, fontWeight: 600 }}>{invalidCount} note{invalidCount > 1 ? 's' : ''} hors barème (0–20)</span>
              : <><b style={{ fontWeight: 700 }}>{dirtyCount}</b> modification{dirtyCount > 1 ? 's' : ''} non enregistrée{dirtyCount > 1 ? 's' : ''}</>}
          </span>
          <div style={{ flex: 1 }} />
          <Btn kind="quiet" onClick={reset}>Annuler</Btn>
          <Btn kind="primary" icon="check" onClick={save} disabled={invalidCount > 0}>Tout enregistrer</Btn>
        </div>
      )}
    </div>
  );
};

const kbd = { fontFamily: window.A_MONO || 'monospace', fontSize: 11, background: '#ECF0ED', border: '1px solid rgba(28,35,32,0.13)', borderRadius: 5, padding: '1px 5px', color: '#5E6E66' };

Object.assign(window, { Grades, GradeEntry });
