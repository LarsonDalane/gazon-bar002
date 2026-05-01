import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const MGR_EMAIL = "DirectionGazonbar@gmail.com";
const MGR_PASS  = "Gazon@2024";
const WA1 = "237655837076";
const WA2 = "237695277722";
const MAX_LOGIN_ATTEMPTS = 3;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

const PRODUCTS = [
  { id:1,  name:"33 Export",           cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🍺", tag:"popular" },
  { id:2,  name:"Mutzig",              cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🍺" },
  { id:3,  name:"Castel",              cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🍺" },
  { id:4,  name:"Doppel",              cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🍺" },
  { id:5,  name:"Castle",              cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🍺" },
  { id:6,  name:"Ice Ananas",          cat:"Brasseries", unit:"casier",  price:10300, emoji:"🍹" },
  { id:7,  name:"Ice Black",           cat:"Brasseries", unit:"casier",  price:10300, emoji:"🍹" },
  { id:8,  name:"Booster Gin Tonic",   cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🥂" },
  { id:9,  name:"Booster Whisky Cola", cat:"Brasseries", unit:"casier",  price:8000,  emoji:"🥂" },
  { id:10, name:"Manyan",              cat:"Brasseries", unit:"casier",  price:6000,  emoji:"🍺" },
  { id:11, name:"Isenbeck",            cat:"Brasseries", unit:"casier",  price:9000,  emoji:"🍺" },
  { id:12, name:"Beaufort Ordinaire",  cat:"Brasseries", unit:"casier",  price:7800,  emoji:"🍺" },
  { id:13, name:"Beaufort Light",      cat:"Brasseries", unit:"casier",  price:7800,  emoji:"🍺" },
  { id:14, name:"Djino Cocktail",      cat:"Brasseries", unit:"palette", price:3500,  emoji:"🥤" },
  { id:15, name:"Orangina",            cat:"Brasseries", unit:"palette", price:4100,  emoji:"🍊" },
  { id:16, name:"Top Orange",          cat:"Brasseries", unit:"palette", price:2600,  emoji:"🍊" },
  { id:17, name:"Top Pamplemousse",    cat:"Brasseries", unit:"palette", price:2600,  emoji:"🍋" },
  { id:18, name:"Top Grenadine",       cat:"Brasseries", unit:"palette", price:2600,  emoji:"🍒" },
  { id:19, name:"Top Ananas",          cat:"Brasseries", unit:"palette", price:2600,  emoji:"🍍" },
  { id:20, name:"Coca World",          cat:"Brasseries", unit:"palette", price:3200,  emoji:"🥤" },
  { id:21, name:"Eau Ôpur",            cat:"Brasseries", unit:"palette", price:1300,  emoji:"💧" },
  { id:22, name:"Eau Supermont",       cat:"Brasseries", unit:"palette", price:1500,  emoji:"💧" },
  { id:23, name:"Eau Vital",           cat:"Brasseries", unit:"palette", price:1200,  emoji:"💧" },
  { id:24, name:"Petite Guinness",     cat:"Guinness",   unit:"casier",  price:16000, emoji:"🍺" },
  { id:25, name:"Origine",             cat:"Guinness",   unit:"casier",  price:9000,  emoji:"🍺" },
  { id:26, name:"Harp",                cat:"Guinness",   unit:"casier",  price:9000,  emoji:"🍺" },
  { id:27, name:"Kadji Beer",          cat:"Kadji",      unit:"casier",  price:8300,  emoji:"🏺" },
];
const CATS = ["Tous","Brasseries","Guinness","Kadji"];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ORDER_STATUSES = {
  pending:   { label:"En attente",    color:"#E67E22", next:"confirmed" },
  confirmed: { label:"Confirmé",      color:"#2980B9", next:"preparing" },
  preparing: { label:"En préparation",color:"#8E44AD", next:"ready"     },
  ready:     { label:"Prêt",          color:"#27AE60", next:"delivered" },
  delivered: { label:"Livré",         color:"#2DBF58", next:null        },
  cancelled: { label:"Annulée",       color:"#C0392B", next:null        },
};

const C = {
  bg:"#060C08", card:"#0D1810", green:"#1A6B35", greenL:"#2DBF58",
  gold:"#C9960A", goldL:"#F5C842", cream:"#FDF3DC",
  dim:"rgba(253,243,220,0.4)", border:"rgba(201,150,10,0.2)",
  red:"#C0392B", orange:"#D4722A", blue:"#2980B9", purple:"#8E44AD",
};
const SF = { fontFamily:"Georgia,serif" };

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Toast({ t }) {
  if (!t) return null;
  const bg = { success:C.green, error:C.red, info:C.blue, warning:C.orange }[t.type]||C.green;
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
      background:bg, color:C.cream, padding:"12px 22px", borderRadius:30,
      fontSize:13, fontWeight:"bold", zIndex:9999, whiteSpace:"nowrap",
      boxShadow:"0 8px 30px rgba(0,0,0,0.6)", ...SF, maxWidth:"90vw",
      textOverflow:"ellipsis", overflow:"hidden" }}>{t.msg}</div>
  );
}

function Inp({ label, value, onChange, placeholder, type="text", disabled=false, right }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ color:C.dim, fontSize:11, letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <div style={{ position:"relative" }}>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          style={{ width:"100%", padding:`12px ${right?"42px":"14px"} 12px 14px`,
            background:disabled?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.05)",
            border:`1px solid ${C.border}`, borderRadius:10, color:disabled?C.dim:C.cream,
            fontSize:14, outline:"none", boxSizing:"border-box", ...SF }} />
        {right && <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>{right}</div>}
      </div>
    </div>
  );
}

function Nav({ title, onBack, right, badge=0 }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:50,
      background:`linear-gradient(135deg,${C.bg} 60%,${C.green}18)`,
      borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"13px 18px", backdropFilter:"blur(16px)", ...SF }}>
      {onBack
        ? <button onClick={onBack} style={{ background:"none", border:"none", color:C.goldL, fontSize:22, cursor:"pointer", lineHeight:1 }}>←</button>
        : <div style={{width:28}}/>}
      <span style={{ color:C.goldL, fontWeight:"bold", fontSize:14, letterSpacing:1 }}>{title}</span>
      {right||<div style={{width:42}}/>}
    </div>
  );
}

function Pill({ label, color, small=false }) {
  return (
    <span style={{ padding:small?"2px 8px":"3px 10px", borderRadius:20,
      fontSize:small?9:10, fontWeight:"bold",
      background:`${color}22`, color, border:`1px solid ${color}44`, ...SF }}>{label}</span>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ ...SF, flex:1, padding:"10px 2px", border:"none",
      background:active?`rgba(201,150,10,0.1)`:"transparent",
      color:active?C.goldL:C.dim, fontWeight:"bold", fontSize:10,
      borderBottom:active?`2px solid ${C.gold}`:"2px solid transparent",
      cursor:"pointer" }}>{children}</button>
  );
}

function Card({ children, gold=false, style={} }) {
  return (
    <div style={{ background:gold?"rgba(201,150,10,0.07)":"rgba(255,255,255,0.025)",
      borderRadius:14, padding:16,
      border:`1px solid ${gold?C.border:"rgba(255,255,255,0.06)"}`, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ color:C.gold, fontSize:10, fontWeight:"bold",
    letterSpacing:2, textTransform:"uppercase", marginBottom:10, marginTop:4 }}>{children}</div>;
}

function Btn({ onClick, children, variant="primary", full=false, small=false, disabled=false }) {
  const styles = {
    primary: { background:`linear-gradient(135deg,${C.green},${C.greenL})`, color:C.cream, border:"none", boxShadow:`0 6px 20px rgba(26,107,53,0.3)` },
    gold:    { background:`linear-gradient(135deg,${C.gold},${C.orange})`,  color:C.bg,   border:"none" },
    outline: { background:"transparent", color:C.goldL, border:`1px solid ${C.gold}` },
    ghost:   { background:"transparent", color:C.dim,   border:"1px solid rgba(255,255,255,0.08)" },
    danger:  { background:"rgba(192,57,43,0.15)", color:C.red, border:`1px solid ${C.red}` },
    wa:      { background:"rgba(37,211,102,0.1)", color:"#25D366", border:"1px solid rgba(37,211,102,0.3)" },
    mail:    { background:"rgba(41,128,185,0.1)", color:"#5DADE2", border:"1px solid rgba(41,128,185,0.3)" },
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{
      ...SF, ...(styles[variant]||styles.primary),
      padding: small?"7px 16px":full?"16px":"13px 22px",
      borderRadius:small?20:14, fontSize:small?12:15,
      fontWeight:"bold", cursor:disabled?"not-allowed":"pointer",
      width:full?"100%":"auto", letterSpacing:0.5,
      opacity:disabled?0.4:1, transition:"opacity .2s",
    }}>{children}</button>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"50px 20px" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <div style={{ color:C.cream, fontSize:15, fontWeight:"bold", marginBottom:6 }}>{title}</div>
      <div style={{ color:C.dim, fontSize:13 }}>{sub}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"rgba(255,255,255,0.05)", margin:"12px 0" }}/>;
}

// ─── EMAILJS CONFIG ─────────────────────────────────────────────────────────
// Setup: go to emailjs.com, create free account, create service + template
// Replace these 3 values with yours from EmailJS dashboard
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";

async function sendTwoFAEmail(toEmail, clientName, code) {
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          to_name: clientName,
          code: code,
          app_name: "GAZON BAR",
        }
      })
    });
    return res.ok;
  } catch(e) { console.error("EmailJS error:", e); return false; }
}

async function sendOrderEmail(toEmail, clientName, orderText) {
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: MGR_EMAIL,
          to_name: "Direction GAZON BAR",
          code: orderText,
          app_name: "GAZON BAR — Nouvelle Commande de " + clientName,
        }
      })
    });
    return res.ok;
  } catch(e) { console.error("EmailJS error:", e); return false; }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = n => n?.toLocaleString("fr-FR")||"0";
const fmtDate = d => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
const genCode = () => String(Math.floor(100000+Math.random()*900000));
const genId   = () => `ORD-${Date.now().toString(36).toUpperCase()}`;

