import type { Config } from 'tailwindcss';

/**
 * Tailwind theme mapped onto the CSS custom properties declared in
 * styles/globals.css. Every color/shadow/font utility (bg-surface, text-ink2,
 * border-hair, shadow-lg, font-mono…) resolves to a token — never a raw hex.
 *
 * Off-grid values (13.5px, 9px radius, #EEF2F0…) are intentional: they are
 * verbatim measurements from the reference prototype (impl spec §2–4).
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        sunken: 'var(--sunken)',
        ink: 'var(--ink)',
        ink2: 'var(--ink2)',
        ink3: 'var(--ink3)',
        hair: 'var(--hair)',
        hair2: 'var(--hair2)',
        jade: 'var(--jade)',
        jade6: 'var(--jade6)',
        jade7: 'var(--jade7)',
        jade9: 'var(--jade9)',
        jade50: 'var(--jade50)',
        jade100: 'var(--jade100)',
        'jade-faint': 'var(--jade-faint)',
        'jade-faint2': 'var(--jade-faint2)',
        'jade-text': 'var(--jade-text)',
        amber: 'var(--amber)',
        'amber-bg': 'var(--amber-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        blue: 'var(--blue)',
        'blue-bg': 'var(--blue-bg)',
        exam: 'var(--exam)',
        'exam-bg': 'var(--exam-bg)',
        slate: 'var(--slate)',
        'slate-bg': 'var(--slate-bg)',
        'danger-on-tint': 'var(--danger-on-tint)',
        'amber-on-tint': 'var(--amber-on-tint)',
        'blue-on-tint': 'var(--blue-on-tint)',
        'exam-on-tint': 'var(--exam-on-tint)',
        'slate-on-tint': 'var(--slate-on-tint)',
        'side-bg': 'var(--side-bg)',
        'side-bg2': 'var(--side-bg2)',
        'side-text': 'var(--side-text)',
        'side-muted': 'var(--side-muted)',
        'side-hair': 'var(--side-hair)',
        'toggle-off': 'var(--toggle-off)',
      },
      fontFamily: {
        sans: 'var(--sans)',
        mono: 'var(--mono)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
        side: 'var(--shadow-side)',
        modal: 'var(--shadow-modal)',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
