// 爸爸 · 아빠
// 只在本文件的 messages 中继续添加消息；每条之间保留逗号。
// sender: "me" 是道勋，"them" 是对方；time 留空或不写就显示“·”。
PHONE_STORY.kakaoChats.push({
  id: "dm-dad",
  contactId: "dad",
  messages: [
    {
      sender: "me",
      date: "2026-05-09", time: "22:04",
      ko: "응답 없는 보이스톡",
      zh: "语音通话 · 未接通",
      call: {"type": "voice", "status": "unanswered"},
    },
    {
      sender: "them", senderId: "dad",
      date: "2026-05-09", time: "22:04",
      ko: "엄마랑 영화 보고 있어서 못 들었어.",
      zh: "和妈妈在一起看电影呢，没有听到",
    },
  ],
});
