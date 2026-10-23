// X 的外观和交互。剧情内容在 x-content.js 和 x-chats/，不连接真实 X 服务。
let xState = {};
const xSavedPreferences = readLocal("xunnian-phone.x.v1", {});
const xPreferences = {
  liked: Array.isArray(xSavedPreferences?.liked) ? xSavedPreferences.liked : [],
  reposted: Array.isArray(xSavedPreferences?.reposted) ? xSavedPreferences.reposted : [],
  bookmarked: Array.isArray(xSavedPreferences?.bookmarked) ? xSavedPreferences.bookmarked : [],
  notificationsEnabled: xSavedPreferences?.notificationsEnabled === true,
};
const X_NAV = [["home", "홈"], ["search", "검색"], ["grok", "Grok"], ["notifications", "알림"], ["messages", "채팅"]];
const X_EXPLORE = [["explore", "둘러보기"], ["trending", "트렌드"], ["news", "뉴스"], ["sports", "스포츠"], ["entertainment", "엔터테인먼트"]];
const X_ICON_PATHS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  notifications: '<path d="M5 16h14l-2-3V9A5 5 0 0 0 7 9v4Zm5 4h4"/>',
  messages: '<path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.3-4.5A9 9 0 1 1 21 11.5Z"/>',
  brand: '<path d="m4 3 16 18h-5L3 3h5l13 18M4 21 20 3"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  settings: '<path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 3 1 2-4-2-2V8l-3-1-1-4Z"/><circle cx="11.5" cy="11.5" r="3"/>',
  chevron: '<path d="m7 9 5 5 5-5"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z"/>',
  repost: '<path d="m3 8 4-4 4 4M7 4v13h9m5-1-4 4-4-4m4 4V7H8"/>',
  reply: '<path d="M21 11a9 9 0 0 1-9 9H4l2-4a9 9 0 1 1 15-5Z"/>',
  views: '<path d="M4 19V9M9 19V4M14 19v-7M19 19V7"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  share: '<path d="M12 16V3m-4 4 4-4 4 4M5 13v7h14v-7"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  history: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6m3-4v6l4 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 5 5 3-3 4 4"/>',
  send: '<path d="m3 3 18 9-18 9 4-9Zm4 9h14"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
};

function xIcon(name, filled = false) {
  if (name === "grok") return `<svg class="x-grok-mark" viewBox="0 0 32 32" fill="currentColor" stroke="none" aria-hidden="true"><path d="M24.9 7.5A11.5 11.5 0 0 0 6.8 21.4l2.9-2.5A7.7 7.7 0 0 1 22 10Z"/><path d="M7.1 24.5a11.5 11.5 0 0 0 18.1-13.9l-2.9 2.5A7.7 7.7 0 0 1 10 22Z"/><path d="M2 30 29.5 1 21 18.3Z"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${X_ICON_PATHS[name] || X_ICON_PATHS.more}</svg>`;
}

function xPrivacyMark(person) {
  return X_CONTENT.profile.protected && (person === X_CONTENT.profile || person?.own)
    ? `<span class="x-private-mark" role="img" aria-label="비공개 계정">${xIcon("lock")}</span>` : "";
}

function xAvatar(person = {}, large = false) {
  const initial = Array.from(person.name || "도훈")[0];
  return `<span class="x-avatar${large ? " is-large" : ""}"><span>${escapeText(initial)}</span>${person.avatar ? `<img src="${escapeText(person.avatar)}" alt="">` : ""}</span>`;
}

function xHandle(person) {
  return person.handle ? `@${String(person.handle).replace(/^@/, "")}` : "";
}

function openXApp() {
  // 离开 X 后重新打开，需要再次解锁聊天；不把解锁结果存入浏览器。
  xState = {
    tab: "home", feed: "forYou", explore: "explore", noticeTab: "all",
    query: "", dmQuery: "", dmFilter: "all", filterMenu: false,
    unlocked: false, thread: "", post: "", panel: "", drawer: false,
    bannerDismissed: false, composeDraft: "", grokDraft: "",
  };
  renderX();
}

function xEmpty(icon, title, description = "") {
  return `<div class="x-empty"><span class="x-empty-icon">${xIcon(icon)}</span><h2>${escapeText(title)}</h2>${description ? `<p>${escapeText(description)}</p>` : ""}</div>`;
}

