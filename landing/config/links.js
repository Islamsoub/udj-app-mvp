/* Unipocket landing: every outgoing link lives here.
   An empty string means the target doesn't exist yet. Clicking it shows the "coming soon" toast.
   Social links with an empty value are not shown at all. */
window.UNIPOCKET_LINKS = {
  googlePlay: '',        // e.g. 'https://play.google.com/store/apps/details?id=io.unipocket.app'
  apk: '',               // e.g. 'downloads/unipocket-1.0.0.apk' (also update apkVersion)
  appStore: '',          // empty: the badge stays "Bientôt sur App Store"
  studentWebsite: 'https://app.unipocket.io',  // the student web app (pwa/), e.g. 'https://app.unipocket.io'
  adminPortal: 'https://admin.unipocket.io',     // the staff portal (admin/), e.g. 'https://admin.unipocket.io'
  privacy: 'privacy.html',
  terms: 'terms.html',
  supportEmail: '',      // e-mail address only, e.g. 'support@unipocket.io'; mailto: is added automatically
  staffContact: '',      // e-mail or URL behind "Nous contacter" on the university card (universities that want to get in touch)
  socials: {
    facebook: '',
    instagram: '',
    linkedin: '',
    x: '',
    youtube: '',
    tiktok: '',
    whatsapp: ''
  },
  apkVersion: 'v1.0',
  siteUrl: 'https://unipocket.io/'
};
