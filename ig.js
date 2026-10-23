// Instagram 的本地剧情界面；数据在 ig-content.js，图片在 assets/instagram/。
let igState = {};
const igSaved = readLocal("xunnian-phone.instagram.v1", {});
const igPreferences = {
  liked: Array.isArray(igSaved?.liked) ? igSaved.liked : [],
  saved: Array.isArray(igSaved?.saved) ? igSaved.saved : [],
  comments: Array.isArray(igSaved?.comments) ? igSaved.comments.filter((id) => typeof id === "string") : [],
};

function igIcon(name, filled = false) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v11h-6v-8H9v8H3Z"/>',
    heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z"/>',
    bookmark: '<path d="M5 3h14v18l-7-5-7 5Z"/>',
    profile: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="9" r="3"/><path d="M5 19a7 7 0 0 1 14 0"/>',
    comment: '<path d="M21 11a9 9 0 0 1-9 9H4l2-4a9 9 0 1 1 15-5Z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 5 5 3-3 4 4"/>',
    search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
    grid: '<path d="M3 3h18v18H3Zm6 0v18m6-18v18M3 9h18M3 15h18"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="m11 13 11-11"/>',
    reels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m10 8 6 4-6 4Z"/>',
    plus: '<path d="M12 3v18M3 12h18"/>',
    menu: '<path d="M3 5h18M3 12h18M3 19h18"/>',
    chevron: '<path d="m7 9 5 5 5-5"/>',
    camera: '<rect x="2" y="6" width="20" height="15" rx="4"/><path d="m7 6 2-3h6l2 3"/><circle cx="12" cy="13" r="4"/>',
    tag: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="m8 5 4-3 4 3"/><circle cx="12" cy="11" r="2.5"/><path d="M7 19v-1a5 5 0 0 1 10 0v1"/>',
    repost: '<path d="m3 8 4-4 4 4M7 4v13h9m5-1-4 4-4-4m4 4V7H8"/>',
    compose: '<path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M15 3l3-2 4 4-2 3-10 10-5 1 1-5Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',
    personAdd: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M20 8v8m-4-4h8"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.image}</svg>`;
}

function igPerson(id) {
  return id === IG_CONTENT.profile.id ? IG_CONTENT.profile : IG_CONTENT.following.find((person) => person.id === id);
}

function igName(person) {
  return typeof person?.name === "string" ? person.name : person?.name?.ko || person?.handle || "";
}

function igAvatar(person = {}) {
  const initial = Array.from(person.handle || "i")[0].toUpperCase();
  return `<span class="ig-avatar">${person.avatar ? `<span>${escapeText(initial)}</span>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg>`}${person.avatar ? `<img src="${escapeText(person.avatar)}" alt="" loading="lazy" decoding="async">` : ""}</span>`;
}

function openInstagram() {
  igState = { composing: false, tab: "home", account: "", post: "", following: false, accountReturnFollowing: false, query: "", commentsPost: "", commentPrepared: false, storyId: "", storySlide: 0, thread: "", threadReturnAccount: "" };
  renderInstagram();
}

function selectInstagramTab(tab) {
  if (!["home", "messages", "profile", "saved"].includes(tab)) return;
  igState = { ...igState, composing: false, tab, account: "", post: "", following: false, accountReturnFollowing: false, query: "", commentsPost: "", commentPrepared: false, storyId: "", storySlide: 0, thread: "", threadReturnAccount: "" };
  renderInstagram();
}

function igPhoto(photo, index) {
  return `<div class="ig-photo"><span class="ig-photo-placeholder" role="img" aria-label="${escapeText(photo.altZh || photo.alt || "사진")}">${igIcon("image")}</span><img src="${escapeText(photo.src)}" alt="${escapeText(photo.alt || "사진")}" width="600" height="600" loading="lazy" decoding="async" data-ig-photo="${index}"></div>`;
}

