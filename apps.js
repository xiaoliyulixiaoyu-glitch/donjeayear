// 桌面图标和应用页面。应用名称、顺序及相册内容请在 content.js 修改。
const appContent = document.querySelector("#app-content");
const appTitle = document.querySelector("#app-title");
const appActions = document.querySelector("#app-actions");
const appBack = document.querySelector("#app-back");
const phoneContainer = document.querySelector(".phone-screen");
let activeApp = null;
let activeNoteId = null;
let activeChatId = null;
let activeChatPanel = "conversation";
let kakaoReturnTab = "chats";
let kakaoSearchOpen = false;
let kakaoSearchQuery = "";
const kakaoHistoryStarts = new Map();
let dialNumber = "";
let toastTimer;

// 用户输入以纯文本显示，防止被当作 HTML 执行。
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function showToast(message) {
  const toast = document.querySelector("#phone-toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
}

function readLocal(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("브라우저에 저장할 수 없습니다. 내용을 복사해 주세요.");
    return false;
  }
}

// IG 评论也是剧情进度：旧访客已发送的评论在刷新后继续生效。
const savedIgProgress = readLocal("xunnian-phone.instagram.v1", {});
const completedIgComments = new Set(Array.isArray(savedIgProgress?.comments) ? savedIgProgress.comments.filter((id) => typeof id === "string") : []);
// 阅读里程碑独立于 IG 评论；只记录真正进入聊天可视区域的消息。
const savedStoryProgress = readLocal("xunnian-phone.story-progress.v1", {});
const completedStoryProgress = new Set(Array.isArray(savedStoryProgress?.completed) ? savedStoryProgress.completed.filter((id) => typeof id === "string") : []);
const seenStoryMessages = new Map(Object.entries(savedStoryProgress?.seen || {}).filter(([, value]) => Array.isArray(value)).map(([id, value]) => [id, new Set(value.filter((key) => typeof key === "string"))]));
let kakaoReadingObserver;

function persistStoryProgress() {
  saveLocal("xunnian-phone.story-progress.v1", {
    completed: [...completedStoryProgress],
    seen: Object.fromEntries([...seenStoryMessages].map(([id, keys]) => [id, [...keys]])),
  });
}

function storyNoteAvailable(note) {
  return !note.requiresProgress || completedStoryProgress.has(note.requiresProgress);
}

function kakaoReadingKey(message) {
  return message.id || JSON.stringify([message.date, message.time || "", message.sender, message.ko]);
}

function bindKakaoReadingProgress(log, chat) {
  kakaoReadingObserver?.disconnect();
  const milestone = chat.readingMilestone;
  if (!milestone || completedStoryProgress.has(milestone.id)) return;
  if (milestone.requiresIgComment && !completedIgComments.has(milestone.requiresIgComment)) return;
  // 目标取未过滤的剧情源，防止尚未解锁的消息被误判为“读完”。
  const required = (storyChats.find((item) => item.id === chat.id)?.messages || []).filter((message) => message.date?.startsWith(`${milestone.year}-`));
  if (!required.length) return;
  const seen = seenStoryMessages.get(milestone.id) || new Set();
  seenStoryMessages.set(milestone.id, seen);
  kakaoReadingObserver = new IntersectionObserver((entries) => {
    if (!log.isConnected || activeApp !== "kakao" || activeChatId !== chat.id || currentView !== "app") return;
    let changed = false;
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.2) continue;
      const message = chat.messages[Number(entry.target.dataset.kakaoMessageIndex)];
      if (!message?.date?.startsWith(`${milestone.year}-`)) continue;
      const key = kakaoReadingKey(message);
      if (!seen.has(key)) { seen.add(key); changed = true; }
    }
    if (required.every((message) => seen.has(kakaoReadingKey(message)))) {
      completedStoryProgress.add(milestone.id);
      changed = true;
      kakaoReadingObserver.disconnect();
    }
    if (changed) persistStoryProgress();
  }, { root: log, threshold: 0.2 });
  log.querySelectorAll("[data-kakao-message-index]").forEach((entry) => kakaoReadingObserver.observe(entry));
}
const pendingKakaoFocus = new Map();
const storyNotificationTimers = new Set();

function clearStoryNotifications() {
  storyNotificationTimers.forEach(clearTimeout);
  storyNotificationTimers.clear();
  document.querySelector("#story-notifications")?.remove();
}

function unlockStoryFromIgComment(commentId) {
  if (completedIgComments.has(commentId)) return;
  completedIgComments.add(commentId);
  const chats = storyChats.filter((chat) => chat.revealOnIgComment === commentId);
  const alerts = [];
  for (const chat of chats) {
    kakaoHistoryStarts.delete(chat.id);
    pendingKakaoFocus.set(chat.id, commentId);
    alerts.push(...chat.messages.filter((message) => message.requiresIgComment === commentId).slice(0, chat.notificationCount ?? 2).map((message) => ({ chatId: chat.id, message })));
  }
  if (!alerts.length) return;
  clearStoryNotifications();
  const region = document.createElement("aside");
  region.id = "story-notifications";
  region.className = "story-notifications";
  region.setAttribute("aria-label", "새 메시지 알림");
  region.setAttribute("aria-live", "polite");
  phoneContainer.append(region);
  const addAlert = ({ chatId, message }) => {
    const chat = resolveKakaoChat(chatId);
    const item = document.createElement("div");
    item.className = "story-notification";
    item.innerHTML = `<button type="button" class="story-notification-open"><span class="story-notification-heading">${appArtwork("kakao", "notification-app-icon")}<span>KakaoTalk</span><time>${escapeText(kakaoMessageTime(message))}</time></span><strong>${escapeText(kakaoName(chat))}</strong><span class="story-notification-body">${renderBilingual(message, { interactive: false })}</span></button><button type="button" class="story-notification-close" aria-label="알림 닫기">×</button>`;
    item.querySelector(".story-notification-open").addEventListener("click", () => {
      clearStoryNotifications();
      openApp("kakao");
      renderStoryChat(chatId);
    });
    item.querySelector(".story-notification-close").addEventListener("click", () => item.remove());
    region.append(item);
  };
  alerts.forEach((alert, index) => {
    if (!index) addAlert(alert);
    else storyNotificationTimers.add(setTimeout(() => addAlert(alert), index * 850));
  });
  // 留足阅读和点开的时间；鼠标或键盘正在阅读时不自动关闭。
  storyNotificationTimers.add(setTimeout(() => {
    if (!region.matches(":hover") && !region.contains(document.activeElement)) clearStoryNotifications();
  }, 16000));
}

const storedNotes = readLocal("xunnian-phone.notes.v1", []);
const notes = Array.isArray(storedNotes)
  ? storedNotes.filter((note) => note && typeof note.id === "string" && typeof note.title === "string" && typeof note.body === "string" && Number.isFinite(note.updated))
  : [];
