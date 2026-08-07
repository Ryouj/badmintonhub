// utils/tools-config.js
// 插拔式工具注册表 — 新增工具只需在此添加一条 + 创建对应页面目录
const TOOLS = [
  {
    key: 'fee',
    title: '球费计算器',
    icon: '💰',
    desc: 'AA、女生折扣、按轮次、败者买单等 8 种模式',
    color: '#e74c3c',
    page: '/pages/tool-fee/tool-fee',
    badge: '新'
  },
  {
    key: 'rotation',
    title: '八人转排班',
    icon: '🔄',
    desc: '擂台制、公平轮换、随机配对，自动排阵',
    color: '#3498db',
    page: '/pages/tool-rotation/tool-rotation',
    badge: '新'
  }
  // 新增工具在此追加：{ key, title, icon, desc, color, page }
];

module.exports = { TOOLS };