function xHeader() {
  if (xState.thread || xState.post || xState.panel) {
    const chat = X_CONTENT.chats.find((item) => item.id === xState.thread);
    const titles = { compose: "게시물 작성", settings: "설정", profile: "프로필", bookmarks: "북마크", recipients: "새 메시지", history: "대화 기록" };
    return `<header class="x-header"><button class="x-icon-button" type="button" data-x-back aria-label="이전 화면">${xIcon(xState.panel === "compose" ? "close" : "back")}</button><h2>${escapeText(chat?.name || (xState.post ? "게시물" : titles[xState.panel] || "X"))}</h2>${xState.panel === "compose" ? '<button class="x-publish" type="submit" form="x-compose-form">게시하기</button>' : xState.thread ? `<button class="x-icon-button" type="button" data-x-lock aria-label="채팅 다시 잠그기">${xIcon("lock")}</button>` : '<span class="x-header-spacer"></span>'}</header>`;
  }
  const title = xState.tab === "notifications" ? "알림" : xState.tab === "messages" ? "채팅" : xState.tab === "grok" ? "Grok" : "";
  return `<header class="x-header"><button class="x-profile-button" type="button" data-x-profile aria-label="계정 메뉴">${xAvatar(X_CONTENT.profile)}</button>
    ${xState.tab === "search" ? `<form class="x-search-field" id="x-search-form">${xIcon("search")}<input id="x-search-input" type="search" placeholder="검색" aria-label="X 검색" value="${escapeText(xState.query)}" autocomplete="off"></form>` : title ? `<h2>${title}</h2>` : `<span class="x-brand" aria-label="X">${xIcon("brand")}</span>`}
    ${xState.tab === "messages" ? xState.unlocked ? `<button class="x-filter-button" type="button" data-x-filter-menu aria-expanded="${xState.filterMenu}">${xState.dmFilter === "all" ? "전체" : "읽지 않음"}${xIcon("chevron")}</button>` : '<span class="x-header-spacer"></span>' : xState.tab === "home" ? '<span class="x-header-spacer"></span>' : `<button class="x-icon-button" type="button" ${xState.tab === "grok" ? 'data-x-history aria-label="대화 기록"' : 'data-x-settings aria-label="설정"'}>${xIcon(xState.tab === "grok" ? "history" : "settings")}</button>`}
  </header>`;
}

function xSubnavigation() {
  if (xState.panel || xState.post || xState.thread) return "";
  if (xState.tab === "home") return `<div class="x-segment-row">${[["forYou", "추천"], ["following", "팔로우 중"]].map(([id, title]) => `<button type="button" data-x-feed="${id}" class="${xState.feed === id ? "active" : ""}" aria-pressed="${xState.feed === id}">${title}</button>`).join("")}<button class="x-segment-add" type="button" data-x-compose aria-label="게시물 작성">${xIcon("plus")}</button></div>`;
  if (xState.tab === "search") return `<div class="x-segment-row x-explore-tabs">${X_EXPLORE.map(([id, title]) => `<button type="button" data-x-explore="${id}" class="${xState.explore === id ? "active" : ""}" aria-pressed="${xState.explore === id}">${title}</button>`).join("")}</div>`;
  if (xState.tab === "notifications") return `<div class="x-segment-row">${[["all", "전체"], ["mentions", "멘션"]].map(([id, title]) => `<button type="button" data-x-notices="${id}" class="${xState.noticeTab === id ? "active" : ""}" aria-pressed="${xState.noticeTab === id}">${title}</button>`).join("")}</div>`;
  return "";
}

