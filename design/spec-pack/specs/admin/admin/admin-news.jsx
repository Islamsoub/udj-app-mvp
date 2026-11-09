/* global React, window, C, A_SANS, A_MONO, Icon, Btn, Badge, Card, SectionLabel, Input, inputStyle, Toggle */
/* ============ Unipocket Admin — NEWS (list + create editor) ============ */

const catTone = { official: 'jade', events: 'blue', scolarite: 'amber', sport: 'exam', jeunesse: 'slate', sponsors: 'slate', general: 'slate' };

const News = ({ go }) => {
  const { NEWS, NEWS_CATS } = window.ADMIN_DATA;
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const catLabel = (id) => (NEWS_CATS.find((c) => c.id === id) || {}).label || id;

  const tabs = [['all', 'Tous', NEWS.length], ['published', 'Publiés', NEWS.filter((n) => n.status === 'published').length], ['draft', 'Brouillons', NEWS.filter((n) => n.status === 'draft').length]];
  const list = NEWS.filter((n) => (tab === 'all' || n.status === tab) && n.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <window.PageHead title="Actualités" subtitle={`${NEWS.filter(n => n.status === 'published').length} publiées · ${NEWS.filter(n => n.status === 'draft').length} brouillons`}
        actions={<Btn kind="primary" icon="plus" onClick={() => go('news-create')}>Nouvel article</Btn>} />

      <Card pad={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ width: 280 }}><Input icon="search" placeholder="Rechercher un article…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 4, background: C.surface2, padding: 4, borderRadius: 11 }}>
            {tabs.map(([id, label, n]) => (
              <div key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
                background: tab === id ? C.surface : 'transparent', boxShadow: tab === id ? C.shadow : 'none',
                fontFamily: A_SANS, fontWeight: 600, fontSize: 13, color: tab === id ? C.text1 : C.text2 }}>
                {label}<span style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {list.map((n, i) => (
            <div key={n.id} onClick={() => window.AdminUI.open(<window.NewsReader article={n} />)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderTop: i ? `1px solid ${C.hair}` : 'none', cursor: 'pointer', transition: 'background .12s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.surface2}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {/* thumb */}
              <div style={{ width: 80, height: 56, borderRadius: 10, flexShrink: 0, position: 'relative', overflow: 'hidden',
                background: C.surface2, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.6, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 9px)` }} />
                <Icon name="image" size={20} color={C.text3} style={{ position: 'relative' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Badge tone={catTone[n.cat]}>{catLabel(n.cat)}</Badge>
                  {n.urgent && <Badge tone="danger" dot>Urgent</Badge>}
                  {n.status === 'draft' && <Badge tone="amber">Brouillon</Badge>}
                </div>
                <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                <div style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3, marginTop: 2 }}>{n.source} · {n.date}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 90 }}>
                {n.status === 'published'
                  ? <><div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 15, color: C.text1 }}>{n.views.toLocaleString('fr')}</div><SectionLabel>vues</SectionLabel></>
                  : <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text3 }}>Non publié</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <Btn kind="quiet" size="sm" icon="edit" style={{ padding: 8 }} onClick={() => go('news-create')} />
                <window.Menu items={[
                  { icon: 'edit', label: 'Modifier', onClick: () => go('news-create') },
                  { icon: 'file', label: 'Dupliquer', onClick: () => window.AdminUI.toast('Article dupliqué') },
                  { divider: true },
                  { icon: 'trash', label: 'Supprimer', tone: 'danger', onClick: () => window.AdminUI.open(<window.DeleteNewsModal article={n} />) },
                ]} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

/* ---------- create editor ---------- */
const NewsCreate = ({ go, notify }) => {
  const { NEWS_CATS, NEWS } = window.ADMIN_DATA;
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('official');
  const [urgent, setUrgent] = React.useState(false);
  const [body, setBody] = React.useState('');
  const [notifPush, setNotifPush] = React.useState(false);

  const urgentArticles = NEWS.filter((n) => n.urgent && n.status === 'published');
  const oldestUrgent = urgentArticles[urgentArticles.length - 1];
  const willEvict = urgent && urgentArticles.length >= 3 && oldestUrgent;
  const pushOn = urgent || notifPush;   // urgent forces push on

  const valid = title.trim() && body.trim();
  const catL = (NEWS_CATS.find((c) => c.id === cat) || {}).label;

  return (
    <div>
      <window.PageHead title="Nouvel article" back={() => go('news')}
        actions={<>
          <Btn kind="ghost" onClick={() => { notify('Brouillon enregistré', 'check'); }}>Enregistrer le brouillon</Btn>
          <Btn kind="primary" icon="send" disabled={!valid} onClick={() => { notify('Article publié' + (pushOn ? ' · 2 480 étudiants notifiés' : ''), 'send'); go('news'); }}>Publier</Btn>
        </>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* editor */}
        <Card pad={24}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'article…"
            style={{ width: '100%', fontFamily: A_SANS, fontWeight: 800, fontSize: 26, color: C.text1, letterSpacing: '-0.02em',
              border: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 6, background: 'transparent' }} />
          <div style={{ height: 1, background: C.hair, margin: '6px 0 18px' }} />

          {/* cover image slot */}
          <div onClick={() => window.AdminUI.toast('Image de couverture ajoutée')} style={{ height: 200, borderRadius: 14, background: C.surface2, border: `1.5px dashed ${C.hair2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 12px)` }} />
            <div style={{ width: 46, height: 46, borderRadius: 12, background: C.surface, color: C.jadeText, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: C.shadow }}><Icon name="image" size={22} /></div>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Image de couverture</div>
              <div style={{ fontFamily: A_MONO, fontSize: 11, color: C.text3, marginTop: 2 }}>glisser une image · 1200×630 recommandé</div>
            </div>
          </div>

          {/* functional rich-text editor */}
          <div style={{ border: `1px solid ${C.hair2}`, borderRadius: 11, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 6, background: C.surface2, borderBottom: `1px solid ${C.hair}` }}>
              {[['bold', 'B', { fontWeight: 800 }], ['italic', 'I', { fontStyle: 'italic' }], ['underline', 'U', { textDecoration: 'underline' }]].map(([c, l, st]) =>
                <div key={c} onMouseDown={(e) => { e.preventDefault(); document.execCommand(c); }} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: A_SANS, fontSize: 14, color: C.text2, cursor: 'pointer', ...st }}>{l}</div>)}
              <div style={{ width: 1, background: C.hair2, margin: '4px 4px', alignSelf: 'stretch' }} />
              <div onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, 'h3'); }} style={{ height: 30, padding: '0 9px', borderRadius: 7, display: 'flex', alignItems: 'center', fontFamily: A_SANS, fontWeight: 700, fontSize: 12, color: C.text2, cursor: 'pointer' }}>H3</div>
              <div onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text2, cursor: 'pointer' }}><Icon name="list" size={16} /></div>
              <div onMouseDown={(e) => { e.preventDefault(); const u = prompt('URL du lien :'); if (u) document.execCommand('createLink', false, u); }} style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text2, cursor: 'pointer' }}><Icon name="share" size={15} /></div>
            </div>
            <div contentEditable suppressContentEditableWarning onInput={(e) => setBody(e.currentTarget.textContent)} data-ph="Rédigez le contenu de l'article…"
              style={{ minHeight: 220, padding: 14, fontFamily: A_SANS, fontSize: 15, lineHeight: 1.6, color: C.text1, outline: 'none' }} />
            <style>{`[contenteditable][data-ph]:empty:before{content:attr(data-ph);color:${C.text3};}`}</style>
          </div>
        </Card>

        {/* settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionLabel style={{ marginBottom: 12 }}>Catégorie</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {NEWS_CATS.filter((c) => c.id !== 'general').map((c) => {
                const active = cat === c.id;
                return (
                  <div key={c.id} onClick={() => setCat(c.id)} style={{ padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: A_SANS, fontWeight: 600, fontSize: 12.5,
                    background: active ? C.jade : C.surface2, color: active ? '#fff' : C.text2, transition: 'all .12s' }}>{c.label}</div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <div>
                <div style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Marquer comme urgent</div>
                <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3, marginTop: 1 }}>Affiché en tête avec badge rouge · max. 3</div>
              </div>
              <Toggle on={urgent} onClick={() => setUrgent(!urgent)} />
            </div>

            {willEvict && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 12, padding: '10px 13px', background: C.amberBg, borderRadius: 10, border: `1px solid ${C.amber}33` }}>
                <Icon name="warn" size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: A_SANS, fontSize: 12.5, color: C.text1, lineHeight: 1.5 }}>La limite de 3 articles urgents est atteinte. L'article <b>« {oldestUrgent.title} »</b> ne sera plus marqué comme urgent.</span>
              </div>
            )}

            <div style={{ height: 1, background: C.hair, margin: '14px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', opacity: urgent ? 0.85 : 1 }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: A_SANS, fontWeight: 600, fontSize: 13.5, color: C.text1 }}>Notification push</span>
                  {urgent && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: A_SANS, fontWeight: 600, fontSize: 10.5, color: C.jadeText, background: C.jadeFaint, padding: '2px 7px', borderRadius: 999 }}><Icon name="lock" size={10} color={C.jadeText} /> Auto</span>}
                </div>
                <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3, marginTop: 3, lineHeight: 1.45 }}>
                  {urgent ? 'Les articles urgents envoient automatiquement une notification.' : 'Envoyer une notification push à tous les étudiants.'}
                </div>
              </div>
              {urgent
                ? <div style={{ cursor: 'not-allowed' }} title="Toujours activé pour les articles urgents"><Toggle on={true} onClick={() => {}} /></div>
                : <Toggle on={notifPush} onClick={() => setNotifPush(!notifPush)} />}
            </div>
          </Card>

          {/* live preview */}
          <Card>
            <SectionLabel style={{ marginBottom: 12 }}>Aperçu (app étudiante)</SectionLabel>
            <div style={{ background: C.surface2, borderRadius: 14, padding: 14, border: `1px solid ${C.hair}` }}>
              <div style={{ height: 90, borderRadius: 10, background: C.sunken, marginBottom: 11, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: `repeating-linear-gradient(45deg, ${C.hair} 0 1px, transparent 1px 9px)` }} />
                <Icon name="image" size={18} color={C.text3} style={{ position: 'relative' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
                <Badge tone={catTone[cat]}>{catL}</Badge>
                {urgent && <Badge tone="danger" dot>Urgent</Badge>}
              </div>
              <div style={{ fontFamily: A_SANS, fontWeight: 700, fontSize: 14.5, color: title ? C.text1 : C.text3, lineHeight: 1.3 }}>{title || 'Titre de l\'article'}</div>
              <div style={{ fontFamily: A_SANS, fontSize: 12, color: C.text3, marginTop: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{body || 'Le contenu de l\'article apparaîtra ici…'}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { News, NewsCreate });
