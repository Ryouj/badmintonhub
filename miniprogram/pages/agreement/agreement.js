// pages/agreement/agreement.js - 用户服务协议 / 隐私政策
Page({
  data: {
    type: 'service',   // service=用户服务协议, privacy=隐私政策
    activeTab: 'service'
  },

  onLoad(options) {
    var type = (options && options.type) || 'service';
    this.setData({ type: type, activeTab: type });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  }
});
