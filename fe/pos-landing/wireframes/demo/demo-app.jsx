/* Main demo entry — picks Desktop or Mobile based on viewport (with a
   manual override toggle), and handles the checkout / Hacienda flow. */

const { useState: uS, useEffect: uE } = React;

function useDevice() {
  const [device, setDevice] = uS(() => {
    if (typeof window === 'undefined') return 'desktop';
    const saved = localStorage.getItem('pos-demo-device');
    if (saved === 'mobile' || saved === 'desktop') return saved;
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  });
  uE(() => { localStorage.setItem('pos-demo-device', device); }, [device]);
  return [device, setDevice];
}

function Toast({ msg, kind, onDone }) {
  uE(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  const cls = kind === 'success' ? 'bg-success text-success-foreground' : 'bg-foreground text-background';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] toast">
      <div className={`px-4 py-2.5 rounded-md shadow-lg text-[13px] font-semibold flex items-center gap-2 ${cls}`}>
        {kind === 'success' && <I.BadgeCheck size={15}/>}
        {msg}
      </div>
    </div>
  );
}

function CheckoutModal({ cart, onClose, onConfirmed }) {
  const [step, setStep] = uS('payment'); // payment | processing | done
  const [method, setMethod] = uS('cash');
  const [tendered, setTendered] = uS(cart.total);
  const change = Math.max(0, tendered - cart.total);
  const methods = [
    ['cash', 'Efectivo', I.Banknote],
    ['card', 'Tarjeta', I.CreditCard],
    ['sinpe', 'SINPE Móvil', I.Smartphone],
  ];

  const submit = () => {
    setStep('processing');
    // Simulate Hacienda firma + envío
    setTimeout(() => setStep('done'), 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 fade-anim flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md sm:rounded-2xl bg-card border border-border shadow-2xl shadow-foreground/30 overflow-hidden rounded-t-2xl sheet-anim sm:!animate-none flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <span className="font-display font-bold text-[17px]">
            {step === 'payment' && 'Cobrar venta'}
            {step === 'processing' && 'Enviando a Hacienda'}
            {step === 'done' && '¡Venta completada!'}
          </span>
          {step !== 'processing' && (
            <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"><I.X size={16}/></button>
          )}
        </div>

        {step === 'payment' && (
          <>
            <div className="overflow-auto scroll-area">
              <div className="px-5 py-4 bg-muted/40">
                <div className="text-[10px] uppercase tracking-wider font-display font-bold text-muted-foreground">Total a cobrar</div>
                <div className="font-display font-extrabold text-[40px] leading-none mt-1 t-num text-primary">{fmt(cart.total)}</div>
                <div className="text-[12px] text-muted-foreground mt-1.5">{cart.count} ítems · {cart.docType==='FE'?'Factura electrónica':cart.docType==='TE'?'Tiquete electrónico':'Nota crédito'} · {cart.customer.name}</div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div>
                  <div className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">Método de pago</div>
                  <div className="grid grid-cols-3 gap-2">
                    {methods.map(([k,l,Ic]) => (
                      <button key={k} onClick={()=>setMethod(k)}
                        className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-md border ${method===k?'border-primary bg-primary/5 text-primary':'border-border bg-card text-muted-foreground'}`}>
                        <Ic size={18}/>
                        <span className="text-[11px] font-semibold">{l}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {method === 'cash' && (
                  <div>
                    <div className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Efectivo recibido</div>
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[cart.total, 5000, 10000, 20000].map((v,i)=>(
                        <button key={i} onClick={()=>setTendered(Math.max(cart.total, v < cart.total ? cart.total : v))} className="h-8 rounded-md border border-border bg-card text-[11px] font-mono t-num hover:border-primary/40">
                          {i===0?'Exacto':fmt(v)}
                        </button>
                      ))}
                    </div>
                    <input type="number" value={tendered} onChange={e=>setTendered(Number(e.target.value)||0)}
                      className="w-full h-11 rounded-md border border-border bg-background px-3 text-[15px] font-mono t-num focus:outline-none focus:border-primary"/>
                    <div className="flex justify-between mt-2 text-[12px]">
                      <span className="text-muted-foreground">Vuelto</span>
                      <span className="font-mono t-num font-bold">{fmt(change)}</span>
                    </div>
                  </div>
                )}
                {method === 'card' && (
                  <div className="rounded-md bg-muted/40 border border-border p-3 text-[12px] text-muted-foreground flex items-start gap-2">
                    <I.CreditCard size={14} className="mt-0.5 shrink-0"/>
                    <span>Insertá la tarjeta en el datáfono. Tsuru POS detecta automáticamente la respuesta del banco.</span>
                  </div>
                )}
                {method === 'sinpe' && (
                  <div className="rounded-md bg-muted/40 border border-border p-3 text-[12px] text-muted-foreground flex items-start gap-2">
                    <I.Smartphone size={14} className="mt-0.5 shrink-0"/>
                    <span>El cliente envía un SINPE por <strong className="text-foreground">{fmt(cart.total)}</strong> al número del comercio. Confirmás manualmente la recepción.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border bg-card">
              <button onClick={submit} className="w-full h-12 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm shadow-primary/30">
                Confirmar cobro · {fmt(cart.total)}<I.ArrowRight size={15}/>
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-muted"/>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
            </div>
            <div className="font-display font-bold text-[18px]">Firmando XML 4.4…</div>
            <div className="text-[12px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-2"><I.Check size={12} className="text-success"/>Generación de XML</div>
              <div className="flex items-center justify-center gap-2"><I.Check size={12} className="text-success"/>Firma criptográfica</div>
              <div className="flex items-center justify-center gap-2 text-foreground"><span className="status-dot-live"/>Enviando a ATV Hacienda</div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <Receipt cart={cart} method={method} change={change} tendered={tendered} onClose={onConfirmed}/>
        )}
      </div>
    </div>
  );
}

function Receipt({ cart, method, change, tendered, onClose }) {
  const consec = '00100001010000' + Math.floor(100000 + Math.random()*900000);
  const clave  = '506' + Date.now().toString().slice(-22);
  return (
    <div className="overflow-auto scroll-area">
      <div className="px-6 pt-5 pb-3 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center mb-2">
          <I.BadgeCheck size={30}/>
        </div>
        <div className="font-display font-extrabold text-[22px]">Aceptado por Hacienda</div>
        <div className="text-[11px] text-muted-foreground mt-1">Comprobante 4.4 firmado y validado</div>
      </div>
      <div className="mx-5 rounded-md border border-border bg-background p-4 font-mono text-[11px] space-y-1.5">
        <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{cart.docType==='FE'?'Factura E.':cart.docType==='TE'?'Tiquete E.':'Nota Crédito'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Consecutivo</span><span className="t-num">{consec}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Clave</span><span className="t-num truncate ml-2">{clave.slice(0,12)}…{clave.slice(-4)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="truncate ml-2">{cart.customer.name}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span>{method==='cash'?'Efectivo':method==='card'?'Tarjeta':'SINPE'}</span></div>
        <div className="border-t border-dashed border-border my-1 pt-1"/>
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="t-num">{fmt(cart.sub)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">IVA 13%</span><span className="t-num">{fmt(cart.iva)}</span></div>
        <div className="flex justify-between font-bold text-[13px] pt-1"><span>TOTAL</span><span className="t-num">{fmt(cart.total)}</span></div>
        {method==='cash' && <>
          <div className="flex justify-between"><span className="text-muted-foreground">Recibido</span><span className="t-num">{fmt(tendered)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Vuelto</span><span className="t-num">{fmt(change)}</span></div>
        </>}
      </div>
      <div className="p-5 grid grid-cols-2 gap-2">
        <button className="h-11 rounded-md border border-border bg-card text-[12px] font-semibold flex items-center justify-center gap-1.5"><I.FileText size={13}/>Enviar XML</button>
        <button className="h-11 rounded-md border border-border bg-card text-[12px] font-semibold flex items-center justify-center gap-1.5"><I.Receipt size={13}/>Imprimir tiquete</button>
        <button onClick={onClose} className="col-span-2 h-12 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
          Nueva venta<I.ArrowRight size={15}/>
        </button>
      </div>
    </div>
  );
}

/* Device override badge — small floating control for previewing both layouts. */
function DeviceSwitch({ device, setDevice }) {
  return (
    <div className="fixed top-3 right-3 z-30 flex items-center gap-1 p-1 rounded-md bg-card border border-border shadow-md text-[11px]">
      <span className="px-1.5 text-muted-foreground hidden sm:inline">Demo</span>
      <button onClick={()=>setDevice('desktop')} className={`h-7 px-2 rounded inline-flex items-center gap-1 ${device==='desktop'?'bg-foreground text-background':'text-muted-foreground'}`}>
        <I.Monitor size={11}/><span className="hidden sm:inline">Escritorio</span>
      </button>
      <button onClick={()=>setDevice('mobile')} className={`h-7 px-2 rounded inline-flex items-center gap-1 ${device==='mobile'?'bg-foreground text-background':'text-muted-foreground'}`}>
        <I.Smartphone size={11}/><span className="hidden sm:inline">Móvil</span>
      </button>
    </div>
  );
}

function App() {
  const cart = useCart();
  const [device, setDevice] = useDevice();
  const [checkout, setCheckout] = uS(false);
  const [toast, setToast] = uS(null);

  // Seed cart with one item so the demo shows a non-empty cart.
  uE(() => { if (cart.items.length === 0) cart.add(CATALOG[0]); }, []);

  const onCheckout = () => setCheckout(true);
  const onConfirmed = () => {
    setCheckout(false);
    cart.clear();
    setToast({ msg: 'Venta enviada a Hacienda · XML firmado', kind: 'success' });
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <DeviceSwitch device={device} setDevice={setDevice}/>
      {device === 'mobile' ? (
        <div className="h-full bg-foreground/5 flex items-center justify-center p-0 md:p-6">
          {/* Frame for tablet+ viewers; raw on phone */}
          <div className="h-full w-full md:w-[390px] md:h-[844px] md:rounded-[44px] md:border-[10px] md:border-foreground/85 md:shadow-2xl md:shadow-foreground/40 overflow-hidden bg-background relative">
            <PosMobile cart={cart} onCheckout={onCheckout}/>
          </div>
        </div>
      ) : (
        <PosDesktop cart={cart} onCheckout={onCheckout}/>
      )}
      {checkout && <CheckoutModal cart={cart} onClose={()=>setCheckout(false)} onConfirmed={onConfirmed}/>}
      {toast && <Toast {...toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
