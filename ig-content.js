// Instagram 剧情数据。以下关注只用于本地故事，不操作真实账号。
// 账号名与人物备注按设定保留；剧情正文使用中韩双语。
// icarus / asti 为剧情自设账号，不代表同名真实用户。
const IG_CONTENT = {
  profile: {
    id: "icarus", handle: "icarus",
    name: { ko: "이카로스", zh: "伊卡洛斯" },
    avatar: "", bio: { ko: "", zh: "" },
  },
  // 数组顺序即页面顺序；阿斯蒂始终放在最后。
  following: [
    { id: "bts", handle: "bts.bighitofficial", name: "BTS", avatar: "assets/instagram/avatars/bts.svg" },
    { id: "rm", handle: "rkive", name: "RM", avatar: "assets/instagram/avatars/rm.jpg" },
    { id: "jin", handle: "jin", name: "Jin", avatar: "assets/instagram/avatars/jin.jpg" },
    { id: "suga", handle: "agustd", name: "SUGA", avatar: "assets/instagram/avatars/suga.jpg" },
    { id: "jhope", handle: "uarmyhope", name: "j-hope", avatar: "assets/instagram/avatars/jhope.jpg" },
    { id: "jimin", handle: "j.m", name: "Jimin", avatar: "assets/instagram/avatars/jimin.jpg" },
    { id: "v", handle: "thv", name: "V", avatar: "assets/instagram/avatars/v.jpg" },
    { id: "jungkook", handle: "mnijungkook", name: "Jung Kook", avatar: "assets/instagram/avatars/jungkook.jpg" },
    { id: "justin", handle: "justinbieber", name: "Justin Bieber", avatar: "assets/instagram/avatars/justin.jpg" },
    { id: "iu", handle: "dlwlrma", name: "IU", avatar: "assets/instagram/avatars/iu.jpg" },
    { id: "taeyeon", handle: "taeyeon_ss", name: "TAEYEON", avatar: "assets/instagram/avatars/taeyeon.jpg" },
    { id: "ariana", handle: "arianagrande", name: "Ariana Grande", avatar: "assets/instagram/avatars/ariana.jpg" },
    { id: "troye", handle: "troyesivan", name: "Troye Sivan", avatar: "assets/instagram/avatars/troye.jpg" },
    { id: "asti", followsYou: true, followers: 1, followingCount: 1, handle: "asti", name: { ko: "아스티", zh: "阿斯蒂" }, avatar: "" },
  ],
  // 限时动态按账号整理；暂不填照片或文案。每张写 src、caption: { ko, zh }。
  // 示例：slides: [{ src: "assets/instagram/stories/asti/01.jpg", caption: { ko: "...", zh: "..." } }]
  stories: [
    { id: "asti-story", accountId: "asti", slides: [] },
  ],
  // 每个 DM 独立放在 ig-chats/，由 index.html 加载。
  chats: [],
  posts: [
    {
      id: "asti-happy-birthday", accountId: "asti", date: "",
      caption: { original: "Happy Birthday", ko: "생일 축하해", zh: "生日快乐" },
      photos: [
        // 放入同名照片后刷新即显示。多张时继续添加 02.jpg、03.jpg 等路径。
        { src: "assets/instagram/asti/happy-birthday/01.JPG", alt: "생일 사진", altZh: "生日照片" },
      ],
      // 点评论框选择此句，再点“게시”发布；初始不会直接显示。
      commentPrompt: {
        id: "icarus-thanks-youngjae", accountId: "icarus",
        ko: "고마워. 영재가 늘 내 곁에 있어.", zh: "谢谢 英宰一直在我身边",
      },
    },
  ],
};
