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
      // 1. 获取微信用户信息（头像、昵称）
      const wxProfile = await this.getWxProfile();

      // 2. 登录并传递微信资料
      const data = await api.login(wxProfile);
      api.saveToken(data.token);
      this.globalData.userInfo = data.user || {};
      this.globalData.isLoggedIn = true;
    } catch (err) {
      console.error('登录失败:', err);
    }
  },

  // 获取微信头像昵称
  getWxProfile() {
    return new Promise((resolve) => {
      // wx.getUserProfile 需要用户点击触发，这里返回空对象兜底
      // 用户可在个人档案页点击"从微信同步"手动获取
      wx.getUserInfo({
        success: (res) => {
          resolve({
            nickName: res.userInfo.nickName || '',
            avatarUrl: res.userInfo.avatarUrl || ''
          });
        },
        fail: () => resolve({ nickName: '', avatarUrl: '' })
      });
    });
  },

  // 手动同步微信资料（供个人档案页调用）
  syncWxProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善个人档案信息',
        success: (res) => {
          resolve({
            nickName: res.userInfo.nickName || '',
            avatarUrl: res.userInfo.avatarUrl || ''
          });
        },
        fail: (err) => reject(err)
      });
    });
  },

  // 确保已登录（页面调用）
  async ensureLogin() {
    if (!this.globalData.isLoggedIn) {
      await this.autoLogin();
    }
  }
});
