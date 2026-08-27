import { useState, useEffect, useMemo, useRef } from "react";

// ---------- COSTANTI ----------
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Anton&family=Barlow:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Rajdhani:wght@500;600;700&display=swap";

const RUBRICHE = [
  "Probabili Formazioni",
  "Consigli Fantacalcio",
  "News",
  "Calciomercato",
];

const EDITOR_PASSWORD = "FrammiPassword1";

// ---------- JSONBIN CONFIGURAZIONE ----------
// Questi sono i tuoi dati – NON modificarli!
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a8fd84eda38895dfe16a269";
const JSONBIN_KEY = "$2a$10$U4sdgXqPm.QzF30B8T859ef3XMqhvv0FYxs3lBFI6/Qk/6H58lp4K";

// Dimensioni massime per le immagini caricate (px) e qualità JPEG
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 0.75;

// Articoli di esempio (fallback se JSONBin non funziona)
const SEED = [
  {
    id: "seed-1",
    title: "Probabili formazioni, 3a giornata: due ballottaggi in attacco",
    subtitle:
      "Dubbi su titolare per il rientro dall'infortunio: le scelte dei tecnici",
    author: "F.Caprio",
    category: "Probabili Formazioni",
    date: "2026-08-26",
    image: "/probabili formazioni.png",
    body: "A due giorni dal fischio d'inizio restano aperti i ballottaggi in almeno tre squadre. In attacco si gioca sul filo del recupero fisico, mentre a centrocampo alcuni allenatori valutano un cambio di modulo per l'occasione.\n\nLe indicazioni degli allenamenti verranno confermate nella rifinitura, ma la tendenza e' gia' abbastanza chiara per chi deve schierare la formazione entro la deadline.",
  },
  {
    id: "seed-2",
    title: "Consigli fantacalcio: tre scommesse a basso costo per la giornata",
    subtitle: "Occasioni sotto i 10 crediti che possono cambiare la giornata",
    author: "F.Caprio",
    category: "Consigli Fantacalcio",
    date: "2026-08-26",
    image: "/consigli fantacalcio.png",
    body: "Tra i giocatori sottovalutati di questa giornata spicca un centrocampista chiamato spesso a battere le punizioni, oltre a un esterno che gioca contro una difesa in emergenza.\n\nAttenzione anche al portiere di una squadra che in casa concede pochissimo: un jolly economico per chi deve completare la formazione.",
  },
  {
    id: "seed-3",
    title: "Calciomercato: la trattativa che può sbloccarsi entro il weekend",
    subtitle:
      "Distanza ridotta tra domanda e offerta, manca solo l'ultimo tassello",
    author: "F.Caprio",
    category: "Calciomercato",
    date: "2026-08-26",
    image: "/calciomercato.png",
    body: "Le parti si sono riavvicinate dopo settimane di stallo. Resta da definire la formula, ma le prime indiscrezioni parlano di un accordo raggiungibile entro pochi giorni.\n\nSullo sfondo restano altre due squadre pronte a inserirsi in caso di fumata nera.",
  },
  {
    id: "seed-4",
    title:
      "News: le ultime dichiarazioni dei tecnici dopo le gare infrasettimanali",
    subtitle:
      "Conferenze stampa: le parole di Conte, Inzaghi e Thiago Motta sulle prestazioni delle loro squadre",
    author: "F.Caprio",
    category: "News",
    date: "2026-08-26",
    image: "/news.png",
    body: "Al termine delle partite infrasettimanali, i tecnici della Serie A hanno analizzato le prestazioni delle loro squadre in conferenza stampa.\n\nAntonio Conte (Napoli) ha elogiato la reazione della sua squadra dopo il pareggio: 'Abbiamo dimostrato carattere, ma dobbiamo essere più cinici sotto porta'. Il tecnico leccese ha poi confermato il modulo di partenza e gli obiettivi stagionali.\n\nSimone Inzaghi (Inter) ha sottolineato l'importanza dei tre punti ottenuti: 'Vincere queste partite pesa come un macigno, i ragazzi hanno fatto un grande sforzo fisico e mentale'. L'allenatore nerazzurro ha anche parlato del recupero di alcuni infortunati in vista del prossimo turno.\n\nThiago Motta (Juventus) ha invece evidenziato i margini di crescita: 'Siamo ancora in fase di costruzione, ma la squadra ha fiducia nel progetto. I giovani stanno rispondendo presente, l'importante è mantenere questa mentalità'.",
  },
];

