import React, { useState, useEffect, useRef, Fragment, Children } from 'react';

// Utilidad para manejar nombres de clases de forma consistente si se requiriera, o para useS.
const useS = useState;

/* ===== SHARED HOOKS & UTILS ===== */

function useSEO({ title, description, canonical, noindex = false, breadcrumb = null }) {
  useEffect(() => {
    document.title = title;
    const sel = (s) => document.querySelector(s);
    const set = (el, k, v) => el && (el[k] = v);
    set(sel('meta[name="description"]'), 'content', description);
    set(sel('meta[name="robots"]'), 'content', noindex ? 'noindex,nofollow' : 'index,follow');
    set(sel('link[rel="canonical"]'), 'href', canonical);
    set(sel('meta[property="og:title"]'), 'content', title);
    set(sel('meta[property="og:description"]'), 'content', description);
    set(sel('meta[property="og:url"]'), 'content', canonical);
    set(sel('meta[name="twitter:title"]'), 'content', title);
    set(sel('meta[name="twitter:description"]'), 'content', description);

    const existing = document.getElementById('page-schema');
    if (breadcrumb) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumb.map((item, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": item.name,
          "item": item.url,
        })),
      };
      if (existing) {
        existing.textContent = JSON.stringify(schema);
      } else {
        const s = document.createElement('script');
        s.id = 'page-schema';
        s.type = 'application/ld+json';
        s.textContent = JSON.stringify(schema);
        document.head.appendChild(s);
      }
    } else if (existing) {
      existing.remove();
    }
  }, [title, description, canonical, noindex, breadcrumb]);
}

const EASE = 'cubic-bezier(0.23,1,0.32,1)'; /* Apple spring */

const REVEAL_VARIANTS = {
  up:    { hidden: 'translateY(22px)',  visible: 'none' },
  scale: { hidden: 'scale(.95) translateY(14px)', visible: 'none' },
  left:  { hidden: 'translateX(-22px)', visible: 'none' },
  right: { hidden: 'translateX(22px)',  visible: 'none' },
};

function useReveal(delay = 0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVis(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.disconnect(); } },
      { threshold: 0.06, rootMargin: '0px 0px -28px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

function Reveal({ children, delay = 0, variant = 'up', duration = 0.55, style = {}, as: Tag = 'div' }) {
  const [ref, vis] = useReveal(delay);
  const v = REVEAL_VARIANTS[variant] || REVEAL_VARIANTS.up;
  return (
    <Tag ref={ref} style={{
      ...style,
      opacity: vis ? 1 : 0,
      transform: vis ? v.visible : v.hidden,
      transition: `opacity ${duration}s ${EASE}, transform ${duration}s ${EASE}`,
    }}>
      {children}
    </Tag>
  );
}

/* Stagger automático: cada hijo aparece con delay incremental */
function RevealList({ children, stagger = 90, baseDelay = 0, variant = 'up', style = {}, itemStyle = {} }) {
  const [ref, vis] = useReveal(baseDelay);
  const v = REVEAL_VARIANTS[variant] || REVEAL_VARIANTS.up;
  const items = Children.toArray(children);
  return (
    <div ref={ref} style={style}>
      {items.map((child, i) => (
        <div key={i} style={{
          ...itemStyle,
          opacity: vis ? 1 : 0,
          transform: vis ? v.visible : v.hidden,
          transition: `opacity 0.52s ${EASE} ${i * stagger}ms, transform 0.52s ${EASE} ${i * stagger}ms`,
        }}>
          {child}
        </div>
      ))}
    </div>
  );
}

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

const BASE_PATH = window.location.pathname.startsWith('/WEBDEFINITIVA') ? '/WEBDEFINITIVA' : '';

function nav(path) {
  let fullPath = path;
  if (BASE_PATH) {
    if (!path.startsWith(BASE_PATH)) {
      fullPath = path.startsWith('/') ? `${BASE_PATH}${path}` : `${BASE_PATH}/${path}`;
    }
  }
  history.pushState(null, '', fullPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

let pendingScrollId = null;

function navSection(path, sectionId) {
  let fullPath = path;
  if (BASE_PATH) {
    if (!path.startsWith(BASE_PATH)) {
      fullPath = path.startsWith('/') ? `${BASE_PATH}${path}` : `${BASE_PATH}/${path}`;
    }
  }
  if (sectionId) {
    const currentPage = window.location.pathname;
    if (currentPage === fullPath) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    pendingScrollId = sectionId;
  }
  history.pushState(null, '', fullPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* ===== ICONS ===== */

const Icon = {
  Lung: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4v9"/><path d="M12 13c-1 4-4 7-6.5 7C3 20 3 17 3.5 14 4 10.5 6 7 9 6.5"/><path d="M12 13c1 4 4 7 6.5 7C21 20 21 17 20.5 14 20 10.5 18 7 15 6.5"/></svg>),
  Moon: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>),
  Shield: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>),
  Wave: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12c2 0 2-3 4-3s2 6 4 6 2-9 4-9 2 6 4 6 2-3 4-3"/></svg>),
  Heart: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>),
  Star: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6L12 2z"/></svg>),
  Cart: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 4h2l2.5 12h11l2-8H7"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>),
  User: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>),
  Truck: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>),
  Refresh: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 20v-4h4"/></svg>),
  Lock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  Minus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M5 12h14"/></svg>),
  Arrow: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 5 5L20 7"/></svg>),
  Chevron: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 6 6 6-6 6"/></svg>),
};

/* ===== COMPONENTE LOGO ===== */

function Logomark({ size = 28, color = "dark" }) {
  const isLight = color === "light" || color === "#fff";
  return (
    <img src="assets/brand/logo-mark.webp" width={size} height={size} alt="BeniOptions" loading="lazy"
      style={{ display: "block", objectFit: "contain", filter: isLight ? "invert(1)" : "none" }} />
  );
}

function Wordmark({ light = false, size = 28 }) {
  const ink = light ? "#fff" : "var(--bo-ink)";
  return (
    <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}
       onClick={(e) => { e.preventDefault(); nav('/'); }}>
      <Logomark size={size} color={light ? "light" : "dark"} />
      <div style={{ fontFamily: "var(--bo-font-display)", fontWeight: 700, fontSize: size * 0.72, letterSpacing: "-0.025em", color: ink, lineHeight: 1 }}>
        Beni<span style={{ color: "var(--bo-cyan)" }}>Options</span>
      </div>
    </a>
  );
}

/* ===== HEADER / NAV ===== */

function NavBar({ variant = "light", cartCount = 2 }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";
  const txt = isDark ? "rgba(255,255,255,.85)" : "var(--bo-ink-soft)";
  const bg  = isDark ? "rgba(6,22,32,.96)" : "rgba(255,255,255,.96)";
  const lk  = { color: txt, textDecoration: "none", cursor: "pointer" };
  const links = [
    ["Productos","/tienda",null],["La ciencia","/","seccion-ciencia"],["Cómo funciona","/","seccion-como-funciona"],
    ["Mi historia","/nosotros",null],["Reseñas","/","seccion-reseñas"],["Soporte","/faq",null]
  ];
  const bar = (rot, op) => ({
    display:"block", width:22, height:2, borderRadius:2,
    background:"currentColor", transition:"all .2s",
    transform: rot, opacity: op
  });
  return (
    <div style={{ position:"sticky", top:0, zIndex:100 }}>
      <header className={isDark ? "bo-glass-dark" : "bo-glass"} style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding: isMobile ? "14px 20px" : "20px 56px",
      }}>
        <Wordmark light={isDark} size={26} />
        {!isMobile && (
          <nav style={{ display:"flex", gap:36, fontSize:14, color:txt, fontWeight:500 }} aria-label="Navegación principal">
            {links.map(([l,p,s]) => <a key={l} href={p} className="bo-nav-link" style={lk} onClick={(e) => { e.preventDefault(); navSection(p,s); }}>{l}</a>)}
          </nav>
        )}
        <div style={{ display:"flex", gap:16, alignItems:"center", color:txt }}>
          {!isMobile && (
            <>
              <button aria-label="Buscar productos" style={{ background:"none", border:"none", cursor:"pointer", color:txt, padding:4, display:"grid", placeItems:"center" }}>
                <Icon.Search width="20" height="20" />
              </button>
              <button aria-label="Mi cuenta" style={{ background:"none", border:"none", cursor:"pointer", color:txt, padding:4, display:"grid", placeItems:"center" }}>
                <Icon.User width="20" height="20" />
              </button>
            </>
          )}
          <button aria-label={`Ver carrito (${cartCount} producto${cartCount !== 1 ? "s" : ""})`} onClick={() => nav('/carrito')} style={{ position:"relative", background:"none", border:"none", cursor:"pointer", color:txt, padding:4, display:"grid", placeItems:"center" }}>
            <Icon.Cart width="20" height="20" />
            <div aria-hidden="true" style={{ position:"absolute", top:-6, right:-8, width:18, height:18, borderRadius:999, background:"var(--bo-cyan)", color:"#fff", fontSize:10, fontWeight:700, display:"grid", placeItems:"center" }}>{cartCount}</div>
          </button>
          {isMobile && (
            <button onClick={() => setOpen(!open)} aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} style={{ background:"none", border:"none", cursor:"pointer", color:txt, padding:4, display:"flex", flexDirection:"column", gap:5, alignItems:"center" }}>
              <span style={bar(open ? "rotate(45deg) translate(5px,5px)" : "none", 1)} />
              <span style={bar("none", open ? 0 : 1)} />
              <span style={bar(open ? "rotate(-45deg) translate(5px,-5px)" : "none", 1)} />
            </button>
          )}
        </div>
      </header>
      {isMobile && open && (
        <div className={isDark ? "bo-glass-dark" : "bo-glass"} style={{ borderBottom:"1px solid var(--bo-line-soft)" }}>
          {links.map(([l,p,s]) => (
            <a key={l} href={p} style={{ display:"block", padding:"16px 20px", fontSize:16, fontWeight:500, color:txt, textDecoration:"none", borderBottom:"1px solid var(--bo-line-soft)", cursor:"pointer" }}
               onClick={(e) => { e.preventDefault(); navSection(p,s); setOpen(false); }}>{l}</a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== ANNOUNCEMENT / BAR ===== */

function Announcement() {
  const isMobile = useIsMobile();
  const STOCK = 47;
  const [timeLeft, setTimeLeft] = useState({ h:"00", m:"00", s:"00" });
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 0);
      const diff = Math.max(0, end - now);
      setTimeLeft({
        h: String(Math.floor(diff / 3600000)).padStart(2, "0"),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % 2), 5000);
    return () => clearInterval(id);
  }, []);

  const countdown = (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
        <Fragment key={i}>
          <span style={{ display:"inline-block", background:"rgba(255,255,255,.15)", borderRadius:4, padding:"1px 5px", fontWeight:700, letterSpacing:"0.06em", minWidth:24, textAlign:"center" }}>{v}</span>
          {i < 2 && <span style={{ opacity:.6 }}>:</span>}
        </Fragment>
      ))}
    </span>
  );

  const messages = [
    <span key="stock">
      <span style={{ color:"var(--bo-warn)" }}>&#9679;</span>
      {" "}Solo <strong>{STOCK} unidades</strong> disponibles · Pedido hoy, entrega mañana
    </span>,
    <span key="offer" style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
      Oferta termina en {countdown}
    </span>,
  ];

  return (
    <div style={{
      background:"var(--bo-ink)", color:"#fff",
      padding: isMobile ? "9px 20px" : "9px 56px",
      display:"flex", justifyContent: isMobile ? "center" : "space-between",
      alignItems:"center",
      fontSize:12, letterSpacing:"0.04em", fontFamily:"var(--bo-font-mono)",
      textAlign:"center", gap:12,
    }}>
      {isMobile ? (
        <span style={{ color:"var(--bo-cyan-bright)", transition:"opacity .4s" }}>
          {messages[msgIdx]}
        </span>
      ) : (
        <>
          <span style={{ opacity:.75 }}>ENVÍO GRATIS · PEDIDOS +30€</span>
          <span style={{ color:"var(--bo-cyan-bright)", transition:"opacity .4s" }}>
            {messages[msgIdx]}
          </span>
          <span style={{ opacity:.75 }}>GARANTÍA 30 NOCHES</span>
        </>
      )}
    </div>
  );
}

/* ===== FOOTER ===== */

