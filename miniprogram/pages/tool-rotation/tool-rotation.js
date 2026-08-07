// pages/tool-rotation/tool-rotation.js
// 八人转排班表 — 擂台制 / 公平轮换 / 随机配对

Page({
  data: {
    // 选手
    players: [
      '', '', '', '', '', '', '', ''
    ],
    playerCount: 8,

    // 模式
    mode: 'fair',
    modes: [
      { key: 'fair', label: '公平轮换', desc: '预排赛程，每人搭档不同' },
      { key: 'king', label: '擂台制', desc: '赢者留场，输者轮换' },
      { key: 'random', label: '随机配对', desc: '每轮随机分队' }
    ],

    // 场地
    courts: 2,

    // 公平轮换结果
    schedule: null,

    // 擂台制状态
    kingState: null,

    // 随机配对
    randomMatch: null,

    // 场地标签
    courtLabels: ['A', 'B', 'C'],

    // 统计
    stats: null,
    statsList: null
  },

  // --- 选手输入 ---
  onPlayerInput(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ [`players[${idx}]`]: e.detail.value });
  },

  addPlayer() {
    const players = this.data.players;
    if (players.length >= 12) {
      wx.showToast({ title: '最多 12 人', icon: 'none' });
      return;
    }
    players.push('');
    this.setData({ players, playerCount: players.length });
  },

  removePlayer() {
    const players = this.data.players;
    if (players.length <= 4) {
      wx.showToast({ title: '最少 4 人', icon: 'none' });
      return;
    }
    players.pop();
    this.setData({ players, playerCount: players.length });
  },

  // --- 模式选择 ---
  onModeSelect(e) {
    this.setData({
      mode: e.currentTarget.dataset.key,
      schedule: null,
      kingState: null,
      randomMatch: null,
      stats: null,
      statsList: null
    });
  },

  onCourtChange(e) {
    this.setData({ courts: parseInt(e.currentTarget.dataset.courts) });
  },

  // --- 公平轮换（圆桌法）---
  generateFair() {
    const players = this.data.players.filter(p => p.trim());
    if (players.length < 4 || players.length % 2 !== 0) {
      wx.showToast({ title: '需要偶数人（最少4人）', icon: 'none' });
      return;
    }

    const n = players.length;
    const pos = players.map((_, i) => i);
    const rounds = [];

    for (let r = 0; r < n - 1; r++) {
      const partnerPairs = [];
      for (let i = 0; i < n / 2; i++) {
        partnerPairs.push([pos[i], pos[n - 1 - i]]);
      }

      const games = [];
      const numGames = partnerPairs.length / 2;
      for (let g = 0; g < numGames; g++) {
        const p1 = partnerPairs[g * 2];
        const p2 = partnerPairs[g * 2 + 1];
        games.push({
          team1: [players[p1[0]], players[p1[1]]],
          team2: [players[p2[0]], players[p2[1]]]
        });
      }

      // 1片场地：只取第一场，其余为替补席
      const displayGames = this.data.courts === 1 ? [games[0]] : games;
      const bench = this.data.courts === 1
        ? games.slice(1).flatMap(g => [...g.team1, ...g.team2])
        : [];

      rounds.push({ round: r + 1, games: displayGames, bench });

      // 旋转：固定第一个，其余左移
      const first = pos[0];
      const rest = pos.slice(1);
      rest.push(rest.shift());
      pos.splice(0, n, first, ...rest);
    }

    this.setData({ schedule: rounds });
  },

  // --- 擂台制 ---
  startKing() {
    const players = this.data.players.filter(p => p.trim());
    if (players.length < 4) {
      wx.showToast({ title: '最少 4 人', icon: 'none' });
      return;
    }

    // 随机选 4 人上场
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const onCourt = shuffled.slice(0, 4);
    const onBench = shuffled.slice(4);

    // 随机分队
    const team1 = [onCourt[0], onCourt[1]];
    const team2 = [onCourt[2], onCourt[3]];

    const stats = {};
    players.forEach(p => { stats[p] = { played: 0, wins: 0, losses: 0 }; });

    this.setData({
      kingState: {
        team1, team2,
        bench: onBench,
        gameNum: 1
      },
      stats,
      statsList: this.buildStatsList(stats),
      schedule: null,
      randomMatch: null
    });
  },

  onKingWin(e) {
    const winner = e.currentTarget.dataset.team; // 1 or 2
    const state = this.data.kingState;
    const stats = { ...this.data.stats };

    // 更新统计
    const losers = winner === 1 ? state.team2 : state.team1;
    const winners = winner === 1 ? state.team1 : state.team2;
    losers.forEach(p => { stats[p].played++; stats[p].losses++; });
    winners.forEach(p => { stats[p].played++; stats[p].wins++; });

    // 轮换：输者下场到队尾，场下前2人上场
    const newBench = [...state.bench, ...losers];
    const newOnCourt = [...winners, ...newBench.splice(0, 2)];

    const team1 = [newOnCourt[0], newOnCourt[1]];
    const team2 = [newOnCourt[2], newOnCourt[3]];

    this.setData({
      kingState: {
        team1, team2,
        bench: newBench,
        gameNum: state.gameNum + 1
      },
      stats,
      statsList: this.buildStatsList(stats)
    });
  },

  buildStatsList(stats) {
    const players = this.data.players.filter(p => p.trim() && stats[p]);
    return players.map(p => ({
      name: p,
      played: stats[p].played,
      wins: stats[p].wins,
      losses: stats[p].losses,
      winRate: stats[p].played > 0 ? Math.round(stats[p].wins / stats[p].played * 100) : 0
    }));
  },

  // --- 随机配对 ---
  generateRandom() {
    const players = this.data.players.filter(p => p.trim());
    if (players.length < 4) {
      wx.showToast({ title: '最少 4 人', icon: 'none' });
      return;
    }

    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const courts = this.data.courts;
    const gamesPerCourt = 1;
    const totalOnCourt = courts === 2 ? Math.min(shuffled.length, 8) : 4;
    const onCourt = shuffled.slice(0, totalOnCourt);
    const onBench = shuffled.slice(totalOnCourt);

    const games = [];
    for (let i = 0; i < onCourt.length; i += 4) {
      games.push({
        team1: [onCourt[i], onCourt[i + 1]],
        team2: [onCourt[i + 2], onCourt[i + 3]]
      });
    }

    this.setData({
      randomMatch: { games, bench: onBench, round: (this.data.randomMatch?.round || 0) + 1 }
    });
  },

  // --- 复制 ---
  copySchedule() {
    if (this.data.schedule) {
      let text = '【羽球集·公平轮换】\n';
      text += this.data.courts === 2 ? '2片场地 · ' : '1片场地 · ';
      text += this.data.schedule.length + '轮\n';
      text += '═════════\n';
      this.data.schedule.forEach(r => {
        text += '第' + r.round + '轮\n';
        r.games.forEach((g, gi) => {
          text += '  场' + String.fromCharCode(65 + gi) + ': ' + g.team1.join('+') + ' vs ' + g.team2.join('+') + '\n';
        });
        if (r.bench.length > 0) {
          text += '  休息: ' + r.bench.join('、') + '\n';
        }
      });
      wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制赛程', icon: 'none' }) });
    } else if (this.data.kingState) {
      const s = this.data.kingState;
      let text = '【羽球集·擂台战报】\n第' + s.gameNum + '局\n';
      text += '场A: ' + s.team1.join('+') + ' vs ' + s.team2.join('+') + '\n';
      if (s.bench.length > 0) text += '等候: ' + s.bench.join('、') + '\n';
      if (this.data.stats) {
        text += '═════════\n';
        Object.entries(this.data.stats).forEach(([name, st]) => {
          text += name + ' ' + st.played + '场 ' + st.wins + '胜' + st.losses + '负\n';
        });
      }
      wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '已复制战报', icon: 'none' }) });
    }
  }
});
