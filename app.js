const KEYS = { livres: "bib_livres", etudiants: "bib_etudiants", emprunts: "bib_emprunts" };
const SETTINGS_KEY = "bib_settings";
const DEFAULT_SETTINGS = { libName: "Bibliothèque universitaire", user: "Bibliothécaire", duree: 14 };

const db = {
  _read(t) {
    try { return JSON.parse(localStorage.getItem(KEYS[t])) || []; }
    catch { return []; }
  },
  _write(t, rows) { localStorage.setItem(KEYS[t], JSON.stringify(rows)); },

  async list(t) { return this._read(t); },
  async insert(t, row) {
    const rows = this._read(t);
    row.id = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    rows.push(row);
    this._write(t, rows);
    return row;
  },
  async update(t, id, patch) {
    this._write(t, this._read(t).map(r => (r.id === id ? { ...r, ...patch } : r)));
  },
  async remove(t, id) { this._write(t, this._read(t).filter(r => r.id !== id)); },

  getSettings() {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
    catch { return { ...DEFAULT_SETTINGS }; }
  },
  saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); },

  exportAll() { return { livres: this._read("livres"), etudiants: this._read("etudiants"), emprunts: this._read("emprunts") }; },
  importAll(d) { ["livres", "etudiants", "emprunts"].forEach(t => this._write(t, Array.isArray(d[t]) ? d[t] : [])); },
  resetAll() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); },
};

function seed() {
  if (db._read("livres").length || db._read("etudiants").length || db._read("emprunts").length) return;
  db._write("livres", [
    { id: 1, titre: "Introduction à l'algorithmique", auteur: "T. Cormen", categorie: "Informatique", annee: 2010, quantite: 4 },
    { id: 2, titre: "Les Misérables", auteur: "Victor Hugo", categorie: "Littérature", annee: 1862, quantite: 2 },
    { id: 3, titre: "Systèmes d'exploitation", auteur: "A. Tanenbaum", categorie: "Informatique", annee: 2014, quantite: 1 },
    { id: 4, titre: "Analyse mathématique", auteur: "J. Dieudonné", categorie: "Mathématiques", annee: 1968, quantite: 3 },
    { id: 5, titre: "L'Étranger", auteur: "Albert Camus", categorie: "Littérature", annee: 1942, quantite: 0 },
  ]);
  db._write("etudiants", [
    { id: 1, nom: "Benali", prenom: "Sara", email: "sara.benali@usthb.dz", telephone: "0550 11 22 33" },
    { id: 2, nom: "Haddad", prenom: "Yacine", email: "yacine.haddad@usthb.dz", telephone: "0661 44 55 66" },
    { id: 3, nom: "Kaci", prenom: "Lina", email: "lina.kaci@usthb.dz", telephone: "0770 77 88 99" },
  ]);
  const t = today();
  db._write("emprunts", [
    { id: 1, etudiant_id: 1, livre_id: 2, date_emprunt: addDays(t, -30), date_retour_prevue: addDays(t, -16), date_retour_effective: null },
    { id: 2, etudiant_id: 2, livre_id: 3, date_emprunt: addDays(t, -3), date_retour_prevue: addDays(t, 11), date_retour_effective: null },
    { id: 3, etudiant_id: 3, livre_id: 1, date_emprunt: addDays(t, -20), date_retour_prevue: addDays(t, -6), date_retour_effective: addDays(t, -8) },
  ]);
}

const $ = (s, el = document) => el.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const diffDays = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const fmt = d => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const plural = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;
const hue = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function statut(e) {
  if (e.date_retour_effective) return "Rendu";
  return today() > e.date_retour_prevue ? "En retard" : "En cours";
}


const ICONS = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h13"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.2 2.4 3.5 5.2"/>',
  swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  alert: '<path d="M12 3 2 20h20zM12 10v4M12 17v.5"/>',
};
const ico = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2300);
}