function igPost(post) {
  const person = igPerson(post.accountId) || {};
  const liked = igPreferences.liked.includes(post.id), saved = igPreferences.saved.includes(post.id);
  const photos = post.photos || [];
  const comments = igPostComments(post);
  return `<article class="ig-post"><header><button type="button" class="ig-post-person" data-ig-account="${escapeText(person.id)}">${igAvatar(person)}<strong>${escapeText(person.handle)}</strong></button>${post.local ? `<button type="button" class="ig-local-post-delete" data-ig-delete-post="${escapeText(post.id)}" aria-label="내 게시물 삭제">${igIcon("close")}</button>` : '<span class="ig-post-more" aria-hidden="true">···</span>'}</header>
    <div class="ig-media" data-ig-media>${photos.length ? photos.map(igPhoto).join("") : `<div class="ig-photo"><span class="ig-photo-placeholder">${igIcon("image")}</span></div>`}</div>
    ${photos.length > 1 ? `<div class="ig-photo-dots" aria-label="사진 ${photos.length}장">${photos.map((_, index) => `<i${index === 0 ? ' class="active"' : ""}></i>`).join("")}</div>` : ""}
    <div class="ig-post-tools"><button type="button" data-ig-like="${escapeText(post.id)}" aria-label="좋아요" aria-pressed="${liked}" class="${liked ? "is-liked" : ""}">${igIcon("heart", liked)}</button><button type="button" data-ig-comments="${escapeText(post.id)}" aria-label="댓글 보기">${igIcon("comment")}</button><button type="button" data-ig-save="${escapeText(post.id)}" aria-label="저장" aria-pressed="${saved}">${igIcon("bookmark", saved)}</button></div>
    <div class="ig-caption"><button type="button" data-ig-account="${escapeText(person.id)}">${escapeText(person.handle)}</button>${post.caption?.original ? `<p class="ig-original-caption" lang="en">${escapeText(post.caption.original)}</p>` : ""}<div class="ig-caption-bilingual">${renderBilingual(post.caption)}</div>${comments.length ? `<button class="ig-view-comments" type="button" data-ig-comments="${escapeText(post.id)}">댓글 ${comments.length}개 모두 보기</button><div class="ig-inline-comment"><strong>${escapeText(igPerson(comments[0].accountId)?.handle || "")}</strong>${renderBilingual(comments[0], { interactive: false })}</div>` : ""}${post.date ? `<time>${escapeText(kakaoDateLabel(post.date))}</time>` : ""}</div></article>`;
}

function igPostComments(post) {
  const comments = [...(post.comments || [])];
  if (post.commentPrompt && igPreferences.comments.includes(post.commentPrompt.id)) comments.push(post.commentPrompt);
  return comments;
}

function igStoryTray() {
  const stories = [{ id: "own-story", accountId: IG_CONTENT.profile.id, slides: [] }, ...(IG_CONTENT.stories || [])];
  return `<div class="ig-story-tray" aria-label="스토리">${stories.map((story) => {
    const person = igPerson(story.accountId);
    const own = story.accountId === IG_CONTENT.profile.id;
    return `<button type="button" class="ig-story-circle${story.slides?.length ? " has-slides" : ""}" data-ig-story="${escapeText(story.id)}" aria-label="${own ? "내" : escapeText(person?.handle || "")} 스토리 보기"><span class="ig-story-ring">${igAvatar(person)}${own ? `<i class="ig-own-story-add" aria-hidden="true">${igIcon("plus")}</i>` : ""}</span><span>${own ? "내 스토리" : escapeText(person?.handle || "")}</span></button>`;
  }).join("")}</div>`;
}

function igStoryViewer() {
  const story = (IG_CONTENT.stories || []).find((item) => item.id === igState.storyId);
  const person = igPerson(story?.accountId || IG_CONTENT.profile.id);
  const slides = story?.slides || [];
  const slide = slides[igState.storySlide];
  return `<section class="ig-story-viewer" role="dialog" aria-modal="true" aria-label="${escapeText(person?.handle || "")} 스토리"><div class="ig-story-progress" aria-label="${slides.length ? `${igState.storySlide + 1} / ${slides.length}` : "스토리 없음"}">${slides.map((_, i) => `<i class="${i <= igState.storySlide ? "is-viewed" : ""}"></i>`).join("")}</div><header>${igAvatar(person)}<strong>${escapeText(person?.handle || "")}</strong><button type="button" data-ig-close-story aria-label="스토리 닫기">${igIcon("close")}</button></header>${slide ? `${slide.src ? `<img class="ig-story-photo" src="${escapeText(slide.src)}" alt="${escapeText(slide.alt || "스토리 사진")}">` : ""}${slide.caption ? `<div class="ig-story-caption">${renderBilingual(slide.caption, { interactive: false })}</div>` : ""}${igState.storySlide > 0 ? '<button type="button" class="ig-story-prev" data-ig-story-step="-1" aria-label="이전 스토리">‹</button>' : ""}${igState.storySlide < slides.length - 1 ? '<button type="button" class="ig-story-next" data-ig-story-step="1" aria-label="다음 스토리">›</button>' : ""}` : `<div class="ig-story-empty">${igIcon("image")}<p>아직 스토리가 없습니다.</p></div>`}</section>`;
}

