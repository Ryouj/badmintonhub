// app.js - 羽球集小程序入口（云托管版）
const api = require('./utils/api');

App({
  onLaunch() {
    wx.cloud.init({
      env: 'prod-d5gqebf4i52aaa93a'
    });
    api.initToken();
    this.boot();
  },

  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    needsSetup: false
  },

  // 写入用户态
  applyUser(user) {
    this.globalData.userInfo = user || {};
    this.globalData.isLoggedIn = true;
    this.globalData.needsSetup = !(user && user.nickName);
  },

  // 启动：有 token 则静默恢复登录态，绝不强制跳转登录页
  // 用户打开小程序先进入首页浏览，是否登录由用户自主选择
  async boot() {
    const token = api.getToken();
    if (!token) return; // 无 token，停留在首页（无需登录即可浏览）
    try {
      const user = await api.userAPI.getProfile();
      this.applyUser(user);
    } catch (e) {
      // token 失效，清掉，留在首页
      api.clearToken();
    }
  },

  // 是否登录（不再强制跳转），由各页面自行决定未登录时如何展示
  async ensureLogin() {
    if (this.globalData.isLoggedIn) return true;
    const token = api.getToken();
    if (token) {
      try {
        const user = await api.userAPI.getProfile();
        this.applyUser(user);
        return true;
      } catch (e) {
        api.clearToken();
      }
    }
    return false;
  },

  // 用户主动前往登录页（由按钮触发，非强制）
  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  }
});
