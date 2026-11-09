/* global React */
/* ============ UDJ — DETAIL SCREENS: Account, Storage, Info Center ============ */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  Scaffold, TileGroup, TileRow, InsetLabel, InsetGroup, InsetRow, Chevron, CatIcon, Avatar,
} = window;

/* ---------- Account Info ---------- */
const AccountScreen = ({ nav }) => {
  const { T, S } = useUDJ(); const font = useFont();
  return (
    <Scaffold title={S.accountInfo} onBack={() => nav.pop()} big={false}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0 18px' }}>
        <Avatar size={84} ring/>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 19, color: T.text1, marginTop: 14 }}>{S.fullName}</div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: T.text2, marginTop: 4 }}>{S.studentId}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, background: T.jadeFaint, borderRadius: 9999, padding: '5px 12px' }}>
          <div style={{ width: 6, height: 6, borderRadius: 9, background: T.jade }}/>
          <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12, color: T.jadeText }}>{S.online}</span>
        </div>
      </div>
      <TileGroup title={S.details}>
        <TileRow icon="user" tint={T.jadeText} tintBg={T.jadeFaint} label={S.acFiliere} value={S.filiere}/>
        <TileRow icon="info" tint={T.blue} tintBg={T.blueBg} label={S.acFaculte} value={S.faculte}/>
        <TileRow icon="cal" tint={T.amber} tintBg={T.amberBg} label={S.acAnnee} value={S.annee}/>
        <TileRow icon="mail" tint={T.exam} tintBg={T.examBg} label={S.acEmail} value={S.email}/>
        <TileRow icon="phone" tint={T.slate} tintBg={T.slateBg} label={S.acPhone} value={S.phone} mono last/>
      </TileGroup>
      <div style={{ height: 8 }}/>
    </Scaffold>
  );
};

/* ---------- Storage Detail ---------- */
const Ring = ({ pct, color, size = 132 }) => {
  const { T } = useUDJ();
  const r = (size - 16) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.hair2} strokeWidth="11"/>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`}/>
    </svg>
  );
};
const StorageScreen = ({ nav }) => {
  const { T, S } = useUDJ(); const font = useFont();
  const cats = [
    { icon: 'cal', tint: T.blue, tintBg: T.blueBg, label: S.catCourses, size: '4.8 MB' },
    { icon: 'sync', tint: T.amber, tintBg: T.amberBg, label: S.catPresence, size: '1.7 MB' },
    { icon: 'news', tint: T.danger, tintBg: T.dangerBg, label: S.catNews, size: '2.4 MB' },
    { icon: 'doc', tint: T.exam, tintBg: T.examBg, label: S.catGrades, size: '3.1 MB' },
    { icon: 'user', tint: T.jadeText, tintBg: T.jadeFaint, label: S.catProfile, size: '0.4 MB' },
  ];
  return (
    <Scaffold title={S.storageTitle} onBack={() => nav.pop()} big={false}>
      {/* total card */}
      <div style={{ margin: '4px 16px 8px', background: T.surface, borderRadius: 20, padding: '20px 18px', display: 'flex',
        alignItems: 'center', gap: 18, boxShadow: T.cardShadow }}>
        <div style={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
          <Ring pct={0.62} color={T.jade}/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 22, color: T.text1 }}>12.4</div>
            <div style={{ fontFamily: font, fontSize: 12, color: T.text3 }}>MB</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: T.text1 }}>{S.storageTotal}</div>
          <div style={{ fontFamily: font, fontSize: 13, color: T.text2, marginTop: 6, lineHeight: 1.45 }}>{S.storageNote}</div>
        </div>
      </div>
      <TileGroup title={S.storageManage}>
        {cats.map((c, i) => (
          <TileRow key={i} icon={c.icon} tint={c.tint} tintBg={c.tintBg} label={c.label} value={c.size} mono last={i === cats.length - 1}/>
        ))}
      </TileGroup>
      <div style={{ margin: '2px 16px 0' }}>
        <button onClick={() => {}} style={{ width: '100%', height: 50, borderRadius: 14, border: `1px solid ${T.dangerBg}`,
          background: T.dangerBg, color: T.danger, fontFamily: font, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{S.clearCache}</button>
      </div>
      <div style={{ height: 8 }}/>
    </Scaffold>
  );
};

/* ---------- Info Center ---------- */
const FaqRow = ({ q, open }) => {
  const { T } = useUDJ(); const font = useFont();
  const [o, setO] = React.useState(open);
  return (
    <div onClick={() => setO(v => !v)} style={{ padding: '14px 16px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontFamily: font, fontWeight: 600, fontSize: 14.5, color: T.text1 }}>{q}</span>
        <div style={{ transform: o ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}><Chevron/></div>
      </div>
      {o && <div style={{ fontFamily: font, fontSize: 13, color: T.text2, marginTop: 8, lineHeight: 1.5 }}>
        Rendez-vous sur l'écran de connexion et touchez « Mot de passe oublié ». Un lien sera envoyé à votre e-mail universitaire.
      </div>}
    </div>
  );
};
const InfoScreen = ({ nav }) => {
  const { T, S } = useUDJ(); const font = useFont();
  return (
    <Scaffold title={S.infoTitle} onBack={() => nav.pop()} big={false}>
      <TileGroup title={S.infoContacts}>
        <TileRow icon="info" tint={T.jadeText} tintBg={T.jadeFaint} label={S.ctScolarite} value={S.ctScolariteV} chevron/>
        <TileRow icon="doc" tint={T.blue} tintBg={T.blueBg} label={S.ctBib} value={S.ctBibV} chevron last/>
      </TileGroup>
      <InsetLabel>{S.infoFaq}</InsetLabel>
      <InsetGroup>
        <FaqRow q={S.faq1} open/>
        <FaqRow q={S.faq2}/>
        <FaqRow q={S.faq3}/>
      </InsetGroup>
      <TileGroup title={S.infoDocs}>
        <TileRow icon="doc" tint={T.exam} tintBg={T.examBg} label={S.doc1} chevron/>
        <TileRow icon="doc" tint={T.exam} tintBg={T.examBg} label={S.doc2} chevron last/>
      </TileGroup>
      <div style={{ height: 8 }}/>
    </Scaffold>
  );
};

Object.assign(window, { AccountScreen, StorageScreen, InfoScreen });
