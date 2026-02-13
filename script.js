(function () {
  // ================== SUPABASE ==================
  const SUPABASE_URL = "https://qftffjgdoicyswgdtpld.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dg5HKUTmMIhd2Glc8hVyaw_NEzRjFRo";

  const { createClient } = window.supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ================== HELPERS ==================
  function $(id) {
    return document.getElementById(id);
  }

  // ================== TELAS ==================
  const loginScreen = $("loginScreen");
  const registerScreen = $("registerScreen");
  const appScreen = $("appScreen");

  const mainHome = $("mainHome");
  const accountScreen = $("accountScreen");
  const planScreen = $("planScreen");
  const notificationsScreen = $("notificationsScreen");

  const loginEmail = $("loginEmail");
  const loginPassword = $("loginPassword");
  const loginBtn = $("loginBtn");
  const goToRegister = $("goToRegister");

  const registerEmail = $("registerEmail");
  const registerPassword = $("registerPassword");
  const registerPasswordConfirm = $("registerPasswordConfirm");
  const registerBtn = $("registerBtn");
  const goToLogin = $("goToLogin");

  const menuBtn = $("menuBtn");
  const sideMenu = $("sideMenu");
  const logoutBtn = $("logoutBtn");

  const menuHome = $("menuHome");
  const menuAccount = $("menuAccount");
  const menuPlan = $("menuPlan");
  const menuNotifications = $("menuNotifications");

  const micBtn = $("micBtn");
  const statusEl = $("status");
  const confirmArea = $("confirmArea");
  const reminderList = $("reminderList");

  // ================== AUTH ==================
  async function logout() {
    await sb.auth.signOut();
    showLoginScreen();
  }

  // ================== TELAS ==================
  function showLoginScreen() {
    loginScreen.classList.remove("hidden");
    registerScreen.classList.add("hidden");
    appScreen.classList.add("hidden");
    if (sideMenu) sideMenu.classList.add("hidden");
  }

  function showRegisterScreen() {
    loginScreen.classList.add("hidden");
    registerScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
    if (sideMenu) sideMenu.classList.add("hidden");
  }

  function showAppScreen() {
    loginScreen.classList.add("hidden");
    registerScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    if (sideMenu) sideMenu.classList.add("hidden");
    showHome();
  }

  function hideAllInternal() {
    if (mainHome) mainHome.classList.add("hidden");
    if (accountScreen) accountScreen.classList.add("hidden");
    if (planScreen) planScreen.classList.add("hidden");
    if (notificationsScreen) notificationsScreen.classList.add("hidden");
  }

  function showHome() {
    hideAllInternal();
    if (mainHome) mainHome.classList.remove("hidden");
  }

  function showAccount() {
    hideAllInternal();
    if (accountScreen) accountScreen.classList.remove("hidden");
  }

  function showPlan() {
    hideAllInternal();
    if (planScreen) planScreen.classList.remove("hidden");
  }

  function showNotifications() {
    hideAllInternal();
    if (notificationsScreen) notificationsScreen.classList.remove("hidden");
  }

  // ================== PASSWORD ==================
  window.togglePassword = function (id) {
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  };

  // ================== AUTH EVENTS ==================
  goToRegister.onclick = (e) => {
    e.preventDefault();
    showRegisterScreen();
  };

  goToLogin.onclick = (e) => {
    e.preventDefault();
    showLoginScreen();
  };

  loginBtn.onclick = async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Erro ao entrar: " + error.message);
      return;
    }

    initApp();
  };

  registerBtn.onclick = async () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirm = registerPasswordConfirm.value;

    if (!email || !password || !confirm) {
      alert("Preencha todos os campos.");
      return;
    }

    if (password !== confirm) {
      alert("As senhas não coincidem.");
      return;
    }

    const { data, error } = await sb.auth.signUp({ email, password });

    if (error) {
      alert("Erro ao criar conta: " + error.message);
      return;
    }

    if (data.user) {
      await sb.from("profiles").insert({
        id: data.user.id,
        email: email,
        is_premium: false
      });
    }

    alert("Conta criada com sucesso! Faça login.");
    showLoginScreen();
  };

  // ================== MENU ==================
  menuBtn.onclick = () => sideMenu.classList.toggle("hidden");
  logoutBtn.onclick = () => logout();

  menuHome.onclick = () => {
    showHome();
    sideMenu.classList.add("hidden");
  };
  menuAccount.onclick = () => {
    showAccount();
    sideMenu.classList.add("hidden");
  };
  menuPlan.onclick = () => {
    showPlan();
    sideMenu.classList.add("hidden");
  };
  menuNotifications.onclick = () => {
    showNotifications();
    sideMenu.classList.add("hidden");
  };

  // ================== LEMBRETES ==================
  let reminders = [];

  async function loadReminders() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data, error } = await sb
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("datetime", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    reminders = data.map(r => ({
      id: r.id,
      text: r.text,
      time: new Date(r.datetime).getTime()
    }));

    renderList();
  }

  async function addReminder(text, date) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { error } = await sb.from("reminders").insert({
      user_id: user.id,
      text: text,
      datetime: date.toISOString()
    });

    if (error) {
      alert("Erro ao salvar lembrete");
      return;
    }

    loadReminders();
  }

  // ================== LISTA ==================
  function renderList() {
    reminderList.innerHTML = "";
    reminders.forEach(rem => {
      const card = document.createElement("div");
      card.className = "card";
      const date = new Date(rem.time);

      card.innerHTML = `
        <h3>${date.toLocaleString("pt-BR")}</h3>
        <p>${rem.text}</p>
      `;
      reminderList.appendChild(card);
    });
  }

  // ================== INIT ==================
  async function initApp() {
    showAppScreen();
    loadReminders();
  }

  (async () => {
    const { data: { user } } = await sb.auth.getUser();
    if (user) initApp();
    else showLoginScreen();
  })();

})();

