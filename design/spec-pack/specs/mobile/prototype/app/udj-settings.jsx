/* global React */
/* ============ UDJ — SETTINGS (Inset Grouped) + overlays ============ */
const {
  useUDJ, useFont, UDJ_MONO: MONO,
  Scaffold, InsetLabel, InsetGroup, InsetRow, Sheet, Popover, OptionRow, SheetBtn, Gear,
} = window;

const themeLabel = (S, mode) => mode === 'light' ? S.optLight : mode === 'dark' ? S.optDark : S.optSystem;

const SettingsScreen = ({ nav, openOverlay }) => {
  const { S, lang, themeMode, textSize } = useUDJ();
  const [notif, setNotif] = React.useState({ notes: true, course: true, presence: true });
  const tsLabel = textSize === 'small' ? S.optSmall : textSize === 'large' ? S.optLarge : S.optNormal;
  return (
    <Scaffold title={S.settings} onBack={() => nav.pop()}>
      <InsetLabel>{S.secPref}</InsetLabel>
      <InsetGroup>
        <InsetRow label={S.langue} value={lang === 'ar' ? S.optAr : S.optFr} chevron onClick={() => openOverlay('langue')}/>
        <InsetRow label={S.theme} value={themeLabel(S, themeMode)} chevron onClick={() => openOverlay('theme')}/>
        <InsetRow label={S.textSize} value={tsLabel} chevron onClick={() => openOverlay('textsize')}/>
      </InsetGroup>

      <InsetLabel>{S.secNotif}</InsetLabel>
      <InsetGroup>
        <InsetRow label={S.notesAvail} toggle on={notif.notes} onToggle={() => setNotif(n => ({ ...n, notes: !n.notes }))}/>
        <InsetRow label={S.courseReminder} toggle on={notif.course} onToggle={() => setNotif(n => ({ ...n, course: !n.course }))}/>
        <InsetRow label={S.presenceAlerts} toggle on={notif.presence} onToggle={() => setNotif(n => ({ ...n, presence: !n.presence }))}/>
        <InsetRow label={S.quietHours} value={S.quietVal} chevron onClick={() => openOverlay('quiet')}/>
      </InsetGroup>

      <InsetLabel>{S.secData}</InsetLabel>
      <InsetGroup>
        <InsetRow label={S.storage} value={S.storageVal} chevron onClick={() => nav.push('storage')}/>
        <InsetRow label={S.clearCache} destructive onClick={() => openOverlay('clear')}/>
        <InsetRow label={S.lastSync} value={S.lastSyncVal}/>
      </InsetGroup>

      <InsetLabel>{S.secAccount}</InsetLabel>
      <InsetGroup>
        <InsetRow label={S.accountInfo} value={S.fullName} chevron onClick={() => nav.push('account')}/>
        <InsetRow label={S.infoCenter} chevron onClick={() => nav.push('info')}/>
        <InsetRow label={S.logout} destructive onClick={() => openOverlay('logout')}/>
      </InsetGroup>
      <div style={{ height: 8 }}/>
    </Scaffold>
  );
};

/* ---------------- overlays ---------------- */
const LanguePicker = ({ onClose }) => {
  const { S, lang, setLang } = useUDJ();
  return (
    <Popover title={S.pickLangTitle} onClose={onClose}>
      <OptionRow label={S.optFr} sub={S.optFrSub} selected={lang === 'fr'} onClick={() => { setLang('fr'); onClose(); }}/>
      <OptionRow label={S.optAr} sub={S.optArSub} selected={lang === 'ar'} onClick={() => { setLang('ar'); onClose(); }} last/>
    </Popover>
  );
};
const ThemePicker = ({ onClose }) => {
  const { S, themeMode, setThemeMode } = useUDJ();
  return (
    <Popover title={S.pickThemeTitle} onClose={onClose}>
      <OptionRow label={S.optLight} sub={S.optLightSub} selected={themeMode === 'light'} onClick={() => { setThemeMode('light'); onClose(); }}/>
      <OptionRow label={S.optDark} sub={S.optDarkSub} selected={themeMode === 'dark'} onClick={() => { setThemeMode('dark'); onClose(); }}/>
      <OptionRow label={S.optSystem} sub={S.optSystemSub} selected={themeMode === 'system'} onClick={() => { setThemeMode('system'); onClose(); }} last/>
    </Popover>
  );
};
const TextSizePicker = ({ onClose }) => {
  const { S, textSize, setTextSize } = useUDJ();
  return (
    <Popover title={S.pickTextTitle} onClose={onClose}>
      <div style={{ fontFamily: window.UDJ_SANS, fontSize: 12.5, color: useUDJ().T.text3, padding: '0 20px 6px' }}>{S.pickTextSub}</div>
      <OptionRow label={S.optSmall} preview={{ text: S.sampleText, size: 12 }} selected={textSize === 'small'} onClick={() => { setTextSize('small'); onClose(); }}/>
      <OptionRow label={S.optNormal} preview={{ text: S.sampleText, size: 14 }} selected={textSize === 'normal'} onClick={() => { setTextSize('normal'); onClose(); }}/>
      <OptionRow label={S.optLarge} preview={{ text: S.sampleText, size: 17 }} selected={textSize === 'large'} onClick={() => { setTextSize('large'); onClose(); }} last/>
    </Popover>
  );
};

