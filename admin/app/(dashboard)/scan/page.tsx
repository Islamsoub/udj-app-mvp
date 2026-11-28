'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import { Camera, CameraOff, ExternalLink, ScanLine } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { SectionLabel } from '@/components/shared/section-label';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { useCardVerify } from '@/hooks/queries/use-card-verify';
import { apiErrorMessage, cn, fmtDateTime } from '@/lib/utils';
import type { CardVerdict } from '@/lib/types';

/**
 * Vérifier une carte — scans a student card's QR with the device camera (or
 * takes a pasted link/code) and shows the server's verdict: valid, expired,
 * not recognised, or no longer enrolled, with the photo to compare.
 *
 * Decoding is jsQR on frames drawn to a canvas, so it works in every browser
 * with a camera, not only those with the BarcodeDetector API. Frames are read
 * ~6 times a second at most, and scanning pauses once a code is read until
 * "Scanner une autre carte" — the same card held up is not re-checked in a
 * loop. The camera is released on leaving the page.
 */

type CameraState = 'off' | 'starting' | 'on' | 'denied' | 'unavailable';

const SCAN_INTERVAL_MS = 160;
// Frames are scaled down to this before decoding: enough that the card QR (61
// modules a side) keeps 2+ px per module when it fills the target box.
const MAX_FRAME = 960;

