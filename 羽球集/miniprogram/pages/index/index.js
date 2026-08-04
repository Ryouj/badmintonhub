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
    const app = getApp();
    await app.ensureLogin();
    this.setData({ userInfo: app.globalData.userInfo || {} });
    
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
    }
    wx.hideLoading();
  },

  formatBills(bills) {
    return bills.map(b => ({
      ...b,
      dateText: util.formatDate(b.date, 'MM-DD HH:mm'),
      categoryLabel: this.getCategoryLabel(b.category),
      categoryIcon: this.getCategoryIcon(b.category)
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
  goAddActivity() { wx.navigateTo({ url: '/pages/activity/activity' }); },
  goStats() { wx.switchTab({ url: '/pages/stats/stats' }); },
  goBills() { wx.switchTab({ url: '/pages/bills/bills' }); },
  goBillDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/bill-add/bill-add?id=' + id });
  }
});
