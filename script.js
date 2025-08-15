const firebaseConfig = {
  apiKey: "AIzaSyBQMuv-e_IUHlF_7Yy7Ww1ho-ugvZXB0gg",
  authDomain: "eplq-ac071.firebaseapp.com",
  projectId: "eplq-ac071",
  storageBucket: "eplq-ac071.firebasestorage.app",
  messagingSenderId: "81470403543",
  appId: "1:81470403543:web:236482df1b3b20569c9192",
  measurementId: "G-FFMR0CY1X7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

const secretKey = "mySecretKey123";
let currentUser = null;

let currentTheme = localStorage.getItem("theme") || "light";
document.body.classList.add(currentTheme);
updateThemeStyles();

function setBusy(id, busy) {
  const el = document.getElementById(id);
  if (!el) return;
  el.disabled = !!busy;
}

function logAction(message, category = "INFO", meta = {}) {
  const payload = {
    uid: currentUser ? currentUser.uid : null,
    email: currentUser ? currentUser.email : null,
    message,
    category,
    meta,
    ts: firebase.firestore.FieldValue.serverTimestamp()
  };
  console.log(`[${category}] ${new Date().toISOString()}: ${message}`, meta);
  try { db.collection("logs").add(payload); } catch(e) {}
}

function showLoading(section, show) {
  const loader = document.getElementById(`${section}-loading`);
  if (loader) loader.style.display = show ? "block" : "none";
}

function validateInput(id) {
  const input = document.getElementById(id);
  return input && input.value.trim() !== "";
}

function showSection(section) {
  ["home-section", "auth-section", "admin-section", "user-section"].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = "none";
  });
  const target = document.getElementById(`${section}-section`);
  if (target) target.style.display = "block";
}

async function register() {
  if (!validateInput("reg-email") || !validateInput("reg-password")) {
    alert("Please fill all fields.");
    return;
  }
  setBusy("registerBtn", true);
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;
  try {
    showLoading("admin", true);
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(cred.user.uid).set({ role });
    analytics.logEvent("user_registered", { role });
    logAction("User registered", "INFO", { role, email });
    alert("Registered successfully!");
  } catch (error) {
    logAction("Registration error", "ERROR", { error: error.message });
    alert(error.message);
  } finally {
    showLoading("admin", false);
    setBusy("registerBtn", false);
  }
}

async function login() {
  if (!validateInput("login-email") || !validateInput("login-password")) {
    alert("Please fill all fields.");
    return;
  }
  setBusy("loginBtn", true);
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    showLoading("admin", true);
    const cred = await auth.signInWithEmailAndPassword(email, password);
    analytics.logEvent("user_login");
    logAction("User logged in", "INFO", { email });
    await handleLogin(cred.user.uid);
  } catch (error) {
    logAction("Login error", "ERROR", { error: error.message });
    alert(error.message);
  } finally {
    showLoading("admin", false);
    setBusy("loginBtn", false);
  }
}

async function forgotPassword() {
  const email = document.getElementById("login-email").value.trim();
  if (!email) {
    alert("Enter your email in the login email field first.");
    return;
  }
  setBusy("forgotBtn", true);
  try {
    await auth.sendPasswordResetEmail(email);
    analytics.logEvent("password_reset_requested");
    logAction("Password reset email sent", "INFO", { email });
    alert("Password reset email sent. Check your inbox.");
  } catch (error) {
    logAction("Forgot password error", "ERROR", { error: error.message });
    alert(error.message);
  } finally {
    setBusy("forgotBtn", false);
  }
}

async function handleLogin(uid) {
  try {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) throw new Error("User not found");
    const role = snap.data().role;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("navbar").style.display = "block";
    document.getElementById("admin-nav").style.display = role === "admin" ? "block" : "none";
    document.getElementById("user-nav").style.display = role !== "admin" ? "block" : "none";
    showSection("home");
    logAction("Role applied", "INFO", { role });
  } catch (error) {
    logAction("Handle login error", "ERROR", { error: error.message });
    alert(error.message);
  }
}

