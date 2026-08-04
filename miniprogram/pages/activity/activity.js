// pages/activity/activity.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    form: {
      date: '',
      durationHours: '',
      durationMinutes: '',
      location: '',
      playerCount: '',
      note: ''
    }
  },

  onLoad() {
    this.setData({ 'form.date': util.formatDate(new Date()) });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value });
  },

  async submitActivity() {
    const { date, durationHours, durationMinutes } = this.data.form;
    if (!date) {
      wx.showToast({ title: '请选择日期', icon: 'none' }); return;
    }

    const hours = parseInt(durationHours) || 0;
    const minutes = parseInt(durationMinutes) || 0;
    const totalDuration = hours * 60 + minutes;

    if (totalDuration <= 0) {
      wx.showToast({ title: '请输入运动时长', icon: 'none' }); return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      await api.activityAPI.create({
        date: date + 'T00:00:00+08:00',
        duration: totalDuration,
        location: this.data.form.location || '',
        playerCount: parseInt(this.data.form.playerCount) || 0,
        note: this.data.form.note || ''
      });

      wx.showToast({ title: '已记录', icon: 'success' });
      this.setData({
        form: {
          date: util.formatDate(new Date()),
          durationHours: '',
          durationMinutes: '',
          location: '',
          playerCount: '',
          note: ''
        }
      });
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  }
});