// ---------- FUNZIONI UTILI ----------
function formatDateIt(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function editionNumber(articles) {
  return String(articles.length).padStart(3, "0");
}

function resizeAndCompressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Il file selezionato non è un'immagine."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossibile leggere il file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Immagine non valida."));
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(
          1,
          MAX_IMAGE_WIDTH / width,
          MAX_IMAGE_HEIGHT / height
        );
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Stamp({ category }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#9C4A2E",
        border: "1.5px solid #9C4A2E",
        borderRadius: "3px",
        padding: "2px 8px",
        transform: "rotate(-2deg)",
      }}
    >
      {category}
    </span>
  );
}

// ---------- COMPONENTE PRINCIPALE ----------
export default function App() {
  const [articles, setArticles] = useState(null);
  const [view, setView] = useState("home");
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tutte");
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  function emptyForm() {
    return {
      id: null,
      title: "",
      subtitle: "",
      author: "",
      category: RUBRICHE[0],
      image: "",
      date: "",
      body: "",
    };
  }

  // ---------- LEGGI DA JSONBIN ----------
  async function loadArticles() {
    try {
      const response = await fetch(JSONBIN_URL, {
        headers: { "X-Master-Key": JSONBIN_KEY },
      });
      if (!response.ok) {
        throw new Error("Impossibile caricare gli articoli da JSONBin");
      }
      const data = await response.json();
      const articles = data.record || data;
      if (Array.isArray(articles) && articles.length > 0) {
        setArticles(articles);
        return articles;
      } else {
        throw new Error("Nessun articolo trovato su JSONBin");
      }
    } catch (e) {
      console.warn("Fallback al SEED", e);
      setArticles(SEED);
      return SEED;
    } finally {
      setLoading(false);
    }
  }

  // ---------- SALVA SU JSONBIN ----------
  async function saveArticles(articlesToSave) {
    try {
      const response = await fetch(JSONBIN_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": JSONBIN_KEY,
        },
        body: JSON.stringify(articlesToSave),
      });
      if (!response.ok) {
        throw new Error("Errore durante il salvataggio su JSONBin");
      }
      return true;
    } catch (e) {
      console.error("Errore salvataggio su JSONBin:", e);
      try {
        localStorage.setItem("articles_backup", JSON.stringify(articlesToSave));
      } catch (localError) {
        console.error("Salvataggio locale fallito:", localError);
      }
      throw e;
    }
  }

  useEffect(() => {
    loadArticles();
    const auth = sessionStorage.getItem("editorAuth");
    if (auth === "true") {
      setIsAuthorized(true);
    }
  }, []);

  function persist(next) {
    setArticles(next);
    saveArticles(next).catch((e) => {
      setError(
        "Non sono riuscito a salvare online. I dati sono salvati solo localmente. Riprova più tardi."
      );
    });
    try {
      localStorage.setItem("articles_backup", JSON.stringify(next));
    } catch (e) {
      // Ignora
    }
  }

  const sorted = useMemo(() => {
    if (!articles) return [];
    return [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [articles]);

  const filtered = useMemo(() => {
    return sorted.filter((a) => {
      const matchesCat =
        activeCategory === "Tutte" || a.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [sorted, query, activeCategory]);

  const hero = filtered[0];
  const rest = filtered.slice(1);
  const active = articles ? articles.find((a) => a.id === activeId) : null;

  function handleLogin(e) {
    e.preventDefault();
    if (loginPassword === EDITOR_PASSWORD) {
      setIsAuthorized(true);
      setLoginPassword("");
      setLoginError("");
      sessionStorage.setItem("editorAuth", "true");
      setView("home");
    } else {
      setLoginError("Password errata. Riprova.");
    }
  }

  function handleLogout() {
    setIsAuthorized(false);
    sessionStorage.removeItem("editorAuth");
    setView("home");
  }

  function requireAuth() {
    if (isAuthorized) return true;
    setView("login");
    return false;
  }

  function openEditor(article) {
    if (!requireAuth()) return;
    if (article) {
      setForm({ ...article });
    } else {
      setForm(emptyForm());
    }
    setError("");
    setView("editor");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.author.trim()) {
      setError("Titolo, autore e testo sono obbligatori.");
      return;
    }
    setSaving(true);
    let next;
    if (form.id) {
      next = articles.map((a) => (a.id === form.id ? { ...form } : a));
    } else {
      const articleDate = form.date || new Date().toISOString().slice(0, 10);
      const newArticle = {
        ...form,
        id: "art-" + Date.now(),
        date: articleDate,
      };
      next = [...articles, newArticle];
    }
    persist(next);
    setSaving(false);
    setView("home");
  }

  function handleDelete(id) {
    if (!requireAuth()) return;
    if (!window.confirm("Eliminare definitivamente questo articolo?")) return;
    const next = articles.filter((a) => a.id !== id);
    persist(next);
    setView("home");
  }

  if (loading || !articles) {
    return (
      <div
        style={{
          ...pageStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <link rel="stylesheet" href={FONT_LINK} />
        <p style={{ fontFamily: "'Rajdhani', sans-serif", color: "#5b5445" }}>
          Caricamento articoli…
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <link rel="stylesheet" href={FONT_LINK} />
      <Masthead
        edition={editionNumber(articles)}
        onHome={() => setView("home")}
        onNew={() => openEditor(null)}
        isAuthorized={isAuthorized}
        onLogout={handleLogout}
        onLoginClick={() => setView("login")}
      />

      {view === "login" && !isAuthorized && (
        <LoginScreen
          password={loginPassword}
          setPassword={setLoginPassword}
          onSubmit={handleLogin}
          error={loginError}
          onCancel={() => setView("home")}
        />
      )}

      {view === "home" && (
        <Home
          hero={hero}
          rest={rest}
          query={query}
          setQuery={setQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onOpen={(id) => {
            setActiveId(id);
            setView("detail");
          }}
          isAuthorized={isAuthorized}
          onNew={() => openEditor(null)}
        />
      )}

      {view === "detail" && active && (
        <Detail
          article={active}
          onBack={() => setView("home")}
          onEdit={() => openEditor(active)}
          onDelete={() => handleDelete(active.id)}
          isAuthorized={isAuthorized}
        />
      )}

      {view === "editor" && (
        <Editor
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setView("home")}
          saving={saving}
          error={error}
          setError={setError}
          isEditing={!!form.id}
        />
      )}

      <footer style={footerStyle}>
        <span>Il Taccuino Sportivo — redazione digitale</span>
      </footer>
    </div>
  );
}

// ---------- COMPONENTI UI ----------
function Masthead({
  edition,
  onHome,
  onNew,
  isAuthorized,
  onLogout,
  onLoginClick,
}) {
  const today = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header style={mastheadStyle}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h1
            onClick={onHome}
            style={{
              fontFamily: "'Anton', sans-serif",
              fontWeight: 400,
              fontSize: "1.9rem",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              margin: 0,
              color: "#F1ECDE",
              cursor: "pointer",
            }}
          >
            Il Taccuino Sportivo
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isAuthorized ? (
              <>
                <button onClick={onNew} style={newButtonStyle}>
                  + Nuovo articolo
                </button>
                <button onClick={onLogout} style={logoutButtonStyle}>
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.6rem",
                  cursor: "pointer",
                  color: "#F1ECDE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  transition: "background 0.2s",
                }}
                title="Accesso redazione"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                📰
              </button>
            )}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            color: "#B9C3D6",
            textTransform: "capitalize",
            marginTop: 6,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <span>{today}</span>
          <span>· Edizione N. {edition}</span>
        </div>
      </div>
    </header>
  );
}

function LoginScreen({ password, setPassword, onSubmit, error, onCancel }) {
  return (
    <main
      style={{
        maxWidth: 400,
        margin: "40px auto",
        padding: "20px",
        background: "#F1ECDE",
        borderRadius: 8,
        border: "1px solid #C9C2AE",
      }}
    >
      <h2
        style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: "1.5rem",
          marginBottom: 16,
        }}
      >
        Accesso redazione
      </h2>
      <form onSubmit={onSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Inserisci la password"
          style={{ ...inputStyle, width: "100%" }}
          autoFocus
        />
        {error && (
          <p
            style={{
              color: "#9C4A2E",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.8rem",
              marginTop: 8,
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="submit" style={newButtonStyle}>
            Accedi
          </button>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle}>
            Annulla
          </button>
        </div>
      </form>
    </main>
  );
}

function Home({
  hero,
  rest,
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
  onOpen,
  isAuthorized,
  onNew,
}) {
  return (
    <main
      style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px" }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per titolo, autore…"
          style={searchStyle}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Tutte", ...RUBRICHE].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                ...chipStyle,
                background: activeCategory === c ? "#223050" : "transparent",
                color: activeCategory === c ? "#F1ECDE" : "#4A4436",
                borderColor: activeCategory === c ? "#223050" : "#C9C2AE",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {!hero && (
        <div style={emptyStateStyle}>
          <p
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "1.3rem",
              marginBottom: 6,
            }}
          >
            Nessun articolo qui.
          </p>
          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.8rem",
              color: "#7a7261",
            }}
          >
            {isAuthorized
              ? "Scrivi il primo pezzo con '+ Nuovo articolo'."
              : "Accedi per scrivere un nuovo articolo."}
          </p>
        </div>
      )}

      {hero && (
        <article onClick={() => onOpen(hero.id)} style={heroCardStyle}>
          {hero.image && (
            <img
              src={hero.image}
              alt={hero.title}
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "6px",
                marginBottom: "14px",
              }}
            />
          )}
          <Stamp category={hero.category} />
          <h2 style={heroTitleStyle}>{hero.title}</h2>
          <p style={subtitleStyle}>{hero.subtitle}</p>
          <p style={{ ...bodyStyle, marginTop: 14 }}>
            <span style={dropCapStyle}>{hero.body.trim()[0]}</span>
            {hero.body.trim().slice(1).split("\n\n")[0]}
          </p>
          <Byline author={hero.author} date={hero.date} />
        </article>
      )}

      <div style={gridStyle}>
        {rest.map((a) => (
          <article key={a.id} onClick={() => onOpen(a.id)} style={cardStyle}>
            {a.image && (
              <img
                src={a.image}
                alt={a.title}
                style={{
                  width: "100%",
                  height: "140px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  marginBottom: "10px",
                }}
              />
            )}
            <Stamp category={a.category} />
            <h3 style={cardTitleStyle}>{a.title}</h3>
            <p style={cardSubtitleStyle}>{a.subtitle}</p>
            <Byline author={a.author} date={a.date} small />
          </article>
        ))}
      </div>
    </main>
  );
}

