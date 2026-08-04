// cloudfunctions/init/index.js
// 首次使用：在云开发控制台 → 云函数 → init → 测试，即可自动创建所有集合
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTIONS = [
  {
    name: 'users',
    desc: '用户档案',
    indexes: [
      { field: '_openid', unique: true }
    ]
  },
  {
    name: 'bills',
    desc: '账单记录',
    indexes: [
      { field: '_openid' },
      { field: 'date' },
      { field: 'category' },
      { field: 'activityId' }
    ]
  },
  {
    name: 'activities',
    desc: '羽毛球活动',
    indexes: [
      { field: '_openid' },
      { field: 'date' }
    ]
  }
];

exports.main = async (event, context) => {
  const results = [];

  for (const col of COLLECTIONS) {
    try {
      // 尝试创建集合（云开发会自动去重，已存在的不会重复创建）
      await db.createCollection(col.name);
      results.push({ collection: col.name, status: 'created', desc: col.desc });
    } catch (err) {
      // 集合已存在也视为正常
      if (err.errCode === -1 || err.message.includes('exist')) {
        results.push({ collection: col.name, status: 'already_exists', desc: col.desc });
      } else {
        results.push({ collection: col.name, status: 'error', message: err.message });
      }
    }
  }

  // 为 bills 集合创建复合索引提示
  const tips = [
    '✅ 数据库集合初始化完成',
    '',
    '📋 已创建/确认的集合：',
    ...results.map(r => `  ${r.status === 'created' ? '🆕' : '✅'} ${r.collection} - ${r.desc}`),
    '',
    '💡 建议在云开发控制台手动设置以下索引：',
    '  bills 集合: (date) 降序索引',
    '  activities 集合: (date) 降序索引',
    '',
    '🔐 权限设置建议：',
    '  所有集合 → 仅创建者可读写'
  ];

  return { code: 0, results, tips: tips.join('\n') };
};
