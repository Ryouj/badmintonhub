// app.js - 羽球集小程序入口（云托管版）
const api = require('./utils/api');

App({
  onLaunch() {
    api.initToken();
    this.autoLogin();
  },

  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false
  },

  // 自动登录
  async autoLogin() {
    const token = api.getToken();
    if (token) {
      // 已有 token，尝试加载用户信息
      try {
        const user = await api.userAPI.getProfile();
        this.globalData.userInfo = user || {};
        this.globalData.isLoggedIn = true;
        return;
      } catch (e) {
        // token 过期，清除重新登录
        api.clearToken();
      }
    }

    // 无 token 或过期，重新登录
    try {
      const data = await api.login();
      api.saveToken(data.token);
      this.globalData.userInfo = data.user || {};
      this.globalData.isLoggedIn = true;
    } catch (err) {
      console.error('登录失败:', err);
    }
  },

  // 确保已登录（页面调用）
  async ensureLogin() {
    if (!this.globalData.isLoggedIn) {
      await this.autoLogin();
    }
  }
});
