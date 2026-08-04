// pages/bills/bills.js
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');
const util = require('../../utils/util');

Page({
  data: {
    bills: [],
    groupedBills: [],
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
    wx.showLoading({ title: '加载中...' });
    try {
      const data = await api.billAPI.list({ month: this.data.filterMonth });
      const bills = (data.list || []).map(b => ({
        ...b,
        timeText: util.formatDate(b.date, 'HH:mm'),
        categoryIcon: this.getIcon(b.category),
        categoryLabel: this.getLabel(b.category)
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
    }
    wx.hideLoading();
  },

  groupByDate(bills) {
    const groups = {};
    bills.forEach(b => {
      const dateKey = util.formatDate(b.date, 'YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey + ' ' + this.getDayOfWeek(b.date), items: [], total: 0 };
      }
      groups[dateKey].items.push(b);
      groups[dateKey].total += b.amount;
    });
    return Object.values(groups).map(g => ({ ...g, total: g.total.toFixed(2) }));
  },

  getDayOfWeek(dateStr) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(dateStr).getDay()];
  },

  getIcon(key) {
    const cat = BILL_CATEGORIES.find(c => c.key === key);
    return cat ? cat.icon : '📋';
  },

  getLabel(key) {
    const cat = BILL_CATEGORIES.find(c => c.key === key);
    return cat ? cat.label : '其他';
  },

  goAdd() { wx.navigateTo({ url: '/pages/bill-add/bill-add' }); },

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
  }
});
