// pages/activity-list/activity-list.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    list: [],
    totalDuration: 0,
    totalCount: 0,
    avgDuration: 0
  },

  onShow() {
    this.loadActivities();
  },

  onPullDownRefresh() {
    this.loadActivities().then(() => wx.stopPullDownRefresh());
  },

  async loadActivities() {
    wx.showLoading({ title: '加载中...' });
    try {
      const data = await api.activityAPI.list({ pageSize: 100 });
      const list = (data.list || []).map(a => {
        const duration = a.duration || 0;
        return {
          ...a,
          dateText: util.formatDate(a.date, 'MM-DD'),
          durationText: util.formatDuration(duration)
        };
      });

      const totalCount = data.total || list.length;
      const totalMinutes = list.reduce((s, a) => s + (a.duration || 0), 0);

      this.setData({
        list,
        totalDuration: (totalMinutes / 60).toFixed(1),
        totalCount,
        avgDuration: totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0
      });
    } catch (err) {
      console.error('加载活动失败:', err);
    }
    wx.hideLoading();
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/activity/activity' });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/activity/activity?id=' + id });
  },

  async onLongPress(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({ title: '删除活动', content: '删除后不可恢复' });
    if (!res.confirm) return;
    try {
      await api.activityAPI.delete(id);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadActivities();
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});
