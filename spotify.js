let spotifyState = { tab: "home", query: "", mix: "", song: "" };
const storedSpotify = readLocal("xunnian-phone.spotify.v1", {});
const spotifyLiked = new Set(Array.isArray(storedSpotify?.liked) ? storedSpotify.liked : ["love-me-harder", "eyes-nose-lips", "instagram", "love-poem"]);

function spotifyCover(song, extra = "") {
  return `<span class="spotify-cover ${extra}" style="--cover-color:${escapeText(song.color)}"><i aria-hidden="true"></i><strong>${escapeText(song.mark)}</strong></span>`;
}

function spotifySongRows(songs) {
  return songs.map((song) => `<div class="spotify-song-row"><button type="button" data-spotify-song="${song.id}" aria-label="${escapeText(song.title.ko)} 곡 정보">${spotifyCover(song)}<span><strong>${renderBilingual(song.title, { interactive: false })}</strong><small>${escapeText(song.artist)}</small></span></button><button type="button" class="spotify-like${spotifyLiked.has(song.id) ? " is-liked" : ""}" data-spotify-like="${song.id}" aria-label="${escapeText(song.title.ko)} 좋아요" aria-pressed="${spotifyLiked.has(song.id)}">${mediaIcon("heart")}</button></div>`).join("") || '<p class="spotify-empty">검색 결과가 없습니다.</p>';
}

function spotifySearchSongs() {
  const q = spotifyState.query.toLocaleLowerCase().trim();
  return SPOTIFY_CONTENT.songs.filter((song) => [song.title.ko, song.title.zh, song.artist].some((text) => text.toLocaleLowerCase().includes(q)));
}

function renderSpotify(tab = "home", preserve = false) {
  const scroll = preserve ? appContent.querySelector(".spotify-scroll")?.scrollTop || 0 : 0;
  if (!preserve) spotifyState = { tab, query: "", mix: "", song: "" };
  appTitle.textContent = "Spotify";
  appBack.innerHTML = spotifyState.mix || spotifyState.song ? '‹ <span>뒤로</span>' : '‹ <span>홈</span>';
  appBack.setAttribute("aria-label", spotifyState.mix || spotifyState.song ? "Spotify 이전 화면" : "返回主屏幕");
  setAppActions();
  const song = SPOTIFY_CONTENT.songs.find((item) => item.id === spotifyState.song);
  const mix = SPOTIFY_CONTENT.mixes.find((item) => item.id === spotifyState.mix);
  let body;
  if (song) body = `<section class="spotify-song-detail">${spotifyCover(song, "is-large")}<h2>${renderBilingual(song.title, { interactive: false })}</h2><p>${escapeText(song.artist)}</p><small>${song.duration}</small><a class="spotify-listen" href="${escapeText(song.url)}" target="_blank" rel="noopener noreferrer">Spotify에서 듣기 ↗</a></section>`;
  else if (mix) body = `<header class="spotify-mix-heading" style="--mix-color:${mix.color}"><small>DOHOON · MIX</small><h2>${renderBilingual(mix.title, { interactive: false })}</h2><p>${renderBilingual(mix.description, { interactive: false })}</p><span>${mix.songIds.length}곡</span></header>${spotifySongRows(mix.songIds.map((id) => SPOTIFY_CONTENT.songs.find((song) => song.id === id)).filter(Boolean))}`;
  else if (spotifyState.tab === "search") body = `<h2 class="spotify-large-heading">검색</h2><label class="spotify-search">${mediaIcon("search")}<input aria-label="Spotify 검색" type="search" placeholder="어떤 음악을 듣고 싶으세요?" value="${escapeText(spotifyState.query)}"></label><div id="spotify-search-results">${spotifySongRows(spotifySearchSongs())}</div>`;
  else if (spotifyState.tab === "library") body = `<h2 class="spotify-large-heading">내 라이브러리</h2><p class="spotify-subheading">좋아요 표시한 곡 · ${spotifyLiked.size}곡</p>${spotifySongRows(SPOTIFY_CONTENT.songs.filter((song) => spotifyLiked.has(song.id)))}`;
  else body = `<header class="spotify-greeting"><span>D</span><strong>나만의 음악</strong></header><h2 class="spotify-large-heading">다시 듣고 싶은 곡</h2>${spotifySongRows(SPOTIFY_CONTENT.songs.slice(0, 2))}<h2 class="spotify-section-heading">트렌드 믹스</h2><div class="spotify-mixes">${SPOTIFY_CONTENT.mixes.map((mix) => `<button type="button" data-spotify-mix="${mix.id}" style="--mix-color:${mix.color}"><span>MIX</span><strong>${renderBilingual(mix.title, { interactive: false })}</strong></button>`).join("")}</div><h2 class="spotify-section-heading">이런 곡도 좋아할 거예요</h2>${spotifySongRows(SPOTIFY_CONTENT.songs.slice(2))}`;
  appContent.innerHTML = `<div class="spotify-shell"><div class="spotify-scroll">${body}</div><nav class="spotify-nav" aria-label="Spotify 탭">${[["home", "홈", "home"], ["search", "검색", "search"], ["library", "내 라이브러리", "orders"]].map(([id, label, icon]) => `<button type="button" data-spotify-tab="${id}" aria-label="${label}"${spotifyState.tab === id ? ' aria-current="page"' : ""}>${mediaIcon(icon)}<span>${label}</span></button>`).join("")}</nav></div>`;
  appContent.querySelector(".spotify-scroll").scrollTop = scroll;
}

function spotifyGoBack() {
  if (!spotifyState.song && !spotifyState.mix) return false;
  if (spotifyState.song) spotifyState.song = "";
  else spotifyState.mix = "";
  renderSpotify(spotifyState.tab, true);
  return true;
}

appContent.addEventListener("click", (event) => {
  if (activeApp !== "spotify") return;
  const data = event.target.closest("button")?.dataset;
  if (!data) return;
  if ("spotifyTab" in data) return renderSpotify(data.spotifyTab);
  if ("spotifySong" in data) spotifyState.song = data.spotifySong;
  else if ("spotifyMix" in data) spotifyState.mix = data.spotifyMix;
  else if ("spotifyLike" in data) {
    spotifyLiked.has(data.spotifyLike) ? spotifyLiked.delete(data.spotifyLike) : spotifyLiked.add(data.spotifyLike);
    saveLocal("xunnian-phone.spotify.v1", { liked: [...spotifyLiked] });
  } else return;
  renderSpotify(spotifyState.tab, true);
  if (data.spotifySong || data.spotifyMix) appContent.querySelector(".spotify-scroll").scrollTop = 0;
});
appContent.addEventListener("input", (event) => {
  if (activeApp !== "spotify" || !event.target.matches('[aria-label="Spotify 검색"]')) return;
  spotifyState.query = event.target.value;
  appContent.querySelector("#spotify-search-results").innerHTML = spotifySongRows(spotifySearchSongs());
});
