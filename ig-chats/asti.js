// 阿斯蒂的 IG 剧情 DM。初始消息直接显示；turns 由读者点击发送触发。
IG_CONTENT.chats.push({
  id: "ig-dm-asti", accountId: "asti",
  messages: [
    { sender: "them", date: "2023-04-30", ko: "우리 우정 팔찌 만들러 갈래?", zh: "我们去做友情手链吧？" },
    {
      sender: "them", date: "2023-04-30",
      ko: "인사동에서 우정 팔찌 만들기", zh: "在仁寺洞做友情手链",
      sharedPost: {
        accountLabel: "우정 팔찌 공방",
        image: "assets/instagram/insadong-bracelets.svg",
        alt: "두 개의 비즈 우정 팔찌",
        caption: { ko: "인사동에서 만드는 우리만의 우정 팔찌. 좋아하는 색을 골라 함께 만들어 봐요.", zh: "在仁寺洞做属于我们的友情手链。选喜欢的颜色，一起动手做吧。" },
      },
    },
  ],
  turns: [
    {
      // 本轮更换了发起人和交互台词，使用新 id，不沿用旧版的已发送进度。
      id: "icarus-bracelet-reply-20230430",
      messages: [
        { sender: "me", date: "2023-04-30", ko: "좋아!!!! 완전 기대돼!!!", zh: "好呀！！！！好期待啊！！！" },
        { sender: "them", date: "2024-07-10", delayMs: 900, ko: "도훈아 미안, 내 팔찌를 잃어버렸어.", zh: "对不起啊道勋，我的手链丢掉了" },
        { sender: "them", date: "2024-07-10", delayMs: 900, ko: "네가 괜찮다면 내가 한 쌍 더 살게.", zh: "我再买一对吧，你不介意的话。" },
      ],
    },
  ],
});