function xCount(value) {
  const n = Math.max(0, Number(value) || 0);
  return n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천` : String(n);
}

function xPostCard(post, detail = false) {
  const protectedPost = X_CONTENT.profile.protected && post.own;
  const action = (kind, label, count, enabled) => `<button type="button" data-x-post-action="${kind}" data-x-post-id="${escapeText(post.id)}" aria-label="${label}"${protectedPost && kind === "repost" ? " disabled" : ""}${typeof enabled === "boolean" ? ` aria-pressed="${enabled}"` : ""} class="${enabled ? "is-on" : ""} x-action-${kind}">${xIcon(kind === "like" ? "heart" : kind === "repost" ? "repost" : kind)}${count != null ? `<span>${xCount(count)}</span>` : ""}</button>`;
  const liked = xPreferences.liked.includes(post.id), reposted = xPreferences.reposted.includes(post.id), bookmarked = xPreferences.bookmarked.includes(post.id);
  const dateLabel = post.date ? storyDateLabel(post.date) : post.time || "";
  return `<article class="x-post" data-x-post-card="${escapeText(post.id)}">${xAvatar(post)}<div class="x-post-content"><button type="button" class="x-post-author" data-x-post="${escapeText(post.id)}" aria-label="게시물 보기"><strong>${escapeText(post.name || "사용자")}</strong>${xPrivacyMark(post)}${post.verified ? '<span class="x-verified" aria-label="인증 계정">✓</span>' : ""}<span>${escapeText(xHandle(post))}${dateLabel ? ` · ${escapeText(dateLabel)}` : ""}</span></button>
    <div class="x-post-open" data-x-post="${escapeText(post.id)}">${renderBilingual(post)}</div>
    ${post.image ? `<button class="x-post-media" type="button" data-x-post="${escapeText(post.id)}"><img src="${escapeText(post.image)}" alt="${escapeText(post.imageAlt || "게시물 이미지")}"></button>` : ""}
    <div class="x-post-actions">${action("reply", "답글 보기", post.comments?.length || post.replies || 0)}${action("repost", "재게시", (Number(post.reposts) || 0) + Number(reposted), reposted)}${action("like", "마음에 들어요", (Number(post.likes) || 0) + Number(liked), liked)}${action("views", "조회수", post.views || 0)}${action("bookmark", "북마크", null, bookmarked)}${action("share", "공유", null)}</div>
    ${detail ? '<p class="x-muted x-reply-caption">답글</p>' : ""}</div></article>`;
}

function xPostReplies(post) {
  return (post.comments || []).map((comment) => `<article class="x-post x-story-reply" data-x-reply="${escapeText(comment.id)}">${xAvatar(comment)}<div class="x-post-content"><div class="x-reply-author"><strong class="x-reply-name">${escapeText(comment.name || X_CONTENT.profile.name)}</strong>${xPrivacyMark(comment)}</div><span class="x-reply-to">${escapeText(post.name || X_CONTENT.profile.name)} 님에게 보내는 답글</span><div>${renderBilingual(comment)}</div></div></article>`).join("");
}

function xHome() {
  const posts = X_CONTENT.posts.filter((post) => xState.feed !== "following" || post.following);
  return posts.length ? posts.map((post) => xPostCard(post)).join("") : xEmpty("home", xState.feed === "following" ? "아직 게시물이 없습니다" : "X에 오신 것을 환영합니다", "새로운 게시물이 여기에 표시됩니다.");
}

function xSearchResults() {
  const query = xState.query.trim().toLocaleLowerCase();
  const posts = query ? X_CONTENT.posts.filter((post) => [post.ko, post.zh, post.name, post.handle].some((value) => String(value || "").toLocaleLowerCase().includes(query))) : [];
  const trends = X_CONTENT.trends.filter((trend) => (!query || String(trend.title || "").toLocaleLowerCase().includes(query)) && (xState.explore === "explore" || xState.explore === "trending" || trend.tab === xState.explore));
  if (query) return `<h3 class="x-section-title">검색 결과</h3>${posts.map((post) => xPostCard(post)).join("")}${trends.map(xTrendRow).join("")}${!posts.length && !trends.length ? xEmpty("search", "검색 결과가 없습니다", "다른 검색어로 다시 검색해 보세요.") : ""}`;
  return `<div class="x-explore-feature"><span>지금 일어나는 일</span><strong>새로운 이야기를<br>발견해 보세요.</strong><div class="x-explore-watermark">${xIcon("brand")}</div></div><h3 class="x-section-title">대한민국의 트렌드</h3>${trends.length ? trends.map(xTrendRow).join("") : '<div class="x-quiet-empty">아직 표시할 트렌드가 없습니다.</div>'}`;
}

function xTrendRow(trend, index) {
  return `<button class="x-trend" type="button" data-x-term="${escapeText(trend.title || "")}"><span>${index + 1} · ${escapeText(trend.category || "트렌드")}</span><strong>${renderBilingual({ ko: trend.title || "", zh: trend.titleZh || "" }, { interactive: false })}</strong>${trend.count ? `<small>${escapeText(trend.count)}</small>` : ""}<span class="x-trend-more">···</span></button>`;
}

function xNotifications() {
  const notices = X_CONTENT.notifications.filter((notice) => xState.noticeTab !== "mentions" || notice.type === "mention");
  return `${!xPreferences.notificationsEnabled && !xState.bannerDismissed ? `<aside class="x-notice-banner"><button class="x-icon-button" type="button" data-x-dismiss-banner aria-label="알림 안내 닫기">${xIcon("close")}</button><strong>알림이 꺼져 있습니다</strong><p>새로운 소식을 놓치지 마세요.</p><button class="x-mini-switch" type="button" role="switch" aria-checked="false" aria-label="앱 내 알림 표시" data-x-toggle-notifications></button></aside>` : ""}
    ${notices.length ? notices.map((notice) => `<div class="x-notice-row${notice.unread ? " is-unread" : ""}"><span class="x-notice-symbol">${xIcon(notice.type === "like" ? "heart" : notice.type === "follow" ? "profile" : "spark", true)}</span><div>${xAvatar(notice)}${notice.postId ? `<button class="x-notice-link" type="button" data-x-notice="${escapeText(notice.id)}">` : ""}<strong>${escapeText(notice.name || "X")} <span>· ${escapeText(notice.time || "·")}</span></strong>${notice.postId ? "</button>" : ""}<div class="x-notice-copy">${renderBilingual(notice)}</div></div></div>`).join("") : xEmpty("notifications", xState.noticeTab === "mentions" ? "아직 멘션이 없습니다" : "아직 알림이 없습니다", "새로운 소식이 여기에 표시됩니다.")}`;
}

function xGrok() {
  return `<div class="x-grok"><div class="x-grok-emblem">${xIcon("grok")}</div><div class="x-grok-bottom"><div class="x-grok-prompts">${[["질문하기", "궁금한 것이 있어요."], ["아이디어", "새로운 아이디어가 필요해요."], ["글쓰기", "글쓰기를 도와주세요."]].map(([label, prompt]) => `<button type="button" data-x-prompt="${prompt}">${xIcon("spark")}<strong>${label}</strong></button>`).join("")}</div><form id="x-grok-form" class="x-grok-composer"><textarea aria-label="Grok에게 질문" placeholder="무엇이든 물어보세요" rows="2">${escapeText(xState.grokDraft)}</textarea><div><span>Grok</span><button type="submit" aria-label="질문 보내기">${xIcon("send")}</button></div></form></div></div>`;
}

function xGate() {
  return `<div class="x-chat-gate"><span class="x-gate-lock">${xIcon("lock")}</span><h2>채팅 잠금 해제</h2><p>4자리 비밀번호를 입력하세요.</p><form id="x-unlock-form" novalidate><input id="x-dm-passcode" name="passcode" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" aria-label="채팅 비밀번호" aria-describedby="x-gate-error"><p id="x-gate-error" class="x-gate-error" role="alert"></p><button type="submit" class="x-black-button">잠금 해제</button></form></div>`;
}