function igCommentsSheet() {
  const post = igAllPosts().find((item) => item.id === igState.commentsPost);
  if (!post) return "";
  const comments = igPostComments(post);
  const prompt = post.commentPrompt;
  const posted = !!prompt && igPreferences.comments.includes(prompt.id);
  return `<div class="ig-comments-overlay"><button class="ig-comments-backdrop" type="button" data-ig-close-comments aria-label="댓글 닫기"></button><section class="ig-comments-sheet" role="dialog" aria-modal="true" aria-label="댓글"><span class="ig-sheet-grip" aria-hidden="true"></span><header><h2>댓글</h2><button type="button" data-ig-close-comments aria-label="닫기">${igIcon("close")}</button></header><div class="ig-comments-list">${comments.length ? comments.map((comment) => `<article class="ig-comment-row">${igAvatar(igPerson(comment.accountId))}<div><strong>${escapeText(igPerson(comment.accountId)?.handle || "")}</strong>${renderBilingual(comment)}<small>방금</small></div></article>`).join("") : '<p class="ig-comments-empty">아직 댓글이 없습니다.</p>'}</div><div class="ig-comment-composer">${igAvatar(IG_CONTENT.profile)}${posted ? '<span class="ig-comment-sent">댓글을 남겼습니다.</span>' : prompt ? `<button class="ig-comment-draft" type="button" data-ig-prepare-comment aria-label="댓글 달기">${igState.commentPrepared ? renderBilingual(prompt, { interactive: false }) : '<span>댓글 달기...</span>'}</button><button class="ig-comment-send" type="button" data-ig-send-comment${igState.commentPrepared ? "" : " disabled"}>게시</button>` : '<span class="ig-comment-sent">지금은 댓글을 달 수 없습니다.</span>'}</div></section></div>`;
}

function igFollowingRows() {
  const query = igState.query.trim().toLocaleLowerCase();
  const people = IG_CONTENT.following.filter((person) => [person.handle, igName(person), person.name?.zh].some((text) => String(text || "").toLocaleLowerCase().includes(query)));
  return people.map((person) => `<div class="ig-follow-row"><button type="button" data-ig-account="${escapeText(person.id)}">${igAvatar(person)}<span><strong>${escapeText(person.handle)}</strong><span class="ig-person-name">${renderBilingual(person.name, { interactive: false })}</span></span></button><span class="ig-follow-status">${person.followsYou ? "맞팔로우" : "팔로잉"}</span></div>`).join("") || '<p class="ig-empty">검색 결과가 없습니다.</p>';
}

function igProfile(person) {
  const own = person.id === IG_CONTENT.profile.id;
  const posts = igAllPosts().filter((post) => post.accountId === person.id);
  return `<section class="ig-profile"><div class="ig-profile-top"><div class="ig-profile-avatar">${igAvatar(person)}${own ? `<span class="ig-avatar-add" aria-hidden="true">${igIcon("plus")}</span>` : ""}</div><div class="ig-profile-info"><div class="ig-profile-name">${renderBilingual(person.name)}</div><div class="ig-stats"><span><strong>${posts.length}</strong>게시물</span><span><strong>${person.followers ?? (own ? IG_CONTENT.following.filter((account) => account.followsYou).length : "—")}</strong>팔로워</span>${own ? `<button type="button" data-ig-following aria-label="팔로잉 ${IG_CONTENT.following.length}"><strong>${IG_CONTENT.following.length}</strong>팔로잉</button>` : `<span><strong>${person.followingCount ?? "—"}</strong>팔로잉</span>`}</div></div></div>${person.bio?.ko || person.bio?.zh ? `<div class="ig-profile-bio">${renderBilingual(person.bio)}</div>` : ""}<div class="ig-profile-actions">${own ? `<button type="button" disabled>프로필 편집</button><button type="button" disabled>프로필 공유</button><button type="button" disabled aria-label="사람 찾기">${igIcon("personAdd")}</button>` : `<span>${person.followsYou ? "맞팔로우 중" : "팔로잉"} ${igIcon("chevron")}</span><button type="button" data-ig-open-dm="${escapeText(person.id)}">메시지</button>`}</div>${own ? `<div class="ig-profile-utilities"><button type="button" data-ig-tab="saved">${igIcon("bookmark")}저장됨</button></div>` : ""}</section><div class="ig-profile-tabs" aria-label="프로필 게시물"><span aria-current="page" aria-label="게시물">${igIcon("grid")}</span><span aria-disabled="true" aria-label="재게시">${igIcon("repost")}</span><span aria-disabled="true" aria-label="태그됨">${igIcon("tag")}</span></div>${posts.length ? `<div class="ig-profile-grid">${posts.map((post) => `<button type="button" data-ig-post="${escapeText(post.id)}" aria-label="${escapeText(post.caption?.original || post.caption?.ko || "게시물 보기")}">${post.photos?.[0] ? igPhoto(post.photos[0], 0) : igIcon("image")}</button>`).join("")}</div>` : `<div class="ig-profile-empty"><button type="button" data-ig-create-post aria-label="새 게시물 만들기">${igIcon("camera")}</button><h3>아직 게시물이 없습니다</h3></div>`}`;
}

