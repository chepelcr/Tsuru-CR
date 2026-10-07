import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useConfig } from '@/hooks/useConfig';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { href: '/caracteristicas', key: 'features' },
  { href: '/hacienda',        key: 'hacienda' },
  { href: '/precios',         key: 'pricing'  },
  { href: '/preguntas',       key: 'faq'      },
] as const;

export function TopNav() {
  const { t, lang, setLang } = useTranslation();
  const { dark, setDark }     = useTheme();
  const { config }            = useConfig();
  const location              = useLocation();
  const appUrl                = config.meta.appUrl;
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setOpen(false);
    
    // Update URL first
    window.history.pushState({}, '', href);
    
    // Extract section ID from href
    const sectionId = href === '/' ? 'top' : href.substring(1); // Remove leading /
    
    // Find and scroll to element
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-all',
        scrolled ? 'border-border bg-background/85 backdrop-blur-xl' : 'border-transparent bg-background/0',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 font-display font-extrabold text-lg"
          onClick={() => {
            // Scroll to top when clicking logo
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <LogoIcon size={32} />
          <span className="leading-none">TSURU<span className="text-primary">·</span>POS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, key }) => (
            <button
              key={key}
              onClick={() => handleNavClick(href)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition',
                location.pathname === href ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(`nav.${key}`)}
            </button>
          ))}
          <NavLink
            to="/demo"
            className={({ isActive }) =>
              cn('px-3 py-2 text-sm font-medium rounded-md transition',
                isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground')
            }
          >
            {t('nav.demo')}
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="hidden sm:inline-flex h-9 px-3 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <Icon name="Globe" size={14} />
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            aria-label="Toggle theme"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Icon name={dark ? 'Sun' : 'Moon'} size={18} />
          </button>

          {/* Login */}
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-9 px-3.5 items-center text-sm font-semibold hover:bg-muted rounded-md"
          >
            {t('nav.login')}
          </a>

          {/* CTA */}
          <Link
            to="/precios"
            className="inline-flex h-9 px-4 items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20"
          >
            {t('nav.cta')}
            <Icon name="ArrowRight" size={14} />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-muted"
          >
            <Icon name={open ? 'X' : 'Menu'} size={18} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border px-4 py-3 grid gap-1 bg-background">
          {NAV_LINKS.map(({ href, key }) => (
            <button
              key={key}
              onClick={() => handleNavClick(href)}
              className={cn(
                'px-3 py-2.5 rounded-md text-sm font-medium text-left',
                location.pathname === href ? 'text-primary font-semibold' : 'hover:bg-muted'
              )}
            >
              {t(`nav.${key}`)}
            </button>
          ))}
          <NavLink
            to="/demo"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn('px-3 py-2.5 rounded-md text-sm font-medium',
                isActive ? 'text-primary font-semibold' : 'hover:bg-muted')
            }
          >
            {t('nav.demo')}
          </NavLink>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted text-left"
          >
            {t('nav.login')}
          </a>
          <div className="flex items-center gap-2 pt-2 border-t border-border mt-1">
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="flex-1 h-9 flex items-center justify-center gap-2 text-sm font-medium hover:bg-muted rounded-md"
            >
              <Icon name="Globe" size={14} />
              {lang === 'es' ? 'English' : 'Español'}
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted"
            >
              <Icon name={dark ? 'Sun' : 'Moon'} size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