function openForm(title, fields, values, onSave) {
  $("#dlgTitle").textContent = title;
  $("#dlgError").hidden = true;
  $("#dlgFields").innerHTML = fields.map(f => {
    const v = values[f.name] ?? "";
    const input = f.type === "select"
      ? `<select name="${f.name}" ${f.required ? "required" : ""}>${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`
      : `<input name="${f.name}" type="${f.type || "text"}" value="${esc(v)}" ${f.required ? "required" : ""} ${f.min !== undefined ? `min="${f.min}"` : ""}>`;
    return `<div class="field"><label>${esc(f.label)}</label>${input}</div>`;
  }).join("");

  const form = $("#form");
  form.onsubmit = async e => {
    e.preventDefault();
    const err = await onSave(Object.fromEntries(new FormData(form)));
    if (err) { $("#dlgError").textContent = err; $("#dlgError").hidden = false; return; }
    $("#dlg").close();
    render();
  };
  $("#dlg").showModal();
}
$("#dlgCancel").onclick = () => $("#dlg").close();

const SUPABASE_URL = "";
const SUPABASE_KEY = "";
let session = null; // null = invité (localStorage) ; sinon { email }
let authMode = "login";

let view = "dashboard";
let query = "";
let cat = "Toutes";

async function loadAll() {
  const [livres, etudiants, emprunts] = await Promise.all([db.list("livres"), db.list("etudiants"), db.list("emprunts")]);
  const loans = emprunts.map(e => ({
    e, st: statut(e),
    l: livres.find(x => x.id === e.livre_id),
    s: etudiants.find(x => x.id === e.etudiant_id),
  }));
  return { livres, etudiants, emprunts, loans };
}

const greeting = () => { const h = new Date().getHours(); return h < 6 || h >= 18 ? "Bonsoir" : "Bonjour"; };

const skeleton = () => `<div class="sk-wrap" aria-busy="true"><div class="sk" style="height:90px"></div><div class="sk" style="height:220px"></div></div>`;
let firstLoad = true;

async function render() {
  if (firstLoad) $("#content").innerHTML = skeleton();
  const D = await loadAll();
  firstLoad = false;
  const S = db.getSettings();
  const actifs = D.loans.filter(x => x.st !== "Rendu");
  const retards = D.loans.filter(x => x.st === "En retard");

  // Sidebar + barre du haut
  $("#libName").textContent = S.libName;
  $("#meName").textContent = S.user;
  $("#meAvatar").textContent = (S.user[0] || "B").toUpperCase();
  $("#dateChip").textContent = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === view));
  $("#cnt-livres").textContent = D.livres.length;
  $("#cnt-etudiants").textContent = D.etudiants.length;
  $("#cnt-emprunts").textContent = actifs.length;

  $("#modeBadge").textContent = session ? session.email : "Mode invité";
  $("#modeBadge").className = "mode " + (session ? "on" : "guest");
  $("#authBtn").textContent = session ? "Se déconnecter" : "Se connecter";
  $("#authBtn").className = "btn " + (session ? "" : "primary");
  $("#sideNote").textContent = session ? "Vos données sont enregistrées dans votre compte." : "Mode invité : les données restent sur cet appareil.";

  const bc = $("#bellCount");
  bc.hidden = !retards.length;
  bc.textContent = retards.length;
  $("#bellPanel").innerHTML = `<h3>Retards</h3>` + (retards.length
    ? retards.slice(0, 5).map(x => `<div class="row"><strong>${esc(x.l?.titre ?? "Livre supprimé")}</strong>${esc(x.s ? `${x.s.prenom} ${x.s.nom}` : "")}<small>${plural(diffDays(today(), x.e.date_retour_prevue), "jour")} de retard</small></div>`).join("")
    : `<p class="muted">Aucun retard. Tout est à jour.</p>`);

  const meta = {
    dashboard: [`${greeting()}, ${S.user}`, "Voici l'état de la bibliothèque aujourd'hui.", "Rechercher un livre"],
    livres: ["Livres", "Le catalogue de la bibliothèque.", "Titre, auteur ou catégorie"],
    etudiants: ["Étudiants", "Les étudiants inscrits à la bibliothèque.", "Nom, prénom ou email"],
    emprunts: ["Emprunts et retours", "Suivez chaque livre, de la sortie au retour.", "Livre ou étudiant"],
    analyses: ["Analyses", "Les livres les plus demandés et les étudiants qui rendent le mieux.", "Rechercher un livre"],
    settings: ["Paramètres", "Réglages de la bibliothèque et gestion des données.", "Rechercher un livre"],
  }[view];
  $("#pageTitle").textContent = meta[0];
  $("#pageSub").textContent = meta[1];
  $("#search").placeholder = meta[2];

  const views = { dashboard: vDash, livres: vLivres, etudiants: vEtudiants, emprunts: vEmprunts, analyses: vAnalyses, settings: vSettings };
  $("#content").innerHTML = views[view](D, S);
}


