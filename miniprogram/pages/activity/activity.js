// pages/activity/activity.js
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    isEdit: false,
    editId: null,
    form: {
      date: '',
      durationHours: '',
      durationMinutes: '',
      location: '',
      playerCount: '',
      note: ''
    }
  },

  onLoad(options) {
    this.setData({ 'form.date': util.formatDate(new Date()) });

    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑活动' });
      this.loadActivity(options.id);
    }
  },

  async loadActivity(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const data = await api.activityAPI.get(id);
      const a = data.Activity || data;
      const duration = a.duration || 0;
      this.setData({
        form: {
          date: util.formatDate(a.date),
          durationHours: String(Math.floor(duration / 60)),
          durationMinutes: String(duration % 60),
          location: a.location || '',
          playerCount: a.playerCount ? String(a.playerCount) : '',
          note: a.note || ''
        }
      });
    } catch (err) {
      console.error('加载活动失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
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
    const payload = {
      date: date + 'T00:00:00+08:00',
      duration: totalDuration,
      location: this.data.form.location || '',
      playerCount: parseInt(this.data.form.playerCount) || 0,
      note: this.data.form.note || ''
    };

    try {
      if (this.data.isEdit) {
        await api.activityAPI.update(this.data.editId, payload);
      } else {
        await api.activityAPI.create(payload);
      }
      wx.showToast({ title: this.data.isEdit ? '已更新' : '已记录', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async deleteActivity() {
    const res = await wx.showModal({ title: '确认删除', content: '删除后不可恢复' });
    if (!res.confirm) return;
    try {
      await api.activityAPI.delete(this.data.editId);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});
