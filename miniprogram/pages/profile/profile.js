// pages/profile/profile.js - 卡片独立编辑
const api = require('../../utils/api');
const { SKILL_LEVELS, PLAY_FREQUENCY, PLAY_YEARS, PLAY_STYLES, PLAY_TYPES, HANDS } = require('../../utils/constants');

// 各编辑区域的字段映射
const SECTION_FIELDS = {
  basic:      ['nickName', 'bio'],
  skill:      ['skillLevel', 'playYears', 'playFrequency', 'playStyle'],
  equipment:  ['mainRacket', 'shoes', 'shuttleBrand', 'stringTension'],
  preference: ['preferredVenue', 'city', 'playType', 'hand']
};

// picker 字段配置
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
    editingSection: null,
    editForm: {},
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
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    wx.hideLoading();
  },

  getLabel(list, key) {
    if (!key) return '';
    const item = list.find(function (i) { return i.key === key; });
    return item ? item.label : key;
  },

  // 切换某张卡片的编辑状态
  toggleEdit(e) {
    var section = e.currentTarget.dataset.section;
    var form = {};
    if (section === 'basic') {
      form.nickName = this.data.profile.nickName || '';
      form.bio = this.data.profile.bio || '';
    } else {
      // 复制 profile 和标签字段
      var profile = this.data.profile;
      var fields = SECTION_FIELDS[section];
      fields.forEach(function (f) {
        form[f] = profile[f];
      });
      // 复制对应的标签字段
      if (section === 'skill') {
        form.skillLevelLabel = profile.skillLevelLabel;
        form.playYearsLabel = profile.playYearsLabel;
        form.playFrequencyLabel = profile.playFrequencyLabel;
        form.playStyleLabel = profile.playStyleLabel;
      }
    }
    this.setData({ editingSection: section, editForm: form });
  },

  // 取消编辑
  cancelEdit() {
    this.setData({ editingSection: null, editForm: {} });
  },

  // 输入框变化
  onFieldChange(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    if (field === 'stringTension') {
      value = parseInt(value) || 0;
    }
    this.setData({ ['editForm.' + field]: value });
  },

  // picker 变化
  onPickerChange(e) {
    var field = e.currentTarget.dataset.field;
    var idx = e.detail.value;
    var cfg = PICKER_CONFIG[field];
    if (cfg) {
      var item = cfg.list[idx];
      var update = {};
      update['editForm.' + field] = item.key;
      update['editForm.' + cfg.labelField] = item.label;
      this.setData(update);
    } else {
      // playType / hand
      var list = field === 'playType' ? this.data.playTypes : this.data.hands;
      this.setData({ ['editForm.' + field]: list[idx] });
    }
  },

  // 保存某张卡片
  async saveSection(e) {
    var section = e.currentTarget.dataset.section;
    var form = this.data.editForm;
    var fields = SECTION_FIELDS[section];
    var labels = this.getLabelFields(section);

    if (section === 'basic' && !form.nickName) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }

    // 构建 payload
    var payload = {};
    fields.forEach(function (f) {
      if (form[f] !== undefined) payload[f] = form[f];
    });

    wx.showLoading({ title: '保存中...' });
    try {
      var updated = await api.userAPI.updateProfile(payload);

      // 刷新显示数据
      var profile = Object.assign({}, this.data.profile);
      fields.forEach(function (f) {
        if (updated[f] !== undefined) profile[f] = updated[f];
      });
      // 更新标签显示
      labels.forEach(function (l) {
        profile[l.key] = updated[l.key] !== undefined ? updated[l.key] : form[l.key];
        profile[l.label] = l.compute ? l.compute(profile[l.key]) : form[l.label];
      });

      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ editingSection: null, editForm: {}, profile: profile });
      getApp().globalData.userInfo = profile;
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.error('保存失败:', err);
    }
    wx.hideLoading();
  },

  // 获取各 section 需要刷新的标签字段
  getLabelFields(section) {
    if (section === 'skill') {
      return [
        { key: 'skillLevel', label: 'skillLevelLabel', compute: this.computeSkillLevel },
        { key: 'playYears', label: 'playYearsLabel', compute: this.computePlayYears },
        { key: 'playFrequency', label: 'playFrequencyLabel', compute: this.computePlayFrequency },
        { key: 'playStyle', label: 'playStyleLabel', compute: this.computePlayStyle }
      ];
    }
    return [];
  },

  computeSkillLevel: function (val) {
    var item = SKILL_LEVELS.find(function (i) { return i.key === val; });
    return item ? item.label : val;
  },
  computePlayYears: function (val) {
    var item = PLAY_YEARS.find(function (i) { return i.key === val; });
    return item ? item.label : val;
  },
  computePlayFrequency: function (val) {
    var item = PLAY_FREQUENCY.find(function (i) { return i.key === val; });
    return item ? item.label : val;
  },
  computePlayStyle: function (val) {
    var item = PLAY_STYLES.find(function (i) { return i.key === val; });
    return item ? item.label : val;
  }
});