function igDmList() {
  return `<div class="ig-dm-notes"><div class="ig-dm-note"><span class="ig-note-bubble">메모...</span>${igAvatar(IG_CONTENT.profile)}<span>내 메모</span></div><div class="ig-dm-note"><span class="ig-map-orb">${igIcon("globe")}</span><span>지도</span></div></div><div class="ig-dm-section"><h2>메시지</h2><span>요청</span></div><div class="ig-inbox">${(IG_CONTENT.chats || []).map((chat) => { const person = igPerson(chat.accountId); const last = igVisibleDmMessages(chat).at(-1); return `<button type="button" class="ig-dm-row" data-ig-thread="${escapeText(chat.id)}">${igAvatar(person)}<span><strong>${escapeText(person?.handle || "")}</strong><small>${escapeText(last?.ko || "대화 시작하기")}</small></span>${chat.unread ? '<i aria-label="읽지 않음"></i>' : ""}</button>`; }).join("") || '<p class="ig-empty">메시지가 없습니다.</p>'}</div>`;
}

function igDmThread() {
  const chat = (IG_CONTENT.chats || []).find((item) => item.id === igState.thread);
  const person = igPerson(chat?.accountId || igState.threadReturnAccount);
  let previousDate = "";
  const rows = igVisibleDmMessages(chat).map((message) => {
    const date = message.date && message.date !== previousDate ? `<p class="ig-dm-date">${escapeText(storyDateLabel(message.date))}</p>` : "";
    if (message.date) previousDate = message.date;
    return `${date}<div class="ig-dm-message${message.sender === "me" ? " outgoing" : ""}"><div>${message.sharedPost ? igSharedPostCard(message.sharedPost) : renderBilingual(message)}</div><time>${escapeText(kakaoMessageTime(message))}</time></div>`;
  }).join("");
  return `<section class="ig-dm-thread"><div class="ig-dm-log"><div class="ig-dm-person">${igAvatar(person)}<strong>${escapeText(person?.handle || "")}</strong><span>${renderBilingual(person?.name || "", { interactive: false })}</span></div>${rows}</div>${igDmComposer(chat)}</section>`;
}