function xInboxRows() {
  if (!xState.unlocked) return "";
  const query = xState.dmQuery.trim().toLocaleLowerCase();
  const chats = X_CONTENT.chats.filter((chat) => (xState.dmFilter !== "unread" || chat.unread) && (!query || [chat.name, chat.handle].some((text) => String(text || "").toLocaleLowerCase().includes(query))));
  return chats.length ? chats.map((chat) => {
    const last = chat.messages?.at(-1);
    return `<button class="x-inbox-row" type="button" data-x-thread="${escapeText(chat.id)}">${xAvatar(chat, true)}<span class="x-inbox-summary"><strong>${escapeText(chat.name)}</strong><span>${escapeText(last?.ko || "대화가 없습니다")}</span></span><span class="x-inbox-time">${escapeText(chat.time || last?.time || "·")}${chat.unread ? '<i aria-label="읽지 않음"></i>' : ""}</span></button>`;
  }).join("") : xEmpty("messages", query ? "검색 결과가 없습니다" : xState.dmFilter === "unread" ? "읽지 않은 대화가 없습니다" : "아직 대화가 없습니다", query ? "다른 이름으로 검색해 보세요." : "새로운 메시지가 여기에 표시됩니다.");
}

function xInbox() {
  if (!xState.unlocked) return xGate();
  return `<div class="x-inbox-search x-search-field">${xIcon("search")}<input type="search" aria-label="채팅 검색" placeholder="검색" value="${escapeText(xState.dmQuery)}"></div><div id="x-inbox-results">${xInboxRows()}</div>`;
}

