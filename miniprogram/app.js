// app.js - 羽球集小程序入口（云托管版）
const api = require('./utils/api');

App({
  onLaunch() {
    wx.cloud.init({
      env: 'prod-d5gqebf4i52aaa93a'
    });
    api.initToken();
    this.autoLogin();
  },

  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    needsSetup: false
  },

  async autoLogin() {
    const token = api.getToken();
    if (token) {
      try {
        const user = await api.userAPI.getProfile();
        this.globalData.userInfo = user || {};
        this.globalData.isLoggedIn = true;
        this.globalData.needsSetup = !(user && user.nickName);
        return;
      } catch (e) {
        api.clearToken();
      }
    }

    try {
      // 仅通过 wx.login 获取 code，头像昵称让用户主动设置
      const data = await api.login();
      api.saveToken(data.token);
      this.globalData.userInfo = data.user || {};
      this.globalData.isLoggedIn = true;
      this.globalData.needsSetup = !(data.user && data.user.nickName);
    } catch (err) {
      console.error('登录失败:', err);
    }
  },

  async ensureLogin() {
    if (!this.globalData.isLoggedIn) {
      await this.autoLogin();
    }
  }
});
