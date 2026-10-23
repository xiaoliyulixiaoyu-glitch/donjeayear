// 天气和日历小组件。你要调整的数据在 widgets-config.js。
const homeWidgets = document.querySelector("#home-widgets");
let lastWidgetState = "";
let calendarMonth = null;
let calendarSelection = "";
let calendarEditing = false;
let calendarDetailId = "";
let calendarDetailDate = "";
// 默认始终预览阅读者界面；作者工具仅在本机的 ?edit=1 链接中启用。
const CALENDAR_AUTHOR_MODE = new URLSearchParams(location.search).get("edit") === "1"
  && (location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname));
const ANNIVERSARY_STORAGE = "xunnian-phone.anniversaries.v1";
const storedAnniversaries = readLocal(ANNIVERSARY_STORAGE, {});
let anniversaryChanges = {
  entries: Array.isArray(storedAnniversaries?.entries) ? storedAnniversaries.entries : [],
  deleted: Array.isArray(storedAnniversaries?.deleted) ? storedAnniversaries.deleted : [],
};

const WEATHER_CONDITIONS = {
  clear: "맑음",
  "partly-cloudy": "구름 조금",
  cloudy: "흐림",
  rain: "비",
  snow: "눈",
};

function validCalendarKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00+09:00`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function koreaDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function calendarReference(now = new Date()) {
  const configured = PHONE_WIDGETS.calendar.date;
  const key = validCalendarKey(configured) ? configured : koreaDateKey(now);
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(`${key}T12:00:00+09:00`);
  const weekday = new Intl.DateTimeFormat("ko-KR", { timeZone: TIME_ZONE, weekday: "long" }).format(date);
  return { key, year, month, day, weekday };
}

function calendarEvents(key) {
  const events = Array.isArray(PHONE_WIDGETS.calendar.events) ? PHONE_WIDGETS.calendar.events : [];
  return events.filter((event) => event && event.date === key && typeof event.title === "string")
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}

function calendarHolidays(key) {
  if (PHONE_WIDGETS.calendar.showHolidays === false) return [];
  return KOREAN_HOLIDAYS.days.filter((holiday) => holiday.date === key);
}

// 中文只作为轻量注释，空译文不占位；可供标题、备注和小组件共用。
function calendarTranslation(text) {
  return text ? `<span class="calendar-translation" lang="zh-CN">${escapeText(text)}</span>` : "";
}

function anniversaryBilingualLines(ko = "", zh = "") {
  const originals = ko.replace(/\r\n?/g, "\n").split("\n");
  const translations = zh.replace(/\r\n?/g, "\n").split("\n");
  return Array.from({ length: Math.max(originals.length, translations.length) }, (_, index) => {
    const original = originals[index] || "";
    const translation = translations[index] || "";
    if (!original && !translation) return '<span class="calendar-bilingual-line is-blank" aria-hidden="true"></span>';
    return `<span class="calendar-bilingual-line">${calendarTranslation(translation)}${original ? `<span class="calendar-original" lang="ko">${escapeText(original)}</span>` : ""}</span>`;
  }).join("");
}

function validAnniversary(item) {
  return item && typeof item.id === "string" && item.id.length > 0
    && typeof item.title === "string" && item.title.trim().length > 0
    && validCalendarKey(item.date) && Number(item.date.slice(0, 4)) >= 1000
    && Number(item.date.slice(0, 4)) <= 9998;
}

function allAnniversaries() {
  const entries = new Map();
  for (const item of [...PHONE_ANNIVERSARIES, ...anniversaryChanges.entries]) {
    if (validAnniversary(item)) entries.set(item.id, {
      id: item.id, title: item.title.trim(), date: item.date,
      yearly: item.yearly === true, note: typeof item.note === "string" ? item.note : "",
      titleZh: typeof item.titleZh === "string" ? item.titleZh.trim() : "",
      noteZh: typeof item.noteZh === "string" ? item.noteZh.trim() : "",
    });
  }
  return [...entries.values()].filter((item) => !anniversaryChanges.deleted.includes(item.id));
}

function anniversariesOn(key) {
  return allAnniversaries().filter((item) => item.date === key
    || (item.yearly && key >= item.date && key.slice(5) === item.date.slice(5)));
}

// 按纯日期计算，避免时区和夏令时导致倒计时差一天。
function calendarDayDistance(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

function anniversaryOccurrence(item, reference) {
  if (!item.yearly) return item.date;
  const startYear = Math.max(Number(reference.slice(0, 4)), Number(item.date.slice(0, 4)));
  // 2 月 29 日只在闰年出现，非闰年不挪到其他日期。
  for (let year = startYear; year <= startYear + 8; year++) {
    const candidate = `${year}-${item.date.slice(5)}`;
    if (validCalendarKey(candidate) && candidate >= reference && candidate >= item.date) return candidate;
  }
  return item.date;
}

function anniversaryCountdown(date, reference) {
  const days = calendarDayDistance(reference, date);
  return days === 0 ? "D-DAY" : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

function sortedAnniversaries(reference) {
  return allAnniversaries().map((item) => ({ ...item, occurrence: anniversaryOccurrence(item, reference) }))
    .sort((a, b) => {
      const aPast = a.occurrence < reference, bPast = b.occurrence < reference;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return (aPast ? b.occurrence.localeCompare(a.occurrence) : a.occurrence.localeCompare(b.occurrence))
        || a.title.localeCompare(b.title, "ko");
    });
}

function persistAnniversaryChanges(next) {
  if (!CALENDAR_AUTHOR_MODE) return false;
  if (!saveLocal(ANNIVERSARY_STORAGE, next)) return false;
  anniversaryChanges = next;
  updateHomeWidgets();
  return true;
}

function exportAnniversaries() {
  if (!CALENDAR_AUTHOR_MODE) return;
  // 生成可直接替换的数据文件，浏览器不能静默改写项目源文件。
  const source = `// 共享纪念日：在这里修改，或从网页重新导出。\nconst PHONE_ANNIVERSARIES = ${JSON.stringify(allAnniversaries(), null, 2)};\n`;
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "anniversaries.js";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("내보낸 파일로 프로젝트의 anniversaries.js를 교체해 주세요.");
}

