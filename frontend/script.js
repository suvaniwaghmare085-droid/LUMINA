const API = "http://127.0.0.1:5000/api";
let currentType = "text";
const input = document.getElementById("user-input");
const analyzeBtn = document.getElementById("analyze-btn");
const resultBox = document.getElementById("result");
const apiDot = document.getElementById("api-dot");
const apiLabel = document.getElementById("api-label");

async function checkHealth() {
  try {
    const response = await fetch(`${API}/health`);
    if (!response.ok) throw new Error("offline");
    apiDot.classList.add("online"); apiLabel.textContent = "Analysis engine online";
  } catch (_) {
    apiDot.classList.remove("online"); apiLabel.textContent = "Backend offline — start Flask";
  }
}
function setType(type) {
  currentType = type;
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.type === type));
  document.getElementById("input-label").textContent = type === "url" ? "WEBSITE ADDRESS" : "MESSAGE CONTENT";
  input.placeholder = type === "url" ? "Paste a website address, e.g. http://example.test/login" : "Paste a suspicious SMS, email or message here…";
}
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => setType(b.dataset.type)));
document.querySelectorAll(".nav-item").forEach(b => b.addEventListener("click", () => {
  const history = b.dataset.view === "history";
  document.getElementById("scanner-view").classList.toggle("hidden", history);
  document.getElementById("history-view").classList.toggle("hidden", !history);
  document.getElementById("page-title").textContent = history ? "Scan history" : "Threat scanner";
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n === b));
  if (history) loadHistory();
}));
input.addEventListener("input", () => document.getElementById("char-count").textContent = `${input.value.length.toLocaleString()} / 10,000`);
document.getElementById("clear-input").addEventListener("click", () => { input.value = ""; input.dispatchEvent(new Event("input")); resultBox.classList.add("hidden"); });
document.querySelectorAll("[data-sample]").forEach(b => b.addEventListener("click", () => {
  if (b.dataset.sample === "scam") { setType("text"); input.value = "URGENT! Congratulations, you won ₹50,000. Click http://claim-prize-example.test/claim now and enter your OTP to receive your reward."; }
  else { setType("text"); input.value = "Your order has been shipped. You can track its status in the official shopping application. Thank you for your purchase."; }
  input.dispatchEvent(new Event("input"));
}));
function showError(message) {
  resultBox.classList.remove("hidden");
  resultBox.innerHTML = `<p class="risk-high">${escapeHtml(message)}</p>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderResult(data) {
  const levelClass = data.risk_level === "HIGH RISK" ? "risk-high" : data.risk_level === "SUSPICIOUS" ? "risk-suspicious" : "risk-safe";
  const width = Math.max(2, data.risk_score);
  resultBox.innerHTML = `
    <div class="result-top"><div><h3 class="${levelClass}">${escapeHtml(data.risk_level)}</h3><p>Analysis complete · ${escapeHtml(data.input_type)} scan · Reference #${data.scan_id}</p></div><div class="score ${levelClass}">${data.risk_score}<small> / 100</small></div></div>
    <div class="risk-bar"><div class="risk-fill" style="width:${width}%;background:${data.risk_score>=70?'#ff7585':data.risk_score>=35?'#f4c66b':'#62d7ad'}"></div></div>
    <div class="reasons-title">WHY LUMINA FLAGGED THIS</div>
    ${data.reasons.map(r => `<div class="reason">${escapeHtml(r)}</div>`).join("")}
    <p class="disclaimer">${escapeHtml(data.disclaimer)}</p>`;
  resultBox.classList.remove("hidden");
}
analyzeBtn.addEventListener("click", async () => {
  const value = input.value.trim();
  if (!value) return showError("Enter a message or URL before analyzing.");
  analyzeBtn.disabled = true; analyzeBtn.textContent = "Analyzing…";
  try {
    const response = await fetch(`${API}/analyze`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({input:value,type:currentType})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");
    renderResult(data);
  } catch (err) {
    showError(err.message.includes("Failed to fetch") ? "Cannot reach the backend. Start Flask using the instructions in README.md." : err.message);
  } finally { analyzeBtn.disabled = false; analyzeBtn.innerHTML = 'Analyze with LUMINA <span>→</span>'; }
});
async function loadHistory() {
  const target = document.getElementById("history-list");
  target.innerHTML = '<div class="history-row">Loading history…</div>';
  try {
    const response = await fetch(`${API}/history`); const data = await response.json();
    if (!data.history.length) { target.innerHTML = '<div class="history-row">No scans yet. Your completed analyses will appear here.</div>'; return; }
    target.innerHTML = data.history.map(row => `<div class="history-row"><div><strong>${escapeHtml(row.risk_level)} · ${escapeHtml(row.input_type.toUpperCase())}</strong><p>${escapeHtml(row.input_text.slice(0,180))}</p><p>${new Date(row.created_at).toLocaleString()}</p></div><div class="score">${row.risk_score}<small> / 100</small></div></div>`).join("");
  } catch (_) { target.innerHTML = '<div class="history-row">Unable to load history. Is the backend running?</div>'; }
}
document.getElementById("clear-history").addEventListener("click", async () => {
  if (!confirm("Delete all saved scan history?")) return;
  await fetch(`${API}/history`, {method:"DELETE"}); loadHistory();
});
checkHealth(); setInterval(checkHealth, 10000);
