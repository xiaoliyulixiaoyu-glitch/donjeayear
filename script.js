// 可以自己调整的设置
const TIME_ZONE = "Asia/Seoul"; // 韩国时间，比北京时间快一小时
const USE_12_HOUR = true;       // true：12小时制；false：24小时制
const PHONE_PASSWORD = "0406"; // 密码使用引号包住，才能保留开头的 0

const clockElements = document.querySelectorAll("[data-clock]");
const dateElement = document.querySelector("#lock-date");

// 韩语日期，例如：10월 23일 금요일
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
  weekday: "long",
});

// 时间格式
const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hourCycle: USE_12_HOUR ? "h12" : "h23",
});

function updateClock() {
  const now = new Date();

  // 只取小时和分钟，大号时间里不显示“上午/下午”
  const parts = timeFormatter.formatToParts(now);
  const hours = parts.find((part) => part.type === "hour").value;
  const minutes = parts.find((part) => part.type === "minute").value;

  clockElements.forEach((clock) => {
    clock.textContent = `${hours}:${minutes}`;
    clock.setAttribute("datetime", now.toISOString());
  });

  const statusLabel = document.querySelector("#status-label");
  if (statusLabel.dataset.showTime === "true") statusLabel.textContent = `${hours}:${minutes}`;

  dateElement.textContent = dateFormatter.format(now);
  dateElement.setAttribute("datetime", now.toISOString());
}

updateClock();
setInterval(updateClock, 1000);

// 以下负责锁屏 → 密码键盘 → 主屏幕的切换。
const lockScreen = document.querySelector("#lock-screen");
const passcodeScreen = document.querySelector("#passcode-screen");
const homeScreen = document.querySelector("#home-screen");
const appScreen = document.querySelector("#app-screen");
const openPasscodeButton = document.querySelector("#open-passcode");
const passcodeStatus = document.querySelector("#passcode-status");
const passcodeDots = document.querySelector("#passcode-dots");
const digitButtons = document.querySelectorAll("[data-digit]");
const screenAnnouncement = document.querySelector("#screen-announcement");

let currentView = "lock";
let enteredPassword = "";
let checkingPassword = false;
let passwordTimer;

function updatePasswordDots() {
  [...passcodeDots.children].forEach((dot, index) => {
    dot.classList.toggle("filled", index < enteredPassword.length);
  });
  passcodeDots.setAttribute("aria-label", `已输入 ${enteredPassword.length} 位，共 4 位`);
}

function resetPassword() {
  clearTimeout(passwordTimer);
  enteredPassword = "";
  checkingPassword = false;
  passcodeDots.classList.remove("is-error");
  passcodeStatus.textContent = "4자리 암호를 입력하십시오";
  updatePasswordDots();
}

function showView(view) {
  currentView = view;
  lockScreen.hidden = view !== "lock";
  passcodeScreen.hidden = view !== "passcode";
  homeScreen.hidden = view !== "home";
  appScreen.hidden = view !== "app";
  document.querySelector(".phone-screen").dataset.view = view;
  const statusLabel = document.querySelector("#status-label");
  statusLabel.dataset.showTime = String(view === "home" || view === "app");
  if (view === "lock" || view === "passcode") statusLabel.textContent = "SKT";
  updateClock();

  if (view === "passcode") digitButtons[0].focus();
  if (view === "lock") openPasscodeButton.focus();
  if (view === "home") {
    if (typeof layoutHomePages === "function") layoutHomePages();
    homeScreen.focus();
    screenAnnouncement.textContent = "잠금 해제됨";
  } else {
    screenAnnouncement.textContent = "";
  }
}

function openPasscode() {
  resetPassword();
  showView("passcode");
}

function enterDigit(digit) {
  if (currentView !== "passcode" || checkingPassword) return;

  passcodeStatus.textContent = "4자리 암호를 입력하십시오";
  enteredPassword += digit;
  updatePasswordDots();

  if (enteredPassword.length !== PHONE_PASSWORD.length) return;
  checkingPassword = true;

  if (enteredPassword === PHONE_PASSWORD) {
    passwordTimer = setTimeout(() => {
      resetPassword();
      showView("home");
    }, 160);
  } else {
    passcodeStatus.textContent = "암호가 올바르지 않습니다";
    passcodeDots.classList.add("is-error");
    passwordTimer = setTimeout(() => {
      enteredPassword = "";
      checkingPassword = false;
      passcodeDots.classList.remove("is-error");
      updatePasswordDots();
    }, 450);
  }
}

function deleteDigit() {
  if (checkingPassword) return;
  enteredPassword = enteredPassword.slice(0, -1);
  updatePasswordDots();
}

function cancelPasscode() {
  resetPassword();
  showView("lock");
}

openPasscodeButton.addEventListener("click", openPasscode);
digitButtons.forEach((button) => {
  button.addEventListener("click", () => enterDigit(button.dataset.digit));
});
document.querySelector("#delete-digit").addEventListener("click", deleteDigit);
document.querySelector("#cancel-passcode").addEventListener("click", cancelPasscode);

// 电脑也可以直接用键盘输入数字，Backspace 删除，Esc 取消。
document.addEventListener("keydown", (event) => {
  if (currentView !== "passcode" || event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    enterDigit(event.key);
  } else if (event.key === "Backspace") {
    event.preventDefault();
    deleteDigit();
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancelPasscode();
  }
});

// 在锁屏上向上滑动也会打开键盘。
let swipeStart = null;
lockScreen.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest("button")) return;
  swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  lockScreen.setPointerCapture(event.pointerId);
});
lockScreen.addEventListener("pointerup", (event) => {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  const movedUp = swipeStart.y - event.clientY;
  const movedSideways = Math.abs(swipeStart.x - event.clientX);
  swipeStart = null;
  if (currentView === "lock" && movedUp > 50 && movedUp > movedSideways) openPasscode();
});
lockScreen.addEventListener("pointercancel", () => { swipeStart = null; });
