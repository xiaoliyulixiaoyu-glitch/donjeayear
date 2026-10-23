// 故事用闹钟；初始时间和备注在这里改。浏览器里可开关、新建或编辑。
// 不会设置电脑或手机系统闹钟，也不接入真实艺人行程。
const CLOCK_CONTENT = {
  alarms: [
    { id: "alarm-shop", time: "02:20", label: { ko: "샵 가기", zh: "去妆发室" }, repeat: "once", enabled: true },
    { id: "alarm-wake-again", time: "02:25", label: { ko: "진짜 일어나야 돼", zh: "真的该起床了" }, repeat: "once", enabled: true },
    { id: "alarm-last-chance", time: "02:30", label: { ko: "마지막… 지각하면 안 돼", zh: "最后一次……不能迟到" }, repeat: "once", enabled: true },
    { id: "alarm-departure", time: "03:40", label: { ko: "차 타러 내려가기", zh: "下楼上车" }, repeat: "once", enabled: true },
    { id: "alarm-prerecord", time: "04:00", label: { ko: "사전녹화 준비", zh: "准备预录" }, repeat: "once", enabled: false },
    { id: "alarm-rehearsal", time: "06:10", label: { ko: "리허설 대기", zh: "候场彩排" }, repeat: "once", enabled: true },
    { id: "alarm-vocal", time: "09:00", label: { ko: "보컬 레슨", zh: "声乐课" }, repeat: "weekdays", enabled: false },
    { id: "alarm-car", time: "12:30", label: { ko: "차에서 자도 꼭 깨기", zh: "车上睡着了也要记得醒" }, repeat: "once", enabled: false },
    { id: "alarm-practice", time: "18:00", label: { ko: "연습실", zh: "去练习室" }, repeat: "daily", enabled: true },
    { id: "alarm-home", time: "23:50", label: { ko: "내일 일정 확인", zh: "确认明天的行程" }, repeat: "daily", enabled: false },
  ],
};
