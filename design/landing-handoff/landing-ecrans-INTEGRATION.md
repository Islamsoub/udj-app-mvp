# Unipocket: app screens tour page, integration note

This adds **`ecrans.html`**, the guided tour of the mobile app, the student website and the admin portal, to the `landing/` site. Every file in this package is **new**. Nothing existing is replaced or included. Copy the `landing/` folder from this zip on top of yours. No file names clash.

## 1. Files in this package

| File | What it is |
|---|---|
| `landing/ecrans.html` | The page. Same head, header, phone menu, footer, FR/AR toggle and icon sprite as `index.html` |
| `landing/css/ecrans.css` | Styles used only by this page. Loaded after `css/tokens.css` and `css/styles.css`; uses tokens only |
| `landing/js/ecrans.js` | (1) Adds this page's text to `window.UNIPOCKET_STRINGS`. (2) Switches each screenshot to the FR or AR file when the language changes. Loaded after `js/main.js` |
| `landing/assets/screenshots/ecrans/*` | 76 image files (list in §6) |
| `landing-ecrans-INTEGRATION.md` | This note. Don't publish it |

The page loads these existing files, unchanged: `css/tokens.css`, `css/styles.css`, `config/links.js`, `i18n/strings.js`, `js/main.js`, `assets/brand/unipocket-icon.svg`, the favicons, `site.webmanifest`, the fonts already in `assets/fonts/`, and `assets/images/share-fr-1200x630.jpg` (og:image).

- **Fonts:** I checked that every Arabic character in the new text is already in your `noto-naskh-arabic-var-arabic.woff2` subset, so no new font file is needed.
- **External resources:** none. The page works by double-click, offline.

### Header and footer: please sync
The header and footer in `ecrans.html` are copied from **my last handoff (v1.1)** of `index.html`. Your copy has moved on (new tagline, texts, removed buttons). If you changed anything in the nav, the phone menu or the footer, copy the same change into `ecrans.html`:
- the `<div class="nav-wrap">` block;
- the `<footer>` block.

The text itself comes from `i18n/strings.js` at runtime, so **text** changes carry over on their own. Only **markup** changes (added or removed links or buttons) need copying. On this page the desktop nav leaves out the "Unipocket" link so it keeps 5 links, like the home page; the phone menu keeps it.

## 2. Add the "Écrans" link to the main page

### In `index.html`: desktop nav (`<div class="nav-links">`) and phone menu (`<div class="menu-sheet" id="menuSheet">`)
Add this right after the "Fonctionnalités" link, in **both** blocks:
```html
<a href="ecrans.html" data-i18n="navScreens">Écrans</a>
```
⚠ **Desktop width:** with 6 links the nav pill gets tight between 1101 and 1280 px, especially in Arabic. Recommended: in the **desktop** `.nav-links` only, replace the "Unipocket" link (`navWhat`) with "Écrans". Keep both in the phone menu. That is what `ecrans.html` does.

### In `index.html` (and `404.html`, `privacy.html`, `terms.html` if their footers list pages): footer "Application" column
Add this after the "Fonctionnalités" item:
```html
<li><a href="ecrans.html" data-i18n="navScreens">Écrans</a></li>
```

### `sitemap.xml` (recommended)
```xml
<url>
  <loc>https://unipocket.io/ecrans.html</loc>
  <xhtml:link rel="alternate" hreflang="fr" href="https://unipocket.io/ecrans.html?lang=fr"/>
  <xhtml:link rel="alternate" hreflang="ar" href="https://unipocket.io/ecrans.html?lang=ar"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://unipocket.io/ecrans.html"/>
</url>
```

## 3. New text keys (FR + AR)

**⚠ = Arabic that needs native proofreading. That is all of it.**

Until you move these keys into `i18n/strings.js`, `js/ecrans.js` adds them at runtime. It never overwrites a key that already exists in `strings.js`. To clean up later, copy the keys into `strings.js` → `fr` and `ar`, then delete the `ECRANS_STRINGS` block in `ecrans.js`, keeping the screenshot switcher below it.

`navScreens` is the only key the main page needs (for the new menu and footer link). Add it to `strings.js` when you add the link.

