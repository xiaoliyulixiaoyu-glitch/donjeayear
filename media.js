// 静态记录的显示。之后改剧情，只需编辑 media-content.js。
function mediaIcon(name) {
  const shapes = {
    play: '<path d="m9 5 11 7-11 7Z"/>',
    search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
    messages: '<path d="M21 11a9 9 0 0 1-9 9H4l2-4a9 9 0 1 1 15-5Z"/>',
    history: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6m3-4v6l4 2"/>',
    home: '<path d="m3 10 9-7 9 7v11h-6v-8H9v8H3Z"/>',
    heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z"/>',
    profile: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
    orders: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${shapes[name] || shapes.play}</svg>`;
}

function youtubeRecords(tab) {
  if (tab === "subscriptions") return `<div class="media-channel"><span>ALL<br>THE K-POP</span><div><strong>ALL THE K-POP</strong><p>TWS · DOHOON</p></div></div>${MEDIA_CONTENT.youtube.map(youtubeRecordCard).join("")}`;
  return `<header class="youtube-records-heading"><span class="media-user-avatar">D</span><strong>DOHOON</strong></header><h2 class="media-section-heading">${tab === "library" ? "시청 기록" : "다시 보기"}${mediaIcon("history")}</h2>${MEDIA_CONTENT.youtube.map(youtubeRecordCard).join("")}`;
}

function youtubeRecordCard(video) {
  return `<article class="youtube-record"><div class="youtube-record-image"><img src="${escapeText(video.cover)}" alt="${escapeText(video.title.ko)}" width="320" height="180" loading="lazy"><span aria-hidden="true">${mediaIcon("play")}</span></div><div class="youtube-record-copy"><h3>${renderBilingual(video.title, { interactive: false })}</h3><p>${escapeText(video.channel)} · ${escapeText(video.published)}</p><small>시청한 날짜 ${escapeText(storyDateLabel(video.watchedOn))}</small></div></article>`;
}

function netflixRecords(tab) {
  if (tab === "downloads") return '<div class="media-empty-record"><h2>저장한 콘텐츠</h2><p>저장한 콘텐츠가 없습니다.</p></div>';
  const shows = MEDIA_CONTENT.netflix.filter((show) => tab !== "list" || show.saved);
  return `<header class="netflix-records-heading"><span>DOHOON</span><h2>${tab === "list" ? "내가 찜한 리스트" : "이어서 시청하기"}</h2></header><div class="netflix-record-grid">${shows.map((show) => `<article class="netflix-record"><div class="netflix-poster"><img src="${escapeText(show.cover)}" alt="${escapeText(show.title.ko)}" width="360" height="520" loading="lazy"><b aria-hidden="true">N</b></div><h3>${renderBilingual(show.title, { interactive: false })}</h3><p>시즌 1 · ${show.episode}화</p><div class="netflix-progress" role="progressbar" aria-label="${escapeText(show.title.ko)} 시청 진행률" aria-valuenow="${show.progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${show.progress}%"></span></div></article>`).join("")}</div>`;
}

function foodOrderIcon(type) {
  // 餐食只用本地矢量示意，订单不调用真实外卖服务。
  const shapes = {
    gimbap: '<ellipse cx="26" cy="31" rx="17" ry="11" fill="#344b3b"/><ellipse cx="26" cy="28" rx="17" ry="11" fill="#f5efd9"/><path d="m16 27 8-7 11 7-8 7Z" fill="#efb64f"/><path d="m19 28 7-5 7 5-7 4Z" fill="#70a06f"/>',
    chicken: '<path d="m33 32 8 7m0 0 4-2m-4 2-1 5" stroke="#eee1bc" stroke-width="6"/><path d="M36 33c11-15-8-27-20-18C2 26 21 43 36 33Z" fill="#d99a43"/><path d="m16 22 6-4m1 15 6-4" stroke="#edb45c" stroke-width="3"/>',
    cutlet: '<ellipse cx="26" cy="29" rx="22" ry="17" fill="#fff"/><path d="M11 26c2-13 26-13 30 0s-6 15-15 15-17-3-15-15" fill="#c99146"/><path d="m19 18-2 19m10-21-2 23m10-21-3 18" stroke="#f7d293" stroke-width="2"/>',
  };
  return `<svg viewBox="0 0 52 52" aria-hidden="true">${shapes[type] || shapes.cutlet}</svg>`;
}

function baeminOrderCard(order) {
  return `<article class="baemin-order"><header><time>${escapeText(order.date.replaceAll("-", "."))} · ${escapeText(order.time)}</time><span>배달완료</span></header><div class="baemin-order-main"><span class="baemin-food-art">${foodOrderIcon(order.icon)}</span><div><h3>${renderBilingual(order.restaurant, { interactive: false })}</h3><p>${renderBilingual(order.menu, { interactive: false })}</p><strong>${new Intl.NumberFormat("ko-KR").format(order.amount)}원</strong></div></div><details><summary>주문 상세</summary><div class="baemin-order-detail"><small>요청사항</small>${renderBilingual(order.request, { interactive: false })}</div></details></article>`;
}

function baeminRecords(tab) {
  const orders = MEDIA_CONTENT.orders;
  if (tab === "my") return `<div class="baemin-profile"><span class="media-user-avatar">D</span><h2>DOHOON</h2><p>주문 ${orders.length}회 · 찜 ${orders.filter((order) => order.favorite).length}곳</p></div>${orders.slice(0, 1).map(baeminOrderCard).join("")}`;
  if (tab === "favorites") return `<h2 class="media-section-heading">찜한 가게</h2>${orders.filter((order) => order.favorite).map((order) => `<article class="baemin-favorite"><span class="baemin-food-art">${foodOrderIcon(order.icon)}</span><h3>${renderBilingual(order.restaurant, { interactive: false })}</h3><span class="baemin-heart">${mediaIcon("heart")}</span></article>`).join("")}`;
  return `${tab === "home" ? '<div class="baemin-home-banner"><span>배달의민족</span><h2>오늘도 맛있는 한 끼</h2></div>' : ""}<h2 class="media-section-heading">${tab === "home" ? "최근 주문" : "주문내역"}</h2>${orders.map(baeminOrderCard).join("")}`;
}

function renderMediaApp(id, tab) {
  const content = id === "youtube" ? youtubeRecords(tab) : id === "netflix" ? netflixRecords(tab) : baeminRecords(tab);
  const icons = { home: "home", subscriptions: "play", library: "profile", list: "heart", downloads: "orders", favorites: "heart", orders: "orders", my: "profile" };
  appContent.innerHTML = `<div class="media-records-shell ${id}-records"><div class="media-records-scroll">${content}</div><nav class="media-bottom-nav" aria-label="${escapeText(PHONE_APPS[id].name)} 탭">${SOCIAL_TABS[id].map((item) => `<button type="button" data-social-tab="${item.id}" aria-label="${item.text}"${item.id === tab ? ' aria-current="page"' : ""}>${mediaIcon(icons[item.id])}<span>${item.text}</span></button>`).join("")}</nav></div>`;
}
