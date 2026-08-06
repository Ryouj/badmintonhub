// pages/bill-add/bill-add.js
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');
const util = require('../../utils/util');

Page({
  data: {
    isEdit: false,
    editId: null,
    categories: BILL_CATEGORIES,
    activities: [],
    activityLabels: [],
    form: {
      amount: '',
      category: 'court',
      date: '',
      time: '',
      note: '',
      activityId: 0,
      activityLabel: '不关联'
    }
  },

  onLoad(options) {
    const now = new Date();
    this.setData({
      'form.date': util.formatDate(now),
      'form.time': util.formatDate(now, 'HH:mm')
    });

    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑账单' });
      this.loadBill(options.id);
    }
  },

  onShow() {
    this.loadActivities();
  },

  async loadActivities() {
    try {
      const data = await api.activityAPI.list({ pageSize: 50 });
      const acts = data.list || [];
      const labels = ['不关联', ...acts.map(a => util.formatDate(a.date, 'MM-DD') + ' ' + (a.location || '未记录'))];
      this.setData({ activities: acts, activityLabels: labels });
    } catch (err) {
      console.error(err);
    }
  },

  async loadBill(id) {
    try {
      const bill = await api.billAPI.get(id);
      if (bill) {
        const date = new Date(bill.date);
        this.setData({
          form: {
            amount: String(bill.amount),
            category: bill.category,
            date: util.formatDate(date),
            time: util.formatDate(date, 'HH:mm'),
            note: bill.note || '',
            activityId: bill.activityId || 0,
            activityLabel: bill.activityLabel || '不关联'
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  selectCategory(e) {
    this.setData({ 'form.category': e.currentTarget.dataset.key });
  },

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ 'form.time': e.detail.value });
  },

  onActivityChange(e) {
    const idx = e.detail.value;
    if (idx === 0) {
      this.setData({ 'form.activityId': 0, 'form.activityLabel': '不关联' });
    } else {
      const act = this.data.activities[idx - 1];
      this.setData({ 'form.activityId': act.id, 'form.activityLabel': this.data.activityLabels[idx] });
    }
  },

  async submitBill() {
    const { amount, category, date, time } = this.data.form;
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' }); return;
    }
    if (!date) {
      wx.showToast({ title: '请选择日期', icon: 'none' }); return;
    }

    wx.showLoading({ title: '保存中...' });
    const billData = {
      amount: parseFloat(amount),
      category,
      date: date + 'T' + (time || '00:00') + ':00+08:00',
      note: this.data.form.note || '',
      activityId: this.data.form.activityId || 0,
      activityLabel: this.data.form.activityLabel || ''
    };

    try {
      if (this.data.isEdit) {
        await api.billAPI.update(this.data.editId, billData);
      } else {
        await api.billAPI.create(billData);
      }
      wx.showToast({ title: this.data.isEdit ? '已更新' : '已记录', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  async deleteBill() {
    const res = await wx.showModal({ title: '确认删除', content: '删除后不可恢复' });
    if (!res.confirm) return;
    try {
      await api.billAPI.delete(this.data.editId);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});
