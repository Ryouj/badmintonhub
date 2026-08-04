// cloudfunctions/bill/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'create':
      return await createBill(OPENID, event.bill);
    case 'update':
      return await updateBill(OPENID, event.id, event.bill);
    case 'delete':
      return await deleteBill(OPENID, event.id);
    case 'get':
      return await getBill(OPENID, event.id);
    case 'list':
      return await listBills(OPENID, event.pageSize || 20);
    case 'listByMonth':
      return await listByMonth(OPENID, event.month);
    default:
      return { code: -1, msg: '未知操作' };
  }
};

// 创建账单
async function createBill(openid, bill) {
  try {
    const data = {
      _openid: openid,
      amount: Number(bill.amount),
      category: bill.category || 'other',
      date: new Date(bill.date),
      note: bill.note || '',
      activityId: bill.activityId || '',
      activityLabel: bill.activityLabel || '',
      createTime: db.serverDate()
    };
    const res = await db.collection('bills').add({ data });
    return { code: 0, id: res._id };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 更新账单
async function updateBill(openid, id, bill) {
  try {
    await db.collection('bills').doc(id).update({
      data: {
        amount: Number(bill.amount),
        category: bill.category,
        date: new Date(bill.date),
        note: bill.note || '',
        activityId: bill.activityId || '',
        activityLabel: bill.activityLabel || '',
        updateTime: db.serverDate()
      }
    });
    return { code: 0 };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 删除账单
async function deleteBill(openid, id) {
  try {
    await db.collection('bills').doc(id).remove();
    return { code: 0 };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 获取单条账单
async function getBill(openid, id) {
  try {
    const res = await db.collection('bills').doc(id).get();
    return { code: 0, data: res.data };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 分页列表
async function listBills(openid, pageSize) {
  try {
    const res = await db.collection('bills')
      .where({ _openid: openid })
      .orderBy('date', 'desc')
      .limit(pageSize)
      .get();
    return { code: 0, list: res.data };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 按月查询
async function listByMonth(openid, month) {
  try {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59, 999);

    const res = await db.collection('bills')
      .where({
        _openid: openid,
        date: _.gte(start).and(_.lte(end))
      })
      .orderBy('date', 'desc')
      .get();

    return { code: 0, list: res.data };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}
