// 网页新帖子保存在 IndexedDB；剧情原帖仍只从 ig-content.js 读取。
let igLocalPosts = [];
let igDraft = { photos: [], ko: "", zh: "", date: "" };
let igPublishing = false;
let igPostStoreError = false;
const igPostDatabase = new Promise((resolve, reject) => {
  const request = indexedDB.open("xunnian-phone.instagram-posts", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("posts", { keyPath: "id" });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function igStoreRequest(mode, operation) {
  const db = await igPostDatabase;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("posts", mode);
    const request = operation(tx.objectStore("posts"));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = tx.onabort = () => reject(tx.error || new Error("저장 실패"));
  });
}

function igDisplayLocalPost(record) {
  return { ...record, local: true, photos: record.photos.map((photo) => ({ ...photo, src: URL.createObjectURL(photo.blob) })) };
}

const igLocalPostsReady = igStoreRequest("readonly", (store) => store.getAll()).then((records) => {
  igLocalPosts = records.sort((a, b) => b.created - a.created).map(igDisplayLocalPost);
  if (activeApp === "instagram" && !igState.composing) renderInstagram(true);
}).catch(() => { igPostStoreError = true; });

function igAllPosts() { return [...igLocalPosts, ...IG_CONTENT.posts]; }

function igPostComposer() {
  return `<form class="ig-create-form" id="ig-create-form"><label class="ig-select-photos">${igIcon("image")}<span>사진 선택</span><input type="file" id="ig-post-photos" aria-label="사진 선택" accept="image/jpeg,image/png,image/webp,image/gif" multiple></label><div class="ig-draft-photos">${igDraft.photos.map((photo, index) => `<div><img src="${escapeText(photo.src)}" alt="선택한 사진 ${index + 1}"><button type="button" data-ig-remove-photo="${index}" aria-label="사진 ${index + 1} 삭제">${igIcon("close")}</button></div>`).join("")}</div><label>문구<textarea name="ko" aria-label="한국어 문구" placeholder="문구 입력..." maxlength="2200" required>${escapeText(igDraft.ko)}</textarea></label><label><span class="ig-form-secondary">중국어 번역</span><textarea name="zh" aria-label="중국어 번역" placeholder="中文翻译" maxlength="2200" required>${escapeText(igDraft.zh)}</textarea></label><label>날짜<input name="date" type="date" aria-label="게시물 날짜" value="${escapeText(igDraft.date)}"></label><p class="ig-create-error" role="alert" id="ig-create-error"></p><button type="submit" class="ig-publish-button"${igPublishing ? " disabled" : ""}>${igPublishing ? "공유 중..." : "공유"}</button></form>`;
}

function igBeginPost() {
  igState.composing = true;
  renderInstagram();
}

// 只绑定模拟应用，不向任何真实 IG 账号发送内容。
document.addEventListener("click", async (event) => {
  if (activeApp !== "instagram") return;
  const button = event.target.closest("button");
  if (!button) return;
  if (button.hasAttribute("data-ig-create-post")) return igBeginPost();
  if (button.hasAttribute("data-ig-remove-photo")) {
    const [removed] = igDraft.photos.splice(Number(button.dataset.igRemovePhoto), 1);
    if (removed) URL.revokeObjectURL(removed.src);
    renderInstagram();
  }
  if (button.hasAttribute("data-ig-delete-post")) {
    const post = igLocalPosts.find((item) => item.id === button.dataset.igDeletePost);
    if (!post) return;
    try {
      await igStoreRequest("readwrite", (store) => store.delete(post.id));
      post.photos.forEach((photo) => URL.revokeObjectURL(photo.src));
      igLocalPosts = igLocalPosts.filter((item) => item.id !== post.id);
      igState.post = "";
      renderInstagram(true);
    } catch { showToast("게시물을 삭제할 수 없습니다."); }
  }
});

appContent.addEventListener("input", (event) => {
  if (activeApp !== "instagram" || !event.target.closest("#ig-create-form")) return;
  if (["ko", "zh", "date"].includes(event.target.name)) igDraft[event.target.name] = event.target.value;
});

appContent.addEventListener("change", async (event) => {
  if (activeApp !== "instagram" || event.target.id !== "ig-post-photos") return;
  const selected = [...event.target.files];
  const error = appContent.querySelector("#ig-create-error");
  if (selected.length + igDraft.photos.length > 10) { error.textContent = "사진은 최대 10장까지 선택할 수 있습니다."; return; }
  const added = [];
  try {
    for (const file of selected) {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("JPG, PNG, WebP, GIF 사진을 선택해 주세요.");
      const src = URL.createObjectURL(file);
      const image = new Image();
      image.src = src;
      try { await image.decode(); } catch { URL.revokeObjectURL(src); throw new Error("사진을 열 수 없습니다. 다른 사진을 선택해 주세요."); }
      added.push({ blob: file, src, alt: "사진", altZh: "照片" });
    }
    igDraft.photos.push(...added);
    if (activeApp === "instagram" && igState.composing) renderInstagram(true);
  } catch (failure) {
    added.forEach((photo) => URL.revokeObjectURL(photo.src));
    if (error?.isConnected) error.textContent = failure.message;
  }
});

appContent.addEventListener("submit", async (event) => {
  if (event.target.id !== "ig-create-form") return;
  event.preventDefault();
  if (igPublishing) return;
  const error = event.target.querySelector("#ig-create-error");
  if (!igDraft.photos.length) { error.textContent = "사진을 선택해 주세요."; return; }
  if (!igDraft.ko.trim() || !igDraft.zh.trim()) { error.textContent = "문구와 중국어 번역을 입력해 주세요."; return; }
  if (igPostStoreError) { error.textContent = "이 브라우저에서는 사진을 저장할 수 없습니다."; return; }
  igPublishing = true;
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    await igLocalPostsReady;
    const record = { id: `local-${crypto.randomUUID()}`, accountId: IG_CONTENT.profile.id, created: Date.now(), date: igDraft.date, caption: { ko: igDraft.ko.trim(), zh: igDraft.zh.trim() }, photos: igDraft.photos.map(({ src, ...photo }) => photo) };
    await igStoreRequest("readwrite", (store) => store.put(record));
    igLocalPosts.unshift(igDisplayLocalPost(record));
    igDraft.photos.forEach((photo) => URL.revokeObjectURL(photo.src));
    igDraft = { photos: [], ko: "", zh: "", date: "" };
    if (activeApp === "instagram") selectInstagramTab("profile");
  } catch { if (error.isConnected) error.textContent = "저장하지 못했습니다. 사진과 문구를 유지했으니 다시 시도해 주세요."; }
  finally { igPublishing = false; if (submit.isConnected) submit.disabled = false; }
});

