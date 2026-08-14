// pages/bills/bills.js - 账单列表（多项目模式）
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');
const util = require('../../utils/util');

Page({
  data: {
    bills: [],
    groupedBills: [],
    loggedOut: false,
    filterMonth: '',
    filterMonthText: '',
    totalCount: 0,
    totalAmount: '0.00'
  },

  onLoad() {
    const now = new Date();
    this.setData({
      filterMonth: util.formatDate(now, 'YYYY-MM'),
      filterMonthText: util.formatDate(now, 'YYYY年MM月')
    });
  },

  onShow() {
    this.loadBills();
  },

  onMonthChange(e) {
    const month = e.detail.value;
    this.setData({
      filterMonth: month,
      filterMonthText: month.replace('-', '年') + '月'
    });
    this.loadBills();
  },

  async loadBills() {
    var app = getApp();
    var loggedIn = await app.ensureLogin();
    if (!loggedIn) {
      // 未登录：展示浏览态，不强制跳转
      this.setData({ loggedOut: true });
      return;
    }
    this.setData({ loggedOut: false });

    wx.showLoading({ title: '加载中...' });
    try {
      const data = await api.billAPI.list({ month: this.data.filterMonth });
      const bills = (data.list || []).map(b => ({
        ...b,
        timeText: util.formatDate(b.date, 'HH:mm'),
        totalText: (b.totalAmount || b.amount || 0).toFixed(2),
        items: (b.items || []).map(it => ({
          ...it,
          categoryLabel: this.getLabel(it.category),
          amountText: (it.amount || 0).toFixed(2)
        }))
      }));

      const grouped = this.groupByDate(bills);
      this.setData({
        bills,
        groupedBills: grouped,
        totalCount: data.totalCount || bills.length,
        totalAmount: (data.totalAmount || 0).toFixed(2)
      });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败，下拉刷新重试', icon: 'none' });
    }
    wx.hideLoading();
    wx.stopPullDownRefresh();
  },

  onPullDownRefresh() {
    this.loadBills();
  },

  groupByDate(bills) {
    const groups = {};
    bills.forEach(b => {
      const dateKey = util.formatDate(b.date, 'YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey + ' ' + this.getDayOfWeek(b.date), items: [], total: 0 };
      }
      groups[dateKey].items.push(b);
      groups[dateKey].total += (b.totalAmount || b.amount || 0);
    });
    return Object.values(groups).map(g => ({ ...g, total: g.total.toFixed(2) }));
  },

  getDayOfWeek(dateStr) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(dateStr).getDay()];
  },

  getLabel(key) {
    const cat = BILL_CATEGORIES.find(c => c.key === key);
    return cat ? cat.label : '其他';
  },

  goAdd() {
    if (!getApp().globalData.isLoggedIn) { getApp().goLogin(); }
    wx.navigateTo({ url: '/pages/bill-add/bill-add' });
  },

  goLogin() { getApp().goLogin(); },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/bill-detail/bill-detail?id=' + e.currentTarget.dataset.id });
  },

  goEdit(e) {
    wx.navigateTo({ url: '/pages/bill-add/bill-add?id=' + e.currentTarget.dataset.id });
  },

  onLongPress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/bill-add/bill-add?id=' + id });
        } else if (res.tapIndex === 1) {
          const confirm = await wx.showModal({ title: '确认删除', content: '删除后不可恢复' });
          if (confirm.confirm) {
            await api.billAPI.delete(id);
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadBills();
          }
        }
      }
    });
  },

  // 转发给朋友
  onShareAppMessage() {
    return {
      title: '羽球集 — 我的羽毛球账单',
      path: '/pages/bills/bills'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return { title: '羽球集 — 我的羽毛球账单' };
  }
});
