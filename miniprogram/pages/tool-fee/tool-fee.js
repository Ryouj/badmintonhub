// pages/tool-fee/tool-fee.js
// 球费计算器 — 支持 8 种计费模式

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

    // 模式
    mode: 'equal',
    modes: [
      { key: 'equal', label: '纯AA均摊', desc: '总费用 ÷ 人数', needGender: false, needRounds: false, needGuest: false, needLoser: false },
      { key: 'femaleHalf', label: '女生五折', desc: '女生半价，男生补差', needGender: true, needRounds: false, needGuest: false, needLoser: false },
      { key: 'femaleFree', label: '女生免单', desc: '女生免费，男生均摊', needGender: true, needRounds: false, needGuest: false, needLoser: false },
      { key: 'custom', label: '自定义折扣', desc: '女生X折，男生全价', needGender: true, needRounds: false, needGuest: false, needLoser: false },
      { key: 'byRounds', label: '按轮次分摊', desc: '按上场轮次计费', needGender: false, needRounds: true, needGuest: false, needLoser: false },
      { key: 'fixed', label: '固定人均', desc: '每人固定金额', needGender: false, needRounds: false, needGuest: false, needLoser: false },
      { key: 'guestFree', label: '嘉宾免费', desc: '新人免费，常客均摊', needGender: false, needRounds: false, needGuest: true, needLoser: false },
      { key: 'loserPays', label: '败者买单', desc: '输方付账，赢方免费', needGender: false, needRounds: false, needGuest: false, needLoser: true }
    ],

    // 模式参数
    discountRatio: '0.5',
    fixedAmount: '30',

    // 模式控制标志（供 wxml 条件渲染）
    needGender: false,
    needRounds: false,
    needGuest: false,
    needLoser: false,
    needDiscount: false,
    needFixed: false,

    // 参与者
    players: [
      { name: '', gender: 'male', rounds: 1, isGuest: false, isLoser: true }
    ],

    // 结果
    results: null,
    resultTotal: '',
    resultNote: ''
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
    // 自动汇总
    const total = this.calcDetailTotal();
    this.setData({ totalAmount: total });
  },

  calcDetailTotal() {
    return this.data.detailItems.reduce((sum, it) => {
      return sum + (parseFloat(it.amount) || 0);
    }, 0).toFixed(2);
  },

  // --- 模式选择 ---
  onModeSelect(e) {
    const key = e.currentTarget.dataset.key;
    const mode = this.data.modes.find(m => m.key === key);
    this.setData({
      mode: key,
      results: null,
      needGender: mode.needGender,
      needRounds: mode.needRounds,
      needGuest: mode.needGuest,
      needLoser: mode.needLoser,
      needDiscount: key === 'custom',
      needFixed: key === 'fixed'
    });
  },

  onDiscountInput(e) {
    this.setData({ discountRatio: e.detail.value });
  },

  onFixedInput(e) {
    this.setData({ fixedAmount: e.detail.value });
  },

  // --- 参与者 ---
  onPlayerName(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ [`players[${idx}].name`]: e.detail.value });
  },

  onGenderToggle(e) {
    const idx = e.currentTarget.dataset.idx;
    const cur = this.data.players[idx].gender;
    this.setData({ [`players[${idx}].gender`]: cur === 'male' ? 'female' : 'male' });
  },

  onRoundsChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const val = Math.max(0, parseInt(e.detail.value) || 0);
    this.setData({ [`players[${idx}].rounds`]: val });
  },

  onRoundsStep(e) {
    const idx = e.currentTarget.dataset.idx;
    const step = parseInt(e.currentTarget.dataset.step);
    const cur = this.data.players[idx].rounds || 0;
    const val = Math.max(0, cur + step);
    this.setData({ [`players[${idx}].rounds`]: val });
  },

  onGuestToggle(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ [`players[${idx}].isGuest`]: !this.data.players[idx].isGuest });
  },

  onLoserToggle(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ [`players[${idx}].isLoser`]: !this.data.players[idx].isLoser });
  },

  addPlayer() {
    const players = this.data.players;
    if (players.length >= 20) {
      wx.showToast({ title: '最多 20 人', icon: 'none' });
      return;
    }
    players.push({ name: '', gender: 'male', rounds: 1, isGuest: false, isLoser: true });
    this.setData({ players });
  },

  removePlayer(e) {
    const idx = e.currentTarget.dataset.idx;
    const players = this.data.players;
    if (players.length <= 1) return;
    players.splice(idx, 1);
    this.setData({ players });
  },

  // --- 计算 ---
  getValidPlayers() {
    return this.data.players.filter(p => p.name.trim());
  },

  getTotal() {
    if (this.data.showDetail) {
      return parseFloat(this.calcDetailTotal()) || 0;
    }
    return parseFloat(this.data.totalAmount) || 0;
  },

  round2(n) {
    return Math.round(n * 100) / 100;
  },

  calculate() {
    const total = this.getTotal();
    const players = this.getValidPlayers();

    if (total <= 0) {
      wx.showToast({ title: '请输入总费用', icon: 'none' });
      return;
    }
    if (players.length === 0) {
      wx.showToast({ title: '请添加参与者', icon: 'none' });
      return;
    }

    const mode = this.data.mode;
    let results = [];
    let note = '';

    switch (mode) {
      case 'equal':
        results = players.map(p => ({ name: p.name, amount: this.round2(total / players.length) }));
        break;

      case 'femaleHalf':
      case 'femaleFree':
      case 'custom': {
        const ratio = mode === 'femaleHalf' ? 0.5 : mode === 'femaleFree' ? 0 : (parseFloat(this.data.discountRatio) || 0);
        const males = players.filter(p => p.gender === 'male');
        const females = players.filter(p => p.gender === 'female');

        if (females.length === 0) {
          // 没女生，纯AA
          results = players.map(p => ({ name: p.name, amount: this.round2(total / players.length), tag: '男' }));
          note = '无女生，按纯AA均摊';
        } else if (males.length === 0) {
          // 没男生，女生全付
          results = players.map(p => ({ name: p.name, amount: this.round2(total / players.length), tag: '女' }));
          note = '无男生，女生均摊';
        } else {
          const baseShare = total / players.length;
          const femaleTotal = baseShare * ratio * females.length;
          const maleTotal = total - femaleTotal;
          const maleShare = maleTotal / males.length;
          const femaleShare = femaleTotal / females.length;

          results = players.map(p => {
            if (p.gender === 'female') {
              return { name: p.name, amount: this.round2(femaleShare), tag: '女' + (ratio === 0 ? '免' : (ratio * 10) + '折') };
            }
            return { name: p.name, amount: this.round2(maleShare), tag: '男' };
          });
        }
        break;
      }

      case 'byRounds': {
        const totalRounds = players.reduce((s, p) => s + (p.rounds || 0), 0);
        if (totalRounds === 0) {
          wx.showToast({ title: '请填写每人轮次', icon: 'none' });
          return;
        }
        const perRound = total / totalRounds;
        results = players.map(p => ({
          name: p.name,
          amount: this.round2(perRound * (p.rounds || 0)),
          tag: (p.rounds || 0) + '轮'
        }));
        note = '每轮 ¥' + this.round2(perRound).toFixed(2);
        break;
      }

      case 'fixed': {
        const fixed = parseFloat(this.data.fixedAmount) || 0;
        const expected = fixed * players.length;
        const diff = total - expected;
        results = players.map(p => ({ name: p.name, amount: this.round2(fixed) }));
        if (diff > 0) {
          note = '固定 ¥' + fixed + '/人，差额 ¥' + diff.toFixed(2) + '由发起人补';
        } else if (diff < 0) {
          note = '固定 ¥' + fixed + '/人，多收 ¥' + Math.abs(diff).toFixed(2) + '可退还';
        } else {
          note = '固定 ¥' + fixed + '/人，刚好匹配';
        }
        break;
      }

      case 'guestFree': {
        const guests = players.filter(p => p.isGuest);
        const regulars = players.filter(p => !p.isGuest);
        if (regulars.length === 0) {
          wx.showToast({ title: '至少需要一个非嘉宾', icon: 'none' });
          return;
        }
        const share = total / regulars.length;
        results = players.map(p => ({
          name: p.name,
          amount: p.isGuest ? 0 : this.round2(share),
          tag: p.isGuest ? '嘉宾' : ''
        }));
        break;
      }

      case 'loserPays': {
        const losers = players.filter(p => p.isLoser);
        const winners = players.filter(p => !p.isLoser);
        if (losers.length === 0) {
          wx.showToast({ title: '请标记败方', icon: 'none' });
          return;
        }
        const share = total / losers.length;
        results = players.map(p => ({
          name: p.name,
          amount: p.isLoser ? this.round2(share) : 0,
          tag: p.isLoser ? '败' : '胜'
        }));
        break;
      }
    }

    // 校验总额
    const resultSum = results.reduce((s, r) => s + r.amount, 0);
    const diff = this.round2(total - resultSum);
    if (Math.abs(diff) > 0.01) {
      // 最后一人补差
      results[results.length - 1].amount = this.round2(results[results.length - 1].amount + diff);
    }

    const totalResult = this.round2(results.reduce((s, r) => s + r.amount, 0));

    this.setData({
      results: results,
      resultTotal: totalResult.toFixed(2),
      resultNote: note
    });
  },

  copyResult() {
    const r = this.data.results;
    if (!r) return;
    const modeLabel = this.data.modes.find(m => m.key === this.data.mode).label;
    let text = '【羽球集·球费计算】\n模式：' + modeLabel + '\n';
    if (this.data.resultNote) text += this.data.resultNote + '\n';
    text += '─────────\n';
    r.forEach(item => {
      text += item.name + (item.tag ? '(' + item.tag + ')' : '') + '：¥' + item.amount.toFixed(2) + '\n';
    });
    text += '─────────\n合计：¥' + this.data.resultTotal;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制，去群里贴', icon: 'none' })
    });
  }
});