function buildWaText(cart, total, clientName, note, delivDate, getPrice) {
  const lines = cart.map(i=>`• ${i.product.name}${i.demi?" (½ casier)":""} x${i.qty} → ${fmt(getPrice(i.product,i.demi)*i.qty)} FCFA`).join("\n");
  return `🍺 *GAZON BAR — Précommande Gros*\n━━━━━━━━━━━━━━━━━\n👤 *Client :* ${clientName}\n📅 *Livraison souhaitée :* ${delivDate||"À définir"}\n\n*DÉTAIL :*\n${lines}\n\n💰 *TOTAL : ${fmt(total)} FCFA*\n\n${note?`📝 Note : ${note}\n\n`:""}📍 Carrefour An 2000, Don Bosco, Ebolowa\n📞 695 277 722 | 655 837 076`;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function GazonBar() {
  // ── Core state
  const [page, setPage]             = useState("landing");
  const [session, setSession]       = useState(null);
  const [clients, setClients]       = useState([]);
  const [orders, setOrders]         = useState([]);
  const [products, setProducts]     = useState(PRODUCTS);
  const [stock, setStock]           = useState(()=>Object.fromEntries(PRODUCTS.map(p=>[p.id,true])));
  const [promoMap, setPromoMap]     = useState({});
  const [notifications, setNotifs]  = useState([]);
  const [loginAttempts, setLoginAttempts] = useState({});

  // ── Cart state
  const [cart, setCart]           = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [delivDate, setDelivDate] = useState("");
  const [favorites, setFavorites] = useState([]);

  // ── UI state
  const [catFilter, setCatFilter] = useState("Tous");
  const [search, setSearch]       = useState("");
  const [mgrTab, setMgrTab]       = useState("dashboard");
  const [statPeriod, setStatPeriod] = useState("month");
  const [toast, setToast]         = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [announcement, setAnnouncement] = useState(""); // Manager can set a banner message
  const [announceExpiry, setAnnounceExpiry] = useState(null);
  const [editAnnounce, setEditAnnounce] = useState("");
  const [minOrder, setMinOrder] = useState(0); // Minimum order amount
  const [lowStockMap, setLowStockMap] = useState({}); // { productId: true } = low stock
  const [cancelReason, setCancelReason] = useState("");
  const [messages, setMessages] = useState([]); // { id, from, text, date, clientId, read }
  const [newMsg, setNewMsg] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [newProductF, setNewProductF] = useState({ name:"", cat:"Brasseries", unit:"casier", price:"", emoji:"🍺", tag:"new" });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [recurringOrders, setRecurringOrders] = useState([]); // { id, clientId, cart, freq, nextDate }
  const [orderReceipt, setOrderReceipt] = useState(null);
  const [theme, setTheme] = useState("dark"); // dark | light

  // ── Auth flow state
  const [lEmail, setLEmail]   = useState("");
  const [lPass,  setLPass]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [twoFACode, setTwoFACode]   = useState(null);
  const [twoFAInput, setTwoFAInput] = useState("");
  const [twoFAPending, setTwoFAPending] = useState(null);
  const [twoFATimer, setTwoFATimer] = useState(0);
  const [regF, setRegF] = useState({ name:"", bar:"", ville:"", phone:"", email:"", pass:"", pass2:"", licence:"", adminName:"", adminPhone:"", cgu:false });
  const setReg = k => v => setRegF(p=>({...p,[k]:v}));
  const [showAdmin, setShowAdmin] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode]   = useState(null);
  const [resetInput, setResetInput] = useState("");
  const [resetStep, setResetStep]   = useState(1);
  const [newPass, setNewPass]       = useState("");
  const [editPrices, setEditPrices] = useState({});
  const [premiumPrices, setPremiumPrices] = useState({}); // { clientId: { productId: price } }
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientF, setNewClientF] = useState({ name:"", bar:"", ville:"", phone:"", email:"", pass:"" });
  const [editPromos, setEditPromos] = useState({});
  const [profileF, setProfileF]     = useState(null);

  const timerRef    = useRef(null);
  const sessionRef  = useRef(null);

  const showToast = useCallback((msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 3500);
  }, []);

  // ── 2FA timer
  useEffect(()=>{
    if (twoFATimer>0) { timerRef.current=setTimeout(()=>setTwoFATimer(t=>t-1),1000); }
    return ()=>clearTimeout(timerRef.current);
  },[twoFATimer]);

  // ── Session timeout (30 min inactivity)
  const resetSessionTimer = useCallback(()=>{
    clearTimeout(sessionRef.current);
    if (session) {
      sessionRef.current = setTimeout(()=>{
        setSession(null); setPage("landing"); setCart([]);
        showToast("Session expirée pour votre sécurité","warning");
      }, SESSION_TIMEOUT_MS);
    }
  },[session, showToast]);

  useEffect(()=>{ resetSessionTimer(); },[session, resetSessionTimer]);

  // Auto-expire announcement after 1 hour
  useEffect(()=>{
    if (announceExpiry && new Date()>new Date(announceExpiry)) {
      setAnnouncement(""); setAnnounceExpiry(null);
    }
  },[announceExpiry]);

  // ── Add notification
  const addNotif = (msg, type="info") => {
    setNotifs(p=>[{ id:Date.now(), msg, type, read:false, time:new Date().toISOString() },...p].slice(0,50));
  };

  const unreadNotifs = notifications.filter(n=>!n.read).length;

  const logout = () => {
    setSession(null); setPage("landing"); setCart([]);
    setFavorites([]); setOrderNote(""); setDelivDate("");
    clearTimeout(sessionRef.current);
  };

  // ── Cart helpers
  const addItem = (p, demi=false) => {
    const key=`${p.id}-${demi}`;
    setCart(prev=>{ const ex=prev.find(i=>i.key===key); if(ex) return prev.map(i=>i.key===key?{...i,qty:i.qty+1}:i); return [...prev,{key,product:p,qty:1,demi}]; });
  };
  const removeItem = key => setCart(prev=>{ const ex=prev.find(i=>i.key===key); if(!ex) return prev; if(ex.qty===1) return prev.filter(i=>i.key!==key); return prev.map(i=>i.key===key?{...i,qty:i.qty-1}:i); });
  const clearCart = () => setCart([]);

  const getPrice = (p, demi=false) => {
    const cid = session?.user?.id;
    // Use custom VIP price if set for this client
    const customPrice = cid && premiumPrices[cid]?.[p.id];
    const basePrice = customPrice || p.price;
    const base = demi ? basePrice/2 : basePrice;
    const disc = customPrice ? 0 : (promoMap[p.id]||0)+(session?.user?.premium?5:0);
    return Math.round(base*(1-disc/100));
  };
  const itemTotal = i => getPrice(i.product,i.demi)*i.qty;
  const subtotal  = cart.reduce((s,i)=>s+itemTotal(i),0);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const toggleFav = id => setFavorites(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const filteredProds = products.filter(p=>{
    const matchCat  = catFilter==="Tous"||p.cat===catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && stock[p.id];
  });

  // ── Stats
  const getFilteredOrders = (clientId=null) => {
    const cutoff=new Date();
    if(statPeriod==="week")  cutoff.setDate(cutoff.getDate()-7);
    if(statPeriod==="month") cutoff.setMonth(cutoff.getMonth()-1);
    if(statPeriod==="year")  cutoff.setFullYear(cutoff.getFullYear()-1);
    return orders.filter(o=>{
      const inPeriod=new Date(o.date)>=cutoff;
      const forClient=clientId?o.clientId===clientId:true;
      return inPeriod&&forClient;
    });
  };
  const buildChart = (clientId=null) => {
    const data={};
    getFilteredOrders(clientId).forEach(o=>{
      const d=new Date(o.date);
      const key=statPeriod==="year"?MONTHS[d.getMonth()]:`${d.getDate()}/${d.getMonth()+1}`;
      if(!data[key]) data[key]={date:key,total:0,commandes:0};
      data[key].total+=o.total; data[key].commandes+=1;
    });
    return Object.values(data).reverse();
  };

  // ─────────────────────────────────────────────────────────────
  // LANDING
  // ─────────────────────────────────────────────────────────────
  if (page==="landing") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"40px 24px",
      textAlign:"center", position:"relative", overflow:"hidden" }}>
      {[220,360,500].map((sz,i)=>(
        <div key={i} style={{ position:"absolute", width:sz, height:sz, borderRadius:"50%",
          border:`1px solid rgba(201,150,10,${0.08-i*0.02})`,
          top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
      ))}
      <div style={{ fontSize:70, marginBottom:10, filter:"drop-shadow(0 0 24px rgba(201,150,10,0.5))" }}>🍺</div>
      <div style={{ fontSize:"clamp(26px,6vw,44px)", fontWeight:900,
        background:`linear-gradient(135deg,${C.goldL},${C.gold})`,
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        letterSpacing:4, marginBottom:6 }}>GAZON BAR</div>
      <div style={{ color:C.greenL, fontSize:11, letterSpacing:3, marginBottom:4 }}>VENTE EN GROS — EBOLOWA</div>
      <div style={{ color:C.dim, fontSize:12, marginBottom:2 }}>📍 Carrefour An 2000, avant le Collège Don Bosco</div>
      <div style={{ color:C.dim, fontSize:12, marginBottom:32 }}>📞 695 277 722 &nbsp;|&nbsp; 655 837 076</div>

      <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:300 }}>
        <Btn onClick={()=>setPage("login")} full>🔑 Se connecter</Btn>
        <Btn onClick={()=>setPage("register")} variant="outline" full>✨ Créer mon compte</Btn>
        <Btn onClick={()=>setPage("catalog")} variant="ghost" full small>👀 Voir le catalogue</Btn>
        <Btn onClick={()=>setPage("about")} variant="ghost" full small>ℹ️ À propos de GAZON BAR</Btn>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:28, flexWrap:"wrap", justifyContent:"center" }}>
        {["🔐 2FA Sécurisé","⭐ Clients VIP","📊 Statistiques","📦 27 Produits","📱 WhatsApp & Email"].map(f=>(
          <div key={f} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${C.border}`,
            background:"rgba(255,255,255,0.02)", color:C.dim, fontSize:10 }}>{f}</div>
        ))}
      </div>
      <Toast t={toast}/>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // ABOUT
  // ─────────────────────────────────────────────────────────────
  if (page==="about") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
      <Nav title="ℹ️ À propos" onBack={()=>setPage("landing")}/>
      <div style={{ padding:"24px 20px 60px", maxWidth:500, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:60, marginBottom:10 }}>🍺</div>
          <div style={{ color:C.goldL, fontSize:22, fontWeight:"bold" }}>GAZON BAR</div>
          <div style={{ color:C.greenL, fontSize:12, letterSpacing:2, marginTop:4 }}>GROSSISTE EN BOISSONS — EBOLOWA</div>
        </div>
        {[
          { icon:"📍", title:"Adresse", val:"Carrefour An 2000, avant le Collège Don Bosco\nEbolowa, Sud Cameroun" },
          { icon:"📞", title:"Contacts", val:"695 277 722\n655 837 076" },
          { icon:"📧", title:"Email", val:MGR_EMAIL },
          { icon:"⏰", title:"Horaires", val:"Lun – Sam : 7h00 – 22h00\nDimanche : 9h00 – 20h00" },
        ].map(item=>(
          <Card key={item.title} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ fontSize:24 }}>{item.icon}</span>
              <div>
                <div style={{ color:C.gold, fontSize:11, fontWeight:"bold", letterSpacing:1, marginBottom:4 }}>{item.title.toUpperCase()}</div>
                {item.val.split("\n").map((l,i)=><div key={i} style={{ color:C.cream, fontSize:14 }}>{l}</div>)}
              </div>
            </div>
          </Card>
        ))}
        <Card gold style={{ marginTop:16 }}>
          <SectionLabel>📦 Nos catégories</SectionLabel>
          {["🍺 Brasseries du Cameroun (SABC) — 23 produits","🍺 Guinness Cameroun — 3 produits","🏺 Kadji Beer — 1 produit"].map(c=>(
            <div key={c} style={{ color:C.cream, fontSize:13, marginBottom:6 }}>{c}</div>
          ))}
        </Card>
        <div style={{ marginTop:24 }}>
          <Btn onClick={()=>setPage("landing")} variant="outline" full>← Retour</Btn>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────
  if (page==="login") {
    const locked = (loginAttempts[lEmail]||0) >= MAX_LOGIN_ATTEMPTS;
    const doLogin = () => {
      if (!lEmail||!lPass) { showToast("Remplissez tous les champs","error"); return; }
      if (locked) { showToast("Compte verrouillé. Réinitialisez votre mot de passe.","error"); return; }
      if (lEmail===MGR_EMAIL && lPass===MGR_PASS) {
        setSession({ type:"manager", user:{ name:"Direction", email:MGR_EMAIL }});
        setPage("mgr"); setMgrTab("dashboard");
        showToast("Bienvenue Direction ! 👑"); return;
      }
      const c=clients.find(x=>x.email===lEmail&&x.pass===lPass);
      if (!c) {
        const attempts=(loginAttempts[lEmail]||0)+1;
        setLoginAttempts(p=>({...p,[lEmail]:attempts}));
        const remaining=MAX_LOGIN_ATTEMPTS-attempts;
        if (remaining<=0) showToast("Compte verrouillé après 3 tentatives","error");
        else showToast(`Identifiants incorrects. ${remaining} tentative(s) restante(s)`,"error");
        return;
      }
      setLoginAttempts(p=>({...p,[lEmail]:0}));
      const code=genCode();
      setTwoFACode(code); setTwoFAPending(c); setTwoFATimer(120); setTwoFAInput("");
      setPage("2fa");
      showToast(`Code envoyé à ${c.email}`,"info");
    };
    return (
      <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
        <Nav title="🔑 Connexion" onBack={()=>setPage("landing")}/>
        <div style={{ padding:"28px 20px", maxWidth:420, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🔐</div>
            <div style={{ color:C.goldL, fontSize:19, fontWeight:"bold", marginBottom:3 }}>Content de vous revoir</div>
            <div style={{ color:C.dim, fontSize:13 }}>Connexion sécurisée GAZON BAR</div>
          </div>
          <Card style={{ marginBottom:14 }}>
            <Inp label="ADRESSE EMAIL" value={lEmail} onChange={setLEmail} placeholder="votre@email.com" type="email"/>
            <Inp label="MOT DE PASSE"  value={lPass}  onChange={v=>setLPass(v)} placeholder="••••••••"
              type={showPass?"text":"password"}
              right={<button onClick={()=>setShowPass(!showPass)} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:16 }}>{showPass?"🙈":"👁️"}</button>}/>
          </Card>
          {locked && (
            <div style={{ background:"rgba(192,57,43,0.1)", borderRadius:10, padding:"10px 14px",
              border:"1px solid rgba(192,57,43,0.3)", marginBottom:14, color:C.red, fontSize:12 }}>
              🔒 Compte verrouillé. &nbsp;
              <button onClick={()=>setPage("reset")} style={{ ...SF, background:"none", border:"none",
                color:C.goldL, cursor:"pointer", fontSize:12, fontWeight:"bold", textDecoration:"underline" }}>
                Réinitialiser le mot de passe
              </button>
            </div>
          )}
          <div style={{ background:"rgba(41,128,185,0.07)", borderRadius:10, padding:"10px 14px",
            border:"1px solid rgba(41,128,185,0.2)", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
            <span>🛡️</span>
            <span style={{ color:"rgba(100,180,255,0.8)", fontSize:11 }}>Connexion protégée par double authentification 2FA</span>
          </div>
          <Btn onClick={doLogin} full disabled={locked}>Se connecter →</Btn>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:18 }}>
            <button onClick={()=>setPage("register")} style={{ ...SF, background:"none", border:"none", color:C.goldL, fontSize:12, fontWeight:"bold", cursor:"pointer" }}>✨ Créer un compte</button>
            <button onClick={()=>setPage("reset")} style={{ ...SF, background:"none", border:"none", color:C.dim, fontSize:12, cursor:"pointer" }}>Mot de passe oublié ?</button>
          </div>
          <Card gold style={{ marginTop:20 }}>
            <div style={{ color:C.gold, fontSize:10, fontWeight:"bold", letterSpacing:1, marginBottom:4 }}>👑 ACCÈS DIRECTION</div>
            <div style={{ color:C.dim, fontSize:11 }}>{MGR_EMAIL}</div>
            <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>Accès direct sans 2FA</div>
          </Card>
        </div>
        <Toast t={toast}/>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2FA
  // ─────────────────────────────────────────────────────────────
  if (page==="2fa") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
      <Nav title="🛡️ Vérification 2FA" onBack={()=>{ setPage("login"); setTwoFACode(null); setTwoFAPending(null); }}/>
      <div style={{ padding:"36px 24px", maxWidth:400, margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:14 }}>📧</div>
        <div style={{ color:C.goldL, fontSize:17, fontWeight:"bold", marginBottom:6 }}>Vérification en 2 étapes</div>
        <div style={{ color:C.dim, fontSize:13, marginBottom:4 }}>Code envoyé à</div>
        <div style={{ color:C.cream, fontSize:14, fontWeight:"bold", marginBottom:22 }}>{twoFAPending?.email}</div>
        <div style={{ background:"rgba(41,128,185,0.08)", borderRadius:12, padding:"14px 16px",
          border:"1px solid rgba(41,128,185,0.25)", marginBottom:20 }}>
          <div style={{ color:"rgba(100,180,255,0.8)", fontSize:12 }}>
            📧 Un code à 6 chiffres a été envoyé à votre adresse email. Vérifiez aussi vos spams.
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:8 }}>CODE À 6 CHIFFRES</div>
          <input maxLength={6} value={twoFAInput}
            onChange={e=>setTwoFAInput(e.target.value.replace(/\D/g,""))}
            placeholder="○ ○ ○ ○ ○ ○"
            style={{ width:"100%", padding:"16px", background:"rgba(255,255,255,0.05)",
              border:`2px solid ${twoFAInput.length===6?C.greenL:C.border}`,
              borderRadius:12, color:C.cream, fontSize:24, outline:"none",
              textAlign:"center", letterSpacing:8, boxSizing:"border-box", ...SF }}/>
        </div>
        {twoFATimer>0 && (
          <div style={{ color:C.dim, fontSize:12, marginBottom:14 }}>
            ⏱️ Code valide {Math.floor(twoFATimer/60)}:{String(twoFATimer%60).padStart(2,"0")}
          </div>
        )}
        <Btn onClick={()=>{
          if (twoFAInput===twoFACode) {
            setSession({type:"client",user:twoFAPending});
            setTwoFACode(null); setTwoFAPending(null); setTwoFAInput("");
            setPage("catalog"); showToast(`Bienvenue ${twoFAPending.bar} ! 🎉`);
          } else { showToast("Code incorrect","error"); setTwoFAInput(""); }
        }} full disabled={twoFAInput.length!==6}>✅ Vérifier et entrer</Btn>
        {twoFATimer===0 && (
          <div style={{ marginTop:14 }}>
            <Btn onClick={()=>{ const c=genCode(); setTwoFACode(c); setTwoFATimer(120); setTwoFAInput(""); showToast("Nouveau code généré","info"); }} variant="outline" small>🔄 Renvoyer le code</Btn>
          </div>
        )}
      </div>
      <Toast t={toast}/>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────────────
  if (page==="reset") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
      <Nav title="🔑 Réinitialisation" onBack={()=>{ setPage("login"); setResetStep(1); setResetCode(null); setResetEmail(""); setResetInput(""); setNewPass(""); }}/>
      <div style={{ padding:"36px 24px", maxWidth:400, margin:"0 auto", textAlign:"center" }}>
        {resetStep===1 && <>
          <div style={{ fontSize:52, marginBottom:14 }}>📧</div>
          <div style={{ color:C.goldL, fontSize:17, fontWeight:"bold", marginBottom:6 }}>Mot de passe oublié ?</div>
          <div style={{ color:C.dim, fontSize:13, marginBottom:24 }}>Entrez votre email pour recevoir un code de réinitialisation</div>
          <Inp label="ADRESSE EMAIL" value={resetEmail} onChange={setResetEmail} placeholder="votre@email.com" type="email"/>
          <Btn onClick={()=>{
            const c=clients.find(x=>x.email===resetEmail);
            if (!c) { showToast("Aucun compte avec cet email","error"); return; }
            const code=genCode(); setResetCode(code); setResetStep(2);
            const c2=clients.find(x=>x.email===resetEmail);
            sendTwoFAEmail(resetEmail, c2?.bar||"Client", code);
            showToast(`Code envoyé à ${resetEmail}`,"info");
          }} full>Envoyer le code →</Btn>
        </>}
        {resetStep===2 && <>
          <div style={{ fontSize:52, marginBottom:14 }}>🔢</div>
          <div style={{ color:C.goldL, fontSize:17, fontWeight:"bold", marginBottom:6 }}>Code de vérification</div>
          <div style={{ background:"rgba(41,128,185,0.08)", borderRadius:12, padding:"12px 16px",
            border:"1px solid rgba(41,128,185,0.25)", marginBottom:16 }}>
            <div style={{ color:"rgba(100,180,255,0.8)", fontSize:12 }}>
              📧 Code envoyé à {resetEmail}. Vérifiez vos spams.
            </div>
          </div>
          <input maxLength={6} value={resetInput} onChange={e=>setResetInput(e.target.value.replace(/\D/g,""))}
            placeholder="○ ○ ○ ○ ○ ○"
            style={{ width:"100%", padding:"14px", background:"rgba(255,255,255,0.05)",
              border:`2px solid ${resetInput.length===6?C.greenL:C.border}`,
              borderRadius:12, color:C.cream, fontSize:22, outline:"none",
              textAlign:"center", letterSpacing:6, boxSizing:"border-box", marginBottom:16, ...SF }}/>
          <Btn onClick={()=>{ if(resetInput===resetCode) setResetStep(3); else showToast("Code incorrect","error"); }} full disabled={resetInput.length!==6}>Vérifier →</Btn>
        </>}
        {resetStep===3 && <>
          <div style={{ fontSize:52, marginBottom:14 }}>🔒</div>
          <div style={{ color:C.goldL, fontSize:17, fontWeight:"bold", marginBottom:20 }}>Nouveau mot de passe</div>
          <Inp label="NOUVEAU MOT DE PASSE" value={newPass} onChange={setNewPass} placeholder="Min. 6 caractères" type="password"/>
          <Btn onClick={()=>{
            if (newPass.length<6) { showToast("Min. 6 caractères","error"); return; }
            setClients(p=>p.map(c=>c.email===resetEmail?{...c,pass:newPass}:c));
            setLoginAttempts(p=>({...p,[resetEmail]:0}));
            setPage("login"); setResetStep(1); setResetCode(null); setResetEmail(""); setNewPass("");
            showToast("Mot de passe mis à jour ! Reconnectez-vous.");
          }} full>✅ Mettre à jour</Btn>
        </>}
      </div>
      <Toast t={toast}/>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────
  if (page==="register") {
    const doRegister = () => {
      if (!regF.name||!regF.bar||!regF.phone||!regF.email||!regF.pass) { showToast("Champs obligatoires manquants","error"); return; }
      if (regF.pass!==regF.pass2) { showToast("Mots de passe différents","error"); return; }
      if (regF.pass.length<6) { showToast("Mot de passe trop court (min 6)","error"); return; }
      if (!regF.cgu) { showToast("Acceptez les CGU pour continuer","error"); return; }
      if (clients.find(c=>c.email===regF.email)) { showToast("Email déjà utilisé","error"); return; }
      const nc={ id:Date.now(), ...regF, premium:false };
      setClients(p=>[...p,nc]);
      const code=genCode();
      setTwoFACode(code); setTwoFAPending(nc); setTwoFATimer(120); setTwoFAInput("");
      sendTwoFAEmail(nc.email, nc.bar, code);
      setPage("2fa"); showToast("Compte créé ! Vérifiez votre email 📧");
    };
    return (
      <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
        <Nav title="✨ Créer un compte" onBack={()=>setPage("landing")}/>
        <div style={{ padding:"20px 20px 80px", maxWidth:480, margin:"0 auto" }}>
          <div style={{ color:C.goldL, fontSize:17, fontWeight:"bold", marginBottom:3 }}>Rejoignez GAZON BAR 👋</div>
          <div style={{ color:C.dim, fontSize:12, marginBottom:20 }}>Commandez en gros facilement depuis votre téléphone</div>

          <Card gold style={{ marginBottom:14 }}>
            <SectionLabel>👤 VOS INFORMATIONS</SectionLabel>
            <Inp label="NOM COMPLET *"          value={regF.name}    onChange={setReg("name")}    placeholder="Jean Dupont"/>
            <Inp label="NOM DE VOTRE BAR *"     value={regF.bar}     onChange={setReg("bar")}     placeholder="Bar Chez Moi"/>
            <Inp label="VILLE / QUARTIER"       value={regF.ville}   onChange={setReg("ville")}   placeholder="Ebolowa, Quartier..."/>
            <Inp label="TÉLÉPHONE *"            value={regF.phone}   onChange={setReg("phone")}   placeholder="6XX XXX XXX" type="tel"/>
            <Inp label="N° LICENCE (optionnel)" value={regF.licence} onChange={setReg("licence")} placeholder="Numéro licence bar"/>
          </Card>

          <Card style={{ marginBottom:14 }}>
            <SectionLabel>🔐 IDENTIFIANTS</SectionLabel>
            <Inp label="ADRESSE EMAIL *"          value={regF.email} onChange={setReg("email")} placeholder="votre@email.com" type="email"/>
            <Inp label="MOT DE PASSE *"           value={regF.pass}  onChange={setReg("pass")}  placeholder="Min. 6 caractères" type="password"/>
            {regF.pass.length>0 && (()=>{
              const strength = regF.pass.length<6?0:regF.pass.length<8?1:/[A-Z]/.test(regF.pass)&&/[0-9]/.test(regF.pass)?3:2;
              const labels=["Trop court","Faible","Correct","Fort"];
              const colors=[C.red,"#E67E22","#F1C40F",C.greenL];
              return (
                <div style={{ marginTop:-10, marginBottom:14 }}>
                  <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                    {[0,1,2,3].map(i=>(
                      <div key={i} style={{ flex:1, height:4, borderRadius:2,
                        background:i<=strength?colors[strength]:"rgba(255,255,255,0.1)",
                        transition:"all .3s" }}/>
                    ))}
                  </div>
                  <div style={{ color:colors[strength], fontSize:11 }}>Force : {labels[strength]}</div>
                </div>
              );
            })()}
            <Inp label="CONFIRMER MOT DE PASSE *" value={regF.pass2} onChange={setReg("pass2")} placeholder="Répétez le mot de passe" type="password"/>
          </Card>

          <Card style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showAdmin?14:0 }}>
              <div>
                <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>👥 Ajouter un administrateur</div>
                <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>Peut passer des commandes à votre place</div>
              </div>
              <button onClick={()=>setShowAdmin(!showAdmin)} style={{ ...SF,
                background:showAdmin?"rgba(192,57,43,0.15)":"rgba(45,191,88,0.12)",
                color:showAdmin?C.red:C.greenL, border:`1px solid ${showAdmin?C.red:C.greenL}`,
                padding:"6px 14px", borderRadius:20, fontSize:11, cursor:"pointer" }}>
                {showAdmin?"Annuler":"+ Ajouter"}
              </button>
            </div>
            {showAdmin && <div style={{ marginTop:14 }}>
              <Inp label="NOM" value={regF.adminName} onChange={setReg("adminName")} placeholder="Nom complet"/>
              <Inp label="TÉLÉPHONE" value={regF.adminPhone} onChange={setReg("adminPhone")} placeholder="6XX XXX XXX" type="tel"/>
            </div>}
          </Card>

          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:18 }}>
            <input type="checkbox" id="cgu" checked={regF.cgu} onChange={e=>setReg("cgu")(e.target.checked)}
              style={{ width:16, height:16, marginTop:2, accentColor:C.goldL }}/>
            <label htmlFor="cgu" style={{ color:C.dim, fontSize:12, lineHeight:1.5 }}>
              J'accepte les <span style={{ color:C.goldL }}>conditions générales d'utilisation</span> de GAZON BAR et confirme que les informations fournies sont exactes.
            </label>
          </div>

          <div style={{ background:"rgba(41,128,185,0.07)", borderRadius:10, padding:"10px 14px",
            border:"1px solid rgba(41,128,185,0.2)", marginBottom:18, display:"flex", gap:8, alignItems:"center" }}>
            <span>🛡️</span>
            <span style={{ color:"rgba(100,180,255,0.8)", fontSize:11 }}>Un code 2FA sera envoyé à votre email pour activer le compte</span>
          </div>

          <Btn onClick={doRegister} full>✅ Créer mon compte</Btn>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <button onClick={()=>setPage("login")} style={{ ...SF, background:"none", border:"none", color:C.dim, fontSize:12, cursor:"pointer" }}>
              Déjà un compte ? <span style={{ color:C.goldL }}>Se connecter</span>
            </button>
          </div>
        </div>
        <Toast t={toast}/>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CATALOG
  // ─────────────────────────────────────────────────────────────
  if (page==="catalog") {
    const rightNav = (
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {session?.user?.premium && <Pill label="⭐ VIP" color={C.goldL} small/>}
        {session && (
          <>
            <button onClick={()=>setShowNotifs(!showNotifs)} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", fontSize:18 }}>
              🔔
              {unreadNotifs>0 && <span style={{ position:"absolute", top:-4, right:-4, background:C.red,
                color:"white", borderRadius:"50%", width:14, height:14, fontSize:9,
                display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold" }}>{unreadNotifs}</span>}
            </button>
            <button onClick={()=>setShowMessages(!showMessages)} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", fontSize:18 }}>
              💬
              {messages.filter(m=>m.to===session.user?.id&&!m.read).length>0 && (
                <span style={{ position:"absolute", top:-4, right:-4, background:C.blue,
                  color:"white", borderRadius:"50%", width:14, height:14, fontSize:9,
                  display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold" }}>
                  {messages.filter(m=>m.to===session.user?.id&&!m.read).length}
                </span>
              )}
            </button>
          </>
        )}
        {cartCount>0 && (
          <button onClick={()=>setPage("cart")} style={{ ...SF, background:C.gold, color:C.bg,
            border:"none", borderRadius:20, padding:"5px 12px",
            fontSize:12, fontWeight:"bold", cursor:"pointer" }}>🛒 {cartCount}</button>
        )}
        {session && (
          <div style={{ display:"flex", gap:4 }}>
            {session.type==="client" && <>
              <button onClick={()=>{ setProfileF({...session.user}); setPage("profile"); }} style={{ background:"none", border:"none", color:C.dim, fontSize:17, cursor:"pointer" }}>👤</button>
              <button onClick={()=>setPage("my-stats")} style={{ background:"none", border:"none", color:C.dim, fontSize:17, cursor:"pointer" }}>📊</button>
            </>}
            <button onClick={logout} style={{ background:"none", border:"none", color:C.red, fontSize:17, cursor:"pointer" }}>⏏</button>
          </div>
        )}
      </div>
    );
    return (
      <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
        <Nav title="📦 Catalogue Gros" onBack={()=>setPage("landing")} right={rightNav}/>

        {/* Notifications dropdown */}
        {showNotifs && (
          <div style={{ position:"fixed", top:56, right:12, width:280, background:C.card,
            borderRadius:14, border:`1px solid ${C.border}`, zIndex:200,
            boxShadow:"0 8px 32px rgba(0,0,0,0.6)", maxHeight:320, overflowY:"auto" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:C.goldL, fontSize:13, fontWeight:"bold" }}>Notifications</span>
              <button onClick={()=>{ setNotifs(p=>p.map(n=>({...n,read:true}))); setShowNotifs(false); }}
                style={{ ...SF, background:"none", border:"none", color:C.dim, fontSize:11, cursor:"pointer" }}>Tout lire</button>
            </div>
            {notifications.length===0
              ? <div style={{ padding:20, textAlign:"center", color:C.dim, fontSize:12 }}>Aucune notification</div>
              : notifications.map(n=>(
                <div key={n.id} style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)",
                  background:n.read?"transparent":"rgba(201,150,10,0.05)" }}>
                  <div style={{ color:C.cream, fontSize:12 }}>{n.msg}</div>
                  <div style={{ color:C.dim, fontSize:10, marginTop:3 }}>{fmtDate(n.time)}</div>
                </div>
              ))}
          </div>
        )}

        {session?.type==="client" && (
          <div style={{ background:`linear-gradient(135deg,${C.green}20,${C.gold}0e)`,
            padding:"9px 16px", borderBottom:`1px solid ${C.border}`,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{session.user.bar}</span>
            <span style={{ color:session.user.premium?C.goldL:C.dim, fontSize:11 }}>
              {session.user.premium?"⭐ Prix VIP actifs (-5%)":"Client Standard"}
            </span>
          </div>
        )}

        {/* Announcement Banner */}
        {announcement && (
          <div style={{ background:`linear-gradient(135deg,${C.gold}22,${C.orange}22)`,
            padding:"10px 16px", borderBottom:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span>📢</span>
              <span style={{ color:C.goldL, fontSize:13, fontWeight:"bold" }}>{announcement}</span>
            </div>
            {announceExpiry && (
              <span style={{ color:C.dim, fontSize:10, whiteSpace:"nowrap" }}>
                ⏱️ {Math.max(0,Math.round((new Date(announceExpiry)-new Date())/60000))}min
              </span>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ padding:"10px 16px", borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Rechercher un produit..."
            style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.04)",
              border:`1px solid ${search?C.gold:C.border}`, borderRadius:10, color:C.cream,
              fontSize:13, outline:"none", boxSizing:"border-box", ...SF }}/>
        </div>

        {/* Categories */}
        <div style={{ display:"flex", gap:8, padding:"10px 16px", overflowX:"auto" }}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} style={{ ...SF,
              padding:"6px 16px", borderRadius:20, whiteSpace:"nowrap",
              border:`1px solid ${catFilter===c?C.gold:C.border}`,
              background:catFilter===c?"rgba(201,150,10,0.18)":"transparent",
              color:catFilter===c?C.goldL:C.dim, fontSize:12, fontWeight:"bold", cursor:"pointer" }}>{c}</button>
          ))}
        </div>

        {/* Favorites shortcut */}
        {session && favorites.length>0 && (
          <div style={{ padding:"0 16px 8px" }}>
            <div style={{ color:C.dim, fontSize:11, letterSpacing:1, marginBottom:6 }}>⭐ MES FAVORIS</div>
            <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
              {products.filter(p=>favorites.includes(p.id)).map(p=>(
                <button key={p.id} onClick={()=>addItem(p)} style={{ ...SF,
                  background:"rgba(201,150,10,0.1)", color:C.goldL,
                  border:`1px solid ${C.border}`, padding:"6px 12px",
                  borderRadius:20, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div style={{ padding:"0 16px 120px" }}>
          {filteredProds.length===0 && <EmptyState icon="📦" title="Aucun produit" sub="Essayez un autre filtre ou terme de recherche"/>}
          {filteredProds.map(p=>{
            const inCart=cart.filter(i=>i.product.id===p.id);
            const fullItem=inCart.find(i=>!i.demi);
            const demiItem=inCart.find(i=>i.demi);
            const disc=(promoMap[p.id]||0)+(session?.user?.premium?5:0);
            const fp=Math.round(p.price*(1-disc/100));
            const isFav=favorites.includes(p.id);
            return (
              <div key={p.id} style={{ background:inCart.length?"rgba(26,107,53,0.1)":"rgba(255,255,255,0.02)",
                border:`1px solid ${inCart.length?C.green:"rgba(255,255,255,0.05)"}`,
                borderRadius:14, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:28 }}>{p.emoji}</span>
                    <div>
                      <div style={{ color:C.cream, fontSize:14, fontWeight:"bold" }}>{p.name}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2, flexWrap:"wrap" }}>
                        <span style={{ color:C.dim, fontSize:11 }}>{p.cat} · {p.unit}</span>
                        {disc>0 && <Pill label={`-${disc}%`} color={C.greenL} small/>}
                        {lowStockMap[p.id] && <Pill label="⚠️ Stock limité" color="#E67E22" small/>}
                        {p.tag==="new" && <Pill label="🆕 Nouveau" color="#3498DB" small/>}
                        {p.tag==="popular" && <Pill label="🔥 Populaire" color={C.orange} small/>}
                        {p.tag==="promo" && <Pill label="🎉 Promo" color={C.greenL} small/>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <button onClick={()=>toggleFav(p.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, lineHeight:1 }}>
                      {isFav?"⭐":"☆"}
                    </button>
                    <div style={{ textAlign:"right" }}>
                      {disc>0 && <div style={{ color:C.dim, fontSize:10, textDecoration:"line-through" }}>{fmt(p.price)} F</div>}
                      <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold" }}>{fmt(fp)} F</div>
                      <div style={{ color:C.dim, fontSize:10 }}>/{p.unit}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {fullItem && <>
                      <button onClick={()=>removeItem(fullItem.key)} style={{ width:26, height:26, borderRadius:"50%", border:`1px solid ${C.red}`, background:"rgba(192,57,43,0.18)", color:C.red, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                      <span style={{ color:C.cream, fontWeight:"bold", minWidth:16, textAlign:"center", fontSize:13 }}>{fullItem.qty}</span>
                    </>}
                    <button onClick={()=>addItem(p,false)} style={{ ...SF, background:"rgba(45,191,88,0.12)", color:C.greenL, border:`1px solid ${C.greenL}`, padding:"5px 12px", borderRadius:20, fontSize:11, cursor:"pointer", fontWeight:"bold" }}>
                      + {p.unit==="casier"?"Casier":"Palette"}
                    </button>
                  </div>
                  {p.unit==="casier" && (
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      {demiItem && <>
                        <button onClick={()=>removeItem(demiItem.key)} style={{ width:26, height:26, borderRadius:"50%", border:`1px solid ${C.red}`, background:"rgba(192,57,43,0.18)", color:C.red, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                        <span style={{ color:C.cream, fontWeight:"bold", minWidth:16, textAlign:"center", fontSize:13 }}>{demiItem.qty}</span>
                      </>}
                      <button onClick={()=>addItem(p,true)} style={{ ...SF, background:"rgba(201,150,10,0.1)", color:C.gold, border:`1px solid ${C.gold}`, padding:"5px 12px", borderRadius:20, fontSize:11, cursor:"pointer", fontWeight:"bold" }}>
                        + ½ ({fmt(Math.round(fp/2))} F)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Floating WhatsApp contact button */}
        <div style={{ position:"fixed", bottom: cartCount>0?90:20, right:16, zIndex:99 }}>
          <button onClick={()=>window.open(`https://wa.me/${WA1}`,"_blank")} style={{ ...SF,
            width:52, height:52, borderRadius:"50%", border:"none", cursor:"pointer",
            background:"#25D366", color:"white", fontSize:24,
            boxShadow:"0 4px 16px rgba(37,211,102,0.5)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            💬
          </button>
        </div>

        {cartCount>0 && (
          <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:460, zIndex:100 }}>
            <button onClick={()=>setPage("cart")} style={{ ...SF, width:"100%", padding:"15px 20px", borderRadius:16, border:"none", cursor:"pointer",
              background:`linear-gradient(135deg,${C.gold},${C.orange})`, color:C.bg,
              fontSize:15, fontWeight:"bold", display:"flex", justifyContent:"space-between", alignItems:"center",
              boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
              <span>🛒 Panier ({cartCount})</span><span>{fmt(subtotal)} FCFA</span>
            </button>
          </div>
        )}
        <Toast t={toast}/>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CART
  // ─────────────────────────────────────────────────────────────
  if (page==="cart") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
      <Nav title="🛒 Ma Commande" onBack={()=>setPage("catalog")}/>
      <div style={{ padding:"16px 16px 120px", maxWidth:500, margin:"0 auto" }}>
        {cart.length===0
          ? <EmptyState icon="🛒" title="Panier vide" sub="Retournez au catalogue pour ajouter des produits"/>
          : <>
            {cart.map(item=>(
              <div key={item.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24 }}>{item.product.emoji}</span>
                  <div>
                    <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>
                      {item.product.name}{item.demi&&<span style={{ color:C.gold, fontSize:10, marginLeft:5 }}>½ casier</span>}
                    </div>
                    <div style={{ color:C.dim, fontSize:11 }}>x{item.qty} × {fmt(getPrice(item.product,item.demi))} F</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <button onClick={()=>removeItem(item.key)} style={{ width:24, height:24, borderRadius:"50%", border:`1px solid ${C.red}`, background:"rgba(192,57,43,0.15)", color:C.red, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                  <span style={{ color:C.goldL, fontWeight:"bold", minWidth:56, textAlign:"right", fontSize:12 }}>{fmt(itemTotal(item))} F</span>
                </div>
              </div>
            ))}

            <div style={{ marginTop:16, padding:14, background:"rgba(255,255,255,0.03)", borderRadius:12, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", color:C.goldL, fontSize:17, fontWeight:"bold" }}>
                <span>TOTAL</span><span>{fmt(subtotal)} FCFA</span>
              </div>
            </div>

            {/* Order extras */}
            <Card style={{ marginTop:14 }}>
              <SectionLabel>📅 DATE DE LIVRAISON SOUHAITÉE</SectionLabel>
              <input type="date" value={delivDate} onChange={e=>setDelivDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${C.border}`, borderRadius:10, color:C.cream,
                  fontSize:13, outline:"none", boxSizing:"border-box", ...SF }}/>
            </Card>

            <Card style={{ marginTop:10 }}>
              <SectionLabel>📝 NOTE SUR LA COMMANDE (optionnel)</SectionLabel>
              <textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)}
                placeholder="Ex: Livrer avant 10h, appeler avant d'arriver..."
                rows={3}
                style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${C.border}`, borderRadius:10, color:C.cream,
                  fontSize:13, outline:"none", boxSizing:"border-box", resize:"none", ...SF }}/>
            </Card>

            <div style={{ background:"rgba(26,107,53,0.08)", borderRadius:12, padding:"11px 14px",
              border:`1px solid rgba(26,107,53,0.25)`, marginTop:12, color:C.greenL, fontSize:12 }}>
              📌 Paiement sur place au retrait ou à la livraison
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <Btn onClick={clearCart} variant="danger" small>🗑️ Vider</Btn>
              {minOrder>0 && subtotal<minOrder && (
              <div style={{ background:"rgba(192,57,43,0.1)", borderRadius:10, padding:"10px 14px",
                border:"1px solid rgba(192,57,43,0.3)", marginTop:10, color:C.red, fontSize:12 }}>
                ⚠️ Commande minimum : {fmt(minOrder)} FCFA (il manque {fmt(minOrder-subtotal)} F)
              </div>
            )}
            <Btn onClick={()=>{ if(minOrder>0&&subtotal<minOrder){ showToast(`Minimum de commande : ${fmt(minOrder)} FCFA`,"error"); return; } setPage("checkout"); }} full>✅ Confirmer et envoyer</Btn>
            </div>
          </>}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // CHECKOUT — Send WA + Email
  // ─────────────────────────────────────────────────────────────
  if (page==="checkout") {
    const cName = session?.user?.bar||"Client";
    const waText = buildWaText(cart, subtotal, cName, orderNote, delivDate, getPrice);
    const finalizeOrder = () => {
      const newOrder = {
        id:genId(), clientId:session?.user?.id||0, clientName:cName,
        date:new Date().toISOString(), total:subtotal, items:cartCount,
        status:"pending", note:orderNote, delivDate,
        products: cart.map(i=>({ name:i.product.name, qty:i.qty, demi:i.demi, price:itemTotal(i) }))
      };
      setOrders(p=>[newOrder,...p]);
      addNotif(`Précommande ${newOrder.id} confirmée — ${fmt(subtotal)} FCFA`);
      setPage("success");
    };
    return (
      <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
        <Nav title="📤 Envoi de commande" onBack={()=>setPage("cart")}/>
        <div style={{ padding:"20px 16px 80px", maxWidth:500, margin:"0 auto" }}>
          <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:3 }}>Transmettez votre commande</div>
          <div style={{ color:C.dim, fontSize:12, marginBottom:18 }}>Envoyez via WhatsApp et/ou email avant de confirmer</div>

          <Card style={{ marginBottom:16 }}>
            <SectionLabel>RÉCAPITULATIF</SectionLabel>
            {cart.map(item=>(
              <div key={item.key} style={{ display:"flex", justifyContent:"space-between", color:C.dim, fontSize:12, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span>{item.product.emoji} {item.product.name}{item.demi?" ½":""} ×{item.qty}</span>
                <span style={{ color:C.cream }}>{fmt(itemTotal(item))} F</span>
              </div>
            ))}
            {delivDate && <div style={{ color:C.dim, fontSize:12, marginTop:8 }}>📅 Livraison : {fmtDate(delivDate)}</div>}
            {orderNote && <div style={{ color:C.dim, fontSize:12, marginTop:4 }}>📝 {orderNote}</div>}
            <div style={{ display:"flex", justifyContent:"space-between", color:C.goldL, fontWeight:"bold", fontSize:16, paddingTop:10, marginTop:4, borderTop:`1px solid ${C.border}` }}>
              <span>TOTAL</span><span>{fmt(subtotal)} FCFA</span>
            </div>
          </Card>

          <SectionLabel>CANAUX D'ENVOI</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            <button onClick={()=>window.open(`https://wa.me/${WA1}?text=${encodeURIComponent(waText)}`,"_blank")} style={{ ...SF, background:"rgba(37,211,102,0.1)", color:"#25D366", border:"1px solid rgba(37,211,102,0.3)", padding:"13px 16px", borderRadius:12, fontSize:13, cursor:"pointer", fontWeight:"bold", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>📱 WhatsApp — 655 837 076</span><span style={{ fontSize:11 }}>Ouvrir →</span>
            </button>
            <button onClick={()=>window.open(`https://wa.me/${WA2}?text=${encodeURIComponent(waText)}`,"_blank")} style={{ ...SF, background:"rgba(37,211,102,0.1)", color:"#25D366", border:"1px solid rgba(37,211,102,0.3)", padding:"13px 16px", borderRadius:12, fontSize:13, cursor:"pointer", fontWeight:"bold", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>📱 WhatsApp — 695 277 722</span><span style={{ fontSize:11 }}>Ouvrir →</span>
            </button>
            <button onClick={()=>window.open(`mailto:${MGR_EMAIL}?subject=${encodeURIComponent(`Précommande — ${cName}`)}&body=${encodeURIComponent(waText)}`,"_blank")} style={{ ...SF, background:"rgba(41,128,185,0.1)", color:"#5DADE2", border:"1px solid rgba(41,128,185,0.3)", padding:"13px 16px", borderRadius:12, fontSize:13, cursor:"pointer", fontWeight:"bold", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>📧 Email — {MGR_EMAIL}</span><span style={{ fontSize:11 }}>Ouvrir →</span>
            </button>
          </div>

          <Btn onClick={finalizeOrder} full>✅ Confirmer la précommande</Btn>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUCCESS
  // ─────────────────────────────────────────────────────────────
  if (page==="success") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ width:90, height:90, borderRadius:"50%", background:`linear-gradient(135deg,${C.green},${C.greenL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, marginBottom:22, boxShadow:`0 0 50px rgba(26,107,53,0.5)` }}>✅</div>
      <div style={{ color:C.goldL, fontSize:22, fontWeight:"bold", marginBottom:6 }}>Précommande confirmée !</div>
      <div style={{ color:C.dim, fontSize:13, marginBottom:24, maxWidth:300 }}>Votre commande a été transmise. GAZON BAR vous contactera pour confirmer la livraison.</div>
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap", justifyContent:"center" }}>
        <Pill label="📱 WhatsApp" color="#25D366"/>
        <Pill label="📧 Email" color="#5DADE2"/>
        <Pill label="📊 Statistiques mises à jour" color={C.goldL}/>
      </div>
      <Card gold style={{ width:"100%", maxWidth:340, marginBottom:20 }}>
        <SectionLabel>CONTACT</SectionLabel>
        <div style={{ color:C.cream, fontSize:14 }}>695 277 722 &nbsp;|&nbsp; 655 837 076</div>
        <div style={{ color:C.dim, fontSize:12, marginTop:4 }}>📍 Carrefour An 2000, Don Bosco, Ebolowa</div>
      </Card>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
        <Btn onClick={()=>{ clearCart(); setOrderNote(""); setDelivDate(""); setPage("catalog"); }} variant="outline">📦 Nouveau catalogue</Btn>
        {session?.type==="client" && <Btn onClick={()=>setPage("my-stats")} variant="ghost">📊 Mes stats</Btn>}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // CLIENT PROFILE
  // ─────────────────────────────────────────────────────────────
  if (page==="profile" && profileF) return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
      <Nav title="👤 Mon Profil" onBack={()=>setPage("catalog")}/>
      <div style={{ padding:"20px 20px 80px", maxWidth:480, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ width:70, height:70, borderRadius:"50%", background:`linear-gradient(135deg,${C.green},${C.goldL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 10px" }}>🍺</div>
          <div style={{ color:C.goldL, fontSize:16, fontWeight:"bold" }}>{session.user.bar}</div>
          {session.user.premium && <Pill label="⭐ Client Premium" color={C.goldL}/>}
        </div>
        <Card gold style={{ marginBottom:14 }}>
          <SectionLabel>INFORMATIONS</SectionLabel>
          <Inp label="NOM COMPLET" value={profileF.name} onChange={v=>setProfileF(p=>({...p,name:v}))} placeholder="Nom"/>
          <Inp label="NOM DU BAR" value={profileF.bar}   onChange={v=>setProfileF(p=>({...p,bar:v}))}  placeholder="Bar"/>
          <Inp label="VILLE" value={profileF.ville}      onChange={v=>setProfileF(p=>({...p,ville:v}))} placeholder="Ville"/>
          <Inp label="TÉLÉPHONE" value={profileF.phone}  onChange={v=>setProfileF(p=>({...p,phone:v}))} placeholder="6XX..." type="tel"/>
        </Card>
        <Card style={{ marginBottom:14 }}>
          <SectionLabel>🔐 CHANGER LE MOT DE PASSE</SectionLabel>
          <Inp label="NOUVEAU MOT DE PASSE" value={profileF.newPass||""} onChange={v=>setProfileF(p=>({...p,newPass:v}))} placeholder="Laisser vide pour ne pas changer" type="password"/>
        </Card>
        <Btn onClick={()=>{
          const updated={...session.user, name:profileF.name, bar:profileF.bar, ville:profileF.ville, phone:profileF.phone};
          if (profileF.newPass&&profileF.newPass.length>=6) updated.pass=profileF.newPass;
          setClients(p=>p.map(c=>c.id===updated.id?updated:c));
          setSession(s=>({...s,user:updated}));
          showToast("Profil mis à jour ✓"); setPage("catalog");
        }} full>💾 Sauvegarder</Btn>
      </div>
      <Toast t={toast}/>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // CLIENT STATS
  // ─────────────────────────────────────────────────────────────
  if (page==="my-stats") {
    const cid=session?.user?.id;
    const myOrders=getFilteredOrders(cid);
    const allMyOrders=orders.filter(o=>o.clientId===cid);
    const myTotal=myOrders.reduce((s,o)=>s+o.total,0);
    const chartData=buildChart(cid);
    return (
      <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
        <Nav title="📊 Mes Statistiques" onBack={()=>setPage("catalog")}/>
        <div style={{ padding:"16px 16px 80px", maxWidth:600, margin:"0 auto" }}>
          <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:2 }}>{session?.user?.bar}</div>
          <div style={{ color:C.dim, fontSize:12, marginBottom:14 }}>Suivi de vos achats chez GAZON BAR</div>
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {[["week","7j"],["month","1 mois"],["year","1 an"]].map(([k,l])=>(
              <button key={k} onClick={()=>setStatPeriod(k)} style={{ ...SF, padding:"6px 14px", borderRadius:20, border:`1px solid ${statPeriod===k?C.gold:C.border}`, background:statPeriod===k?"rgba(201,150,10,0.2)":"transparent", color:statPeriod===k?C.goldL:C.dim, fontSize:11, fontWeight:"bold", cursor:"pointer" }}>{l}</button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            {[
              { icon:"💰", label:"Total achats", value:`${fmt(myTotal)} F`, color:C.goldL },
              { icon:"📋", label:"Commandes", value:myOrders.length, color:C.greenL },
              { icon:"📦", label:"Moy./commande", value:myOrders.length?`${fmt(Math.round(myTotal/myOrders.length))} F`:"—", color:C.orange },
              { icon:"⭐", label:"Statut", value:session?.user?.premium?"Premium":"Standard", color:session?.user?.premium?C.goldL:C.dim },
            ].map(s=>(
              <Card key={s.label}>
                <div style={{ fontSize:20, marginBottom:5 }}>{s.icon}</div>
                <div style={{ color:s.color, fontSize:18, fontWeight:"bold" }}>{s.value}</div>
                <div style={{ color:C.dim, fontSize:10 }}>{s.label}</div>
              </Card>
            ))}
          </div>
          {chartData.length>0 ? (
            <Card style={{ marginBottom:18 }}>
              <SectionLabel>ÉVOLUTION DES ACHATS</SectionLabel>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="date" tick={{ fill:C.dim, fontSize:9 }}/>
                  <YAxis tick={{ fill:C.dim, fontSize:9 }} width={55} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} labelStyle={{ color:C.goldL }} itemStyle={{ color:C.cream }} formatter={v=>`${fmt(v)} FCFA`}/>
                  <Bar dataKey="total" fill={C.green} radius={[4,4,0,0]} name="Total FCFA"/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          ) : <EmptyState icon="📊" title="Aucune donnée" sub="Passez votre première commande !"/>}

          <SectionLabel>HISTORIQUE</SectionLabel>
          {allMyOrders.length===0
            ? <EmptyState icon="📋" title="Aucune commande" sub="Votre historique apparaîtra ici"/>
            : allMyOrders.map(o=>(
              <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", marginBottom:8, background:"rgba(255,255,255,0.02)", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{o.id}</div>
                  <div style={{ color:C.dim, fontSize:11 }}>{fmtDate(o.date)} · {o.items} article(s)</div>
                  {o.delivDate && <div style={{ color:C.dim, fontSize:10 }}>📅 {fmtDate(o.delivDate)}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:C.goldL, fontWeight:"bold", fontSize:13 }}>{fmt(o.total)} F</div>
                  <Pill label={ORDER_STATUSES[o.status]?.label||o.status} color={ORDER_STATUSES[o.status]?.color||C.dim} small/>
                  <div style={{ marginTop:6 }}>
                    <button onClick={()=>{ o.products?.forEach(p=>{ const prod=products.find(x=>x.name===p.name); if(prod) addItem(prod,p.demi); }); setPage("cart"); showToast("Commande rechargée dans le panier"); }}
                      style={{ ...SF, background:"rgba(201,150,10,0.1)", color:C.goldL, border:`1px solid ${C.border}`, padding:"3px 10px", borderRadius:20, fontSize:10, cursor:"pointer" }}>
                      🔄 Reorder
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MANAGER
  // ─────────────────────────────────────────────────────────────
  if (page==="mgr") return (
    <div style={{ minHeight:"100vh", background:C.bg, ...SF }}>
      <Nav title="👑 Direction GAZON BAR"
        right={
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={()=>setShowNotifs(!showNotifs)} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", fontSize:18 }}>
              🔔{unreadNotifs>0&&<span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"white", borderRadius:"50%", width:14, height:14, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold" }}>{unreadNotifs}</span>}
            </button>
            <button onClick={logout} style={{ background:"none", border:"none", color:C.red, fontSize:18, cursor:"pointer" }}>⏏</button>
          </div>
        }/>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:"rgba(255,255,255,0.02)", overflowX:"auto" }}>
        {[{key:"dashboard",label:"📊 Stats"},{key:"products",label:"📦 Prix"},{key:"promos",label:"🎁 Promos"},{key:"clients",label:"👥 Clients"},{key:"orders",label:"📋 Commandes"},{key:"messages",label:"💬 Messages"}].map(t=>(
          <TabBtn key={t.key} active={mgrTab===t.key} onClick={()=>setMgrTab(t.key)}>{t.label}</TabBtn>
        ))}
      </div>

      {showNotifs && (
        <div style={{ position:"fixed", top:110, right:12, width:280, background:C.card, borderRadius:14, border:`1px solid ${C.border}`, zIndex:200, boxShadow:"0 8px 32px rgba(0,0,0,0.6)", maxHeight:300, overflowY:"auto" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:C.goldL, fontSize:13, fontWeight:"bold" }}>Notifications</span>
            <button onClick={()=>{ setNotifs(p=>p.map(n=>({...n,read:true}))); setShowNotifs(false); }} style={{ ...SF, background:"none", border:"none", color:C.dim, fontSize:11, cursor:"pointer" }}>Tout lire</button>
          </div>
          {notifications.length===0
            ? <div style={{ padding:20, textAlign:"center", color:C.dim, fontSize:12 }}>Aucune notification</div>
            : notifications.map(n=>(
              <div key={n.id} style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:n.read?"transparent":"rgba(201,150,10,0.05)" }}>
                <div style={{ color:C.cream, fontSize:12 }}>{n.msg}</div>
                <div style={{ color:C.dim, fontSize:10, marginTop:2 }}>{fmtDate(n.time)}</div>
              </div>
            ))}
        </div>
      )}

      <div style={{ padding:"16px 16px 80px", maxWidth:600, margin:"0 auto" }}>

        {/* DASHBOARD */}
        {mgrTab==="dashboard" && (()=>{
          const fo=getFilteredOrders();
          const total=fo.reduce((s,o)=>s+o.total,0);
          const chartData=buildChart();
          return <>
            <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:2 }}>Tableau de bord</div>
            <div style={{ color:C.dim, fontSize:11, marginBottom:14 }}>{MGR_EMAIL}</div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {[["week","7j"],["month","1 mois"],["year","1 an"]].map(([k,l])=>(
                <button key={k} onClick={()=>setStatPeriod(k)} style={{ ...SF, padding:"5px 13px", borderRadius:20, border:`1px solid ${statPeriod===k?C.gold:C.border}`, background:statPeriod===k?"rgba(201,150,10,0.2)":"transparent", color:statPeriod===k?C.goldL:C.dim, fontSize:11, fontWeight:"bold", cursor:"pointer" }}>{l}</button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[
                { icon:"💰", label:"Chiffre d'affaires", value:`${fmt(total)} F`, color:C.goldL },
                { icon:"📋", label:"Commandes", value:fo.length, color:C.greenL },
                { icon:"👥", label:"Clients inscrits", value:clients.length, color:C.blue },
                { icon:"⭐", label:"Clients Premium", value:clients.filter(c=>c.premium).length, color:C.orange },
                { icon:"📦", label:"Produits actifs", value:Object.values(stock).filter(Boolean).length, color:C.greenL },
                { icon:"🎁", label:"Promos actives", value:Object.keys(promoMap).length, color:C.purple },
              ].map(s=>(
                <Card key={s.label}>
                  <div style={{ fontSize:20, marginBottom:5 }}>{s.icon}</div>
                  <div style={{ color:s.color, fontSize:18, fontWeight:"bold" }}>{s.value}</div>
                  <div style={{ color:C.dim, fontSize:10 }}>{s.label}</div>
                </Card>
              ))}
            </div>
            {chartData.length>0 && (
              <Card style={{ marginBottom:16 }}>
                <SectionLabel>CHIFFRE D'AFFAIRES</SectionLabel>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="date" tick={{ fill:C.dim, fontSize:9 }}/>
                    <YAxis tick={{ fill:C.dim, fontSize:9 }} width={55} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                    <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }} labelStyle={{ color:C.goldL }} itemStyle={{ color:C.cream }} formatter={v=>`${fmt(v)} FCFA`}/>
                    <Line type="monotone" dataKey="total" stroke={C.goldL} strokeWidth={2} dot={false} name="Ventes"/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
            {/* Top products */}
            {(()=>{
              const productCount = {};
              orders.forEach(o=>o.products?.forEach(p=>{
                productCount[p.name]=(productCount[p.name]||0)+p.qty;
              }));
              const top = Object.entries(productCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
              if (!top.length) return null;
              return (
                <Card style={{ marginBottom:14 }}>
                  <SectionLabel>🏆 TOP PRODUITS COMMANDÉS</SectionLabel>
                  {top.map(([name,qty],i)=>(
                    <div key={name} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"7px 0",
                      borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:i===0?C.goldL:i===1?"#C0C0C0":i===2?"#CD7F32":C.dim,
                          fontSize:14, fontWeight:"bold" }}>#{i+1}</span>
                        <span style={{ color:C.cream, fontSize:13 }}>{name}</span>
                      </div>
                      <Pill label={`${qty} unités`} color={C.greenL} small/>
                    </div>
                  ))}
                </Card>
              );
            })()}

            {/* Announcement manager */}
            <Card style={{ marginBottom:14 }}>
              <SectionLabel>📢 BANNIÈRE D'ANNONCE</SectionLabel>
              <div style={{ color:C.dim, fontSize:11, marginBottom:8 }}>Message affiché à tous les clients sur le catalogue</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={editAnnounce} onChange={e=>setEditAnnounce(e.target.value)}
                  placeholder="Ex: Promo -10% ce weekend sur toutes les bières !"
                  style={{ flex:1, padding:"9px 12px", background:"rgba(255,255,255,0.05)",
                    border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                    fontSize:12, outline:"none", ...SF }}/>
                <button onClick={()=>{
                  setAnnouncement(editAnnounce);
                  if (editAnnounce) {
                    setAnnounceExpiry(new Date(Date.now()+60*60*1000).toISOString());
                    showToast("Annonce publiée ! (expire dans 1h)");
                  } else {
                    setAnnounceExpiry(null);
                    showToast("Annonce retirée");
                  }
                }} style={{ ...SF, background:C.gold, color:C.bg, border:"none",
                  padding:"9px 14px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:"bold" }}>
                  {editAnnounce?"Publier 1h":"Retirer"}
                </button>
              </div>
              {announcement && (
                <div style={{ background:"rgba(201,150,10,0.1)", borderRadius:8, padding:"8px 12px",
                  border:`1px solid ${C.border}`, color:C.goldL, fontSize:12 }}>
                  📢 Actuelle : {announcement}
                  <button onClick={()=>{ setAnnouncement(""); setEditAnnounce(""); }} style={{ ...SF,
                    background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", marginLeft:8 }}>✕</button>
                </div>
              )}
            </Card>

            <Card gold>
              <SectionLabel>🔐 IDENTIFIANTS DIRECTION</SectionLabel>
              <div style={{ color:C.dim, fontSize:11, marginBottom:2 }}>Email :</div>
              <div style={{ color:C.cream, fontSize:13, fontWeight:"bold", marginBottom:8 }}>{MGR_EMAIL}</div>
              <div style={{ color:C.dim, fontSize:11, marginBottom:2 }}>Mot de passe :</div>
              <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{MGR_PASS}</div>
            </Card>
          </>;
        })()}

        {/* PRODUCTS */}
        {mgrTab==="products" && <>
          <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:3 }}>Produits & Prix</div>
          <div style={{ color:C.dim, fontSize:12, marginBottom:14 }}>Modifiez les prix, gérez les stocks et les alertes</div>

          {/* Add new product */}
          <button onClick={()=>setShowAddProduct(!showAddProduct)} style={{ ...SF,
            width:"100%", background:"rgba(45,191,88,0.1)", color:C.greenL,
            border:`1px solid ${C.greenL}`, padding:"11px", borderRadius:12,
            fontSize:13, cursor:"pointer", fontWeight:"bold", marginBottom:14 }}>
            {showAddProduct?"✕ Annuler":"🆕 Ajouter un nouveau produit"}
          </button>

          {showAddProduct && (
            <Card gold style={{ marginBottom:14 }}>
              <div style={{ color:C.gold, fontSize:10, fontWeight:"bold", letterSpacing:2, marginBottom:12 }}>NOUVEAU PRODUIT</div>
              {[
                { label:"NOM DU PRODUIT *", key:"name",  placeholder:"Ex: Heineken" },
                { label:"PRIX (FCFA) *",    key:"price", placeholder:"Ex: 9000", type:"number" },
                { label:"EMOJI",            key:"emoji", placeholder:"🍺" },
              ].map(f=>(
                <div key={f.key} style={{ marginBottom:10 }}>
                  <div style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:4 }}>{f.label}</div>
                  <input type={f.type||"text"} value={newProductF[f.key]}
                    onChange={e=>setNewProductF(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder}
                    style={{ width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.05)",
                      border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                      fontSize:13, outline:"none", boxSizing:"border-box", ...SF }}/>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:4 }}>CATÉGORIE</div>
                  <select value={newProductF.cat} onChange={e=>setNewProductF(p=>({...p,cat:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", background:"#0E1A10",
                      border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                      fontSize:13, outline:"none", ...SF }}>
                    {["Brasseries","Guinness","Kadji"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:4 }}>UNITÉ</div>
                  <select value={newProductF.unit} onChange={e=>setNewProductF(p=>({...p,unit:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", background:"#0E1A10",
                      border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                      fontSize:13, outline:"none", ...SF }}>
                    <option value="casier">Casier</option>
                    <option value="palette">Palette</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:4 }}>ÉTIQUETTE</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[["new","🆕 Nouveau"],["popular","🔥 Populaire"],["promo","🎉 Promo"],["","Aucune"]].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setNewProductF(p=>({...p,tag:val}))} style={{ ...SF,
                      padding:"5px 10px", borderRadius:16, fontSize:10,
                      border:`1px solid ${newProductF.tag===val?C.gold:C.border}`,
                      background:newProductF.tag===val?"rgba(201,150,10,0.2)":"transparent",
                      color:newProductF.tag===val?C.goldL:C.dim, cursor:"pointer" }}>{lbl}</button>
                  ))}
                </div>
              </div>
              <button onClick={()=>{
                if (!newProductF.name||!newProductF.price) { showToast("Nom et prix obligatoires","error"); return; }
                const np = { id:Date.now(), name:newProductF.name, cat:newProductF.cat,
                  unit:newProductF.unit, price:Number(newProductF.price),
                  emoji:newProductF.emoji||"🍺", tag:newProductF.tag||"new" };
                setProducts(p=>[...p,np]);
                setStock(s=>({...s,[np.id]:true}));
                // Auto-announce for 1 hour
                const msg = `🆕 Nouveau produit disponible : ${np.name} à ${fmt(np.price)} FCFA/${np.unit} !`;
                setAnnouncement(msg);
                setEditAnnounce(msg);
                setAnnounceExpiry(new Date(Date.now()+60*60*1000).toISOString());
                // Notify all clients
                clients.forEach(c=>{
                  addNotif(`🆕 Nouveau produit : ${np.name} — ${fmt(np.price)} FCFA`);
                });
                // Send email to all clients (EmailJS)
                clients.forEach(c=>{
                  sendOrderEmail(c.email, "GAZON BAR",
                    `Nouveau produit disponible !

${np.emoji} ${np.name}
Prix : ${fmt(np.price)} FCFA/${np.unit}

Commanderz dès maintenant sur votre espace GAZON BAR.`
                  );
                });
                setNewProductF({ name:"", cat:"Brasseries", unit:"casier", price:"", emoji:"🍺", tag:"new" });
                setShowAddProduct(false);
                showToast(`${np.name} ajouté ! Email envoyé à ${clients.length} client(s) ✓`);
              }} style={{ ...SF, width:"100%", padding:"11px", borderRadius:10, border:"none",
                background:`linear-gradient(135deg,${C.green},${C.greenL})`,
                color:C.cream, fontSize:13, fontWeight:"bold", cursor:"pointer" }}>
                ✅ Ajouter et notifier les clients
              </button>
            </Card>
          )}

          {/* Minimum order */}
          <Card style={{ marginBottom:14 }}>
            <div style={{ color:C.gold, fontSize:10, fontWeight:"bold", letterSpacing:2, marginBottom:8 }}>💰 COMMANDE MINIMUM</div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input type="number" value={minOrder} onChange={e=>setMinOrder(Number(e.target.value))}
                placeholder="0 = pas de minimum"
                style={{ flex:1, padding:"9px 12px", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                  fontSize:13, outline:"none", ...SF }}/>
              <span style={{ color:C.dim, fontSize:12 }}>FCFA</span>
              <button onClick={()=>showToast(`Minimum fixé à ${fmt(minOrder)} FCFA`)} style={{ ...SF,
                background:C.green, color:C.cream, border:"none",
                padding:"9px 14px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:"bold" }}>✓</button>
            </div>
          </Card>
          {products.map(p=>(
            <div key={p.id} style={{ background:stock[p.id]?"rgba(26,107,53,0.07)":"rgba(192,57,43,0.06)", borderRadius:14, padding:13, marginBottom:9, border:`1px solid ${stock[p.id]?"rgba(26,107,53,0.2)":"rgba(192,57,43,0.18)"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span>{p.emoji}</span>
                  <div>
                    <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{p.name}</div>
                    <div style={{ color:C.dim, fontSize:10 }}>{p.cat} · {p.unit}</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                  <button onClick={()=>setStock(s=>({...s,[p.id]:!s[p.id]}))} style={{ ...SF, background:stock[p.id]?"rgba(26,107,53,0.25)":"rgba(192,57,43,0.18)", color:stock[p.id]?C.greenL:C.red, border:`1px solid ${stock[p.id]?C.greenL:C.red}`, padding:"4px 12px", borderRadius:20, fontSize:10, cursor:"pointer", fontWeight:"bold" }}>
                    {stock[p.id]?"✓ Dispo":"✗ Épuisé"}
                  </button>
                  {stock[p.id] && (
                    <button onClick={()=>setLowStockMap(s=>({...s,[p.id]:!s[p.id]}))} style={{ ...SF,
                      background:lowStockMap[p.id]?"rgba(230,126,34,0.2)":"transparent",
                      color:lowStockMap[p.id]?"#E67E22":C.dim,
                      border:`1px solid ${lowStockMap[p.id]?"#E67E22":"rgba(255,255,255,0.08)"}`,
                      padding:"3px 10px", borderRadius:20, fontSize:9, cursor:"pointer" }}>
                      {lowStockMap[p.id]?"⚠️ Stock faible":"Stock OK"}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input type="number" defaultValue={p.price} onChange={e=>setEditPrices(prev=>({...prev,[p.id]:Number(e.target.value)}))}
                  style={{ flex:1, padding:"8px 12px", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, color:C.cream, fontSize:12, outline:"none", ...SF }}/>
                <span style={{ color:C.dim, fontSize:11 }}>FCFA</span>
                <button onClick={()=>{ if(editPrices[p.id]){ setProducts(prev=>prev.map(x=>x.id===p.id?{...x,price:editPrices[p.id]}:x)); showToast(`${p.name} → ${fmt(editPrices[p.id])} F ✓`); }}} style={{ ...SF, background:C.green, color:C.cream, border:"none", padding:"8px 14px", borderRadius:8, fontSize:11, cursor:"pointer", fontWeight:"bold" }}>Sauver</button>
              </div>
            </div>
          ))}
        </>}

        {/* PROMOS */}
        {mgrTab==="promos" && <>
          <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:3 }}>Promotions</div>
          <div style={{ color:C.dim, fontSize:12, marginBottom:14 }}>Appliquez des réductions (%) sur les produits</div>
          {products.map(p=>{ const cur=promoMap[p.id]||0; return (
            <div key={p.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 13px", marginBottom:8, background:cur>0?"rgba(201,150,10,0.08)":"rgba(255,255,255,0.02)", borderRadius:12, border:`1px solid ${cur>0?C.gold:"rgba(255,255,255,0.05)"}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span>{p.emoji}</span>
                <div>
                  <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{p.name}</div>
                  <div style={{ color:C.dim, fontSize:10 }}>{fmt(p.price)} F</div>
                </div>
                {cur>0 && <Pill label={`-${cur}%`} color={C.goldL} small/>}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <input type="number" min="0" max="50" defaultValue={cur} onChange={e=>setEditPromos(prev=>({...prev,[p.id]:Number(e.target.value)}))}
                  style={{ width:46, padding:"6px 7px", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, color:C.cream, fontSize:11, outline:"none", textAlign:"center", ...SF }}/>
                <span style={{ color:C.dim, fontSize:11 }}>%</span>
                <button onClick={()=>{ const val=editPromos[p.id]??cur; setPromoMap(prev=>{ const n={...prev}; val===0?delete n[p.id]:n[p.id]=val; return n; }); showToast(val>0?`${p.name} : -${val}%`:`Promo ${p.name} retirée`); }} style={{ ...SF, background:C.gold, color:C.bg, border:"none", padding:"6px 11px", borderRadius:8, fontSize:10, cursor:"pointer", fontWeight:"bold" }}>✓</button>
              </div>
            </div>
          );})}
        </>}

        {/* CLIENTS */}
        {mgrTab==="clients" && <>
          <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:3 }}>Clients ({clients.length})</div>
          <div style={{ color:C.dim, fontSize:12, marginBottom:14 }}>Gérez les statuts Premium et les informations clients</div>
          {/* Bouton ajouter client */}
          <button onClick={()=>setShowAddClient(!showAddClient)} style={{ ...SF,
            width:"100%", background:"rgba(45,191,88,0.1)", color:C.greenL,
            border:`1px solid ${C.greenL}`, padding:"11px", borderRadius:12,
            fontSize:13, cursor:"pointer", fontWeight:"bold", marginBottom:14 }}>
            {showAddClient?"✕ Annuler":"+ Ajouter un client manuellement"}
          </button>

          {/* Formulaire ajout client */}
          {showAddClient && (
            <Card gold style={{ marginBottom:16 }}>
              <div style={{ color:C.gold, fontSize:11, fontWeight:"bold", letterSpacing:2, marginBottom:12 }}>NOUVEAU CLIENT</div>
              {[
                { label:"NOM COMPLET *", key:"name", placeholder:"Jean Dupont" },
                { label:"NOM DU BAR *",  key:"bar",  placeholder:"Bar Chez Moi" },
                { label:"VILLE",         key:"ville", placeholder:"Ebolowa..." },
                { label:"TÉLÉPHONE",     key:"phone", placeholder:"6XX XXX XXX" },
                { label:"EMAIL *",       key:"email", placeholder:"email@bar.cm" },
                { label:"MOT DE PASSE *",key:"pass",  placeholder:"Min. 6 caractères" },
              ].map(f=>(
                <div key={f.key} style={{ marginBottom:10 }}>
                  <div style={{ color:C.dim, fontSize:10, letterSpacing:1, marginBottom:4 }}>{f.label}</div>
                  <input value={newClientF[f.key]} onChange={e=>setNewClientF(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder} type={f.key==="pass"?"password":"text"}
                    style={{ width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.05)",
                      border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                      fontSize:13, outline:"none", boxSizing:"border-box", ...SF }}/>
                </div>
              ))}
              <button onClick={()=>{
                if (!newClientF.name||!newClientF.bar||!newClientF.email||!newClientF.pass)
                  { showToast("Champs obligatoires manquants","error"); return; }
                if (clients.find(c=>c.email===newClientF.email))
                  { showToast("Email déjà utilisé","error"); return; }
                const nc={ id:Date.now(), ...newClientF, premium:false, verified:true, adminName:"", adminPhone:"", licence:"" };
                setClients(p=>[...p,nc]);
                setNewClientF({ name:"", bar:"", ville:"", phone:"", email:"", pass:"" });
                setShowAddClient(false);
                showToast(`Client ${nc.bar} ajouté ✓`);
              }} style={{ ...SF, width:"100%", padding:"11px", borderRadius:10, border:"none",
                background:`linear-gradient(135deg,${C.green},${C.greenL})`,
                color:C.cream, fontSize:13, fontWeight:"bold", cursor:"pointer" }}>
                ✅ Créer le compte client
              </button>
            </Card>
          )}

          {clients.length===0
            ? <EmptyState icon="👥" title="Aucun client inscrit" sub="Les clients apparaîtront ici après inscription"/>
            : clients.map(c=>{
              const co=orders.filter(o=>o.clientId===c.id);
              const ct=co.reduce((s,o)=>s+o.total,0);
              const cPrices = premiumPrices[c.id]||{};
              const [showPrices, setShowPrices] = React.useState(false);
              const [editCPrices, setEditCPrices] = React.useState({});
              return (
                <Card key={c.id} gold={c.premium} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                        <span style={{ color:C.cream, fontSize:14, fontWeight:"bold" }}>{c.bar}</span>
                        {c.premium&&<Pill label="⭐ Premium" color={C.goldL} small/>}
                      </div>
                      <div style={{ color:C.dim, fontSize:11 }}>{c.name} · {c.ville}</div>
                      <div style={{ color:C.dim, fontSize:11 }}>📧 {c.email}</div>
                      <div style={{ color:C.dim, fontSize:11 }}>📞 {c.phone}</div>
                      {c.adminName&&<div style={{ color:C.dim, fontSize:10, marginTop:2 }}>👥 Admin : {c.adminName}</div>}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                      <button onClick={()=>{ setClients(prev=>prev.map(x=>x.id===c.id?{...x,premium:!x.premium}:x)); showToast(c.premium?`${c.bar} → Standard`:`${c.bar} → Premium ⭐`); }} style={{ ...SF,
                        background:c.premium?"rgba(192,57,43,0.15)":"rgba(201,150,10,0.12)",
                        color:c.premium?C.red:C.goldL, border:`1px solid ${c.premium?C.red:C.gold}`,
                        padding:"5px 12px", borderRadius:20, fontSize:10, cursor:"pointer", fontWeight:"bold", whiteSpace:"nowrap" }}>
                        {c.premium?"Retirer VIP":"⭐ VIP"}
                      </button>
                      <button onClick={()=>{
                        if (window.confirm(`Supprimer le client "${c.bar}" ?`)) {
                          setClients(prev=>prev.filter(x=>x.id!==c.id));
                          showToast(`${c.bar} supprimé`,"warning");
                        }
                      }} style={{ ...SF, background:"rgba(192,57,43,0.12)", color:C.red,
                        border:`1px solid ${C.red}`, padding:"5px 12px",
                        borderRadius:20, fontSize:10, cursor:"pointer", fontWeight:"bold" }}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>

                  {co.length>0 && (
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"6px 12px", flex:1 }}>
                        <div style={{ color:C.goldL, fontSize:13, fontWeight:"bold" }}>{fmt(ct)} F</div>
                        <div style={{ color:C.dim, fontSize:10 }}>Total achats</div>
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"6px 12px", flex:1 }}>
                        <div style={{ color:C.greenL, fontSize:13, fontWeight:"bold" }}>{co.length}</div>
                        <div style={{ color:C.dim, fontSize:10 }}>Commandes</div>
                      </div>
                    </div>
                  )}

                  {/* Prix personnalisés Premium */}
                  {c.premium && (
                    <>
                      <button onClick={()=>setShowPrices(!showPrices)} style={{ ...SF,
                        width:"100%", background:"rgba(201,150,10,0.08)", color:C.goldL,
                        border:`1px solid ${C.border}`, padding:"7px", borderRadius:8,
                        fontSize:11, cursor:"pointer", fontWeight:"bold" }}>
                        {showPrices?"▲ Masquer":"💰 Gérer les prix VIP de ce client"}
                      </button>
                      {showPrices && (
                        <div style={{ marginTop:10, background:"rgba(255,255,255,0.02)", borderRadius:10, padding:10 }}>
                          <div style={{ color:C.gold, fontSize:10, letterSpacing:2, fontWeight:"bold", marginBottom:8 }}>
                            PRIX PERSONNALISÉS — {c.bar}
                          </div>
                          {products.map(p=>(
                            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                              <span style={{ fontSize:16 }}>{p.emoji}</span>
                              <span style={{ color:C.cream, fontSize:11, flex:1 }}>{p.name}</span>
                              <input type="number"
                                defaultValue={cPrices[p.id]||p.price}
                                onChange={e=>setEditCPrices(prev=>({...prev,[p.id]:Number(e.target.value)}))}
                                style={{ width:80, padding:"5px 7px", background:"rgba(255,255,255,0.05)",
                                  border:`1px solid ${cPrices[p.id]?"rgba(201,150,10,0.5)":C.border}`,
                                  borderRadius:6, color:cPrices[p.id]?C.goldL:C.cream,
                                  fontSize:11, outline:"none", textAlign:"center", ...SF }}/>
                              <span style={{ color:C.dim, fontSize:10 }}>F</span>
                            </div>
                          ))}
                          <button onClick={()=>{
                            setPremiumPrices(prev=>({...prev,[c.id]:{...(prev[c.id]||{}),...editCPrices}}));
                            showToast(`Prix VIP ${c.bar} sauvegardés ✓`);
                            setShowPrices(false);
                          }} style={{ ...SF, width:"100%", padding:"9px", borderRadius:8, border:"none",
                            background:C.gold, color:C.bg, fontSize:12, fontWeight:"bold", cursor:"pointer", marginTop:6 }}>
                            💾 Sauvegarder les prix VIP
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
        </>}

        {/* ORDERS */}
        {mgrTab==="orders" && (() => {
          const [expandedOrder, setExpandedOrder] = useState(null);
          return (
            <>
              <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:3 }}>Commandes</div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {[["week","7j"],["month","1 mois"],["year","1 an"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setStatPeriod(k)} style={{ ...SF, padding:"5px 13px", borderRadius:20, border:`1px solid ${statPeriod===k?C.gold:C.border}`, background:statPeriod===k?"rgba(201,150,10,0.2)":"transparent", color:statPeriod===k?C.goldL:C.dim, fontSize:11, fontWeight:"bold", cursor:"pointer" }}>{l}</button>
                ))}
              </div>
              {getFilteredOrders().length===0
                ? <EmptyState icon="📋" title="Aucune commande" sub="Les commandes apparaîtront ici"/>
                : getFilteredOrders().map(o=>{
                  const isOpen = expandedOrder===o.id;
                  return (
                    <Card key={o.id} style={{ marginBottom:10, border:`1px solid ${o.status==="pending"?C.orange:"rgba(255,255,255,0.07)"}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{o.id}</div>
                          <div style={{ color:C.goldL, fontSize:13, fontWeight:"bold" }}>👤 {o.clientName}</div>
                          <div style={{ color:C.dim, fontSize:11 }}>{fmtDate(o.date)}</div>
                          {o.delivDate&&<div style={{ color:C.greenL, fontSize:11 }}>📅 {fmtDate(o.delivDate)}</div>}
                          {o.note&&<div style={{ color:C.gold, fontSize:11 }}>📝 {o.note}</div>}
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ color:C.goldL, fontWeight:"bold", fontSize:15, marginBottom:5 }}>{fmt(o.total)} F</div>
                          <Pill label={ORDER_STATUSES[o.status]?.label||o.status} color={ORDER_STATUSES[o.status]?.color||C.dim} small/>
                        </div>
                      </div>
                      <button onClick={()=>setExpandedOrder(isOpen?null:o.id)} style={{ ...SF,
                        width:"100%", background:"rgba(201,150,10,0.08)", color:C.goldL,
                        border:`1px solid ${C.border}`, padding:"8px", borderRadius:10,
                        fontSize:12, cursor:"pointer", fontWeight:"bold", marginBottom:8 }}>
                        {isOpen?"▲ Masquer les détails":"▼ Voir les produits commandés"}
                      </button>
                      {isOpen && (
                        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:12, marginBottom:10 }}>
                          <div style={{ color:C.gold, fontSize:10, fontWeight:"bold", letterSpacing:2, marginBottom:10 }}>DÉTAIL DE LA COMMANDE</div>
                          {o.products && o.products.length>0
                            ? o.products.map((p,i)=>(
                              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                                <div>
                                  <div style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>
                                    {p.name} {p.demi&&<span style={{ color:C.gold, fontSize:10 }}>½ casier</span>}
                                  </div>
                                  <div style={{ color:C.dim, fontSize:11 }}>Quantité : {p.qty}</div>
                                </div>
                                <div style={{ color:C.goldL, fontWeight:"bold", fontSize:13 }}>{fmt(p.price)} F</div>
                              </div>
                            ))
                            : <div style={{ color:C.dim, fontSize:12, textAlign:"center", padding:"10px 0" }}>Détails non disponibles</div>
                          }
                          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, marginTop:4, borderTop:`1px solid ${C.border}` }}>
                            <span style={{ color:C.cream, fontSize:14, fontWeight:"bold" }}>TOTAL</span>
                            <span style={{ color:C.goldL, fontSize:14, fontWeight:"bold" }}>{fmt(o.total)} FCFA</span>
                          </div>
                        </div>
                      )}
                      {ORDER_STATUSES[o.status]?.next && (
                        <button onClick={()=>{
                          const next=ORDER_STATUSES[o.status].next;
                          setOrders(prev=>prev.map(x=>x.id===o.id?{...x,status:next}:x));
                          addNotif(`Commande ${o.id} → ${ORDER_STATUSES[next].label}`);
                          showToast(`${o.id} : ${ORDER_STATUSES[next].label}`);
                        }} style={{ ...SF, width:"100%", background:"rgba(26,107,53,0.15)", color:C.greenL,
                          border:`1px solid rgba(26,107,53,0.3)`, padding:"9px", borderRadius:10,
                          fontSize:12, cursor:"pointer", fontWeight:"bold" }}>
                          ✅ Passer à : {ORDER_STATUSES[ORDER_STATUSES[o.status].next].label}
                        </button>
                      )}
                    </Card>
                  );
                })}
            </>
          );
        })()}
        {/* MESSAGES */}
        {mgrTab==="messages" && (
          <>
            <div style={{ color:C.goldL, fontSize:15, fontWeight:"bold", marginBottom:3 }}>Messages clients</div>
            <div style={{ color:C.dim, fontSize:12, marginBottom:14 }}>
              {messages.filter(m=>m.from==="client"&&!m.read).length} message(s) non lu(s)
            </div>
            {messages.filter(m=>m.from==="client").length===0
              ? <EmptyState icon="💬" title="Aucun message" sub="Les messages des clients apparaîtront ici"/>
              : [...new Set(messages.filter(m=>m.from==="client").map(m=>m.clientId))].map(cid=>{
                const clientMsgs = messages.filter(m=>m.clientId===cid);
                const cName = clientMsgs[0]?.clientName||"Client";
                const unread = clientMsgs.filter(m=>m.from==="client"&&!m.read).length;
                return (
                  <Card key={cid} style={{ marginBottom:10, border:`1px solid ${unread>0?C.blue:"rgba(255,255,255,0.06)"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div>
                        <span style={{ color:C.cream, fontSize:13, fontWeight:"bold" }}>{cName}</span>
                        {unread>0 && <Pill label={`${unread} nouveau`} color={C.blue} small/>}
                      </div>
                    </div>
                    <div style={{ maxHeight:150, overflowY:"auto", marginBottom:8 }}>
                      {clientMsgs.map(m=>(
                        <div key={m.id} style={{ marginBottom:6, display:"flex",
                          justifyContent:m.from==="manager"?"flex-end":"flex-start" }}>
                          <div style={{ maxWidth:"80%", padding:"7px 10px", borderRadius:10,
                            background:m.from==="manager"?"rgba(26,107,53,0.3)":"rgba(255,255,255,0.06)",
                            color:C.cream, fontSize:12 }}>
                            <div style={{ color:C.dim, fontSize:9, marginBottom:2 }}>
                              {m.from==="manager"?"Direction":"Client"} · {fmtDate(m.date)}
                            </div>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <input placeholder={`Répondre à ${cName}...`}
                        id={`reply-${cid}`}
                        style={{ flex:1, padding:"8px 10px", background:"rgba(255,255,255,0.05)",
                          border:`1px solid ${C.border}`, borderRadius:8, color:C.cream,
                          fontSize:12, outline:"none", ...SF }}/>
                      <button onClick={()=>{
                        const inp=document.getElementById(`reply-${cid}`);
                        if(!inp?.value?.trim()) return;
                        const reply={ id:Date.now(), from:"manager", to:cid, clientId:cid,
                          clientName:cName, text:inp.value, date:new Date().toISOString(), read:false };
                        setMessages(p=>[...p.map(m=>m.clientId===cid&&m.from==="client"?{...m,read:true}:m),reply]);
                        inp.value="";
                        showToast(`Réponse envoyée à ${cName}`);
                      }} style={{ ...SF, background:C.green, color:C.cream, border:"none",
                        padding:"8px 14px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:"bold" }}>
                        Envoyer
                      </button>
                    </div>
                  </Card>
                );
              })}
          </>
        )}
      </div>
      <Toast t={toast}/>
    </div>
  );

  return null;
}
