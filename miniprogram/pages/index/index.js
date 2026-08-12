// pages/index/index.js
const util = require('../../utils/util');
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');

Page({
  data: {
    userInfo: {},
    monthStats: {
      totalAmount: '0.00',
      totalDuration: 0,
      totalCount: 0
    },
    recentBills: [],
    recentActivities: []
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    var app = getApp();
    await app.ensureLogin();
    this.setData({
      userInfo: app.globalData.userInfo || {}
    });
    
    wx.showLoading({ title: '加载中...' });
    try {
      const [stats, billsData, actData] = await Promise.all([
        api.statsAPI.summary('month'),
        api.billAPI.list({ pageSize: 5 }),
        api.activityAPI.list({ pageSize: 3 })
      ]);

      this.setData({
        monthStats: {
          totalAmount: (stats.totalAmount || 0).toFixed(2),
          totalDuration: Math.round((stats.totalDuration || 0) * 10) / 10,
          totalCount: stats.activityCount || 0
        },
        recentBills: this.formatBills(billsData.list || []),
        recentActivities: this.formatActivities(actData.list || [])
      });
    } catch (err) {
      console.error('加载数据失败:', err);
      wx.showToast({ title: '加载失败，下拉刷新重试', icon: 'none' });
    }
    wx.hideLoading();
  },

  formatBills(bills) {
    return bills.map(b => ({
      ...b,
      dateText: util.formatDate(b.date, 'MM-DD HH:mm'),
      totalText: (b.totalAmount || b.amount || 0).toFixed(2),
      items: (b.items || []).map(it => ({
        ...it,
        categoryLabel: this.getCategoryLabel(it.category)
      }))
    }));
  },

  formatActivities(activities) {
    return activities.map(a => ({
      ...a,
      dateText: util.formatDate(a.date, 'MM-DD'),
      durationText: util.formatDuration(a.duration || 0)
    }));
  },

  getCategoryLabel(key) {
    const cat = BILL_CATEGORIES.find(c => c.key === key);
    return cat ? cat.label : '其他';
  },

  getCategoryIcon(key) {
    const cat = BILL_CATEGORIES.find(c => c.key === key);
    return cat ? cat.icon : '📋';
  },

  goProfile() { wx.switchTab({ url: '/pages/profile/profile' }); },
  goAddBill() { wx.navigateTo({ url: '/pages/bill-add/bill-add' }); },
  goActivityList() { wx.navigateTo({ url: '/pages/activity-list/activity-list' }); },
  goStats() { wx.switchTab({ url: '/pages/stats/stats' }); },
  goTools() { wx.switchTab({ url: '/pages/tools/tools' }); },
  goBills() { wx.switchTab({ url: '/pages/bills/bills' }); },
  goBillDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/bill-detail/bill-detail?id=' + id });
  },

  // 转发给朋友
  onShareAppMessage() {
    return {
      title: '羽球集 — 羽毛球记账+球费计算神器',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return { title: '羽球集 — 羽毛球记账+球费计算神器' };
  }
});