function isWeatherNight(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23",
  }).format(now));
  return hour < 6 || hour >= 19;
}

function weatherTemperature(value) {
  if (value === "" || value == null) return "—";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number)}°` : "—";
}

function weatherSymbol(condition, night) {
  const sun = '<circle cx="24" cy="18" r="12" fill="#ffd45a"/>';
  const moon = '<path d="M35 5a15 15 0 1 0 17 22A16 16 0 0 1 35 5Z" fill="#fff5d6"/>';
  const cloud = '<path d="M15 39a10 10 0 0 1 0-20c2-13 22-14 25-2 12-4 21 14 10 20-3 2-6 2-10 2Z" fill="#f6fbff"/>';
  let shape;
  if (condition === "clear") shape = night ? moon : sun;
  else if (condition === "cloudy") shape = cloud;
  else if (condition === "rain") shape = cloud + '<path d="m23 43-3 6m14-6-3 6m14-6-3 6" stroke="#a7dcff" stroke-width="3" stroke-linecap="round"/>';
  else if (condition === "snow") shape = cloud + '<g fill="#e0f1ff"><circle cx="21" cy="46" r="2"/><circle cx="33" cy="48" r="2"/><circle cx="45" cy="46" r="2"/></g>';
  else shape = (night ? moon : sun) + cloud;
  return `<svg class="weather-symbol" viewBox="0 0 64 52" aria-hidden="true">${shape}</svg>`;
}

function updateHomeWidgets() {
  const reference = calendarReference();
  const night = isWeatherNight();
  const weather = PHONE_WIDGETS.weather;
  const events = calendarEvents(reference.key);
  const holidays = calendarHolidays(reference.key);
  const nextAnniversary = sortedAnniversaries(reference.key).find((item) => item.occurrence >= reference.key);
  const state = JSON.stringify({ reference: reference.key, night, weather, events, holidays, nextAnniversary });
  // 日期和显示内容不变时不重建按钮，保留用户的键盘焦点。
  if (state === lastWidgetState) return;
  lastWidgetState = state;
  const condition = WEATHER_CONDITIONS[weather.condition] || WEATHER_CONDITIONS.clear;
  homeWidgets.innerHTML = `<div class="widget-slot">
    <button class="ios-widget weather-widget${night ? " is-night" : ""}" type="button" data-open-widget="weather" aria-label="날씨 자세히 보기">
      <span class="widget-city">${escapeText(weather.city || "서울")}</span>
      <span class="widget-temperature">${escapeText(weatherTemperature(weather.temperature))}</span>
      <span class="widget-weather-bottom">${weatherSymbol(weather.condition, night)}<span class="widget-weather-description">${escapeText(condition)}</span><span class="widget-temperature-range">최고:${escapeText(weatherTemperature(weather.high))} 최저:${escapeText(weatherTemperature(weather.low))}</span></span>
    </button>
    <span class="widget-name">날씨</span>
  </div>
  <div class="widget-slot">
    <button class="ios-widget calendar-widget${nextAnniversary?.titleZh || events[0]?.titleZh ? " has-translation" : ""}" type="button" data-open-widget="calendar" aria-label="캘린더 열기">
      <span class="widget-weekday">${escapeText(reference.weekday)}</span>
      <span class="widget-calendar-date">${reference.day}</span>
      ${nextAnniversary && (nextAnniversary.occurrence === reference.key || (!events.length && !holidays.length))
        ? `<span class="widget-calendar-summary widget-calendar-event widget-anniversary">${calendarTranslation(nextAnniversary.titleZh)}<strong lang="ko">${escapeText(nextAnniversary.title)}</strong><small>${anniversaryCountdown(nextAnniversary.occurrence, reference.key)}</small></span>`
        : events.length ? `<span class="widget-calendar-summary widget-calendar-event">${calendarTranslation(events[0].titleZh)}<strong lang="ko">${escapeText(events[0].title)}</strong><small>${escapeText(events[0].time || "하루 종일")}</small></span>`
        : holidays.length ? `<span class="widget-calendar-summary widget-calendar-event widget-holiday"><strong>${escapeText(holidays.map((item) => item.title).join(" · "))}</strong><small>대한민국 공휴일</small></span>` : '<span class="widget-calendar-summary">오늘은 일정이<br>없습니다.</span>'}
    </button>
    <span class="widget-name">캘린더</span>
  </div>`;
}

function openHomeWidget(id) {
  if (id !== "weather" && id !== "calendar") return;
  activeApp = id;
  activeNoteId = null;
  activeChatId = null;
  phoneContainer.dataset.app = id;
  appScreen.dataset.app = id;
  appTitle.textContent = id === "weather" ? "날씨" : "캘린더";
  appBack.innerHTML = '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", "홈 화면으로");
  setAppActions();
  showView("app");
  if (id === "weather") renderWeatherWidgetPage();
  else {
    const reference = calendarReference();
    calendarMonth = { year: reference.year, month: reference.month };
    calendarSelection = reference.key;
    renderCalendarWidgetPage();
  }
  appBack.focus({ preventScroll: true });
}

function renderWeatherWidgetPage() {
  const weather = PHONE_WIDGETS.weather;
  const night = isWeatherNight();
  appScreen.classList.toggle("is-night", night);
  const condition = WEATHER_CONDITIONS[weather.condition] || WEATHER_CONDITIONS.clear;
  appContent.innerHTML = `<div class="weather-detail">
    <h2>${escapeText(weather.city || "서울")}</h2>
    <p class="weather-detail-temperature">${escapeText(weatherTemperature(weather.temperature))}</p>
    ${weatherSymbol(weather.condition, night)}
    <p class="weather-detail-condition">${escapeText(condition)}</p>
    <p class="weather-detail-range">최고:${escapeText(weatherTemperature(weather.high))} 최저:${escapeText(weatherTemperature(weather.low))}</p>
    <div class="weather-detail-stats">
      <div class="weather-detail-stat"><small>최고 기온</small><strong>${escapeText(weatherTemperature(weather.high))}</strong></div>
      <div class="weather-detail-stat"><small>최저 기온</small><strong>${escapeText(weatherTemperature(weather.low))}</strong></div>
    </div>
  </div>`;
}

function renderCalendarWidgetPage() {
  calendarEditing = false;
  calendarDetailId = "";
  calendarDetailDate = "";
  appTitle.textContent = "캘린더";
  appBack.innerHTML = '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", "홈 화면으로");
  setAppActions(CALENDAR_AUTHOR_MODE ? '<button class="calendar-add" type="button" data-anniversary-add aria-label="기념일 추가">＋</button>' : "");
  const reference = calendarReference();
  const { year, month } = calendarMonth;
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = [];
  for (let index = 0; index < firstDay; index++) days.push('<span aria-hidden="true"></span>');
  for (let day = 1; day <= totalDays; day++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = key === reference.key;
    const selected = key === calendarSelection;
    const hasAnniversaries = anniversariesOn(key).length > 0;
    const holidays = calendarHolidays(key);
    const hasEvents = calendarEvents(key).length > 0 || hasAnniversaries || holidays.length > 0;
    const weekday = new Date(`${key}T00:00:00Z`).getUTCDay();
    days.push(`<button class="calendar-day${today ? " is-today" : ""}${selected ? " is-selected" : ""}${hasEvents ? " has-events" : ""}${hasAnniversaries ? " has-anniversary" : ""}${holidays.length ? " is-holiday" : ""}${weekday === 0 ? " is-sunday" : weekday === 6 ? " is-saturday" : ""}" type="button" data-calendar-day="${key}" aria-label="${year}년 ${month}월 ${day}일${holidays.length ? `, ${escapeText(holidays.map((item) => item.title).join(", "))}` : ""}${hasAnniversaries ? ", 기념일 있음" : ""}" aria-pressed="${selected}"${today ? ' aria-current="date"' : ""}><span>${day}</span></button>`);
  }
  const events = calendarEvents(calendarSelection);
  const holidays = calendarHolidays(calendarSelection);
  const anniversaries = anniversariesOn(calendarSelection);
  const all = sortedAnniversaries(reference.key);
  appContent.innerHTML = `<div class="calendar-page">
    <div class="calendar-month-toolbar"><h2>${year}년 ${month}월</h2><div class="calendar-month-nav"><button type="button" data-calendar-nav="-1" aria-label="이전 달">‹</button><button type="button" data-calendar-nav="1" aria-label="다음 달">›</button></div></div>
    <div class="calendar-weekdays" aria-hidden="true">${["일", "월", "화", "수", "목", "금", "토"].map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="calendar-month-grid" aria-label="${year}년 ${month}월">${days.join("")}</div>
    ${PHONE_WIDGETS.calendar.showHolidays !== false ? `<p class="calendar-holiday-caption"><i aria-hidden="true"></i> 대한민국 공휴일${year < KOREAN_HOLIDAYS.fromYear || year > KOREAN_HOLIDAYS.toYear ? ` · ${KOREAN_HOLIDAYS.fromYear}–${KOREAN_HOLIDAYS.toYear}년 자료` : ""}</p>` : ""}
    <section class="calendar-events" aria-label="선택한 날짜의 일정"><h3>${escapeText(kakaoDateLabel(calendarSelection))}</h3>
      ${holidays.map((item) => `<div class="calendar-holiday-row"><span class="holiday-all-day">종일</span><div>${calendarTranslation(item.titleZh)}<strong lang="ko">${escapeText(item.title)}</strong><small>대한민국 공휴일</small></div></div>`).join("")}
      ${anniversaries.map((item) => renderAnniversaryRow(item, calendarSelection, reference.key, true)).join("")}
      ${events.map((event) => `<div class="calendar-event-row"><time>${escapeText(event.time || "종일")}</time><div><p>${anniversaryBilingualLines(event.title, event.titleZh)}</p>${event.note || event.noteZh ? `<p>${anniversaryBilingualLines(event.note, event.noteZh)}</p>` : ""}</div></div>`).join("")}
      ${!events.length && !anniversaries.length && !holidays.length ? '<p class="calendar-no-events">일정 없음</p>' : ""}
      ${CALENDAR_AUTHOR_MODE ? '<button class="calendar-inline-add" type="button" data-anniversary-add>＋ 이 날짜에 기념일 추가</button>' : ""}
    </section>
    <section class="calendar-anniversaries" aria-label="모든 기념일"><h3>모든 기념일 <span>${all.length}</span></h3>
      ${all.length ? all.map((item) => renderAnniversaryRow(item, item.occurrence, reference.key)).join("") : '<p class="anniversary-empty">기념일 없음</p>'}
    </section>
    <button class="calendar-today" type="button" data-calendar-today>오늘</button>
    ${CALENDAR_AUTHOR_MODE ? `<div class="anniversary-file-tools"><button type="button" data-anniversary-export>파일로 내보내기</button>
      ${anniversaryChanges.entries.length || anniversaryChanges.deleted.length ? '<button class="anniversary-reset" type="button" data-anniversary-reset>웹 수정 지우기</button>' : ""}
    </div>` : ""}
  </div>`;
}

function renderAnniversaryRow(item, occurrence, reference, showNote = false) {
  return `<button class="anniversary-row" type="button" data-anniversary-open="${escapeText(item.id)}" data-anniversary-date="${escapeText(occurrence)}" aria-label="${escapeText(item.title)} 상세 보기">
    <span class="anniversary-stripe" aria-hidden="true"></span><span class="anniversary-row-text"><strong>${anniversaryBilingualLines(item.title, item.titleZh)}</strong><small>${escapeText(occurrence.replaceAll("-", "."))}${item.yearly ? " · 매년" : ""}</small>${showNote && (item.note || item.noteZh) ? `<span class="anniversary-note">${anniversaryBilingualLines(item.note, item.noteZh)}</span>` : ""}</span><span class="anniversary-countdown">${anniversaryCountdown(occurrence, reference)}</span><span class="anniversary-chevron" aria-hidden="true">›</span>
  </button>`;
}

function renderAnniversaryDetail(id, occurrence = "") {
  const item = allAnniversaries().find((entry) => entry.id === id);
  if (!item) return renderCalendarWidgetPage();
  const reference = calendarReference().key;
  const date = validCalendarKey(occurrence) ? occurrence : anniversaryOccurrence(item, reference);
  calendarEditing = false;
  calendarDetailId = id;
  calendarDetailDate = date;
  appTitle.textContent = "기념일";
  appBack.innerHTML = '‹ <span>캘린더</span>';
  appBack.setAttribute("aria-label", "캘린더로 돌아가기");
  setAppActions(CALENDAR_AUTHOR_MODE ? `<button type="button" data-anniversary-edit="${escapeText(id)}">편집</button>` : "");
  appContent.innerHTML = `<article class="anniversary-detail">
    <div class="anniversary-detail-heading"><h2>${anniversaryBilingualLines(item.title, item.titleZh)}</h2><span class="anniversary-detail-countdown">${anniversaryCountdown(date, reference)}</span></div>
    <div class="anniversary-detail-facts"><div><span>날짜</span><p>${escapeText(kakaoDateLabel(date))}</p></div><div><span>반복</span><p>${item.yearly ? "매년" : "반복 안 함"}</p></div></div>
    ${item.note || item.noteZh ? `<section class="anniversary-detail-note"><h3>메모</h3><div>${anniversaryBilingualLines(item.note, item.noteZh)}</div></section>` : ""}
  </article>`;
  appContent.scrollTop = 0;
}

function returnFromCalendarSubview() {
  if (calendarEditing && calendarDetailId) renderAnniversaryDetail(calendarDetailId, calendarDetailDate);
  else renderCalendarWidgetPage();
}

function renderAnniversaryEditor(id = "") {
  if (!CALENDAR_AUTHOR_MODE) return;
  const item = allAnniversaries().find((entry) => entry.id === id);
  if (id && !item) return;
  if (!id) { calendarDetailId = ""; calendarDetailDate = ""; }
  calendarEditing = true;
  appTitle.textContent = item ? "기념일 편집" : "새 기념일";
  appBack.innerHTML = '‹ <span>캘린더</span>';
  appBack.setAttribute("aria-label", "캘린더로 돌아가기");
  setAppActions();
  appContent.innerHTML = `<div class="anniversary-editor"><form id="anniversary-form" data-edit-id="${escapeText(id)}">
    <p class="anniversary-eyebrow">소중한 하루</p><h2>기억하고 싶은 날</h2>
    <div class="anniversary-fields">
      <div class="anniversary-edit-field"><label for="anniversary-title">이름</label><input class="anniversary-inline-translation" id="anniversary-title-zh" name="titleZh" type="text" aria-label="이름 번역" lang="zh-CN" maxlength="80" placeholder="名称译文（选填）" value="${escapeText(item?.titleZh || "")}"><input id="anniversary-title" name="title" type="text" maxlength="80" required placeholder="기념일 이름" value="${escapeText(item?.title || "")}"></div>
      <label for="anniversary-date">날짜<input id="anniversary-date" name="date" type="date" min="1000-01-01" max="9998-12-31" required value="${escapeText(item?.date || calendarSelection)}"></label>
      <label class="anniversary-repeat" for="anniversary-yearly"><span>매년 반복</span><input id="anniversary-yearly" name="yearly" type="checkbox" role="switch"${item?.yearly ? " checked" : ""}></label>
      <div class="anniversary-edit-field"><label for="anniversary-note">메모</label><textarea class="anniversary-inline-translation" id="anniversary-note-zh" name="noteZh" aria-label="메모 번역" lang="zh-CN" rows="2" maxlength="1000" placeholder="备注译文（选填，按行对应韩文）">${escapeText(item?.noteZh || "")}</textarea><textarea id="anniversary-note" name="note" rows="3" maxlength="1000" placeholder="이날의 이야기를 남겨 보세요">${escapeText(item?.note || "")}</textarea></div>
    </div>
    <p class="anniversary-form-error" id="anniversary-error" role="alert"></p>
    <div class="anniversary-form-actions"><button type="button" data-anniversary-cancel>취소</button><button class="anniversary-save" type="submit">저장</button></div>
    ${item ? `<button class="anniversary-delete" type="button" data-anniversary-delete="${escapeText(item.id)}">기념일 삭제</button>` : ""}
  </form></div>`;
  appContent.scrollTop = 0;
  document.querySelector("#anniversary-title").focus({ preventScroll: true });
}

appContent.addEventListener("submit", (event) => {
  if (!CALENDAR_AUTHOR_MODE || activeApp !== "calendar" || event.target.id !== "anniversary-form") return;
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  const item = {
    id: form.dataset.editId || `anniversary-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    title: String(data.get("title") || "").trim(), date: String(data.get("date") || ""),
    yearly: data.get("yearly") === "on", note: String(data.get("note") || "").trim(),
    titleZh: String(data.get("titleZh") || "").trim(), noteZh: String(data.get("noteZh") || "").trim(),
  };
  if (!validAnniversary(item)) {
    document.querySelector("#anniversary-error").textContent = "이름과 올바른 날짜를 입력해 주세요.";
    return;
  }
  if (!persistAnniversaryChanges({
    entries: [...anniversaryChanges.entries.filter((entry) => entry.id !== item.id), item],
    deleted: anniversaryChanges.deleted.filter((id) => id !== item.id),
  })) return;
  calendarSelection = item.date;
  const [year, month] = item.date.split("-").map(Number);
  calendarMonth = { year, month };
  renderAnniversaryDetail(item.id);
  appContent.scrollTop = 0;
  showToast("기념일을 저장했습니다");
});

