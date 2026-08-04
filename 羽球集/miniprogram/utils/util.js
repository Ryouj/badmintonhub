// utils/util.js - 工具函数

/**
 * 格式化日期
 */
function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (typeof date === 'string') date = new Date(date);
  if (!(date instanceof Date)) return '';

  const o = {
    'YYYY': date.getFullYear(),
    'MM': padZero(date.getMonth() + 1),
    'DD': padZero(date.getDate()),
    'HH': padZero(date.getHours()),
    'mm': padZero(date.getMinutes()),
    'ss': padZero(date.getSeconds())
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, match => o[match]);
}

function padZero(n) {
  return n < 10 ? '0' + n : String(n);
}

/**
 * 格式化金额
 */
function formatMoney(amount) {
  return '¥' + Number(amount).toFixed(2);
}

/**
 * 格式化时长（分钟）
 */
function formatDuration(minutes) {
  if (minutes < 60) return minutes + '分钟';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? h + '小时' + m + '分钟' : h + '小时';
}

/**
 * 获取本月起止日期
 */
function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

/**
 * 获取本周起止日期
 */
function getWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(now.getDate() + (7 - day));
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

module.exports = {
  formatDate,
  formatMoney,
  formatDuration,
  getMonthRange,
  getWeekRange
};
