import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/50 backdrop-blur-xl border-t border-border z-40">
      <div className="container h-10 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Desenvolvido por{' '}
          <a
            href="https://emasoftware.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-museomoderno font-medium bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent hover:to-primary transition-all duration-300"
          >
            ema-software
          </a>
        </p>
      </div>
    </footer>
  );
}