function xThread() {
  if (!xState.unlocked) return xGate();
  const chat = X_CONTENT.chats.find((item) => item.id === xState.thread);
  if (!chat) return xInbox();
  let previousDate = "";
  const rows = (chat.messages || []).map((message) => {
    const date = kakaoDateLabel(message.date);
    const separator = date && message.date !== previousDate ? `<p class="x-thread-date">${escapeText(date)}</p>` : "";
    if (date) previousDate = message.date;
    return `${separator}<div class="x-message ${message.sender === "me" ? "outgoing" : "incoming"}"><div>${renderBilingual(message)}</div><small>${escapeText(kakaoMessageTime(message))}</small></div>`;
  }).join("");
  return `<div class="x-thread"><div class="x-thread-log"><div class="x-thread-person">${xAvatar(chat, true)}<strong>${escapeText(chat.name)}</strong><span>${escapeText(xHandle(chat))}</span></div>${rows}</div><div class="x-thread-composer"><span>${xIcon("image")}</span><span>메시지</span><span>${xIcon("send")}</span></div></div>`;
}

function xProfile() {
  const person = X_CONTENT.profile;
  const posts = X_CONTENT.posts.filter((post) => post.own === true);
  return `<div class="x-profile-cover"></div><section class="x-profile-page">${xAvatar(person, true)}<h2>${escapeText(person.name)}${xPrivacyMark(person)}</h2><p class="x-muted">${escapeText(xHandle(person))}</p><div class="x-profile-bio">${renderBilingual(person.bio)}</div>${person.protected ? '<p class="x-private-label">비공개 계정</p>' : ""}<div class="x-profile-stats"><span><strong>0</strong> 팔로잉</span><span><strong>0</strong> 팔로워</span></div></section><div class="x-profile-post-label">게시물</div>${posts.length ? posts.map((post) => xPostCard(post)).join("") : xEmpty("profile", "아직 게시물이 없습니다")}`;
}

function xPanel() {
  if (xState.panel === "compose") return `<form id="x-compose-form" class="x-compose-page">${xAvatar(X_CONTENT.profile)}<textarea aria-label="게시물 내용" placeholder="무슨 일이 일어나고 있나요?" maxlength="1000">${escapeText(xState.composeDraft)}</textarea><div class="x-compose-tools">${xIcon("image")}<span>모든 사람이 답글을 달 수 있습니다</span></div></form>`;
  if (xState.panel === "profile") return xProfile();
  if (xState.panel === "bookmarks") {
    const posts = X_CONTENT.posts.filter((post) => xPreferences.bookmarked.includes(post.id));
    return posts.length ? posts.map((post) => xPostCard(post)).join("") : xEmpty("bookmark", "아직 저장한 게시물이 없습니다", "게시물을 북마크하면 여기에 표시됩니다.");
  }
  if (xState.panel === "settings") return `<div class="x-settings-page"><h2>알림</h2><div><span>앱 내 알림 표시</span><button class="x-mini-switch${xPreferences.notificationsEnabled ? " is-on" : ""}" type="button" role="switch" aria-checked="${xPreferences.notificationsEnabled}" aria-label="앱 내 알림 표시" data-x-toggle-notifications></button></div><h2>채팅</h2><button class="x-settings-lock" type="button" data-x-lock>${xIcon("lock")} 채팅 잠그기</button></div>`;
  if (xState.panel === "recipients") return xState.unlocked ? (X_CONTENT.chats.length ? X_CONTENT.chats.map((chat) => `<button class="x-inbox-row" type="button" data-x-thread="${escapeText(chat.id)}">${xAvatar(chat)}<strong>${escapeText(chat.name)}</strong></button>`).join("") : xEmpty("messages", "대화 상대가 없습니다")) : xGate();
  return xEmpty("history", "대화 기록이 없습니다");
}