export default function ScanPage() {
  const verify = useCardVerify();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [camera, setCamera] = useState<CameraState>('off');
  const [pasted, setPasted] = useState('');

  const stopCamera = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera((c) => (c === 'on' || c === 'starting' ? 'off' : c));
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const submit = useCallback(
    (code: string) => {
      pausedRef.current = true;
      verify.mutate(code);
    },
    [verify]
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || pausedRef.current || video.readyState < 2 || !video.videoWidth) return;
    const scale = Math.min(1, MAX_FRAME / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = (canvasRef.current ??= document.createElement('canvas'));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
    if (found?.data) submit(found.data);
  }, [submit]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable');
      return;
    }
    setCamera('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      pausedRef.current = false;
      timerRef.current = window.setInterval(tick, SCAN_INTERVAL_MS);
      setCamera('on');
    } catch (err) {
      const name = (err as DOMException)?.name;
      setCamera(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
    }
  }, [tick]);

  const scanAnother = () => {
    verify.reset();
    pausedRef.current = false;
  };

  const onPaste = (e: FormEvent) => {
    e.preventDefault();
    const code = pasted.trim();
    if (!code) return;
    setPasted('');
    submit(code);
  };

  return (
    <>
      <PageHead title="Vérifier une carte" sub="Scannez le QR code de la carte étudiante dans l'application" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionLabel>Caméra</SectionLabel>
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[12px] bg-sunken">
            <video
              ref={videoRef}
              className={cn('h-full w-full object-cover', camera !== 'on' && 'invisible')}
              muted
              playsInline
            />
            {camera === 'on' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[18%] rounded-[14px] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
              />
            )}
            {camera !== 'on' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-[13px] text-ink2">
                {camera === 'denied' ? (
                  <>
                    <CameraOff size={26} className="text-danger" />
                    <span>
                      L&apos;accès à la caméra a été refusé. Autorisez-le dans les réglages du navigateur, ou
                      collez le lien ci-dessous.
                    </span>
                  </>
                ) : camera === 'unavailable' ? (
                  <>
                    <CameraOff size={26} />
                    <span>Aucune caméra disponible sur cet appareil. Collez le lien ou le code ci-dessous.</span>
                  </>
                ) : (
                  <>
                    <ScanLine size={26} />
                    <span>La caméra ne s&apos;allume qu&apos;à votre demande, et s&apos;éteint en quittant la page.</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {camera === 'on' ? (
              <Button kind="ghost" icon={<CameraOff size={16} />} onClick={stopCamera}>
                Éteindre la caméra
              </Button>
            ) : (
              <Button icon={<Camera size={16} />} onClick={startCamera} disabled={camera === 'starting'}>
                {camera === 'starting' ? 'Ouverture…' : 'Allumer la caméra'}
              </Button>
            )}
          </div>

          <form onSubmit={onPaste} className="mt-5 border-t border-hair pt-4">
            <label htmlFor="card-code" className="text-[12.5px] font-semibold text-ink2">
              Ou collez le lien / le code de la carte
            </label>
            <div className="mt-2 flex gap-2">
              <TextInput
                id="card-code"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="https://app.unipocket.io/verify#t=…"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                className="flex-1"
              />
              <Button type="submit" disabled={!pasted.trim() || verify.isPending}>
                Vérifier
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <SectionLabel>Résultat</SectionLabel>
          <div className="mt-3" aria-live="polite">
            {verify.isPending ? (
              <p className="py-10 text-center text-[13.5px] text-ink2">Vérification…</p>
            ) : verify.isError ? (
              <div role="alert" className="rounded-[12px] bg-danger-bg p-4 text-[13.5px] text-danger-on-tint">
                {apiErrorMessage(verify.error)}
              </div>
            ) : verify.data ? (
              <Result verdict={verify.data} />
            ) : (
              <p className="py-10 text-center text-[13.5px] text-ink2">
                Le résultat s&apos;affichera ici dès qu&apos;un QR code sera lu.
              </p>
            )}
            {(verify.data || verify.isError) && (
              <Button kind="ghost" className="mt-4 w-full" icon={<ScanLine size={16} />} onClick={scanAnother}>
                Scanner une autre carte
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

const VERDICT = {
  valid: { title: 'Carte valide', box: 'bg-jade-faint text-jade-text', mark: '✓', hint: null },
  expired: {
    title: 'Code expiré',
    box: 'bg-amber-bg text-amber-on-tint',
    mark: '!',
    hint: "Demandez à l'étudiant d'ouvrir sa carte dans l'application pour afficher un nouveau code.",
  },
  invalid: {
    title: 'Code non reconnu',
    box: 'bg-danger-bg text-danger-on-tint',
    mark: '✕',
    hint: "Ce code n'a pas été émis par Unipocket, ou il a été modifié.",
  },
  inactive: {
    title: 'Carte non valable',
    box: 'bg-danger-bg text-danger-on-tint',
    mark: '✕',
    hint: "Le code est authentique, mais l'étudiant n'est plus inscrit.",
  },
} as const;

const STATUS_LABEL: Record<string, string> = { SUSPENDED: 'Suspendu', GRADUATED: 'Diplômé' };

function Result({ verdict }: { verdict: CardVerdict }) {
  const v = VERDICT[verdict.valid ? 'valid' : (verdict.reason ?? 'invalid')];
  const s = verdict.student;
  return (
    <div className="flex flex-col gap-4">
      <div className={cn('flex flex-col items-center gap-1 rounded-[12px] px-4 py-5 text-center', v.box)}>
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-full border-2 border-current text-[22px] font-extrabold"
        >
          {v.mark}
        </span>
        <div className="mt-1 text-[19px] font-extrabold">{v.title}</div>
        {v.hint && <div className="text-[13px]">{v.hint}</div>}
        {s && STATUS_LABEL[s.status] && (
          <div className="mt-1 text-[12px] font-bold uppercase tracking-[0.04em]">{STATUS_LABEL[s.status]}</div>
        )}
      </div>

      {s && (
        <div className="flex items-start gap-4">
          <Photo url={s.photoUrl} initials={`${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`} />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold text-ink">
              {s.firstName} {s.lastName}
            </div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
              <dt className="text-ink2">Matricule</dt>
              <dd className="font-mono text-ink">{s.studentIdDisplay}</dd>
              <dt className="text-ink2">Filière</dt>
              <dd className="text-ink">
                {s.programme.nameFr} · S{s.currentSemester}
              </dd>
              <dt className="text-ink2">Faculté</dt>
              <dd className="text-ink">{s.faculty.nameFr}</dd>
            </dl>
          </div>
        </div>
      )}

      {s && verdict.kind && verdict.issuedAt && (
        <div
          className={cn(
            'rounded-[10px] px-3 py-2 text-[12.5px]',
            verdict.kind === 'offline' ? 'bg-amber-bg text-amber-on-tint' : 'bg-surface2 text-ink2'
          )}
        >
          <strong>{verdict.kind === 'offline' ? 'Code hors ligne' : 'Code en direct'}</strong> · émis le{' '}
          {fmtDateTime(verdict.issuedAt)}
          {verdict.kind === 'offline' && (
            <div>Affiché sans connexion, valable 24 h : il peut s&apos;agir d&apos;une capture. Comparez la photo.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-[12px] text-ink2">
        <span>Vérifié le {fmtDateTime(verdict.checkedAt)}</span>
        {verdict.studentId && (
          <Link
            href={`/students/${verdict.studentId}`}
            className="inline-flex items-center gap-1 font-semibold text-jade-text hover:underline"
          >
            Ouvrir la fiche <ExternalLink size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}

/** The student's photo, or their initials when there is none or it fails. */
function Photo({ url, initials }: { url: string | null; initials: string }) {
  const [failed, setFailed] = useState(false);
  const box = 'h-[88px] w-[88px] shrink-0 rounded-[12px] bg-sunken';
  if (!url || failed) {
    return (
      <div aria-hidden="true" className={cn(box, 'grid place-items-center text-[26px] font-bold text-ink2')}>
        {initials}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={cn(box, 'object-cover')} referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
