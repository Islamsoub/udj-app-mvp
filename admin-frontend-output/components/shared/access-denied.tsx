import { ShieldAlert } from 'lucide-react';
import { Card } from './card';

/** "Accès non autorisé" state for RBAC-restricted routes. */
export function AccessDenied() {
  return (
    <Card className="mx-auto mt-16 max-w-[440px] text-center" pad={32}>
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-danger-bg text-danger">
        <ShieldAlert size={22} />
      </span>
      <div className="text-[17px] font-bold text-ink">Accès non autorisé</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink2">
        Cette section est réservée à un autre rôle. Contactez un super administrateur si vous pensez
        qu&apos;il s&apos;agit d&apos;une erreur.
      </p>
    </Card>
  );
}
