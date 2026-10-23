// 宿舍群 · 투어스 숙소 단톡방
// 公告修改 announcement（韩文）和 announcementZh（中文）；聊天消息写在 messages 中。
// sender: "me" 是道勋，"them" 是对方；time 留空或不写就显示“·”。
// 群聊发言人用 senderId 指定，例如申惟是 "shinyu"。
PHONE_STORY.kakaoChats.push({
  id: "tws-dorm",
  type: "group",
  name: { ko: "투어스 숙소 단톡방", zh: "" },
  announcement: "숙소를 깨끗하고 깔끔하게 유지해요!",
  announcementZh: "让我们保持干净整洁的宿舍环境吧！",
  avatar: "assets/avatars/kakao/tws-dorm.jpg",
  memberIds: ["dohoon", "shinyu", "youngjae", "hanjin", "jihoon", "kyungmin"],
  messages: [],
});
