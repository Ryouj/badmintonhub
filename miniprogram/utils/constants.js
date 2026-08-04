// utils/constants.js - 常量定义

// 开销类别
const BILL_CATEGORIES = [
  { key: 'court',     label: '场地费', icon: '🏟️', color: '#e74c3c' },
  { key: 'shuttle',   label: '球费',   icon: '🏸', color: '#f39c12' },
  { key: 'drink',     label: '饮料',   icon: '🥤', color: '#3498db' },
  { key: 'stringing', label: '绑线',   icon: '🧵', color: '#9b59b6' },
  { key: 'equipment', label: '装备',   icon: '👟', color: '#1abc9c' },
  { key: 'other',     label: '其他',   icon: '📋', color: '#7f8c8d' }
];

// 技术水平等级
const SKILL_LEVELS = [
  { key: 'beginner',     label: '新手',   desc: '刚开始接触羽毛球' },
  { key: 'elementary',   label: '初级',   desc: '掌握基本动作，能进行简单对打' },
  { key: 'intermediate', label: '中级',   desc: '掌握各项技术，有比赛经验' },
  { key: 'advanced',     label: '高级',   desc: '技术全面，经常参加比赛' },
  { key: 'expert',       label: '专业',   desc: '具有专业训练背景' }
];

// 打球频率选项
const PLAY_FREQUENCY = [
  { key: 'daily',   label: '每天' },
  { key: 'weekly2', label: '每周2-3次' },
  { key: 'weekly1', label: '每周1次' },
  { key: 'monthly2',label: '每月2-3次' },
  { key: 'monthly1',label: '每月1次' },
  { key: 'rarely',  label: '偶尔' }
];

// 打球年限选项
const PLAY_YEARS = [
  { key: '0-1', label: '不到1年' },
  { key: '1-3', label: '1-3年' },
  { key: '3-5', label: '3-5年' },
  { key: '5-10',label: '5-10年' },
  { key: '10+', label: '10年以上' }
];

// 打球类型
const PLAY_STYLES = [
  { key: 'casual',   label: '休闲养生' },
  { key: 'social',   label: '社交娱乐' },
  { key: 'training', label: '技术训练' },
  { key: 'compete',  label: '比赛竞技' }
];

module.exports = {
  BILL_CATEGORIES,
  SKILL_LEVELS,
  PLAY_FREQUENCY,
  PLAY_YEARS,
  PLAY_STYLES
};