// 剧情始终从 story.js 读取；不写入临时笔记的浏览器存储。
const storyNotes = Array.isArray(PHONE_STORY.notes) ? PHONE_STORY.notes : [];
const storyChats = Array.isArray(PHONE_STORY.kakaoChats) ? PHONE_STORY.kakaoChats : [];
const storyContacts = Array.isArray(PHONE_STORY.kakaoContacts) ? PHONE_STORY.kakaoContacts : [];
const kakaoProfile = PHONE_STORY.kakaoProfile || { id: "dohoon", name: { ko: "DOHOON" } };
const storedSettings = readLocal("xunnian-phone.settings.v1", {});
const settings = {
  airplane: storedSettings?.airplane === true,
  wifi: storedSettings?.wifi !== false,
};

function appArtwork(id, className) {
  const app = PHONE_APPS[id];
  return `<span class="app-artwork ${className}" style="--artwork-scale:${app.iconScale || 1};--artwork-background:${escapeText(app.iconBackground || "transparent")};--artwork-filter:${escapeText(app.iconFilter || "none")}"><img src="assets/icons/${escapeText(app.icon)}" alt="" draggable="false"></span>`;
}

function appIconButton(id, inDock = false) {
  const app = PHONE_APPS[id];
  if (!app) return "";
  return `<button class="launcher-app" type="button" data-open-app="${escapeText(id)}" aria-label="${escapeText(app.name)}">
    ${appArtwork(id, "launcher-icon")}
    <span class="launcher-name"${inDock ? ' aria-hidden="true"' : ""}>${escapeText(app.name)}</span>
  </button>`;
}

document.querySelector("#home-apps").innerHTML = APP_LAYOUT.grid.map((id) => appIconButton(id)).join("");
document.querySelector("#home-dock").innerHTML = APP_LAYOUT.dock.map((id) => appIconButton(id, true)).join("");
let homePageIndex = 0;
const homePages = document.querySelector("#home-pages");
const homePageIndicator = document.querySelector("#home-page-indicator");

function updateHomePageIndicator() {
  homePageIndex = Math.round(homePages.scrollLeft / Math.max(1, homePages.clientWidth));
  homePageIndicator.querySelectorAll("button").forEach((button, index) => {
    if (index === homePageIndex) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  [...homePages.children].forEach((page, index) => {
    page.setAttribute("aria-hidden", String(index !== homePageIndex));
    page.querySelectorAll("button").forEach((button) => { button.tabIndex = index === homePageIndex ? 0 : -1; });
  });
}

function layoutHomePages() {
  if (!homePages.clientHeight) return;
  const widgets = document.querySelector("#home-widgets");
  const grid = homePages.querySelector(".home-apps");
  const app = grid?.querySelector(".launcher-app");
  const gap = parseFloat(getComputedStyle(grid).rowGap) || 14;
  const appHeight = app?.getBoundingClientRect().height || 76;
  const widgetHeight = widgets.getBoundingClientRect().height + (parseFloat(getComputedStyle(widgets).marginBottom) || 0);
  const rows = Math.max(1, Math.min(3, Math.floor((homePages.clientHeight - widgetHeight + gap) / (appHeight + gap))));
  const capacity = Math.min(APP_LAYOUT.pageSize || 12, rows * 4);
  const pageCount = Math.max(1, Math.ceil(APP_LAYOUT.grid.length / capacity));
  const nextIndex = Math.min(homePageIndex, pageCount - 1);
  homePages.replaceChildren();
  for (let index = 0; index < pageCount; index++) {
    const page = document.createElement("section");
    page.className = "home-launcher-page";
    page.setAttribute("aria-label", `홈 화면 ${index + 1}페이지`);
    if (!index) page.append(widgets);
    const apps = document.createElement("div");
    apps.className = "home-apps";
    if (!index) apps.id = "home-apps";
    apps.setAttribute("aria-label", "앱");
    apps.innerHTML = APP_LAYOUT.grid.slice(index * capacity, (index + 1) * capacity).map((id) => appIconButton(id)).join("");
    page.append(apps);
    homePages.append(page);
  }
  homePageIndicator.innerHTML = Array.from({ length: pageCount }, (_, index) => `<button type="button" data-home-page="${index}" aria-label="홈 화면 ${index + 1}페이지"${index === nextIndex ? ' aria-current="page"' : ""}><i></i></button>`).join("");
  homePageIndex = nextIndex;
  homePages.scrollLeft = nextIndex * homePages.clientWidth;
  updateHomePageIndicator();
}
homePages.addEventListener("scroll", updateHomePageIndicator, { passive: true });
homePageIndicator.addEventListener("click", (event) => {
  const button = event.target.closest("[data-home-page]");
  if (!button) return;
  homePages.scrollTo({ left: Number(button.dataset.homePage) * homePages.clientWidth, behavior: "smooth" });
});
homePages.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const next = Math.max(0, Math.min(homePages.children.length - 1, homePageIndex + (event.key === "ArrowRight" ? 1 : -1)));
  homePages.scrollTo({ left: next * homePages.clientWidth, behavior: "smooth" });
});
window.addEventListener("resize", () => { if (currentView === "home") layoutHomePages(); });
homeScreen.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-app]");
  if (button) openApp(button.dataset.openApp);
});

function setAppActions(markup = "") {
  appActions.innerHTML = markup;
}

function openApp(id) {
  if (!PHONE_APPS[id]) return;
  activeApp = id;
  activeNoteId = null;
  activeChatId = null;
  phoneContainer.dataset.app = id;
  appScreen.dataset.app = id;
  appTitle.textContent = PHONE_APPS[id].title;
  appBack.innerHTML = '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", "返回主屏幕");
  setAppActions();
  showView("app");
  renderApp(id);
  appContent.scrollTop = 0;
  if (id === "x") appContent.querySelector("[data-x-profile]")?.focus({ preventScroll: true });
  else appBack.focus({ preventScroll: true });
}

function goHome() {
  activeNoteId = null;
  activeChatId = null;
  activeApp = null;
  delete phoneContainer.dataset.app;
  document.querySelector("#phone-toast").hidden = true;
  showView("home");
}

appBack.addEventListener("click", () => {
  if (activeApp === "notes" && activeNoteId) {
    activeNoteId = null;
    renderNotes();
  } else if (activeApp === "kakao" && activeChatPanel === "settings") {
    renderKakaoApp(kakaoReturnTab);
  } else if (activeApp === "kakao" && activeChatId) {
    if (activeChatPanel === "members") renderStoryChat(activeChatId);
    else renderSocial("kakao", kakaoReturnTab);
  } else if (activeApp === "calendar" && (calendarEditing || calendarDetailId)) {
    returnFromCalendarSubview();
  } else if (activeApp === "x" && xGoBack()) {
    // X 的抽屉、帖子和聊天详情先回到应用内的上一页。
  } else if (activeApp === "instagram" && instagramGoBack()) {
    // Instagram 的关注列表和他人主页先回到应用内的上一页。
  } else if (activeApp === "spotify" && spotifyGoBack()) {
    // 歌曲详情或混音歌单先返回 Spotify。
  } else if (activeApp === "clock" && clockGoBack()) {
    // 闹钟编辑先返回闹钟列表。
  } else if (activeApp === "safari" && safariGoBack()) {
    // 搜索入口先返回 Safari 开始页。
  } else goHome();
});
document.querySelector("#home-button").addEventListener("click", () => {
  if (currentView === "app") goHome();
  else if (currentView === "lock") openPasscode();
  else if (currentView === "passcode") cancelPasscode();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && currentView === "app") {
    event.preventDefault();
    appBack.click();
  }
});