| Key | FR | AR | Proofread |
|---|---|---|---|
| `navScreens` | Écrans | الشاشات | ⚠ |
| `meta.ecrans.title` | Écrans — Unipocket | الشاشات — Unipocket | ⚠ |
| `meta.ecrans.description` | Découvre l'application mobile, le site étudiant et le portail d'administration Unipocket, écran par écran. | اكتشف تطبيق الهاتف والموقع الطلابي وبوابة الإدارة في Unipocket، شاشة بشاشة. | ⚠ |
| `ecr.eyebrow` | Visite guidée | جولة مصوّرة | ⚠ |
| `ecr.h1a` | Unipocket, | Unipocket، | ⚠ |
| `ecr.h1b` | écran par écran | شاشة بشاشة | ⚠ |
| `ecr.lead` | Voici à quoi ressemblent l'application mobile, le site étudiant et le portail d'administration. | هكذا يبدو تطبيق الهاتف والموقع الطلابي وبوابة الإدارة. | ⚠ |
| `ecr.demo` | Captures de nos prototypes · données fictives | لقطات من نماذجنا الأولية · بيانات وهمية | ⚠ |
| `ecr.app.h2` | L'application mobile | تطبيق الهاتف | ⚠ |
| `ecr.app.lead` | Tout ce dont tu as besoin dans ta journée, en français et en arabe, même hors-ligne. | كل ما تحتاجه في يومك، بالعربية والفرنسية، حتى بدون إنترنت. | ⚠ |
| `ecr.app.home.t` | Accueil | الرئيسية | ⚠ |
| `ecr.app.home.d` | Ta journée d'un coup d'œil : cours du jour, moyenne et présences. | يومك في لمحة: محاضرات اليوم، المعدل والحضور. | ⚠ |
| `ecr.app.schedule.t` | Emploi du temps | الجدول الدراسي | ⚠ |
| `ecr.app.schedule.d` | Ta semaine jour par jour, avec les salles, les enseignants et les horaires. | أسبوعك يوماً بيوم، مع القاعات والأساتذة والمواعيد. | ⚠ |
| `ecr.app.grades.t` | Notes | النتائج | ⚠ |
| `ecr.app.grades.d` | Ta moyenne du semestre et le détail de chaque matière. | معدل الفصل وتفاصيل كل مادة. | ⚠ |
| `ecr.app.calculator.t` | Calculateur de notes | حاسبة الدرجات | ⚠ |
| `ecr.app.calculator.d` | Entre ta note de contrôle continu : l'app calcule la note qu'il te faut à l'examen. | أدخل علامة المراقبة المستمرة: يحسب التطبيق العلامة التي تحتاجها في الامتحان. | ⚠ |
| `ecr.app.attendance.t` | Présences | الحضور | ⚠ |
| `ecr.app.attendance.d` | Ton taux de présence par matière et les absences qu'il te reste. | نسبة حضورك في كل مادة والغيابات المتبقية لك. | ⚠ |
| `ecr.app.news.t` | Actualités | الأخبار | ⚠ |
| `ecr.app.news.d` | Les annonces officielles et la vie du campus, triées par catégorie. | الإعلانات الرسمية وحياة الحرم الجامعي، مرتّبة حسب الفئة. | ⚠ |
| `ecr.app.profile.t` | Profil | الملف الشخصي | ⚠ |
| `ecr.app.profile.d` | Ta carte étudiante et tes informations, au même endroit. | بطاقتك الطلابية ومعلوماتك، في مكان واحد. | ⚠ |
| `ecr.app.qr.t` | Carte étudiante QR | البطاقة الطلابية QR | ⚠ |
| `ecr.app.qr.d` | Un code qui se renouvelle tout seul, à présenter à l'entrée. | رمز يتجدد تلقائياً، تعرضه عند المدخل. | ⚠ |
| `ecr.app.info.t` | Centre d'information | مركز المعلومات | ⚠ |
| `ecr.app.info.d` | Contacts, questions fréquentes et démarches, même sans réseau. | جهات الاتصال والأسئلة الشائعة والإجراءات، حتى بدون شبكة. | ⚠ |
| `ecr.app.settings.t` | Paramètres | الإعدادات | ⚠ |
| `ecr.app.settings.d` | Langue, thème, taille du texte, notifications et stockage hors-ligne. | اللغة، المظهر، حجم الخط، الإشعارات والتخزين بدون إنترنت. | ⚠ |
| `ecr.web.h2` | Le site étudiant | الموقع الطلابي | ⚠ |
| `ecr.web.lead` | Le même compte et les mêmes informations, dans n'importe quel navigateur. | نفس الحساب ونفس المعلومات، في أي متصفح. | ⚠ |
| `ecr.web.dashboard.t` | Tableau de bord | لوحة التحكم | ⚠ |
| `ecr.web.dashboard.d` | Les cours du jour, la moyenne générale et l'assiduité, dès la connexion. | محاضرات اليوم والمعدل العام والمواظبة، فور تسجيل الدخول. | ⚠ |
| `ecr.web.schedule.t` | Emploi du temps | الجدول الدراسي | ⚠ |
| `ecr.web.schedule.d` | Toute la semaine en grille, à consulter ou à imprimer. | الأسبوع كاملاً في جدول، للاطلاع أو للطباعة. | ⚠ |
| `ecr.web.grades.t` | Notes | النتائج | ⚠ |
| `ecr.web.grades.d` | La moyenne, son historique et le détail par matière. | المعدل وتطوره وتفاصيل كل مادة. | ⚠ |
| `ecr.web.attendance.t` | Présences | الحضور | ⚠ |
| `ecr.web.attendance.d` | Les présences et les absences restantes, matière par matière. | الحضور والغيابات المتبقية، مادة بمادة. | ⚠ |
| `ecr.admin.h2` | Le portail d'administration | بوابة الإدارة | ⚠ |
| `ecr.admin.lead` | Pour le personnel : publier, mettre à jour et suivre, depuis un seul tableau de bord. | للموظفين: النشر والتحديث والمتابعة، من لوحة تحكم واحدة. | ⚠ |
| `ecr.admin.note` | Le portail d'administration est présenté ici en français. | تُعرض بوابة الإدارة هنا باللغة الفرنسية. | ⚠ |
| `ecr.admin.dashboard.t` | Tableau de bord | لوحة التحكم | ⚠ |
| `ecr.admin.dashboard.d` | Inscrits, présence moyenne, répartition des moyennes et justificatifs à traiter. | عدد المسجلين، متوسط الحضور، توزيع المعدلات والمبررات قيد المعالجة. | ⚠ |
| `ecr.admin.students.t` | Étudiants | الطلاب | ⚠ |
| `ecr.admin.students.d` | La liste des étudiants, avec recherche, filtres et statut. | قائمة الطلاب، مع البحث والتصفية والحالة. | ⚠ |
| `ecr.admin.absences.t` | Justificatifs d'absence | مبررات الغياب | ⚠ |
| `ecr.admin.absences.d` | Les justificatifs envoyés par les étudiants, à valider ou à refuser. | المبررات التي يرسلها الطلاب، للقبول أو الرفض. | ⚠ |
| `ecr.admin.news.t` | Actualités | الأخبار | ⚠ |
| `ecr.admin.news.d` | Rédiger et publier les annonces que les étudiants reçoivent dans l'app. | كتابة ونشر الإعلانات التي يتلقاها الطلاب في التطبيق. | ⚠ |
| `ecr.cta.h2` | Prêt à essayer ? | مستعد للتجربة؟ | ⚠ |
| `ecr.cta.lead` | Télécharge l'application ou ouvre le site étudiant. | حمّل التطبيق أو افتح الموقع الطلابي. | ⚠ |
| `ecr.jump` | Aller à la section | انتقل إلى القسم | ⚠ |