function xDrawer() {
  return `<div class="x-drawer-wrap"><button class="x-drawer-backdrop" type="button" data-x-close-drawer aria-label="메뉴 닫기"></button><aside class="x-drawer" role="dialog" aria-label="계정 메뉴"><button class="x-drawer-profile" type="button" data-x-panel="profile">${xAvatar(X_CONTENT.profile, true)}<strong>${escapeText(X_CONTENT.profile.name)}${xPrivacyMark(X_CONTENT.profile)}</strong><small>${escapeText(xHandle(X_CONTENT.profile))}</small></button><div class="x-profile-stats"><span><strong>0</strong> 팔로잉</span><span><strong>0</strong> 팔로워</span></div><button type="button" data-x-panel="profile">${xIcon("profile")} 프로필</button><button type="button" data-x-panel="bookmarks">${xIcon("bookmark")} 북마크</button><button type="button" data-x-panel="settings">${xIcon("settings")} 설정</button><button type="button" data-x-go-home>${xIcon("home")} 홈 화면으로</button></aside></div>`;
}

function renderX(keepScroll = false) {
  const scroll = keepScroll ? appContent.querySelector(".x-main")?.scrollTop || 0 : 0;
  appTitle.textContent = "X";
  let content;
  if (xState.thread) content = xThread();
  else if (xState.post) {
    const post = X_CONTENT.posts.find((item) => item.id === xState.post);
    content = post ? xPostCard(post, true) + xPostReplies(post) : xEmpty("reply", "게시물이 없습니다");
  } else if (xState.panel) content = xPanel();
  else if (xState.tab === "home") content = xHome();
  else if (xState.tab === "search") content = `<div id="x-search-results">${xSearchResults()}</div>`;
  else if (xState.tab === "notifications") content = xNotifications();
  else if (xState.tab === "grok") content = xGrok();
  else content = xInbox();
  const canCompose = !xState.thread && !xState.post && !xState.panel && ["home", "search", "notifications"].includes(xState.tab);
  const newMessage = xState.tab === "messages" && xState.unlocked && !xState.thread && !xState.panel;
  appContent.innerHTML = `<div class="x-shell${xState.thread ? " is-thread" : ""}">${xHeader()}${xSubnavigation()}${xState.filterMenu && xState.unlocked ? '<div class="x-filter-menu"><button type="button" data-x-dm-filter="all">전체</button><button type="button" data-x-dm-filter="unread">읽지 않음</button></div>' : ""}<div class="x-main">${content}</div>${canCompose || newMessage ? `<button class="x-compose-fab" type="button" ${newMessage ? 'data-x-new-message aria-label="새 메시지"' : 'data-x-compose aria-label="게시물 작성"'}>${xIcon(newMessage ? "messages" : "plus")}</button>` : ""}<nav class="x-bottom-nav" aria-label="X 탐색">${X_NAV.map(([id, label]) => `<button type="button" data-x-tab="${id}" aria-label="${label}"${xState.tab === id ? ' aria-current="page"' : ""}>${xIcon(id, xState.tab === id && ["home", "notifications", "messages"].includes(id))}${id === "notifications" && X_CONTENT.notifications.some((notice) => notice.unread) ? '<i class="x-nav-dot"></i>' : ""}</button>`).join("")}</nav>${xState.drawer ? xDrawer() : ""}</div>`;
  appContent.querySelector(".x-main").scrollTop = scroll;
  const log = appContent.querySelector(".x-thread-log");
  if (log) log.scrollTop = log.scrollHeight;
}

function xGoBack() {
  if (xState.drawer) xState.drawer = false;
  else if (xState.panel) xState.panel = "";
  else if (xState.thread) xState.thread = "";
  else if (xState.post) xState.post = "";
  else if (xState.tab === "messages" && !xState.unlocked) xState.tab = "home";
  else return false;
  renderX();
  return true;
}