function handleAnniversaryClick(event) {
  if (activeApp !== "calendar") return;
  const open = event.target.closest("[data-anniversary-open]");
  if (open) return renderAnniversaryDetail(open.dataset.anniversaryOpen, open.dataset.anniversaryDate);
  if (!CALENDAR_AUTHOR_MODE) return;
  const add = event.target.closest("[data-anniversary-add]");
  const edit = event.target.closest("[data-anniversary-edit]");
  const cancel = event.target.closest("[data-anniversary-cancel]");
  const remove = event.target.closest("[data-anniversary-delete]");
  const reset = event.target.closest("[data-anniversary-reset]");
  if (add) renderAnniversaryEditor();
  else if (edit) renderAnniversaryEditor(edit.dataset.anniversaryEdit);
  else if (cancel) returnFromCalendarSubview();
  else if (remove) {
    if (remove.dataset.confirm !== "yes") {
      remove.dataset.confirm = "yes";
      remove.textContent = "삭제 확인 — 한 번 더 누르세요";
      return;
    }
    const id = remove.dataset.anniversaryDelete;
    if (persistAnniversaryChanges({
      entries: anniversaryChanges.entries.filter((item) => item.id !== id),
      deleted: [...new Set([...anniversaryChanges.deleted, id])],
    })) { renderCalendarWidgetPage(); showToast("기념일을 삭제했습니다"); }
  } else if (event.target.closest("[data-anniversary-export]")) exportAnniversaries();
  else if (reset) {
    if (reset.dataset.confirm !== "yes") {
      reset.dataset.confirm = "yes";
      reset.textContent = "파일 내용으로 되돌릴까요? 다시 눌러 확인";
      return;
    }
    if (persistAnniversaryChanges({ entries: [], deleted: [] })) {
      renderCalendarWidgetPage(); showToast("프로젝트 파일의 내용으로 되돌렸습니다");
    }
  }
}

appContent.addEventListener("click", handleAnniversaryClick);
appActions.addEventListener("click", handleAnniversaryClick);

homeWidgets.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-widget]");
  if (button) openHomeWidget(button.dataset.openWidget);
});

appContent.addEventListener("click", (event) => {
  if (activeApp !== "calendar") return;
  const monthButton = event.target.closest("[data-calendar-nav]");
  const dayButton = event.target.closest("[data-calendar-day]");
  const todayButton = event.target.closest("[data-calendar-today]");
  if (monthButton) {
    const next = new Date(Date.UTC(calendarMonth.year, calendarMonth.month - 1 + Number(monthButton.dataset.calendarNav), 1));
    calendarMonth = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
    calendarSelection = `${calendarMonth.year}-${String(calendarMonth.month).padStart(2, "0")}-01`;
  } else if (dayButton) calendarSelection = dayButton.dataset.calendarDay;
  else if (todayButton) {
    const reference = calendarReference();
    calendarMonth = { year: reference.year, month: reference.month };
    calendarSelection = reference.key;
  } else return;
  renderCalendarWidgetPage();
});

updateHomeWidgets();
setInterval(updateHomeWidgets, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateHomeWidgets();
});
