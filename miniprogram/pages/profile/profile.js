// pages/profile/profile.js - 全部字典可选版
const api = require('../../utils/api');
const {
  SKILL_LEVELS, PLAY_FREQUENCY, PLAY_YEARS, PLAY_STYLES, PLAY_TYPES, HANDS,
  RACKET_BRANDS, SHOE_BRANDS, SHUTTLE_BRANDS, STRING_TENSIONS, CITIES
} = require('../../utils/constants');

const SECTION_FIELDS = {
  basic:      ['nickName', 'bio', 'avatarUrl'],
  skill:      ['skillLevel', 'playYears', 'playFrequency', 'playStyle'],
  equipment:  ['mainRacket', 'shoes', 'shuttleBrand', 'stringTension'],
  preference: ['preferredVenue', 'city', 'playType', 'hand']
};

// labelField → 展示名（存 profile 上）, labelKey → picker 列的显示字段
const PICKER_CONFIG = {
  skillLevel:    { list: 'skillLevel',    labelField: 'skillLevelLabel' },
  playYears:     { list: 'playYears',     labelField: 'playYearsLabel' },
  playFrequency: { list: 'playFrequency', labelField: 'playFrequencyLabel' },
  playStyle:     { list: 'playStyle',     labelField: 'playStyleLabel' },
  mainRacket:    { list: 'racket',        labelField: 'mainRacketLabel' },
  shoes:         { list: 'shoe',          labelField: 'shoesLabel' },
  shuttleBrand:  { list: 'shuttle',       labelField: 'shuttleBrandLabel' },
  stringTension: { list: 'tension',       labelField: 'stringTensionLabel' },
  city:          { list: 'city',          labelField: 'cityLabel' }
};

// listKey → 数据源
var LIST_MAP = {
  skillLevel:    SKILL_LEVELS,
  playYears:     PLAY_YEARS,
  playFrequency: PLAY_FREQUENCY,
  playStyle:     PLAY_STYLES,
  racket:        RACKET_BRANDS,
  shoe:          SHOE_BRANDS,
  shuttle:       SHUTTLE_BRANDS,
  tension:       STRING_TENSIONS,
  city:          CITIES
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
    // picker 数据源
    skillLevelOptions: SKILL_LEVELS,
    playFrequencyOptions: PLAY_FREQUENCY,
    playYearsOptions: PLAY_YEARS,
    playStyleOptions: PLAY_STYLES,
    racketOptions: RACKET_BRANDS,
    shoeOptions: SHOE_BRANDS,
    shuttleOptions: SHUTTLE_BRANDS,
    tensionOptions: STRING_TENSIONS,
    cityOptions: CITIES,
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

      // 为每个有字典的字段计算显示 label
      Object.keys(PICKER_CONFIG).forEach(function (k) {
        var cfg = PICKER_CONFIG[k];
        var raw = profile[k];
        if (!raw && raw !== 0) {
          profile[cfg.labelField] = '';
          return;
        }
        profile[cfg.labelField] = getLabel(raw, LIST_MAP[cfg.list]);
      });

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
    }
    var fields = SECTION_FIELDS[section];
    fields.forEach(function (f) { form[f] = profile[f] || ''; });
    // 同时填充 label 字段供 picker 回显
    if (section === 'skill') {
      ['skillLevelLabel', 'playYearsLabel', 'playFrequencyLabel', 'playStyleLabel'].forEach(function (lk) {
        form[lk] = profile[lk] || '';
      });
    }
    if (section === 'equipment') {
      ['mainRacketLabel', 'shoesLabel', 'shuttleBrandLabel', 'stringTensionLabel'].forEach(function (lk) {
        form[lk] = profile[lk] || '';
      });
    }
    if (section === 'preference') {
      form.cityLabel = profile.cityLabel || '';
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
      // 字典型 picker（skill / equipment / city）
      var list = LIST_MAP[cfg.list];
      var item = list[idx];
      var update = {
        ['editForm.' + field]: item.key,
        ['editForm.' + cfg.labelField]: item.label
      };
      this.setData(update);
    } else {
      // 纯字符串列表（playType / hand）
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
      if (form[f] !== undefined && form[f] !== '') payload[f] = form[f];
    });

    wx.showLoading({ title: '保存中...' });
    try {
      var updated = await api.userAPI.updateProfile(payload);
      var profile = Object.assign({}, this.data.profile);
      fields.forEach(function (f) {
        if (updated[f] !== undefined) profile[f] = updated[f];
      });

      // 重建所有 label 字段
      Object.keys(PICKER_CONFIG).forEach(function (k) {
        var c = PICKER_CONFIG[k];
        var raw = profile[k];
        if (raw || raw === 0) {
          profile[c.labelField] = getLabel(raw, LIST_MAP[c.list]);
        } else {
          profile[c.labelField] = '';
        }
      });

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

// 根据 raw key 查找字典 label；找不到返回原值（兼容旧数据）
function getLabel(raw, list) {
  if (raw === undefined || raw === null) return '';
  // stringTension 是数字，需转为字符串匹配
  var key = typeof raw === 'number' ? String(raw) : raw;
  var item = list.find(function (i) { return i.key === key; });
  return item ? item.label : raw;
}
