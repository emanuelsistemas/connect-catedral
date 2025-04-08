import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function NotAuthorized() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Não Autorizado</h1>
        <p className="text-muted-foreground mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        <Link
          to="/"
          className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}