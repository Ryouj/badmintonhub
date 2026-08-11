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

  // 启动路由：有 token 且能拉到用户 → 跳首页；否则留在登录页
  async boot() {
    const token = api.getToken();
    if (!token) return; // 无 token，留在登录页
    try {
      const user = await api.userAPI.getProfile();
      this.applyUser(user);
      wx.switchTab({ url: '/pages/index/index' });
    } catch (e) {
      // token 失效，清掉留在登录页
      api.clearToken();
    }
  },

  // tabBar 页守卫：未登录则跳登录页
  async ensureLogin() {
    if (this.globalData.isLoggedIn) return;
    const token = api.getToken();
    if (token) {
      try {
        const user = await api.userAPI.getProfile();
        this.applyUser(user);
        if (this.globalData.isLoggedIn) return;
      } catch (e) {
        api.clearToken();
      }
    }
    wx.reLaunch({ url: '/pages/login/login' });
    throw new Error('需要登录');
  }
});
