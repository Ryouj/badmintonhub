// pages/tools/tools.js
const { TOOLS } = require('../../utils/tools-config');

Page({
  data: {
    tools: TOOLS
  },

  onTapTool(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: page });
  },

  // 转发给朋友
  onShareAppMessage() {
    return {
      title: '羽球集工具箱 — 球费计算/八人转排班',
      path: '/pages/tools/tools'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return { title: '羽球集工具箱 — 球费计算/八人转排班' };
  }
});
