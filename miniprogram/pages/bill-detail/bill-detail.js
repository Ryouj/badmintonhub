// pages/bill-detail/bill-detail.js
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');
const util = require('../../utils/util');

Page({
  data: {
    id: '',
    session: null,
    items: [],
    dateText: '',
    activityLabel: '',
    categoryMap: {}
  },

  onLoad(options) {
    wx.setNavigationBarTitle({ title: '账单详情' });
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  async loadDetail() {
    wx.showLoading({ title: '加载中...' });
    try {
      const data = await api.get('/bills/' + this.data.id);
      const session = data;
      const items = session.items || [];

      const categoryMap = {};
      BILL_CATEGORIES.forEach(c => { categoryMap[c.key] = c; });

      this.setData({
        session,
        items: items.map(item => ({
          ...item,
          categoryLabel: (categoryMap[item.category] || {}).label || item.category,
          categoryIcon: (categoryMap[item.category] || {}).icon || ''
        })),
        dateText: util.formatDate(session.date, 'YYYY年MM月DD日 HH:mm'),
        activityLabel: session.activityLabel || '',
        categoryMap
      });
    } catch (err) {
      console.error('加载账单详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  goEdit() {
    wx.navigateTo({
      url: '/pages/bill-add/bill-add?id=' + this.data.id
    });
  },

  deleteBill() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除这笔记账吗？',
      success: (res) => {
        if (res.confirm) {
          this.doDelete();
        }
      }
    });
  },

  async doDelete() {
    wx.showLoading({ title: '删除中...' });
    try {
      await api.del('/bills/' + this.data.id);
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});
