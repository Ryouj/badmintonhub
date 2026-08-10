// pages/profile/profile.js - 极简可选版
const api = require('../../utils/api');
const { SKILL_LEVELS, PLAY_FREQUENCY, PLAY_YEARS, PLAY_STYLES, PLAY_TYPES, HANDS } = require('../../utils/constants');

const SECTION_FIELDS = {
  basic:      ['nickName', 'bio', 'avatarUrl'],
  skill:      ['skillLevel', 'playYears', 'playFrequency', 'playStyle'],
  equipment:  ['mainRacket', 'shoes', 'shuttleBrand', 'stringTension'],
  preference: ['preferredVenue', 'city', 'playType', 'hand']
};

const PICKER_CONFIG = {
  skillLevel:    { list: SKILL_LEVELS, labelField: 'skillLevelLabel', labelKey: 'label' },
  playYears:     { list: PLAY_YEARS, labelField: 'playYearsLabel', labelKey: 'label' },
  playFrequency: { list: PLAY_FREQUENCY, labelField: 'playFrequencyLabel', labelKey: 'label' },
  playStyle:     { list: PLAY_STYLES, labelField: 'playStyleLabel', labelKey: 'label' }
};

Page({
  data: {
    profile: {},
    totalData: {},
    loading: true,
    editingSection: null,
    editForm: {},
    bioCount: 0,
    hasSkill: false,
    hasEquip: false,
    hasPref: false,
    skillLevelOptions: SKILL_LEVELS,
    playFrequencyOptions: PLAY_FREQUENCY,
    playYearsOptions: PLAY_YEARS,
    playStyleOptions: PLAY_STYLES,
    playTypes: PLAY_TYPES,
    hands: HANDS
  },

  onShow() {
    this.loadProfile();
  },

  onPullDownRefresh() {
    var that = this;
    this.loadProfile().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  async loadProfile() {
    this.setData({ loading: true });
    var app = getApp();
    await app.ensureLogin();

    try {
      var results = await Promise.all([
        api.userAPI.getProfile(),
        api.statsAPI.summary('all')
      ]);
      var profile = results[0];
      var stats = results[1];

      profile.skillLevelLabel = this.getLabel(SKILL_LEVELS, profile.skillLevel);
      profile.playFrequencyLabel = this.getLabel(PLAY_FREQUENCY, profile.playFrequency);
      profile.playYearsLabel = this.getLabel(PLAY_YEARS, profile.playYears);
      profile.playStyleLabel = this.getLabel(PLAY_STYLES, profile.playStyle);
      profile.stringTensionDisplay = profile.stringTension ? profile.stringTension + '磅' : '';

      this.setData({
        profile: profile,
        loading: false,
        editingSection: null,
        editForm: {},
        hasSkill: !!(profile.skillLevel || profile.playYears || profile.playFrequency || profile.playStyle),
        hasEquip: !!(profile.mainRacket || profile.shoes || profile.shuttleBrand || profile.stringTension),
        hasPref: !!(profile.preferredVenue || profile.city || profile.playType || profile.hand),
        totalData: {
          totalAmount: (stats.totalAmount || 0).toFixed(2),
          totalDuration: Math.round((stats.totalDuration || 0) * 10) / 10,
          totalCount: stats.activityCount || 0
        }
      });

      app.globalData.userInfo = profile;
      app.globalData.needsSetup = !(profile && profile.nickName);
    } catch (err) {
      console.error('加载档案失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  getLabel: function (list, key) {
    if (!key) return '';
    var item = list.find(function (i) { return i.key === key; });
    return item ? item.label : key;
  },

  toggleEdit: function (e) {
    var section = e.currentTarget.dataset.section;
    var form = {};
    var profile = this.data.profile;
    if (section === 'basic') {
      form.nickName = profile.nickName || '';
      form.bio = profile.bio || '';
      form.avatarUrl = profile.avatarUrl || '';
      this.setData({ editingSection: section, editForm: form, bioCount: (form.bio || '').length });
      return;
    } else {
      var fields = SECTION_FIELDS[section];
      fields.forEach(function (f) { form[f] = profile[f]; });
      if (section === 'skill') {
        form.skillLevelLabel = profile.skillLevelLabel;
        form.playYearsLabel = profile.playYearsLabel;
        form.playFrequencyLabel = profile.playFrequencyLabel;
        form.playStyleLabel = profile.playStyleLabel;
      }
    }
    this.setData({ editingSection: section, editForm: form });
  },

  cancelEdit: function () {
    this.setData({ editingSection: null, editForm: {} });
  },

  onChooseAvatar: function (e) {
    var avatarUrl = e.detail.avatarUrl;
    this.setData({ 'editForm.avatarUrl': avatarUrl });
    this.uploadAvatar(avatarUrl);
  },

  uploadAvatar: function (tempPath) {
    var that = this;
    wx.showLoading({ title: '上传头像...' });
    var cloudPath = 'avatars/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.png';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempPath,
      success: function (res) {
        that.setData({ 'editForm.avatarUrl': res.fileID });
        wx.hideLoading();
      },
      fail: function (err) {
        console.error('头像上传失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '头像上传失败', icon: 'none' });
      }
    });
  },

  onFieldChange: function (e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    if (field === 'stringTension') {
      value = parseInt(value) || 0;
    }
    var update = { ['editForm.' + field]: value };
    if (field === 'bio') {
      update.bioCount = (value || '').length;
    }
    this.setData(update);
  },

  onPickerChange: function (e) {
    var field = e.currentTarget.dataset.field;
    var idx = e.detail.value;
    var cfg = PICKER_CONFIG[field];
    if (cfg) {
      var item = cfg.list[idx];
      this.setData({
        ['editForm.' + field]: item.key,
        ['editForm.' + cfg.labelField]: item.label
      });
    } else {
      var list = field === 'playType' ? this.data.playTypes : this.data.hands;
      this.setData({ ['editForm.' + field]: list[idx] });
    }
  },

  saveSection: async function (e) {
    var that = this;
    var section = e.currentTarget.dataset.section;
    var form = this.data.editForm;
    var fields = SECTION_FIELDS[section];

    var payload = {};
    fields.forEach(function (f) {
      if (form[f] !== undefined) payload[f] = form[f];
    });

    wx.showLoading({ title: '保存中...' });
    try {
      var updated = await api.userAPI.updateProfile(payload);
      var profile = Object.assign({}, this.data.profile);
      fields.forEach(function (f) {
        if (updated[f] !== undefined) profile[f] = updated[f];
      });

      profile.stringTensionDisplay = profile.stringTension ? profile.stringTension + '磅' : '';
      if (section === 'skill') {
        ['skillLevel', 'playYears', 'playFrequency', 'playStyle'].forEach(function (k) {
          var cfg = PICKER_CONFIG[k];
          if (cfg) {
            profile[cfg.labelField] = updated[cfg.labelField] !== undefined
              ? updated[cfg.labelField]
              : (form[cfg.labelField] || '');
          }
        });
      }

      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({
        editingSection: null,
        editForm: {},
        profile: profile,
        hasSkill: !!(profile.skillLevel || profile.playYears || profile.playFrequency || profile.playStyle),
        hasEquip: !!(profile.mainRacket || profile.shoes || profile.shuttleBrand || profile.stringTension),
        hasPref: !!(profile.preferredVenue || profile.city || profile.playType || profile.hand)
      });
      getApp().globalData.userInfo = profile;
      getApp().globalData.needsSetup = !profile.nickName;
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.error('保存失败:', err);
    }
    wx.hideLoading();
  }
});
