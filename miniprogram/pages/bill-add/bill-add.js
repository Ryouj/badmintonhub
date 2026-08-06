// pages/bill-add/bill-add.js - 多项目记账
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');
const util = require('../../utils/util');

Page({
  data: {
    isEdit: false,
    editId: null,
    categories: BILL_CATEGORIES,
    activityLabels: [],
    activityMap: [],
    totalAmount: '0.00',
    form: {
      date: '',
      time: '',
      note: '',
      activityId: 0,
      activityLabel: '',
      items: [
        { category: '', categoryLabel: '', amount: '' }
      ]
    }
  },

  onLoad(options) {
    const now = new Date();
    this.setData({
      'form.date': util.formatDate(now, 'YYYY-MM-DD'),
      'form.time': util.formatDate(now, 'HH:mm')
    });

    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      this.loadBill(options.id);
    }

    this.loadActivities();
  },

  // 加载已有记录（编辑模式）
  async loadBill(id) {
    try {
      const bill = await api.billAPI.get(id);
      const items = (bill.items || []).map(it => ({
        category: it.category,
        categoryLabel: this.getCategoryLabel(it.category),
        amount: String(it.amount)
      }));
      if (items.length === 0) {
        items.push({ category: '', categoryLabel: '', amount: '' });
      }
      this.setData({
        'form.date': util.formatDate(bill.date, 'YYYY-MM-DD'),
        'form.time': util.formatDate(bill.date, 'HH:mm'),
        'form.note': bill.note || '',
        'form.activityId': bill.activityId || 0,
        'form.activityLabel': bill.activityLabel || '',
        'form.items': items
      });
      this.calcTotal();
    } catch (err) {
      console.error('加载记录失败:', err);
    }
  },

  // 加载活动列表
  async loadActivities() {
    try {
      const data = await api.activityAPI.list();
      const list = data.list || [];
      const labels = ['不关联'];
      const map = [{ id: 0, label: '' }];
      list.forEach(a => {
        const label = util.formatDate(a.date, 'MM/DD') + ' ' + (a.location || '未命名');
        labels.push(label);
        map.push({ id: a.id, label: a.location || '未命名' });
      });
      this.setData({ activityLabels: labels, activityMap: map });
    } catch (err) {
      // 活动列表加载失败不影响记账
    }
  },

  getCategoryLabel(key) {
    const cat = BILL_CATEGORIES.find(c => c.key === key);
    return cat ? cat.label : '';
  },

  // 项目操作
  addItem() {
    const items = [...this.data.form.items, { category: '', categoryLabel: '', amount: '' }];
    this.setData({ 'form.items': items });
  },

  removeItem(e) {
    const idx = e.currentTarget.dataset.index;
    const items = this.data.form.items.filter((_, i) => i !== idx);
    this.setData({ 'form.items': items });
    this.calcTotal();
  },

  onItemCategoryTap(e) {
    const { index, catKey, catLabel } = e.currentTarget.dataset;
    this.setData({
      ['form.items[' + index + '].category']: catKey,
      ['form.items[' + index + '].categoryLabel']: catLabel
    });
  },

  quickAddItem(e) {
    if (this.data.form.items.length >= 8) return;
    const { catKey, catLabel } = e.currentTarget.dataset;
    const items = [...this.data.form.items, { category: catKey, categoryLabel: catLabel, amount: '' }];
    this.setData({ 'form.items': items });
  },

  onItemAmount(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ ['form.items[' + idx + '].amount']: e.detail.value });
    this.calcTotal();
  },

  calcTotal() {
    let total = 0;
    (this.data.form.items || []).forEach(it => {
      total += parseFloat(it.amount) || 0;
    });
    this.setData({ totalAmount: total.toFixed(2) });
  },

  // 日期时间
  onDateChange(e) { this.setData({ 'form.date': e.detail.value }); },
  onTimeChange(e) { this.setData({ 'form.time': e.detail.value }); },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onActivityChange(e) {
    const idx = parseInt(e.detail.value);
    if (idx === 0) {
      this.setData({ 'form.activityId': 0, 'form.activityLabel': '' });
    } else {
      const map = this.data.activityMap[idx] || {};
      this.setData({ 'form.activityId': map.id, 'form.activityLabel': map.label });
    }
  },

  // 提交
  async submitBill() {
    const form = this.data.form;

    // 校验
    const validItems = form.items.filter(it => it.category && it.amount && parseFloat(it.amount) > 0);
    if (validItems.length === 0) {
      wx.showToast({ title: '请至少添加一个有效项目', icon: 'none' });
      return;
    }

    const date = form.date + 'T' + (form.time || '00:00') + ':00+08:00';
    const body = {
      date,
      note: form.note,
      activityId: form.activityId || 0,
      activityLabel: form.activityLabel || '',
      items: validItems.map(it => ({
        category: it.category,
        amount: parseFloat(it.amount)
      }))
    };

    wx.showLoading({ title: '保存中...' });
    try {
      if (this.data.isEdit) {
        await api.billAPI.update(this.data.editId, body);
      } else {
        await api.billAPI.create(body);
      }
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 删除
  async deleteBill() {
    const confirm = await wx.showModal({ title: '确认删除', content: '删除后不可恢复' });
    if (confirm.confirm) {
      try {
        await api.billAPI.delete(this.data.editId);
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      } catch (err) {
        wx.showToast({ title: '删除失败', icon: 'none' });
      }
    }
  }
});
