const savedClock = readLocal("xunnian-phone.clock.v1", {});
let clockAlarms = CLOCK_CONTENT.alarms.map((alarm) => ({ ...alarm, label: { ...alarm.label } }));
if (Array.isArray(savedClock?.alarms)) clockAlarms = savedClock.alarms.filter((alarm) => alarm && typeof alarm.id === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(alarm.time) && alarm.label && typeof alarm.label.ko === "string").map((alarm) => ({ ...alarm, enabled: !!alarm.enabled }));
let clockState = { tab: "alarms", edit: false, editor: "" };
const clockStopwatch = { started: 0, elapsed: 0 };
const clockTimer = { seconds: 300, remaining: 300, end: 0, finished: false };

function saveClock() { saveLocal("xunnian-phone.clock.v1", { alarms: clockAlarms }); }
function clockDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor(total / 60) % 60).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function clockRepeat(value) { return { once: "한 번", daily: "매일", weekdays: "평일" }[value] || "한 번"; }
function clockNavIcon(id) {
  const paths = {
    world: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
    alarms: '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M3 5l3-3m12 0 3 3M6 21l-1 2m13-2 1 2"/>',
    stopwatch: '<circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m0 3v5l3 2m3-10 2-2"/>',
    timer: '<circle cx="12" cy="13" r="9"/><path d="M12 4v9l4 3M9 1h6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]}</svg>`;
}

function renderClock(tab = "alarms", keep = false) {
  if (!keep) clockState = { tab, edit: false, editor: "" };
  appTitle.textContent = "시계";
  appBack.innerHTML = clockState.editor ? '‹ <span>알람</span>' : '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", clockState.editor ? "알람 목록으로" : "返回主屏幕");
  setAppActions(clockState.tab === "alarms" && !clockState.editor ? '<button class="clock-add" type="button" data-clock-add aria-label="알람 추가">＋</button>' : "");
  let body;
  if (clockState.editor) {
    const alarm = clockAlarms.find((item) => item.id === clockState.editor);
    body = `<form class="clock-alarm-editor" id="clock-alarm-form"><h2>${alarm ? "알람 편집" : "알람 추가"}</h2><input type="time" name="time" required value="${alarm?.time || "07:00"}" aria-label="알람 시간"><label>레이블<input name="label" required maxlength="80" value="${escapeText(alarm?.label.ko || "알람")}" aria-label="알람 이름"></label><label>반복<select name="repeat" aria-label="알람 반복">${["once", "daily", "weekdays"].map((value) => `<option value="${value}"${(alarm?.repeat || "once") === value ? " selected" : ""}>${clockRepeat(value)}</option>`).join("")}</select></label><div class="clock-editor-actions"><button type="button" data-clock-cancel>취소</button><button type="submit">저장</button></div></form>`;
  } else if (clockState.tab === "alarms") body = `<div class="clock-title-row"><h2>알람</h2><button type="button" data-clock-edit>${clockState.edit ? "완료" : "편집"}</button></div><section class="clock-alarm-list">${[...clockAlarms].sort((a, b) => a.time.localeCompare(b.time)).map((alarm) => `<article class="clock-alarm-row${alarm.enabled ? " is-enabled" : ""}">${clockState.edit ? `<button type="button" class="clock-delete" data-clock-delete="${alarm.id}" aria-label="${alarm.time} 알람 삭제">−</button>` : ""}<button type="button" class="clock-alarm-info" data-clock-alarm="${alarm.id}" aria-label="${alarm.time} ${escapeText(alarm.label.ko)} 편집"><time>${alarm.time.replace(/^0/, "")}</time><span class="clock-alarm-label">${renderBilingual(alarm.label, { interactive: false })}</span><small>${clockRepeat(alarm.repeat)}</small></button><input type="checkbox" class="clock-switch" data-clock-toggle="${alarm.id}" aria-label="${alarm.time} 알람 켜기"${alarm.enabled ? " checked" : ""}></article>`).join("") || '<p class="clock-empty">알람 없음</p>'}</section>`;
  else if (clockState.tab === "world") body = `<div class="clock-title-row"><h2>세계 시계</h2></div>${[["서울", "Asia/Seoul"], ["로스앤젤레스", "America/Los_Angeles"], ["런던", "Europe/London"]].map(([city, zone]) => `<div class="clock-world-row"><strong>${city}</strong><time data-clock-zone="${zone}"></time></div>`).join("")}`;
  else if (clockState.tab === "stopwatch") body = `<div class="clock-title-row"><h2>스톱워치</h2></div><div class="clock-counter" data-clock-stopwatch></div><div class="clock-round-actions"><button type="button" data-clock-stopwatch-reset>재설정</button><button type="button" class="${clockStopwatch.started ? "is-stop" : "is-start"}" data-clock-stopwatch-toggle>${clockStopwatch.started ? "중단" : "시작"}</button></div>`;
  else body = `<div class="clock-title-row"><h2>타이머</h2></div><div class="clock-counter" data-clock-timer></div><label class="clock-timer-setting">시간 <input type="number" min="1" max="1440" value="${Math.max(1, Math.ceil(clockTimer.seconds / 60))}" aria-label="타이머 분"${clockTimer.end ? " disabled" : ""}> 분</label><p class="clock-timer-status" role="status">${clockTimer.finished ? "타이머 종료" : ""}</p><div class="clock-round-actions"><button type="button" data-clock-timer-reset>취소</button><button type="button" class="${clockTimer.end ? "is-stop" : "is-start"}" data-clock-timer-toggle>${clockTimer.end ? "일시 정지" : "시작"}</button></div>`;
  appContent.innerHTML = `<div class="clock-shell"><div class="clock-scroll">${body}</div>${clockState.editor ? "" : `<nav class="clock-nav" aria-label="시계 탭">${[["world", "세계 시계", "◎"], ["alarms", "알람", "◷"], ["stopwatch", "스톱워치", "◴"], ["timer", "타이머", "◵"]].map(([id, label]) => `<button type="button" data-clock-tab="${id}" aria-label="${label}"${clockState.tab === id ? ' aria-current="page"' : ""}>${clockNavIcon(id)}${label}</button>`).join("")}</nav>`}</div>`;
  updateClockApp();
}

function clockGoBack() {
  if (!clockState.editor) return false;
  clockState.editor = "";
  renderClock("alarms", true);
  return true;
}

function updateClockApp() {
  const now = Date.now();
  if (clockTimer.end && now >= clockTimer.end) {
    clockTimer.end = 0; clockTimer.remaining = 0; clockTimer.finished = true;
    if (activeApp === "clock" && clockState.tab === "timer") renderClock("timer", true);
  }
  if (activeApp !== "clock") return;
  appContent.querySelectorAll("[data-clock-zone]").forEach((node) => { node.textContent = new Intl.DateTimeFormat("ko-KR", { timeZone: node.dataset.clockZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now); });
  const stopwatch = appContent.querySelector("[data-clock-stopwatch]");
  if (stopwatch) stopwatch.textContent = clockDuration((clockStopwatch.elapsed + (clockStopwatch.started ? now - clockStopwatch.started : 0)) / 1000);
  const timer = appContent.querySelector("[data-clock-timer]");
  if (timer) timer.textContent = clockDuration(clockTimer.end ? Math.ceil((clockTimer.end - now) / 1000) : clockTimer.remaining);
}
setInterval(updateClockApp, 250);

appContent.addEventListener("click", (event) => {
  if (activeApp !== "clock") return;
  const data = event.target.closest("button")?.dataset;
  if (!data) return;
  if ("clockTab" in data) return renderClock(data.clockTab);
  if ("clockAdd" in data) clockState.editor = "new";
  else if ("clockAlarm" in data) clockState.editor = data.clockAlarm;
  else if ("clockCancel" in data) clockState.editor = "";
  else if ("clockEdit" in data) clockState.edit = !clockState.edit;
  else if ("clockDelete" in data) { clockAlarms = clockAlarms.filter((alarm) => alarm.id !== data.clockDelete); saveClock(); }
  else if ("clockStopwatchToggle" in data) {
    if (clockStopwatch.started) { clockStopwatch.elapsed += Date.now() - clockStopwatch.started; clockStopwatch.started = 0; }
    else clockStopwatch.started = Date.now();
  } else if ("clockStopwatchReset" in data) { clockStopwatch.elapsed = 0; clockStopwatch.started = 0; }
  else if ("clockTimerToggle" in data) {
    if (clockTimer.end) { clockTimer.remaining = Math.max(0, Math.ceil((clockTimer.end - Date.now()) / 1000)); clockTimer.end = 0; }
    else { clockTimer.finished = false; if (!clockTimer.remaining) clockTimer.remaining = clockTimer.seconds; clockTimer.end = Date.now() + clockTimer.remaining * 1000; }
  } else if ("clockTimerReset" in data) { clockTimer.end = 0; clockTimer.remaining = clockTimer.seconds; clockTimer.finished = false; }
  else return;
  renderClock(clockState.tab, true);
});
appActions.addEventListener("click", (event) => {
  if (activeApp !== "clock" || !event.target.closest("[data-clock-add]")) return;
  clockState.editor = "new"; renderClock("alarms", true);
});
appContent.addEventListener("change", (event) => {
  if (activeApp !== "clock") return;
  if (event.target.dataset.clockToggle) {
    const alarm = clockAlarms.find((item) => item.id === event.target.dataset.clockToggle);
    if (alarm) { alarm.enabled = event.target.checked; saveClock(); event.target.closest(".clock-alarm-row").classList.toggle("is-enabled", alarm.enabled); }
  } else if (event.target.matches('[aria-label="타이머 분"]') && !clockTimer.end) {
    const minutes = Math.max(1, Math.min(1440, Number(event.target.value) || 1));
    clockTimer.seconds = minutes * 60; clockTimer.remaining = clockTimer.seconds; clockTimer.finished = false;
    event.target.value = String(minutes);
    updateClockApp();
  }
});
appContent.addEventListener("input", (event) => {
  if (activeApp !== "clock" || clockTimer.end || !event.target.matches('[aria-label="타이머 분"]')) return;
  const minutes = Math.max(1, Math.min(1440, Number(event.target.value) || 1));
  clockTimer.seconds = minutes * 60; clockTimer.remaining = clockTimer.seconds; clockTimer.finished = false;
  const status = appContent.querySelector(".clock-timer-status");
  if (status) status.textContent = "";
  updateClockApp();
});
appContent.addEventListener("submit", (event) => {
  if (activeApp !== "clock" || event.target.id !== "clock-alarm-form") return;
  event.preventDefault();
  const form = new FormData(event.target), time = String(form.get("time"));
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
  const label = String(form.get("label")).trim() || "알람";
  const alarm = clockAlarms.find((item) => item.id === clockState.editor);
  if (alarm) { alarm.time = time; if (label !== alarm.label.ko) alarm.label = { ko: label, zh: "" }; alarm.repeat = String(form.get("repeat")); }
  else clockAlarms.push({ id: `alarm-${Date.now()}`, time, label: { ko: label, zh: label === "알람" ? "闹钟" : "" }, repeat: String(form.get("repeat")), enabled: true });
  saveClock(); clockState.editor = ""; renderClock("alarms", true);
});
