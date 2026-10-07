/* Landing page sections — single-file to keep parts manageable.
   Components attached to window at the end so app.jsx can reach them. */

const { useState, useEffect } = React;

/* ─────────── Top nav ─────────── */
function TopNav({ dark, setDark }) {
  const [open, setOpen] = useState(false);
  const [scr, setScr] = useState(false);
  useEffect(() => {
    const f = () => setScr(window.scrollY > 12);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const links = [
    ['#caracteristicas', 'Características'],
    ['#hacienda', 'Hacienda 4.4'],
    ['#precios', 'Precios'],
    ['#preguntas', 'Preguntas'],
  ];
  return (
    <header data-comment-anchor="topnav"
      className={`sticky top-0 z-40 border-b transition-all ${scr ? 'border-border bg-background/85 backdrop-blur-xl' : 'border-transparent bg-background/0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2.5 font-display font-extrabold text-lg">
          <I.Logo size={32}/>
          <span className="leading-none">TSURU<span className="text-primary">·</span>POS</span>
        </a>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map(([h,l]) => (
            <a key={h} href={h} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(d=>!d)} aria-label="Tema"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
            {dark ? <I.Sun size={18}/> : <I.Moon size={18}/>}
          </button>
          <a href="#login" className="hidden sm:inline-flex h-9 px-3.5 items-center text-sm font-semibold hover:bg-muted rounded-md">Iniciar sesión</a>
          <a href="#precios" className="inline-flex h-9 px-4 items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20">
            Empezar gratis<I.ArrowRight size={14}/>
          </a>
          <button onClick={()=>setOpen(o=>!o)} className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-muted">{open?<I.X size={18}/>:<I.Menu size={18}/>}</button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border px-4 py-3 grid gap-1 bg-background">
          {links.map(([h,l]) => <a key={h} href={h} onClick={()=>setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{l}</a>)}
        </div>
      )}
    </header>
  );
}

/* ─────────── Hero ─────────── */
function Hero({ variant }) {
  const tickers = ['Factura electrónica 4.4', 'Hacienda CR validado', 'CABYS integrado', 'XML + PDF firmados', 'Notas de crédito y débito', 'Tiquete electrónico', 'Multi-sucursal', 'Multi-terminal', 'Plan contingencia ATV'];

  const Body = variant === 'split' ? HeroSplit : HeroCentered;
  return (
    <section id="top" data-screen-label="01 Hero" data-comment-anchor="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none"/>
      <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-primary/8 to-transparent pointer-events-none"/>
      <div className="absolute -top-24 right-[-10%] w-[480px] h-[480px] rounded-full bg-primary/15 blur-3xl pointer-events-none"/>
      <Body/>
      <Ticker items={tickers}/>
    </section>
  );
}

function HeroCentered() {
  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 lg:pt-20 lg:pb-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-sm text-[12px] font-semibold">
          <span className="status-dot-live"/>
          <span>Versión 4.4 Hacienda</span>
          <span className="text-muted-foreground">· vigente sep/2025</span>
        </div>
        <h1 className="font-display font-extrabold mt-6 leading-[0.95] tracking-tight" style={{fontSize:'clamp(2.5rem,6.4vw,5.25rem)'}}>
          El POS que cumple<br/>con <span className="text-primary">Hacienda</span> sin<br/>cobrarte mensualidad.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Vendé, facturá electrónicamente y manejá tu inventario.
          Empezá <strong className="text-foreground">gratis</strong> y desbloqueá todo
          con un <strong className="text-foreground">único pago</strong> — sin suscripciones,
          sin sorpresas a fin de mes.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#precios" className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25">Empezar gratis<I.ArrowRight size={16}/></a>
          <a href="#demo" className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-md border border-border bg-card font-semibold hover:bg-muted">Ver demo en vivo<I.ArrowUpRight size={14}/></a>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><I.Check size={16} className="text-success"/>Sin tarjeta</span>
          <span className="flex items-center gap-1.5"><I.Check size={16} className="text-success"/>Setup en 5 min</span>
          <span className="flex items-center gap-1.5"><I.Check size={16} className="text-success"/>En español 🇨🇷</span>
        </div>
      </div>
      <PosScreenshot/>
    </div>
  );
}

function HeroSplit() {
  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-20 lg:pb-16 grid lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-[12px] font-semibold">
          <I.Sparkles size={13}/>Versión 4.4 Hacienda · 2025
        </div>
        <h1 className="font-display font-extrabold mt-5 leading-[0.95]" style={{fontSize:'clamp(2.5rem,5.6vw,4.75rem)'}}>
          Tu punto de venta.<br/><span className="text-primary">Sin renta mensual.</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
          Facturación electrónica 4.4, inventario, clientes y reportes — todo en uno.
          Pagás <strong className="text-foreground">una sola vez</strong> y queda tuyo.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <a href="#precios" className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25">Empezar gratis<I.ArrowRight size={16}/></a>
          <a href="#caracteristicas" className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-md border border-border font-semibold hover:bg-muted">Ver características</a>
        </div>
      </div>
      <div className="lg:col-span-6"><PosScreenshot compact/></div>
    </div>
  );
}

function Ticker({ items }) {
  const seq = [...items, ...items];
  return (
    <div className="border-y border-border bg-card/50 overflow-hidden">
      <div className="flex gap-10 ticker-track py-3 whitespace-nowrap">
        {seq.map((it,i)=>(
          <span key={i} className="flex items-center gap-2 text-[13px] font-display font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"/>{it}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────── POS preview screenshot ─────────── */
function PosScreenshot({ compact }) {
  /* Faithful mock of POSIntegratedPage — desktop has 1fr / 320px grid,
     mobile collapses to a stacked tab-switch layout (matches BeautyMarket
     POS responsive split). Toggle lets visitors compare both. */
  const [device, setDevice] = useState('desktop');
  const products = [
    { name: 'Shampoo Argán 250ml', sku: 'SH-ARG-250', price: 6500, q: 1 },
    { name: 'Crema Hidratante 50ml', sku: 'CR-FAC-50', price: 8400, q: 2 },
    { name: 'Mascarilla Carbón', sku: 'MK-CAR-X1', price: 3200, q: 1 },
  ];
  const sub = products.reduce((a,p)=>a+p.price*p.q,0);
  const iva = Math.round(sub*0.13);
  const total = sub+iva;
  const cartCount = products.reduce((a,p)=>a+p.q,0);
  const fmt = n => '₡' + n.toLocaleString('es-CR');
  const grid = [
    { n: 'Shampoo Argán 250ml', p: 6500 },
    { n: 'Crema Hidratante 50ml', p: 8400 },
    { n: 'Mascarilla Carbón', p: 3200 },
    { n: 'Acondicionador Coco', p: 5800 },
    { n: 'Sérum Vitamina C', p: 12400 },
    { n: 'Tónico Facial 200ml', p: 4900 },
    { n: 'Bloqueador SPF 50', p: 9200 },
    { n: 'Exfoliante Corporal', p: 6700 },
    { n: 'Aceite Esencial 30ml', p: 8100 },
  ];

  return (
    <div className={`mx-auto max-w-5xl ${compact?'':'mt-12'}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-md bg-muted/70 border border-border">
          <button onClick={()=>setDevice('desktop')}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold ${device==='desktop'?'bg-card shadow-sm text-foreground':'text-muted-foreground hover:text-foreground'}`}>
            <I.Monitor size={13}/> Escritorio
          </button>
          <button onClick={()=>setDevice('mobile')}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded text-[12px] font-semibold ${device==='mobile'?'bg-card shadow-sm text-foreground':'text-muted-foreground hover:text-foreground'}`}>
            <I.Smartphone size={13}/> Móvil
          </button>
        </div>
        <a href="demo/index.html" className="text-[12px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
          Probá la demo funcional <I.ArrowUpRight size={13}/>
        </a>
      </div>
      {device === 'mobile'
        ? <PosScreenshotMobile products={products} sub={sub} iva={iva} total={total} cartCount={cartCount} fmt={fmt} grid={grid}/>
        : <PosScreenshotDesktop products={products} sub={sub} iva={iva} total={total} cartCount={cartCount} fmt={fmt} grid={grid}/>}
      <div className="mt-3 flex justify-center items-center gap-2 text-[11px] font-mono text-muted-foreground">
        <span className="status-dot-live"/> Validando con Hacienda — promedio 1.2s
      </div>
    </div>
  );
}

function PosScreenshotDesktop({ products, sub, iva, total, cartCount, fmt, grid }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10 overflow-hidden">{/* DESKTOP_OPEN */}
        {/* Browser chrome */}
        <div className="h-9 bg-muted/60 border-b border-border flex items-center gap-2 px-4">
          <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive/70"/><span className="w-3 h-3 rounded-full bg-warning/80"/><span className="w-3 h-3 rounded-full bg-success/80"/></div>
          <div className="flex-1 flex justify-center"><span className="px-3 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-background/60 border border-border">pos.tsuru.jcampos.dev</span></div>
          <span className="hidden md:inline text-[11px] font-mono text-muted-foreground">v4.4</span>
        </div>

        {/* POS app header — mirrors POSIntegratedPage 52px header */}
        <div className="h-[52px] flex items-center justify-between px-5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-[20px] leading-none">Punto de venta</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-[13px] text-muted-foreground">Sucursal Central · Terminal 02</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground hidden sm:inline">JCampos</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/12 text-success border border-success/30 text-[11px] font-semibold">
              <span className="status-dot-live"/>En línea
            </span>
          </div>
        </div>

        {/* Grid: 1fr products | 420px cart */}
        <div className="grid min-h-[460px]" style={{gridTemplateColumns:'1fr 320px'}}>
          {/* Left column: tabs + products */}
          <div className="flex flex-col border-r border-border">
            <div className="flex border-b border-border bg-card">
              {[['Productos',true],['Clientes',false]].map(([l,a],i)=>(
                <button key={i} className={`flex-1 py-3 text-[13px] font-semibold ${a?'text-primary border-b-2 border-primary':'text-muted-foreground border-b-2 border-transparent'}`}>{l}</button>
              ))}
            </div>
            <div className="p-3 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-9 rounded-md border border-border bg-background flex items-center px-3 gap-2 text-[12px] text-muted-foreground"><I.Search size={14}/><span>Buscar producto · escaneá el código</span></div>
                <button className="h-9 w-9 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground"><I.Scan size={14}/></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {grid.map((g,i)=>(
                  <div key={i} className="aspect-[5/4] rounded-md border border-border bg-background p-2 flex flex-col hover:border-primary/40 transition">
                    <div className="flex-1 rounded bg-muted/70 mb-1.5 relative overflow-hidden">
                      <div className="absolute inset-0" style={{backgroundImage:`repeating-linear-gradient(45deg, hsl(var(--muted-foreground) / .14) 0 1px, transparent 1px 9px)`}}/>
                    </div>
                    <div className="text-[10px] font-semibold leading-tight line-clamp-1">{g.n}</div>
                    <div className="text-[10px] font-mono text-primary t-num">{fmt(g.p)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: CartSidebar */}
          <aside className="flex flex-col bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <I.ShoppingCart size={16} className="text-foreground"/>
                <span className="font-display font-bold text-[15px]">Carrito</span>
                <span className="px-1.5 h-5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold t-num">{cartCount}</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">FE-04</span>
            </div>
            <div className="px-4 py-3 border-b border-border">
              <button className="w-full h-9 rounded-md border border-dashed border-border text-[12px] text-muted-foreground hover:bg-muted flex items-center justify-center gap-2">
                <I.Users size={14}/>Seleccionar cliente
              </button>
            </div>
            <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
              {products.map((p,i)=>(
                <div key={i} className="rounded-md border border-border bg-background p-2.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-[12px] font-semibold leading-tight">{p.name}</span>
                    <span className="text-[11px] font-mono t-num">{fmt(p.price*p.q)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{p.sku}</span>
                    <div className="flex items-center gap-1">
                      <button className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground"><I.Minus size={12}/></button>
                      <span className="w-6 text-center text-[11px] font-mono t-num">{p.q}</span>
                      <button className="w-6 h-6 rounded border border-border flex items-center justify-center text-muted-foreground"><I.Plus size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border space-y-1 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono t-num">{fmt(sub)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">IVA 13%</span><span className="font-mono t-num">{fmt(iva)}</span></div>
              <div className="flex justify-between text-[15px] font-display font-extrabold pt-1"><span>TOTAL</span><span className="font-mono t-num text-primary">{fmt(total)}</span></div>
              <button className="mt-2 w-full h-10 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20">Cobrar · {fmt(total)}<I.ArrowRight size={14}/></button>
            </div>
          </aside>
        </div>
    </div>
  );
}

/* Mobile POS — single column, tab-switch between productos / carrito.
   Mirrors the responsive split of POSIntegratedPage on small viewports. */
function PosScreenshotMobile({ products, sub, iva, total, cartCount, fmt, grid }) {
  const [tab, setTab] = useState('productos');
  return (
    <div className="flex justify-center">
      <div className="relative w-[320px] rounded-[36px] border-[10px] border-foreground/85 bg-foreground/85 shadow-2xl shadow-foreground/30 overflow-hidden">
        {/* notch */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground rounded-b-2xl z-10"/>
        <div className="rounded-[26px] overflow-hidden bg-card">
          {/* status bar */}
          <div className="h-7 flex items-center justify-between px-5 text-[10px] font-mono bg-card pt-1.5">
            <span>9:41</span>
            <span className="flex gap-1 items-center"><I.Wifi size={10}/><I.Battery size={10}/></span>
          </div>
          {/* compact header */}
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-[15px] leading-none">Punto de venta</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Central · T-02</div>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-success/12 text-success border border-success/30 text-[9px] font-bold">
              <span className="status-dot-live" style={{width:6,height:6}}/>EN LÍNEA
            </span>
          </div>
          {/* tab switch — mobile-specific */}
          <div className="grid grid-cols-2 p-1 m-2 rounded-md bg-muted gap-0.5">
            {[['productos', 'Productos', null],['carrito', 'Carrito', cartCount]].map(([id,l,b]) => (
              <button key={id} onClick={()=>setTab(id)}
                className={`relative h-8 rounded text-[11px] font-semibold ${tab===id?'bg-card shadow-sm text-foreground':'text-muted-foreground'}`}>
                {l}
                {b!=null && <span className="ml-1 px-1 h-3.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold t-num align-middle">{b}</span>}
              </button>
            ))}
          </div>

          {tab === 'productos' ? (
            <div className="px-2 pb-2">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <div className="flex-1 h-8 rounded-md border border-border bg-background flex items-center px-2 gap-1.5 text-[10px] text-muted-foreground"><I.Search size={11}/><span>Buscar / escanear</span></div>
                <button className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center"><I.Scan size={12}/></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {grid.slice(0,6).map((g,i)=>(
                  <div key={i} className="aspect-[5/4] rounded-md border border-border bg-background p-1.5 flex flex-col">
                    <div className="flex-1 rounded bg-muted/70 mb-1 relative overflow-hidden">
                      <div className="absolute inset-0" style={{backgroundImage:`repeating-linear-gradient(45deg, hsl(var(--muted-foreground) / .14) 0 1px, transparent 1px 9px)`}}/>
                    </div>
                    <div className="text-[9px] font-semibold leading-tight line-clamp-1">{g.n}</div>
                    <div className="text-[9px] font-mono text-primary t-num">{fmt(g.p)}</div>
                  </div>
                ))}
              </div>
              {/* sticky bottom — cart preview */}
              <button onClick={()=>setTab('carrito')} className="mt-2 w-full h-11 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold flex items-center justify-between px-3 shadow-sm shadow-primary/20">
                <span className="flex items-center gap-1.5"><I.ShoppingCart size={14}/>{cartCount} ítems</span>
                <span className="font-mono t-num">{fmt(total)} <I.ArrowRight size={12} className="inline"/></span>
              </button>
            </div>
          ) : (
            <div className="px-3 pb-3">
              <button className="w-full h-8 rounded-md border border-dashed border-border text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 mb-2">
                <I.Users size={12}/>Seleccionar cliente
              </button>
              <div className="space-y-1.5">
                {products.map((p,i)=>(
                  <div key={i} className="rounded-md border border-border bg-background p-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-[11px] font-semibold leading-tight line-clamp-1">{p.name}</span>
                      <span className="text-[10px] font-mono t-num shrink-0">{fmt(p.price*p.q)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-mono text-muted-foreground">{p.sku}</span>
                      <div className="flex items-center gap-1">
                        <button className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground"><I.Minus size={10}/></button>
                        <span className="w-5 text-center text-[10px] font-mono t-num">{p.q}</span>
                        <button className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground"><I.Plus size={10}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border space-y-0.5 text-[10px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono t-num">{fmt(sub)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 13%</span><span className="font-mono t-num">{fmt(iva)}</span></div>
                <div className="flex justify-between text-[12px] font-display font-extrabold pt-0.5"><span>TOTAL</span><span className="font-mono t-num text-primary">{fmt(total)}</span></div>
              </div>
              <button className="mt-2 w-full h-11 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20">
                Cobrar · {fmt(total)}<I.ArrowRight size={13}/>
              </button>
            </div>
          )}
          {/* home indicator */}
          <div className="h-5 flex items-end justify-center pb-1.5"><span className="w-24 h-1 rounded-full bg-foreground/30"/></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── vs Competencia ─────────── */
function VsCompetition() {
  const rows = [
    ['Modelo de pago', { v: 'Pago único de por vida', ok: true }, 'Pago por bloque de documentos', 'Suscripción mensual recurrente'],
    ['Productos', { v: 'Ilimitados (Pro)', ok: true }, 'Por paquete', 'Limitado por plan'],
    ['Documentos electrónicos', { v: 'Ilimitados (Pro)', ok: true }, 'Por bloque comprado', 'Por plan / extras'],
    ['Multi-sucursal y terminal', { v: 'Incluido', ok: true }, 'Add-on', 'Add-on'],
    ['Modo contingencia (offline)', { v: 'Sí', ok: true }, 'Limitado', 'Generalmente no'],
    ['Costo a 3 años', { v: 'Pago único', ok: true }, 'Acumulado por bloques', 'Acumulado por mes'],
  ];
  return (
    <section id="vs" data-screen-label="02 VS" className="py-20 lg:py-28 bg-muted/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="t-label">Por qué cambiar</div>
          <h2 className="font-display font-extrabold mt-2" style={{fontSize:'clamp(2rem,3.6vw,3rem)'}}>Pagás <span className="text-primary">una vez</span>. Vendés <span className="text-primary">para siempre</span>.</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Mientras otros sistemas te cobran por bloque de documentos o mes a mes, Tsuru POS es tuyo con un solo pago.</p>
        </div>

        {/* Desktop / tablet table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-12 bg-muted/60 border-b border-border">
            <div className="col-span-3 p-4 t-label">Característica</div>
            <div className="col-span-3 p-4 t-label flex items-center gap-2"><I.Logo size={16}/>Tsuru POS</div>
            <div className="col-span-3 p-4 t-label">Facturador postpago</div>
            <div className="col-span-3 p-4 t-label">Suscripción mensual</div>
          </div>
          {rows.map((r,i)=>(
            <div key={i} className={`grid grid-cols-12 border-b border-border last:border-b-0 ${i%2?'bg-muted/20':''}`}>
              <div className="col-span-3 p-4 text-sm font-semibold">{r[0]}</div>
              <div className="col-span-3 p-4 text-sm flex items-center gap-2">
                {r[1].ok && <I.BadgeCheck size={16} className="text-primary shrink-0"/>}
                <span className="font-semibold">{r[1].v}</span>
              </div>
              <div className="col-span-3 p-4 text-sm text-muted-foreground">{r[2]}</div>
              <div className="col-span-3 p-4 text-sm text-muted-foreground">{r[3]}</div>
            </div>
          ))}
        </div>
        {/* Mobile stack — each row becomes a card */}
        <div className="md:hidden space-y-3">
          {rows.map((r,i)=>(
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/40 border-b border-border t-label">{r[0]}</div>
              <div className="divide-y divide-border">
                <div className="p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0"><I.Logo size={14}/></div>
                  <div className="flex-1">
                    <div className="text-[11px] font-display font-bold uppercase tracking-wider text-primary">Tsuru POS</div>
                    <div className="text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                      {r[1].ok && <I.BadgeCheck size={14} className="text-primary shrink-0"/>}
                      {r[1].v}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground">Facturador postpago</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{r[2]}</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground">Suscripción mensual</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{r[3]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground text-center">Comparativa contra los modelos comerciales más comunes en Costa Rica. Sujeto a cambios.</p>
      </div>
    </section>
  );
}

/* ─────────── Características ─────────── */
function Features() {
  const groups = [
    { eyebrow: 'Punto de venta', title: 'Vendé como te gusta', items: [
      [I.ShoppingCart, 'Carrito y caja rápida', 'Búsqueda por código de barras o por nombre, atajos de teclado, productos favoritos en cuadrícula.'],
      [I.Scan, 'Lector de barras y balanza', 'Compatible con scanners USB y balanzas con cálculo de peso variable.'],
      [I.Wallet, 'Múltiples métodos de pago', 'Efectivo, tarjeta, SINPE Móvil y otros — combinás varios en una sola venta.'],
      [I.Receipt, 'Tabs de documentos', 'Mantené varios documentos abiertos (factura, tiquete, NC/ND) sin perder el carrito.'],
    ]},
    { eyebrow: 'Catálogo e inventario', title: 'Tu inventario, ordenado', items: [
      [I.Package, 'Productos y servicios', 'Variantes, fotos, precios por sucursal, costo y margen automáticos.'],
      [I.Boxes, 'Stock multi-sucursal', 'Movimientos, traslados, ajustes y alertas de mínimo en tiempo real.'],
      [I.Tag, 'CABYS oficial', 'Buscador integrado del Catálogo de Bienes y Servicios del Ministerio de Hacienda.'],
      [I.Users, 'Clientes y proveedores', 'Importá tu base por CSV, historial de compras y crédito por cliente.'],
    ]},
    { eyebrow: 'Facturación electrónica', title: 'Hacienda, sin dolores', items: [
      [I.FileSignature, 'Firma y envío automático', 'Firmás con tu llave criptográfica, Tsuru envía y reintenta hasta validar.'],
      [I.FileText, 'Todos los documentos 4.4', 'Factura, tiquete, exportación, compra, notas de crédito y débito.'],
      [I.ShieldCheck, 'Modo contingencia', 'Si Hacienda se cae, seguís facturando. Reenvío automático cuando vuelve.'],
      [I.BadgeCheck, 'Recibidos y aceptación', 'Aceptás o rechazás documentos recibidos directamente desde el POS.'],
    ]},
    { eyebrow: 'Operación', title: 'Pensado para tu día', items: [
      [I.Building2, 'Multi-sucursal y terminal', 'Cada cajero con su sesión, arqueos por terminal y reportes por sucursal.'],
      [I.BarChart, 'Reportes en vivo', 'Ventas por hora, top productos, ticket promedio, márgenes — sin esperar fin de mes.'],
      [I.Cloud, 'Tus datos, tu nube', 'Respaldos automáticos, exportación a Excel/CSV, sin tomar tu información de rehén.'],
      [I.Smartphone, 'Mobile y tablet', 'Funciona en cualquier dispositivo — abrís el navegador y vendés.'],
    ]},
  ];
  return (
    <section id="caracteristicas" data-screen-label="03 Caracteristicas" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <div className="t-label">Lo que tenés desde el día uno</div>
          <h2 className="font-display font-extrabold mt-2" style={{fontSize:'clamp(2rem,3.6vw,3rem)'}}>Todo lo que un negocio necesita.<br/><span className="text-primary">Nada que no usés.</span></h2>
        </div>
        <div className="space-y-14">
          {groups.map((g,gi)=>(
            <div key={gi}>
              <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
                <div>
                  <div className="t-label">{g.eyebrow}</div>
                  <h3 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">{g.title}</h3>
                </div>
                <div className="h-px flex-1 bg-border min-w-[60px] mb-2 hidden sm:block"/>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {g.items.map(([Ic,t,d],i)=>(
                  <div key={i} className="card card-hover p-5 flex flex-col gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Ic size={20}/></div>
                    <h4 className="font-display font-bold text-[17px] leading-tight">{t}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Cómo funciona ─────────── */
function HowItWorks() {
  const steps = [
    [I.Plus, 'Creá tu cuenta', 'Registrás tu negocio y tu primera sucursal en menos de 2 minutos. No pedimos tarjeta.'],
    [I.Package, 'Cargá tu catálogo', 'Importás CSV o creás productos a mano. Buscamos automáticamente el código CABYS.'],
    [I.FileSignature, 'Subí tu llave Hacienda', 'Llave criptográfica + usuario ATV. Tsuru se encarga del resto del trámite técnico.'],
    [I.ShoppingCart, 'Empezá a vender', 'Abrís el POS, escaneás, cobrás. La factura electrónica sale firmada y validada.'],
  ];
  return (
    <section id="como" data-screen-label="04 Como" className="py-20 lg:py-28 bg-muted/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="t-label">Cómo empezar</div>
          <h2 className="font-display font-extrabold mt-2" style={{fontSize:'clamp(2rem,3.6vw,3rem)'}}>De cero a vendiendo en <span className="text-primary">5 minutos</span>.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(([Ic,t,d],i)=>(
            <div key={i} className="relative card p-6">
              <div className="absolute top-4 right-4 font-display font-extrabold text-5xl text-primary/15 leading-none t-num">0{i+1}</div>
              <div className="w-11 h-11 rounded-md bg-primary text-primary-foreground flex items-center justify-center"><Ic size={20}/></div>
              <h4 className="font-display font-bold text-xl mt-4">{t}</h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Hacienda 4.4 ─────────── */
function Hacienda({ variant }) {
  const compact = variant === 'compact';
  const cards = [
    [I.FileSignature, 'Firma criptográfica', 'Subís tu llave una sola vez. Firmamos cada XML según los esquemas oficiales 4.4.'],
    [I.BadgeCheck, 'Validación ATV', 'Enviamos al Ministerio de Hacienda y monitoreamos hasta el estado final. Reintentamos en automático.'],
    [I.ShieldCheck, 'Plan de contingencia', 'Si ATV está caído, seguís facturando. Tsuru reenvía cuando el servicio vuelve.'],
    [I.FileText, 'Aceptación de recibidos', 'Aceptás, rechazás parcial o totalmente documentos recibidos sin salir del sistema.'],
    [I.Tag, 'CABYS al día', 'Catálogo sincronizado con Hacienda. Nuevas tarifas IVA aplicadas automáticamente.'],
    [I.Layers, 'Reportes para tu contador', 'Exportá libros de ventas y compras en el formato exacto que pide tu contador.'],
  ];
  return (
    <section id="hacienda" data-screen-label="05 Hacienda" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none"/>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-display font-bold uppercase tracking-[0.16em]">
            <I.ShieldCheck size={13}/> Cumplimiento Ministerio de Hacienda
          </div>
          <h2 className="font-display font-extrabold mt-3" style={{fontSize:'clamp(2rem,3.6vw,3rem)'}}>Versión 4.4. <span className="text-primary">Lista hoy.</span></h2>
          <p className="mt-3 text-muted-foreground">Toda la complejidad técnica de la facturación electrónica costarricense, resuelta. Vos solo te dedicás a vender.</p>
        </div>

        <div className={`grid gap-4 ${compact?'sm:grid-cols-3':'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {cards.map(([Ic,t,d],i)=>(
            <div key={i} className={`card p-5 ${compact?'':'lg:p-6'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-accent text-accent-foreground flex items-center justify-center"><Ic size={20}/></div>
                <h4 className="font-display font-bold text-lg leading-tight">{t}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 card p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="w-14 h-14 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"><I.Sparkles size={26}/></div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-xl">Próximamente: asistente IIBI y obligaciones automáticas</h4>
            <p className="text-sm text-muted-foreground mt-1.5">Recordatorios de declaración IVA, libros automáticos de compras y ventas, conciliación bancaria con SINPE — todo dentro del Pago Único.</p>
          </div>
          <span className="badge bg-warning/15 text-warning border border-warning/30 px-3 py-1 rounded-full text-[11px] font-display font-bold uppercase tracking-wider">En camino</span>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Testimonios ─────────── */
function Testimonials() {
  const t = [
    { q: 'Pasamos de pagar mensualidades a tener un sistema que es nuestro. La diferencia se siente cada fin de mes.', a: 'Carolina M.', r: 'Dueña, Beauty Studio Heredia' },
    { q: 'El modo contingencia salvó dos días enteros de ventas cuando ATV estuvo caído. Ningún cliente se fue sin tiquete.', a: 'Andrés R.', r: 'Mini-súper Tres Ríos' },
    { q: 'Migramos en una tarde. Importamos productos por CSV y al día siguiente ya estábamos facturando.', a: 'María Fernanda', r: 'Boutique Curridabat' },
  ];
  return (
    <section className="py-20 lg:py-24 border-y border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="t-label">Quien ya cambió</div>
          <h2 className="font-display font-extrabold mt-2" style={{fontSize:'clamp(1.75rem,3vw,2.5rem)'}}>Negocios costarricenses que ya no pagan mensualidad.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {t.map((it,i)=>(
            <figure key={i} className="card p-6 flex flex-col gap-4">
              <I.Quote size={22} className="text-primary"/>
              <blockquote className="text-[15px] leading-relaxed text-foreground">"{it.q}"</blockquote>
              <figcaption className="mt-auto pt-3 border-t border-border">
                <div className="font-display font-bold">{it.a}</div>
                <div className="text-xs text-muted-foreground">{it.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── FAQ ─────────── */
function FAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    ['¿El plan gratis tiene fecha de vencimiento?','No. El plan Free es gratuito para siempre dentro de los límites mensuales (productos, clientes y documentos). Solo pagás cuando necesitás más.'],
    ['¿Qué incluye exactamente el "Pago Único"?','Productos y clientes ilimitados, facturación electrónica sin tope mensual, multi-sucursal, multi-terminal, reportes avanzados, modo contingencia y todas las nuevas funciones de cumplimiento Hacienda que liberemos.'],
    ['¿Necesito mi propia llave criptográfica?','Sí — es un requisito de Hacienda. Si no la tenés, te guiamos paso a paso para obtenerla en el portal ATV (es gratis).'],
    ['¿Funciona si se cae mi internet o ATV?','El POS sigue funcionando offline. Los documentos quedan en cola y se firman/envían apenas vuelva la conexión, sin que vos hagas nada.'],
    ['¿Puedo migrar desde otro sistema o desde Excel?','Sí. Importás productos y clientes por CSV. Para historial fiscal, te ayudamos en la migración inicial sin costo.'],
    ['¿Tengo soporte en español?','Soporte humano por WhatsApp y correo, en horario costarricense. El equipo está acá, no en otro continente.'],
  ];
  return (
    <section id="preguntas" data-screen-label="07 FAQ" className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="t-label">Preguntas frecuentes</div>
          <h2 className="font-display font-extrabold mt-2" style={{fontSize:'clamp(2rem,3.4vw,2.75rem)'}}>Lo que la gente nos pregunta.</h2>
        </div>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {items.map(([q,a],i)=>(
            <button key={i} onClick={()=>setOpen(o=>o===i?-1:i)} className="w-full text-left px-5 py-4 hover:bg-muted/40 transition">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">{q}</span>
                <I.ChevronDown size={18} className={`shrink-0 transition-transform ${open===i?'rotate-180 text-primary':'text-muted-foreground'}`}/>
              </div>
              {open===i && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Final CTA + login ─────────── */
function FinalCta() {
  return (
    <section id="login" data-screen-label="08 CTA" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary"/>
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:`radial-gradient(circle at 20% 20%, rgba(255,255,255,.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.15), transparent 40%)`}}/>
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 text-primary-foreground">
          <div className="t-label" style={{color:'rgba(255,255,255,.65)'}}>Tu próximo punto de venta</div>
          <h2 className="font-display font-extrabold mt-2 leading-[0.95]" style={{fontSize:'clamp(2.25rem,4.6vw,4rem)'}}>Vendé hoy.<br/>Cumplí con Hacienda mañana.</h2>
          <p className="mt-4 text-[17px] text-white/85 max-w-lg">Empezá gratis sin tarjeta. Cuando estés listo, desbloqueá todo con un solo pago.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a href="#precios" className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-md bg-white text-primary font-semibold hover:bg-white/90 shadow-lg">Crear mi cuenta gratis<I.ArrowRight size={16}/></a>
            <a href="#caracteristicas" className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-md border border-white/40 text-white font-semibold hover:bg-white/10">Ver demo</a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="card p-6 lg:p-7 shadow-2xl shadow-foreground/30">
            <div className="flex items-center gap-2 mb-1"><I.Lock size={16} className="text-primary"/><h3 className="font-display font-bold text-lg">¿Ya tenés cuenta?</h3></div>
            <p className="text-sm text-muted-foreground mb-4">Iniciá sesión en tu POS</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5">Correo</label>
                <input type="email" placeholder="vos@negocio.cr" className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5">Contraseña</label>
                <input type="password" placeholder="••••••••" className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/>
              </div>
              <button className="w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 flex items-center justify-center gap-2">Entrar al POS<I.ArrowRight size={15}/></button>
              <div className="flex justify-between text-[12px]"><a className="text-muted-foreground hover:text-foreground" href="#">¿Olvidaste tu contraseña?</a><a className="text-primary font-semibold" href="#precios">Crear cuenta</a></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Footer ─────────── */
function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <a href="#top" className="flex items-center gap-2.5 font-display font-extrabold text-lg"><I.Logo size={32}/><span>TSURU<span className="text-primary">·</span>POS</span></a>
          <p className="text-sm text-secondary-foreground/70 mt-4 max-w-xs">El punto de venta costarricense con facturación electrónica 4.4 — sin renta mensual.</p>
          <div className="flex items-center gap-3 mt-6 text-xs text-secondary-foreground/60">
            <I.Globe size={14}/> Hecho en Costa Rica · 🇨🇷
          </div>
        </div>
        {[
          ['Producto', ['Características', 'Hacienda 4.4', 'Precios', 'Demo en vivo']],
          ['Soporte', ['Centro de ayuda', 'Estado del servicio', 'Migración', 'Contactar']],
          ['Legal', ['Términos', 'Privacidad', 'Cookies', 'Cumplimiento']],
        ].map(([h, ls],i)=>(
          <div key={i} className="md:col-span-2">
            <div className="font-display font-bold uppercase text-xs tracking-[0.18em] text-secondary-foreground/60">{h}</div>
            <ul className="mt-4 space-y-2">{ls.map(l => <li key={l}><a href="#" className="text-sm text-secondary-foreground/80 hover:text-secondary-foreground">{l}</a></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-foreground/60">
          <span>© 2026 Tsuru POS. Todos los derechos reservados.</span>
          <span className="font-mono">v4.4 · API 2.1.0</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { TopNav, Hero, VsCompetition, Features, HowItWorks, Hacienda, Testimonials, FAQ, FinalCta, Footer });