/* simple time wheel column */
const Wheel = ({ values, idx }) => {
  const { T } = useUDJ();
  const show = [idx - 1, idx, idx + 1].map(i => (i + values.length) % values.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {show.map((v, k) => (
        <div key={k} style={{ fontFamily: MONO, fontSize: k === 1 ? 22 : 16, fontWeight: k === 1 ? 500 : 400,
          color: k === 1 ? T.text1 : T.text3, opacity: k === 1 ? 1 : 0.5 }}>{values[v]}</div>
      ))}
    </div>
  );
};
const QuietHoursSheet = ({ onClose }) => {
  const { S, T, rtl } = useUDJ(); const font = useFont();
  const hrs = Array.from({ length: 24 }, (_, i) => (rtl ? toAR(i) : String(i).padStart(2, '0')));
  return (
    <Sheet title={S.quietTitle} subtitle={S.quietSub} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '14px 20px 4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: font, fontSize: 12, color: T.text3, marginBottom: 8 }}>{S.from}</div>
          <div style={{ background: T.surface2, borderRadius: 14, padding: '12px 22px' }}><Wheel values={hrs} idx={22}/></div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: T.text3 }}>–</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: font, fontSize: 12, color: T.text3, marginBottom: 8 }}>{S.to}</div>
          <div style={{ background: T.surface2, borderRadius: 14, padding: '12px 22px' }}><Wheel values={hrs} idx={7}/></div>
        </div>
      </div>
      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SheetBtn kind="primary" onClick={onClose}>{S.save}</SheetBtn>
        <SheetBtn kind="outline" onClick={onClose}>{S.cancel}</SheetBtn>
      </div>
    </Sheet>
  );
};
function toAR(n) { return String(n).padStart(2, '0').replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); }

const ClearCacheConfirm = ({ onClose }) => {
  const { S, T } = useUDJ(); const font = useFont();
  return (
    <Sheet title={S.clearTitle} onClose={onClose}>
      <div style={{ fontFamily: font, fontSize: 13.5, color: T.text2, padding: '6px 20px 0', lineHeight: 1.5 }}>{S.clearBody}</div>
      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SheetBtn kind="danger" onClick={onClose}>{S.clearConfirm}</SheetBtn>
        <SheetBtn kind="outline" onClick={onClose}>{S.cancel}</SheetBtn>
      </div>
    </Sheet>
  );
};
const LogoutConfirm = ({ onClose }) => {
  const { S, T } = useUDJ(); const font = useFont();
  return (
    <Sheet title={S.logoutTitle} onClose={onClose}>
      <div style={{ fontFamily: font, fontSize: 13.5, color: T.text2, padding: '6px 20px 0', lineHeight: 1.5 }}>{S.logoutBody}</div>
      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SheetBtn kind="danger" onClick={onClose}>{S.logoutConfirm}</SheetBtn>
        <SheetBtn kind="outline" onClick={onClose}>{S.cancel}</SheetBtn>
      </div>
    </Sheet>
  );
};

Object.assign(window, { SettingsScreen, LanguePicker, ThemePicker, TextSizePicker, QuietHoursSheet, ClearCacheConfirm, LogoutConfirm });
