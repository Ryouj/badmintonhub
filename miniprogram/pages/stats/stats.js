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
          totalCount: data.activityCount || 0,
          avgPerTime: data.activityCount > 0 ? (data.totalAmount / data.activityCount).toFixed(2) : '0.00',
          avgDuration: data.activityCount > 0 ? Math.round(data.totalDuration * 60 / data.activityCount) : 0,
          maxDuration: data.maxDuration || 0
        },
        isEmpty: !data.totalAmount && !data.activityCount,
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

  // 饼图 — 动态获取 canvas 实际尺寸后绘制
  drawPieChart(stats) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#pieChart').boundingClientRect((rect) => {
      const w = rect ? rect.width : 170;
      const h = rect ? rect.height : 170;
      const ctx = wx.createCanvasContext('pieChart', this);
      const cx = w / 2, cy = h / 2;
      const radius = Math.min(w, h) / 2 - 20;
      const innerR = radius * 0.5;
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

        if (sweep > 0.3) {
          const mid = startAngle + sweep / 2;
          const labelR = radius + 14;
          ctx.setFillStyle('#666');
          ctx.setFontSize(10);
          ctx.setTextAlign('center');
          ctx.setTextBaseline('middle');
          ctx.fillText(item.percent + '%', cx + labelR * Math.cos(mid), cy + labelR * Math.sin(mid));
        }
        startAngle += sweep;
      });

      // 中心白圆
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
      ctx.setFillStyle('#fff');
      ctx.fill();

      ctx.setFillStyle('#333');
      ctx.setFontSize(11);
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText('总支出', cx, cy - 8);
      ctx.setFillStyle('#e74c3c');
      ctx.setFontSize(15);
      ctx.fillText('¥' + total.toFixed(0), cx, cy + 12);
      ctx.draw();
    }).exec();
  },

  // 柱状图 — 动态获取 canvas 实际尺寸
  drawBarChart(trend) {
    if (!trend || trend.length === 0) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('#barChart').boundingClientRect((rect) => {
      const width = rect ? rect.width : 320;
      const height = rect ? rect.height : 180;
      const ctx = wx.createCanvasContext('barChart', this);
      const pad = { top: 20, right: 16, bottom: 36, left: 48 };
      const cw = width - pad.left - pad.right, ch = height - pad.top - pad.bottom;

      ctx.setFillStyle('#fff');
      ctx.fillRect(0, 0, width, height);

      const maxVal = Math.max(...trend.map(t => t.amount), 1);
      const barW = Math.min(32, cw / trend.length - 8);

      for (let i = 0; i <= 4; i++) {
        const y = pad.top + (ch / 4) * i;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(width - pad.right, y);
        ctx.setStrokeStyle('#f0f0f0'); ctx.setLineWidth(1); ctx.stroke();
        ctx.setFillStyle('#999'); ctx.setFontSize(9); ctx.setTextAlign('right');
        ctx.setTextBaseline('middle');
        ctx.fillText('¥' + Math.round(maxVal * (4 - i) / 4), pad.left - 6, y);
      }

      trend.forEach((item, idx) => {
        const slot = cw / trend.length;
        const x = pad.left + slot * idx + (slot - barW) / 2;
        const barH = (item.amount / maxVal) * ch;
        const y = pad.top + ch - barH;
        ctx.setFillStyle('#1aad19');
        ctx.fillRect(x, y, barW, barH);
        ctx.setFillStyle('#333'); ctx.setFontSize(9); ctx.setTextAlign('center');
        ctx.setTextBaseline('bottom');
        ctx.fillText('¥' + item.amount, x + barW / 2, y - 4);
        ctx.setFillStyle('#999');
        ctx.setTextBaseline('top');
        ctx.fillText(item.month, x + barW / 2, pad.top + ch + 8);
      });

      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ch);
      ctx.lineTo(width - pad.right, pad.top + ch);
      ctx.setStrokeStyle('#ccc'); ctx.setLineWidth(1); ctx.stroke();
      ctx.draw();
    }).exec();
  },

  // 转发给朋友
  onShareAppMessage() {
    return {
      title: '我的羽毛球数据 — 累计消费/时长/场次',
      path: '/pages/stats/stats'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return { title: '我的羽毛球数据 — 累计消费/时长/场次' };
  }
});