function Byline({ author, date, small }) {
  return (
    <div
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: small ? "0.68rem" : "0.74rem",
        color: "#8a8270",
        marginTop: small ? 10 : 16,
        letterSpacing: "0.03em",
      }}
    >
      {author} · {formatDateIt(date)}
    </div>
  );
}

function Detail({ article, onBack, onEdit, onDelete, isAuthorized }) {
  const paragraphs = article.body.split("\n\n");
  return (
    <main
      style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}
    >
      <button onClick={onBack} style={linkButtonStyle}>
        ← Prima pagina
      </button>

      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
            borderRadius: "6px",
            marginTop: "18px",
            marginBottom: "18px",
          }}
        />
      )}

      <div style={{ marginBottom: 8 }}>
        <Stamp category={article.category} />
      </div>
      <h2 style={{ ...heroTitleStyle, fontSize: "2.2rem" }}>{article.title}</h2>
      <p style={subtitleStyle}>{article.subtitle}</p>
      <Byline author={article.author} date={article.date} />
      <div
        style={{
          marginTop: 26,
          borderTop: "1px solid #C9C2AE",
          paddingTop: 22,
        }}
      >
        {paragraphs.map((p, i) => (
          <p key={i} style={{ ...bodyStyle, marginBottom: 18 }}>
            {i === 0 ? <span style={dropCapStyle}>{p[0]}</span> : null}
            {i === 0 ? p.slice(1) : p}
          </p>
        ))}
      </div>
      {isAuthorized && (
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onEdit} style={secondaryButtonStyle}>
            Modifica
          </button>
          <button onClick={onDelete} style={dangerButtonStyle}>
            Elimina
          </button>
        </div>
      )}
    </main>
  );
}

