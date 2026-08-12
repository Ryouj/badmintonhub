// pages/tool-fucai3d/tool-fucai3d.js
const { generate } = require('../../utils/fucai3d-core.js');
const HISTORY = require('../../utils/fucai3d-data.js');

Page({
  data: {
    result: null,
    recent: []
  },

  onLoad() {
    // 最近10期，最新在前
    const recent = HISTORY.slice(-10).reverse();
    this.setData({ recent: recent });
  },

  onGenerate() {
    const result = generate(HISTORY);
    this.setData({ result: result });
    wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
  },

  // 转发给朋友
  onShareAppMessage() {
    return {
      title: '福彩3D 选号助手 — 本地统计生成号码，仅供参考',
      path: '/pages/tool-fucai3d/tool-fucai3d'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return { title: '福彩3D 选号助手 — 本地统计生成号码，娱乐参考' };
  }
});
