/* global React */
/* ============ UDJ — NEWS (Actualités / الأخبار) ============ */
/* Pinned header + filter row · image hero · Soft Elevated article cards · pushed detail screen. */
const {
  useUDJ, useFont, UDJ_SANS: SANS, UDJ_MONO: MONO,
  StatusBar, NavBar, CatIcon, Back, newsColor,
} = window;

/* bookmark glyph (fill toggles) */
const Bookmark = ({ saved, color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={saved ? color : 'none'} stroke={color} strokeWidth="1.9" strokeLinejoin="round">
    <path d="M6 4h12v17l-6-4-6 4Z"/>
  </svg>
);

/* ---------- filter chip ---------- */
const FilterChip = ({ label, active, onPress }) => {
  const { T } = useUDJ(); const font = useFont();
  return (
    <div onClick={onPress} style={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: 9999, cursor: 'pointer',
      background: active ? T.jade : T.surface, border: active ? '1px solid transparent' : `1px solid ${T.hair2}` }}>
      <span style={{ fontFamily: font, fontWeight: active ? 700 : 600, fontSize: 14, color: active ? '#fff' : T.text2, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
};

/* ---------- hero card (urgent feature) ---------- */
const HeroCard = ({ item, urgentLabel, catLabel, onPress }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const c = newsColor(T, item.cat);
  return (
    <div onClick={onPress} style={{ background: T.surface, borderRadius: 18, boxShadow: T.cardShadow, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ position: 'relative', height: 168, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CatIcon kind="image" color={T.text3} size={26}/>
        <div style={{ position: 'absolute', top: 12, insetInlineStart: 12, display: 'inline-flex', alignItems: 'center', gap: 7,
          background: item.urgent ? T.dangerBg : c.bg, borderRadius: 9999, padding: '6px 12px' }}>
          {item.urgent && <span style={{ width: 8, height: 8, borderRadius: 9999, background: T.danger }}/>}
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, color: item.urgent ? T.danger : c.fg }}>{item.urgent ? urgentLabel : catLabel}</span>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 17, color: T.text1, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</div>
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 13, color: T.text3, marginTop: 8 }}>{item.time} · {item.read}</div>
      </div>
    </div>
  );
};

/* ---------- article card ---------- */
const ArticleCard = ({ item, saved, catLabel, onPress, onBookmark }) => {
  const { T } = useUDJ(); const font = useFont();
  const c = newsColor(T, item.cat);
  return (
    <div onClick={onPress} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: T.surface, borderRadius: 18, boxShadow: T.cardShadow, padding: 14, cursor: 'pointer' }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: T.surface2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CatIcon kind="image" color={T.text3} size={20}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: font, fontWeight: 600, fontSize: 12, color: c.fg, background: c.bg, borderRadius: 9999, padding: '4px 10px' }}>{catLabel}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {item.unread && <span style={{ width: 8, height: 8, borderRadius: 9999, background: T.jade }}/>}
            <span style={{ fontFamily: font, fontWeight: 500, fontSize: 13, color: T.text3, whiteSpace: 'nowrap' }}>{item.time}</span>
          </span>
        </div>
        <div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.text1, lineHeight: 1.3, marginTop: 6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: font, fontWeight: 500, fontSize: 13, color: T.text3 }}>{item.read}</span>
          <div onClick={(e) => { e.stopPropagation(); onBookmark(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, marginInlineEnd: -4, cursor: 'pointer' }}>
            <Bookmark saved={saved} color={saved ? T.jade : T.text3}/>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- detail screen ---------- */
const NewsArticleScreen = ({ item, saved, catLabel, shareLabel, onBack, onBookmark }) => {
  const { T, rtl } = useUDJ(); const font = useFont();
  const c = newsColor(T, item.cat);
  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, direction: rtl ? 'rtl' : 'ltr', zIndex: 30, animation: 'udjPop .18s ease' }}>
      <StatusBar/>
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, bottom: 84, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ position: 'relative', height: 280, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CatIcon kind="image" color={T.text3} size={34}/>
          <div style={{ position: 'absolute', bottom: 16, insetInlineStart: 20, background: 'rgba(0,0,0,0.28)', borderRadius: 9999, padding: '7px 14px' }}>
            <span style={{ fontFamily: font, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.4, textTransform: 'uppercase', color: '#fff' }}>{item.org}</span>
          </div>
        </div>
        <div style={{ padding: '18px 20px 0' }}>
          <span style={{ display: 'inline-block', fontFamily: font, fontWeight: 600, fontSize: 12, color: c.fg, background: c.bg, borderRadius: 9999, padding: '4px 10px' }}>{catLabel}</span>
          <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 13, color: T.text3, marginTop: 12, direction: rtl ? 'rtl' : 'ltr' }}>{item.date}</div>
          <div style={{ fontFamily: font, fontWeight: 800, fontSize: 24, letterSpacing: rtl ? 0 : -0.4, color: T.text1, marginTop: 8, lineHeight: 1.25 }}>{item.title}</div>
          <div style={{ fontFamily: font, fontWeight: 500, fontSize: 15, color: T.text2, marginTop: 6 }}>{item.source}</div>
          <div style={{ height: 1, background: T.hair, margin: '16px 0' }}/>
          <div style={{ fontFamily: font, fontWeight: 400, fontSize: 16, color: T.text1, lineHeight: 1.6 }}>{item.body}</div>
        </div>
      </div>
      {/* back button over hero */}
      <div onClick={onBack} style={{ position: 'absolute', top: 56, insetInlineStart: 14, width: 38, height: 38, borderRadius: 9999,
        background: T.surface, boxShadow: T.cardShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}>
        <Back/>
      </div>
      {/* action bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, background: T.surface, borderTop: `1px solid ${T.hair}`,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', paddingBottom: 14, direction: rtl ? 'rtl' : 'ltr' }}>
        <div onClick={onBookmark} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Bookmark saved={saved} color={saved ? T.jade : T.text2} size={22}/>
        </div>
        <button onClick={onBack} style={{ flex: 1, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer', background: T.jade,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CatIcon kind="share" color="#fff" size={18}/>
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 15, color: '#fff' }}>{shareLabel}</span>
        </button>
      </div>
    </div>
  );
};

/* ---------- screen ---------- */
const NewsScreen = ({ nav }) => {
  const { T, S, rtl } = useUDJ(); const font = useFont();
  const N = S.news;
  const [filter, setFilter] = React.useState('all');
  const [scrolled, setScrolled] = React.useState(false);
  const [saved, setSaved] = React.useState({});
  const [read, setRead] = React.useState({});
  const [article, setArticle] = React.useState(null);
  React.useEffect(() => { setArticle(null); }, [rtl]);
  const catLabel = (cat) => N.catLabels[cat] || N.catLabels.general;
  const toggleSave = (id) => setSaved((s) => ({ ...s, [id]: !s[id] }));
  const open = (item) => { setRead((r) => ({ ...r, [item.id]: true })); setArticle(item); };

  if (article) {
    const it = { ...article, unread: false };
    return <NewsArticleScreen item={it} saved={!!saved[article.id]} catLabel={catLabel(article.cat)} shareLabel={N.share}
      onBack={() => setArticle(null)} onBookmark={() => toggleSave(article.id)}/>;
  }

  const list = N.items.filter((it) => filter === 'all' || it.cat === filter);
  const hero = filter === 'all' ? N.items.find((it) => it.urgent) : null;
  const cards = list.filter((it) => !(hero && it.id === hero.id));

  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', direction: rtl ? 'rtl' : 'ltr' }}>
      <StatusBar/>
      <div style={{ flexShrink: 0, background: T.bg, zIndex: 5, position: 'relative', paddingBottom: 8,
        boxShadow: scrolled ? (T.mode === 'dark' ? 'none' : T.cardShadow) : 'none',
        borderBottom: scrolled && T.mode === 'dark' ? `1px solid ${T.hair}` : '1px solid transparent', transition: 'box-shadow .2s' }}>
        <div style={{ padding: '2px 20px 12px' }}>
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: rtl ? 26 : 24, letterSpacing: rtl ? 0 : -0.5, color: T.text1 }}>{N.title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', height: 44 }}>
          {N.filters.map(([key, label]) => <FilterChip key={key} label={label} active={filter === key} onPress={() => setFilter(key)}/>)}
        </div>
      </div>
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 16px', paddingBottom: 92 }}>
        {hero && <div style={{ marginBottom: 12 }}><HeroCard item={hero} urgentLabel={N.urgent} catLabel={catLabel(hero.cat)} onPress={() => open(hero)}/></div>}
        {cards.length === 0 && !hero ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 9999, background: T.jadeFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CatIcon kind="mega" color={T.jadeText} size={28}/>
            </div>
            <div style={{ fontFamily: font, fontWeight: 700, fontSize: 16, color: T.text1, marginTop: 16 }}>{N.emptyTitle}</div>
            <div style={{ fontFamily: font, fontSize: 14, color: T.text2, marginTop: 6, lineHeight: 1.5 }}>{N.emptySub}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map((it) => <ArticleCard key={it.id} item={{ ...it, unread: it.unread && !read[it.id] }} saved={!!saved[it.id]}
              catLabel={catLabel(it.cat)} onPress={() => open(it)} onBookmark={() => toggleSave(it.id)}/>)}
          </div>
        )}
        <div style={{ height: 8 }}/>
      </div>
      <NavBar active="news" onTab={(id) => nav.reset(id)}/>
    </div>
  );
};

Object.assign(window, { NewsScreen, FilterChip, HeroCard, ArticleCard, NewsArticleScreen });