appContent.addEventListener("click", (event) => {
  if (activeApp !== "x") return;
  const button = event.target.closest("button") || event.target.closest("[data-x-post]");
  if (!button) return;
  const data = button.dataset;
  if ("xTab" in data) { xState.tab = data.xTab; xState.thread = ""; xState.post = ""; xState.panel = ""; xState.filterMenu = false; xState.drawer = false; }
  else if ("xProfile" in data) xState.drawer = true;
  else if ("xCloseDrawer" in data) xState.drawer = false;
  else if ("xGoHome" in data) return goHome();
  else if ("xBack" in data) { if (!xGoBack()) goHome(); return; }
  else if ("xFeed" in data) xState.feed = data.xFeed;
  else if ("xExplore" in data) xState.explore = data.xExplore;
  else if ("xNotices" in data) xState.noticeTab = data.xNotices;
  else if ("xCompose" in data) xState.panel = "compose";
  else if ("xPanel" in data) { xState.panel = data.xPanel; xState.drawer = false; }
  else if ("xSettings" in data) xState.panel = "settings";
  else if ("xHistory" in data) xState.panel = "history";
  else if ("xPrompt" in data) { xState.grokDraft = data.xPrompt; renderX(); appContent.querySelector("#x-grok-form textarea").focus(); return; }
  else if ("xToggleNotifications" in data) { xPreferences.notificationsEnabled = !xPreferences.notificationsEnabled; saveLocal("xunnian-phone.x.v1", xPreferences); }
  else if ("xDismissBanner" in data) xState.bannerDismissed = true;
  else if ("xLock" in data) { xState.unlocked = false; xState.thread = ""; xState.dmQuery = ""; xState.panel = ""; xState.tab = "messages"; }
  else if ("xFilterMenu" in data && xState.unlocked) xState.filterMenu = !xState.filterMenu;
  else if ("xDmFilter" in data && xState.unlocked) { xState.dmFilter = data.xDmFilter; xState.filterMenu = false; }
  else if ("xNewMessage" in data && xState.unlocked) xState.panel = "recipients";
  else if ("xThread" in data && xState.unlocked) { xState.thread = data.xThread; xState.panel = ""; }
  else if ("xPost" in data) xState.post = data.xPost;
  else if ("xTerm" in data) xState.query = data.xTerm;
  else if ("xNotice" in data) {
    const notice = X_CONTENT.notifications.find((item) => item.id === data.xNotice);
    if (!notice?.postId) return;
    xState.post = notice.postId;
  } else if ("xPostAction" in data) {
    const key = { like: "liked", repost: "reposted", bookmark: "bookmarked" }[data.xPostAction];
    if (key) {
      const values = new Set(xPreferences[key]);
      values.has(data.xPostId) ? values.delete(data.xPostId) : values.add(data.xPostId);
      xPreferences[key] = [...values];
      saveLocal("xunnian-phone.x.v1", xPreferences);
      renderX(true);
      return;
    }
    if (data.xPostAction === "reply" || data.xPostAction === "views") xState.post = data.xPostId;
    else return showToast("공유할 수 있는 링크가 없습니다.");
  } else return;
  renderX();
});

appContent.addEventListener("input", (event) => {
  if (activeApp !== "x") return;
  if (event.target.id === "x-search-input") {
    xState.query = event.target.value;
    appContent.querySelector("#x-search-results").innerHTML = xSearchResults();
  } else if (event.target.matches('[aria-label="채팅 검색"]') && xState.unlocked) {
    xState.dmQuery = event.target.value;
    appContent.querySelector("#x-inbox-results").innerHTML = xInboxRows();
  } else if (event.target.closest("#x-compose-form")) xState.composeDraft = event.target.value;
  else if (event.target.closest("#x-grok-form")) xState.grokDraft = event.target.value;
});

appContent.addEventListener("submit", (event) => {
  if (activeApp !== "x") return;
  event.preventDefault();
  if (event.target.id === "x-unlock-form") {
    const input = event.target.querySelector("input");
    if (!/^\d{4}$/.test(input.value) || input.value !== X_CONTENT.dmPasscode) {
      appContent.querySelector("#x-gate-error").textContent = "비밀번호가 올바르지 않습니다.";
      input.setAttribute("aria-invalid", "true");
      input.value = "";
      input.focus();
      return;
    }
    xState.unlocked = true;
    xState.thread = "";
    renderX();
  } else if (event.target.id === "x-compose-form") showToast(xState.composeDraft.trim() ? "지금은 게시할 수 없습니다." : "내용을 입력해 주세요.");
  else if (event.target.id === "x-grok-form") showToast("지금은 Grok을 사용할 수 없습니다.");
});

appContent.addEventListener("error", (event) => {
  if (event.target.tagName === "IMG" && event.target.parentElement?.classList.contains("x-avatar")) event.target.remove();
}, true);
