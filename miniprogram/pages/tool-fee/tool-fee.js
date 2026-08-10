// pages/tool-fee/tool-fee.js
// 球费计算器 — 三模式总费用 + 8种分摊方案

Page({
  data: {
    // 费用模式: 'direct' | 'courtBall' | 'ballOnly'
    feeMode: 'direct',

    // 模式1：直接输入
    totalAmount: '',
    showDetail: false,
    detailItems: [
      { label: '场地费', key: 'court', amount: '' },
      { label: '球费',   key: 'shuttle', amount: '' },
      { label: '饮料',   key: 'drink', amount: '' },
      { label: '其他',   key: 'other', amount: '' }
    ],

    // 模式2/3：球费计算
    shuttleUnit: 'bucket',       // 'bucket' | 'piece'
    shuttleQuantity: '',         // 桶数 / 个数
    shuttleUnitPrice: '',        // 单价
    courtFee: '',                // 场地费（仅模式2）

    // 自动计算显示
    computedShuttleFee: '0.00',
    computedTotal: '0.00',

    // 人数
    maleCount: '4',
    femaleCount: '4',
    totalPeople: 8,

    // 模式参数
    discountRatio: '0.5',
    fixedAmount: '30',
    totalRounds: '32',
    guestCount: '1',
    loserCount: '4',

    allResults: null
  },

  onLoad: function () {
    var m = parseInt(this.data.maleCount) || 0;
    var f = parseInt(this.data.femaleCount) || 0;
    this.setData({ totalPeople: m + f });
    this.recalcFee();
  },

  // === 模式切换 ===
  switchMode: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({ feeMode: mode });
    this.recalcFee();
  },

  // === 球费计算方式切换 ===
  switchUnit: function (e) {
    var unit = e.currentTarget.dataset.unit;
    this.setData({ shuttleUnit: unit });
    this.recalcFee();
  },

  // === 模式1：直接输入 ===
  onTotalInput: function (e) {
    this.setData({ totalAmount: e.detail.value });
  },

  toggleDetail: function () {
    this.setData({ showDetail: !this.data.showDetail });
  },

  onDetailInput: function (e) {
    var idx = e.currentTarget.dataset.idx;
    this.setData({ ['detailItems[' + idx + '].amount']: e.detail.value });
    var total = this.calcDetailTotal();
    this.setData({ totalAmount: total });
  },

  calcDetailTotal: function () {
    return this.data.detailItems.reduce(function (sum, it) {
      return sum + (parseFloat(it.amount) || 0);
    }, 0).toFixed(2);
  },

  // === 模式2/3 输入 ===
  onCourtFeeInput: function (e) {
    this.setData({ courtFee: e.detail.value });
    this.recalcFee();
  },
  onShuttleQuantityInput: function (e) {
    this.setData({ shuttleQuantity: e.detail.value });
    this.recalcFee();
  },
  onShuttleUnitPriceInput: function (e) {
    this.setData({ shuttleUnitPrice: e.detail.value });
    this.recalcFee();
  },

  // === 核心：重新计算费用 ===
  recalcFee: function () {
    var computedShuttleFee = '0.00';
    var computedTotal = '0.00';

    var shuttleQty = parseFloat(this.data.shuttleQuantity) || 0;
    var shuttlePrice = parseFloat(this.data.shuttleUnitPrice) || 0;
    var courtFee = parseFloat(this.data.courtFee) || 0;

    if (this.data.feeMode === 'ballOnly') {
      // 仅球费
      computedShuttleFee = this.fmt(shuttleQty * shuttlePrice);
      computedTotal = computedShuttleFee;
    } else if (this.data.feeMode === 'courtBall') {
      // 场地费 + 球费
      computedShuttleFee = this.fmt(shuttleQty * shuttlePrice);
      computedTotal = this.fmt(courtFee + shuttleQty * shuttlePrice);
    }
    // direct 模式不需要 auto-compute

    this.setData({
      computedShuttleFee: computedShuttleFee,
      computedTotal: computedTotal
    });
  },

  // === 人数输入 ===
  onMaleInput: function (e) {
    var maleCount = e.detail.value;
    var female = parseInt(this.data.femaleCount) || 0;
    var total = (parseInt(maleCount) || 0) + female;
    this.setData({ maleCount: maleCount, totalPeople: total });
  },
  onFemaleInput: function (e) {
    var femaleCount = e.detail.value;
    var male = parseInt(this.data.maleCount) || 0;
    var total = male + (parseInt(femaleCount) || 0);
    this.setData({ femaleCount: femaleCount, totalPeople: total });
  },
  stepMale: function (e) {
    var step = parseInt(e.currentTarget.dataset.step);
    var cur = parseInt(this.data.maleCount) || 0;
    cur = Math.max(0, cur + step);
    var female = parseInt(this.data.femaleCount) || 0;
    this.setData({ maleCount: String(cur), totalPeople: cur + female });
  },
  stepFemale: function (e) {
    var step = parseInt(e.currentTarget.dataset.step);
    var cur = parseInt(this.data.femaleCount) || 0;
    cur = Math.max(0, cur + step);
    var male = parseInt(this.data.maleCount) || 0;
    this.setData({ femaleCount: String(cur), totalPeople: male + cur });
  },

  // === 模式参数输入 ===
  onDiscountInput: function (e) { this.setData({ discountRatio: e.detail.value }); },
  onFixedInput: function (e) { this.setData({ fixedAmount: e.detail.value }); },
  onRoundsInput: function (e) { this.setData({ totalRounds: e.detail.value }); },
  onGuestInput: function (e) { this.setData({ guestCount: e.detail.value }); },
  onLoserInput: function (e) { this.setData({ loserCount: e.detail.value }); },

  // === 获取总费用（兼容三模式）===
  getTotal: function () {
    var mode = this.data.feeMode;
    if (mode === 'courtBall' || mode === 'ballOnly') {
      return parseFloat(this.data.computedTotal) || 0;
    }
    // direct 模式
    if (this.data.showDetail) {
      return parseFloat(this.calcDetailTotal()) || 0;
    }
    return parseFloat(this.data.totalAmount) || 0;
  },

  fmt: function (n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  },

  // === 核心计算 ===
  calculate: function () {
    var total = this.getTotal();
    var males = parseInt(this.data.maleCount) || 0;
    var females = parseInt(this.data.femaleCount) || 0;
    var N = males + females;

    if (total <= 0) {
      var hint = '';
      if (this.data.feeMode === 'direct') hint = '请输入总费用';
      else if (this.data.feeMode === 'courtBall') hint = '请填写场地费和球费';
      else hint = '请填写球费信息';
      wx.showToast({ title: hint, icon: 'none' });
      return;
    }
    if (N === 0) {
      wx.showToast({ title: '请输入人数', icon: 'none' });
      return;
    }

    var discountRatio = parseFloat(this.data.discountRatio) || 0;
    var fixedAmount = parseFloat(this.data.fixedAmount) || 0;
    var totalRounds = parseInt(this.data.totalRounds) || 0;
    var guestCount = parseInt(this.data.guestCount) || 0;
    var loserCount = parseInt(this.data.loserCount) || 0;
    var regularCount = N - guestCount;
    var winnerCount = N - loserCount;
    var equalShare = total / N;
    var hasBoth = males > 0 && females > 0;
    var results = [];
    var that = this;

    // 1. 纯AA均摊
    results.push({
      key: 'equal', icon: '➗', label: '纯AA均摊', desc: '总费用 ÷ 人数',
      rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
      note: ''
    });

    // 2. 女生五折
    if (hasBoth) {
      var femaleTotal2 = equalShare * 0.5 * females;
      var maleTotal2 = total - femaleTotal2;
      results.push({
        key: 'femaleHalf', icon: '👩', label: '女生五折', desc: '女生半价，男生补差',
        rows: [
          { label: '男生', countText: '(' + males + '人)', amount: this.fmt(maleTotal2 / males), isFree: false },
          { label: '女生', countText: '(' + females + '人)', amount: this.fmt(femaleTotal2 / females), isFree: false }
        ], note: ''
      });
    } else {
      results.push({
        key: 'femaleHalf', icon: '👩', label: '女生五折', desc: '女生半价，男生补差',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
        note: males === 0 ? '无男生，等同均摊' : '无女生，等同均摊'
      });
    }

    // 3. 女生免单
    if (hasBoth) {
      results.push({
        key: 'femaleFree', icon: '🆓', label: '女生免单', desc: '女生免费，男生均摊',
        rows: [
          { label: '男生', countText: '(' + males + '人)', amount: this.fmt(total / males), isFree: false },
          { label: '女生', countText: '(' + females + '人)', amount: '0.00', isFree: true }
        ], note: ''
      });
    } else {
      results.push({
        key: 'femaleFree', icon: '🆓', label: '女生免单', desc: '女生免费，男生均摊',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
        note: '缺少男生或女生，等同均摊'
      });
    }

    // 4. 自定义折扣
    if (hasBoth) {
      var fTotal4 = equalShare * discountRatio * females;
      var mTotal4 = total - fTotal4;
      results.push({
        key: 'custom', icon: '⚙️', label: '自定义折扣', desc: '女生' + (discountRatio * 10) + '折，男生全价',
        rows: [
          { label: '男生', countText: '(' + males + '人)', amount: this.fmt(mTotal4 / males), isFree: false },
          { label: '女生', countText: '(' + females + '人)', amount: this.fmt(fTotal4 / females), isFree: discountRatio === 0 }
        ], note: ''
      });
    } else {
      results.push({
        key: 'custom', icon: '⚙️', label: '自定义折扣', desc: '女生' + (discountRatio * 10) + '折，男生全价',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
        note: '缺少男生或女生，等同均摊'
      });
    }

    // 5. 按轮次分摊
    if (totalRounds > 0) {
      var perRound = total / totalRounds;
      var avgRounds = totalRounds / N;
      results.push({
        key: 'byRounds', icon: '🔄', label: '按轮次分摊', desc: '按上场轮次计费',
        rows: [
          { label: '每轮单价', countText: '', amount: this.fmt(perRound), isFree: false },
          { label: '人均（均轮）', countText: '', amount: this.fmt(perRound * avgRounds), isFree: false }
        ], note: '实际多上场多付，少上场少付'
      });
    } else {
      results.push({
        key: 'byRounds', icon: '🔄', label: '按轮次分摊', desc: '按上场轮次计费',
        rows: [], note: '请填写总轮次数'
      });
    }

    // 6. 固定人均
    var expected6 = fixedAmount * N;
    var diff6 = total - expected6;
    var note6 = '';
    if (diff6 > 0.01) note6 = '差额 ¥' + this.fmt(diff6) + ' 由发起人补';
    else if (diff6 < -0.01) note6 = '多收 ¥' + this.fmt(Math.abs(diff6)) + ' 可退还';
    else note6 = '刚好匹配';
    results.push({
      key: 'fixed', icon: '📌', label: '固定人均', desc: '每人固定金额',
      rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(fixedAmount), isFree: false }],
      note: note6
    });

    // 7. 嘉宾免费
    if (regularCount > 0 && guestCount >= 0) {
      results.push({
        key: 'guestFree', icon: '🎉', label: '嘉宾免费', desc: '新人免单，常客均摊',
        rows: [
          { label: '常客', countText: '(' + regularCount + '人)', amount: this.fmt(total / regularCount), isFree: false },
          { label: '嘉宾', countText: '(' + guestCount + '人)', amount: '0.00', isFree: true }
        ], note: guestCount === 0 ? '无嘉宾，等同均摊' : ''
      });
    } else {
      results.push({
        key: 'guestFree', icon: '🎉', label: '嘉宾免费', desc: '新人免单，常客均摊',
        rows: [], note: '常客人数不足'
      });
    }

    // 8. 败者买单
    if (loserCount > 0 && loserCount <= N) {
      results.push({
        key: 'loserPays', icon: '😤', label: '败者买单', desc: '输方付账，赢方免费',
        rows: [
          { label: '败方', countText: '(' + loserCount + '人)', amount: this.fmt(total / loserCount), isFree: false },
          { label: '胜方', countText: '(' + winnerCount + '人)', amount: '0.00', isFree: true }
        ], note: ''
      });
    } else {
      results.push({
        key: 'loserPays', icon: '😤', label: '败者买单', desc: '输方付账，赢方免费',
        rows: [], note: '请填写败方人数（1~' + N + '）'
      });
    }

    this.setData({ allResults: results });
    wx.showToast({ title: '计算完成', icon: 'success' });
  },

  // 复制全部结果
  copyAllResult: function () {
    var r = this.data.allResults;
    if (!r) return;
    var text = '【羽球集·球费计算】\n';
    text += '总费用 ¥' + this.fmt(this.getTotal()) + ' | 男' + this.data.maleCount + ' 女' + this.data.femaleCount + ' 共' + this.data.totalPeople + '人\n';
    text += '─────────────\n';
    r.forEach(function (item) {
      if (item.rows.length === 0) {
        text += item.icon + ' ' + item.label + '：' + item.note + '\n';
      } else {
        var parts = item.rows.map(function (row) {
          return row.label + row.countText + ' ¥' + row.amount;
        });
        text += item.icon + ' ' + item.label + '：' + parts.join('  ');
        if (item.note) text += '  ↳ ' + item.note;
        text += '\n';
      }
    });
    text += '─────────────\n选一个模式收钱就行 👆';
    wx.setClipboardData({
      data: text,
      success: function () { wx.showToast({ title: '已复制，去群里贴', icon: 'none' }); }
    });
  }
});
