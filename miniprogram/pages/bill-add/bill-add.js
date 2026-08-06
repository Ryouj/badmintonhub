// pages/bill-add/bill-add.js - 记账+活动（合并页）
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');
const util = require('../../utils/util');

Page({
  data: {
    isEdit: false,
    editId: null,
    categories: BILL_CATEGORIES,
    totalAmount: '0.00',
    form: {
      date: '',
      time: '',
      note: '',
      // 活动字段
      durationHours: '',
      durationMinutes: '',
      location: '',
      playerCount: '',
      // 账单项目
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
      wx.setNavigationBarTitle({ title: '编辑记录' });
      this.loadBill(options.id);
    }
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
      // 如果有关联活动，加载活动信息
      let actFields = { durationHours: '', durationMinutes: '', location: '', playerCount: '' };
      if (bill.activityId) {
        try {
          const act = await api.activityAPI.get(bill.activityId);
          const dur = act.duration || act.Activity?.duration || 0;
          actFields = {
            durationHours: String(Math.floor(dur / 60)),
            durationMinutes: String(dur % 60),
            location: act.location || act.Activity?.location || '',
            playerCount: (act.playerCount || act.Activity?.playerCount) ? String(act.playerCount || act.Activity?.playerCount) : ''
          };
        } catch (e) { /* 活动不存在则忽略 */ }
      }
      this.setData({
        'form.date': util.formatDate(bill.date, 'YYYY-MM-DD'),
        'form.time': util.formatDate(bill.date, 'HH:mm'),
        'form.note': bill.note || '',
        'form.items': items,
        ...Object.fromEntries(Object.entries(actFields).map(([k, v]) => ['form.' + k, v]))
      });
      this.calcTotal();
    } catch (err) {
      console.error('加载记录失败:', err);
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

  // 提交
  async submitBill() {
    const form = this.data.form;

    // --- 校验活动信息 ---
    const durH = parseInt(form.durationHours) || 0;
    const durM = parseInt(form.durationMinutes) || 0;
    const totalDuration = durH * 60 + durM;
    const hasActivity = totalDuration > 0;
    if (hasActivity && totalDuration > 1440) {
      wx.showToast({ title: '运动时长不能超过24小时', icon: 'none' }); return;
    }

    // --- 校验账单 ---
    const hasBillItems = form.items.some(it => it.category && it.amount && parseFloat(it.amount) > 0);
    if (!hasActivity && !hasBillItems) {
      wx.showToast({ title: '请填写活动信息或消费明细', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      let activityId = 0;
      let activityLabel = '';

      // 先创建活动（如果有）
      if (hasActivity) {
        const actPayload = {
          date: form.date + 'T00:00:00+08:00',
          duration: totalDuration,
          location: form.location || '',
          playerCount: parseInt(form.playerCount) || 0
        };
        if (!this.data.isEdit) {
          const actRes = await api.activityAPI.create(actPayload);
          activityId = actRes.id || actRes.Activity?.id || 0;
          activityLabel = form.location || '';
        } else {
          // 编辑模式：更新关联的活动
          const bill = await api.billAPI.get(this.data.editId);
          if (bill.activityId) {
            await api.activityAPI.update(bill.activityId, actPayload);
            activityId = bill.activityId;
            activityLabel = form.location || '';
          } else {
            const actRes = await api.activityAPI.create(actPayload);
            activityId = actRes.id || actRes.Activity?.id || 0;
            activityLabel = form.location || '';
          }
        }
      }

      // 创建/更新账单
      if (hasBillItems) {
        const validItems = form.items
          .filter(it => it.category && it.amount && parseFloat(it.amount) > 0)
          .map(it => ({ category: it.category, amount: parseFloat(it.amount) }));
        const date = form.date + 'T' + (form.time || '00:00') + ':00+08:00';
        const body = { date, note: form.note, activityId, activityLabel, items: validItems };

        if (this.data.isEdit) {
          await api.billAPI.update(this.data.editId, body);
        } else {
          await api.billAPI.create(body);
        }
      } else if (this.data.isEdit) {
        // 编辑模式但没有账单项目 → 删除账单（只保留活动）
        await api.billAPI.delete(this.data.editId);
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败: ' + (err.message || '请重试'), icon: 'none' });
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
