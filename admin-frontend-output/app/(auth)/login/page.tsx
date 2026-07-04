'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FField } from '@/components/ui/form-helpers';
import { ForgotModal } from '@/components/modals/forgot-modal';
import { useModal } from '@/hooks/use-modal';
import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { loginSchema, type LoginValues } from '@/lib/validations';
import { C } from '@/lib/tokens';

/**
 * Login (impl spec §10, supplement §2). Full-screen, no shell: dark jade
 * brand panel (1.1fr) + centered 360px form (1fr). Inline error banner on
 * wrong credentials; values kept, focus back on password.
 */
export default function LoginPage() {
  const router = useRouter();
  const { open } = useModal();
  const login = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPw, setShowPw] = useState(false);
  const [failed, setFailed] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', stayConnected: true },
  });

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  const pending = isSubmitting || login.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setFailed(false);
    try {
      await login.mutateAsync(values);
      router.replace('/');
    } catch {
      setFailed(true);
      setFocus('password');
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ── Left brand panel ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-[56px] lg:flex"
        style={{ background: 'var(--side-bg)' }}
      >
        <div
          className="pointer-events-none absolute -left-[120px] -top-[120px] h-[420px] w-[420px] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${C.jade}42, transparent)` }}
        />
        <div
          className="pointer-events-none absolute -bottom-[140px] -right-[100px] h-[480px] w-[480px] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${C.jade}30, transparent)` }}
        />

        <div className="relative flex items-center gap-3">
          <span
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-[17px] font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${C.jade}, ${C.jade6})` }}
          >
            U
          </span>
          <span className="text-[17px] font-bold text-white">Unipocket</span>
        </div>

        <div className="relative">
          <div className="whitespace-pre-line text-[34px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
            {"Portail\nd'administration"}
          </div>
          <div className="mt-3 max-w-[42ch] text-[14.5px] leading-relaxed text-jade50 opacity-85">
            Étudiants, notes, présence, actualités et emploi du temps — le back-office de
            l&apos;application mobile de l&apos;Université de Djibouti.
          </div>
        </div>

        <div className="relative font-mono text-[11px] text-side-muted">
          © 2026 Université de Djibouti · v1.0
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex items-center justify-center bg-bg px-6 py-10">
        <div className="w-full max-w-[360px]">
          <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-ink">Connexion</h1>
          <div className="mt-1 text-[13.5px] text-ink2">
            Accédez au portail d&apos;administration Unipocket.
          </div>

          {failed && (
            <div className="mt-4 rounded-[10px] bg-danger-bg px-[13px] py-[10px] text-[13px] font-medium text-danger">
              Identifiants incorrects. Veuillez réessayer.
            </div>
          )}

          <form className="mt-5" onSubmit={onSubmit} noValidate>
            <div className="mb-[14px]">
              <FField label="Email" required error={errors.email?.message}>
                <TextInput
                  {...register('email')}
                  type="email"
                  icon={<Mail size={16} />}
                  placeholder="prenom.nom@univ.dj"
                  autoComplete="email"
                  disabled={pending}
                  error={!!errors.email}
                  autoFocus
                />
              </FField>
            </div>
            <div className="mb-3">
              <FField label="Mot de passe" required error={errors.password?.message}>
                <TextInput
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  icon={<KeyRound size={16} />}
                  iconR={
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-ink3 transition-colors hover:text-ink"
                      aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={pending}
                  error={!!errors.password}
                />
              </FField>
            </div>

            <div className="mb-5 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink2">
                <input
                  type="checkbox"
                  {...register('stayConnected')}
                  className="h-[15px] w-[15px] cursor-pointer"
                  style={{ accentColor: 'var(--jade)' }}
                  disabled={pending}
                />
                Rester connecté
              </label>
              <button
                type="button"
                onClick={() => open(<ForgotModal />)}
                className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-jade-text hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <Button kind="primary" size="lg" type="submit" className="w-full" disabled={pending}>
              {pending ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-[10px] bg-surface2 px-3 py-[10px] font-mono text-[11px] text-ink2">
            <Lock size={13} className="shrink-0 text-ink3" />
            Connexion sécurisée · HTTPS
          </div>
        </div>
      </div>
    </div>
  );
}
