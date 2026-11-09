/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, SectionLabel */
/* ============ Unipocket Admin — EMPLOI DU TEMPS ============ */
/* UX Architecture §5: three view modes (programme / salle / enseignant),
   read-only cross-programme views with conflict detection. */

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const overlaps = (a, b) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

const Schedule = ({ go, notify }) => {
  const { SCHEDULE, ALL_SCHEDULE, DAYS, COURSE, PROGRAMMES } = window.ADMIN_DATA2;
  const scope = window.useScope();
  const mode = scope.scheduleMode;
  const HOUR0 = 8, HOUR1 = 16, PXH = 64;
  const hours = []; for (let h = HOUR0; h <= HOUR1; h++) hours.push(h);

  const programme = PROGRAMMES.find((p) => p.id === scope.programmeId);
  const readOnly = mode !== 'programme';

  // build the entry list for the active view
  let entries = [];
  if (mode === 'programme') {
    entries = scope.programmeId === 'GINF' ? SCHEDULE.map((s) => ({ ...s, programme: 'Génie Info. L3' })) : [];
  } else if (mode === 'room') {
    entries = ALL_SCHEDULE.filter((e) => e.room === scope.room);
  } else {
    entries = ALL_SCHEDULE.filter((e) => e.prof === scope.teacher);
  }

  // conflict flags (read-only views): overlapping blocks in the same room/teacher
  const conflictIdx = new Set();
  if (readOnly) {
    for (let i = 0; i < entries.length; i++)
      for (let j = i + 1; j < entries.length; j++)
        if (overlaps(entries[i], entries[j])) { conflictIdx.add(i); conflictIdx.add(j); }
  }

  const modes = [['programme', 'Par programme', 'grad'], ['room', 'Par salle', 'pin'], ['teacher', 'Par enseignant', 'users']];
  const setMode = (m) => window.AdminScope.set({ scheduleMode: m });

  const subtitleMap = {
    programme: programme ? `${programme.name}${scope.programmeId === 'GINF' ? ' L3' : ''} · Semestre 2` : 'Sélectionnez un programme',
    room: `Salle ${scope.room} · toutes les filières`,
    teacher: `${scope.teacher} · toutes les filières`,
  };

  const emptyProg = mode === 'programme' && scope.programmeId !== 'GINF';

  return (
    <div>
      <window.PageHead title="Emploi du temps" subtitle={subtitleMap[mode]}
        actions={<>
          <Btn kind="ghost" icon="download" onClick={() => window.AdminUI.soon('Export disponible prochainement')}>Exporter</Btn>
          {!readOnly && <Btn kind="primary" icon="plus" disabled={emptyProg || !scope.programmeId} onClick={() => window.AdminUI.open(<window.ScheduleForm />)}>Nouvelle séance</Btn>}
        </>} />

      {/* segmented control (UX Architecture §5.1) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 11 }}>
          {modes.map(([id, label, icon]) => (
            <div key={id} onClick={() => setMode(id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 13,
              background: mode === id ? C.surface : 'transparent', boxShadow: mode === id ? C.shadow : 'none', color: mode === id ? C.text1 : C.text2 }}>
              <Icon name={icon} size={15} color={mode === id ? C.jadeText : C.text3} /> {label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {readOnly && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: A_SANS, fontSize: 12.5, color: C.text2, background: C.blueBg, padding: '7px 12px', borderRadius: 9 }}>
            <Icon name="eye" size={15} color={C.blue} /> Lecture seule
            {conflictIdx.size > 0 && <span style={{ marginLeft: 6, color: C.danger, fontWeight: 700 }}>· {conflictIdx.size / 2} conflit{conflictIdx.size > 2 ? 's' : ''}</span>}
          </div>
        )}
        {!readOnly && !emptyProg && scope.programmeId && <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2 }}>{entries.length} séances · 11 h hebdo</span>}
      </div>

      {(!scope.programmeId && mode === 'programme') ? (
        <Card style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: C.jadeFaint, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Icon name="cal" size={28} /></div>
          <div style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 19, color: C.text1 }}>Sélectionnez un programme</div>
          <div style={{ fontFamily: A_SANS, fontSize: 14, color: C.text2, marginTop: 8 }}>Choisissez un programme dans le périmètre pour afficher et modifier sa semaine type.</div>
        </Card>
      ) : (
        <Card pad={0} style={{ overflow: 'hidden', position: 'relative' }}>
          {/* day header */}
          <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)`, borderBottom: `1px solid ${C.hair}` }}>
            <div />
            {DAYS.map((d, i) => (
              <div key={d} style={{ padding: '14px 0', textAlign: 'center', borderLeft: `1px solid ${C.hair}` }}>
                <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13.5, color: C.text1 }}>{d}</div>
                <div style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3, marginTop: 1 }}>{entries.filter((s) => s.day === i).length} cours</div>
              </div>
            ))}
          </div>
          {/* grid body */}
          <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${DAYS.length}, 1fr)`, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              {hours.map((h) => (
                <div key={h} style={{ height: PXH, position: 'relative' }}>
                  <span style={{ position: 'absolute', top: -7, right: 10, fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            {DAYS.map((d, di) => (
              <div key={d} style={{ position: 'relative', borderLeft: `1px solid ${C.hair}` }}>
                {hours.map((h) => <div key={h} style={{ height: PXH, borderBottom: `1px solid ${C.hair}` }} />)}
                {entries.map((s, gi) => s.day !== di ? null : (() => {
                  const top = (toMin(s.start) - HOUR0 * 60) / 60 * PXH;
                  const height = (toMin(s.end) - toMin(s.start)) / 60 * PXH;
                  const col = COURSE[s.c % COURSE.length];
                  const conflict = conflictIdx.has(gi);
                  const meta = mode === 'room' ? s.programme : mode === 'teacher' ? s.room + ' · ' + s.programme : s.room + ' · ' + s.prof;
                  return (
                    <div key={gi} title={`${s.name} · ${s.room}`}
                      onClick={() => readOnly
                        ? window.AdminUI.open(<window.ScheduleForm edit entry={{ ...s, subjectId: s.subjectId || '' }} />)
                        : window.AdminUI.open(<window.ScheduleForm edit entry={s} />)}
                      style={{ position: 'absolute', top: top + 3, left: 5, right: 5, height: height - 6,
                        background: conflict ? 'rgba(225,72,61,0.10)' : col + '14',
                        borderLeft: `3px solid ${conflict ? C.danger : col}`,
                        border: conflict ? `1.5px dashed ${C.danger}` : undefined,
                        borderRadius: 8, padding: '7px 9px', overflow: 'hidden', cursor: 'pointer', transition: 'transform .12s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                      {conflict && (
                        <div style={{ position: 'absolute', top: 5, right: 5, display: 'inline-flex', alignItems: 'center', gap: 3, background: C.danger, color: '#fff', fontFamily: A_SANS, fontWeight: 700, fontSize: 9.5, padding: '2px 6px', borderRadius: 999 }}>
                          <Icon name="warn" size={10} color="#fff" /> Conflit
                        </div>
                      )}
                      <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 12, color: C.text1, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: conflict ? 48 : 0 }}>{s.name}</div>
                      <div style={{ fontFamily: A_MONO, fontSize: 10, color: conflict ? C.danger : col, marginTop: 2 }}>{s.start}–{s.end}</div>
                      {height > 56 && <div style={{ fontFamily: A_SANS, fontSize: 11, color: C.text2, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>}
                    </div>
                  );
                })())}
              </div>
            ))}
          </div>
          {emptyProg && (
            <div style={{ position: 'absolute', inset: 0, top: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', fontFamily: A_SANS, color: C.text3, fontSize: 14 }}>
              Aucun emploi du temps saisi pour ce programme.
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

Object.assign(window, { Schedule });
