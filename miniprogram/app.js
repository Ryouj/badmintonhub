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

  // 静默登录：wx.login 拿 code → 后端建号/换 token，全程无弹窗、无授权
  // 用户打开小程序即无感获得会话，是否填写头像昵称由用户在「我的」自行决定
  async silentLogin() {
    try {
      var res = await wx.login();
      var data = await api.login({ code: res.code });
      if (data && data.token) {
        api.saveToken(data.token);
        this.applyUser(data.user || {});
        return true;
      }
    } catch (e) {
      console.error('[app] 静默登录失败:', e);
    }
    return false;
  },

  // 启动：有 token 先静默恢复档案；否则静默建号。绝不跳转任何登录页
  async boot() {
    const token = api.getToken();
    if (token) {
      try {
        const user = await api.userAPI.getProfile();
        this.applyUser(user);
        return;
      } catch (e) {
        api.clearToken();
      }
    }
    await this.silentLogin();
  },

  // 确保已登录（页面加载时调用）。无会话则静默建号，不弹任何窗
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
    return await this.silentLogin();
  },

  // 主动登录：静默建号后重载当前页以展示已登录内容（原登录页已移除）
  async goLogin() {
    await this.silentLogin();
    const pages = getCurrentPages();
    const cur = pages[pages.length - 1];
    if (cur && typeof cur.onShow === 'function') cur.onShow();
  }
});
