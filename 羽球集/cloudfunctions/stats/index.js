// cloudfunctions/stats/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action, period } = event;

  switch (action) {
    case 'totalSum':
      return await getTotalSum(OPENID);
    case 'monthSum':
      return await getMonthSum(OPENID);
    case 'summary':
      return await getSummary(OPENID, period || 'month');
    default:
      return { code: -1, msg: '未知操作' };
  }
};

// 获取时间范围（根据 period）
function getDateRange(period) {
  const now = new Date();
  let start;

  switch (period) {
    case 'week': {
      const day = now.getDay() || 7;
      start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      start = new Date(2020, 0, 1);
      break;
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// 全部汇总
async function getTotalSum(openid) {
  try {
    // 账单总金额和笔数
    const billAgg = await db.collection('bills')
      .aggregate()
      .match({ _openid: openid })
      .group({
        _id: null,
        totalAmount: $.sum('$amount'),
        totalCount: $.sum(1)
      })
      .end();

    // 活动总时长和次数
    const actAgg = await db.collection('activities')
      .aggregate()
      .match({ _openid: openid })
      .group({
        _id: null,
        totalDuration: $.sum('$duration'),
        totalCount: $.sum(1)
      })
      .end();

    const billData = billAgg.list[0] || { totalAmount: 0, totalCount: 0 };
    const actData = actAgg.list[0] || { totalDuration: 0, totalCount: 0 };

    return {
      totalAmount: (billData.totalAmount || 0).toFixed(2),
      totalDuration: Math.round((actData.totalDuration || 0) / 60 * 10) / 10, // 转为小时
      totalCount: actData.totalCount || 0
    };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 本月汇总（首页用）
async function getMonthSum(openid) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date();

  try {
    const billAgg = await db.collection('bills')
      .aggregate()
      .match({
        _openid: openid,
        date: _.gte(start).and(_.lte(end))
      })
      .group({
        _id: null,
        totalAmount: $.sum('$amount')
      })
      .end();

    const actAgg = await db.collection('activities')
      .aggregate()
      .match({
        _openid: openid,
        date: _.gte(start).and(_.lte(end))
      })
      .group({
        _id: null,
        totalDuration: $.sum('$duration'),
        totalCount: $.sum(1)
      })
      .end();

    const billData = billAgg.list[0] || { totalAmount: 0 };
    const actData = actAgg.list[0] || { totalDuration: 0, totalCount: 0 };

    return {
      totalAmount: (billData.totalAmount || 0).toFixed(2),
      totalDuration: Math.round((actData.totalDuration || 0) / 60 * 10) / 10,
      totalCount: actData.totalCount || 0
    };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 详细统计（统计页用）
async function getSummary(openid, period) {
  const { start, end } = getDateRange(period);

  try {
    // 1. 基础汇总
    const billAgg = await db.collection('bills')
      .aggregate()
      .match({
        _openid: openid,
        date: _.gte(start).and(_.lte(end))
      })
      .group({
        _id: null,
        totalAmount: $.sum('$amount'),
        totalCount: $.sum(1)
      })
      .end();

    const actAgg = await db.collection('activities')
      .aggregate()
      .match({
        _openid: openid,
        date: _.gte(start).and(_.lte(end))
      })
      .group({
        _id: null,
        totalDuration: $.sum('$duration'),
        totalCount: $.sum(1),
        maxDuration: $.max('$duration')
      })
      .end();

    const billData = billAgg.list[0] || { totalAmount: 0, totalCount: 0 };
    const actData = actAgg.list[0] || { totalDuration: 0, totalCount: 0, maxDuration: 0 };

    // 2. 类别拆分
    const catAgg = await db.collection('bills')
      .aggregate()
      .match({
        _openid: openid,
        date: _.gte(start).and(_.lte(end))
      })
      .group({
        _id: '$category',
        amount: $.sum('$amount')
      })
      .end();

    const categoryBreakdown = {};
    catAgg.list.forEach(item => {
      categoryBreakdown[item._id] = item.amount;
    });

    // 3. 月度趋势（近12个月）
    const monthlyTrend = [];
    const now = new Date();
    for (let i = (period === 'all' ? 12 : 11); i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(m.getFullYear(), m.getMonth(), 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthAgg = await db.collection('bills')
        .aggregate()
        .match({
          _openid: openid,
          date: _.gte(mStart).and(_.lte(mEnd))
        })
        .group({
          _id: null,
          amount: $.sum('$amount')
        })
        .end();

      monthlyTrend.push({
        month: (m.getMonth() + 1) + '月',
        amount: monthAgg.list[0] ? Number(monthAgg.list[0].amount.toFixed(2)) : 0
      });
    }

    // 4. 常去球馆排行
    const venueAgg = await db.collection('activities')
      .aggregate()
      .match({
        _openid: openid,
        location: _.neq(''),
        date: _.gte(start).and(_.lte(end))
      })
      .group({
        _id: '$location',
        count: $.sum(1)
      })
      .sort({ count: -1 })
      .limit(5)
      .end();

    const topVenues = venueAgg.list.map(v => ({
      name: v._id,
      count: v.count
    }));

    return {
      totalAmount: billData.totalAmount || 0,
      totalCount: billData.totalCount || 0,
      totalDuration: Math.round((actData.totalDuration || 0) / 60 * 10) / 10,
      maxDuration: actData.maxDuration || 0,
      activityCount: actData.totalCount || 0,
      categoryBreakdown,
      monthlyTrend,
      topVenues
    };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}