The page also reuses these existing keys, with no change needed: `skip`, `ariaNav`, `ariaHome`, `ariaLang`, `ariaMenu`, `brandSub`, `navWhat`, `navFeatures`, `navOffline`, `navWho`, `navFaq`, `navCta`, `w1t`, `w2t`, `w3t`, `tagStudents`, `tagStaff`, `footAbout2`, `footApp`, `footAccess`, `footWeb`, `footAdmin`, `footContact`, `footLegal`, `footPrivacy`, `footTerms`, `footFollow`, `footMade`. The page title and description come from `meta.ecrans.title` / `meta.ecrans.description`, because `<body data-page="ecrans">`.

## 4. Page structure and behaviour
1. **Header:** eyebrow "Visite guidée", h1, lead, three jump links (#app, #site, #admin, 44 px high), and the "données fictives" line.
2. **App mobile (#app):** 10 phone screenshots, each with a number, a title and a one-line caption. Grid: 5 columns ≥1101 px, 3 columns 701–1100, 2 columns ≤700.
3. **Site étudiant (#site):** 4 screenshots in a light browser frame (`app.unipocket.io`). 2 columns ≥901 px, 1 column below.
4. **Portail d'administration (#admin):** 4 screenshots, same frame (`admin.unipocket.io`). In Arabic a line says the portal is shown in French (see open question 2).
5. **CTA band:** "Télécharger" (→ `index.html#telecharger`) and "Site étudiant" (`data-link="studentWebsite"` from `config/links.js`; empty = toast).

- **Language:** same as the home page: FR/ع toggle, `?lang=ar`, choice remembered. On every switch, `ecrans.js` points each `<picture data-shot>` at the `-fr-` or `-ar-` files. The admin images exist in FR only, so they stay FR.
- **Motion:** only the shared reveal from `main.js`. Hover on the jump links: border and colour, 150 ms. No other JS animation.
- **No JavaScript:** French text and French images all show. The toggle and menu button are hidden, as on the home page.
- **Performance:** all screenshots `loading="lazy"` + `decoding="async"`, WebP with `srcset`/`sizes`, and a PNG fallback with fixed width/height (no layout shift). Approximate WebP weights: app screens 10–20 KB each; website 8–14 KB at 640 px; admin 13–17 KB at 640 px.

## 5. Where the screenshots come from
All of them were captured from the project's interactive prototypes, in light theme, nothing redrawn:
- **Mobile app:** `UDJ - Polished Prototype.html`. FR and AR: Accueil, Agenda, Notes, Calculateur (sheet opened from Notes), Présence, Actualités, Profil, Carte QR plein écran, Centre d'information, Paramètres. Cropped to the 384×836 phone screen. The page rounds the corners with CSS.
- **Student website:** `Unipocket PWA - Standalone.html`. FR and AR: Tableau de bord, Emploi du temps, Notes, Présence. The prototype's floating settings button was hidden before capture.
- **Admin portal:** `Unipocket Admin Portal.html`. FR only (the prototype has no Arabic): Tableau de bord, Étudiants, Présence (justificatifs), Actualités. Its Notes and Emploi du temps screens open on an empty "pick a programme" state, so I didn't use them.

Before capture, these replacements were applied to the prototypes' text, live in the page:
- "UDJ" → "UNI" (IDs such as `UNI-2024-00831`, and the "ADMIN · UNI" label);
- "Université de Djibouti" / "جامعة جيبوتي" → "Université" / "الجامعة", or removed where it followed "UDJ ·";
- "Orange Djibouti" / "أورانج جيبوتي" → "partenaires" / "الشركاء";
- `univ.dj` → `univ.edu`;
- `+253` → `+000`.

The prototype files themselves were not changed.

## 6. Image files (all new, in `landing/assets/screenshots/ecrans/`)
Naming: `{product}-{screen}-{lang}-{width}x{height}.{webp|png}`. The PNG is the fallback for browsers without WebP and exists only at the smallest size.

- `admin-absences-fr-1280x800.webp`
- `admin-absences-fr-640x400.png`
- `admin-absences-fr-640x400.webp`
- `admin-dashboard-fr-1280x800.webp`
- `admin-dashboard-fr-640x400.png`
- `admin-dashboard-fr-640x400.webp`
- `admin-news-fr-1280x800.webp`
- `admin-news-fr-640x400.png`
- `admin-news-fr-640x400.webp`
- `admin-students-fr-1280x800.webp`
- `admin-students-fr-640x400.png`
- `admin-students-fr-640x400.webp`
- `app-attendance-ar-384x836.png`
- `app-attendance-ar-384x836.webp`
- `app-attendance-fr-384x836.png`
- `app-attendance-fr-384x836.webp`
- `app-calculator-ar-384x836.png`
- `app-calculator-ar-384x836.webp`
- `app-calculator-fr-384x836.png`
- `app-calculator-fr-384x836.webp`
- `app-grades-ar-384x836.png`
- `app-grades-ar-384x836.webp`
- `app-grades-fr-384x836.png`
- `app-grades-fr-384x836.webp`
- `app-home-ar-384x836.png`
- `app-home-ar-384x836.webp`
- `app-home-fr-384x836.png`
- `app-home-fr-384x836.webp`
- `app-info-ar-384x836.png`
- `app-info-ar-384x836.webp`
- `app-info-fr-384x836.png`
- `app-info-fr-384x836.webp`
- `app-news-ar-384x836.png`
- `app-news-ar-384x836.webp`
- `app-news-fr-384x836.png`
- `app-news-fr-384x836.webp`
- `app-profile-ar-384x836.png`
- `app-profile-ar-384x836.webp`
- `app-profile-fr-384x836.png`
- `app-profile-fr-384x836.webp`
- `app-qr-card-ar-384x836.png`
- `app-qr-card-ar-384x836.webp`
- `app-qr-card-fr-384x836.png`
- `app-qr-card-fr-384x836.webp`
- `app-schedule-ar-384x836.png`
- `app-schedule-ar-384x836.webp`
- `app-schedule-fr-384x836.png`
- `app-schedule-fr-384x836.webp`
- `app-settings-ar-384x836.png`
- `app-settings-ar-384x836.webp`
- `app-settings-fr-384x836.png`
- `app-settings-fr-384x836.webp`
- `web-attendance-ar-640x374.png`
- `web-attendance-ar-640x374.webp`
- `web-attendance-ar-924x540.webp`
- `web-attendance-fr-640x374.png`
- `web-attendance-fr-640x374.webp`
- `web-attendance-fr-924x540.webp`
- `web-dashboard-ar-640x374.png`
- `web-dashboard-ar-640x374.webp`
- `web-dashboard-ar-924x540.webp`
- `web-dashboard-fr-640x374.png`
- `web-dashboard-fr-640x374.webp`
- `web-dashboard-fr-924x540.webp`
- `web-grades-ar-640x374.png`
- `web-grades-ar-640x374.webp`
- `web-grades-ar-924x540.webp`
- `web-grades-fr-640x374.png`
- `web-grades-fr-640x374.webp`
- `web-grades-fr-924x540.webp`
- `web-schedule-ar-640x374.png`
- `web-schedule-ar-640x374.webp`
- `web-schedule-ar-924x540.webp`
- `web-schedule-fr-640x374.png`
- `web-schedule-fr-640x374.webp`
- `web-schedule-fr-924x540.webp`

## 7. Bug in my previous handoff (v1.1): please check your copy
When I made the page university-neutral, a find-and-replace broke some **French text written directly in the HTML**. JavaScript replaces that text once the page loads, so visitors don't see it. But search engines, link previews (og:description) and no-JS visitors do. Search your files for `l'Portail étudiant` and `l’Portail étudiant`. If they're there, replace them as follows (or with your newer wording):

| File · element | Broken | Fixed |
|---|---|---|
| index.html · `<title>` | Le portail étudiant de l'Portail étudiant | Unipocket — Le portail étudiant de ton université |
| index.html · meta description | …carte étudiante QR de l'Portail étudiant. … | Emploi du temps, notes, présences, actualités et carte étudiante QR. Application mobile et site étudiant pour toutes les universités, en français et en arabe, même hors-ligne. |
| index.html · og:description | Le portail étudiant de l'Portail étudiant. … | Le portail étudiant pour toutes les universités. Bilingue FR · AR, fonctionne hors-ligne. |
| index.html · `pillText` | Le portail étudiant de l'Portail étudiant | (your new tagline) |
| index.html · `lead` | …carte étudiante de l'Portail étudiant — … | …carte étudiante de ton université — … |
| index.html · `stripTitle` | Pensée pour les étudiants de l'Portail étudiant | Pensée pour les étudiants, quelle que soit leur université |
| index.html · `whatLead` | …tout ce que l'Portail étudiant partage… | …tout ce que ton université partage… |
| index.html · `a1` | …tous les étudiants de l'Portail étudiant, sans publicité. | Oui. Unipocket est entièrement gratuite pour les étudiants, sans publicité. |
| index.html · `footAbout2` | Le portail étudiant de l'Portail étudiant : … | Le portail étudiant pour toutes les universités : application mobile, site étudiant et portail d'administration. En français et en arabe. |
| privacy.html · meta description | …le portail étudiant de l’Portail étudiant. | Politique de confidentialité de Unipocket, le portail étudiant pour toutes les universités. |
| terms.html · meta description | …le portail étudiant de l’Portail étudiant. | Conditions d'utilisation de Unipocket, le portail étudiant pour toutes les universités. |

`i18n/strings.js` was correct, which is why the bug doesn't show on screen.

## 8. Open questions
1. **Demo people differ between products.** The app screenshots show "Ahmed Omar" (`UNI-2024-00831`), while the student website shows "Amina Moussa" (`UNI-2024-0451`). The page **text** has no names or IDs. The main page's examples use Ahmed Omar Said / `ETU-2024-0432`. Fine as is, or align the prototypes and re-capture?
2. **The admin portal is French-only** in the prototype. Will it ship in Arabic? If yes, re-capture in AR and add `ar` to `data-langs` on the four admin `<picture>` elements. Then remove the `ecr.admin.note` line.
3. **Arabic digits:** the AR app screenshots use Eastern Arabic digits (٠١٢), while the AR website screenshots use Western digits. That comes from the prototypes; it is the same open question as in the main spec.
4. **Captions are product claims:** "même sans réseau" (information centre), "se renouvelle tout seul" (QR), "à consulter ou à imprimer" (website schedule), "valider ou refuser" (admin absence notes). Please confirm them against the shipped apps.
5. **Image resolution:** the app screenshots are 384×836, the prototype's native size, so they look slightly soft on 3× phone screens. For sharper images, re-export from the real app at 2× using the same file names.
