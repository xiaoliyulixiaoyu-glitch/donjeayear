// X 的剧情数据，与界面代码分开。保存文件、刷新预览即可。
// 参考截图只参考版式，不自动导入截图中的私人账号、帖子或广告。
const X_CONTENT = {
  dmPasscode: "0531", // X 聊天入口的剧情密码；保留引号和开头的 0。
  profile: {
    name: "DH",
    protected: true, // 剧情设定：私密账号，姓名旁显示锁形标识。
    handle: "", // 账号名，例如 "your_name"；暂不填写真实账号。
    avatar: "", // 后续放图片，例如 "assets/avatars/x/profile.jpg"。
    bio: { ko: "", zh: "" },
  },
  // 时间倒序；comments 是该条动态下已经写好的剧情自评。
  posts: [
    {
      id: "dh-20260130", own: true, name: "DH", handle: "", avatar: "",
      date: "2026-01-30", following: true,
      ko: "사실 어쩌면, 내가 걔를 좋아하는 걸까?", zh: "其实可能是，我会喜欢他吗？",
    },
    {
      id: "dh-20250130", own: true, name: "DH", handle: "", avatar: "",
      date: "2025-01-30", following: true,
      ko: "아니면, 걔가 날 좋아할까?", zh: "或者，他会喜欢我吗？",
      comments: [
        { id: "dh-20250130-reply-1", own: true, name: "DH", handle: "", avatar: "", ko: "미쳤나 봐……", zh: "疯了……" },
        { id: "dh-20250130-reply-2", own: true, name: "DH", handle: "", avatar: "", ko: "내가 이런 생각을 하는 것도 이상해.", zh: "我有这个想法也很奇怪" },
      ],
    },
    {
      id: "dh-20240705", own: true, name: "DH", handle: "", avatar: "",
      date: "2024-07-05", following: true,
      ko: "어떡하지……", zh: "怎么办啊……",
    },
    {
      id: "dh-20240620", own: true, name: "DH", handle: "", avatar: "",
      date: "2024-06-20", following: true,
      ko: "내가 어쩌다 이런 일을 하자고 했지.", zh: "我怎么会提出做这种事的",
    },
  ],
  trends: [
    // { id: "trend-001", category: "음악 · 트렌드", title: "새로운 이야기", titleZh: "新的故事", count: "게시물 120개", tab: "entertainment" },
  ],
  notifications: [
    // { id: "notice-001", type: "post", name: "이름", avatar: "", time: "1시간", ko: "韩文通知", zh: "中文翻译", postId: "post-001", unread: true },
    // type 可选 post（帖子）、mention（提及）、like（喜欢）、follow（关注）。
  ],
  // 每个私聊建议单独放入 x-chats/，用 X_CONTENT.chats.push({...}) 注册。
  // 这些文件的 script 标签放在本文件之后、x.js 之前；详见 x-chats/README.md。
  chats: [],
};
