// 英宰 · 최영재
// 只在本文件的 messages 中继续添加消息；每条之间保留逗号。
// sender: "me" 是道勋，"them" 是对方；time 留空或不写就显示“·”。
PHONE_STORY.kakaoChats.push({
  id: "dm-youngjae",
  contactId: "youngjae",
  // 打开时先看到这天起的近期记录；在顶部下拉再加载此前的历史，不留占位空白。
  historyBefore: "2026-05-30",
  // 完成这条 IG 评论后，直接展示全部已解锁记录；通知取这组的前两条。
  revealOnIgComment: "icarus-thanks-youngjae",
  notificationCount: 2,
  // 读过 2023 年这整组消息后，放出下一阶段的 2024 年备忘录。
  readingMilestone: { id: "youngjae-2023-read", year: 2023, requiresIgComment: "icarus-thanks-youngjae" },
  messages: [
    // Part 1：2023 年的旧记录。保持在 2026 年记录之前。
    {
      sender: "them", senderId: "youngjae",
      date: "2023-01-29", time: "23:00",
      ko: "울지 마.", zh: "别哭了",
    },
    {
      sender: "them", senderId: "youngjae",
      date: "2023-01-29", time: "23:00",
      ko: "괜찮아?", zh: "你还好吗",
    },
    {
      sender: "me",
      date: "2023-01-29", time: "23:50",
      ko: "이제 괜찮아.", zh: "没事了",
    },
    {
      sender: "them", senderId: "youngjae",
      date: "2023-01-29", time: "23:50",
      ko: "정말 괜찮아?", zh: "真的没事吗？",
    },
    {
      sender: "them", senderId: "youngjae",
      date: "2023-01-29", time: "23:50",
      ko: "내가 너한테 갈게.", zh: "我过去找你吧",
    },
    {
      sender: "me",
      date: "2023-01-30", time: "01:00",
      recalled: true, // 红色圆形白色 ! 标记；保留这条剧情原句。
      ko: "널 알게 된 건 정말 행운이야.", zh: "认识你真幸运呀",
    },
    {
      sender: "me",
      date: "2023-01-30", time: "17:00",
      ko: "집에 도착했어?", zh: "到家了吗",
    },
    {
      sender: "me",
      date: "2023-01-30", time: "17:00",
      ko: "나한테 알려 줘야지.", zh: "要和我说一下呀",
    },
    // 发送 IG 评论后追加的剧情。原先八条旧记录仍可提前下拉阅读。
    ...[
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:20", "ko": "벌써 도착했어.", "zh": "已经到了"},
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:20", "ko": "방금 형이랑 여동생이랑 같이 있었어.", "zh": "刚刚和哥哥妹妹一起"},
    {"sender": "me", "date": "2023-01-30", "time": "17:20", "ko": ":( 같이 있으면 내 연락에는 답 못 하는 거야?", "zh": ":( 和他们在一起就不可以回我消息了吗"},
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:20", "ko": "야 너 왜 그래ㅋㅋ", "zh": "呀 你干嘛呀"},
    {"sender": "me", "date": "2023-01-30", "time": "17:25", "ko": "푹 쉬어.", "zh": "要好好休息啊"},
    {"sender": "me", "date": "2023-01-30", "time": "17:25", "ko": "곧 또 연습해야 하잖아.", "zh": "马上又要练习了"},
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:30", "ko": "이번엔 반성문도 안 썼는데", "zh": "这次又没有写检讨"},
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:30", "ko": "푹 안 쉴 이유가 없지.", "zh": "没有不好好休息的理由啊"},
    {"sender": "me", "date": "2023-01-30", "time": "17:45", "ko": "근데 너 돌아오면 우리 롯데월드 갈래?", "zh": "话说等你回来我们去乐天世界吧？"},
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:45", "ko": "좋아.", "zh": "好啊"},
    {"sender": "them", "senderId": "youngjae", "date": "2023-01-30", "time": "17:46", "ko": "갑자기 왜?", "zh": "为什么突然？"},
    {"sender": "me", "date": "2023-01-30", "time": "17:46", "ko": "그냥 가고 싶어서ㅋㅋㅋㅋ", "zh": "就是想去而已哈哈哈哈"},
    // 后续 2、3 月记录也随同一次评论解锁。
      {"sender": "them", "senderId": "youngjae", "date": "2023-02-20", "time": "16:00", "ko": "아 개학하니까 너무 힘들다.", "zh": "哎 开学后好累啊"},
      {"sender": "me", "date": "2023-02-20", "time": "16:07", "ko": "일반고 다니려면 힘들겠다ㅋㅋㅋㅋ", "zh": "上普通高中肯定很辛苦吧哈哈哈哈"},
      {"sender": "me", "date": "2023-02-20", "time": "16:07", "ko": "와 고3이네. 이제 제일 선배잖아.", "zh": "哎 三年级诶，变成最大的学长了"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-02-20", "time": "16:48", "ko": "연습 끝나고 숙제도 해야 돼.", "zh": "练习完还要写作业"},
      {"sender": "me", "date": "2023-02-20", "time": "16:48", "ko": "내가 아이스크림 사 줄게.", "zh": "请你吃冰激凌"},
      {"sender": "me", "date": "2023-03-10", "time": "17:00", "ko": "와", "zh": "哇塞"},
      {"sender": "me", "date": "2023-03-10", "time": "17:00", "ko": "밝은 머리 물 빠지는 거 레전드네.", "zh": "浅发色掉色legend级别"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-10", "time": "17:09", "ko": "방금 봤어.", "zh": "刚看到了"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-10", "time": "17:09", "ko": "지금 완전 도깨비불 소년이네ㅋㅋ", "zh": "现在完全鬼火少年呀哈哈"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-10", "time": "17:10", "ko": "내가 색 다시 입혀 줄까?", "zh": "需要帮你补色吗？"},
      {"sender": "me", "date": "2023-03-10", "time": "17:10", "ko": "됐어. 이거 뭔가 조절하기 어려운 것 같아.", "zh": "算了 总觉得这很难控制"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-15", "time": "09:46", "ko": "근데 전에 말했던 거", "zh": "话说，之前说的"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-15", "time": "09:46", "ko": "언제 가?", "zh": "什么时候去？"},
      {"sender": "me", "date": "2023-03-15", "time": "09:50", "ko": "와 일반고 모범생", "zh": "哇 普高好学生"},
      {"sender": "me", "date": "2023-03-15", "time": "09:50", "ko": "수업에 집중 안 하고 뭐 해ㅋㅋ", "zh": "怎么没好好上课"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-15", "time": "09:53", "ko": "어차피 대학 갈 것도 아닌데.", "zh": "反正又不要考大学了"},
      {"sender": "me", "date": "2023-03-15", "time": "09:57", "ko": "충격", "zh": "震撼"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-15", "time": "09:58", "ko": "빨리 말해 봐. 롯데월드 언제 갈 건데?", "zh": "你快说呀，乐天，什么时间？"},
      {"sender": "me", "date": "2023-03-15", "time": "09:58", "ko": "나 까먹을 뻔했네. 며칠 뒤에 갈까?", "zh": "我都差点忘记了，过几天就去吧？"},
      {"sender": "them", "senderId": "youngjae", "date": "2023-03-15", "time": "10:00", "ko": "그래도 사람 좀 적을 때 가야지.", "zh": "还是要找人少点的时候"},
      {"sender": "me", "date": "2023-03-15", "time": "10:00", "ko": "응.", "zh": "嗯"},
    ].map((message) => ({ ...message, requiresIgComment: "icarus-thanks-youngjae" })),
    // 保留原有的近期记录。
    {
      sender: "them",
      senderId: "youngjae",
      date: "2026-05-30", // 日期：年-月-日，换日时自动显示日期分隔条
      time: "",           // 时刻未指定，显示“·”；可自行改成例如 "21:30"
      ko: "너랑 싸우고 싶지 않아.",
      zh: "我不想和你吵架。",
    },
    {
      sender: "me",
      date: "2026-05-31",
      time: "23:50",      // 每一条消息的时间都可以独立修改
      ko: "됐어. 생일 축하해.",
      zh: "好了，生日快乐",
    },
  ],
});
