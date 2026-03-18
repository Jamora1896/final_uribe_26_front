(() => {
  "use strict";

  // =========================
  // Datos de prueba (RIFLE)
  // =========================
  const DATA = {
    advisors: ["Jessica Mora", "María Alvarez", "Carlos Ramirez","Sebastian Mosquera","Juan Perez"],
    locals: ["RIFLE La Central", "RIFLE Puerta del Norte", "RIFLE Rio Sur","RIFLE Oviedo","RIFLE Viva Envigado"],
    products: [
      { id: "rf-001", name: "Camibuso tejido con cierre frontal para mujer", price: 129900 },
      { id: "rf-002", name: "Correa café con acabado texturizado y hebilla café para mujer", price: 79900 },
      { id: "rf-003", name: "Enterizo tipo short con cuello camisero para mujer", price: 189900 },
      { id: "rf-004", name: "Polo clásica con cuello tejido para hombre", price: 119900 },
      { id: "rf-005", name: "Gorra con bordado de puma unisex", price: 69900 },
      { id: "rf-006", name: "Chaqueta con capucha y apertura de cremallera para hombre", price: 229900 },
    ],
  };

  // =========================
  // Persistencia (localStorage)
  // =========================
  const LS = {
    users: "rifle.users.v1",
    session: "rifle.session.v1",
    sales: "rifle.sales.v1",
  };

  const SS = {
    session: "rifle.session.session.v1",
  };

  function safeJsonParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function readUsers() {
    const list = safeJsonParse(localStorage.getItem(LS.users), []);
    return Array.isArray(list) ? list : [];
  }

  function writeUsers(users) {
    localStorage.setItem(LS.users, JSON.stringify(users));
  }

  function readSales() {
    const list = safeJsonParse(localStorage.getItem(LS.sales), []);
    return Array.isArray(list) ? list : [];
  }

  function writeSales(sales) {
    localStorage.setItem(LS.sales, JSON.stringify(sales));
  }

  function getSession() {
    const fromSession = safeJsonParse(sessionStorage.getItem(SS.session), null);
    if (fromSession) return fromSession;
    return safeJsonParse(localStorage.getItem(LS.session), null);
  }

  function setSession(session, remember) {
    if (remember) {
      localStorage.setItem(LS.session, JSON.stringify(session));
      sessionStorage.removeItem(SS.session);
    } else {
      sessionStorage.setItem(SS.session, JSON.stringify(session));
      localStorage.removeItem(LS.session);
    }
  }

  function clearSession() {
    localStorage.removeItem(LS.session);
    sessionStorage.removeItem(SS.session);
  }

  // =========================
  // Helpers (validación / formato)
  // =========================
  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function $all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function minLen(value, n) {
    return String(value ?? "").length >= n;
  }

  function isPhone(value) {
    const v = normalizeText(value);
    return /^[0-9+\s()-]{7,20}$/.test(v);
  }

  function moneyCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "$0";
    return n.toLocaleString("es-CO", { style: "currency", currency: "COP" });
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function findProductById(id) {
    const needle = String(id ?? "").trim();
    return DATA.products.find((p) => p.id === needle) || null;
  }

  // =========================
  // UI: mensajes y navegación
  // =========================
  function setHidden(el, hidden) {
    if (!el) return;
    el.classList.toggle("is-hidden", !!hidden);
  }

  function showAlert(key, type, text) {
    // key: login/register/recover/sales
    const errorEl = document.querySelector(`[data-msg="${key}"]`);
    const okEl = document.querySelector(`[data-ok="${key}"]`);

    if (type === "error") {
      if (okEl) setHidden(okEl, true);
      if (errorEl) {
        errorEl.textContent = text || "";
        setHidden(errorEl, !text);
      }
      return;
    }

    if (type === "success") {
      if (errorEl) setHidden(errorEl, true);
      if (okEl) {
        okEl.textContent = text || "";
        setHidden(okEl, !text);
      }
    }
  }

  function setHeaderAuthState(isAuthed) {
    $all('[data-nav="dashboard"], [data-nav="sales"], [data-action="logout"]').forEach((el) =>
      setHidden(el, !isAuthed)
    );
  }

  function activateView(viewName) {
    const views = {
      login: $("#view-auth"),
      dashboard: $("#view-dashboard"),
      sales: $("#view-sales"),
    };

    // auth is one section with internal panels
    const wantAuth = viewName === "login" || viewName === "register" || viewName === "recover";
    const session = getSession();

    setHeaderAuthState(!!session);

    // deactivate all
    Object.values(views).forEach((v) => {
      if (!v) return;
      v.classList.remove("view--active", "view--visible");
      v.classList.add("is-hidden");
    });

    if (wantAuth) {
      const auth = views.login;
      auth.classList.remove("is-hidden");
      auth.classList.add("view--active");
      requestAnimationFrame(() => auth.classList.add("view--visible"));
      setAuthPanel(viewName);
      return;
    }

    if ((viewName === "dashboard" || viewName === "sales") && !session) {
      location.hash = "login";
      return;
    }

    const target = viewName === "sales" ? views.sales : views.dashboard;
    target.classList.remove("is-hidden");
    target.classList.add("view--active");
    requestAnimationFrame(() => target.classList.add("view--visible"));

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "sales") renderSales();
  }

  function setAuthPanel(panel) {
    const shell = $("#view-auth");
    if (!shell) return;
    const badge = $('[data-auth-badge]', shell);
    const title = $('[data-auth-title]', shell);
    const desc = $('[data-auth-desc]', shell);

    const panels = {
      login: $('[data-auth-panel="login"]', shell),
      register: $('[data-auth-panel="register"]', shell),
      recover: $('[data-auth-panel="recover"]', shell),
    };

    Object.values(panels).forEach((p) => p && p.classList.add("is-hidden"));
    (panels[panel] || panels.login).classList.remove("is-hidden");

    if (panel === "register") {
      badge.textContent = "Nueva cuenta RIFLE";
      title.textContent = "Crea tu cuenta.";
      desc.textContent = "Regístrate con tus datos. Todo se guarda localmente (demo).";
    } else if (panel === "recover") {
      badge.textContent = "Recuperación";
      title.textContent = "Recupera el acceso.";
      desc.textContent = "Confirmamos el envío de instrucciones (simulado).";
    } else {
      badge.textContent = "Bienvenido a RIFLE";
      title.textContent = "Donde cada prenda define tu estilo y cada detalle cuenta.";
      desc.textContent =
        "Inicia sesión para acceder al panel y registrar ventas. Diseño en grises con estética e-commerce.";
    }

    // clear alerts on switch
    showAlert("login", "error", "");
    showAlert("register", "error", "");
    showAlert("register", "success", "");
    showAlert("recover", "error", "");
    showAlert("recover", "success", "");
  }

  // =========================
  // Dashboard
  // =========================
  function computeDashboardMetrics() {
    const sales = readSales();
    const today = todayISO();

    const todaySum = sales
      .filter((s) => String(s.date) === today)
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    const count = sales.length;

    // top product by quantity (fallback by count)
    const byProduct = new Map();
    for (const s of sales) {
      const key = String(s.productId ?? "");
      const prev = byProduct.get(key) || { qty: 0, count: 0 };
      prev.qty += Number(s.qty) || 0;
      prev.count += 1;
      byProduct.set(key, prev);
    }

    let topId = "";
    let topQty = -1;
    let topCount = -1;
    for (const [pid, v] of byProduct.entries()) {
      if (v.qty > topQty || (v.qty === topQty && v.count > topCount)) {
        topId = pid;
        topQty = v.qty;
        topCount = v.count;
      }
    }

    const topProduct = topId ? findProductById(topId) : null;
    const topName = topProduct ? topProduct.name : "-";

    return { todaySum, count, topName };
  }

  function renderDashboard() {
    const m = computeDashboardMetrics();
    const todayEl = $('[data-metric="today"]');
    const countEl = $('[data-metric="count"]');
    const topEl = $('[data-metric="top"]');

    if (todayEl) todayEl.textContent = moneyCOP(m.todaySum);
    if (countEl) countEl.textContent = String(m.count);
    if (topEl) topEl.textContent = m.topName;
  }

  // =========================
  // Ventas
  // =========================
  function fillSelect(selectEl, items, getValue, getLabel) {
    if (!selectEl) return;
    selectEl.innerHTML = items
      .map((it) => `<option value="${escapeHtml(getValue(it))}">${escapeHtml(getLabel(it))}</option>`)
      .join("");
  }

  function escapeHtml(v) {
    return String(v)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function calcTotal(productId, qty) {
    const p = findProductById(productId);
    const q = Number(qty);
    if (!p || !Number.isFinite(q) || q < 1) return 0;
    return Math.round(p.price * q);
  }

  function renderSalesTable() {
    const tbody = $("[data-sales-table]");
    if (!tbody) return;
    const sales = readSales().slice(0, 10);
    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Aún no hay ventas registradas.</td></tr>`;
      return;
    }

    tbody.innerHTML = sales
      .map((s) => {
        const p = findProductById(s.productId);
        return `
          <tr>
            <td>${escapeHtml(String(s.date))}</td>
            <td>${escapeHtml(String(s.advisor))}</td>
            <td>${escapeHtml(p ? p.name : String(s.productId))}</td>
            <td>${escapeHtml(String(s.qty))}</td>
            <td>${escapeHtml(moneyCOP(s.total))}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderSales() {
    // fill selects
    fillSelect($("#sale-advisor"), DATA.advisors, (x) => x, (x) => x);
    fillSelect($("#sale-local"), DATA.locals, (x) => x, (x) => x);
    fillSelect(
      $("#sale-product"),
      DATA.products,
      (p) => p.id,
      (p) => `${p.name} · ${moneyCOP(p.price)}`
    );

    const dateEl = $("#sale-date");
    if (dateEl) dateEl.value = todayISO();

    // default total
    const productEl = $("#sale-product");
    const qtyEl = $("#sale-qty");
    const totalEl = $("#sale-total");
    const updateTotal = () => {
      const t = calcTotal(productEl?.value, qtyEl?.value);
      if (totalEl) totalEl.value = moneyCOP(t);
    };

    if (productEl) productEl.onchange = updateTotal;
    if (qtyEl) qtyEl.oninput = updateTotal;
    updateTotal();

    renderSalesTable();
  }

  // =========================
  // Eventos de formularios
  // =========================
  function seedDemoData() {
    const users = readUsers();
    if (users.length) return;
    writeUsers([
      { username: "admin", password: "admin12345", phone: "3000000000", createdAt: new Date().toISOString() },
      { username: "demo", password: "demo12345", phone: "3011111111", createdAt: new Date().toISOString() },
    ]);
  }

  function bindAuthForms() {
    const loginForm = $('[data-form="login"]');
    const regForm = $('[data-form="register"]');
    const recForm = $('[data-form="recover"]');

    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      showAlert("login", "error", "");

      const user = normalizeText(loginForm.user.value);
      const pass = String(loginForm.pass.value ?? "");
      const remember = !!loginForm.remember.checked;

      if (!user || !pass) {
        showAlert("login", "error", "Todos los campos son obligatorios.");
        return;
      }

      const users = readUsers();
      const found = users.find((u) => String(u.username).toLowerCase() === user.toLowerCase());
      if (!found || found.password !== pass) {
        showAlert("login", "error", "Usuario o contraseña incorrectos.");
        return;
      }

      setSession({ username: found.username, ts: Date.now() }, remember);
      location.hash = "dashboard";
    });

    regForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      showAlert("register", "error", "");
      showAlert("register", "success", "");

      const user = normalizeText(regForm.user.value);
      const pass = String(regForm.pass.value ?? "");
      const phone = normalizeText(regForm.phone.value);
      const terms = !!regForm.terms.checked;

      if (!user || !pass || !phone) {
        showAlert("register", "error", "Todos los campos son obligatorios.");
        return;
      }
      if (!minLen(pass, 8)) {
        showAlert("register", "error", "La contraseña debe tener mínimo 8 caracteres.");
        return;
      }
      if (!isPhone(phone)) {
        showAlert("register", "error", "El teléfono no tiene un formato válido.");
        return;
      }
      if (!terms) {
        showAlert("register", "error", "Debes aceptar los términos y condiciones.");
        return;
      }

      const users = readUsers();
      const exists = users.some((u) => String(u.username).toLowerCase() === user.toLowerCase());
      if (exists) {
        showAlert("register", "error", "Ese usuario ya existe. Elige otro.");
        return;
      }

      users.push({ username: user, password: pass, phone, createdAt: new Date().toISOString() });
      writeUsers(users);
      showAlert("register", "success", "Cuenta creada correctamente. Ya puedes iniciar sesión.");
      regForm.reset();
      setTimeout(() => (location.hash = "login"), 700);
    });

    recForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      showAlert("recover", "error", "");
      showAlert("recover", "success", "");

      const user = normalizeText(recForm.user.value);
      if (!user) {
        showAlert("recover", "error", "El usuario es obligatorio.");
        return;
      }

      const users = readUsers();
      const exists = users.some((u) => String(u.username).toLowerCase() === user.toLowerCase());
      if (!exists) {
        showAlert("recover", "error", "No encontramos ese usuario.");
        return;
      }

      showAlert("recover", "success", "Listo. Te enviamos instrucciones (simulado).");
      recForm.reset();
    });

    // Links internos auth (mostrar paneles sin recargar)
    $all("[data-auth-link]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const target = a.getAttribute("data-auth-link") || "login";
        location.hash = target;
      });
    });
  }

  function bindSalesForm() {
    const form = $('[data-form="sales"]');
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showAlert("sales", "error", "");
      showAlert("sales", "success", "");

      const session = getSession();
      if (!session) {
        location.hash = "login";
        return;
      }

      const advisor = normalizeText(form.advisor.value);
      const date = normalizeText(form.date.value);
      const local = normalizeText(form.local.value);
      const productId = normalizeText(form.product.value);
      const qty = Number(form.qty.value);

      if (!advisor || !date || !local || !productId) {
        showAlert("sales", "error", "Todos los campos son obligatorios.");
        return;
      }
      if (!DATA.advisors.includes(advisor)) {
        showAlert("sales", "error", "Asesor inválido.");
        return;
      }
      if (!DATA.locals.includes(local)) {
        showAlert("sales", "error", "Local inválido.");
        return;
      }
      if (!Number.isFinite(qty) || qty < 1) {
        showAlert("sales", "error", "La cantidad debe ser mayor o igual a 1.");
        return;
      }

      const product = findProductById(productId);
      if (!product) {
        showAlert("sales", "error", "El producto no existe en la lista válida.");
        return;
      }

      const total = calcTotal(productId, qty);
      const sale = {
        id: `sale-${Date.now()}`,
        advisor,
        date,
        local,
        productId,
        qty,
        total,
        createdBy: session.username,
        createdAt: new Date().toISOString(),
      };

      const sales = readSales();
      sales.unshift(sale);
      writeSales(sales);

      showAlert("sales", "success", "Venta registrada correctamente.");
      form.qty.value = "1";
      form.date.value = todayISO();

      renderSalesTable();
      renderDashboard();
    });
  }

  function bindGlobalNav() {
    $all("[data-nav]").forEach((el) => {
      el.addEventListener("click", (e) => {
        // allow hash navigation but keep consistent
        e.preventDefault();
        const target = el.getAttribute("data-nav") || "login";
        location.hash = target;
      });
    });

    const logoutBtn = $("[data-action=\"logout\"]");
    logoutBtn?.addEventListener("click", () => {
      clearSession();
      location.hash = "login";
    });
  }

  // =========================
  // Router (hash)
  // =========================
  const ROUTES = new Set(["login", "register", "recover", "dashboard", "sales"]);

  function routeFromHash() {
    const h = normalizeText(location.hash.replace("#", ""));
    return ROUTES.has(h) ? h : "login";
  }

  function handleRoute() {
    const route = routeFromHash();
    activateView(route);
  }

  // =========================
  // Init
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    seedDemoData();
    bindGlobalNav();
    bindAuthForms();
    bindSalesForm();

    // If already logged in, go dashboard; else login
    const session = getSession();
    const initial = routeFromHash();
    if (!session && (initial === "dashboard" || initial === "sales")) {
      location.hash = "login";
    } else if (session && (initial === "login" || initial === "register" || initial === "recover")) {
      location.hash = "dashboard";
    }

    window.addEventListener("hashchange", handleRoute);
    handleRoute();
  });
})();

