// pages/stats/stats.js
const api = require('../../utils/api');
const { BILL_CATEGORIES } = require('../../utils/constants');

Page({
  data: {
    period: 'month',
    summary: {},
    categoryStats: [],
    monthlyTrend: [],
    topVenues: []
  },

  onShow() {
    this.loadStats();
  },

  switchPeriod(e) {
    this.setData({ period: e.currentTarget.dataset.period });
    this.loadStats();
  },

  async loadStats() {
    wx.showLoading({ title: '统计中...' });
    try {
      const data = await api.statsAPI.summary(this.data.period);
      const categoryStats = this.buildCategoryStats(data.categoryData || []);
      const monthlyTrend = data.monthlyTrend || [];
      const topVenues = data.topVenues || [];

      this.setData({
        summary: {
          totalAmount: (data.totalAmount || 0).toFixed(2),
          totalDuration: Math.round((data.totalDuration || 0) * 10) / 10,
          totalCount: data.totalCount || 0,
          avgPerTime: data.totalCount > 0 ? (data.totalAmount / data.totalCount).toFixed(2) : '0.00',
          avgDuration: data.activityCount > 0 ? Math.round(data.totalDuration * 60 / data.activityCount) : 0,
          maxDuration: data.maxDuration || 0
        },
        isEmpty: !data.totalAmount && !data.totalCount && !data.activityCount,
        categoryStats,
        monthlyTrend,
        topVenues
      });

      if (!this.data.isEmpty) {
        setTimeout(() => {
          this.drawPieChart(categoryStats);
          this.drawBarChart(monthlyTrend);
        }, 300);
      }
    } catch (err) {
      console.error('统计失败:', err);
      wx.showToast({ title: '加载失败，下拉刷新重试', icon: 'none' });
    }
    wx.hideLoading();
  },

  buildCategoryStats(data) {
    const total = data.reduce((s, i) => s + i.amount, 0);
    return data.map(item => {
      const cat = BILL_CATEGORIES.find(c => c.key === item.category);
      return {
        key: item.category,
        label: cat ? cat.label : item.category,
        color: cat ? cat.color : '#7f8c8d',
        icon: cat ? cat.icon : '📋',
        amount: item.amount.toFixed(2),
        percent: total > 0 ? ((item.amount / total) * 100).toFixed(1) : 0
      };
    });
  },

  // 饼图（同之前 Canvas 逻辑）
  drawPieChart(stats) {
    const ctx = wx.createCanvasContext('pieChart', this);
    const cx = 170, cy = 170, radius = 120;
    const total = stats.reduce((s, i) => s + parseFloat(i.amount), 0);

    let startAngle = -Math.PI / 2;
    stats.forEach((item) => {
      const sweep = total > 0 ? (parseFloat(item.amount) / total) * 2 * Math.PI : 0;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
      ctx.closePath();
      ctx.setFillStyle(item.color);
      ctx.fill();

      if (sweep > 0.2) {
        const mid = startAngle + sweep / 2;
        ctx.setFillStyle('#333');
        ctx.setFontSize(11);
        ctx.setTextAlign('center');
        ctx.fillText(item.percent + '%', cx + (radius + 30) * Math.cos(mid), cy + (radius + 30) * Math.sin(mid));
      }
      startAngle += sweep;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, 2 * Math.PI);
    ctx.setFillStyle('#fff');
    ctx.fill();
    ctx.setFillStyle('#333');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.fillText('总支出', cx, cy - 6);
    ctx.setFillStyle('#e74c3c');
    ctx.setFontSize(18);
    ctx.fillText('¥' + total.toFixed(0), cx, cy + 18);
    ctx.draw();
  },

  // 柱状图
  drawBarChart(trend) {
    if (!trend || trend.length === 0) return;
    const ctx = wx.createCanvasContext('barChart', this);
    const width = 650, height = 360;
    const pad = { top: 40, right: 20, bottom: 50, left: 60 };
    const cw = width - pad.left - pad.right, ch = height - pad.top - pad.bottom;

    ctx.setFillStyle('#fff');
    ctx.fillRect(0, 0, width, height);

    const maxVal = Math.max(...trend.map(t => t.amount), 1);
    const barW = Math.min(40, cw / trend.length - 12);

    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y);
      ctx.setStrokeStyle('#f0f0f0'); ctx.setLineWidth(1); ctx.stroke();
      ctx.setFillStyle('#999'); ctx.setFontSize(11); ctx.setTextAlign('right');
      ctx.fillText('¥' + Math.round(maxVal * (4 - i) / 4), pad.left - 8, y + 4);
    }

    trend.forEach((item, idx) => {
      const x = pad.left + (cw / trend.length) * idx + (cw / trend.length - barW) / 2;
      const barH = (item.amount / maxVal) * ch;
      const y = pad.top + ch - barH;
      ctx.setFillStyle('#1aad19');
      ctx.fillRect(x, y, barW, barH);
      ctx.setFillStyle('#333'); ctx.setFontSize(10); ctx.setTextAlign('center');
      ctx.fillText('¥' + item.amount, x + barW / 2, y - 6);
      ctx.setFillStyle('#999');
      ctx.fillText(item.month, x + barW / 2, pad.top + ch + 24);
    });

    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ch);
    ctx.lineTo(width - pad.right, pad.top + ch);
    ctx.setStrokeStyle('#ccc'); ctx.setLineWidth(1); ctx.stroke();
    ctx.draw();
  }
});
