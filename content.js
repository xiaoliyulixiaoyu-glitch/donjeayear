// 应用名称和排列在这里修改，不影响锁屏与密码。
// grid 按“从左到右、从上到下”排列，每行四个；dock 是底部常用栏。
const PHONE_APPS = {
  // Apple 官网图片自带透明留白，iconScale 只用于在页面中填满图标方格。
  photos:   { name: "사진",       title: "사진",       icon: "photos-official.png",   iconScale: 1.44 },
  camera:   { name: "카메라",     title: "카메라",     icon: "camera-official.png",   iconScale: 1.44 },
  notes:    { name: "메모",       title: "메모",       icon: "notes-official.png",    iconScale: 1.44 },
  settings: { name: "설정",       title: "설정",       icon: "settings-official.png", iconScale: 1.28 },
  contacts: { name: "연락처",     title: "연락처",     icon: "contacts-official.png", iconScale: 1.44 },
  youtube:  { name: "YouTube",   title: "YouTube",   icon: "youtube-official.jpg" },
  netflix:  { name: "Netflix",   title: "Netflix",   icon: "netflix-official.jpg" },
  x:        { name: "X",         title: "X",         icon: "x-official.jpg" },
  spotify:  { name: "Spotify",   title: "Spotify",   icon: "spotify-official.png", iconScale: 0.82, iconBackground: "#101010" },
  baemin:   { name: "배달의민족", title: "배달의민족", icon: "baemin-official.png", iconBackground: "#00dcca" },
  weverse:  { name: "Weverse",   title: "Weverse",   icon: "weverse-official.png", iconScale: 2.23, iconBackground: "#000", iconFilter: "grayscale(1) brightness(0.52) contrast(100)" },
  phone:    { name: "전화",       title: "전화",       icon: "phone-official.png",    iconScale: 1.44 },
  kakao:    { name: "카카오톡",   title: "카카오톡",   icon: "kakao-official.jpg" },
  instagram:{ name: "Instagram", title: "Instagram", icon: "instagram-official.jpg" },
  safari:   { name: "Safari",    title: "Safari",    icon: "safari-official.png", iconScale: 1.44 },
  messages: { name: "메시지",    title: "메시지",    icon: "messages-official.png", iconScale: 1.44 },
  clock:    { name: "시계",      title: "시계",      icon: "clock.svg" },
};

const APP_LAYOUT = {
  pageSize: 12, // 第一页最多 12 枚应用；屏幕较矮时自动减少，剩余应用放到后页。
  grid: ["photos", "camera", "clock", "settings", "notes", "contacts", "kakao", "x", "spotify", "youtube", "netflix", "baemin", "weverse"],
  dock: ["phone", "safari", "messages", "instagram"],
};

const PHONE_WIFI_NAME = "투어스 숙소";

// 相册照片：之后在这个数组中添加图片路径即可。
const PHONE_PHOTOS = [
  { src: "assets/wallpaper.JPG", alt: "사진 1" },
];

// 通讯录暂时留空，后续按故事设定添加，例如：
// { name: "角色姓名", number: "电话号码" }
const PHONE_CONTACTS = [];
