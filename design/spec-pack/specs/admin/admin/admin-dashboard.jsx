/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, Avatar, SectionLabel, fmt, statusMeta */
/* ============ Unipocket Admin — DASHBOARD ============ */

const StatCard = ({ icon, tone, label, value, unit, sub, trend }) => {
  const toneC = { jade: C.jade, blue: C.blue, amber: C.amber, exam: C.exam, danger: C.danger }[tone] || C.jade;
  const toneBg = { jade: C.jadeFaint, blue: C.blueBg, amber: C.amberBg, exam: C.examBg, danger: C.dangerBg }[tone] || C.jadeFaint;
  return (
    <Card pad={18}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: toneBg, color: toneC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} />
        </div>
        {trend && <Badge tone={trend.up ? 'jade' : 'danger'} dot>{trend.text}</Badge>}
      </div>
      <SectionLabel style={{ marginBottom: 8 }}>{label}</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 30, color: C.text1, letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 15, color: C.text3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
};

const BarChart = ({ data, max, color = C.jade, height = 130, valueFmt }) => {
  const mx = max || Math.max(...data.map((d) => d.count != null ? d.count : d.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const v = d.count != null ? d.count : d.v;
        const hpct = mx ? (v / mx) * 100 : 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: A_MONO, fontSize: 11.5, fontWeight: 500, color: C.text2 }}>{valueFmt ? valueFmt(v) : v}</span>
            <div style={{ width: '100%', maxWidth: 38, borderRadius: '6px 6px 3px 3px', background: d.hot ? C.danger : color,
              height: `${Math.max(hpct, 3)}%`, transition: 'height .4s', opacity: d.dim ? 0.4 : 1 }} />
            <span style={{ fontFamily: A_SANS, fontSize: 11.5, fontWeight: 600, color: C.text3, whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const Sparkline = ({ data, color = C.jade, w = 100, h = 38 }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
    return [x, y];
  });
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity="0.10" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
};

const actIcon = { grade: ['grad', 'jade'], news: ['mega', 'exam'], attendance: ['check-cal', 'amber'], student: ['users', 'blue'], notif: ['bell', 'slate'] };

const Dashboard = ({ go }) => {
  const D = window.ADMIN_DATA.DASHBOARD;
  const atRiskStudents = window.ADMIN_DATA.STUDENTS.filter((s) => s.status === 'risk').slice(0, 5);
  const ACT = window.ADMIN_DATA.ACTIVITY;
  return (
    <div>
      <window.PageHead title="Tableau de bord" subtitle="Génie Informatique · L3 — Semestre 2, 2025–2026"
        actions={<>
          <Btn kind="ghost" icon="download" size="md" onClick={() => window.AdminUI.soon('Export disponible prochainement')}>Exporter</Btn>
          <Btn kind="primary" icon="send" size="md" onClick={() => go('notifications')}>Notifier</Btn>
        </>} />

      {/* stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatCard icon="users" tone="jade" label="Étudiants inscrits" value={D.totalStudents} sub={`${D.atRisk} à risque · 1 suspendu`} />
        <StatCard icon="check-cal" tone="blue" label="Présence moyenne" value={D.avgPresence} unit="%" sub="Seuil d'assiduité : 75 %" trend={{ up: true, text: '+2 pts' }} />
        <StatCard icon="grad" tone="amber" label="Moyenne générale" value={fmt(D.avgGpa, 1)} unit="/20" sub="Assez Bien · S2 en cours" />
        <StatCard icon="warn" tone="danger" label="Justificatifs en attente" value={D.pendingJust} sub="À traiter cette semaine" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* GPA distribution */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Répartition des moyennes</div>
              <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2 }}>Nombre d'étudiants par tranche de note</div>
            </div>
            <Badge tone="slate">{D.totalStudents} étudiants</Badge>
          </div>
          <BarChart data={D.gpaDist.map((b) => ({ ...b, hot: b.label === '<10' }))} height={150} />
        </Card>
        {/* presence trend */}
        <Card>
          <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Tendance de présence</div>
          <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text2, marginTop: 2, marginBottom: 18 }}>8 dernières semaines</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ fontFamily: A_SANS, fontWeight: 800, fontSize: 32, color: C.text1, letterSpacing: '-0.02em' }}>{D.avgPresence}%</span>
            <Badge tone="jade" dot>+2 pts vs S1</Badge>
          </div>
          <div style={{ background: C.surface2, borderRadius: 12, padding: '14px 14px 10px' }}>
            <Sparkline data={D.presenceTrend} w={260} h={70} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: A_MONO, fontSize: 10, color: C.text3 }}>
              <span>S1</span><span>S8</span>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16 }}>
        {/* activity */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Activité récente</div>
            <span style={{ fontFamily: A_SANS, fontSize: 12.5, fontWeight: 600, color: C.jadeText, cursor: 'pointer' }} onClick={() => go('audit')}>Journal complet →</span>
          </div>
          <div>
            {ACT.map((a, i) => {
              const [ic, tn] = actIcon[a.kind] || ['dot', 'slate'];
              const tnC = { jade: C.jade, exam: C.exam, amber: C.amber, blue: C.blue, slate: C.slate }[tn];
              const tnBg = { jade: C.jadeFaint, exam: C.examBg, amber: C.amberBg, blue: C.blueBg, slate: C.slateBg }[tn];
              return (
                <div key={i} onClick={() => go({ grade: 'grades', news: 'news', attendance: 'attendance', student: 'students', notif: 'notifications' }[a.kind] || 'dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 0', borderTop: i ? `1px solid ${C.hair}` : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: tnBg, color: tnC, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={ic} size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: A_SANS, fontSize: 13.5, color: C.text1, lineHeight: 1.4 }}>
                      <b style={{ fontWeight: 700 }}>{a.who}</b> {a.action} <b style={{ fontWeight: 700 }}>{a.target}</b>
                    </div>
                  </div>
                  <span style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3, whiteSpace: 'nowrap' }}>{a.when}</span>
                </div>
              );
            })}
          </div>
        </Card>
        {/* at-risk */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15.5, color: C.text1 }}>Étudiants à risque</div>
            <Badge tone="danger" dot>{D.atRisk}</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {atRiskStudents.map((s) => (
              <div key={s.id} onClick={() => go('student-detail', { id: s.idx })}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px', borderRadius: 10, cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.surface2}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <Avatar name={s.name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontFamily: A_MONO, fontSize: 10.5, color: C.text3 }}>{s.id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 13.5, color: s.gpa < 10 ? C.danger : C.amber }}>{fmt(s.gpa, 1)}</div>
                  <div style={{ fontFamily: A_MONO, fontSize: 10, color: C.text3 }}>{s.presence}% prés.</div>
                </div>
              </div>
            ))}
          </div>
          <Btn kind="ghost" size="sm" style={{ width: '100%', marginTop: 12 }} onClick={() => go('students', { filter: 'risk' })}>Voir tous les étudiants à risque</Btn>
        </Card>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard, StatCard, BarChart, Sparkline });
