let safariResult = null;
function renderSafari(reset = true) {
  if (reset) safariResult = null;
  appTitle.textContent = "Safari";
  appBack.innerHTML = safariResult ? '‹ <span>시작 페이지</span>' : '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", safariResult ? "Safari 시작 페이지" : "返回主屏幕");
  setAppActions();
  const favorites = [["N", "NAVER", "https://www.naver.com/", "#03c75a"], ["▶", "YouTube", "https://www.youtube.com/", "#ed3535"], ["≋", "Spotify", "https://open.spotify.com/", "#1b9b53"], ["W", "Weverse", "https://weverse.io/", "#303030"]];
  appContent.innerHTML = `<div class="safari-page"><div class="safari-start"><h2>즐겨찾기</h2><div class="safari-favorites">${favorites.map(([mark, name, url, color]) => `<a href="${url}" target="_blank" rel="noopener noreferrer"><span style="background:${color}">${mark}</span><strong>${name}</strong></a>`).join("")}</div>${safariResult ? `<section class="safari-result"><h3>${escapeText(safariResult.title)}</h3><a href="${escapeText(safariResult.url)}" target="_blank" rel="noopener noreferrer">웹에서 열기 ↗</a></section>` : '<div class="safari-privacy"><span aria-hidden="true">◈</span><div><strong>개인정보 보호 리포트</strong><p>Safari로 안전하게 둘러보세요.</p></div></div>'}</div><form id="safari-address-form" class="safari-address"><input type="text" name="address" aria-label="Safari 주소 또는 검색" placeholder="검색 또는 웹 사이트 이름" autocomplete="off" required><button type="submit">이동</button></form></div>`;
}
function safariGoBack() { if (!safariResult) return false; renderSafari(); return true; }
function renderMessages() {
  setAppActions();
  appContent.innerHTML = '<div class="messages-page"><h2>메시지</h2><div class="messages-empty"><span aria-hidden="true">'+mediaIcon("messages")+'</span><h3>메시지 없음</h3><p>새로운 메시지가 여기에 표시됩니다.</p></div></div>';
}
appContent.addEventListener("submit", (event) => {
  if (activeApp !== "safari" || event.target.id !== "safari-address-form") return;
  event.preventDefault();
  const address = String(new FormData(event.target).get("address") || "").trim();
  if (!address) return;
  let url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(address) || (/^[^\s]+\.[a-z]{2,}(?:\/|$)/i.test(address))) {
    try { const parsed = new URL(/^https?:/i.test(address) ? address : `https://${address}`); if (!['http:', 'https:'].includes(parsed.protocol) || /^[a-z][a-z0-9+.-]*:/i.test(address) && !/^https?:/i.test(address)) return showToast("웹 주소를 확인해 주세요."); url = parsed.href; } catch { return showToast("웹 주소를 확인해 주세요."); }
  } else url = `https://search.naver.com/search.naver?query=${encodeURIComponent(address)}`;
  safariResult = { title: address, url }; renderSafari(false);
});