// 剧情 DM：每段先发送预设正文，再按顺序呈现附带帖子和对方回复。
const igDmSaved = readLocal("xunnian-phone.instagram-dm.v1", {});
const igDmStages = { ...(igDmSaved?.stages || {}) };
let igDmPrepared = "";
const igDmSending = new Set();

function igVisibleDmMessages(chat) {
  if (!chat) return [];
  return [...(chat.messages || []), ...(chat.turns || []).flatMap((turn) => (turn.messages || []).slice(0, Number(igDmStages[turn.id]) || 0))];
}

function igDmNextTurn(chat) { return chat?.turns?.find((turn) => (Number(igDmStages[turn.id]) || 0) < turn.messages.length); }

function igSharedPostCard(post) {
  return `<div class="ig-shared-post"><header>${igIcon("grid")}<strong>${escapeText(post.accountLabel || "게시물")}</strong></header><img src="${escapeText(post.image)}" alt="${escapeText(post.alt || "게시물 사진")}"><div>${renderBilingual(post.caption, { interactive: false })}</div></div>`;
}

function igDmComposer(chat) {
  const turn = igDmNextTurn(chat);
  const prepared = turn && igDmPrepared === turn.id;
  const sending = turn && igDmSending.has(turn.id);
  return `<div class="ig-dm-composer"><span>${igIcon("camera")}</span><button type="button" class="ig-dm-draft" data-ig-prepare-dm${!turn || sending ? " disabled" : ""} aria-label="메시지 작성">${prepared ? renderBilingual(turn.messages[0], { interactive: false }) : "메시지..."}</button>${turn ? `<button class="ig-dm-send" type="button" data-ig-send-dm aria-label="보내기"${!prepared || sending ? " disabled" : ""}>${igIcon("send")}</button>` : igIcon("heart")}</div>`;
}

function igDmRenderIfOpen(id) { if (activeApp === "instagram" && igState.thread === id) renderInstagram(true); }

function igDmDeliver(chat, turn) {
  if (igDmSending.has(turn.id)) return;
  igDmSending.add(turn.id);
  const advance = () => {
    const sent = Number(igDmStages[turn.id]) || 0;
    if (sent < turn.messages.length) {
      igDmStages[turn.id] = sent + 1;
      saveLocal("xunnian-phone.instagram-dm.v1", { stages: igDmStages });
      igDmRenderIfOpen(chat.id);
    }
    const next = turn.messages[Number(igDmStages[turn.id]) || 0];
    if (next) setTimeout(advance, Math.max(200, Number(next.delayMs) || 800));
    else { igDmSending.delete(turn.id); igDmRenderIfOpen(chat.id); }
  };
  advance();
}

appContent.addEventListener("click", (event) => {
  if (activeApp !== "instagram" || !igState.thread) return;
  const chat = IG_CONTENT.chats.find((item) => item.id === igState.thread);
  const turn = igDmNextTurn(chat);
  if (!turn) return;
  if (event.target.closest("[data-ig-prepare-dm]")) { igDmPrepared = turn.id; renderInstagram(true); }
  if (event.target.closest("[data-ig-send-dm]") && igDmPrepared === turn.id) { igDmPrepared = ""; igDmDeliver(chat, turn); }
});

// 刷新发生在分段送达中途时，继续尚未呈现的附件／回复，不重复已经送达的消息。
for (const chat of IG_CONTENT.chats || []) for (const turn of chat.turns || []) {
  if (Number(igDmStages[turn.id]) > 0 && Number(igDmStages[turn.id]) < turn.messages.length) igDmDeliver(chat, turn);
}
