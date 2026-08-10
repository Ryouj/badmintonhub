// utils/constants.js - 常量定义

// 开销类别
const BILL_CATEGORIES = [
  { key: 'court',     label: '场地费', icon: '🏟️', color: '#e74c3c' },
  { key: 'shuttle',   label: '球费',   icon: '🏸', color: '#f39c12' },
  { key: 'drink',     label: '饮料',   icon: '🥤', color: '#3498db' },
  { key: 'transport', label: '交通费', icon: '🚗', color: '#2ecc71' },
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

// 擅长打法（个人档案页用）
const PLAY_TYPES = ['拉吊突击', '防守反击', '进攻杀球', '控网抢攻', '四方球', '混合型'];

// 惯用手（个人档案页用）
const HANDS = ['右手', '左手'];

// 球拍品牌型号
const RACKET_BRANDS = [
  { key: 'yonex-100zz',   label: 'Yonex 天斧100ZZ' },
  { key: 'yonex-88dp',    label: 'Yonex 天斧88D Pro' },
  { key: 'yonex-77p',     label: 'Yonex 天斧77 Pro' },
  { key: 'yonex-arc11p',  label: 'Yonex 弓剑11 Pro' },
  { key: 'yonex-nf800',   label: 'Yonex 疾光800' },
  { key: 'yonex-nf1000z', label: 'Yonex 疾光1000Z' },
  { key: 'victor-100x',   label: 'Victor 神速100X' },
  { key: 'victor-90k',    label: 'Victor 驭9X' },
  { key: 'lining-900',    label: '李宁 风刃900' },
  { key: 'lining-80',     label: '李宁 雷霆80' },
  { key: 'lining-8000',   label: '李宁 战戟8000' },
  { key: 'kawasaki-h2',   label: '川崎 矛18' },
  { key: 'other',         label: '其他品牌' }
];

// 羽毛球鞋
const SHOE_BRANDS = [
  { key: 'yonex-65z3',   label: 'Yonex 65Z3' },
  { key: 'yonex-cascade', label: 'Yonex 超轻4代' },
  { key: 'yonex-eclipsion', label: 'Yonex Eclipsion Z3' },
  { key: 'victor-p9200',  label: 'Victor P9200' },
  { key: 'victor-a970',   label: 'Victor A970' },
  { key: 'victor-s82',    label: 'Victor S82' },
  { key: 'lining-blade',  label: '李宁 变色龙' },
  { key: 'lining-shadow', label: '李宁 影速' },
  { key: 'lining-sonic',  label: '李宁 音爆' },
  { key: 'mizuno-wave',   label: 'Mizuno Wave Claw' },
  { key: 'other',         label: '其他品牌' }
];

// 羽毛球品牌
const SHUTTLE_BRANDS = [
  { key: 'yonex-as50',  label: 'Yonex AS50' },
  { key: 'yonex-as40',  label: 'Yonex AS40' },
  { key: 'yonex-as30',  label: 'Yonex AS30' },
  { key: 'yonex-as20',  label: 'Yonex AS20' },
  { key: 'yonex-as05',  label: 'Yonex AS05' },
  { key: 'victor-master', label: 'Victor Master 大师' },
  { key: 'victor-champion', label: 'Victor Champion 冠军' },
  { key: 'victor-gold',  label: 'Victor Gold 金黄' },
  { key: 'lining-a3',    label: '李宁 A3' },
  { key: 'lining-a6',    label: '李宁 A6' },
  { key: 'lining-g600',  label: '李宁 G600' },
  { key: 'lingmei-7',    label: '翎美 7号' },
  { key: 'rsl-4',        label: 'RSL 4号' },
  { key: 'rsl-5',        label: 'RSL 5号' },
  { key: 'other',        label: '其他品牌' }
];

// 拉线磅数
const STRING_TENSIONS = [];
for (var i = 22; i <= 32; i++) {
  STRING_TENSIONS.push({ key: String(i), label: i + '磅' });
}

// 城市
const CITIES = [
  { key: '北京', label: '北京' }, { key: '上海', label: '上海' },
  { key: '广州', label: '广州' }, { key: '深圳', label: '深圳' },
  { key: '杭州', label: '杭州' }, { key: '南京', label: '南京' },
  { key: '成都', label: '成都' }, { key: '重庆', label: '重庆' },
  { key: '武汉', label: '武汉' }, { key: '西安', label: '西安' },
  { key: '苏州', label: '苏州' }, { key: '宁波', label: '宁波' },
  { key: '温州', label: '温州' }, { key: '厦门', label: '厦门' },
  { key: '福州', label: '福州' }, { key: '长沙', label: '长沙' },
  { key: '天津', label: '天津' }, { key: '郑州', label: '郑州' },
  { key: '济南', label: '济南' }, { key: '青岛', label: '青岛' },
  { key: '大连', label: '大连' }, { key: '合肥', label: '合肥' },
  { key: '东莞', label: '东莞' }, { key: '佛山', label: '佛山' }
];

// 统一文案
const LABELS = {
  NOT_SET: '未设置',
  PLEASE_SELECT: '请选择',
  NO_RECORD: '未记录',
  LOAD_FAILED: '加载失败',
  NETWORK_ERROR: '网络错误'
};

module.exports = {
  BILL_CATEGORIES,
  SKILL_LEVELS,
  PLAY_FREQUENCY,
  PLAY_YEARS,
  PLAY_STYLES,
  PLAY_TYPES,
  HANDS,
  RACKET_BRANDS,
  SHOE_BRANDS,
  SHUTTLE_BRANDS,
  STRING_TENSIONS,
  CITIES,
  LABELS
};