function Editor({
  form,
  setForm,
  onSubmit,
  onCancel,
  saving,
  error,
  setError,
  isEditing,
}) {
  const [imageMode, setImageMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const dataUrl = await resizeAndCompressImage(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch (err) {
      setError(err.message || "Errore durante il caricamento dell'immagine.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage() {
    setForm((f) => ({ ...f, image: "" }));
  }

  return (
    <main
      style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}
    >
      <button onClick={onCancel} style={linkButtonStyle}>
        ← Annulla
      </button>
      <h2 style={{ ...heroTitleStyle, fontSize: "1.8rem", marginTop: 18 }}>
        {isEditing ? "Modifica articolo" : "Scrivi un nuovo articolo"}
      </h2>
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 20,
        }}
      >
        <Field label="Titolo">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
            placeholder="Il titolo del pezzo"
          />
        </Field>
        <Field label="Sottotitolo">
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            style={inputStyle}
            placeholder="Una riga che spiega il taglio della notizia"
          />
        </Field>
        <div style={{ display: "flex", gap: 14 }}>
          <Field label="Autore" style={{ flex: 1 }}>
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              style={inputStyle}
              placeholder="Nome Cognome"
            />
          </Field>
          <Field label="Rubrica" style={{ flex: 1 }}>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inputStyle}
            >
              {RUBRICHE.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Immagine di copertina">
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setImageMode("upload")}
              style={{
                ...chipStyle,
                background: imageMode === "upload" ? "#223050" : "transparent",
                color: imageMode === "upload" ? "#F1ECDE" : "#4A4436",
                borderColor: imageMode === "upload" ? "#223050" : "#C9C2AE",
              }}
            >
              Carica dal dispositivo
            </button>
            <button
              type="button"
              onClick={() => setImageMode("url")}
              style={{
                ...chipStyle,
                background: imageMode === "url" ? "#223050" : "transparent",
                color: imageMode === "url" ? "#F1ECDE" : "#4A4436",
                borderColor: imageMode === "url" ? "#223050" : "#C9C2AE",
              }}
            >
              Usa un URL
            </button>
          </div>

          {imageMode === "upload" ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={inputStyle}
              />
              <p
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.7rem",
                  color: "#8a8270",
                  marginTop: 6,
                }}
              >
                {uploading
                  ? "Elaborazione immagine…"
                  : "La foto viene ridimensionata e compressa automaticamente prima di essere salvata."}
              </p>
            </div>
          ) : (
            <input
              value={form.image && form.image.startsWith("data:") ? "" : form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              style={inputStyle}
              placeholder="https://esempio.com/immagine.jpg"
            />
          )}

          {form.image && (
            <div style={{ marginTop: 12, position: "relative" }}>
              <img
                src={form.image}
                alt="Anteprima"
                style={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #C9C2AE",
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  ...dangerButtonStyle,
                  marginTop: 8,
                  fontSize: "0.7rem",
                  padding: "5px 10px",
                }}
              >
                Rimuovi immagine
              </button>
            </div>
          )}
        </Field>

        <Field label="Data di pubblicazione">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Testo (usa una riga vuota per separare i paragrafi)">
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            style={{
              ...inputStyle,
              minHeight: 220,
              fontFamily: "'Barlow', sans-serif",
              lineHeight: 1.6,
            }}
            placeholder="Attacco dell'articolo…"
          />
        </Field>
        {error && (
          <p
            style={{
              color: "#9C4A2E",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={saving || uploading}
            style={newButtonStyle}
          >
            {saving
              ? "Pubblicazione…"
              : isEditing
              ? "Salva modifiche"
              : "Pubblica"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, children, style }) {
  return (
    <label
      style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}
    >
      <span
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.7rem",
          letterSpacing: "0.05em",
          color: "#5b5445",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

// ---------- STILI ----------
const pageStyle = {
  minHeight: "100vh",
  background: "#E6E1D3",
  color: "#1E1B16",
  fontFamily: "'Barlow', sans-serif",
};

const mastheadStyle = {
  background: "#1B2740",
  borderBottom: "3px solid #9C4A2E",
};

const newButtonStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.03em",
  background: "#9C4A2E",
  color: "#F1ECDE",
  border: "none",
  borderRadius: "4px",
  padding: "9px 14px",
  cursor: "pointer",
};

const loginButtonStyle = {
  ...newButtonStyle,
  background: "#223050",
};

const logoutButtonStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.03em",
  background: "transparent",
  color: "#B9C3D6",
  border: "1px solid #B9C3D6",
  borderRadius: "4px",
  padding: "9px 14px",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "0.75rem",
  background: "transparent",
  color: "#223050",
  border: "1.5px solid #223050",
  borderRadius: "4px",
  padding: "8px 14px",
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  color: "#9C4A2E",
  border: "1.5px solid #9C4A2E",
};

const linkButtonStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "0.75rem",
  background: "none",
  border: "none",
  color: "#223050",
  cursor: "pointer",
  padding: 0,
};

const searchStyle = {
  fontFamily: "'Barlow', sans-serif",
  fontSize: "0.9rem",
  padding: "8px 12px",
  border: "1px solid #C9C2AE",
  borderRadius: "4px",
  background: "#F1ECDE",
  flex: "1 1 200px",
  outline: "none",
};

const chipStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "0.68rem",
  letterSpacing: "0.03em",
  border: "1.5px solid #C9C2AE",
  borderRadius: "999px",
  padding: "6px 12px",
  cursor: "pointer",
};