function vDash(D) {
  const enCours = D.loans.filter(x => x.st === "En cours").length;
  const retards = D.loans.filter(x => x.st === "En retard");
  const exemplaires = D.livres.reduce((n, l) => n + l.quantite, 0);

  const stat = (icon, label, n, sub, tone) =>
    `<div class="stat ${tone}"><span class="ico">${ico(icon)}</span><b>${n}</b><span>${label}</span><small>${sub}</small></div>`;

  const parCat = {};
  D.livres.forEach(l => { parCat[l.categorie] = (parCat[l.categorie] || 0) + 1; });
  const cats = Object.entries(parCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = cats.length ? cats[0][1] : 1;

  const recent = [...D.loans].sort((a, b) => b.e.id - a.e.id).slice(0, 5);

  return `
    <div class="quick">
      <button class="btn primary" data-act="add-emprunt">Nouvel emprunt</button>
      <button class="btn" data-act="add-livre">Ajouter un livre</button>
      <button class="btn" data-act="add-etu">Ajouter un étudiant</button>
    </div>
    <div class="stats">
      ${stat("book", "Titres au catalogue", D.livres.length, `${plural(exemplaires, "exemplaire")} disponible${exemplaires > 1 ? "s" : ""}`, "mint")}
      ${stat("users", "Étudiants inscrits", D.etudiants.length, "membres de la bibliothèque", "sky")}
      ${stat("swap", "Emprunts en cours", enCours, "dans les délais", "sand")}
      ${stat("alert", "En retard", retards.length, retards.length ? "à relancer" : "rien à signaler", "coral")}
    </div>
    <div class="panels">
      <div class="card panel">
        <h3>Retards à traiter</h3>
        ${retards.length ? retards.map(x => `
          <div class="line">
            <div><strong>${esc(x.l?.titre ?? "Livre supprimé")}</strong><small>${esc(x.s ? `${x.s.prenom} ${x.s.nom}` : "")} · ${plural(diffDays(today(), x.e.date_retour_prevue), "jour")} de retard</small></div>
            <button class="btn sm" data-act="return" data-id="${x.e.id}">Retour</button>
          </div>`).join("") : `<p class="muted">Aucun retard pour le moment.</p>`}
      </div>
      <div class="card panel">
        <h3>Derniers emprunts</h3>
        ${recent.length ? recent.map(x => `
          <div class="line">
            <div><strong>${esc(x.l?.titre ?? "Livre supprimé")}</strong><small>${esc(x.s ? `${x.s.prenom} ${x.s.nom}` : "")} · ${fmt(x.e.date_emprunt)}</small></div>
            <span class="badge ${x.st.toLowerCase().replace(" ", "-")}">${x.st}</span>
          </div>`).join("") : `<p class="muted">Aucun emprunt enregistré.</p>`}
      </div>
      <div class="card panel">
        <h3>Catégories</h3>
        ${cats.length ? cats.map(([c, n]) => `<div class="bar"><span>${esc(c)}</span><i><u style="width:${(n / max) * 100}%"></u></i><b>${n}</b></div>`).join("") : `<p class="muted">Ajoutez des livres pour voir la répartition.</p>`}
      </div>
    </div>`;
}

const livreFields = [
  { name: "titre", label: "Titre", required: true },
  { name: "auteur", label: "Auteur", required: true },
  { name: "categorie", label: "Catégorie", required: true },
  { name: "annee", label: "Année de publication", type: "number", required: true, min: 0 },
  { name: "quantite", label: "Quantité disponible", type: "number", required: true, min: 0 },
];
const parseLivre = d => ({ ...d, annee: +d.annee, quantite: +d.quantite });

function vLivres(D) {
  const cats = ["Toutes", ...new Set(D.livres.map(l => l.categorie))];
  if (!cats.includes(cat)) cat = "Toutes";
  const q = query.trim().toLowerCase();
  const list = D.livres.filter(l =>
    (cat === "Toutes" || l.categorie === cat) &&
    (!q || [l.titre, l.auteur, l.categorie].some(x => String(x).toLowerCase().includes(q))));

  const cards = list.map(l => {
    const h = hue(l.categorie);
    const stock = l.quantite === 0 ? ["none", "Indisponible"] : l.quantite <= 1 ? ["low", "1 exemplaire"] : ["", `${l.quantite} exemplaires`];
    return `
    <article class="card book">
      <div class="cover" style="background:linear-gradient(145deg,hsl(${h} 45% 38%),hsl(${(h + 45) % 360} 50% 24%))">
        <b>${esc(l.titre[0] || "?")}</b><span>${esc(l.annee)}</span>
      </div>
      <div class="body">
        <span class="tag">${esc(l.categorie)}</span>
        <h3>${esc(l.titre)}</h3>
        <p>${esc(l.auteur)}</p>
        <span class="stock ${stock[0]}">${stock[1]}</span>
        <div class="acts">
          ${l.quantite > 0 ? `<button class="btn sm primary" data-act="add-emprunt" data-livre="${l.id}">Emprunter</button>` : ""}
          <button class="btn sm" data-act="edit-livre" data-id="${l.id}">Modifier</button>
          <button class="btn sm danger" data-act="del-livre" data-id="${l.id}">Supprimer</button>
        </div>
      </div>
    </article>`;
  }).join("");

  return `
    <div class="quick"><button class="btn primary" data-act="add-livre">Ajouter un livre</button></div>
    <div class="chips">${cats.map(c => `<button class="${c === cat ? "on" : ""}" data-act="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="grid">${cards || `<p class="empty">${q || cat !== "Toutes" ? "Aucun livre ne correspond à votre recherche." : "Le catalogue est vide. Ajoutez votre premier livre."}</p>`}</div>`;
}


const etuFields = [
  { name: "nom", label: "Nom", required: true },
  { name: "prenom", label: "Prénom", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "telephone", label: "Téléphone", type: "tel", required: true },
];

function vEtudiants(D) {
  const q = query.trim().toLowerCase();
  const list = D.etudiants.filter(s => !q || [s.nom, s.prenom, s.email].some(x => String(x).toLowerCase().includes(q)));
  const cards = list.map(s => {
    const n = D.loans.filter(x => x.e.etudiant_id === s.id && x.st !== "Rendu").length;
    return `
    <article class="card stu">
      <span class="avatar" style="background:hsl(${hue(s.nom + s.prenom)} 45% 40%)">${esc((s.prenom[0] || "") + (s.nom[0] || ""))}</span>
      <h3>${esc(s.prenom)} ${esc(s.nom)}</h3>
      <p>${esc(s.email)}</p>
      <p>${esc(s.telephone)}</p>
      <p><span class="badge ${n ? "en-cours" : "rendu"}">${n ? `${plural(n, "emprunt")} en cours` : "Aucun emprunt"}</span></p>
      <div class="acts">
        <button class="btn sm primary" data-act="add-emprunt" data-etu="${s.id}">Nouvel emprunt</button>
        <button class="btn sm" data-act="edit-etu" data-id="${s.id}">Modifier</button>
        <button class="btn sm danger" data-act="del-etu" data-id="${s.id}">Supprimer</button>
      </div>
    </article>`;
  }).join("");
  return `
    <div class="quick"><button class="btn primary" data-act="add-etu">Ajouter un étudiant</button></div>
    <div class="grid">${cards || `<p class="empty">${q ? "Aucun étudiant ne correspond à votre recherche." : "Aucun étudiant inscrit. Ajoutez le premier."}</p>`}</div>`;
}


function vEmprunts(D) {
  const q = query.trim().toLowerCase();
  const loans = D.loans.filter(x => !q || `${x.l?.titre} ${x.s?.nom} ${x.s?.prenom}`.toLowerCase().includes(q))
    .sort((a, b) => b.e.id - a.e.id);

  const card = x => {
    const left = diffDays(x.e.date_retour_prevue, today());
    const when = x.st === "Rendu" ? `<span class="when fine">Rendu le ${fmt(x.e.date_retour_effective)}</span>`
      : x.st === "En retard" ? `<span class="when late">${plural(-left, "jour")} de retard</span>`
      : left === 0 ? `<span class="when soon">À rendre aujourd'hui</span>`
      : `<span class="when ${left <= 3 ? "soon" : "fine"}">Retour dans ${plural(left, "jour")}</span>`;
    return `
    <article class="card k">
      <h4>${esc(x.l?.titre ?? "Livre supprimé")}</h4>
      <p>${esc(x.s ? `${x.s.prenom} ${x.s.nom}` : "Étudiant supprimé")}</p>
      <p>Du ${fmt(x.e.date_emprunt)} au ${fmt(x.e.date_retour_prevue)}</p>
      ${when}
      ${x.st !== "Rendu" ? `<button class="btn sm primary" data-act="return" data-id="${x.e.id}">Enregistrer le retour</button>` : ""}
    </article>`;
  };
  const col = (title, st, dot, emptyMsg) => {
    const items = loans.filter(x => x.st === st);
    return `<div class="col" style="--dot:${dot}"><h3>${title}<em>${items.length}</em></h3>
      <div class="scroll">${items.map(card).join("") || `<p class="empty">${emptyMsg}</p>`}</div></div>`;
  };
  return `
    <div class="quick"><button class="btn primary" data-act="add-emprunt">Nouvel emprunt</button></div>
    <div class="board">
      ${col("En cours", "En cours", "var(--brass)", "Aucun emprunt en cours.")}
      ${col("En retard", "En retard", "var(--bad)", "Aucun retard. Bravo !")}
      ${col("Rendus", "Rendu", "var(--ok)", "Aucun retour enregistré.")}
    </div>`;
}

async function newEmprunt(pre = {}) {
  const [livres, etudiants] = await Promise.all([db.list("livres"), db.list("etudiants")]);
  const dispo = livres.filter(l => l.quantite > 0);
  if (!etudiants.length) return toast("Ajoutez d'abord un étudiant.");
  if (!dispo.length) return toast("Aucun livre disponible à emprunter.");
  openForm("Nouvel emprunt", [
    { name: "etudiant_id", label: "Étudiant", type: "select", required: true, options: etudiants.map(s => ({ value: s.id, label: `${s.prenom} ${s.nom}` })) },
    { name: "livre_id", label: "Livre", type: "select", required: true, options: dispo.map(l => ({ value: l.id, label: `${l.titre} (${l.quantite} dispo)` })) },
    { name: "date_emprunt", label: "Date d'emprunt", type: "date", required: true },
    { name: "duree", label: "Durée autorisée (jours)", type: "number", required: true, min: 1 },
  ], { date_emprunt: today(), duree: db.getSettings().duree, ...pre }, async d => {
    const livre = (await db.list("livres")).find(l => l.id === +d.livre_id);
    if (!livre || livre.quantite < 1) return "Ce livre n'est plus disponible.";
    await db.insert("emprunts", {
      etudiant_id: +d.etudiant_id, livre_id: +d.livre_id,
      date_emprunt: d.date_emprunt,
      date_retour_prevue: addDays(d.date_emprunt, +d.duree),
      date_retour_effective: null,
    });
    await db.update("livres", livre.id, { quantite: livre.quantite - 1 });
    toast("Emprunt enregistré");
  });
}


function vAnalyses(D) {
  // Livres les plus demandés : nombre d'emprunts par livre (égalité : ordre alphabétique)
  const parLivre = {};
  D.emprunts.forEach(e => { parLivre[e.livre_id] = (parLivre[e.livre_id] || 0) + 1; });
  const topLivres = D.livres
    .map(l => ({ l, n: parLivre[l.id] || 0 }))
    .filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n || a.l.titre.localeCompare(b.l.titre, "fr"))
    .slice(0, 5);
  const parEtu = {};
  D.emprunts.forEach(e => {
    const r = parEtu[e.etudiant_id] || (parEtu[e.etudiant_id] = { total: 0, rendus: 0 });
    r.total++;
    if (e.date_retour_effective) r.rendus++;
  });
  const topEtu = D.etudiants
    .filter(s => parEtu[s.id])
    .map(s => ({ s, total: parEtu[s.id].total, rendus: parEtu[s.id].rendus, taux: parEtu[s.id].rendus / parEtu[s.id].total }))
    .sort((a, b) => b.taux - a.taux || b.rendus - a.rendus || b.total - a.total || a.s.nom.localeCompare(b.s.nom, "fr"))
    .slice(0, 5);

  const maxLivre = topLivres.length ? topLivres[0].n : 1;
  const row = (rank, titre, sous, val, pct) => `
    <div class="rk">
      <span class="n">${rank}</span>
      <div><strong>${esc(titre)}</strong><small>${esc(sous)}</small></div>
      <span class="val">${val}</span>
      <i><u style="width:${pct}%"></u></i>
    </div>`;

  return `
    <div class="panels">
      <div class="card panel">
        <h3>Livres les plus demandés</h3>
        <p class="muted">Classés par nombre d'emprunts depuis le début.</p>
        <div class="rks">${topLivres.length
          ? topLivres.map((x, i) => row(i + 1, x.l.titre, x.l.auteur, plural(x.n, "emprunt"), (x.n / maxLivre) * 100)).join("")
          : `<p class="muted">Pas encore d'emprunts pour établir un classement.</p>`}</div>
      </div>
      <div class="card panel">
        <h3>Étudiants qui rendent le mieux</h3>
        <p class="muted">Taux de retour = livres rendus sur livres empruntés. À égalité, celui qui a rendu le plus de livres passe devant.</p>
        <div class="rks">${topEtu.length
          ? topEtu.map((x, i) => row(i + 1, `${x.s.prenom} ${x.s.nom}`, `${x.rendus} rendu${x.rendus > 1 ? "s" : ""} sur ${x.total}`, `${Math.round(x.taux * 100)} %`, x.taux * 100)).join("")
          : `<p class="muted">Pas encore d'emprunts pour établir un classement.</p>`}</div>
      </div>
    </div>`;
}


function vSettings(D, S) {
  return `
    <div class="set">
      <form class="card panel" id="settingsForm">
        <h3>Bibliothèque</h3>
        <div class="field"><label>Nom de la bibliothèque</label><input name="libName" value="${esc(S.libName)}" required></div>
        <div class="field"><label>Votre nom</label><input name="user" value="${esc(S.user)}" required></div>
        <div class="field"><label>Durée d'emprunt par défaut (jours)</label><input name="duree" type="number" min="1" value="${esc(S.duree)}" required></div>
        <div class="row-btns"><button class="btn primary" type="submit">Enregistrer les réglages</button></div>
      </form>
      <div class="card panel">
        <h3>Données</h3>
        <p class="muted">Faites une sauvegarde avant de tout effacer. Le fichier exporté peut être réimporté plus tard.</p>
        <div class="row-btns">
          <button class="btn" data-act="export">Exporter (JSON)</button>
          <button class="btn" data-act="import">Importer</button>
          <button class="btn danger" data-act="reset">Tout effacer</button>
        </div>
      </div>
    </div>`;
}


function go(v) { view = v; query = ""; cat = "Toutes"; $("#search").value = ""; render(); }

$("#nav").addEventListener("click", e => { const b = e.target.closest("button"); if (b) go(b.dataset.view); });
$("#quickLoan").onclick = () => newEmprunt();

$("#search").addEventListener("input", e => {
  query = e.target.value;
  if (view === "dashboard" || view === "analyses" || view === "settings") view = "livres";
  render();
});

$("#bellBtn").onclick = e => { e.stopPropagation(); $("#bellPanel").hidden = !$("#bellPanel").hidden; };
document.addEventListener("click", e => { if (!e.target.closest(".bell-wrap")) $("#bellPanel").hidden = true; });


function setAuthMode(m) {
  authMode = m;
  $("#authTitle").textContent = m === "login" ? "Se connecter" : "Créer un compte";
  $("#authSubmit").textContent = m === "login" ? "Se connecter" : "Créer mon compte";
  $("#authForm").elements.password.autocomplete = m === "login" ? "current-password" : "new-password";
  document.querySelectorAll("[data-auth]").forEach(b => b.classList.toggle("on", b.dataset.auth === m));
  $("#authError").hidden = true;
}
document.querySelectorAll("[data-auth]").forEach(b => b.addEventListener("click", () => setAuthMode(b.dataset.auth)));

$("#authBtn").onclick = () => {
  if (session) { session = null; toast("Déconnecté. Retour en mode invité."); render(); return; }
  setAuthMode("login");
  $("#authDlg").showModal();
};
$("#authGuest").onclick = () => $("#authDlg").close();

$("#authForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!SUPABASE_URL) {
    $("#authError").textContent = "La connexion sera activée à la prochaine étape, quand la base de données sera branchée. En attendant, continuez en mode invité.";
    $("#authError").hidden = false;
    return;
  }

});

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem("bib_theme", t);
  $("#themeBtn").innerHTML = ico(t === "dark" ? "sun" : "moon");
}
$("#themeBtn").onclick = () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

$("#content").addEventListener("submit", e => {
  if (e.target.id !== "settingsForm") return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  db.saveSettings({ libName: d.libName.trim(), user: d.user.trim(), duree: Math.max(1, +d.duree) });
  toast("Réglages enregistrés");
  render();
});

$("#importFile").addEventListener("change", async e => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || typeof d !== "object" || !("livres" in d)) throw new Error();
    db.importAll(d);
    toast("Données importées");
    render();
  } catch { toast("Fichier invalide."); }
});

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const id = +b.dataset.id;

  switch (b.dataset.act) {
    case "cat": cat = b.dataset.cat; render(); break;
    case "add-livre":
      openForm("Ajouter un livre", livreFields, {}, async d => { await db.insert("livres", parseLivre(d)); toast("Livre ajouté"); });
      break;
    case "edit-livre": {
      const l = (await db.list("livres")).find(x => x.id === id);
      openForm("Modifier le livre", livreFields, l, async d => { await db.update("livres", id, parseLivre(d)); toast("Livre modifié"); });
      break;
    }
    case "del-livre": {
      if ((await db.list("emprunts")).some(x => x.livre_id === id && !x.date_retour_effective)) return toast("Impossible : ce livre a un emprunt en cours.");
      if (confirm("Supprimer ce livre du catalogue ?")) { await db.remove("livres", id); toast("Livre supprimé"); render(); }
      break;
    }
    case "add-etu":
      openForm("Ajouter un étudiant", etuFields, {}, async d => { await db.insert("etudiants", d); toast("Étudiant ajouté"); });
      break;
    case "edit-etu": {
      const s = (await db.list("etudiants")).find(x => x.id === id);
      openForm("Modifier l'étudiant", etuFields, s, async d => { await db.update("etudiants", id, d); toast("Étudiant modifié"); });
      break;
    }
    case "del-etu": {
      if ((await db.list("emprunts")).some(x => x.etudiant_id === id && !x.date_retour_effective)) return toast("Impossible : cet étudiant a un emprunt en cours.");
      if (confirm("Supprimer cet étudiant ?")) { await db.remove("etudiants", id); toast("Étudiant supprimé"); render(); }
      break;
    }
    case "add-emprunt":
      newEmprunt({ ...(b.dataset.livre && { livre_id: b.dataset.livre }), ...(b.dataset.etu && { etudiant_id: b.dataset.etu }) });
      break;
    case "return": {
      const emp = (await db.list("emprunts")).find(x => x.id === id);
      const livre = (await db.list("livres")).find(x => x.id === emp.livre_id);
      await db.update("emprunts", id, { date_retour_effective: today() });
      if (livre) await db.update("livres", livre.id, { quantite: livre.quantite + 1 });
      toast("Retour enregistré"); render();
      break;
    }
    case "export": {
      const url = URL.createObjectURL(new Blob([JSON.stringify(db.exportAll(), null, 2)], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `bibliotheque-${today()}.json` });
      a.click(); URL.revokeObjectURL(url);
      break;
    }
    case "import": $("#importFile").click(); break;
    case "reset":
      if (confirm("Effacer tous les livres, étudiants et emprunts ? Cette action est définitive.")) { db.resetAll(); toast("Données effacées"); render(); }
      break;
  }
});
document.querySelectorAll("[data-ico]").forEach(el => el.insertAdjacentHTML("afterbegin", ico(el.dataset.ico)));
applyTheme(localStorage.getItem("bib_theme") || "light");
seed();
render();
