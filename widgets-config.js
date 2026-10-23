// 主屏幕小组件设置：修改、保存后刷新网页即可。
const PHONE_WIDGETS = {
  // 天气是你可以自行设置的剧情数据，未接入实时天气服务。
  weather: {
    city: "서울",             // 城市，建议使用韩文
    temperature: 17,          // 当前气温
    high: 21,                 // 最高气温
    low: 12,                  // 最低气温
    condition: "partly-cloudy", // clear 晴 / partly-cloudy 少云 / cloudy 阴 / rain 雨 / snow 雪
  },

  calendar: {
    showHolidays: true, // 显示 holidays-kr.js 中导入的韩国公休日；false 隐藏。
    // 留空跟随韩国当天日期；也可以写 "2026-05-30" 固定成剧情日期。
    date: "",

    // 日程留空，等你自己填写。示例（去掉前面的 // 后才会显示）：
    events: [
      // { date: "2026-05-30", time: "18:00", title: "연습", titleZh: "练习", note: "", noteZh: "" },
    ],
  },
};