function Footer() {
  const isMobile = useIsMobile();
  const px = isMobile ? "20px" : "56px";
  return (
    <footer style={{ background: "var(--bo-bg-deep)", color: "rgba(255,255,255,.7)", padding: isMobile ? "56px 20px 32px" : "80px 56px 40px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(34,183,214,.18), transparent 50%)", pointerEvents: "none" }}/>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1.4fr 1fr 1fr 1fr 1fr", gap: isMobile ? 32 : 48 }}>
        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
          <Wordmark light size={28} />
          <p style={{ marginTop: 20, fontSize: 14, lineHeight: 1.65, maxWidth: 280 }}>
            Productos respiratorios diseñados para que despiertes descansado, con energía real y un sueño que repara.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            {[
              { label: "Instagram", abbr: "IG", href: "https://www.instagram.com/benioptions" },
              { label: "TikTok",    abbr: "TT", href: "https://www.tiktok.com/@benioptions" },
              { label: "YouTube",   abbr: "YT", href: "https://www.youtube.com/@benioptions" },
              { label: "Facebook",  abbr: "FB", href: "https://www.facebook.com/benioptions" },
            ].map(({ label, abbr, href }) => (
              <a key={abbr} href={href} target="_blank" rel="noopener noreferrer" aria-label={`BeniOptions en ${label}`}
                className="bo-social-link"
                style={{ width: 36, height: 36, borderRadius: 999, border: "1px solid rgba(255,255,255,.15)", display: "grid", placeItems:"center", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.7)", textDecoration: "none" }}>
                {abbr}
              </a>
            ))}
          </div>
        </div>
        {[
          ["Tienda",   [["Cintas bucales","/tienda"],["Tiras nasales","/tienda"],["Packs ahorro","/tienda"],["Recambios","/tienda"]]],
          ["Aprende",  [["La ciencia","/"],["Blog del sueño","/"],["FAQ","/faq"]]],
          ["Empresa",  [["Sobre BeniOptions","/nosotros"],["Afiliados","/"],["Prensa","/"]]],
          ["Soporte",  [["Envíos","/faq"],["Devoluciones","/faq"],["Contacto","/faq"]]],
        ].map(([title, links]) => (
          <div key={title}>
            <div style={{ fontFamily: "var(--bo-font-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--bo-cyan-bright)", marginBottom: 14 }}>{title}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {links.map(([l, href]) => (
                <li key={l}><a href={href} style={{ fontSize: 14, color: "rgba(255,255,255,.7)", textDecoration: "none", cursor: "pointer" }} onClick={(e) => { e.preventDefault(); nav(href); }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 8, fontSize: 12, color: "rgba(255,255,255,.5)" }}>
        <span>© 2026 BeniOptions S.L. · Madrid, España</span>
        <span>Política de privacidad · Términos · Cookies · Aviso legal</span>
      </div>
    </footer>
  );
}

/* ===== STARS ===== */

function Stars({ value = 5, size = 14, color = "var(--bo-gold)" }) {
  return (
    <div style={{ display: "inline-flex", gap: 2, color }}>
      {Array.from({ length: 5 }, (_, i) => <Icon.Star key={i} width={size} height={size} style={{ opacity: i < value ? 1 : 0.2 }} />)}
    </div>
  );
}

/* ===== TRUST BAR ===== */

function TrustBar() {
  const isMobile = useIsMobile();
  const items = [[Icon.Truck,"Envío gratis +30€"],[Icon.Refresh,"30 noches de prueba"],[Icon.Shield,"Hipoalergénico testado"],[Icon.Lock,"Pago 100% seguro"]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", borderTop: "1px solid var(--bo-line-soft)", borderBottom: "1px solid var(--bo-line-soft)", background: "var(--bo-bg-pure)" }}>
      {items.map(([Ic, label], i) => (
        <div key={i} className="bo-trust-item" style={{ padding: isMobile ? "16px 14px" : "22px 28px", display: "flex", alignItems: "center", gap: 10, color: "var(--bo-ink-soft)", borderRight: (!isMobile && i < 3) || (isMobile && i % 2 === 0) ? "1px solid var(--bo-line-soft)" : "none", borderBottom: isMobile && i < 2 ? "1px solid var(--bo-line-soft)" : "none", fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>
          <Ic width="20" height="20" style={{ color: "var(--bo-cyan)", flexShrink: 0 }} />{label}
        </div>
      ))}
    </div>
  );
}

/* ===== ACCORDION ===== */

function Accordion({ items, accentColor = "var(--bo-cyan)" }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ border:"1px solid var(--bo-line-soft)", borderRadius:16, overflow:"hidden" }}>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: i < items.length-1 ? "1px solid var(--bo-line-soft)" : "none" }}>
          <button
            className="bo-accordion-trigger"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"#fff", border:"none", cursor:"pointer", textAlign:"left", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {item.icon && <span style={{ color: accentColor, flexShrink:0 }}>{item.icon}</span>}
              <span style={{ fontWeight:600, fontSize:15, color:"var(--bo-ink)" }}>{item.title}</span>
            </div>
            <Icon.Chevron width="16" height="16"
              style={{ color:"var(--bo-ink-mute)", flexShrink:0, transition:"transform .28s ease",
                transform: open === i ? "rotate(90deg)" : "none" }}/>
          </button>
          <div className={"bo-accordion-body " + (open === i ? "open" : "closed")}>
            <div style={{ padding:"4px 20px 20px 20px", fontSize:14, color:"var(--bo-ink-soft)", lineHeight:1.7 }}>
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== BADGES & TABLE ===== */

function AmazonBadge() {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:6, background:"#FF9900", fontSize:9, fontWeight:700, letterSpacing:"0.06em", color:"#111", fontFamily:"var(--bo-font-mono)", flexShrink:0 }}>
      &#9733; AMAZON.ES
    </div>
  );
}

function ProductCompare({ isMobile }) {
  const rows = [
    { label:"Mecanismo de acción",    cinta:"Cierre labial suave — redirige el flujo de aire a la vía nasal",   tira:"Levantamiento mecánico de las fosas nasales — amplía el paso de aire" },
    { label:"Zona de aplicación",     cinta:"Labios",                                                             tira:"Puente nasal exterior" },
    { label:"Problema principal",     cinta:"Respiración bucal nocturna, ronquidos leves-moderados",              tira:"Congestión nasal, ronquidos por resistencia nasal, rendimiento deportivo" },
    { label:"Material",               cinta:"Fibra transpirable hipoalergénica, adhesivo médico sin latex",       tira:"Bandas elásticas de resorte, lámina flexible sin fragancia" },
    { label:"Efectividad medida",     cinta:"−42% de ronquidos en 4 semanas (estudio interno, n=412)",            tira:"Hasta +60% de flujo aéreo nasal vs. sin tira (datos clínicos publicados)" },
    { label:"Duración por uso",       cinta:"Hasta 9 horas",                                                      tira:"Hasta 12 horas" },
    { label:"Ideal para",             cinta:"Respiradores bucales, boca seca, sueño ligero",                      tira:"Congestión, deporte, ronquidos severos, apnea leve" },
  ];
  const thStyle = { padding: isMobile ? "10px 12px" : "14px 20px", fontSize: isMobile ? 11 : 13, fontWeight:700, textAlign:"left", fontFamily:"var(--bo-font-mono)", letterSpacing:"0.1em", textTransform:"uppercase" };
  const tdStyle = { padding: isMobile ? "12px 12px" : "16px 20px", fontSize: isMobile ? 12 : 14, color:"var(--bo-ink-soft)", lineHeight:1.5, verticalAlign:"top", borderTop:"1px solid var(--bo-line-soft)" };
  return (
    <Reveal>
      <div className="bo-eyebrow" style={{ marginBottom:14, textAlign:"center" }}>Comparativa técnica</div>
      <h2 style={{ fontSize: isMobile ? 28 : 48, textAlign:"center", marginBottom: isMobile ? 24 : 40 }}>
        Elige el que resuelve <span style={{ color:"var(--bo-cyan-deep)" }}>tu problema exacto.</span>
      </h2>
      <div style={{ overflowX:"auto", borderRadius:20, border:"1px solid var(--bo-line-soft)", background:"#fff" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth: isMobile ? 560 : "auto" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, background:"var(--bo-bg-soft)", color:"var(--bo-ink-mute)", width: isMobile ? 120 : 180 }}>Característica</th>
              <th style={{ ...thStyle, background:"var(--bo-cyan-tint)", color:"var(--bo-cyan-deep)" }}>
                Cintas Bucales Premium<br/>
                <span style={{ fontSize:9, fontWeight:400, opacity:.7 }}>ASIN B0DT4VTQ93</span>
              </th>
              <th style={{ ...thStyle, background:"var(--bo-bg-soft)", color:"var(--bo-ink)" }}>
                Tiras Nasales Premium<br/>
                <span style={{ fontSize:9, fontWeight:400, opacity:.7 }}>ASIN B0F4KHSJFG</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} style={{ background: i%2===0 ? "#fff" : "rgba(235,248,251,.35)" }}>
                <td style={{ ...tdStyle, fontWeight:600, color:"var(--bo-ink)", fontSize: isMobile ? 11 : 13 }}>{r.label}</td>
                <td style={{ ...tdStyle, color:"var(--bo-cyan-deep)" }}>{r.cinta}</td>
                <td style={{ ...tdStyle }}>{r.tira}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}

/* ===== BUNDLE BLOCK ===== */

function BundleBlock({ isMobile }) {
  return (
    <Reveal variant="scale">
      <div style={{ borderRadius: isMobile ? 20 : 28, background:"linear-gradient(135deg,var(--bo-ink) 0%,#1A3A4A 100%)", color:"#fff", padding: isMobile ? "32px 24px" : "52px 56px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(34,183,214,.25),transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 28 : 56, alignItems:"center" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999, background:"rgba(196,154,92,.25)", border:"1px solid rgba(196,154,92,.4)", marginBottom:20 }}>
              <span style={{ color:"var(--bo-gold)", fontSize:10, fontFamily:"var(--bo-font-mono)", letterSpacing:"0.16em", fontWeight:700 }}>PACK COMBINADO RECOMENDADO</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 26 : 42, color:"#fff", marginBottom:16, lineHeight:1.1 }}>
              Para ronquidos severos: usa <span style={{ color:"var(--bo-cyan-bright)" }}>los dos.</span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color:"rgba(255,255,255,.75)", lineHeight:1.65, marginBottom:24 }}>
              Las cintas bucales sellan la boca para forzar la respiración nasal. Las tiras nasales amplían las fosas para que ese aire fluya sin resistencia. Juntos eliminan el origen del ronquido desde ambos lados del problema.
            </p>
            <ul style={{ listStyle:"none", padding:0, margin:"0 0 28px", display:"grid", gap:12 }}>
              {[
                "Acción dual: boca cerrada + nariz abierta",
                "Reduce ronquidos un 60–80% en las primeras 2 semanas",
                "Compatible con cualquier posición al dormir",
                "Sin efectos secundarios ni dependencia",
              ].map((t,i) => (
                <li key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize: isMobile ? 13 : 15, color:"rgba(255,255,255,.85)" }}>
                  <span style={{ flexShrink:0, width:20, height:20, borderRadius:999, background:"var(--bo-cyan)", display:"grid", placeItems:"center", marginTop:1 }}>
                    <Icon.Check width="11" height="11" style={{ color:"#fff" }}/>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <button className="bo-btn bo-bundle-cta" onClick={() => nav('/tienda')}
              style={{ background:"var(--bo-cyan)", color:"#fff", padding: isMobile ? "14px 24px" : "17px 32px", fontSize: isMobile ? 14 : 16, width: isMobile ? "100%" : "auto", justifyContent:"center" }}>
              Ver Pack Combinado <Icon.Arrow width="17" height="17"/>
            </button>
          </div>
          <div style={{ display:"grid", gap:16 }}>
            {[
              { img:"assets/products/cintas-bucales-pack.webp", name:"Cintas Bucales Premium", price:"24,90€", tag:"Boca" },
              { img:"assets/products/tiras-pack.webp",          name:"Tiras Nasales Premium",  price:"19,90€", tag:"Nariz" },
            ].map((p,i) => (
              <div key={i} style={{ display:"flex", gap:16, alignItems:"center", padding:"14px 18px", borderRadius:14, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)" }}>
                <div style={{ width:64, height:64, borderRadius:10, background:"var(--bo-cyan-tint)", display:"grid", placeItems:"center", flexShrink:0 }}>
                  <img src={p.img} alt={p.name} loading="lazy" style={{ maxWidth:"80%", maxHeight:"80%", objectFit:"contain" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, fontFamily:"var(--bo-font-mono)", color:"var(--bo-cyan-bright)", letterSpacing:"0.14em", marginBottom:4 }}>ACCIÓN — {p.tag.toUpperCase()}</div>
                  <div style={{ fontWeight:600, fontSize: isMobile ? 13 : 15, color:"#fff" }}>{p.name}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:2 }}>{p.price} / paquete</div>
                </div>
                <div style={{ padding:"4px 10px", borderRadius:999, background:"rgba(34,183,214,.2)", border:"1px solid rgba(34,183,214,.35)", fontSize:11, fontWeight:700, color:"var(--bo-cyan-bright)", fontFamily:"var(--bo-font-mono)" }}>+</div>
              </div>
            ))}
            <div style={{ padding:"14px 18px", borderRadius:14, background:"rgba(196,154,92,.15)", border:"1px solid rgba(196,154,92,.3)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, color:"rgba(255,255,255,.7)" }}>Pack combinado desde</span>
              <span style={{ fontFamily:"var(--bo-font-display)", fontSize: isMobile ? 22 : 26, fontWeight:700, color:"var(--bo-gold)" }}>44,80€</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ===== WAVE BACKGROUND ===== */

function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const WAVES = [
      { r:8,  g:72,  b:100, amp:110, freq:0.0028, speed:0.9,  yc:0.30, op:0.82 },
      { r:12, g:100, b:135, amp:85,  freq:0.0042, speed:-0.65, yc:0.52, op:0.70 },
      { r:6,  g:55,  b:80,  amp:140, freq:0.0018, speed:1.3,  yc:0.72, op:0.75 },
      { r:18, g:120, b:160, amp:65,  freq:0.0058, speed:-1.0, yc:0.42, op:0.55 },
    ];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      WAVES.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w + 4; x += 4) {
          const y = wave.yc * h
            + Math.sin(x * wave.freq + t * wave.speed) * wave.amplitude
            + Math.sin(x * wave.freq * 2.1 + t * wave.speed * 0.7) * (wave.amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0,   `rgba(${wave.r},${wave.g},${wave.b},0)`);
        grad.addColorStop(0.4, `rgba(${wave.r},${wave.g},${wave.b},${wave.op})`);
        grad.addColorStop(1,   `rgba(${wave.r},${wave.g},${wave.b},${wave.op})`);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      t += 0.018;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', mixBlendMode: 'multiply',
      }}
    />
  );
}

/* ===== HERO VIDEO COMPONENT ===== */

function HeroVideo() {
  const videoRef = useRef(null);
  const [faded, setFaded] = useState(false);
  const isMobile = useIsMobile();

  const supportsVP9 = useRef(
    typeof document !== 'undefined' &&
    document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== ''
  ).current;

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.play().catch(() => {});
    /* Empieza a desvanecerse cuando aparecen las palabras principales */
    const t = setTimeout(() => setFaded(true), isMobile ? 1200 : 800);
    return () => clearTimeout(t);
  }, [isMobile]);

  return (
    <video
      ref={videoRef}
      autoPlay muted playsInline
      webkit-playsinline="true"
      preload="auto"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        opacity: faded ? 0 : 1,
        transition: 'opacity 1.4s ease-out',
        pointerEvents: 'none',
        transform: isMobile ? 'scale(1.58)' : 'none',
        transformOrigin: 'center center',
        ...(supportsVP9 ? {} : { mixBlendMode: 'multiply' }),
      }}
    >
      {supportsVP9 && <source src="assets/lifestyle/mp_alpha.webm" type="video/webm" />}
      <source src="assets/lifestyle/mp_.mp4" type="video/mp4" />
    </video>
  );
}

/* ===== PAGE: HOME ===== */

