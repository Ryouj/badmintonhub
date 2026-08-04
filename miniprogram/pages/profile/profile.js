// pages/profile/profile.js
const api = require('../../utils/api');
const { SKILL_LEVELS, PLAY_FREQUENCY, PLAY_YEARS, PLAY_STYLES } = require('../../utils/constants');

Page({
  data: {
    profile: {},
    totalData: {},
    showEdit: false,
    editForm: {},
    skillLevelOptions: SKILL_LEVELS,
    playFrequencyOptions: PLAY_FREQUENCY,
    playYearsOptions: PLAY_YEARS,
    playStyleOptions: PLAY_STYLES,
    playTypes: ['拉吊突击', '防守反击', '进攻杀球', '控网抢攻', '四方球', '混合型'],
    hands: ['右手', '左手']
  },

  onShow() {
    this.loadProfile();
  },

  async loadProfile() {
    const app = getApp();
    await app.ensureLogin();

    wx.showLoading({ title: '加载中...' });
    try {
      const [profile, stats] = await Promise.all([
        api.userAPI.getProfile(),
        api.statsAPI.summary('all')
      ]);

      profile.skillLevelLabel = this.getLabel(SKILL_LEVELS, profile.skillLevel);
      profile.playFrequencyLabel = this.getLabel(PLAY_FREQUENCY, profile.playFrequency);
      profile.playYearsLabel = this.getLabel(PLAY_YEARS, profile.playYears);
      profile.playStyleLabel = this.getLabel(PLAY_STYLES, profile.playStyle);

      this.setData({
        profile,
        totalData: {
          totalAmount: (stats.totalAmount || 0).toFixed(2),
          totalDuration: Math.round((stats.totalDuration || 0) * 10) / 10,
          totalCount: stats.activityCount || 0
        }
      });
    } catch (err) {
      console.error('加载档案失败:', err);
    }
    wx.hideLoading();
  },

  getLabel(list, key) {
    if (!key) return '';
    const item = list.find(i => i.key === key);
    return item ? item.label : key;
  },

  startEdit() {
    this.setData({ showEdit: true, editForm: { ...this.data.profile } });
  },

  cancelEdit() {
    this.setData({ showEdit: false });
  },

  onFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['editForm.' + field]: e.detail.value });
  },

  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const idx = e.detail.value;
    const optionsMap = {
      skillLevel:    { list: SKILL_LEVELS,    labelField: 'skillLevelLabel' },
      playFrequency: { list: PLAY_FREQUENCY,  labelField: 'playFrequencyLabel' },
      playYears:     { list: PLAY_YEARS,      labelField: 'playYearsLabel' },
      playStyle:     { list: PLAY_STYLES,     labelField: 'playStyleLabel' }
    };

    const config = optionsMap[field];
    if (config && config.list) {
      const item = config.list[idx];
      this.setData({
        ['editForm.' + field]: item.key,
        ['editForm.' + config.labelField]: item.label
      });
    } else {
      const list = field === 'playType' ? this.data.playTypes : this.data.hands;
      this.setData({ ['editForm.' + field]: list[idx] });
    }
  },

  async saveProfile() {
    const form = this.data.editForm;
    if (!form.nickName) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      const updated = await api.userAPI.updateProfile(form);
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ showEdit: false, profile: updated });
      getApp().globalData.userInfo = updated;
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    wx.hideLoading();
  }
});