function emptyState(id, title, description = "") {
  return `<div class="app-empty">
    ${appArtwork(id, "empty-app-icon")}
    <h2>${escapeText(title)}</h2>
    ${description ? `<p>${escapeText(description)}</p>` : ""}
  </div>`;
}

function renderApp(id) {
  const renderers = {
    notes: renderNotes, photos: renderPhotos, camera: renderCamera,
    settings: renderSettings, phone: renderDialer, contacts: renderContacts,
    kakao: () => { kakaoSearchOpen = false; kakaoSearchQuery = ""; renderSocial("kakao", "friends"); },
    instagram: openInstagram,
    x: openXApp,
    youtube: () => renderSocial("youtube", "library"),
    netflix: () => renderSocial("netflix", "list"),
    spotify: () => renderSpotify("home"),
    clock: () => renderClock("alarms"),
    safari: renderSafari, messages: renderMessages,
    baemin: () => renderSocial("baemin", "home"),
    weverse: () => renderSocial("weverse", "home"),
  };
  renderers[id]();
}

// 韩文与中文配对显示，样式在 story.js 的 translationMode 设置。
function renderBilingual(text, { interactive = true } = {}) {
  const ko = typeof text === "string" ? text : text?.ko || "";
  const zh = typeof text === "object" && text ? text.zh || "" : "";
  const original = `<span class="story-original" lang="ko">${escapeText(ko)}</span>`;
  if (!zh || PHONE_STORY.translationMode === "off") return original;
  const translation = `<span class="story-translation" lang="zh-CN">${escapeText(zh)}</span>`;
  if (PHONE_STORY.translationMode === "tap" && interactive) {
    return `<button class="story-bilingual story-translation-toggle" type="button" data-toggle-translation aria-expanded="false"><span class="story-translation" lang="zh-CN" hidden>${escapeText(zh)}</span>${original}</button>`;
  }
  return `<span class="story-bilingual">${translation}${original}</span>`;
}

function storyDateLabel(date, detailed = false) {
  const dateOnly = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const value = new Date(dateOnly ? `${date}T12:00:00+09:00` : date);
  if (!Number.isFinite(value.getTime())) return "";
  const options = { timeZone: TIME_ZONE, month: "long", day: "numeric" };
  if (dateOnly || detailed) options.year = "numeric";
  if (detailed && !dateOnly) Object.assign(options, { hour: "numeric", minute: "2-digit" });
  return new Intl.DateTimeFormat("ko-KR", options).format(value);
}

// 备忘录：剧情只读，本地临时笔记仍可新建、编辑、删除。
function renderNotes() {
  activeNoteId = null;
  appScreen.dataset.notesView = "list";
  appBack.innerHTML = '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", "返回主屏幕");
  setAppActions();
  const sortedNotes = [...notes].sort((a, b) => b.updated - a.updated);
  const visibleStoryNotes = storyNotes.filter(storyNoteAvailable);
  const totalNotes = visibleStoryNotes.length + notes.length;
  const storyRows = visibleStoryNotes.map((note) => {
    const preview = note.paragraphs?.[0] || "추가 텍스트 없음";
    return `<button class="note-row" type="button" data-story-note-id="${escapeText(note.id)}">
      <strong class="story-preview">${renderBilingual(note.title || "새로운 메모", { interactive: false })}</strong>
      <span class="note-row-summary">${note.date ? `<time>${escapeText(storyDateLabel(note.date))}</time>` : ""}<small class="story-preview">${renderBilingual(preview, { interactive: false })}</small></span>
    </button>`;
  }).join("");
  appContent.innerHTML = `<div class="notes-screen"><header class="notes-heading"><h2>메모</h2><span>iCloud</span></header>
    <label class="notes-search">${notesIcon("search")}<input type="search" placeholder="검색" aria-label="메모 검색"></label>
    <div class="notes-scroll"><h3 class="notes-section-title">모든 메모</h3>
    ${totalNotes ? `<div class="notes-list">${storyRows}${sortedNotes.map((note) => `<button class="note-row" type="button" data-note-id="${escapeText(note.id)}">
      <strong>${escapeText(note.title || "새로운 메모")}</strong>
      <small>${escapeText(new Intl.DateTimeFormat("ko-KR", { timeZone: TIME_ZONE, month: "numeric", day: "numeric" }).format(note.updated))}　${escapeText(note.body.replace(/\s+/g, " ").slice(0, 60) || "추가 텍스트 없음")}</small>
    </button>`).join("")}</div>` : `${emptyState("notes", "아직 메모가 없습니다", "오른쪽 아래 작성 버튼을 눌러 첫 메모를 작성해 보세요.")}`}
    </div><footer class="notes-bottom-toolbar"><span class="notes-count">${totalNotes}개의 메모</span><button type="button" data-action="new-note" aria-label="새 메모">${notesIcon("compose")}</button></footer>
  </div>`;
}

