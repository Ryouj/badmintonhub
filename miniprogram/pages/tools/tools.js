// pages/tools/tools.js
const { TOOLS } = require('../../utils/tools-config');

Page({
  data: {
    tools: TOOLS
  },

  onTapTool(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: page });
  }
});