function renderInstagram(keepScroll = false) {
  const oldScroll = keepScroll ? appContent.querySelector(".ig-main")?.scrollTop || 0 : 0;
  const own = IG_CONTENT.profile;
  const person = igPerson(igState.account) || own;
  const inProfile = igState.account || igState.tab === "profile";
  const inDm = igState.tab === "messages" || igState.thread;
  const threadPerson = igPerson((IG_CONTENT.chats || []).find((chat) => chat.id === igState.thread)?.accountId || igState.threadReturnAccount);
  const title = igState.composing ? "새 게시물" : igState.thread ? threadPerson?.handle || "메시지" : igState.following ? "팔로잉" : igState.post ? "게시물" : inProfile ? person.handle : inDm ? own.handle : igState.tab === "saved" ? "저장됨" : "Instagram";
  appTitle.innerHTML = `<span class="${title === "Instagram" ? "ig-wordmark" : "ig-account-title"}">${escapeText(title)}</span>${!igState.thread && !igState.following && !igState.post && (inProfile || inDm) ? igIcon("chevron") : ""}`;
  const nested = igState.composing || igState.following || igState.account || igState.post || igState.thread;
  appBack.innerHTML = '‹';
  appBack.setAttribute("aria-label", nested ? "이전 화면" : "返回主屏幕");
  setAppActions(`${!nested && !inDm && igState.tab !== "saved" ? `<button type="button" class="ig-toolbar-icon" data-ig-create-post aria-label="새 게시물 만들기">${igIcon("plus")}</button>` : ""}<button class="ig-toolbar-icon" type="button" disabled aria-label="${inDm ? "새 메시지" : inProfile ? "메뉴" : "알림"}">${igIcon(inDm ? "compose" : inProfile ? "menu" : "heart")}</button>`);
  let content;
  if (igState.composing) content = igPostComposer();
  else if (igState.thread) content = igDmThread();
  else if (igState.following) content = `<div class="ig-following-header"><strong>${escapeText(own.handle)}</strong><span>${IG_CONTENT.following.length}명 팔로잉</span></div><label class="ig-search">${igIcon("search")}<input type="search" aria-label="팔로잉 검색" placeholder="검색" value="${escapeText(igState.query)}"></label><div id="ig-following-results">${igFollowingRows()}</div>`;
  else if (igState.post) {
    const post = igAllPosts().find((item) => item.id === igState.post);
    content = post ? igPost(post) : '<p class="ig-empty">게시물이 없습니다.</p>';
  } else if (igState.account || igState.tab === "profile") content = igProfile(person);
  else if (igState.tab === "messages") content = igDmList();
  else {
    const posts = igState.tab === "saved" ? igAllPosts().filter((post) => igPreferences.saved.includes(post.id)) : igAllPosts();
    content = `${igState.tab === "home" ? `${igStoryTray()}` : '<h2 class="ig-saved-heading">저장됨</h2>'}${posts.length ? posts.map(igPost).join("") : '<p class="ig-empty">아직 게시물이 없습니다.</p>'}`;
  }
  appContent.innerHTML = `<div class="ig-shell${igState.thread ? " is-dm-thread" : ""}"><div class="ig-main">${content}</div>${!igState.thread && !igState.composing ? `<nav class="ig-bottom-nav" aria-label="Instagram 탐색">${[["home", "홈", "home"], ["reels", "릴스", "reels"], ["messages", "메시지", "send"], ["search", "검색", "search"], ["profile", "프로필", "profile"]].map(([id, label, icon]) => `<button type="button" ${["reels", "search"].includes(id) ? "disabled" : `data-ig-tab="${id}"`} aria-label="${label}"${igState.tab === id && !igState.account && !igState.post && !igState.following ? ' aria-current="page"' : ""}>${igIcon(icon, igState.tab === id && ["home", "messages"].includes(id))}</button>`).join("")}</nav>` : ""}${igState.commentsPost ? igCommentsSheet() : ""}</div>`;
  if (igState.storyId) appContent.querySelector(".ig-shell").insertAdjacentHTML("beforeend", igStoryViewer());
  appContent.querySelector(".ig-main").scrollTop = oldScroll;
  const dmLog = appContent.querySelector(".ig-dm-log");
  if (dmLog) dmLog.scrollTop = dmLog.scrollHeight;
}

function instagramGoBack() {
  if (igState.composing) igState.composing = false;
  else if (igState.storyId) igState.storyId = "";
  else if (igState.thread) { igState.thread = ""; igState.account = igState.threadReturnAccount; igState.threadReturnAccount = ""; }
  else if (igState.commentsPost) { igState.commentsPost = ""; igState.commentPrepared = false; }
  else if (igState.post) igState.post = "";
  else if (igState.account) { igState.account = ""; igState.following = igState.accountReturnFollowing; igState.accountReturnFollowing = false; }
  else if (igState.following) igState.following = false;
  else if (igState.tab === "saved") igState.tab = "profile";
  else return false;
  renderInstagram();
  return true;
}