async function logout() {
  try {
    await auth.signOut();
    analytics.logEvent("user_logout");
    logAction("User logged out", "INFO", {});
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("navbar").style.display = "none";
    document.getElementById("admin-nav").style.display = "none";
    document.getElementById("user-nav").style.display = "none";
    document.getElementById("results").innerHTML = "";
    showSection("auth");
  } catch (error) {
    logAction("Logout error", "ERROR", { error: error.message });
    alert(error.message);
  }
}

async function uploadPOI() {
  if (!validateInput("poi-name") || !validateInput("poi-x") || !validateInput("poi-y")) {
    alert("Please fill all fields.");
    return;
  }
  setBusy("uploadBtn", true);
  const name = document.getElementById("poi-name").value;
  const x = parseFloat(document.getElementById("poi-x").value);
  const y = parseFloat(document.getElementById("poi-y").value);
  const poiData = { name, x, y };
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(poiData), secretKey).toString();
  try {
    showLoading("admin", true);
    await db.collection("pois").add({ encrypted });
    analytics.logEvent("poi_uploaded");
    logAction("POI uploaded", "INFO", { name, x, y });
    alert("POI uploaded successfully!");
    document.getElementById("poi-name").value = "";
    document.getElementById("poi-x").value = "";
    document.getElementById("poi-y").value = "";
  } catch (error) {
    if (error.code === "permission-denied") {
      alert("Permission denied: Only admins can upload POIs.");
      logAction("Upload blocked - not admin", "ERROR", {});
    } else {
      alert(error.message);
      logAction("Upload error", "ERROR", { error: error.message });
    }
  } finally {
    showLoading("admin", false);
    setBusy("uploadBtn", false);
  }
}

async function searchPOIs() {
  if (!validateInput("query-x") || !validateInput("query-y") || !validateInput("query-radius")) {
    alert("Please fill all fields.");
    return;
  }
  setBusy("searchBtn", true);
  const qx = parseFloat(document.getElementById("query-x").value);
  const qy = parseFloat(document.getElementById("query-y").value);
  const radius = parseFloat(document.getElementById("query-radius").value);
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  try {
    showLoading("user", true);
    const snapshot = await db.collection("pois").get();
    const matches = [];
    snapshot.forEach(doc => {
      const encrypted = doc.data().encrypted;
      const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
      if (decrypted) {
        const poi = JSON.parse(decrypted);
        const dx = poi.x - qx;
        const dy = poi.y - qy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) matches.push(poi);
      }
    });
    analytics.logEvent("poi_search", { results: matches.length });
    logAction("POI search", "INFO", { qx, qy, radius, results: matches.length });
    if (matches.length > 0) {
      resultsDiv.innerHTML = matches.map(p => `<div class="result-item">${p.name} <span class="muted">(${p.x}, ${p.y})</span></div>`).join("");
    } else {
      resultsDiv.innerHTML = '<p class="muted">No POIs found within radius.</p>';
    }
  } catch (error) {
    logAction("Search error", "ERROR", { error: error.message });
    alert(error.message);
  } finally {
    showLoading("user", false);
    setBusy("searchBtn", false);
  }
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.body.classList.remove("light", "dark");
  document.body.classList.add(currentTheme);
  localStorage.setItem("theme", currentTheme);
  updateThemeStyles();
  logAction("Theme toggled", "INFO", { theme: currentTheme });
}

function updateThemeStyles() {
  const btn = document.getElementById("themeToggleButton");
  if (btn) btn.textContent = document.body.classList.contains("dark") ? "🌞" : "🌙";
  const inputs = document.querySelectorAll("input, select, button");
  inputs.forEach(el => { el.style.transition = "background-color 0.3s, color 0.3s, border-color 0.3s"; });
}

auth.onAuthStateChanged(user => {
  currentUser = user || null;
  if (user) {
    handleLogin(user.uid);
  } else {
    showSection("auth");
  }
});

showSection("home");
