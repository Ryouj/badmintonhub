// 福彩3D 选号核心算法 — 从 analysis.py 移植到小程序端
// 数据来源：fucai3d-data.js（最近300期静态种子）
// 算法：位置评分（反重复+加权频率+遗漏补偿）+ 全局逾期评分 + 胆码 + 推荐组合 + 杀号
// 说明：纯本地统计生成，仅供娱乐参考，不构成任何购彩建议。

function missingByPos(dataDesc, posIdx) {
  const res = {};
  for (let num = 0; num < 10; num++) {
    let found = dataDesc.length;
    for (let idx = 0; idx < dataDesc.length; idx++) {
      if (dataDesc[idx].n[posIdx] === num) { found = idx; break; }
    }
    res[num] = found;
  }
  return res;
}

function missingAny(dataDesc) {
  const res = {};
  for (let num = 0; num < 10; num++) {
    let found = dataDesc.length;
    for (let idx = 0; idx < dataDesc.length; idx++) {
      if (dataDesc[idx].n.indexOf(num) !== -1) { found = idx; break; }
    }
    res[num] = found;
  }
  return res;
}

function buildPattern(r, kind) {
  return r.n.map(function (d) {
    if (kind === 'size') return d >= 5 ? '大' : '小';
    return d % 2 === 1 ? '奇' : '偶';
  }).join('');
}

function transitionPredict(history, lookback, kind) {
  var searchData = history.length > 500 ? history.slice(-500) : history;
  if (searchData.length < lookback + 2) return null;
  var recentStr = '';
  for (var k = searchData.length - lookback; k < searchData.length; k++) {
    recentStr += buildPattern(searchData[k], kind);
  }
  var followers = {};
  for (var i = 0; i < searchData.length - lookback - 1; i++) {
    var pat = '';
    for (var j = 0; j < lookback; j++) pat += buildPattern(searchData[i + j], kind);
    if (pat === recentStr) {
      var nxt = buildPattern(searchData[i + lookback], kind);
      followers[nxt] = (followers[nxt] || 0) + 1;
    }
  }
  var entries = Object.keys(followers).map(function (k) { return [k, followers[k]]; });
  if (entries.length) {
    entries.sort(function (a, b) { return b[1] - a[1]; });
    return entries[0][0];
  }
  return null;
}

