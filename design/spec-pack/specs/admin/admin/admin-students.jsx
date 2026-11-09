/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel, Input, fmt, mention, gradeTone, statusMeta */
/* ============ Unipocket Admin — STUDENTS (list + detail) ============ */

const SortHead = ({ label, col, sort, setSort, align = 'left', w }) => {
  const active = sort.col === col;
  return (
    <th style={{ textAlign: align, padding: '0 14px', width: w, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => setSort({ col, dir: active && sort.dir === 'asc' ? 'desc' : 'asc' })}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span style={{ fontFamily: A_MONO, fontSize: 10.5, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: active ? C.jadeText : C.text3 }}>{label}</span>
        <Icon name={active ? (sort.dir === 'asc' ? 'chevron-d' : 'chevron') : 'sort'} size={13} color={active ? C.jadeText : C.text3} style={{ transform: active && sort.dir === 'desc' ? 'rotate(180deg)' : 'none' }} />
      </div>
    </th>
  );
};

const Students = ({ go, initialFilter }) => {
  const { STUDENTS } = window.ADMIN_DATA;
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState(initialFilter || 'all');
  const [sort, setSort] = React.useState({ col: 'name', dir: 'asc' });
  const [showFilters, setShowFilters] = React.useState(false);
  const [adv, setAdv] = React.useState({ prog: '', minGpa: 0 });

  const filters = [['all', 'Tous', STUDENTS.length], ['active', 'Actifs', STUDENTS.filter(s => s.status === 'active').length],
    ['risk', 'À risque', STUDENTS.filter(s => s.status === 'risk').length], ['suspended', 'Suspendus', STUDENTS.filter(s => s.status === 'suspended').length]];

  let rows = STUDENTS.filter((s) => (filter === 'all' || s.status === filter) &&
    s.gpa >= adv.minGpa && (!adv.prog || adv.prog === 'GINF') &&
    (s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase())));
  rows = [...rows].sort((a, b) => {
    let av = a[sort.col], bv = b[sort.col];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    const r = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === 'asc' ? r : -r;
  });

  return (
    <div>
      <window.PageHead title="Étudiants" subtitle={`${STUDENTS.length} inscrits · Génie Informatique L3`}
        actions={<>
          <Btn kind="ghost" icon="upload" onClick={() => go('students-import')}>Importer CSV</Btn>
          <Btn kind="primary" icon="plus" onClick={() => window.AdminUI.open(<window.StudentForm />)}>Nouvel étudiant</Btn>
        </>} />

      <Card pad={0}>
        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ width: 300 }}><Input icon="search" placeholder="Rechercher par nom ou matricule…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 11 }}>
            {filters.map(([id, label, n]) => (
              <div key={id} onClick={() => setFilter(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
                background: filter === id ? C.surface : 'transparent', boxShadow: filter === id ? C.shadow : 'none',
                fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: filter === id ? C.text1 : C.text2 }}>
                {label}<span style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{n}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <Btn kind={showFilters ? 'soft' : 'ghost'} icon="filter" size="sm" onClick={() => setShowFilters(!showFilters)}>Filtres</Btn>
        </div>

        {showFilters && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${C.hair}`, background: C.surface2 }}>
            <div style={{ width: 220 }}><window.FField label="Programme"><window.Dropdown value={adv.prog} onChange={(v) => setAdv({ ...adv, prog: v })} options={[['', 'Tous les programmes'], ['GINF', 'Génie Informatique'], ['GCIV', 'Génie Civil'], ['MATH', 'Mathématiques']]} /></window.FField></div>
            <div style={{ flex: 1, maxWidth: 260 }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5, color: C.text2, marginBottom: 6 }}>Moyenne minimale : <b style={{ color: C.jadeText }}>{adv.minGpa.toFixed(1)}</b></div>
              <input type="range" min="0" max="20" step="0.5" value={adv.minGpa} onChange={(e) => setAdv({ ...adv, minGpa: +e.target.value })} style={{ width: '100%', accentColor: C.jade }} />
            </div>
            <div style={{ flex: 1 }} />
            <Btn kind="quiet" size="sm" onClick={() => setAdv({ prog: '', minGpa: 0 })}>Réinitialiser</Btn>
          </div>
        )}

        {/* table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ height: 40 }}>
              <SortHead label="Étudiant" col="name" sort={sort} setSort={setSort} />
              <SortHead label="Matricule" col="id" sort={sort} setSort={setSort} w={150} />
              <SortHead label="Moyenne" col="gpa" sort={sort} setSort={setSort} align="right" w={110} />
              <SortHead label="Présence" col="presence" sort={sort} setSort={setSort} align="right" w={120} />
              <th style={{ textAlign: 'left', padding: '0 14px', width: 130 }}><SectionLabel>Statut</SectionLabel></th>
              <th style={{ width: 50 }}></th>
            </tr></thead>
            <tbody>
              {rows.map((s) => {
                const sm = statusMeta[s.status];
                return (
                  <tr key={s.id} onClick={() => go('student-detail', { id: s.idx })}
                    style={{ height: 58, borderTop: `1px solid ${C.hair}`, cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.surface2}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={s.name} size={36} />
                        <div>
                          <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 14, color: C.text1 }}>{s.name}</div>
                          <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3 }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0 14px', fontFamily: A_MONO, fontSize: 12.5, color: C.text2 }}>{s.id}</td>
                    <td style={{ padding: '0 14px', textAlign: 'right' }}>
                      <span style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: s.gpa < 10 ? C.danger : s.gpa < 12 ? C.amber : C.text1 }}>{fmt(s.gpa, 2)}</span>
                      <span style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3 }}>/20</span>
                    </td>
                    <td style={{ padding: '0 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 44, height: 6, borderRadius: 999, background: C.sunken, overflow: 'hidden' }}>
                          <div style={{ width: `${s.presence}%`, height: '100%', background: s.presence < 75 ? C.danger : s.presence < 85 ? C.amber : C.jade }} />
                        </div>
                        <span style={{ fontFamily: A_MONO, fontSize: 12, color: s.presence < 75 ? C.danger : C.text2, width: 34, textAlign: 'right' }}>{s.presence}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0 14px' }}><Badge tone={sm.tone} dot>{sm.label}</Badge></td>
                    <td style={{ textAlign: 'center', color: C.text3 }}><Icon name="chevron" size={16} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div style={{ padding: 50, textAlign: 'center', fontFamily: A_SANS, color: C.text3 }}>Aucun étudiant trouvé.</div>}
        <div style={{ padding: '13px 16px', borderTop: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>{rows.length} sur {STUDENTS.length} étudiants</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Btn kind="ghost" size="sm" disabled>Précédent</Btn>
            <span style={{ fontFamily: A_MONO, fontSize: 12, color: C.text2, padding: '0 6px' }}>1 / 1</span>
            <Btn kind="ghost" size="sm" disabled>Suivant</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ---------------- detail ---------------- */
const InfoRow = ({ icon, label, value, mono }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: `1px solid ${C.hair}` }}>
    <Icon name={icon} size={17} color={C.text3} />
    <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, flex: 1 }}>{label}</span>
    <span style={{ fontFamily: mono ? A_MONO : A_SANS, fontWeight: 600, fontSize: mono ? 12.5 : 13.5, color: C.text1 }}>{value}</span>
  </div>
);

const StudentDetail = ({ go, id }) => {
  const { STUDENTS, SUBJECTS, GRADEBOOK, NF } = window.ADMIN_DATA;
  const stages = window.useStages();
  const s = STUDENTS[id];
  const [sem, setSem] = React.useState(2);
  const sm = statusMeta[s.status];
  const subs = SUBJECTS.filter((su) => su.sem === sem);
  const toStr = (v) => v == null ? '' : String(v);

  const initGr = React.useMemo(() => {
    const m = {};
    subs.forEach((su) => { const g = GRADEBOOK[s.idx][su.id]; m[su.id] = { cc: toStr(g.cc), cf: toStr(g.cf), cc0: toStr(g.cc), cf0: toStr(g.cf) }; });
    return m;
  }, [sem, s.idx]);
  const [gr, setGr] = React.useState(initGr);
  React.useEffect(() => setGr(initGr), [initGr]);
  const [unlocked, setUnlocked] = React.useState(() => new Set());
  React.useEffect(() => setUnlocked(new Set()), [sem, s.idx]);

  const setCell = (sid, col, v) => { v = v.replace(/[^0-9.]/g, ''); setGr((m) => ({ ...m, [sid]: { ...m[sid], [col]: v } })); };
  const cellLocked = (sid, col) => {
    if (unlocked.has(`${sid}-${col}`)) return false;
    const st = stages.stage(sid);
    if (window.nfPublished(st)) return true;
    if (col === 'cc' && window.ccPublished(st)) return true;
    return false;
  };
  const requestUnlock = (su, col) => {
    const cur = gr[su.id][col];
    window.AdminUI.open(<window.GradeCorrectionModal studentName={s.name} studentId={s.id} subjectName={su.name}
      col={col} current={cur === '' ? '—' : cur}
      onConfirm={(nv) => { setCell(su.id, col, nv); setUnlocked((u) => new Set(u).add(`${su.id}-${col}`)); window.__notify('Correction enregistrée · consignée au journal d\'audit', 'check'); }} />);
  };

  const semGrades = subs.map((su) => { const c = gr[su.id] || {}; const nf = NF(c.cc === '' ? null : Number(c.cc), c.cf === '' ? null : Number(c.cf)); return { ...su, cc: c.cc, cf: c.cf, nf }; });
  let wsum = 0, csum = 0; semGrades.forEach((g) => { if (g.nf != null) { wsum += g.nf * g.coef; csum += g.coef; } });
  const semGpa = csum ? wsum / csum : null;
  const dirtyN = subs.filter((su) => { const c = gr[su.id]; return c && (c.cc !== c.cc0 || c.cf !== c.cf0); }).length;
  const invalidN = subs.filter((su) => { const c = gr[su.id]; return c && (window.isInvalidGrade(c.cc) || window.isInvalidGrade(c.cf)); }).length;
  const saveNotes = () => { if (invalidN) return; setGr((m) => { const n = { ...m }; subs.forEach((su) => { n[su.id] = { ...n[su.id], cc0: n[su.id].cc, cf0: n[su.id].cf }; }); return n; }); window.__notify(`Notes de ${s.name.split(' ')[0]} enregistrées`, 'check'); };

  return (
    <div>
      <window.PageHead title={s.name} back={() => go('students')}
        subtitle={<span style={{ fontFamily: A_MONO, fontSize: 13 }}>{s.id}</span>}
        actions={<>
          <Btn kind="ghost" icon="reset" onClick={() => window.AdminUI.open(<window.ResetPwModal student={s} />)}>Réinitialiser mot de passe</Btn>
          <Btn kind="ghost" icon="edit" onClick={() => window.AdminUI.open(<window.StudentForm edit student={s} />)}>Modifier</Btn>
          <window.Menu items={[
            { icon: 'warn', label: 'Suspendre', onClick: () => window.AdminUI.open(<window.StatusModal student={s} action="suspend" />) },
            { icon: 'grad', label: 'Marquer diplômé', onClick: () => window.AdminUI.open(<window.StatusModal student={s} action="graduate" />) },
            { divider: true },
            { icon: 'reset', label: 'Réactiver', onClick: () => window.AdminUI.open(<window.StatusModal student={s} action="reactivate" />) },
          ]} triggerIcon="more" />
        </>} />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        {/* left: profile */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: 8 }}>
            <Avatar name={s.name} size={76} ring />
            <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 19, color: C.text1, marginTop: 14, letterSpacing: '-0.01em' }}>{s.name}</div>
            <div style={{ fontFamily: A_SANS, fontSize: 13, color: C.text2, marginTop: 3 }}>{s.programme} · {s.year}</div>
            <div style={{ marginTop: 12 }}><Badge tone={sm.tone} dot soft>{sm.label}</Badge></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' }}>
            <div style={{ background: C.surface2, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: s.gpa < 10 ? C.danger : C.jadeText }}>{fmt(s.gpa, 2)}</div>
              <SectionLabel style={{ marginTop: 3 }}>Moyenne /20</SectionLabel>
            </div>
            <div style={{ background: C.surface2, borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 22, color: s.presence < 75 ? C.danger : C.text1 }}>{s.presence}%</div>
              <SectionLabel style={{ marginTop: 3 }}>Présence</SectionLabel>
            </div>
          </div>
          <InfoRow icon="mail" label="Email" value={s.email} />
          <InfoRow icon="phone" label="Téléphone" value={s.phone} mono />
          <InfoRow icon="book" label="Faculté" value={s.faculty} />
          <InfoRow icon="grad" label="Crédits" value={`${s.credits} / 32`} />
        </Card>

        {/* right: transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad={0}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}>
              <div>
                <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Relevé de notes</div>
                <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>Moyenne du semestre : <b style={{ color: semGpa != null && semGpa < 10 ? C.danger : C.jadeText }}>{fmt(semGpa, 2)}</b> · <span style={{ color: C.text3 }}>cliquez une note pour la modifier</span></div>
              </div>
              <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 10 }}>
                {[1, 2].map((n) => (
                  <div key={n} onClick={() => setSem(n)} style={{ padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5,
                    background: sem === n ? C.surface : 'transparent', boxShadow: sem === n ? C.shadow : 'none', color: sem === n ? C.text1 : C.text2 }}>Semestre {n}</div>
                ))}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ height: 36, background: C.surface2 }}>
                <th style={{ textAlign: 'left', padding: '0 18px' }}><SectionLabel>Matière</SectionLabel></th>
                {['CC', 'CF', 'Coef', 'NF', 'Mention'].map((h, i) => <th key={h} style={{ textAlign: i < 4 ? 'center' : 'right', padding: '0 14px', width: i === 4 ? 130 : 78 }}><SectionLabel style={{ textAlign: i < 4 ? 'center' : 'right' }}>{h}</SectionLabel></th>)}
              </tr></thead>
              <tbody>
                {semGrades.map((g) => (
                  <tr key={g.id} style={{ height: 52, borderTop: `1px solid ${C.hair}` }}>
                    <td style={{ padding: '0 18px' }}>
                      <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>{g.name}</div>
                      <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{g.id}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <window.GradeCell value={g.cc} locked={cellLocked(g.id, 'cc')} invalid={window.isInvalidGrade(g.cc)} dirty={gr[g.id] && g.cc !== gr[g.id].cc0} onChange={(v) => setCell(g.id, 'cc', v)} onKey={() => {}} onUnlock={() => requestUnlock(g, 'cc')} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <window.GradeCell value={g.cf} locked={cellLocked(g.id, 'cf')} invalid={window.isInvalidGrade(g.cf)} dirty={gr[g.id] && g.cf !== gr[g.id].cf0} onChange={(v) => setCell(g.id, 'cf', v)} onKey={() => {}} onUnlock={() => requestUnlock(g, 'cf')} />
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: A_MONO, fontSize: 13, color: C.text3 }}>{g.coef}</td>
                    <td style={{ textAlign: 'center', fontFamily: A_SANS, fontWeight: 700, fontSize: 14, color: g.nf == null ? C.text3 : g.nf < 10 ? C.danger : C.text1 }}>{fmt(g.nf)}</td>
                    <td style={{ textAlign: 'right', padding: '0 14px' }}><Badge tone={gradeTone(g.nf)}>{mention(g.nf)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dirtyN > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderTop: `1px solid ${C.hair2}`, background: C.surface2, borderRadius: '0 0 16px 16px' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: invalidN ? C.danger : C.jade }} />
                <span style={{ fontFamily: A_SANS, fontSize: 13, color: C.text1 }}>
                  {invalidN ? <span style={{ color: C.danger, fontWeight: 600 }}>{invalidN} note hors barème (0–20)</span> : <><b style={{ fontWeight: 700 }}>{dirtyN}</b> note{dirtyN > 1 ? 's' : ''} modifiée{dirtyN > 1 ? 's' : ''}</>}
                </span>
                <div style={{ flex: 1 }} />
                <Btn kind="quiet" size="sm" onClick={() => { setGr(initGr); setUnlocked(new Set()); }}>Annuler</Btn>
                <Btn kind="primary" size="sm" icon="check" disabled={invalidN > 0} onClick={saveNotes}>Enregistrer</Btn>
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Assiduité par matière</div>
              <span style={{ fontFamily: A_SANS, fontSize: 12.5, fontWeight: 600, color: C.jadeText, cursor: 'pointer' }} onClick={() => go('attendance')}>Présence →</span>
            </div>
            {window.ADMIN_DATA.ATT_SUBJECTS.map((a, i) => {
              const pct = i === 0 ? 95 : i === 1 ? 80 : i === 2 ? 72 : 100;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderTop: `1px solid ${C.hair}` }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1, flex: 1 }}>{a.name}</span>
                  <div style={{ width: 160, height: 7, borderRadius: 999, background: C.sunken, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct < 75 ? C.danger : pct < 85 ? C.amber : C.jade }} />
                  </div>
                  <span style={{ fontFamily: A_MONO, fontSize: 12.5, fontWeight: 500, color: pct < 75 ? C.danger : C.text2, width: 38, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Students, StudentDetail });