function HomeA() {
  const isMobile = useIsMobile();
  const px = isMobile ? "20px" : "56px";
  useSEO({
    title: "BeniOptions — Cintas Bucales y Tiras Nasales para Dormir Mejor",
    description: "Cintas bucales y tiras nasales premium para dormir profundo, dejar de roncar y respirar bien. Garantía 30 noches sin riesgo. +34.000 clientes satisfechos.",
    canonical: "https://www.benioptions.es/",
  });
  return (
    <div className="bo-root" style={{ background: "var(--bo-bg)" }}>

      {/* ── ONDAS AZULES: fondo animado en toda la página ── */}
      <WaveBackground />

      <Announcement />
      <NavBar />

      {/* ── HERO: vídeo explosión de fondo → título y producto animados ── */}
      <section style={{
        position: "relative",
        minHeight: isMobile ? "auto" : "92vh",
        background: "linear-gradient(160deg, rgba(255,255,255,0.68) 0%, rgba(223,243,249,0.62) 55%, rgba(200,236,246,0.58) 100%)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}>
        {/* Acento radial cian en esquina superior derecha */}
        <div style={{ position: "absolute", top: -180, right: -120, width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,183,214,.22), transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Vídeo explosión producto */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <HeroVideo />
        </div>

        {/* Gradiente lateral izquierdo: garantiza legibilidad del texto */}
        {!isMobile && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: "58%",
            background: "linear-gradient(to right, rgba(255,255,255,0.96) 45%, rgba(220,243,250,0.6) 75%, transparent 100%)",
            zIndex: 2, pointerEvents: "none",
          }} />
        )}
        {isMobile && (
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, rgba(240,251,254,0.2) 0%, rgba(240,251,254,0.72) 80%)",
            zIndex: 2, pointerEvents: "none"
          }} />
        )}

        {/* Grid: texto (izq) | imagen producto (dcha) */}
        <div style={{
          position: "relative", zIndex: 3,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 32 : 72,
          alignItems: "center",
          maxWidth: 1440, margin: "0 auto",
          padding: isMobile ? "88px 20px 64px" : "80px 56px",
          width: "100%",
        }}>

          {/* TEXTO: animación escalonada tras la explosión */}
          <div>
            <Reveal delay={700}>
              <div className="bo-hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "var(--bo-cyan-tint)", color: "var(--bo-cyan-deep)", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--bo-cyan)" }} />
                Avalado por más de 12.400 noches reales
              </div>
            </Reveal>
            <Reveal delay={950} variant="up">
              <h1 className="bo-hero-h1" style={{ fontSize: isMobile ? 42 : 72, lineHeight: isMobile ? 1.08 : 1.02, marginBottom: 20 }}>
                Duerme profundo.<br />
                Despierta{" "}
                <span style={{ fontStyle: "italic", fontWeight: 500 }}>renovado.</span>
              </h1>
            </Reveal>
            <Reveal delay={1150}>
              <p className="bo-hero-sub" style={{ fontSize: isMobile ? 16 : 19, color: "var(--bo-ink-mute)", maxWidth: 480, marginBottom: 20, lineHeight: 1.55 }}>
                Cintas bucales y tiras nasales premium para volver a respirar bien por la nariz, dejar de roncar y dormir profundo de verdad.
              </p>
              <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: "var(--bo-cyan-deep)", marginBottom: 28, letterSpacing: "0.01em" }}>
                Empieza esta noche. Nota la diferencia mañana.
              </p>
            </Reveal>
            <Reveal delay={1550}>
              <div className="bo-hero-social" style={{ display: "flex", gap: isMobile ? 16 : 32, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <Stars value={5} size={16} />
                  <div style={{ fontSize: 13, color: "var(--bo-ink-mute)", marginTop: 4 }}><strong style={{ color: "var(--bo-ink)" }}>4.8/5</strong> · 2.847 reseñas</div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--bo-line)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex" }}>
                    {[{i:"JM",c:"linear-gradient(135deg,#2A4A5E,#0B1F2A)"},{i:"CR",c:"linear-gradient(135deg,#D9B89C,#9F8267)"},{i:"LP",c:"linear-gradient(135deg,#4A6B7C,#1F3848)"},{i:"AV",c:"linear-gradient(135deg,#C09A7E,#7A5A45)"},{i:"MS",c:"linear-gradient(135deg,#5A7B8C,#2C4859)"}].map((a,i) => (
                      <div key={i} style={{ width: 32, height: 32, borderRadius: 999, background: a.c, border: "2px solid #fff", marginLeft: i > 0 ? -10 : 0, display: "grid", placeItems: "center", fontFamily: "var(--bo-font-mono)", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.92)", boxShadow: "0 2px 6px rgba(11,31,42,.18)" }}>{a.i}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                    <strong style={{ color: "var(--bo-ink)", fontSize: 14 }}>+34.000 clientes</strong>
                    <span style={{ fontSize: 12, color: "var(--bo-ink-mute)" }}>durmiendo mejor</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* IMAGEN PRODUCTO: animación float + glow cian con botón de tienda */}
          <Reveal delay={1400} variant="scale" duration={2.2}>
            <div
              className="bo-hero-product"
              style={{
                position: "relative",
                width: isMobile ? "90%" : "100%",
                maxWidth: isMobile ? 340 : 560,
                margin: "0 auto",
                marginTop: isMobile ? 0 : "-70px",
              }}
            >
              <img
                src="assets/hero-product-nobg.png"
                alt="BeniOptions — Tiras Nasales Magnéticas"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  cursor: "pointer",
                }}
                onClick={() => nav('/tienda')}
              />
              <button
                className="bo-btn bo-btn-cyan"
                style={{
                  position: "absolute",
                  bottom: isMobile ? "8%" : "12%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  boxShadow: "var(--bo-shadow-lg)",
                  fontSize: isMobile ? 12 : 14,
                  padding: isMobile ? "8px 16px" : "12px 24px",
                  zIndex: 5,
                  letterSpacing: "-0.01em",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  nav('/tienda');
                }}
              >
                Ver Tienda
                <Icon.Arrow width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <TrustBar />

      {/* MEDIOS */}
      <section style={{ padding: isMobile ? "32px 20px" : "44px 56px", textAlign: "center", background: "linear-gradient(180deg,rgba(235,248,252,0.70) 0%,rgba(223,243,249,0.70) 100%)", overflow: "hidden" }}>
        <Reveal>
          <div className="bo-eyebrow" style={{ marginBottom: 16 }}>De confianza para profesionales del descanso</div>
          <div style={{ display: "flex", justifyContent: isMobile ? "flex-start" : "space-around", alignItems: "center", opacity: .55, maxWidth: 1328, margin: "0 auto", gap: isMobile ? 28 : 0, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 4 : 0 }}>
            {["EL PAÍS","RUNNER'S WORLD","Men's Health","La Vanguardia","SLEEP REVIEW","COSMOPOLITAN"].map(l => (
              <div key={l} style={{ fontFamily: "var(--bo-font-display)", fontWeight: 800, fontSize: isMobile ? 14 : 18, letterSpacing: "0.05em", color: "var(--bo-ink-soft)", whiteSpace: "nowrap", flexShrink: 0 }}>{l}</div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ANTES / DESPUÉS */}
      <section style={{ padding: isMobile ? "60px 20px" : "100px 56px", background: "linear-gradient(180deg,rgba(223,243,249,0.70) 0%,rgba(232,245,250,0.70) 100%)" }}>
        <Reveal style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
          <div className="bo-eyebrow" style={{ marginBottom: 14 }}>El problema silencioso</div>
          <h2 className="bo-section-h2" style={{ fontSize: isMobile ? 34 : 56, maxWidth: 800, margin: "0 auto" }}>Dormir 8 horas no sirve si <span style={{ color: "var(--bo-cyan-deep)" }}>respiras mal</span>.</h2>
        </Reveal>
        <Reveal delay={120} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1140, margin: "0 auto" }}>
          {[
            { tag:"ANTES", cyan:false, title:"Respirar por la boca toda la noche", points:["Boca seca, mal aliento al despertar","Ronquidos que arruinan el sueño de tu pareja","Cansancio aunque hayas dormido 8h","Niebla mental, irritabilidad, baja energía"] },
            { tag:"DESPUÉS", cyan:true, title:"Respirar por la nariz como debe ser", points:["Boca hidratada, aliento neutro","Silencio: tú y tu pareja descansáis","Despiertas con energía real, sin alarmas","Mente clara, foco y mejor estado de ánimo"] },
          ].map((col,i) => (
            <div key={i} style={{ padding: isMobile ? "28px 24px" : "44px 40px", borderRadius: 24, background: col.cyan ? "linear-gradient(160deg,var(--bo-cyan-tint),#fff)" : "var(--bo-bg-soft)", border: col.cyan ? "1px solid var(--bo-cyan-soft)" : "1px solid var(--bo-line-soft)" }}>
              <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, background: col.cyan ? "var(--bo-cyan)" : "var(--bo-ink)", color: "#fff", fontSize: 11, fontFamily: "var(--bo-font-mono)", letterSpacing: "0.16em", marginBottom: 20 }}>{col.tag}</div>
              <h3 style={{ fontSize: isMobile ? 22 : 30, marginBottom: 20 }}>{col.title}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {col.points.map((p,j) => (
                  <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: isMobile ? 15 : 16, color: "var(--bo-ink-soft)" }}>
                    <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: col.cyan ? "var(--bo-cyan)" : "rgba(11,31,42,.15)", color: "#fff", display: "grid", placeItems: "center", marginTop: 2 }}>
                      {col.cyan ? <Icon.Check width="14" height="14" /> : <span style={{ fontWeight: 700, fontSize: 12 }}>—</span>}
                    </div>{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </section>

      {/* PRODUCTOS */}
      <section id="seccion-productos" style={{ padding: isMobile ? "60px 20px" : "100px 56px", background: "linear-gradient(180deg,rgba(232,245,250,0.70) 0%,rgba(216,239,247,0.70) 100%)" }}>
        <Reveal style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 0, marginBottom: isMobile ? 32 : 56, maxWidth: 1328, margin: isMobile ? "0 0 32px" : "0 auto 56px" }}>
          <div>
            <div className="bo-eyebrow" style={{ marginBottom: 12 }}>Catálogo BeniOptions</div>
            <h2 className="bo-section-h2" style={{ fontSize: isMobile ? 34 : 56, maxWidth: 600 }}>Tres formas de respirar bien.</h2>
          </div>
          <a href="/tienda" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, color: "var(--bo-cyan-deep)", textDecoration: "none", cursor: "pointer", fontSize: 14 }} onClick={(e) => { e.preventDefault(); nav('/tienda'); }}>
            Ver toda la tienda <Icon.Arrow width="16" height="16" />
          </a>
        </Reveal>
        <RevealList stagger={100} variant="scale"
          style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 24 : 24, maxWidth: 1328, margin: "0 auto" }}>
          {[
            { img:"assets/products/cintas-bucales-pack.webp", tag:"MÁS VENDIDO", name:"Cintas Bucales Premium", desc:"Adiós a respirar por la boca. Adhesivo hipoalergénico, 30 noches.", price:"24,90", was:"32,90", color:"var(--bo-cyan)" },
            { img:"assets/products/tiras-pack.webp", tag:"NUEVO", name:"Tiras Nasales", desc:"Abren las fosas nasales suavemente. Más oxígeno, sueño y deporte.", price:"19,90", was:null, color:"var(--bo-cyan-deep)" },
            { img:"assets/products/magneticas-pack.webp", tag:"PREMIUM", name:"Tiras Nasales Magnéticas", desc:"Sistema magnético reutilizable. 30 recambios incluidos.", price:"34,90", was:"44,90", color:"var(--bo-gold)" },
          ].map((p,i) => (
            <article key={i} className="bo-card" style={{ background: "var(--bo-bg-pure)", borderRadius: isMobile ? 16 : 24, overflow: "hidden", border: "1px solid var(--bo-line-soft)" }}>
              <a href="/producto" aria-label={`Ver ${p.name}`} onClick={(e) => { e.preventDefault(); nav('/producto'); }} style={{ display:"block", textDecoration:"none", color:"inherit" }}>
                <div style={{ height: isMobile ? 200 : 320, position: "relative", background: "linear-gradient(180deg,var(--bo-cyan-tint),#fff)", display: "grid", placeItems: "center" }}>
                  <div style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 999, background: p.color, color: "#fff", fontSize: 9, fontFamily: "var(--bo-font-mono)", letterSpacing: "0.14em", fontWeight: 600 }}>{p.tag}</div>
                  <img src={p.img} alt={p.name} loading="lazy" style={{ maxHeight: "78%", maxWidth: "78%", objectFit: "contain" }} />
                </div>
                <div style={{ padding: isMobile ? 14 : 28 }}>
                  <h3 style={{ fontSize: isMobile ? 15 : 22, marginBottom: 6 }}>{p.name}</h3>
                  {!isMobile && <p style={{ fontSize: 14, color: "var(--bo-ink-mute)", marginBottom: 20, minHeight: 42 }}>{p.desc}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: isMobile ? 10 : 0, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, fontFamily: "var(--bo-font-display)" }}>{p.price}€</span>
                      {p.was && !isMobile && <span style={{ fontSize: 14, color: "var(--bo-ink-faint)", textDecoration: "line-through", marginLeft: 8 }}>{p.was}€</span>}
                    </div>
                    <button aria-label={`Añadir ${p.name} al carrito`} className="bo-btn bo-btn-cyan" style={{ padding: isMobile ? "8px 12px" : "10px 16px", fontSize: isMobile ? 12 : 13 }} onClick={e => { e.preventDefault(); e.stopPropagation(); nav('/carrito'); }}>
                      <Icon.Plus width="12" height="12" />
                    </button>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </RevealList>
      </section>

      {/* COMPARATIVA TÉCNICA */}
      <section style={{ padding: isMobile ? "60px 20px" : "100px 56px", background: "linear-gradient(160deg,rgba(216,239,247,0.70) 0%,rgba(228,246,251,0.70) 100%)" }}>
        <div style={{ maxWidth: 1328, margin: "0 auto" }}>
          <ProductCompare isMobile={isMobile}/>
        </div>
      </section>

      {/* BUNDLE */}
      <section style={{ padding: isMobile ? "0 20px 60px" : "0 56px 100px", background: "linear-gradient(180deg,rgba(228,246,251,0.70) 0%,rgba(223,243,249,0.70) 100%)" }}>
        <div style={{ maxWidth: 1328, margin: "0 auto" }}>
          <BundleBlock isMobile={isMobile}/>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="seccion-como-funciona" style={{ padding: isMobile ? "60px 20px" : "100px 56px", background: "linear-gradient(180deg,rgba(223,243,249,0.70) 0%,rgba(235,248,252,0.70) 100%)" }}>
        <Reveal style={{ textAlign: "center", marginBottom: isMobile ? 48 : 72 }}>
          <div className="bo-eyebrow" style={{ marginBottom: 14 }}>Cómo funciona</div>
          <h2 style={{ fontSize: isMobile ? 34 : 56 }}>Cuatro pasos. Una mejor noche.</h2>
        </Reveal>
        <Reveal delay={100} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 32 : 0, maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          {!isMobile && <div style={{ position: "absolute", top: 56, left: "12%", right: "12%", height: 2, background: "repeating-linear-gradient(90deg,var(--bo-cyan) 0 6px,transparent 6px 14px)", zIndex: 0 }} />}
          {[{n:"01",t:"Limpia tus labios",d:"Asegúrate de que tu boca esté limpia y seca."},{n:"02",t:"Despega la cinta",d:"Separa la cinta del papel con cuidado."},{n:"03",t:"Coloca y presiona",d:"Aplícala sobre los labios y presiona suave."},{n:"04",t:"Duerme profundo",d:"Disfruta de una noche reparadora de verdad."}].map((s,i) => (
            <div key={i} style={{ position: "relative", zIndex: 1, textAlign: "center", padding: isMobile ? "0 8px" : "0 16px" }}>
              <div style={{ width: isMobile ? 72 : 112, height: isMobile ? 72 : 112, borderRadius: "50%", background: "rgba(220,243,250,0.7)", border: "2px solid var(--bo-cyan)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontFamily: "var(--bo-font-display)", fontSize: isMobile ? 22 : 34, fontWeight: 700, color: "var(--bo-cyan-deep)" }}>{s.n}</div>
              <h4 style={{ fontSize: isMobile ? 15 : 20, marginBottom: 8 }}>{s.t}</h4>
              <p style={{ fontSize: isMobile ? 13 : 14, color: "var(--bo-ink-mute)" }}>{s.d}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* CIENCIA */}
      <section id="seccion-ciencia" style={{ padding: isMobile ? "60px 20px" : "100px 56px", background: "var(--bo-bg-deep)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 50%,rgba(34,183,214,.28),transparent 55%)", pointerEvents: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80, alignItems: "center", position: "relative", maxWidth: 1328, margin: "0 auto" }}>
          <Reveal variant="left">
            <div className="bo-eyebrow" style={{ marginBottom: 14, color: "var(--bo-cyan-bright)" }}>La ciencia detrás</div>
            <h2 style={{ fontSize: isMobile ? 32 : 52, color: "#fff", marginBottom: 20 }}>Respirar por la nariz no es opcional.<br />Es <span style={{ color: "var(--bo-cyan-bright)" }}>fisiología.</span></h2>
            <p style={{ fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,.72)", marginBottom: 28, maxWidth: 480 }}>La respiración nasal filtra, calienta y humidifica el aire, y produce óxido nítrico, un vasodilatador natural que mejora la oxigenación celular durante el sueño.</p>
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 14 }}>
              {[["+27%","más oxígeno vs. respiración bucal*"],["−42%","reducción de ronquidos en 4 semanas**"],["+38%","tiempo en sueño profundo medido por banda***"]].map(([n,t],i) => (
                <li key={i} style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ fontFamily: "var(--bo-font-display)", fontSize: isMobile ? 30 : 38, fontWeight: 700, color: "var(--bo-cyan-bright)", minWidth: isMobile ? 80 : 100 }}>{n}</div>
                  <div style={{ fontSize: isMobile ? 14 : 15, color: "rgba(255,255,255,.85)" }}>{t}</div>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 20 }}>*Lundberg JO, Settergren G — Karolinska Institute. **Estudio interno BeniOptions, n=412. ***Datos auto-reportados WHOOP/Oura.</p>
          </Reveal>
          <Reveal delay={120} variant="right" style={{ position: "relative" }}>
            <img src={"assets/lifestyle/cintas-mujer-durmiendo.webp"} alt="Mujer durmiendo profundamente con cinta bucal BeniOptions" loading="lazy" style={{ width: "100%", borderRadius: 20, filter: "saturate(.85)" }} />
            <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: 16, borderRadius: 14, background: "rgba(11,31,42,.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.1)", display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--bo-cyan)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon.Heart width="20" height="20" /></div>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>Aval médico</div>
                <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600 }}>Dra. Marina Vilanova · Neumóloga</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginTop: 2 }}>Consejo asesor BeniOptions</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="seccion-reseñas" style={{ padding: isMobile ? "60px 20px" : "100px 56px", background: "linear-gradient(160deg,rgba(235,248,252,0.70) 0%,rgba(223,243,249,0.70) 100%)" }}>
        <Reveal style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
          <div className="bo-eyebrow" style={{ marginBottom: 14 }}>Reseñas verificadas</div>
          <h2 style={{ fontSize: isMobile ? 32 : 56 }}>2.847 personas durmiendo mejor.</h2>
        </Reveal>
        <RevealList
          stagger={110} variant="scale"
          style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 16 : 24, maxWidth: 1328, margin: "0 auto" }}
        >
          {[
            { name:"Carmen R.", age:52, days:"47 noches", text:"Llevaba años despertándome con la boca como un desierto. La primera noche con BeniOptions ya noté la diferencia. Mi marido tampoco me ha vuelto a dar codazos por roncar.", rating:5 },
            { name:"Javier M.", age:58, days:"92 noches", text:"Soy escéptico de naturaleza, pero los datos de mi Oura no mienten. Mi sueño profundo ha subido un 30%. Producto serio, calidad de farmacia.", rating:5 },
            { name:"Lourdes P.", age:49, days:"21 noches", text:"Las tiras nasales son un descubrimiento. Tenía la nariz siempre congestionada por la noche y ahora respiro perfectamente. Despierto descansada.", rating:5 },
          ].map((t,i) => (
            <article key={i} className="bo-card" style={{ padding: isMobile ? 22 : 32, borderRadius: 20, background: "rgba(215,240,250,0.55)", border: "1px solid rgba(34,183,214,0.18)" }}>
              <Stars value={t.rating} size={14} />
              <p style={{ fontSize: isMobile ? 15 : 17, lineHeight: 1.55, color: "var(--bo-ink)", margin: "16px 0 20px" }}>"{t.text}"</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--bo-line-soft)", paddingTop: 14 }}>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}, {t.age}</div><div style={{ fontSize: 12, color: "var(--bo-ink-mute)", marginTop: 2 }}>Cliente verificado</div></div>
                <div style={{ fontSize: 12, fontFamily: "var(--bo-font-mono)", color: "var(--bo-cyan-deep)" }}>{t.days} usando</div>
              </div>
            </article>
          ))}
        </RevealList>
      </section>

      {/* MI HISTORIA */}
      <section style={{ padding: isMobile ? "60px 20px" : "120px 56px", background: "linear-gradient(180deg,rgba(223,243,249,0.70) 0%,rgba(235,248,252,0.70) 100%)", borderTop: "1px solid rgba(34,183,214,0.2)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,var(--bo-cyan-tint),transparent 70%)", opacity: .6 }} />
        <div style={{ maxWidth: 1180, margin: "0 auto", position: "relative", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.85fr 1fr", gap: isMobile ? 40 : 72, alignItems: "center" }}>
          <Reveal variant="left" style={{ position: "relative", maxWidth: isMobile ? 320 : "none", margin: isMobile ? "0 auto" : 0 }}>
            <div style={{ aspectRatio: "4/5", borderRadius: 24, overflow: "hidden", border: "1px solid var(--bo-line-soft)", position: "relative", boxShadow: "0 20px 40px rgba(11,31,42,.14)" }}>
              <img src={"assets/brand/anibal-fundador.webp"} alt="Aníbal, fundador de BeniOptions" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 60%,rgba(11,31,42,.45) 100%)", pointerEvents: "none" }}/>
              <div style={{ position: "absolute", top: 16, left: 16, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,.94)", fontSize: 10, fontFamily: "var(--bo-font-mono)", letterSpacing: "0.14em", color: "var(--bo-ink)", fontWeight: 600 }}>ANÍBAL · FUNDADOR</div>
            </div>
            {!isMobile && (
              <div style={{ position: "absolute", right: -32, bottom: -32, maxWidth: 280, padding: "20px 22px", borderRadius: 18, background: "#fff", border: "1px solid var(--bo-line-soft)", boxShadow: "0 24px 48px rgba(11,31,42,.12)" }}>
                <div style={{ fontFamily: "var(--bo-font-display)", fontSize: 56, color: "var(--bo-cyan-deep)", lineHeight: .6, marginBottom: 4 }}>"</div>
                <p style={{ fontSize: 15, color: "var(--bo-ink)", lineHeight: 1.45, margin: 0, fontWeight: 500 }}>Esto te lo digo porque estuve donde tú estás.</p>
              </div>
            )}
          </Reveal>
          <Reveal delay={80} variant="right">
            <div className="bo-eyebrow" style={{ marginBottom: 14 }}>Mi historia · por qué existe BeniOptions</div>
            <h2 style={{ fontSize: isMobile ? 30 : 52, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
              Hubo un tiempo en el que <span style={{ color: "var(--bo-cyan-deep)", fontStyle: "italic" }}>todo</span> me iba mal por dentro.
            </h2>
            <div style={{ display: "grid", gap: 14, fontSize: isMobile ? 15 : 17, color: "var(--bo-ink-soft)", lineHeight: 1.7, marginBottom: 28 }}>
              <p>Ansiedad por las mañanas, insomnio por las noches, vicios para tapar el ruido. Por fuera funcionaba. Por dentro estaba <strong style={{ color: "var(--bo-ink)" }}>desregulado</strong>.</p>
              <p>Empecé por lo más pequeño que pude imaginar: <strong style={{ color: "var(--bo-ink)" }}>cerrar la boca al dormir</strong>. A las dos semanas dormía del tirón. A los dos meses, la ansiedad había bajado sin tomar nada.</p>
              <p>Cuando el cuerpo se regula, lo demás encuentra su sitio. Por eso nace BeniOptions.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, padding: "16px 0", borderTop: "1px solid var(--bo-line-soft)", borderBottom: "1px solid var(--bo-line-soft)", marginBottom: 28 }}>
              {[["2 semanas","Dormir del tirón"],["1 mes","Cero ronquidos"],["2 meses","Menos ansiedad"]].map(([n,t],i) => (
                <div key={i} style={{ paddingLeft: i > 0 ? 16 : 0, borderLeft: i > 0 ? "1px solid var(--bo-line-soft)" : "none" }}>
                  <div style={{ fontFamily: "var(--bo-font-display)", fontSize: isMobile ? 20 : 28, fontWeight: 700, color: "var(--bo-cyan-deep)", letterSpacing: "-0.02em" }}>{n}</div>
                  <div style={{ fontSize: 12, color: "var(--bo-ink-mute)", marginTop: 2 }}>{t}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button className="bo-btn bo-btn-primary" style={{ padding: "14px 20px", fontSize: 14 }} onClick={() => nav('/nosotros')}>
                Lee la historia completa <Icon.Arrow width="16" height="16" />
              </button>
              {!isMobile && <div style={{ fontFamily: "var(--bo-font-display)", fontStyle: "italic", fontSize: 18, color: "var(--bo-ink-mute)" }}>Aníbal · Fundador</div>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: isMobile ? "40px 20px" : "100px 56px", background: "var(--bo-bg)" }}>
        <Reveal style={{ padding: isMobile ? "44px 24px" : "80px 64px", borderRadius: isMobile ? 24 : 32, background: "linear-gradient(135deg,var(--bo-cyan-tint),var(--bo-bg-pure))", border: "1px solid var(--bo-cyan-soft)", textAlign: "center", position: "relative", overflow: "hidden", maxWidth: 1328, margin: "0 auto" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,183,214,.25),transparent 60%)" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: isMobile ? 30 : 64, maxWidth: 800, margin: "0 auto 16px", lineHeight: 1.1 }}>30 noches para enamorarte.<br />O te devolvemos el dinero.</h2>
            <p style={{ fontSize: isMobile ? 15 : 18, color: "var(--bo-ink-mute)", maxWidth: 560, margin: "0 auto 28px" }}>Pruébalo durante un mes. Si no notas la diferencia, te devolvemos el 100% sin preguntas.</p>
            <button className="bo-btn bo-btn-primary" style={{ padding: isMobile ? "16px 24px" : "20px 32px", fontSize: isMobile ? 15 : 17, width: isMobile ? "100%" : "auto", justifyContent:"center" }} onClick={() => nav('/tienda')}>
              Empezar a dormir mejor <Icon.Arrow width="18" height="18" />
            </button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}

/* ===== PAGE: CATALOG ===== */

function CatalogA() {
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useS(false);
  useSEO({
    title: "Tienda — Cintas Bucales y Tiras Nasales | BeniOptions",
    description: "Compra cintas bucales y tiras nasales premium. Envío gratis en pedidos +30€. Garantía 30 noches sin riesgo. Elige el pack que más te conviene.",
    canonical: "https://www.benioptions.es/tienda",
    breadcrumb: [
      { name: "Inicio", url: "https://www.benioptions.es/" },
      { name: "Tienda", url: "https://www.benioptions.es/tienda" },
    ],
  });
  const products = [
    { img:"assets/products/cintas-bucales-pack.webp", tag:"MÁS VENDIDO", name:"Cintas Bucales Premium", cat:"Sueño", price:"24,90", was:"32,90", rating:4.9, reviews:1248 },
    { img:"assets/products/tiras-pack.webp", tag:"NUEVO", name:"Tiras Nasales Premium", cat:"Sueño · Deporte", price:"19,90", was:null, rating:4.8, reviews:892 },
    { img:"assets/products/magneticas-pack.webp", tag:"PREMIUM", name:"Tiras Nasales Magnéticas", cat:"Sueño avanzado", price:"34,90", was:"44,90", rating:4.9, reviews:412 },
    { img:"assets/products/cintas-bucales-pack.webp", tag:"PACK AHORRO", name:"Pack Pareja · Cintas x2", cat:"Bundle", price:"44,90", was:"65,80", rating:4.9, reviews:287 },
    { img:"assets/products/tiras-pack.webp", tag:"PACK AHORRO", name:"Pack Sueño Total", cat:"Bundle premium", price:"59,90", was:"79,70", rating:5.0, reviews:156 },
    { img:"assets/products/magneticas-pack.webp", tag:"RECAMBIOS", name:"Recambios Magnéticas x60", cat:"Recambios", price:"14,90", was:null, rating:4.7, reviews:98 },
  ];
  const filters = [["Categoría",["Cintas bucales (4)","Tiras nasales (3)","Magnéticas (2)","Packs (3)","Recambios (2)"]],["Objetivo",["Mejor sueño","Reducir ronquidos","Rendimiento deportivo","Respiración nasal"]],["Precio",["Menos de 20€","20€ – 35€","Más de 35€"]]];
  return (
    <div className="bo-root" style={{ background: "var(--bo-bg)" }}>
      <Announcement /><NavBar />
      <section style={{ padding: isMobile ? "24px 20px 20px" : "44px 56px 32px", background: "var(--bo-bg-pure)" }}>
        <div style={{ fontSize: 12, color: "var(--bo-ink-mute)", marginBottom: 14, fontFamily: "var(--bo-font-mono)" }}>
          <span style={{ cursor: "pointer" }} onClick={() => nav('/')}>INICIO</span> / TIENDA
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 40 : 60, marginBottom: 10 }}>Tienda</h1>
            {!isMobile && <p style={{ fontSize: 17, color: "var(--bo-ink-mute)", maxWidth: 560 }}>Productos respiratorios diseñados para dormir profundo, dejar de roncar y rendir mejor.</p>}
          </div>
          <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
            {isMobile && (
              <button onClick={() => setFiltersOpen(!filtersOpen)} className="bo-btn bo-btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "10px 16px", fontSize: 13 }}>
                Filtrar
              </button>
            )}
            <select style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid var(--bo-line)", background: "#fff", fontSize: 13, flex: isMobile ? 1 : "auto" }}>
              <option>Más vendidos</option><option>Precio: menor a mayor</option><option>Mejor valorados</option>
            </select>
          </div>
        </div>
      </section>
      {isMobile && filtersOpen && (
        <div style={{ padding: "16px 20px", background: "var(--bo-bg-soft)", borderBottom: "1px solid var(--bo-line-soft)" }}>
          {filters.map(([t,opts],i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{t}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {opts.map(o => (
                  <label key={o} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--bo-line)", fontSize: 13, color: "var(--bo-ink-soft)", cursor: "pointer", background: "#fff" }}>
                    <input type="checkbox" aria-label={o} style={{ accentColor: "var(--bo-cyan)", cursor: "pointer" }} />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <section style={{ padding: isMobile ? "16px 20px 60px" : "0 56px 100px", background: "var(--bo-bg-pure)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "240px 1fr", gap: isMobile ? 0 : 48 }}>
        {!isMobile && (
          <aside style={{ paddingTop: 28 }}>
            <div className="bo-eyebrow" style={{ marginBottom: 18 }}>Filtrar por</div>
            {filters.map(([t,opts],i) => (
              <div key={i} style={{ marginBottom: 32, paddingBottom: 28, borderBottom: i < 2 ? "1px solid var(--bo-line-soft)" : "none" }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>{t}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                  {opts.map(o => (
                    <li key={o}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--bo-ink-soft)", cursor: "pointer" }}>
                        <input type="checkbox" aria-label={o} style={{ width: 16, height: 16, borderRadius: 4, accentColor: "var(--bo-cyan)", flexShrink: 0, cursor: "pointer" }} />
                        {o}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        )}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 24 : 24, paddingTop: isMobile ? 0 : 28 }}>
          {products.map((p,i) => (
            <article key={i} className="bo-card" style={{ background: "#fff", borderRadius: isMobile ? 16 : 20, overflow: "hidden", border: "1px solid var(--bo-line-soft)" }}>
              <a href="/producto" aria-label={`Ver ${p.name}`} onClick={(e) => { e.preventDefault(); nav('/producto'); }} style={{ display:"block", textDecoration:"none", color:"inherit" }}>
                <div style={{ height: isMobile ? 200 : 280, background: "linear-gradient(180deg,var(--bo-cyan-tint),#fff)", display: "grid", placeItems: "center", position: "relative" }}>
                  <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 8px", borderRadius: 999, background: "var(--bo-ink)", color: "#fff", fontSize: 8, fontFamily: "var(--bo-font-mono)", letterSpacing: "0.14em", fontWeight: 600 }}>{p.tag}</div>
                  <img src={p.img} alt={p.name} loading="lazy" style={{ maxHeight: "78%", maxWidth: "78%", objectFit: "contain" }}/>
                </div>
                <div style={{ padding: isMobile ? 16 : 22 }}>
                  {!isMobile && <div style={{ fontSize: 11, color: "var(--bo-cyan-deep)", fontFamily: "var(--bo-font-mono)", letterSpacing: "0.12em", marginBottom: 6 }}>{p.cat.toUpperCase()}</div>}
                  <h3 style={{ fontSize: isMobile ? 16 : 18, marginBottom: isMobile ? 8 : 10 }}>{p.name}</h3>
                  {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 12, color: "var(--bo-ink-mute)" }}><Stars value={Math.round(p.rating)} size={12}/>{p.rating} · {p.reviews}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, fontFamily: "var(--bo-font-display)" }}>{p.price}€</span>
                      {p.was && !isMobile && <span style={{ fontSize: 13, color: "var(--bo-ink-faint)", textDecoration: "line-through", marginLeft: 6 }}>{p.was}€</span>}
                    </div>
                    <button aria-label={`Añadir ${p.name} al carrito`} className="bo-btn bo-btn-cyan" style={{ padding: isMobile ? "8px 16px" : "8px 14px", fontSize: 11 }} onClick={e => { e.preventDefault(); e.stopPropagation(); nav('/carrito'); }}>
                      {isMobile ? "Añadir al carrito" : <Icon.Plus width="11" height="11"/>}
                    </button>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>
      <Footer/>
    </div>
  );
}

/* ===== PAGE: PRODUCT ===== */

function ProductA() {
  const isMobile = useIsMobile();
  const [qty, setQty] = useS(1);
  const [pack, setPack] = useS(1);
  const [activeImg, setActiveImg] = useS(0);
  const [lightbox, setLightbox] = useS(false);
  const touchStartX = useRef(null);

  useSEO({
    title: "Cintas Bucales Premium — Adhesivo Hipoalergénico, 30 Noches | BeniOptions",
    description: "Cintas bucales hipoalergénicas que cierran la boca mientras duermes. Transpirables, sin latex, adhesivo médico. 1.248 reseñas verificadas. 4.9/5 estrellas.",
    canonical: "https://www.benioptions.es/producto",
    breadcrumb: [
      { name: "Inicio", url: "https://www.benioptions.es/" },
      { name: "Tienda", url: "https://www.benioptions.es/tienda" },
      { name: "Cintas Bucales Premium", url: "https://www.benioptions.es/producto" },
    ],
  });

  const gallery = [
    { src:"assets/products/cintas-bucales-pack.webp", alt:"Pack de Cintas Bucales Premium BeniOptions — 30 unidades" },
    { src:"assets/products/cintas-detalle.webp",      alt:"Detalle de textura de la cinta bucal BeniOptions" },
    { src:"assets/lifestyle/cintas-mujer-durmiendo.webp", alt:"Mujer durmiendo con cinta bucal BeniOptions aplicada" },
    { src:"assets/lifestyle/cintas-hombre-durmiendo.webp", alt:"Hombre durmiendo con cinta bucal BeniOptions aplicada" },
    { src:"assets/lifestyle/cintas-pasos.webp",        alt:"Pasos de aplicación de la cinta bucal BeniOptions" },
  ];

  const packs = [
    { id:0, label:"1 paquete · 30 noches", per:"0,83 €/noche", total:"24,90" },
    { id:1, label:"2 paquetes · 60 noches", per:"0,71 €/noche", total:"42,90", save:"AHORRA 17%", popular:true },
    { id:2, label:"3 paquetes · 90 noches", per:"0,62 €/noche", total:"55,90", save:"AHORRA 25%" },
  ];

  const prevImg = () => setActiveImg(i => (i - 1 + gallery.length) % gallery.length);
  const nextImg = () => setActiveImg(i => (i + 1) % gallery.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? nextImg() : prevImg();
    touchStartX.current = null;
  };

  return (
    <div className="bo-root" style={{ background: "var(--bo-bg-pure)" }}>
      <Announcement /><NavBar />

      {/* LIGHTBOX */}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(6,22,32,.92)", backdropFilter:"blur(8px)", display:"grid", placeItems:"center", cursor:"zoom-out" }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"relative", maxWidth:"90vw", maxHeight:"90vh" }}>
            <img src={gallery[activeImg].src} alt={gallery[activeImg].alt}
              style={{ maxWidth:"90vw", maxHeight:"88vh", objectFit:"contain", borderRadius:16 }}/>
            <button aria-label="Imagen anterior" onClick={prevImg} style={{ position:"absolute", left:-48, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,.12)", border:"none", borderRadius:999, width:40, height:40, cursor:"pointer", color:"#fff", display:"grid", placeItems:"center" }}>
              <Icon.Chevron width="20" height="20" style={{ transform:"rotate(180deg)" }}/>
            </button>
            <button aria-label="Imagen siguiente" onClick={nextImg} style={{ position:"absolute", right:-48, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,.12)", border:"none", borderRadius:999, width:40, height:40, cursor:"pointer", color:"#fff", display:"grid", placeItems:"center" }}>
              <Icon.Chevron width="20" height="20"/>
            </button>
            <button aria-label="Cerrar galería" onClick={() => setLightbox(false)} style={{ position:"absolute", top:-44, right:0, background:"none", border:"none", color:"rgba(255,255,255,.7)", fontSize:13, cursor:"pointer", fontFamily:"var(--bo-font-mono)" }}>ESC · CERRAR</button>
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
              {gallery.map((_,i) => (
                <button key={i} aria-label={`Ver imagen ${i+1}`} onClick={() => setActiveImg(i)}
                  style={{ width:i===activeImg?24:8, height:8, borderRadius:999, background:i===activeImg?"var(--bo-cyan)":"rgba(255,255,255,.35)", border:"none", cursor:"pointer", transition:"all .2s", padding:0 }}/>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: isMobile ? "14px 20px 0" : "20px 56px 0", fontSize: 12, color: "var(--bo-ink-mute)", fontFamily: "var(--bo-font-mono)" }}>
        <span style={{ cursor:"pointer" }} onClick={() => nav('/')}>INICIO</span> / <span style={{ cursor:"pointer" }} onClick={() => nav('/tienda')}>TIENDA</span> / CINTAS BUCALES PREMIUM
      </div>

      <section style={{ padding: isMobile ? "20px 20px 56px" : "32px 56px 80px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.95fr", gap: isMobile ? 28 : 64, maxWidth: 1440, margin: "0 auto" }}>

        {/* GALERÍA */}
        <div>
          <div
            role="img" aria-label={gallery[activeImg].alt}
            onClick={() => setLightbox(true)}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            style={{ aspectRatio:"1/1", borderRadius: isMobile ? 18 : 24, background:"linear-gradient(180deg,var(--bo-cyan-tint),#fff)", display:"grid", placeItems:"center", marginBottom:12, position:"relative", overflow:"hidden", cursor:"zoom-in" }}>
            {gallery.map((img, i) => (
              <img key={i} src={img.src} alt={img.alt}
                style={{ position:"absolute", maxHeight:"82%", maxWidth:"82%", objectFit:"contain",
                  opacity: i===activeImg ? 1 : 0,
                  transform: i===activeImg ? "scale(1)" : "scale(.97)",
                  transition:"opacity .3s ease, transform .3s ease",
                  pointerEvents: i===activeImg ? "auto" : "none" }}/>
            ))}
            <div style={{ position:"absolute", top:16, left:16, padding:"5px 10px", borderRadius:999, background:"var(--bo-cyan)", color:"#fff", fontSize:10, fontFamily:"var(--bo-font-mono)", letterSpacing:"0.16em", fontWeight:600 }}>MÁS VENDIDO</div>
            {/* Flechas desktop */}
            {!isMobile && (
              <>
                <button aria-label="Imagen anterior" onClick={e => { e.stopPropagation(); prevImg(); }}
                  style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:36, height:36, borderRadius:999, background:"rgba(255,255,255,.88)", border:"1px solid var(--bo-line-soft)", cursor:"pointer", display:"grid", placeItems:"center", boxShadow:"var(--bo-shadow-sm)" }}>
                  <Icon.Chevron width="16" height="16" style={{ transform:"rotate(180deg)" }}/>
                </button>
                <button aria-label="Imagen siguiente" onClick={e => { e.stopPropagation(); nextImg(); }}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:36, height:36, borderRadius:999, background:"rgba(255,255,255,.88)", border:"1px solid var(--bo-line-soft)", cursor:"pointer", display:"grid", placeItems:"center", boxShadow:"var(--bo-shadow-sm)" }}>
                  <Icon.Chevron width="16" height="16"/>
                </button>
              </>
            )}
            {/* Dots mobile */}
            {isMobile && (
              <div style={{ position:"absolute", bottom:12, left:0, right:0, display:"flex", justifyContent:"center", gap:6 }}>
                {gallery.map((_,i) => (
                  <div key={i} style={{ width:i===activeImg?20:6, height:6, borderRadius:999, background:i===activeImg?"var(--bo-cyan)":"rgba(11,31,42,.25)", transition:"all .2s" }}/>
                ))}
              </div>
            )}
          </div>

          {/* Miniaturas */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(${gallery.length},1fr)`, gap: isMobile ? 8 : 10 }}>
            {gallery.map((img, i) => (
              <button key={i} aria-label={`Ver ${img.alt}`} onClick={() => setActiveImg(i)}
                className="bo-thumb"
                style={{ aspectRatio:"1/1", borderRadius:10, overflow:"hidden", padding:0, border: i===activeImg ? "2.5px solid var(--bo-cyan)" : "1.5px solid var(--bo-line-soft)", cursor:"pointer", background:"var(--bo-cyan-tint)", transition:"border-color .15s", outline:"none" }}>
                <img src={img.src} alt={img.alt} loading="lazy"
                  style={{ width:"100%", height:"100%", objectFit:"cover", opacity: i===activeImg ? 1 : .72, transition:"opacity .15s" }}/>
              </button>
            ))}
          </div>
        </div>

        {/* INFO PRODUCTO */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div className="bo-eyebrow">Cintas bucales · Sueño profundo</div>
            <AmazonBadge/>
          </div>
          <h1 className="bo-product-h1" style={{ fontSize: isMobile ? 28 : 44, marginBottom:10 }}>
            Cintas Bucales Premium — Material Hipoalergénico para una Calidad de Sueño Superior
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <Stars value={5} size={15}/>
            <span style={{ fontSize:13, color:"var(--bo-ink-mute)" }}>4.9 · 1.248 reseñas verificadas</span>
          </div>
          <div style={{ fontSize:11, color:"var(--bo-ink-faint)", fontFamily:"var(--bo-font-mono)", marginBottom:18 }}>Ref. ASIN: B0DT4VTQ93</div>

          <p style={{ fontSize: isMobile ? 15 : 17, color:"var(--bo-ink-soft)", lineHeight:1.6, marginBottom:16 }}>
            Recupera la respiración nasal mientras duermes. Fibras transpirables sin latex y adhesivo médico hipoalergénico que <strong style={{ color:"var(--bo-ink)" }}>no irritan la piel</strong>, no dejan marca al despertar y eliminan la sequedad bucal matutina desde la primera noche.
          </p>

          {/* Beneficios clave — badges */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {[
              [Icon.Shield, "Material hipoalergénico sin latex"],
              [Icon.Wave,   "Fibras transpirables 9h"],
              [Icon.Moon,   "Elimina sequedad bucal matutina"],
              [Icon.Heart,  "No irrita ni deja marca"],
            ].map(([Ic,t],i) => (
              <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"7px 12px", borderRadius:999, border:"1px solid var(--bo-line)", fontSize:12, color:"var(--bo-ink-soft)", background:"#fff" }}>
                <Ic width="13" height="13" style={{ color:"var(--bo-cyan-deep)" }}/>{t}
              </div>
            ))}
          </div>

          {/* Métricas highlight */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: isMobile ? 8 : 12, marginBottom:24, padding:"16px", borderRadius:14, background:"var(--bo-cyan-tint)", border:"1px solid var(--bo-cyan-soft)" }}>
            {[["−42%","ronquidos en 4 sem."],["9h","duración por uso"],["+38%","sueño profundo"]].map(([n,t],i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--bo-font-display)", fontSize: isMobile ? 22 : 28, fontWeight:700, color:"var(--bo-cyan-deep)", lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:10, color:"var(--bo-ink-mute)", marginTop:4, lineHeight:1.3 }}>{t}</div>
              </div>
            ))}
          </div>

          <div className="bo-eyebrow" style={{ marginBottom:10 }}>Elige tu pack</div>
          <div style={{ display:"grid", gap:10, marginBottom:22 }}>
            {packs.map(p => (
              <label key={p.id} onClick={() => setPack(p.id)} className="bo-pack-label" style={{ padding: isMobile ? 14 : 18, borderRadius:12, border: pack===p.id ? "2px solid var(--bo-cyan)" : "1.5px solid var(--bo-line)", background: pack===p.id ? "var(--bo-cyan-tint)" : "#fff", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", position:"relative" }}>
                {p.popular && <div style={{ position:"absolute", top:-10, right:12, padding:"3px 10px", borderRadius:999, background:"var(--bo-gold)", color:"#fff", fontSize:9, fontFamily:"var(--bo-font-mono)", fontWeight:700, letterSpacing:"0.12em" }}>MÁS POPULAR</div>}
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:20, height:20, borderRadius:999, border:"2px solid "+(pack===p.id ? "var(--bo-cyan)" : "var(--bo-line)"), background: pack===p.id ? "var(--bo-cyan)" : "#fff", display:"grid", placeItems:"center", flexShrink:0 }}>
                    {pack===p.id && <div style={{ width:7, height:7, borderRadius:999, background:"#fff" }}/>}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize: isMobile ? 13 : 15 }}>{p.label}</div>
                    <div style={{ fontSize:11, color:"var(--bo-ink-mute)", marginTop:2 }}>{p.per}{p.save && <span style={{ color:"var(--bo-cyan-deep)", fontWeight:600, marginLeft:6 }}>{p.save}</span>}</div>
                  </div>
                </div>
                <div style={{ fontSize: isMobile ? 17 : 20, fontWeight:700, fontFamily:"var(--bo-font-display)" }}>{p.total}€</div>
              </label>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, border:"1.5px solid var(--bo-line)", borderRadius:999, padding:"0 10px", flexShrink:0 }}>
              <button onClick={() => setQty(Math.max(1,qty-1))} aria-label="Reducir cantidad" style={{ width:30, height:42, background:"none", border:"none", cursor:"pointer", color:"var(--bo-ink-mute)" }}><Icon.Minus width="14" height="14"/></button>
              <span style={{ minWidth:18, textAlign:"center", fontWeight:600 }}>{qty}</span>
              <button onClick={() => setQty(qty+1)} aria-label="Aumentar cantidad" style={{ width:30, height:42, background:"none", border:"none", cursor:"pointer", color:"var(--bo-ink-mute)" }}><Icon.Plus width="14" height="14"/></button>
            </div>
            <button className="bo-btn bo-btn-primary" style={{ flex:1, padding:"15px 20px", fontSize: isMobile ? 14 : 15, justifyContent:"center", flexDirection:"column", gap:3, alignItems:"center", height:"auto", paddingTop:10, paddingBottom:10 }} onClick={() => nav('/checkout')}>
              <span style={{ display:"flex", alignItems:"center", gap:8 }}>Comprar ahora · {packs[pack].total}€ <Icon.Lock width="14" height="14"/></span>
              <AmazonBadge/>
            </button>
          </div>
          <button className="bo-btn bo-btn-ghost" style={{ width:"100%", justifyContent:"center", padding:"12px 20px", fontSize:13, marginBottom:20 }} onClick={() => nav('/carrito')}>
            <Icon.Cart width="15" height="15"/> Añadir al carrito
          </button>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, paddingTop:20, borderTop:"1px solid var(--bo-line-soft)" }}>
            {[[Icon.Truck,"Envío gratis","+30€"],[Icon.Refresh,"30 noches","de prueba"],[Icon.Lock,"Pago seguro","SSL"]].map(([Ic,a,b],i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Ic width="18" height="18" style={{ color:"var(--bo-cyan)", flexShrink:0 }}/>
                <div style={{ fontSize:12 }}><div style={{ fontWeight:600 }}>{a}</div><div style={{ color:"var(--bo-ink-mute)" }}>{b}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESPECIFICACIONES + INSTRUCCIONES + SEGURIDAD */}
      <section style={{ padding: isMobile ? "40px 20px 0" : "60px 56px 0", background:"var(--bo-bg)" }}>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 28 : 64, maxWidth:1440, margin:"0 auto" }}>
          <Reveal variant="left">
            <div className="bo-eyebrow" style={{ marginBottom:14 }}>Ficha técnica</div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, marginBottom:20 }}>
              Material no irritante diseñado para <span style={{ color:"var(--bo-cyan-deep)" }}>piel sensible.</span>
            </h2>
            <ul style={{ listStyle:"none", padding:0, margin:"0 0 24px", display:"grid", gap:0 }}>
              {[
                ["Dimensiones",       "7,6 × 3,8 cm"],
                ["Adhesivo",          "Hipoalergénico médico — sin latex, sin acrílico agresivo"],
                ["Material",          "Fibras transpirables de tejido no tejido, elásticas"],
                ["Unidades",          "30 cintas / paquete"],
                ["Duración por uso",  "Hasta 9 horas"],
                ["Flujo aéreo",       "+60% flujo nasal nocturno vs. boca abierta"],
                ["Recomendado",       "Adultos · respiradores bucales · piel sensible"],
                ["Ref. Amazon",       "ASIN B0DT4VTQ93"],
              ].map(([k,v],i,arr) => (
                <li key={i} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom: i<arr.length-1 ? "1px solid var(--bo-line-soft)" : "none", fontSize:14, gap:16 }}>
                  <span style={{ color:"var(--bo-ink-mute)", flexShrink:0 }}>{k}</span>
                  <span style={{ fontWeight:600, textAlign:"right" }}>{v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal variant="right">
            {!isMobile && (
              <div style={{ borderRadius:24, overflow:"hidden", marginBottom:0 }}>
                <img src={"assets/products/cintas-detalle.webp"} alt="Detalle de la textura transpirable e hipoalergénica de las cintas bucales BeniOptions" loading="lazy" style={{ width:"100%", height:320, objectFit:"cover" }}/>
              </div>
            )}
            {/* Tiras nasales cross-sell */}
            <div style={{ marginTop: isMobile ? 0 : 20, padding:"20px", borderRadius:16, background:"var(--bo-bg-soft)", border:"1px solid var(--bo-line-soft)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <div style={{ width:56, height:56, borderRadius:10, background:"var(--bo-cyan-tint)", display:"grid", placeItems:"center", flexShrink:0 }}>
                  <img src={"assets/products/tiras-pack.webp"} alt="Tiras Nasales Premium BeniOptions" loading="lazy" style={{ maxWidth:"80%", maxHeight:"80%", objectFit:"contain" }}/>
                </div>
                <div>
                  <div style={{ fontSize:10, fontFamily:"var(--bo-font-mono)", color:"var(--bo-cyan-deep)", letterSpacing:"0.12em", marginBottom:2 }}>TECNOLOGÍA — ASIN B0F4KHSJFG</div>
                  <div style={{ fontWeight:700, fontSize:15 }}>Tiras Nasales · Bandas Elásticas de Resorte</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:"var(--bo-ink-soft)", lineHeight:1.6, marginBottom:12 }}>
                Nuestras tiras nasales utilizan <strong>tecnología de bandas elásticas de resorte</strong> que ejercen una tensión continua y suave sobre el cartílago nasal, levantando mecánicamente las fosas y ampliando el paso de aire hasta un <strong>+60% de flujo aéreo</strong> sin fármaco ni intervención.
              </p>
              <button className="bo-btn bo-btn-cyan" style={{ fontSize:13, padding:"10px 18px" }} onClick={() => nav('/tienda')}>
                Ver Tiras Nasales — 19,90€ <Icon.Arrow width="14" height="14"/>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INSTRUCCIONES Y SEGURIDAD — ACORDEÓN */}
      <section style={{ padding: isMobile ? "40px 20px" : "60px 56px", background:"var(--bo-bg)" }}>
        <Reveal style={{ maxWidth:1440, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 40 }}>

            {/* Instrucciones de uso */}
            <div className="bo-security-card" style={{ padding: isMobile ? 20 : 28 }}>
              <h3 style={{ fontSize: isMobile ? 20 : 26, marginBottom:16 }}>Instrucciones de uso — Cintas Bucales</h3>
              <Accordion accentColor="var(--bo-cyan)" items={[
                {
                  icon: <Icon.Check width="16" height="16"/>,
                  title: "1 · Preparación: limpieza de labios",
                  content: (
                    <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>Lávate los dientes y usa hilo dental antes de dormir.</li>
                      <li>Seca completamente los labios con una toalla limpia o papel absorbente.</li>
                      <li>Evita aplicar bálsamos, cremas o productos labiales antes de usar la cinta — el aceite reduce la adherencia.</li>
                    </ol>
                  ),
                },
                {
                  icon: <Icon.Wave width="16" height="16"/>,
                  title: "2 · Aplicación de la cinta",
                  content: (
                    <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>Despega la cinta del papel protector con cuidado, sujetando los extremos.</li>
                      <li>Cierra la boca en posición natural y relaja los labios.</li>
                      <li>Centra la cinta verticalmente sobre los labios y presiona suavemente durante 3–5 segundos.</li>
                      <li>Asegúrate de que los bordes estén bien adheridos en las comisuras.</li>
                    </ol>
                  ),
                },
                {
                  icon: <Icon.Moon width="16" height="16"/>,
                  title: "3 · Retirada por la mañana",
                  content: (
                    <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>Humedece ligeramente los labios con agua o saliva antes de retirar.</li>
                      <li>Despega con un movimiento lento y horizontal, empezando por una esquina.</li>
                      <li>Nunca tires de golpe hacia arriba — el adhesivo médico se retira sin dolor si se sigue este paso.</li>
                      <li>Desecha la cinta usada. No reutilizar.</li>
                    </ol>
                  ),
                },
              ]}/>
            </div>

            {/* Instrucciones tiras nasales */}
            <div className="bo-security-card" style={{ padding: isMobile ? 20 : 28 }}>
              <h3 style={{ fontSize: isMobile ? 20 : 26, marginBottom:16 }}>Instrucciones de uso — Tiras Nasales</h3>
              <Accordion accentColor="var(--bo-cyan-deep)" items={[
                {
                  icon: <Icon.Check width="16" height="16"/>,
                  title: "1 · Preparación: limpieza nasal",
                  content: (
                    <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>Limpia y seca el puente nasal con agua y jabón neutro.</li>
                      <li>Retira cualquier crema, protector solar o aceite de la zona.</li>
                      <li>La piel debe estar completamente seca para garantizar la adherencia de las bandas de resorte.</li>
                    </ol>
                  ),
                },
                {
                  icon: <Icon.Lung width="16" height="16"/>,
                  title: "2 · Colocación y activación del resorte",
                  content: (
                    <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>Dobla ligeramente la tira por el centro para activar la tensión de las bandas elásticas de resorte.</li>
                      <li>Coloca la tira transversalmente sobre las alas nasales, a la altura del cartílago (no sobre el hueso).</li>
                      <li>Presiona suavemente los extremos adhesivos durante 5 segundos. Nota el levantamiento inmediato de las fosas nasales.</li>
                    </ol>
                  ),
                },
                {
                  icon: <Icon.Refresh width="16" height="16"/>,
                  title: "3 · Retirada y almacenamiento",
                  content: (
                    <ol style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>Por la mañana o tras el uso deportivo, moja el puente nasal con agua tibia durante 10 segundos.</li>
                      <li>Despega cada extremo con movimiento lateral suave.</li>
                      <li>Para uso deportivo repetido el mismo día: guarda en el sobre original, en lugar seco y fresco.</li>
                    </ol>
                  ),
                },
              ]}/>

              {/* Advertencias de seguridad */}
              <h3 style={{ fontSize: isMobile ? 18 : 22, margin:"24px 0 12px" }}>Advertencias de seguridad</h3>
              <Accordion accentColor="var(--bo-warn)" items={[
                {
                  icon: <Icon.Shield width="16" height="16" style={{ color:"var(--bo-warn)" }}/>,
                  title: "Contraindicaciones",
                  content: (
                    <ul style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li>No usar en menores de 18 años sin supervisión médica.</li>
                      <li>No usar si padeces apnea del sueño severa diagnosticada sin consultar a tu médico.</li>
                      <li>Suspender el uso si notas irritación cutánea persistente o eritema.</li>
                      <li>No usar sobre piel dañada, quemada o con dermatitis activa.</li>
                    </ul>
                  ),
                },
                {
                  icon: <Icon.Heart width="16" height="16" style={{ color:"var(--bo-warn)" }}/>,
                  title: "Uso seguro — Preguntas frecuentes",
                  content: (
                    <ul style={{ margin:0, paddingLeft:18, display:"grid", gap:6 }}>
                      <li><strong>¿Me asfixiaré si abro la boca?</strong> No. El adhesivo está diseñado para ceder ante movimiento de emergencia.</li>
                      <li><strong>¿Puedo respirar por la boca en caso de necesidad?</strong> Sí. La fuerza de apertura labial normal supera el adhesivo sin esfuerzo.</li>
                      <li><strong>¿Son seguras para personas con barba?</strong> Se recomienda rasurar la zona de contacto para garantizar adherencia y retirada sin molestia.</li>
                    </ul>
                  ),
                },
              ]}/>
            </div>

          </div>
        </Reveal>
      </section>

      {/* BLOQUE BUNDLE */}
      <section style={{ padding: isMobile ? "40px 20px 60px" : "60px 56px 80px", background:"var(--bo-bg)" }}>
        <div style={{ maxWidth:1440, margin:"0 auto" }}>
          <BundleBlock isMobile={isMobile}/>
        </div>
      </section>

      <Footer/>
    </div>
  );
}

/* ===== PAGE: CART ===== */

function CartA() {
  const [items, setItems] = useS([
    { img:"assets/products/cintas-bucales-pack.webp", name:"Cintas Bucales Premium", variant:"Pack 60 noches · 2 ud.", price:42.90, qty:1 },
    { img:"assets/products/tiras-pack.webp", name:"Tiras Nasales Premium", variant:"1 paquete · 30 ud.", price:19.90, qty:1 },
  ]);
  useSEO({
    title: "Tu carrito | BeniOptions",
    description: "Revisa tu selección y completa tu pedido. Envío gratis en pedidos +30€. Garantía 30 noches.",
    canonical: "https://www.benioptions.es/carrito",
    noindex: true,
  });
  const sub = items.reduce((a,b) => a + b.price * b.qty, 0);
  const upd = (i,d) => setItems(p => p.map((it,idx) => idx===i ? {...it, qty:Math.max(1,it.qty+d)} : it));
  const rm  = (i)   => setItems(p => p.filter((_,idx) => idx!==i));
  const isMobile = useIsMobile();
  return (
    <div className="bo-root" style={{ background: "var(--bo-bg)" }}>
      <Announcement/><NavBar cartCount={items.length}/>
      <section style={{ padding: isMobile ? "24px 20px 60px" : "44px 56px 100px", maxWidth: 1440, margin: "0 auto" }}>
        <h1 style={{ fontSize: isMobile ? 32 : 52, marginBottom: isMobile ? 24 : 36 }}>Tu carrito · {items.length} producto{items.length!==1?"s":""}</h1>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr", gap: isMobile ? 20 : 32 }}>
          <div style={{ background:"#fff", borderRadius:16, border:"1px solid var(--bo-line-soft)", overflow:"hidden" }}>
            {items.length===0 ? (
              <div style={{ padding:48, textAlign:"center", color:"var(--bo-ink-mute)" }}>
                <p style={{ fontSize:17, marginBottom:16 }}>Tu carrito está vacío</p>
                <button className="bo-btn bo-btn-primary" onClick={() => nav('/tienda')}>Ver productos <Icon.Arrow width="16" height="16"/></button>
              </div>
            ) : items.map((it,i) => (
              <div key={i} style={{ padding: isMobile ? "16px" : "24px", display:"grid", gridTemplateColumns: isMobile ? "80px 1fr" : "120px 1fr auto", gap: isMobile ? 14 : 20, alignItems:"center", borderBottom: i<items.length-1 ? "1px solid var(--bo-line-soft)" : "none" }}>
                <div style={{ width: isMobile ? 80 : 120, height: isMobile ? 80 : 120, borderRadius:12, background:"var(--bo-cyan-tint)", display:"grid", placeItems:"center" }}>
                  <img src={it.img} alt={it.name} loading="lazy" style={{ maxWidth:"82%", maxHeight:"82%", objectFit:"contain" }}/>
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 15 : 18, marginBottom:4 }}>{it.name}</h3>
                  <div style={{ fontSize:12, color:"var(--bo-ink-mute)", marginBottom:10 }}>{it.variant}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent: isMobile ? "space-between" : "flex-start", gap:10 }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid var(--bo-line)", borderRadius:999, padding:"0 6px" }}>
                      <button style={{ width:26, height:30, background:"none", border:"none", cursor:"pointer", color:"var(--bo-ink-mute)" }} onClick={() => upd(i,-1)}><Icon.Minus width="13" height="13"/></button>
                      <span style={{ minWidth:16, textAlign:"center", fontWeight:600, fontSize:13 }}>{it.qty}</span>
                      <button style={{ width:26, height:30, background:"none", border:"none", cursor:"pointer", color:"var(--bo-ink-mute)" }} onClick={() => upd(i,1)}><Icon.Plus width="13" height="13"/></button>
                    </div>
                    {isMobile && (
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:18, fontWeight:700, fontFamily:"var(--bo-font-display)" }}>{(it.price*it.qty).toFixed(2)}€</div>
                        <button style={{ fontSize:11, color:"var(--bo-ink-mute)", marginTop:4, textDecoration:"underline", background:"none", border:"none", cursor:"pointer" }} onClick={() => rm(i)}>Eliminar</button>
                      </div>
                    )}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:"var(--bo-font-display)" }}>{(it.price*it.qty).toFixed(2)}€</div>
                    <button style={{ fontSize:12, color:"var(--bo-ink-mute)", marginTop:6, textDecoration:"underline", background:"none", border:"none", cursor:"pointer" }} onClick={() => rm(i)}>Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <aside style={{ background:"#fff", borderRadius:16, border:"1px solid var(--bo-line-soft)", padding: isMobile ? 20 : 28, height:"fit-content" }}>
            <h3 style={{ fontSize: isMobile ? 18 : 22, marginBottom:18 }}>Resumen</h3>
            <div style={{ display:"grid", gap:10, marginBottom:16 }}>
              {[["Subtotal",sub.toFixed(2)+"€"],["Envío","GRATIS"],["IVA (21%)","incluido"]].map(([k,v],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:14, color:"var(--bo-ink-soft)" }}>
                  <span>{k}</span><span style={i===1 ? {color:"var(--bo-cyan-deep)",fontWeight:600} : {}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <input placeholder="Código descuento" style={{ flex:1, padding:"10px 12px", borderRadius:10, border:"1px solid var(--bo-line)", fontSize:13, outline:"none" }}/>
              <button className="bo-btn bo-btn-ghost" style={{ padding:"8px 14px", fontSize:12 }}>Aplicar</button>
            </div>
            <div style={{ paddingTop:16, borderTop:"1px solid var(--bo-line-soft)", display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <span style={{ fontWeight:700 }}>Total</span>
              <span style={{ fontSize: isMobile ? 22 : 28, fontWeight:700, fontFamily:"var(--bo-font-display)" }}>{sub.toFixed(2)}€</span>
            </div>
            <button className="bo-btn bo-btn-primary" style={{ width:"100%", justifyContent:"center", padding:"15px 20px", fontSize:14 }} onClick={() => nav('/checkout')}>
              Ir al pago seguro <Icon.Lock width="15" height="15"/>
            </button>
            <div style={{ marginTop:14, display:"flex", gap:6, justifyContent:"center", opacity:.7, flexWrap:"wrap" }}>
              {["VISA","MC","AMEX","PayPal","Bizum"].map(p => <div key={p} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid var(--bo-line)", fontSize:10, fontFamily:"var(--bo-font-mono)", fontWeight:600 }}>{p}</div>)}
            </div>
          </aside>
        </div>
      </section>
      <Footer/>
    </div>
  );
}

/* ===== PAGE: CHECKOUT ===== */

function CheckoutA() {
  const isMobile = useIsMobile();
  useSEO({
    title: "Pago seguro | BeniOptions",
    description: "Completa tu pedido de forma segura. SSL cifrado. Garantía de 30 noches.",
    canonical: "https://www.benioptions.es/checkout",
    noindex: true,
  });
  return (
    <div className="bo-root" style={{ background: "var(--bo-bg)" }}>
      <header style={{ padding: isMobile ? "14px 20px" : "20px 56px", borderBottom:"1px solid var(--bo-line-soft)", background:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Wordmark size={24}/>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--bo-ink-mute)" }}><Icon.Lock width="13" height="13"/> Pago cifrado SSL</div>
      </header>
      <div style={{ background:"#fff", padding: isMobile ? "14px 20px" : "20px 56px", borderBottom:"1px solid var(--bo-line-soft)" }}>
        <div style={{ display:"flex", justifyContent:"center", gap: isMobile ? 24 : 56 }}>
          {[["01","Información",true],["02","Envío",true],["03","Pago",false]].map(([n,t,done],i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap: isMobile ? 8 : 12 }}>
              <div style={{ width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius:999, background: done ? "var(--bo-cyan)" : (i===2 ? "var(--bo-ink)" : "var(--bo-line)"), color:"#fff", display:"grid", placeItems:"center", fontSize:12, fontWeight:700 }}>{done ? <Icon.Check width="14" height="14"/> : n}</div>
              <span style={{ fontWeight:600, fontSize: isMobile ? 13 : 14, color: i===2 ? "var(--bo-ink)" : "var(--bo-ink-mute)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <section style={{ padding: isMobile ? "24px 20px 60px" : "44px 56px 80px", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: isMobile ? 20 : 48, maxWidth:1240, margin:"0 auto" }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 24 : 30, marginBottom:20 }}>Pago</h2>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid var(--bo-line-soft)", padding: isMobile ? 18 : 28, marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize: isMobile ? 14 : 16 }}>Método de pago</div>
            <div style={{ display:"grid", gap:8 }}>
              {[{l:"Tarjeta de crédito o débito",s:"Visa · Mastercard · Amex",sel:true},{l:"PayPal",s:"Pagas con tu cuenta PayPal",sel:false},{l:"Bizum",s:"Pago instantáneo desde tu móvil",sel:false},{l:"Apple Pay",s:"Pago rápido con Touch ID/Face ID",sel:false}].map((m,i) => (
                <div key={i} style={{ padding:14, borderRadius:10, border: m.sel ? "2px solid var(--bo-cyan)" : "1.5px solid var(--bo-line)", background: m.sel ? "var(--bo-cyan-tint)" : "#fff", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
                  <div style={{ width:18, height:18, borderRadius:999, border:"2px solid "+(m.sel ? "var(--bo-cyan)" : "var(--bo-line)"), display:"grid", placeItems:"center", flexShrink:0 }}>
                    {m.sel && <div style={{ width:7, height:7, borderRadius:999, background:"var(--bo-cyan)" }}/>}
                  </div>
                  <div><div style={{ fontWeight:600, fontSize:13 }}>{m.l}</div><div style={{ fontSize:11, color:"var(--bo-ink-mute)" }}>{m.s}</div></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, display:"grid", gap:12 }}>
              {[["Número de tarjeta","1234  5678  9012  3456"],["Caducidad","MM/AA"],["CVC","•••"],["Titular","Nombre y apellidos"]].map(([l,ph],i) => (
                i===1 ? null : (
                  <div key={i}>
                    <div style={{ fontSize:12, color:"var(--bo-ink-mute)", marginBottom:5, fontWeight:500 }}>{l}</div>
                    <input placeholder={ph} style={{ width:"100%", padding:"11px 12px", borderRadius:10, border:"1.5px solid var(--bo-line)", fontSize:14, outline:"none" }}/>
                  </div>
                )
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["Caducidad","MM/AA"],["CVC","•••"]].map(([l,ph]) => (
                  <div key={l}><div style={{ fontSize:12, color:"var(--bo-ink-mute)", marginBottom:5, fontWeight:500 }}>{l}</div><input placeholder={ph} style={{ width:"100%", padding:"11px 12px", borderRadius:10, border:"1.5px solid var(--bo-line)", fontSize:14, outline:"none" }}/></div>
                ))}
              </div>
            </div>
          </div>
          <button className="bo-btn bo-btn-primary" style={{ width:"100%", justifyContent:"center", padding:"16px 20px", fontSize:15 }}>
            <Icon.Lock width="15" height="15"/> Pagar 62,80€
          </button>
          <p style={{ fontSize:11, color:"var(--bo-ink-mute)", textAlign:"center", marginTop:12 }}>Al pagar aceptas nuestros Términos y Política de privacidad. Tu pedido está protegido por la garantía de 30 noches.</p>
        </div>
        <aside>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid var(--bo-line-soft)", padding: isMobile ? 18 : 24 }}>
            <div className="bo-eyebrow" style={{ marginBottom:12 }}>Tu pedido</div>
            {[{img:"assets/products/cintas-bucales-pack.webp",name:"Cintas Bucales Premium",v:"Pack 60 noches",price:"42,90"},{img:"assets/products/tiras-pack.webp",name:"Tiras Nasales",v:"30 unidades",price:"19,90"}].map((it,i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"50px 1fr auto", gap:12, alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--bo-line-soft)" }}>
                <div style={{ width:50, height:50, borderRadius:8, background:"var(--bo-cyan-tint)", display:"grid", placeItems:"center", position:"relative" }}>
                  <img src={it.img} alt={it.name} loading="lazy" style={{ maxWidth:"80%", maxHeight:"80%", objectFit:"contain" }}/>
                  <div style={{ position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:999, background:"var(--bo-ink)", color:"#fff", fontSize:9, fontWeight:700, display:"grid", placeItems:"center" }}>1</div>
                </div>
                <div><div style={{ fontSize:13, fontWeight:600 }}>{it.name}</div><div style={{ fontSize:11, color:"var(--bo-ink-mute)" }}>{it.v}</div></div>
                <div style={{ fontWeight:600, fontSize:13 }}>{it.price}€</div>
              </div>
            ))}
            <div style={{ display:"grid", gap:7, padding:"14px 0", fontSize:13, color:"var(--bo-ink-soft)" }}>
              {[["Subtotal","62,80€"],["Envío",null],["IVA","incluido"]].map(([k,v],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between" }}><span>{k}</span>{i===1 ? <span style={{color:"var(--bo-cyan-deep)",fontWeight:600}}>GRATIS</span> : <span>{v}</span>}</div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:12, borderTop:"1px solid var(--bo-line-soft)" }}>
              <span style={{ fontWeight:700 }}>Total</span>
              <span style={{ fontSize:22, fontWeight:700, fontFamily:"var(--bo-font-display)" }}>62,80€</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ===== PAGE: FAQ ===== */

function FaqA() {
  const [open, setOpen] = useS("0-0");
  useSEO({
    title: "Preguntas Frecuentes — Cintas Bucales y Tiras Nasales | BeniOptions",
    description: "Resolvemos tus dudas sobre cintas bucales y tiras nasales BeniOptions: seguridad, uso, envíos y garantía de 30 noches. Atención personalizada disponible.",
    canonical: "https://www.benioptions.es/faq",
    breadcrumb: [
      { name: "Inicio", url: "https://www.benioptions.es/" },
      { name: "Preguntas Frecuentes", url: "https://www.benioptions.es/faq" },
    ],
  });
  const cats = [
    {name:"Producto",qs:[["¿Las cintas bucales son seguras?","Sí. El adhesivo es médico, hipoalergénico y respira con tu piel. Están testadas dermatológicamente y diseñadas para uso nocturno prolongado en adultos sanos."],["¿Pueden irritar la piel?","Hemos trabajado el adhesivo para que no irrite ni deje marca. En pieles muy sensibles recomendamos empezar con noches alternas la primera semana."],["¿Son reutilizables?","Cada cinta es de un solo uso (excepto las magnéticas, que son reutilizables con recambios)."]]},
    {name:"Uso",qs:[["¿Cuántas horas se pueden llevar?","Hasta 9 horas. Están diseñadas para una noche completa."],["¿Funcionan si tengo barba?","Sí. La adhesión es óptima sobre piel limpia y seca; sobre barba el agarre es algo menor pero igualmente efectivo."]]},
    {name:"Envío y devolución",qs:[["¿Cuánto tarda el envío?","24–48h en península y Baleares. Gratis en pedidos +30€."],["¿Cómo funciona la garantía de 30 noches?","Pruébalo durante un mes. Si no notas la diferencia, te devolvemos el 100% del importe sin preguntas."]]},
  ];
  const isMobile = useIsMobile();
  return (
    <div className="bo-root" style={{ background:"var(--bo-bg)" }}>
      <Announcement/><NavBar/>
      <section style={{ padding: isMobile ? "40px 20px 20px" : "60px 56px 24px", textAlign:"center" }}>
        <div className="bo-eyebrow" style={{ marginBottom:12 }}>Centro de ayuda</div>
        <h1 style={{ fontSize: isMobile ? 40 : 64, marginBottom:14 }}>Preguntas frecuentes</h1>
        <p style={{ fontSize: isMobile ? 15 : 17, color:"var(--bo-ink-mute)", maxWidth:540, margin:"0 auto" }}>Resolvemos las dudas más habituales. Si no encuentras lo que buscas, escríbenos.</p>
      </section>
      <section style={{ padding: isMobile ? "24px 20px 60px" : "40px 56px 100px", maxWidth:880, margin:"0 auto" }}>
        {cats.map((cat,ci) => (
          <div key={ci} style={{ marginBottom: isMobile ? 36 : 56 }}>
            <h2 style={{ fontSize: isMobile ? 22 : 28, marginBottom:14, color:"var(--bo-cyan-deep)" }}>{cat.name}</h2>
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid var(--bo-line-soft)" }}>
              {cat.qs.map(([q,a],qi) => {
                const id=`${ci}-${qi}`, isOpen=open===id;
                return (
                  <div key={qi} style={{ borderBottom: qi<cat.qs.length-1 ? "1px solid var(--bo-line-soft)" : "none" }}>
                    <button onClick={() => setOpen(isOpen?null:id)} style={{ width:"100%", padding: isMobile ? "18px 20px" : "22px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left", fontSize: isMobile ? 15 : 17, fontWeight:600, color:"var(--bo-ink)", background:"none", border:"none", cursor:"pointer" }}>
                      {q}<Icon.Plus width="18" height="18" style={{ color:"var(--bo-cyan)", transform: isOpen?"rotate(45deg)":"none", transition:"transform .2s", flexShrink:0, marginLeft:12 }}/>
                    </button>
                    {isOpen && <div style={{ padding: isMobile ? "0 20px 18px" : "0 28px 24px", fontSize: isMobile ? 14 : 15, color:"var(--bo-ink-mute)", lineHeight:1.6 }}>{a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
      <Footer/>
    </div>
  );
}

/* ===== PAGE: ABOUT ===== */

function AboutA() {
  const isMobile = useIsMobile();
  useSEO({
    title: "Nuestra Historia — Por Qué Existe BeniOptions | BeniOptions",
    description: "Aníbal, fundador de BeniOptions, comparte cómo respirar mejor por la noche cambió su vida. La historia real detrás de la marca.",
    canonical: "https://www.benioptions.es/nosotros",
    breadcrumb: [
      { name: "Inicio", url: "https://www.benioptions.es/" },
      { name: "Sobre BeniOptions", url: "https://www.benioptions.es/nosotros" },
    ],
  });
  return (
    <div className="bo-root" style={{ background:"var(--bo-bg-pure)" }}>
      <Announcement/><NavBar/>
      <section style={{ padding: isMobile ? "48px 20px 28px" : "80px 56px 40px", textAlign:"center", maxWidth:880, margin:"0 auto" }}>
        <div className="bo-eyebrow" style={{ marginBottom:12 }}>Mi historia</div>
        <h1 style={{ fontSize: isMobile ? 40 : 72, marginBottom:20, lineHeight:1.05 }}>Romper el patrón empieza<br/>por cuidarte a ti mismo.</h1>
        <p style={{ fontSize: isMobile ? 16 : 19, color:"var(--bo-ink-mute)", lineHeight:1.6 }}>Te voy a contar la verdad que me cambió la vida. No es una historia bonita. Pero es la mía, y por eso existe BeniOptions.</p>
      </section>
      <section style={{ padding: isMobile ? "20px 20px 56px" : "40px 56px 80px", maxWidth:920, margin:"0 auto" }}>
        <div style={{ display:"grid", gap: isMobile ? 28 : 40 }}>
          {[
            {n:"01",t:"Hubo un tiempo en el que vivía roto por dentro.",p:["Ansiedad por las mañanas. Insomnio por las noches. Comía a deshoras lo primero que pillaba, bebía más de la cuenta, fumaba para tapar el ruido de la cabeza. Mi cuerpo iba por un lado y mi mente por otro, y los dos estaban agotados.","Por fuera funcionaba. Trabajaba, sonreía, contestaba 'todo bien'. Por dentro estaba desregulado, aunque entonces no sabía que esa palabra existía."]},
            {n:"02",t:"Una noche cualquiera, toqué fondo.",p:["No fue una catástrofe. Fue una noche más a las cuatro de la mañana mirando el techo, con el corazón a mil sin motivo. Me levanté, me miré al espejo y entendí algo muy simple: si yo no cambiaba, nada iba a cambiar.","Ese fondo no fue un final. Fue un punto de apoyo. Lo único firme que tenía debajo de los pies para volver a empujar hacia arriba."]},
            {n:"03",t:"Empecé por lo más pequeño: respirar bien por la noche.",p:["No fui al gimnasio. No empecé una dieta. Empecé por algo casi ridículo de tan pequeño: cerrar la boca al dormir y respirar por la nariz. Un gesto de un minuto antes de meterme en la cama.","A las dos semanas, dormía del tirón por primera vez en años. A las cuatro, mi mujer me dijo que ya no roncaba. A los dos meses, había bajado la ansiedad sin tomar nada, y los lunes habían dejado de ser un muro."]},
            {n:"04",t:"Aprendí a nadar en una vida ordenada.",p:["Cuando el cuerpo se regula, lo demás encuentra su sitio. La comida, el alcohol, el deporte, la cabeza. No al revés. Llevaba toda la vida intentándolo al revés.","Lo que yo necesitaba no era más fuerza de voluntad. Era un gesto pequeño, repetido cada noche, que ordenara mi sistema nervioso mientras dormía."]},
            {n:"05",t:"Por eso nace BeniOptions.",p:["Porque sé lo que es estar donde tú estás. Porque sé que no necesitas otro programa de seis meses, ni un retiro, ni una app más. Necesitas algo pequeño que puedas hacer esta noche.","BeniOptions es la herramienta que ordena tu cuerpo mientras duermes. Para que rompas el patrón, regules tu cuerpo y vuelvas a confiar en ti mismo. Esto te lo digo porque estuve donde tú estás."]},
          ].map((c,i,arr) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns: isMobile ? "40px 1fr" : "80px 1fr", gap: isMobile ? 16 : 32, alignItems:"start", paddingBottom: isMobile ? 24 : 36, borderBottom: i<arr.length-1 ? "1px solid var(--bo-line-soft)" : "none" }}>
              <div style={{ fontFamily:"var(--bo-font-mono)", fontSize: isMobile ? 12 : 14, color:"var(--bo-cyan-deep)", letterSpacing:"0.16em", paddingTop:6 }}>{c.n}</div>
              <div>
                <h3 style={{ fontSize: isMobile ? 20 : 30, marginBottom: isMobile ? 12 : 18, lineHeight:1.15 }}>{c.t}</h3>
                {c.p.map((para,j) => <p key={j} style={{ fontSize: isMobile ? 15 : 17, color:"var(--bo-ink-soft)", lineHeight:1.7, marginBottom: j<c.p.length-1?12:0 }}>{para}</p>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: isMobile ? 40 : 60, paddingTop: isMobile ? 28 : 40, borderTop:"1px solid var(--bo-line-soft)", display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", overflow:"hidden", border:"1px solid var(--bo-line-soft)", flexShrink:0 }}>
            <img src={"assets/brand/anibal-fundador.webp"} alt="Aníbal, fundador de BeniOptions" loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
          <div>
            <div style={{ fontFamily:"var(--bo-font-display)", fontStyle:"italic", fontSize: isMobile ? 18 : 22, lineHeight:1.1 }}>Aníbal</div>
            <div style={{ fontSize:12, color:"var(--bo-ink-mute)", marginTop:3, fontFamily:"var(--bo-font-mono)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Fundador · BeniOptions</div>
          </div>
        </div>
      </section>
      <section style={{ padding: isMobile ? "56px 20px" : "80px 56px", background:"var(--bo-bg)", textAlign:"center" }}>
        <div className="bo-eyebrow" style={{ marginBottom:12 }}>Promesa de marca</div>
        <h2 style={{ fontSize: isMobile ? 36 : 64, maxWidth:980, margin:"0 auto 20px", lineHeight:1.1, letterSpacing:"-0.02em" }}>Tu mejor versión <span style={{ color:"var(--bo-cyan-deep)" }}>empieza al dormir</span>.</h2>
        <p style={{ fontSize: isMobile ? 15 : 18, color:"var(--bo-ink-mute)", maxWidth:720, margin:"0 auto", lineHeight:1.6 }}>No vendemos una cinta. Vendemos una herramienta de transformación nocturna: un acceso a calma, regulación, equilibrio e identidad.</p>
      </section>
      <section style={{ padding: isMobile ? "56px 20px" : "100px 56px" }}>
        <div className="bo-eyebrow" style={{ textAlign:"center", marginBottom:12 }}>Lo que creemos</div>
        <h2 style={{ fontSize: isMobile ? 30 : 48, textAlign:"center", marginBottom: isMobile ? 32 : 56 }}>Cuatro verdades guía.</h2>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: isMobile ? 14 : 20, maxWidth:1080, margin:"0 auto" }}>
          {[{t:"Todo empieza por un gesto sencillo.",d:"Que puedes hacer hoy. Sin fuerza de voluntad infinita, sin gimnasio, sin retiros."},{t:"Regula tu cuerpo para regular tu vida.",d:"El sistema nervioso es la base. Cuando él se ordena, lo demás encuentra su sitio."},{t:"Dormir es tu primer hábito.",d:"Antes que la dieta, el deporte o la productividad. El descanso también se entrena."},{t:"Cuídate como cuidas a alguien que quieres.",d:"El primer cliente eres tú. Aquí no hay héroes, solo personas regulándose."}].map((v,i) => (
            <div key={i} style={{ padding: isMobile ? 22 : 32, borderRadius:18, background:"#fff", border:"1px solid var(--bo-line-soft)" }}>
              <h3 style={{ fontSize: isMobile ? 18 : 22, marginBottom:10 }}>{v.t}</h3>
              <p style={{ fontSize: isMobile ? 14 : 15, color:"var(--bo-ink-mute)", lineHeight:1.6 }}>{v.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: isMobile ? "56px 20px" : "80px 56px", background:"var(--bo-bg)" }}>
        <div className="bo-eyebrow" style={{ textAlign:"center", marginBottom:12 }}>Cómo trabajamos</div>
        <h2 style={{ fontSize: isMobile ? 30 : 48, textAlign:"center", marginBottom: isMobile ? 32 : 56 }}>Tres reglas, sin excepciones.</h2>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 14 : 24, maxWidth:1140, margin:"0 auto" }}>
          {[{n:"01",t:"Calidad clínica",d:"Materiales hipoalergénicos, testados dermatológicamente y validados por especialistas en sueño y respiración."},{n:"02",t:"Cero humo",d:"Hablamos claro: lo que hace y lo que no. Si tienes apnea severa, te decimos que vayas al médico."},{n:"03",t:"Garantía real",d:"30 noches para probar. Si no funciona en tu casa, te devolvemos el dinero, sin formularios infinitos."}].map((v,i) => (
            <div key={i} style={{ padding: isMobile ? 22 : 36, borderRadius: isMobile ? 16 : 24, background:"#fff", border:"1px solid var(--bo-line-soft)" }}>
              <div style={{ fontFamily:"var(--bo-font-mono)", fontSize:12, color:"var(--bo-cyan-deep)", marginBottom: isMobile ? 14 : 28 }}>{v.n}</div>
              <h3 style={{ fontSize: isMobile ? 18 : 24, marginBottom:10 }}>{v.t}</h3>
              <p style={{ fontSize: isMobile ? 14 : 15, color:"var(--bo-ink-mute)", lineHeight:1.6 }}>{v.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: isMobile ? "56px 20px 60px" : "80px 56px 100px" }}>
        <div className="bo-eyebrow" style={{ textAlign:"center", marginBottom:12 }}>Consejo asesor</div>
        <h2 style={{ fontSize: isMobile ? 28 : 48, textAlign:"center", marginBottom: isMobile ? 28 : 56 }}>Profesionales detrás de cada decisión.</h2>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 14 : 20, maxWidth:1240, margin:"0 auto" }}>
          {[{n:"Dra. Marina Vilanova",r:"Neumóloga · Hospital Clínic",c:"#D4A574"},{n:"Dr. Iván Pellicer",r:"Especialista en sueño · IIS",c:"#9F8267"},{n:"Lola Ramírez",r:"Dermatóloga clínica",c:"#D9B89C"},{n:"Carles Fontana",r:"Fisiología del ejercicio · INEFC",c:"#B68B6E"}].map((m,i) => (
            <div key={i}>
              <div style={{ aspectRatio:"1/1.15", borderRadius:16, marginBottom:12, background:`linear-gradient(160deg,${m.c},var(--bo-bg-soft))`, border:"1px solid var(--bo-line-soft)", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(45deg,rgba(255,255,255,.08) 0 8px,transparent 8px 16px)" }}/>
                <div style={{ position:"absolute", bottom:10, left:10, padding:"4px 8px", borderRadius:999, background:"rgba(255,255,255,.85)", fontSize:9, fontFamily:"var(--bo-font-mono)", letterSpacing:"0.12em" }}>RETRATO</div>
              </div>
              <div style={{ fontWeight:600, fontSize: isMobile ? 13 : 16 }}>{m.n}</div>
              <div style={{ fontSize: isMobile ? 12 : 13, color:"var(--bo-ink-mute)", marginTop:3 }}>{m.r}</div>
            </div>
          ))}
        </div>
      </section>
      <Footer/>
    </div>
  );
}

/* ===== ROUTER & EXPORT ===== */

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    if (pendingScrollId) {
      const id = pendingScrollId;
      pendingScrollId = null;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [path]);

  const normalizedPath = BASE_PATH && path.startsWith(BASE_PATH)
    ? (path.slice(BASE_PATH.length) || '/')
    : path;

  switch (normalizedPath) {
    case '/tienda':   return <CatalogA />;
    case '/producto': return <ProductA />;
    case '/carrito':  return <CartA />;
    case '/checkout': return <CheckoutA />;
    case '/faq':      return <FaqA />;
    case '/nosotros': return <AboutA />;
    default:          return <HomeA />;
  }
}