function corePredict(data) {
  if (data.length < 30) return null;

  var recent50 = data.slice(-50);
  var recent30 = data.slice(-30);
  var dataDesc = data.slice().reverse();

  // 遗漏
  var miss = {
    h: missingByPos(dataDesc, 0),
    t: missingByPos(dataDesc, 1),
    u: missingByPos(dataDesc, 2),
    any: missingAny(dataDesc)
  };

  // 位置评分
  var score_h = {}, score_t = {}, score_u = {};
  var last3 = data.slice(-3);
  last3.forEach(function (r) {
    score_h[r.n[0]] = (score_h[r.n[0]] || 0) - 2.5;
    score_t[r.n[1]] = (score_t[r.n[1]] || 0) - 2.5;
    score_u[r.n[2]] = (score_u[r.n[2]] || 0) - 2.5;
  });
  recent50.forEach(function (r, i) {
    var w = (i + 1) / recent50.length;
    score_h[r.n[0]] = (score_h[r.n[0]] || 0) + w;
    score_t[r.n[1]] = (score_t[r.n[1]] || 0) + w;
    score_u[r.n[2]] = (score_u[r.n[2]] || 0) + w;
  });
  for (var num = 0; num < 10; num++) {
    score_h[num] = (score_h[num] || 0) + miss.h[num] * 0.5;
    score_t[num] = (score_t[num] || 0) + miss.t[num] * 0.5;
    score_u[num] = (score_u[num] || 0) + miss.u[num] * 0.5;
  }

  // 全局逾期评分 → 胆码
  var total = data.length;
  var avgGaps = {};
  for (var n2 = 0; n2 < 10; n2++) {
    var lastPos = -1, gapSum = 0, gapCnt = 0;
    data.forEach(function (r, i) {
      if (r.n.indexOf(n2) !== -1) {
        if (lastPos >= 0) { gapSum += (i - lastPos); gapCnt++; }
        lastPos = i;
      }
    });
    avgGaps[n2] = gapCnt > 0 ? gapSum / gapCnt : total;
  }
  var scoreGlobal = {};
  for (var n3 = 0; n3 < 10; n3++) {
    var avgG = Math.max(avgGaps[n3], 1);
    var curG = miss.any[n3];
    scoreGlobal[n3] = (curG / avgG) * 4.0;
  }
  var sortedGlobal = Object.keys(scoreGlobal).map(function (k) { return [parseInt(k), scoreGlobal[k]]; });
  sortedGlobal.sort(function (a, b) { return b[1] - a[1]; });
  var singleDan = sortedGlobal[0][0];
  var doubleDan = [sortedGlobal[0][0], sortedGlobal[1][0]];
  var backupDan = [sortedGlobal[2][0], sortedGlobal[3][0], sortedGlobal[4][0]];

  // 各位 Top4
  function topN(scoreObj, k) {
    return Object.keys(scoreObj).map(function (key) { return [parseInt(key), scoreObj[key]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, k).map(function (x) { return x[0]; });
  }
  var top_h = topN(score_h, 4);
  var top_t = topN(score_t, 4);
  var top_u = topN(score_u, 4);

  // 和值 / 跨度参考
  var sums = recent50.map(function (r) { return r.n[0] + r.n[1] + r.n[2]; });
  var avgSum = sums.reduce(function (a, b) { return a + b; }, 0) / sums.length;
  var sumVar = sums.reduce(function (a, s) { return a + Math.pow(s - avgSum, 2); }, 0) / sums.length;
  var sumStd = Math.sqrt(sumVar);
  var sumRange = [
    Math.max(0, Math.floor(avgSum - sumStd)),
    Math.min(27, Math.floor(avgSum + sumStd))
  ];
  var spans = recent50.map(function (r) { return Math.max.apply(null, r.n) - Math.min.apply(null, r.n); });
  var avgSpan = spans.reduce(function (a, b) { return a + b; }, 0) / spans.length;
  var spanCounter = {};
  spans.forEach(function (s) { spanCounter[s] = (spanCounter[s] || 0) + 1; });
  var predSpan = parseInt(Object.keys(spanCounter).map(function (k) { return [k, spanCounter[k]]; })
    .sort(function (a, b) { return b[1] - a[1]; })[0][0]);

  // 推荐组合
  var candidates = [];
  function addCand(digits) {
    var recSum = digits[0] + digits[1] + digits[2];
    if (Math.abs(recSum - avgSum) <= 10) {
      var sc = score_h[digits[0]] + score_t[digits[1]] + score_u[digits[2]];
      candidates.push([digits, sc]);
    }
  }
  top_h.forEach(function (h) {
    top_t.forEach(function (t) {
      top_u.forEach(function (u) { addCand([h, t, u]); });
    });
  });
  var danCandidates = candidates.filter(function (c) { return c[0].indexOf(singleDan) !== -1; });

  // 候选不足时，强制用单胆替换评分最低的位补齐
  if (danCandidates.length < 5) {
    var pools = [top_h, top_t, top_u];
    var seenFallback = {};
    for (var pos = 0; pos < 3; pos++) {
      var o1 = pos === 0 ? top_t : top_h;
      var o2 = pos === 2 ? top_t : top_u;
      for (var ai = 0; ai < pools[pos].length; ai++) {
        var a = pools[pos][ai];
        o1.forEach(function (x) {
          o2.forEach(function (y) {
            var digits;
            if (pos === 0) digits = [singleDan, x, y];
            else if (pos === 1) digits = [x, singleDan, y];
            else digits = [x, y, singleDan];
            var key = digits.join('');
            if (!seenFallback[key]) { seenFallback[key] = 1; addCand(digits); }
          });
        });
      }
    }
    danCandidates = candidates.filter(function (c) { return c[0].indexOf(singleDan) !== -1; });
  }

  var seen = {};
  var uniqueDan = [];
  danCandidates.forEach(function (c) {
    var key = c[0].join('');
    if (!seen[key]) { seen[key] = 1; uniqueDan.push(c); }
  });
  uniqueDan.sort(function (a, b) { return b[1] - a[1]; });

  var recommendations = [];
  uniqueDan.slice(0, 8).forEach(function (c) {
    var d = c[0];
    var hasDouble = doubleDan.every(function (dd) { return d.indexOf(dd) !== -1; });
    var parts = ['和值' + (d[0] + d[1] + d[2]), '跨度' + (Math.max.apply(null, d) - Math.min.apply(null, d))];
    if (hasDouble) parts.unshift('含双胆');
    recommendations.push({
      number: d.join(''),
      reason: parts.join('，'),
      score: Math.round(c[1] * 100) / 100,
      hasDan: d.indexOf(singleDan) !== -1,
      hasDoubleDan: hasDouble
    });
  });
  // 仍不足则用非胆组合补充
  if (recommendations.length < 5) {
    candidates.slice().sort(function (a, b) { return b[1] - a[1]; }).forEach(function (c) {
      var d = c[0];
      var key = d.join('');
      if (!seen[key]) {
        seen[key] = 1;
        recommendations.push({
          number: key,
          reason: '和值' + (d[0] + d[1] + d[2]) + '，跨度' + (Math.max.apply(null, d) - Math.min.apply(null, d)),
          score: Math.round(c[1] * 100) / 100,
          hasDan: d.indexOf(singleDan) !== -1,
          hasDoubleDan: doubleDan.every(function (dd) { return d.indexOf(dd) !== -1; })
        });
      }
      if (recommendations.length >= 8) return;
    });
  }
  var recNumber = recommendations.length ? recommendations[0].number
    : (top_h[0] + '' + top_t[0] + '' + top_u[0]);

  // 杀号（各位评分最低）
  function bottomN(scoreObj, k) {
    return Object.keys(scoreObj).map(function (key) { return [parseInt(key), scoreObj[key]]; })
      .sort(function (a, b) { return a[1] - b[1]; }).slice(0, k).map(function (x) { return x[0]; });
  }
  var kill_h = bottomN(score_h, 2);
  var kill_t = bottomN(score_t, 2);
  var kill_u = bottomN(score_u, 2);

  // 组选类型
  var comboCnt = {};
  recent30.forEach(function (r) {
    var u = new Set(r.n).size;
    var t = u === 1 ? '豹子' : (u === 2 ? '组三' : '组六');
    comboCnt[t] = (comboCnt[t] || 0) + 1;
  });
  var predictedCombo = Object.keys(comboCnt).map(function (k) { return [k, comboCnt[k]]; })
    .sort(function (a, b) { return b[1] - a[1]; })[0][0];

  // 大小奇偶
  var recentBig = 0, recentOdd = 0;
  recent30.slice(-5).forEach(function (r) {
    r.n.forEach(function (d) {
      if (d >= 5) recentBig++;
      if (d % 2 === 1) recentOdd++;
    });
  });
  var bigRatio = recentBig / 15;
  var sumBias = 13.5 - avgSum;
  var predSize = transitionPredict(data, 3, 'size');
  if (!predSize) predSize = transitionPredict(data, 2, 'size');
  if (!predSize) {
    predSize = [top_h, top_t, top_u].map(function (pool) {
      return pool.filter(function (n) { return n >= 5; }).length >= 2 ? '大' : '小';
    }).join('');
  }
  var predParity = transitionPredict(data, 3, 'parity');
  if (!predParity) predParity = transitionPredict(data, 2, 'parity');
  if (!predParity) {
    predParity = [top_h, top_t, top_u].map(function (pool) {
      return pool.filter(function (n) { return n % 2 === 1; }).length >= 2 ? '奇' : '偶';
    }).join('');
  }

  return {
    recommendations: recommendations,
    killNumbers: { hundred: kill_h, ten: kill_t, unit: kill_u },
    sum: { avg: Math.round(avgSum * 10) / 10, range: sumRange, trend: sumBias < 0 ? '偏大' : '偏小' },
    span: { avg: Math.round(avgSpan * 10) / 10, recommended: [predSpan - 1, predSpan, predSpan + 1] },
    combo: predictedCombo,
    size: { bigRatio: Math.round(bigRatio * 1000) / 10, trend: bigRatio > 0.55 ? '偏大' : (bigRatio < 0.45 ? '偏小' : '均衡') },
    parity: { oddRatio: Math.round((recentOdd / 15) * 1000) / 10, trend: recentOdd / 15 > 0.55 ? '偏奇' : (recentOdd / 15 < 0.45 ? '偏偶' : '均衡') },
    dan: { single: singleDan, double: doubleDan, backup: backupDan },
    hot: { hundred: top_h.slice(0, 3), ten: top_t.slice(0, 3), unit: top_u.slice(0, 3) },
    cold: { hundred: kill_h, ten: kill_t, unit: kill_u },
    recNumber: recNumber
  };
}

// 对外：传入历史数据（默认用内置种子），返回完整生成结果
function generate(history) {
  return corePredict(history || require('./fucai3d-data.js'));
}

module.exports = { generate: generate };
