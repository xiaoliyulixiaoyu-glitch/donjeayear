// 本地故事歌单，非实时热榜。原曲信息参考各首歌的 Spotify 页面；不存放音频。
const SPOTIFY_CONTENT = {
  songs: [
    { id: "love-me-harder", title: { ko: "Love Me Harder", zh: "更用力爱我" }, artist: "Ariana Grande, The Weeknd", duration: "3:56", color: "#655c8e", mark: "LMH", url: "https://open.spotify.com/track/6xT6vHQsYYDOgTltL8fkIW" },
    { id: "eyes-nose-lips", title: { ko: "눈, 코, 입", zh: "眼鼻嘴" }, artist: "TAEYANG", duration: "3:49", color: "#6d6456", mark: "RISE", url: "https://open.spotify.com/track/0lYtIvI7bO51PZSeK22Mbz" },
    { id: "die-for-you", title: { ko: "Die For You", zh: "为你赴死" }, artist: "The Weeknd", duration: "4:20", color: "#913c49", mark: "DFY", url: "https://open.spotify.com/track/39HYnT8jBPc0aCBSsTqC1g" },
    { id: "instagram", title: { ko: "instagram", zh: "Instagram" }, artist: "DEAN", duration: "4:15", color: "#385252", mark: "DEAN", url: "https://open.spotify.com/search/DEAN%20instagram" },
    { id: "love-yourself", title: { ko: "Love Yourself", zh: "爱你自己" }, artist: "Justin Bieber", duration: "3:53", color: "#62666b", mark: "LY", url: "https://open.spotify.com/track/4wn9qcmtQyAwaAJmzzMmLt" },
    { id: "nothing", title: { ko: "Nothing", zh: "无事可做" }, artist: "Bruno Major", duration: "2:42", color: "#ad7858", mark: "NOTHING", url: "https://open.spotify.com/search/Bruno%20Major%20Nothing" },
    { id: "only-look-at-me", title: { ko: "나만 바라봐", zh: "只看着我" }, artist: "TAEYANG", duration: "4:00", color: "#526575", mark: "SOLAR", url: "https://open.spotify.com/track/78fSdYIkMuQ7ByfOPm3Dxl" },
    { id: "love-poem", title: { ko: "Love poem", zh: "爱的诗篇" }, artist: "IU", duration: "4:18", color: "#5f6b95", mark: "POEM", url: "https://open.spotify.com/track/7HrE6HtYNBbGqp5GmHbFV0" },
  ],
  mixes: [
    { id: "late-night", title: { ko: "새벽 R&B", zh: "凌晨 R&B" }, description: { ko: "잠들기 전, 조금 더 듣고 싶은 노래", zh: "入睡之前，还想再听一会儿" }, color: "#514376", songIds: ["love-me-harder", "die-for-you", "nothing", "instagram"] },
    { id: "k-rnb", title: { ko: "K-R&B 믹스", zh: "韩系 R&B 歌单" }, description: { ko: "익숙한 목소리로 채운 플레이리스트", zh: "熟悉的声音，慢慢填满歌单" }, color: "#346c68", songIds: ["eyes-nose-lips", "instagram", "only-look-at-me", "love-poem"] },
    { id: "on-repeat", title: { ko: "자꾸 듣게 되는 팝", zh: "忍不住循环的流行乐" }, description: { ko: "돌아오는 차 안에서 다시 한 번", zh: "回程车里，再听一遍" }, color: "#987553", songIds: ["love-me-harder", "love-yourself", "die-for-you", "nothing"] },
  ],
};
