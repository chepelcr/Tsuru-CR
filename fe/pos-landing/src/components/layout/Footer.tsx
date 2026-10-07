import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from '@/hooks/useTranslation';

interface FooterColumn {
  heading: string;
  links:   string[];
}

export function Footer() {
  const { t, tRaw } = useTranslation();
  const columns = tRaw<FooterColumn[]>('footer.columns') ?? [];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid md:grid-cols-12 gap-10">
        {/* Brand */}
        <div className="md:col-span-4">
          <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-lg">
            <LogoIcon size={32} />
            <span>TSURU<span className="text-primary">·</span>POS</span>
          </Link>
          <p className="text-sm text-secondary-foreground/70 mt-4 max-w-xs">
            {t('footer.tagline')}
          </p>
          <div className="flex items-center gap-3 mt-6 text-xs text-secondary-foreground/60">
            <Icon name="Globe" size={14} />
            {t('footer.madeIn')}
          </div>
        </div>

        {/* Link columns */}
        {columns.map((col, i) => (
          <div key={i} className="md:col-span-2">
            <div className="font-display font-bold uppercase text-xs tracking-[0.18em] text-secondary-foreground/60">
              {col.heading}
            </div>
            <ul className="mt-4 space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-foreground/60">
          <span>{t('footer.copyright')}</span>
          <span className="font-mono">{t('footer.version')}</span>
        </div>
      </div>
    </footer>
  );
}