appContent.addEventListener("click", (event) => {
  if (activeApp !== "instagram") return;
  const button = event.target.closest("button");
  if (!button) return;
  const data = button.dataset;
  if ("igStory" in data) {
    igState.storyId = data.igStory;
    igState.storySlide = 0;
    renderInstagram(true);
    appContent.querySelector("[data-ig-close-story]")?.focus();
    return;
  }
  if ("igCloseStory" in data) {
    const id = igState.storyId;
    igState.storyId = "";
    renderInstagram(true);
    appContent.querySelector(`[data-ig-story="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    return;
  }
  if ("igStoryStep" in data) {
    const slides = IG_CONTENT.stories?.find((story) => story.id === igState.storyId)?.slides || [];
    igState.storySlide = Math.max(0, Math.min(slides.length - 1, igState.storySlide + Number(data.igStoryStep)));
    renderInstagram(true);
    appContent.querySelector("[data-ig-close-story]")?.focus();
    return;
  }
  if ("igThread" in data || "igOpenDm" in data) {
    igState.threadReturnAccount = igState.account;
    const chat = (IG_CONTENT.chats || []).find((item) => item.accountId === data.igOpenDm);
    igState.thread = data.igThread || chat?.id || `contact:${data.igOpenDm}`;
    igState.threadReturnAccount ||= data.igOpenDm || "";
    renderInstagram();
    return;
  }
  if ("igTab" in data) return selectInstagramTab(data.igTab);
  if ("igOwnProfile" in data) return selectInstagramTab("profile");
  if ("igFollowing" in data) { igState.following = true; igState.query = ""; }
  else if ("igAccount" in data) { igState.accountReturnFollowing = igState.following; igState.account = data.igAccount; igState.post = ""; igState.following = false; }
  else if ("igPost" in data) igState.post = data.igPost;
  else if ("igComments" in data) {
    igState.commentsPost = data.igComments;
    igState.commentPrepared = false;
    renderInstagram(true);
    appContent.querySelector('.ig-comments-sheet [data-ig-close-comments]')?.focus({ preventScroll: true });
    return;
  } else if ("igCloseComments" in data) {
    const postId = igState.commentsPost;
    igState.commentsPost = "";
    igState.commentPrepared = false;
    renderInstagram(true);
    appContent.querySelector(`[data-ig-comments="${CSS.escape(postId)}"]`)?.focus({ preventScroll: true });
    return;
  } else if ("igPrepareComment" in data) {
    igState.commentPrepared = true;
    renderInstagram(true);
    appContent.querySelector("[data-ig-send-comment]")?.focus({ preventScroll: true });
    return;
  } else if ("igSendComment" in data) {
    const prompt = igAllPosts().find((post) => post.id === igState.commentsPost)?.commentPrompt;
    if (!prompt || !igState.commentPrepared || igPreferences.comments.includes(prompt.id)) return;
    igPreferences.comments.push(prompt.id);
    saveLocal("xunnian-phone.instagram.v1", igPreferences);
    igState.commentPrepared = false;
    renderInstagram(true);
    appContent.querySelector('.ig-comments-sheet [data-ig-close-comments]')?.focus({ preventScroll: true });
    unlockStoryFromIgComment(prompt.id);
    return;
  }
  else if ("igLike" in data || "igSave" in data) {
    const key = "igLike" in data ? "liked" : "saved", id = data.igLike || data.igSave;
    const values = new Set(igPreferences[key]);
    values.has(id) ? values.delete(id) : values.add(id);
    igPreferences[key] = [...values];
    saveLocal("xunnian-phone.instagram.v1", igPreferences);
    renderInstagram(true);
    return;
  } else return;
  renderInstagram();
});

appContent.addEventListener("input", (event) => {
  if (activeApp !== "instagram" || !event.target.matches('[aria-label="팔로잉 검색"]')) return;
  igState.query = event.target.value;
  appContent.querySelector("#ig-following-results").innerHTML = igFollowingRows();
});

appContent.addEventListener("error", (event) => {
  const img = event.target;
  if (img.tagName !== "IMG" || !img.closest(".ig-shell")) return;
  img.hidden = true;
}, true);

appContent.addEventListener("keydown", (event) => {
  if (activeApp !== "instagram" || (!igState.commentsPost && !igState.storyId) || event.key !== "Tab") return;
  const buttons = [...appContent.querySelectorAll(`${igState.storyId ? ".ig-story-viewer" : ".ig-comments-sheet"} button:not(:disabled)`)];
  if (!buttons.length) return;
  if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
});

appContent.addEventListener("load", (event) => {
  const img = event.target;
  if (img.tagName !== "IMG" || !img.parentElement?.classList.contains("ig-photo")) return;
  const placeholder = img.parentElement.querySelector(".ig-photo-placeholder");
  if (placeholder) placeholder.hidden = true;
}, true);

appContent.addEventListener("scroll", (event) => {
  const media = event.target;
  if (!media.matches?.("[data-ig-media]")) return;
  const index = Math.round(media.scrollLeft / media.clientWidth);
  media.nextElementSibling?.querySelectorAll("i").forEach((dot, i) => dot.classList.toggle("active", index === i));
}, true);