const heroCardStyle = {
  cursor: "pointer",
  borderBottom: "1px solid #C9C2AE",
  paddingBottom: 26,
  marginBottom: 30,
};

const heroTitleStyle = {
  fontFamily: "'Anton', sans-serif",
  fontWeight: 400,
  fontSize: "2.6rem",
  lineHeight: 1.05,
  letterSpacing: "0.01em",
  textTransform: "uppercase",
  margin: "10px 0 8px",
};

const subtitleStyle = {
  fontFamily: "'Barlow', sans-serif",
  fontStyle: "italic",
  fontSize: "1.15rem",
  color: "#4A4436",
  margin: 0,
};

const bodyStyle = {
  fontFamily: "'Barlow', sans-serif",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  color: "#1E1B16",
  whiteSpace: "pre-wrap",
};

const dropCapStyle = {
  fontFamily: "'Anton', sans-serif",
  fontWeight: 700,
  fontSize: "2.6rem",
  float: "left",
  lineHeight: "0.8",
  marginRight: "6px",
  color: "#223050",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 22,
};

const cardStyle = {
  cursor: "pointer",
  borderTop: "1px solid #C9C2AE",
  paddingTop: 14,
};

const cardTitleStyle = {
  fontFamily: "'Anton', sans-serif",
  fontWeight: 400,
  fontSize: "1.25rem",
  lineHeight: 1.15,
  textTransform: "uppercase",
  margin: "8px 0 6px",
};

const cardSubtitleStyle = {
  fontFamily: "'Barlow', sans-serif",
  fontStyle: "italic",
  fontSize: "0.9rem",
  color: "#5b5445",
  margin: 0,
};

const emptyStateStyle = {
  border: "1px dashed #C9C2AE",
  borderRadius: 6,
  padding: "40px 20px",
  textAlign: "center",
};

const inputStyle = {
  fontFamily: "'Barlow', sans-serif",
  fontSize: "0.95rem",
  padding: "9px 12px",
  border: "1px solid #C9C2AE",
  borderRadius: "4px",
  background: "#F1ECDE",
  outline: "none",
};

const footerStyle = {
  textAlign: "center",
  fontFamily: "'Rajdhani', sans-serif",
  fontSize: "0.68rem",
  color: "#8a8270",
  letterSpacing: "0.04em",
  padding: "0 20px 30px",
};
