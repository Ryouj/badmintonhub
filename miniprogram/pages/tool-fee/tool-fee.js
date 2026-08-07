// pages/tool-fee/tool-fee.js
// 球费计算器 — 一次输入，8种模式全出结果

Page({
  data: {
    // 费用
    totalAmount: '',
    showDetail: false,
    detailItems: [
      { label: '场地费', key: 'court', amount: '' },
      { label: '球费', key: 'shuttle', amount: '' },
      { label: '饮料', key: 'drink', amount: '' },
      { label: '其他', key: 'other', amount: '' }
    ],

    // 人数（直接输入，不再逐人添加）
    maleCount: '4',
    femaleCount: '4',
    totalPeople: 8,

    // 模式参数（全部可见，因为一次性算所有模式）
    discountRatio: '0.5',
    fixedAmount: '30',
    totalRounds: '32',
    guestCount: '1',
    loserCount: '4',

    // 结果（所有模式）
    allResults: null
  },

  onLoad() {
    const m = parseInt(this.data.maleCount) || 0;
    const f = parseInt(this.data.femaleCount) || 0;
    this.setData({ totalPeople: m + f });
  },

  // --- 费用输入 ---
  onTotalInput(e) {
    this.setData({ totalAmount: e.detail.value });
  },

  toggleDetail() {
    this.setData({ showDetail: !this.data.showDetail });
  },

  onDetailInput(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ [`detailItems[${idx}].amount`]: e.detail.value });
    const total = this.calcDetailTotal();
    this.setData({ totalAmount: total });
  },

  calcDetailTotal() {
    return this.data.detailItems.reduce((sum, it) => {
      return sum + (parseFloat(it.amount) || 0);
    }, 0).toFixed(2);
  },

  // --- 人数输入 ---
  onMaleInput(e) {
    const maleCount = e.detail.value;
    const female = parseInt(this.data.femaleCount) || 0;
    const total = (parseInt(maleCount) || 0) + female;
    this.setData({ maleCount, totalPeople: total });
  },

  onFemaleInput(e) {
    const femaleCount = e.detail.value;
    const male = parseInt(this.data.maleCount) || 0;
    const total = male + (parseInt(femaleCount) || 0);
    this.setData({ femaleCount, totalPeople: total });
  },

  stepMale(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    let cur = parseInt(this.data.maleCount) || 0;
    cur = Math.max(0, cur + step);
    const female = parseInt(this.data.femaleCount) || 0;
    this.setData({ maleCount: String(cur), totalPeople: cur + female });
  },

  stepFemale(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    let cur = parseInt(this.data.femaleCount) || 0;
    cur = Math.max(0, cur + step);
    const male = parseInt(this.data.maleCount) || 0;
    this.setData({ femaleCount: String(cur), totalPeople: male + cur });
  },

  // --- 模式参数输入 ---
  onDiscountInput(e) { this.setData({ discountRatio: e.detail.value }); },
  onFixedInput(e) { this.setData({ fixedAmount: e.detail.value }); },
  onRoundsInput(e) { this.setData({ totalRounds: e.detail.value }); },
  onGuestInput(e) { this.setData({ guestCount: e.detail.value }); },
  onLoserInput(e) { this.setData({ loserCount: e.detail.value }); },

  // --- 工具函数 ---
  getTotal() {
    if (this.data.showDetail) {
      return parseFloat(this.calcDetailTotal()) || 0;
    }
    return parseFloat(this.data.totalAmount) || 0;
  },

  fmt(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  },

  // --- 核心计算：一次出8种结果 ---
  calculate() {
    const total = this.getTotal();
    const males = parseInt(this.data.maleCount) || 0;
    const females = parseInt(this.data.femaleCount) || 0;
    const N = males + females;

    if (total <= 0) {
      wx.showToast({ title: '请输入总费用', icon: 'none' });
      return;
    }
    if (N === 0) {
      wx.showToast({ title: '请输入人数', icon: 'none' });
      return;
    }

    const discountRatio = parseFloat(this.data.discountRatio) || 0;
    const fixedAmount = parseFloat(this.data.fixedAmount) || 0;
    const totalRounds = parseInt(this.data.totalRounds) || 0;
    const guestCount = parseInt(this.data.guestCount) || 0;
    const loserCount = parseInt(this.data.loserCount) || 0;
    const regularCount = N - guestCount;
    const winnerCount = N - loserCount;

    const equalShare = total / N;
    const hasBoth = males > 0 && females > 0;
    const results = [];

    // ── 1. 纯AA均摊 ──
    results.push({
      key: 'equal', icon: '➗', label: '纯AA均摊', desc: '总费用 ÷ 人数',
      rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
      note: ''
    });

    // ── 2. 女生五折 ──
    if (hasBoth) {
      const femaleTotal = equalShare * 0.5 * females;
      const maleTotal = total - femaleTotal;
      results.push({
        key: 'femaleHalf', icon: '👩', label: '女生五折', desc: '女生半价，男生补差',
        rows: [
          { label: '男生', countText: '(' + males + '人)', amount: this.fmt(maleTotal / males), isFree: false },
          { label: '女生', countText: '(' + females + '人)', amount: this.fmt(femaleTotal / females), isFree: false }
        ],
        note: ''
      });
    } else {
      results.push({
        key: 'femaleHalf', icon: '👩', label: '女生五折', desc: '女生半价，男生补差',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
        note: males === 0 ? '无男生，等同均摊' : '无女生，等同均摊'
      });
    }

    // ── 3. 女生免单 ──
    if (hasBoth) {
      const maleShare = total / males;
      results.push({
        key: 'femaleFree', icon: '🆓', label: '女生免单', desc: '女生免费，男生均摊',
        rows: [
          { label: '男生', countText: '(' + males + '人)', amount: this.fmt(maleShare), isFree: false },
          { label: '女生', countText: '(' + females + '人)', amount: '0.00', isFree: true }
        ],
        note: ''
      });
    } else {
      results.push({
        key: 'femaleFree', icon: '🆓', label: '女生免单', desc: '女生免费，男生均摊',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
        note: '缺少男生或女生，等同均摊'
      });
    }

    // ── 4. 自定义折扣 ──
    if (hasBoth) {
      const femaleTotal = equalShare * discountRatio * females;
      const maleTotal = total - femaleTotal;
      results.push({
        key: 'custom', icon: '⚙️', label: '自定义折扣', desc: '女生' + (discountRatio * 10) + '折，男生全价',
        rows: [
          { label: '男生', countText: '(' + males + '人)', amount: this.fmt(maleTotal / males), isFree: false },
          { label: '女生', countText: '(' + females + '人)', amount: this.fmt(femaleTotal / females), isFree: discountRatio === 0 }
        ],
        note: ''
      });
    } else {
      results.push({
        key: 'custom', icon: '⚙️', label: '自定义折扣', desc: '女生' + (discountRatio * 10) + '折，男生全价',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(equalShare), isFree: false }],
        note: '缺少男生或女生，等同均摊'
      });
    }

    // ── 5. 按轮次分摊 ──
    if (totalRounds > 0) {
      const perRound = total / totalRounds;
      const avgRounds = totalRounds / N;
      results.push({
        key: 'byRounds', icon: '🔄', label: '按轮次分摊', desc: '按上场轮次计费',
        rows: [
          { label: '每轮单价', countText: '', amount: this.fmt(perRound), isFree: false },
          { label: '人均（均轮）', countText: '', amount: this.fmt(perRound * avgRounds), isFree: false }
        ],
        note: '实际多上场多付，少上场少付'
      });
    } else {
      results.push({
        key: 'byRounds', icon: '🔄', label: '按轮次分摊', desc: '按上场轮次计费',
        rows: [], note: '请填写总轮次数'
      });
    }

    // ── 6. 固定人均 ──
    {
      const expected = fixedAmount * N;
      const diff = total - expected;
      let note = '';
      if (diff > 0.01) note = '差额 ¥' + this.fmt(diff) + ' 由发起人补';
      else if (diff < -0.01) note = '多收 ¥' + this.fmt(Math.abs(diff)) + ' 可退还';
      else note = '刚好匹配';
      results.push({
        key: 'fixed', icon: '📌', label: '固定人均', desc: '每人固定金额',
        rows: [{ label: '每人', countText: '(' + N + '人)', amount: this.fmt(fixedAmount), isFree: false }],
        note: note
      });
    }

    // ── 7. 嘉宾免费 ──
    if (regularCount > 0 && guestCount >= 0) {
      const share = total / regularCount;
      results.push({
        key: 'guestFree', icon: '🎉', label: '嘉宾免费', desc: '新人免单，常客均摊',
        rows: [
          { label: '常客', countText: '(' + regularCount + '人)', amount: this.fmt(share), isFree: false },
          { label: '嘉宾', countText: '(' + guestCount + '人)', amount: '0.00', isFree: true }
        ],
        note: guestCount === 0 ? '无嘉宾，等同均摊' : ''
      });
    } else {
      results.push({
        key: 'guestFree', icon: '🎉', label: '嘉宾免费', desc: '新人免单，常客均摊',
        rows: [], note: '常客人数不足'
      });
    }

    // ── 8. 败者买单 ──
    if (loserCount > 0 && loserCount <= N) {
      const share = total / loserCount;
      results.push({
        key: 'loserPays', icon: '😤', label: '败者买单', desc: '输方付账，赢方免费',
        rows: [
          { label: '败方', countText: '(' + loserCount + '人)', amount: this.fmt(share), isFree: false },
          { label: '胜方', countText: '(' + winnerCount + '人)', amount: '0.00', isFree: true }
        ],
        note: ''
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

  // --- 复制全部结果 ---
  copyAllResult() {
    const r = this.data.allResults;
    if (!r) return;
    let text = '【羽球集·球费计算】\n';
    text += '总费用 ¥' + this.fmt(this.getTotal()) + ' | 男' + this.data.maleCount + ' 女' + this.data.femaleCount + ' 共' + this.data.totalPeople + '人\n';
    text += '─────────────\n';
    r.forEach(item => {
      if (item.rows.length === 0) {
        text += item.icon + ' ' + item.label + '：' + item.note + '\n';
      } else {
        const parts = item.rows.map(row =>
          row.label + row.countText + ' ¥' + row.amount
        );
        text += item.icon + ' ' + item.label + '：' + parts.join('  ');
        if (item.note) text += '  ↳ ' + item.note;
        text += '\n';
      }
    });
    text += '─────────────\n选一个模式收钱就行 👆';
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制，去群里贴', icon: 'none' })
    });
  }
});