function notesIcon(name) {
  const paths = name === "search" ? '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>' : '<path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M15 3l3-2 4 4-2 3-10 10-5 1 1-5Z"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

function renderStoryNote(id) {
  const note = storyNotes.find((item) => item.id === id);
  if (!note || !storyNoteAvailable(note)) return renderNotes();
  activeNoteId = `story:${id}`;
  appScreen.dataset.notesView = "detail";
  appBack.innerHTML = '‹ <span>메모</span>';
  appBack.setAttribute("aria-label", "返回备忘录列表");
  setAppActions();
  appContent.innerHTML = `<article class="story-note">
    ${note.date ? `<p class="note-date">${escapeText(storyDateLabel(note.date, true))}</p>` : ""}
    <h2 class="story-note-title">${renderBilingual(note.title)}</h2>
    ${(note.paragraphs || []).map((paragraph) => paragraph.ko?.startsWith("□ ") ? `<div class="note-checklist-row"><span class="note-check-circle" aria-hidden="true"></span><p class="story-paragraph">${renderBilingual({ ko: paragraph.ko.slice(2), zh: paragraph.zh?.replace(/^□\s*/, "") || "" })}</p></div>` : `<p class="story-paragraph${paragraph.spaceBefore ? " note-paragraph-break" : ""}">${renderBilingual(paragraph)}</p>`).join("")}
  </article>`;
  appContent.scrollTop = 0;
}

function createNote() {
  const note = { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: "", body: "", updated: Date.now() };
  notes.push(note);
  saveLocal("xunnian-phone.notes.v1", notes);
  renderNote(note.id);
  document.querySelector("#note-title-input").focus();
}

function renderNote(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return renderNotes();
  activeNoteId = id;
  appScreen.dataset.notesView = "detail";
  appBack.innerHTML = '‹ <span>메모</span>';
  appBack.setAttribute("aria-label", "返回备忘录列表");
  setAppActions('<button type="button" data-action="notes-list">완료</button>');
  appContent.innerHTML = `<div class="note-editor">
    <p class="note-date">${escapeText(new Intl.DateTimeFormat("ko-KR", { timeZone: TIME_ZONE, month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(note.updated))}</p>
    <input class="note-title" id="note-title-input" maxlength="120" aria-label="메모 제목" placeholder="제목" value="${escapeText(note.title)}">
    <textarea class="note-body" id="note-body-input" maxlength="20000" aria-label="메모 내용" placeholder="메모 작성…">${escapeText(note.body)}</textarea>
    <button class="text-action note-delete" type="button" data-action="delete-note">메모 삭제</button>
  </div>`;
  const updateNote = () => {
    note.title = document.querySelector("#note-title-input").value;
    note.body = document.querySelector("#note-body-input").value;
    note.updated = Date.now();
    saveLocal("xunnian-phone.notes.v1", notes);
  };
  document.querySelector("#note-title-input").addEventListener("input", updateNote);
  document.querySelector("#note-body-input").addEventListener("input", updateNote);
}

function renderPhotos() {
  setAppActions();
  appContent.innerHTML = `<div class="app-page"><h2 class="app-large-title">보관함</h2>
    <div class="photo-grid">${PHONE_PHOTOS.map((photo, index) => `<button type="button" data-photo="${index}" aria-label="${escapeText(photo.alt)}"><img src="${escapeText(photo.src)}" alt="${escapeText(photo.alt)}"></button>`).join("")}</div>
    <p class="photo-count">${PHONE_PHOTOS.length}장의 사진</p></div>`;
}

function renderContacts() {
  appContent.innerHTML = `<div class="app-page"><h2 class="app-large-title">연락처</h2>
    ${PHONE_CONTACTS.length ? PHONE_CONTACTS.map((contact) => `<div class="contact-row"><div class="profile-monogram">${escapeText(contact.name.slice(0, 1))}</div><div><strong>${escapeText(contact.name)}</strong><small>${escapeText(contact.number)}</small></div></div>`).join("") : emptyState("contacts", "연락처 없음")}</div>`;
}

function renderCamera() {
  appContent.innerHTML = `<div class="camera-page">
    <div class="camera-preview"><p>카메라</p></div>
    <p class="camera-modes">사진</p>
    <div class="camera-bottom"><button class="camera-shutter" type="button" data-action="camera" aria-label="촬영"></button></div>
  </div>`;
}

function renderSettings() {
  appContent.innerHTML = `<div class="app-page">
    <h2 class="app-large-title">설정</h2>
    <div class="settings-profile"><div class="profile-monogram">D</div><div><strong>DOHOON</strong><small>나의 iPhone</small></div></div>
    <div class="settings-group">
      <label class="settings-row"><span class="setting-symbol" style="background:#ff9500">✈</span><span>에어플레인 모드</span><input type="checkbox" data-setting="airplane" ${settings.airplane ? "checked" : ""}></label>
      <label class="settings-row"><span class="setting-symbol" style="background:#007aff">◉</span><span>Wi-Fi</span><span class="setting-detail" data-wifi-name>${escapeText(settings.wifi && !settings.airplane ? PHONE_WIFI_NAME : "연결 안 됨")}</span><input type="checkbox" data-setting="wifi" aria-label="Wi-Fi" ${settings.wifi ? "checked" : ""}></label>
      <div class="settings-row"><span class="setting-symbol" style="background:#34c759">▥</span><span>셀룰러</span><span class="setting-detail">SKT</span></div>
    </div>
    <div class="settings-group">
      <div class="settings-row"><span class="setting-symbol">A</span><span>언어 및 지역</span><span class="setting-detail">한국어 · 대한민국</span></div>
      <div class="settings-row"><span class="setting-symbol" style="background:#6e77ce">◷</span><span>시간대</span><span class="setting-detail">서울</span></div>
      <button type="button" class="settings-row" data-action="lock-phone"><span class="setting-symbol" style="background:#444">⌑</span><span>화면 잠그기</span><span class="setting-detail">›</span></button>
    </div>
  </div>`;
}

function applyPhoneSettings() {
  // 只模拟手机状态栏，不会修改电脑或真实网络设置。
  document.querySelector(".status-icons .signal").style.opacity = settings.airplane ? "0.2" : "1";
  document.querySelector(".status-icons .wifi").style.opacity = settings.wifi && !settings.airplane ? "1" : "0.2";
  const wifiName = appContent.querySelector("[data-wifi-name]");
  if (wifiName) wifiName.textContent = settings.wifi && !settings.airplane ? PHONE_WIFI_NAME : "연결 안 됨";
}
applyPhoneSettings();

function renderDialer() {
  appContent.innerHTML = `<div class="dialer">
    <p class="dial-number" id="dial-number" aria-live="polite">${escapeText(dialNumber)}</p>
    <div class="dial-grid">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => `<button type="button" data-dial="${digit}">${digit}</button>`).join("")}</div>
    <div class="dial-actions"><button class="call-button" type="button" data-action="call" aria-label="통화"><img src="assets/icons/phone-official.png" alt=""></button><button class="dial-delete" type="button" data-action="dial-delete" aria-label="번호 지우기">⌫</button></div>
  </div>`;
}

// 以下是各社交/视频应用的基础页面；没有接入真实账号或外部服务。
const SOCIAL_TABS = {
  kakao: [{ id: "friends", text: "친구" }, { id: "chats", text: "채팅" }, { id: "more", text: "더보기" }],
  instagram: [{ id: "home", text: "홈" }, { id: "saved", text: "저장됨" }, { id: "profile", text: "프로필" }],
  x: [{ id: "home", text: "홈" }, { id: "notifications", text: "알림" }, { id: "messages", text: "쪽지" }],
  youtube: [{ id: "home", text: "홈" }, { id: "subscriptions", text: "구독" }, { id: "library", text: "내 페이지" }],
  netflix: [{ id: "home", text: "홈" }, { id: "list", text: "내가 찜한 리스트" }, { id: "downloads", text: "저장한 콘텐츠" }],
  spotify: [{ id: "home", text: "홈" }, { id: "search", text: "검색" }, { id: "library", text: "내 라이브러리" }],
  baemin: [{ id: "home", text: "홈" }, { id: "favorites", text: "찜" }, { id: "orders", text: "주문내역" }, { id: "my", text: "마이배민" }],
  weverse: [{ id: "home", text: "홈" }, { id: "notifications", text: "알림" }, { id: "dm", text: "DM" }, { id: "my", text: "마이" }],
};
const SOCIAL_EMPTY = {
  kakao: { friends: ["친구 목록이 비어 있습니다"], chats: ["아직 대화가 없습니다"], more: ["나의 카카오톡"] },
  instagram: { home: ["아직 게시물이 없습니다"], saved: ["저장한 게시물이 없습니다"], profile: ["아직 게시물이 없습니다"] },
  x: { home: ["아직 게시물이 없습니다"], notifications: ["아직 알림이 없습니다"], messages: ["아직 쪽지가 없습니다"] },
  youtube: { home: ["시청할 동영상이 없습니다"], subscriptions: ["구독한 채널이 없습니다"], library: ["저장한 동영상이 없습니다"] },
  netflix: { home: ["등록된 콘텐츠가 없습니다"], list: ["찜한 콘텐츠가 없습니다"], downloads: ["저장한 콘텐츠가 없습니다"] },
  spotify: { home: ["최근에 들은 음악이 없습니다"], search: ["어떤 음악을 듣고 싶으세요?"], library: ["저장한 음악이 없습니다"] },
  baemin: { home: ["오늘은 뭐 먹을까요?"], favorites: ["찜한 가게가 없습니다"], orders: ["주문내역이 없습니다"], my: ["마이배민"] },
  weverse: { home: ["가입한 커뮤니티가 없습니다"], notifications: ["새로운 알림이 없습니다"], dm: ["아직 메시지가 없습니다"], my: ["나의 Weverse"] },
};

function kakaoName(person) {
  return typeof person?.name === "string" ? person.name : person?.name?.ko || "친구";
}

function kakaoPerson(id) {
  return id === kakaoProfile.id ? kakaoProfile : storyContacts.find((person) => person.id === id);
}

function resolveKakaoChat(id) {
  const chat = storyChats.find((item) => item.id === id);
  if (chat) {
    const person = kakaoPerson(chat.contactId);
    const messages = (chat.messages || []).filter((message) => !message.requiresIgComment || completedIgComments.has(message.requiresIgComment));
    return { ...person, ...chat, messages, name: chat.name || person?.name, avatar: chat.avatar ?? person?.avatar };
  }
  // 后续只添加联系人时，也可以从好友列表打开一个空的单聊。
  if (id.startsWith("contact:")) {
    const person = kakaoPerson(id.slice(8));
    if (person) return { ...person, id, contactId: person.id, messages: [] };
  }
  return null;
}

function kakaoAvatar(person, className = "") {
  return `<span class="kakao-avatar ${className}${person?.type === "group" ? " is-group" : ""}" aria-hidden="true">
    <span class="kakao-avatar-fallback">${kakaoIcon(person?.type === "group" ? "chats" : "person", true)}</span>
    ${person?.avatar ? `<img src="${escapeText(person.avatar)}" alt="" hidden>` : ""}
  </span>`;
}

function kakaoIcon(name, filled = false) {
  const paths = {
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/>',
    chats: '<path d="M22 10.5c0 5-4.5 8.5-10 8.5H9l-5 3 1.2-5C3.2 15.5 2 13.2 2 10.5 2 5.8 6.5 2 12 2s10 3.8 10 8.5Z"/>',
    calls: '<path d="m7 2 4 6-3 3c1.5 3 3 4.5 6 6l3-3 6 4-2 4C10 24 0 14 3 5Z"/>',
    more: '<circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>',
    search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 6 6"/>',
    add: '<circle cx="9" cy="7" r="4"/><path d="M1 22v-3a8 8 0 0 1 14-5M19 8v10m-5-5h10"/>',
    settings: '<path d="m9 2-1 3-3 2-3 1v5l3 1 2 3 1 3h5l1-3 3-2 3-1V9l-3-1-2-3-1-3Z"/><circle cx="11" cy="11" r="3"/>',
    chevron: '<path d="m8 4 8 8-8 8"/>',
    up: '<path d="m5 15 7-7 7 7"/>',
    mail: '<rect x="3" y="5" width="18" height="15" rx="1"/><path d="m3 6 9 8 9-8"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="${filled ? "0" : "1.7"}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.more}</svg>`;
}

function kakaoFriendRows() {
  const query = kakaoSearchQuery.trim().toLocaleLowerCase();
  const people = storyContacts.filter((person) => !query || kakaoName(person).toLocaleLowerCase().includes(query));
  return people.map((person) => `<button class="kakao-chat-row" type="button" data-kakao-contact="${escapeText(person.id)}">
    ${kakaoAvatar(person)}<span class="kakao-chat-summary"><strong>${escapeText(kakaoName(person))}</strong>${person.status ? `<small>${renderBilingual(person.status, { interactive: false })}</small>` : ""}</span>
  </button>`).join("") || '<p class="kakao-quiet-empty">검색 결과가 없습니다.</p>';
}

function renderKakaoFriends() {
  return `<div class="kakao-self-profile">
    ${kakaoAvatar(kakaoProfile)}<strong>${escapeText(kakaoName(kakaoProfile))}</strong><button class="kakao-profile-plus" type="button" data-kakao-ui="profile">프로필 +</button>
  </div>
  <div class="kakao-channel-section"><p class="kakao-list-caption">채널 ${kakaoIcon("up")}</p><button class="kakao-chat-row kakao-channel-row" type="button" data-kakao-ui="channel"><span class="kakao-channel-icon">${kakaoIcon("chats", true)}<b>Ch</b></span><strong>채널</strong><span class="kakao-row-chevron">${kakaoIcon("chevron")}</span></button></div>
  <p class="kakao-list-caption">친구 <span>${storyContacts.length}</span>${kakaoIcon("up")}</p>
  <div class="kakao-chat-list" id="kakao-friend-results">${kakaoFriendRows()}</div>
  <button class="kakao-chat-row kakao-invite-row" type="button" data-kakao-ui="invite"><span class="kakao-invite-icon">${kakaoIcon("mail")}</span><strong>친구 초대</strong><span class="kakao-row-chevron">${kakaoIcon("chevron")}</span></button>`;
}

function renderKakaoApp(tab = "friends") {
  activeChatId = null;
  activeChatPanel = "conversation";
  kakaoReturnTab = tab;
  appScreen.dataset.kakaoView = "list";
  appTitle.textContent = PHONE_APPS.kakao.title;
  setAppActions();
  const tabs = [["friends", "친구", "person"], ["chats", "채팅", "chats"], ["calls", "통화", "calls"], ["more", "더보기", "more"]];
  const selected = tabs.find(([id]) => id === tab) || tabs[0];
  const tools = tab === "friends" || tab === "chats";
  const content = tab === "friends" ? renderKakaoFriends() : tab === "chats" ? renderKakaoChats() : tab === "calls" ? '<div class="kakao-quiet-empty">최근 통화가 없습니다.</div>' : `<div class="kakao-self-profile">${kakaoAvatar(kakaoProfile)}<strong>${escapeText(kakaoName(kakaoProfile))}</strong></div><button class="kakao-menu-row" type="button" data-kakao-ui="settings">${kakaoIcon("settings")} 설정</button>`;
  appContent.innerHTML = `<div class="kakao-shell"><header class="kakao-list-header"><h2>${selected[1]}</h2><div>${tools ? `<button type="button" data-kakao-ui="search" aria-label="검색" aria-expanded="${kakaoSearchOpen}">${kakaoIcon("search")}</button>${tab === "friends" ? `<button type="button" data-kakao-ui="add" aria-label="친구 추가">${kakaoIcon("add")}</button>` : ""}` : ""}<button type="button" data-kakao-ui="settings" aria-label="설정">${kakaoIcon("settings")}</button></div></header>${kakaoSearchOpen && tools ? `<div class="kakao-search"><input type="search" id="kakao-list-search" aria-label="${selected[1]} 검색" placeholder="검색" value="${escapeText(kakaoSearchQuery)}"></div>` : ""}<div class="kakao-list-body">${content}</div><nav class="kakao-bottom-nav" aria-label="카카오톡 탭">${tabs.map(([id, name, icon]) => `<button type="button" data-social-tab="${id}" aria-label="${name}"${tab === id ? ' aria-current="page"' : ""}>${kakaoIcon(icon, true)}</button>`).join("")}</nav></div>`;
  if (tab === "chats") filterKakaoChatRows();
}

function filterKakaoChatRows() {
  const query = kakaoSearchQuery.trim().toLocaleLowerCase();
  appContent.querySelectorAll("[data-story-chat-id]").forEach((row) => { row.hidden = !!query && !row.textContent.toLocaleLowerCase().includes(query); });
}

function renderKakaoSettings() {
  appScreen.dataset.kakaoView = "detail";
  appTitle.textContent = "설정";
  appBack.innerHTML = '‹ <span>카카오톡</span>';
  appBack.setAttribute("aria-label", "카카오톡으로");
  appContent.innerHTML = '<div class="app-page"><p class="kakao-quiet-empty">설정할 항목이 없습니다.</p></div>';
  activeChatPanel = "settings";
}

// 每条消息的时刻单独填写；未设置时统一显示中点。
function kakaoMessageTime(message) {
  return typeof message?.time === "string" && message.time.trim() ? message.time.trim() : "·";
}

function kakaoDateLabel(date) {
  if (typeof date !== "string") return "";
  const value = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  // 使用韩国当日中午作为日期基准，避免查看者所在时区让日期前后偏移。
  const parsed = new Date(`${value}T12:00:00+09:00`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE, year: "numeric", month: "long", day: "numeric", weekday: "long",
  }).format(parsed);
}

function renderKakaoDateSeparator(label) {
  return `<p class="kakao-date-label"><svg class="kakao-date-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M6 2.5v3M14 2.5v3M3 8h14M6.5 11h1M10 11h1M13.5 11h.1M6.5 14h1M10 14h1"/></svg><span>${escapeText(label)}</span></p>`;
}

function renderKakaoChats() {
  return `<div class="kakao-chat-list">${storyChats.map((item) => {
    const chat = resolveKakaoChat(item.id);
    const lastMessage = chat.messages?.[chat.messages.length - 1];
    const memberCount = chat.type === "group" ? new Set(chat.memberIds || []).size : 0;
    return `<button class="kakao-chat-row" type="button" data-story-chat-id="${escapeText(chat.id)}">
      ${kakaoAvatar(chat)}
      <span class="kakao-chat-summary"><strong>${escapeText(kakaoName(chat))}${memberCount ? `<span class="kakao-group-count">${memberCount}</span>` : ""}</strong>${lastMessage ? `<small>${escapeText(lastMessage.ko || "")}</small>` : ""}</span>
      ${lastMessage ? `<span class="kakao-preview-time">${escapeText(kakaoMessageTime(lastMessage))}</span>` : ""}
    </button>`;
  }).join("")}</div>`;
}

function renderSocial(id, tab) {
  if (id === "kakao") return renderKakaoApp(tab);
  if (id === "instagram") return selectInstagramTab(tab);
  if (["youtube", "netflix", "baemin"].includes(id)) return renderMediaApp(id, tab);
  const selected = SOCIAL_TABS[id].find((item) => item.id === tab);
  let content = "";
  content += `<h2 class="app-large-title">${escapeText(selected.text)}</h2>`;
  content += emptyState(id, ...SOCIAL_EMPTY[id][tab]);
  appContent.innerHTML = `<div class="app-stack"><div class="app-page">${content}</div><nav class="app-bottom-tabs" aria-label="${escapeText(PHONE_APPS[id].name)} 탭">${SOCIAL_TABS[id].map((item) => `<button type="button" data-social-tab="${item.id}" class="${item.id === tab ? "active" : ""}" aria-current="${item.id === tab ? "page" : "false"}">${escapeText(item.text)}</button>`).join("")}</nav></div>`;
}

function kakaoMessageBody(message) {
  if (!message.call) return renderBilingual(message);
  const video = message.call.type === "video";
  const direction = message.sender === "me" ? { ko: "발신 통화", zh: "呼出" } : { ko: "수신 통화", zh: "呼入" };
  const icon = video
    ? '<rect x="3" y="5" width="12" height="14" rx="3"/><path d="m15 10 6-4v12l-6-4Z"/>'
    : '<path d="m7 3 4 5-3 3c1 2 3 4 5 5l3-3 5 4-2 4C10 23 1 14 3 5Z"/>';
  return `<div class="kakao-call-card" data-call-type="${video ? "video" : "voice"}" data-call-status="${escapeText(message.call.status || "completed")}"><span class="kakao-call-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></span><div class="kakao-call-content"><div class="kakao-call-title">${renderBilingual(message)}</div><div class="kakao-call-detail">${renderBilingual(direction, { interactive: false })}${message.call.duration ? `<span class="kakao-call-duration">${escapeText(message.call.duration)}</span>` : ""}</div></div></div>`;
}

function kakaoChatMessageMarkup(chat, start) {
  const chatMessages = chat.messages || [];
  const hasMessageDates = chatMessages.some((message) => kakaoDateLabel(message.date));
  // 每批从当天第一条开始，避免同一天被拆开后丢失日期分隔条。
  let previousDate = "";
  const messageMarkup = chatMessages.slice(start).map((message, offset) => {
    const dateLabel = kakaoDateLabel(message.date);
    const separator = dateLabel && message.date.trim() !== previousDate
      ? renderKakaoDateSeparator(dateLabel) : "";
    if (dateLabel) previousDate = message.date.trim();
    const sender = kakaoPerson(message.senderId) || (chat.type === "group" ? { name: { ko: "친구" } } : chat);
    const messageTime = kakaoMessageTime(message);
    const recallMark = message.recalled ? '<span class="kakao-recall-mark" role="img" aria-label="삭제된 메시지 · 已撤回的消息">!</span>' : "";
    return `<div class="kakao-message-entry" data-kakao-message-index="${start + offset}">${separator}<div class="kakao-message ${message.sender === "me" ? "outgoing" : "incoming"}${message.recalled ? " is-recalled" : ""}">
      ${message.sender !== "me" ? kakaoAvatar(sender, "kakao-message-avatar") : ""}
      <div class="kakao-message-content">
        ${message.sender !== "me" ? `<p class="kakao-sender">${escapeText(kakaoName(sender))}</p>` : ""}
        <div class="kakao-message-line">${message.sender !== "me" ? recallMark : ""}<div class="kakao-bubble">${kakaoMessageBody(message)}</div>${message.sender === "me" ? recallMark : ""}<span class="kakao-message-time" aria-label="${messageTime === "·" ? "시간 미지정" : `보낸 시간 ${escapeText(messageTime)}`}">${escapeText(messageTime)}</span></div>
      </div>
    </div></div>`;
  });
  return `${start > 0 ? '<button class="kakao-history-loader" type="button" data-load-kakao-history aria-label="이전 대화 불러오기"><span aria-hidden="true">↓</span> 이전 대화</button>' : ""}${chat.dateLabel && !hasMessageDates ? renderKakaoDateSeparator(chat.dateLabel) : ""}${messageMarkup.join("")}`;
}

function kakaoHistoryBatchStart(messages, start) {
  let next = Math.max(0, start - 20);
  // 连续同一天的记录整批加载，不从一天的中间切开。
  while (next > 0 && (!kakaoDateLabel(messages[next].date) || messages[next].date === messages[next - 1].date)) next--;
  return next;
}

function loadKakaoHistory(log, reveal = 120) {
  if (activeApp !== "kakao" || !activeChatId || !log?.isConnected) return false;
  const start = Number(log.dataset.historyStart);
  if (!Number.isInteger(start) || start <= 0) return false;
  const chat = resolveKakaoChat(activeChatId);
  if (!chat) return false;
  const anchor = log.querySelector(`[data-kakao-message-index="${start}"]`);
  const oldOffset = anchor.getBoundingClientRect().top - log.getBoundingClientRect().top;
  const next = kakaoHistoryBatchStart(chat.messages, start);
  kakaoHistoryStarts.set(activeChatId, next);
  log.dataset.historyStart = String(next);
  log.innerHTML = kakaoChatMessageMarkup(chat, next);
  const newAnchor = log.querySelector(`[data-kakao-message-index="${start}"]`);
  const shift = newAnchor.getBoundingClientRect().top - log.getBoundingClientRect().top - oldOffset;
  // 旧记录插在顶部；沿着读者的下拉方向露出一小段，避免跳到整段历史开头。
  log.scrollTop = Math.max(0, log.scrollTop + shift - Math.min(reveal, log.clientHeight / 3));
  bindKakaoReadingProgress(log, chat);
  return true;
}

function bindKakaoHistoryLoading(log) {
  let previousTop = log.scrollTop;
  log.addEventListener("scroll", () => {
    const top = log.scrollTop;
    if (previousTop > 2 && top <= 2) loadKakaoHistory(log);
    previousTop = log.scrollTop;
  }, { passive: true });
  log.addEventListener("wheel", (event) => {
    if (log.scrollTop <= 2 && event.deltaY < -2 && loadKakaoHistory(log)) event.preventDefault();
  }, { passive: false });
  let pullStart = null;
  log.addEventListener("touchstart", (event) => {
    pullStart = log.scrollTop <= 2 && event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  log.addEventListener("touchmove", (event) => {
    if (!pullStart || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - pullStart.x;
    const dy = event.touches[0].clientY - pullStart.y;
    if (dy > 42 && dy > Math.abs(dx) && log.scrollTop <= 2) {
      pullStart = null;
      loadKakaoHistory(log);
    }
  }, { passive: true });
  log.addEventListener("touchend", () => { pullStart = null; }, { passive: true });
  log.addEventListener("touchcancel", () => { pullStart = null; }, { passive: true });
  log.addEventListener("keydown", (event) => {
    if (log.scrollTop <= 2 && ["ArrowUp", "PageUp", "Home"].includes(event.key) && loadKakaoHistory(log)) event.preventDefault();
  });
}

function renderStoryChat(id) {
  const chat = resolveKakaoChat(id);
  if (!chat) return renderSocial("kakao", "chats");
  activeChatId = id;
  appScreen.dataset.kakaoView = "detail";
  activeChatPanel = "conversation";
  const memberCount = chat.type === "group" ? new Set(chat.memberIds || []).size : 0;
  appTitle.innerHTML = `${escapeText(kakaoName(chat))}${memberCount ? `<span class="kakao-group-count">${memberCount}</span>` : ""}`;
  appBack.innerHTML = '‹ <span>채팅</span>';
  appBack.setAttribute("aria-label", "채팅 목록으로");
  setAppActions(memberCount ? '<button type="button" data-action="chat-members" aria-label="대화상대 보기">☷</button>' : "");
  const chatMessages = chat.messages || [];
  const initialStart = kakaoDateLabel(chat.historyBefore)
    ? Math.max(0, chatMessages.findIndex((message) => kakaoDateLabel(message.date) && message.date >= chat.historyBefore)) : 0;
  const unlocked = chat.revealOnIgComment && completedIgComments.has(chat.revealOnIgComment);
  const start = unlocked ? 0 : (kakaoHistoryStarts.get(id) ?? initialStart);
  const announcement = chat.type === "group" ? (typeof chat.announcement === "string" ? { ko: chat.announcement.trim(), zh: chat.announcementZh || "" } : chat.announcement) : null;
  appContent.innerHTML = `<div class="kakao-conversation">
    ${announcement?.ko || announcement?.zh ? `<aside class="kakao-announcement" aria-label="그룹 공지">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l11-5v16L8 15H4Z"/><path d="m8 15 2 6H6l-2-6M8 9v6"/></svg>
      <span class="kakao-announcement-label">공지</span>
      <p>${renderBilingual(announcement)}</p>
    </aside>` : ""}
    <div class="kakao-messages" aria-label="대화 내용" tabindex="0" data-history-start="${start}">
      ${kakaoChatMessageMarkup(chat, start)}
    </div>
    <div class="kakao-composer" aria-hidden="true"><span>＋</span><div>메시지</div><span>☺</span></div>
  </div>`;
  const messages = appContent.querySelector(".kakao-messages");
  messages.scrollTop = messages.scrollHeight;
  const focusComment = pendingKakaoFocus.get(id);
  if (focusComment) {
    const focusIndex = chatMessages.findIndex((message) => message.requiresIgComment === focusComment);
    const entry = messages.querySelector(`[data-kakao-message-index="${focusIndex}"]`);
    if (entry) messages.scrollTop += entry.getBoundingClientRect().top - messages.getBoundingClientRect().top - 12;
    pendingKakaoFocus.delete(id);
  }
  bindKakaoHistoryLoading(messages);
  bindKakaoReadingProgress(messages, chat);
}

function renderKakaoMembers() {
  const chat = resolveKakaoChat(activeChatId);
  if (!chat || chat.type !== "group") return;
  activeChatPanel = "members";
  const members = [...new Set(chat.memberIds || [])].map(kakaoPerson).filter(Boolean);
  appTitle.textContent = "대화상대";
  appBack.innerHTML = '‹ <span>채팅</span>';
  appBack.setAttribute("aria-label", "대화방으로");
  setAppActions();
  appContent.innerHTML = `<div class="app-page">
    <h2 class="kakao-members-title">${escapeText(kakaoName(chat))}</h2>
    <p class="kakao-list-caption">대화상대 <span>${members.length}</span></p>
    ${members.map((person) => `<div class="kakao-chat-row">${kakaoAvatar(person)}<span class="kakao-chat-summary"><strong>${escapeText(kakaoName(person))}</strong></span>${person.id === kakaoProfile.id ? '<span class="kakao-self-badge">나</span>' : ""}</div>`).join("")}
  </div>`;
}

// 应用内按钮统一从这里处理。
function handleAppClick(event) {
  if (event.target.closest("[data-load-kakao-history]")) {
    loadKakaoHistory(event.target.closest(".kakao-messages"));
    return;
  }
  const kakaoControl = event.target.closest("[data-kakao-ui]");
  if (kakaoControl) {
    const action = kakaoControl.dataset.kakaoUi;
    if (action === "search") { kakaoSearchOpen = !kakaoSearchOpen; kakaoSearchQuery = ""; renderKakaoApp(kakaoReturnTab); appContent.querySelector("#kakao-list-search")?.focus(); }
    else if (action === "settings") renderKakaoSettings();
    else if (action === "profile") showToast("새로운 프로필이 없습니다.");
    else if (action === "channel") showToast("추가한 채널이 없습니다.");
    else if (action === "add") showToast("새로운 친구가 없습니다.");
    else if (action === "invite") showToast("지금은 초대할 수 없습니다.");
    return;
  }
  const translationButton = event.target.closest("[data-toggle-translation]");
  if (translationButton) {
    const translation = translationButton.querySelector(".story-translation");
    translation.hidden = !translation.hidden;
    translationButton.setAttribute("aria-expanded", String(!translation.hidden));
    return;
  }

  const storyNoteButton = event.target.closest("[data-story-note-id]");
  if (storyNoteButton) return renderStoryNote(storyNoteButton.dataset.storyNoteId);

  const storyChatButton = event.target.closest("[data-story-chat-id]");
  if (storyChatButton) return renderStoryChat(storyChatButton.dataset.storyChatId);

  const contactButton = event.target.closest("[data-kakao-contact]");
  if (contactButton) {
    const contactId = contactButton.dataset.kakaoContact;
    const chat = storyChats.find((item) => item.contactId === contactId);
    return renderStoryChat(chat?.id || `contact:${contactId}`);
  }

  const noteButton = event.target.closest("[data-note-id]");
  if (noteButton) return renderNote(noteButton.dataset.noteId);

  const photoButton = event.target.closest("[data-photo]");
  if (photoButton) {
    const photo = PHONE_PHOTOS[Number(photoButton.dataset.photo)];
    if (!photo) return;
    appContent.innerHTML = `<img class="photo-detail" src="${escapeText(photo.src)}" alt="${escapeText(photo.alt)}">`;
    setAppActions('<button type="button" data-action="photos-grid">보관함</button>');
    return;
  }

  const tabButton = event.target.closest("[data-social-tab]");
  if (tabButton) {
    if (activeApp === "kakao") { kakaoSearchOpen = false; kakaoSearchQuery = ""; }
    return renderSocial(activeApp, tabButton.dataset.socialTab);
  }

  const dialButton = event.target.closest("[data-dial]");
  if (dialButton) {
    if (dialNumber.length < 20) dialNumber += dialButton.dataset.dial;
    document.querySelector("#dial-number").textContent = dialNumber;
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  switch (button.dataset.action) {
    case "new-note": createNote(); break;
    case "notes-list": renderNotes(); break;
    case "delete-note": {
      const index = notes.findIndex((note) => note.id === activeNoteId);
      if (index !== -1) notes.splice(index, 1);
      saveLocal("xunnian-phone.notes.v1", notes);
      renderNotes();
      break;
    }
    case "photos-grid": renderPhotos(); break;
    case "chat-members": renderKakaoMembers(); break;
    case "camera": showToast("아직 카메라가 연결되지 않았습니다"); break;
    case "call": showToast(dialNumber ? "연결할 수 없습니다" : "전화번호를 입력해 주세요"); break;
    case "dial-delete":
      dialNumber = dialNumber.slice(0, -1);
      document.querySelector("#dial-number").textContent = dialNumber;
      break;
    case "lock-phone":
      activeApp = null;
      activeNoteId = null;
      delete phoneContainer.dataset.app;
      resetPassword();
      showView("lock");
      break;
  }
}

appContent.addEventListener("click", handleAppClick);
appContent.addEventListener("input", (event) => {
  if (activeApp !== "notes" || !event.target.matches('[aria-label="메모 검색"]')) return;
  const query = event.target.value.trim().toLocaleLowerCase();
  let count = 0;
  appContent.querySelectorAll(".note-row").forEach((row) => {
    const note = row.dataset.storyNoteId ? storyNotes.find((item) => item.id === row.dataset.storyNoteId) : notes.find((item) => item.id === row.dataset.noteId);
    row.hidden = !!query && !JSON.stringify(note || {}).toLocaleLowerCase().includes(query);
    if (!row.hidden) count++;
  });
  appContent.querySelector(".notes-count").textContent = `${count}개의 메모`;
});
appContent.addEventListener("input", (event) => {
  if (activeApp !== "kakao" || event.target.id !== "kakao-list-search") return;
  kakaoSearchQuery = event.target.value;
  if (kakaoReturnTab === "friends") appContent.querySelector("#kakao-friend-results").innerHTML = kakaoFriendRows();
  else filterKakaoChatRows();
});
// 尚未放入头像时保留文字占位，放入图片后刷新即可自动显示。
appContent.addEventListener("load", (event) => {
  const image = event.target;
  if (image.tagName !== "IMG" || !image.parentElement?.classList.contains("kakao-avatar")) return;
  image.hidden = false;
  image.parentElement.querySelector(".kakao-avatar-fallback").hidden = true;
}, true);
appContent.addEventListener("error", (event) => {
  const image = event.target;
  if (image.tagName === "IMG" && image.parentElement?.classList.contains("kakao-avatar")) image.remove();
}, true);
appActions.addEventListener("click", handleAppClick);
appContent.addEventListener("change", (event) => {
  const setting = event.target.dataset.setting;
  if (!Object.hasOwn(settings, setting)) return;
  settings[setting] = event.target.checked;
  saveLocal("xunnian-phone.settings.v1", settings);
  applyPhoneSettings();
});
