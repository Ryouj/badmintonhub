// cloudfunctions/activity/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'create':
      return await createActivity(OPENID, event.activity);
    case 'list':
      return await listActivities(OPENID, event.pageSize || 20);
    case 'get':
      return await getActivity(OPENID, event.id);
    default:
      return { code: -1, msg: '未知操作' };
  }
};

// 创建活动
async function createActivity(openid, activity) {
  try {
    const data = {
      _openid: openid,
      date: new Date(activity.date),
      duration: Number(activity.duration),
      location: activity.location || '',
      playerCount: Number(activity.playerCount) || 0,
      note: activity.note || '',
      createTime: db.serverDate()
    };
    const res = await db.collection('activities').add({ data });
    return { code: 0, id: res._id };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 活动列表
async function listActivities(openid, pageSize) {
  try {
    const res = await db.collection('activities')
      .where({ _openid: openid })
      .orderBy('date', 'desc')
      .limit(pageSize)
      .get();

    // 关联每个活动的账单数量
    const activities = await Promise.all(res.data.map(async (act) => {
      const bills = await db.collection('bills')
        .where({ activityId: act._id })
        .count();
      return { ...act, billCount: bills.total };
    }));

    return { code: 0, list: activities };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 单条活动
async function getActivity(openid, id) {
  try {
    const res = await db.collection('activities').doc(id).get();
    return { code: 0, data: res.data };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}
