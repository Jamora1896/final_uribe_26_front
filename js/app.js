(() => {
  "use strict";

  const API = "http://127.0.0.1:8000";

  // =========================
  // Token JWT
  // =========================
  function getToken() {
    return localStorage.getItem("rifle.token") || sessionStorage.getItem("rifle.token");
  }

  function setToken(token, remember) {
    if (remember) {
      localStorage.setItem("rifle.token", token);
      sessionStorage.removeItem("rifle.token");
    } else {
      sessionStorage.setItem("rifle.token", token);
      localStorage.removeItem("rifle.token");
    }
  }

  function clearToken() {
    localStorage.removeItem("rifle.token");
    sessionStorage.removeItem("rifle.token");
  }

  function getSession() {
    return getToken() ? { token: getToken() } : null;
  }

  // =========================
  // Fetch helpers
  // =========================
  async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(err.detail || "Error en la solicitud");
    }
    return res.status === 204 ? null : res.json();
  }

  async function apiLogin(username, password) {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
      throw new Error(err.detail || "Credenciales incorrectas");
    }
    return res.json();
  }

  // =========================
  // Helpers UI
  // =========================
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function normalizeText(v) { return String(v ?? "").trim(); }
  function minLen(v, n) { return String(v ?? "").length >= n; }
  function isPhone(v) { return /^[0-9+\s()-]{7,20}$/.test(normalizeText(v)); }

  function moneyCOP(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "$0";
    return n.toLocaleString("es-CO", { style: "currency", currency: "COP" });
  }

  function todayISO() { return new Date().toISOString().slice(0, 10); }

  function escapeHtml(v) {
    return String(v)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function setHidden(el, hidden) { if (el) el.classList.toggle("is-hidden", !!hidden); }

  function showAlert(key, type, text) {
    const errorEl = document.querySelector(`[data-msg="${key}"]`);
    const okEl = document.querySelector(`[data-ok="${key}"]`);
    if (type === "error") {
      if (okEl) setHidden(okEl, true);
      if (errorEl) { errorEl.textContent = text || ""; setHidden(errorEl, !text); }
    } else if (type === "success") {
      if (errorEl) setHidden(errorEl, true);
      if (okEl) { okEl.textContent = text || ""; setHidden(okEl, !text); }
    }
  }

  function setHeaderAuthState(isAuthed) {
    $all('[data-nav="dashboard"], [data-nav="sales"], [data-action="logout"]')
      .forEach((el) => setHidden(el, !isAuthed));
  }

  // =========================
  // Vistas
  // =========================
  function activateView(viewName) {
    const views = {
      login: $("#view-auth"),
      dashboard: $("#view-dashboard"),
      sales: $("#view-sales"),
    };

    const wantAuth = ["login", "register", "recover"].includes(viewName);
    const session = getSession();

    setHeaderAuthState(!!session);

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

    if (!session) { location.hash = "login"; return; }

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
    } else if (panel === "recover") {
      badge.textContent = "Recuperación";
      title.textContent = "Recupera el acceso.";
    } else {
      badge.textContent = "Bienvenido a RIFLE";
      title.textContent = "Donde cada prenda define tu estilo y cada detalle cuenta.";
    }

    showAlert("login", "error", "");
    showAlert("register", "error", "");
    showAlert("register", "success", "");
    showAlert("recover", "error", "");
    showAlert("recover", "success", "");
  }

  // =========================
  // Dashboard
  // =========================
  async function renderDashboard() {
    try {
      const m = await apiFetch("/dashboard");
      const todayEl = $('[data-metric="today"]');
      const countEl = $('[data-metric="count"]');
      const topEl = $('[data-metric="top"]');
      if (todayEl) todayEl.textContent = moneyCOP(m.today_total);
      if (countEl) countEl.textContent = String(m.today_count);
      if (topEl) topEl.textContent = m.top_product || "-";
    } catch (err) {
      console.error("Error cargando dashboard:", err);
    }
  }

  // =========================
  // Ventas
  // =========================
  function fillSelect(selectEl, items, getValue, getLabel) {
    if (!selectEl) return;
    selectEl.innerHTML = items
      .map((it) => `<option value="${escapeHtml(String(getValue(it)))}">
        ${escapeHtml(getLabel(it))}</option>`)
      .join("");
  }

  async function renderSalesTable() {
    const tbody = $("[data-sales-table]");
    if (!tbody) return;
    try {
      const sales = await apiFetch("/sales?limit=10");
      if (!sales.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="muted">Aún no hay ventas registradas.</td></tr>`;
        return;
      }
      tbody.innerHTML = sales.map((s) => `
        <tr>
          <td>${escapeHtml(String(s.date))}</td>
          <td>${escapeHtml(s.advisor.name)}</td>
          <td>${escapeHtml(s.product.name)}</td>
          <td>${escapeHtml(String(s.qty))}</td>
          <td>${escapeHtml(moneyCOP(s.total))}</td>
        </tr>`).join("");
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Error cargando ventas.</td></tr>`;
    }
  }

  async function renderSales() {
    try {
      const [advisors, locals, products] = await Promise.all([
        apiFetch("/advisors"),
        apiFetch("/locals"),
        apiFetch("/products"),
      ]);

      fillSelect($("#sale-advisor"), advisors, (a) => a.id, (a) => a.name);
      fillSelect($("#sale-local"), locals, (l) => l.id, (l) => l.name);
      fillSelect($("#sale-product"), products, (p) => p.id,
        (p) => `${p.name} · ${moneyCOP(p.price)}`);

      const dateEl = $("#sale-date");
      if (dateEl) dateEl.value = todayISO();

      const productEl = $("#sale-product");
      const qtyEl = $("#sale-qty");
      const totalEl = $("#sale-total");

      const updateTotal = () => {
        const p = products.find((x) => String(x.id) === String(productEl?.value));
        const qty = Number(qtyEl?.value) || 0;
        if (totalEl) totalEl.value = p ? moneyCOP(p.price * qty) : "$0";
      };

      if (productEl) productEl.onchange = updateTotal;
      if (qtyEl) qtyEl.oninput = updateTotal;
      updateTotal();

    } catch (err) {
      console.error("Error cargando catálogos:", err);
    }

    await renderSalesTable();
  }

  // =========================
  // Formularios
  // =========================
  function bindAuthForms() {
    const loginForm = $('[data-form="login"]');
    const regForm = $('[data-form="register"]');
    const recForm = $('[data-form="recover"]');

    loginForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      showAlert("login", "error", "");
      const user = normalizeText(loginForm.user.value);
      const pass = String(loginForm.pass.value ?? "");
      const remember = !!loginForm.remember.checked;

      if (!user || !pass) {
        showAlert("login", "error", "Todos los campos son obligatorios.");
        return;
      }

      try {
        const data = await apiLogin(user, pass);
        setToken(data.access_token, remember);
        location.hash = "dashboard";
      } catch (err) {
        showAlert("login", "error", err.message);
      }
    });

    regForm?.addEventListener("submit", async (e) => {
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

      try {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ username: user, password: pass, phone }),
        });
        showAlert("register", "success", "Cuenta creada correctamente. Ya puedes iniciar sesión.");
        regForm.reset();
        setTimeout(() => (location.hash = "login"), 700);
      } catch (err) {
        showAlert("register", "error", err.message);
      }
    });

    recForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      showAlert("recover", "error", "");
      showAlert("recover", "success", "");
      const user = normalizeText(recForm.user.value);
      if (!user) {
        showAlert("recover", "error", "El usuario es obligatorio.");
        return;
      }
      // Simulado — el backend no tiene endpoint de recuperación real
      showAlert("recover", "success", "Listo. Te enviamos instrucciones (simulado).");
      recForm.reset();
    });

    $all("[data-auth-link]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = a.getAttribute("data-auth-link") || "login";
      });
    });
  }

  function bindSalesForm() {
    const form = $('[data-form="sales"]');
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showAlert("sales", "error", "");
      showAlert("sales", "success", "");

      if (!getSession()) { location.hash = "login"; return; }

      const advisor_id = Number(form.advisor.value);
      const date = normalizeText(form.date.value);
      const local_id = Number(form.local.value);
      const product_id = Number(form.product.value);
      const qty = Number(form.qty.value);

      if (!advisor_id || !date || !local_id || !product_id) {
        showAlert("sales", "error", "Todos los campos son obligatorios.");
        return;
      }
      if (!Number.isFinite(qty) || qty < 1) {
        showAlert("sales", "error", "La cantidad debe ser mayor o igual a 1.");
        return;
      }

      try {
        await apiFetch("/sales", {
          method: "POST",
          body: JSON.stringify({ date, advisor_id, local_id, product_id, qty }),
        });
        showAlert("sales", "success", "Venta registrada correctamente.");
        form.qty.value = "1";
        form.date.value = todayISO();
        await renderSalesTable();
        await renderDashboard();
      } catch (err) {
        showAlert("sales", "error", err.message);
      }
    });
  }

  function bindGlobalNav() {
    $all("[data-nav]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = el.getAttribute("data-nav") || "login";
      });
    });

    $("[data-action=\"logout\"]")?.addEventListener("click", () => {
      clearToken();
      location.hash = "login";
    });
  }

  // =========================
  // Router
  // =========================
  const ROUTES = new Set(["login", "register", "recover", "dashboard", "sales"]);

  function routeFromHash() {
    const h = normalizeText(location.hash.replace("#", ""));
    return ROUTES.has(h) ? h : "login";
  }

  function handleRoute() { activateView(routeFromHash()); }

  // =========================
  // Init
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    bindGlobalNav();
    bindAuthForms();
    bindSalesForm();

    const session = getSession();
    const initial = routeFromHash();
    if (!session && ["dashboard", "sales"].includes(initial)) {
      location.hash = "login";
    } else if (session && ["login", "register", "recover"].includes(initial)) {
      location.hash = "dashboard";
    }

    window.addEventListener("hashchange", handleRoute);
    handleRoute();
  });
})();
