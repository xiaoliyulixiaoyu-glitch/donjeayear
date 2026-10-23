// YouTube、Netflix 和外卖的剧情记录。封面来源在 assets/media/sources.json。
// 视频/剧集资料来自公开页面；观看进度、收藏与外卖订单是本故事的示例记录。
const MEDIA_CONTENT = {
  youtube: [
    {
      id: "dohoon-last-festival-vertical", videoId: "TwJM7wQwHOw",
      title: { ko: "[세로캠] 도훈 — 마지막 축제", zh: "【竖版直拍】道勋 — 最后的庆典" },
      channel: "ALL THE K-POP", published: "2024-11-27", watchedOn: "2026-05-28",
      cover: "assets/media/youtube/last-festival-vertical.jpg",
    },
    {
      id: "dohoon-last-festival-4k", videoId: "UBA91MZrFsw",
      title: { ko: "[직캠 4K] 도훈 — 마지막 축제", zh: "【4K 直拍】道勋 — 最后的庆典" },
      channel: "ALL THE K-POP", published: "2024-11-27", watchedOn: "2026-05-26",
      cover: "assets/media/youtube/last-festival-4k.jpg",
    },
    {
      id: "dohoon-plot-twist", videoId: "nKGi6X95mgo",
      title: { ko: "[원픽캠 4K] 도훈 — 첫 만남은 계획대로 되지 않아", zh: "【4K 直拍】道勋 — 初次见面没有按照计划进行" },
      channel: "ALL THE K-POP", published: "2024-02-07", watchedOn: "2026-05-25",
      cover: "assets/media/youtube/plot-twist.jpg",
    },
  ],
  netflix: [
    { id: "twenty-five-twenty-one", title: { ko: "스물다섯 스물하나", zh: "二十五，二十一" }, cover: "assets/media/netflix/twenty-five-twenty-one.jpg", episode: 4, progress: 38, saved: true },
    { id: "hospital-playlist", title: { ko: "슬기로운 의사생활", zh: "机智的医生生活" }, cover: "assets/media/netflix/hospital-playlist.jpg", episode: 3, progress: 72, saved: true },
    { id: "reply-1988", title: { ko: "응답하라 1988", zh: "请回答 1988" }, cover: "assets/media/netflix/reply-1988.jpg", episode: 7, progress: 21, saved: true },
  ],
  orders: [
    {
      id: "order-20260528", date: "2026-05-28", time: "19:42", icon: "gimbap",
      restaurant: { ko: "밤참김밥", zh: "夜宵紫菜包饭店" },
      menu: { ko: "참치김밥 1개 · 떡볶이 1개", zh: "金枪鱼紫菜包饭 1 份 · 辣炒年糕 1 份" },
      request: { ko: "문 앞에 놓아 주세요. 감사합니다.", zh: "请放在门口，谢谢。" },
      amount: 14500, favorite: true,
    },
    {
      id: "order-20260524", date: "2026-05-24", time: "21:15", icon: "chicken",
      restaurant: { ko: "바삭치킨", zh: "酥脆炸鸡店" },
      menu: { ko: "반반치킨 1마리 · 콜라 1개", zh: "双拼炸鸡 1 只 · 可乐 1 瓶" },
      request: { ko: "벨 누르지 말고 문자 주세요.", zh: "请不要按门铃，发短信就好。" },
      amount: 24500, favorite: false,
    },
    {
      id: "order-20260520", date: "2026-05-20", time: "21:18", icon: "cutlet",
      restaurant: { ko: "동네돈까스", zh: "街角炸猪排店" },
      menu: { ko: "등심돈까스 1개 · 밥 추가", zh: "里脊炸猪排 1 份 · 加米饭" },
      request: { ko: "소스는 따로 담아 주세요.", zh: "请把酱汁单独装。" },
      amount: 13500, favorite: true,
    },
  ],
};
