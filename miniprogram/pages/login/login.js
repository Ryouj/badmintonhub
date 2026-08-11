// pages/login/login.js - 微信登录页
const api = require('../../utils/api');

Page({
  data: {
    avatarUrl: '',      // 云存储 fileID（上传后）
    tempAvatar: '',     // 临时路径（上传前预览）
    nickName: '',
    loading: false
  },

  onLoad() {
    // 已有 token 且有昵称 → 直接跳首页
    var app = getApp();
    if (app.globalData.isLoggedIn && !app.globalData.needsSetup) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 头像选择回调 — e.detail.avatarUrl 是临时路径
  onChooseAvatar(e) {
    var tempPath = e.detail.avatarUrl;
    this.setData({ tempAvatar: tempPath, avatarUrl: tempPath });
    this.uploadAvatar(tempPath);
  },

  // 上传头像到云存储，拿到 fileID 存起来
  uploadAvatar(tempPath) {
    var that = this;
    wx.showLoading({ title: '上传头像...' });
    var cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.png';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempPath,
      success: function (res) {
        that.setData({ avatarUrl: res.fileID });
        wx.hideLoading();
      },
      fail: function (err) {
        console.error('[login] 头像上传失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '头像上传失败，可重试', icon: 'none' });
        // 回退到临时路径，登录时仍发送（后端可能支持 base64 或忽略）
        that.setData({ avatarUrl: tempPath });
      }
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  // 登录：wx.login 获取 code → 连同头像、昵称发给后端
  async doLogin() {
    if (this.data.loading) return;
    var nickName = (this.data.nickName || '').trim();

    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      // 1. wx.login 拿 code
      var loginRes = await wx.login();

      // 2. 调后端 /api/login，传 code + 昵称 + 头像
      var data = await api.login({
        code: loginRes.code,
        nickName: nickName,
        avatarUrl: this.data.avatarUrl
      });

      // 3. 存 token + 更新全局态
      if (data.token) api.saveToken(data.token);
      var app = getApp();
      app.applyUser(data.user || { nickName: nickName, avatarUrl: this.data.avatarUrl });

      wx.showToast({ title: '欢迎加入', icon: 'success' });
      setTimeout(function () {
        wx.switchTab({ url: '/pages/index/index' });
      }, 500);
    } catch (err) {
      console.error('[login] 登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  // 跳过：只 wx.login 获取 code，不带头像昵称
  async doSkip() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      var loginRes = await wx.login();
      var data = await api.login({ code: loginRes.code });
      if (data.token) api.saveToken(data.token);
      var app = getApp();
      app.applyUser(data.user || {});
      wx.switchTab({ url: '/pages/index/index' });
    } catch (err) {
      console.error('[login] 跳过登录失败:', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
    this.setData({ loading: false });
  }
});
