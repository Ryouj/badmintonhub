// utils/api.js - CloudBase callContainer API 客户端
const CLOUD_ENV = 'prod-d5gqebf4i52aaa93a';
const SERVICE_NAME = 'golang-gbnx';

let token = '';

// 初始化 token（从本地存储读取）
function initToken() {
  token = wx.getStorageSync('yuqiuji_token') || '';
}

// 保存 token
function saveToken(t) {
  token = t;
  wx.setStorageSync('yuqiuji_token', t);
}

// 清除 token
function clearToken() {
  token = '';
  wx.removeStorageSync('yuqiuji_token');
}

// 获取当前 token
function getToken() {
  return token;
}

// 通用请求（callContainer 内网调用）
function request(method, path, data) {
  return new Promise(function (resolve, reject) {
    // 检查云能力是否可用
    if (!wx.cloud || !wx.cloud.callContainer) {
      console.error('[api] wx.cloud 不可用，请检查项目配置 cloud:true 及基础库版本');
      wx.showToast({ title: '云服务未初始化', icon: 'none' });
      reject(new Error('wx.cloud 不可用'));
      return;
    }

    var header = { 'Content-Type': 'application/json' };
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }
    header['X-WX-SERVICE'] = SERVICE_NAME;

    wx.cloud.callContainer({
      config: { env: CLOUD_ENV },
      path: path,
      method: method,
      header: header,
      data: method !== 'GET' ? data : undefined,
      success: function (res) {
        console.log('[api] ' + method + ' ' + path + ' →', res.statusCode);
        if (res.statusCode === 401) {
          clearToken();
          wx.showToast({ title: '登录已过期，请重新进入', icon: 'none' });
          reject(new Error('Unauthorized'));
          return;
        }
        if (res.data && res.data.code === 0) {
          resolve(res.data.data);
        } else {
          var msg = (res.data && res.data.msg) ? res.data.msg : '请求失败';
          console.error('[api] 业务错误:', msg, res.data);
          wx.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail: function (err) {
        console.error('[api] callContainer 失败:', JSON.stringify(err));
        var hint = '网络错误';
        if (err && err.errMsg) {
          // 常见错误映射
          if (err.errMsg.indexOf('not found') > -1) {
            hint = '服务未找到，检查服务名';
          } else if (err.errMsg.indexOf('env') > -1) {
            hint = '环境ID不正确';
          } else if (err.errMsg.indexOf('NOT_ALLOW') > -1 || err.errMsg.indexOf('unauthorized') > -1) {
            hint = '小程序未授权此云环境';
          }
        }
        wx.showToast({ title: hint, icon: 'none' });
        reject(err);
      }
    });
  });
}

// GET 请求
function get(path, params) {
  if (!params) params = {};
  const query = Object.keys(params)
    .filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
    .map(function (k) { return k + '=' + encodeURIComponent(params[k]); })
    .join('&');
  return request('GET', path + (query ? '?' + query : ''));
}

// POST 请求
function post(path, data) {
  return request('POST', path, data);
}

// PUT 请求
function put(path, data) {
  return request('PUT', path, data);
}

// DELETE 请求
function del(path) {
  return request('DELETE', path);
}

// === 业务 API ===

// 微信登录
async function login(wxProfile) {
  if (!wxProfile) wxProfile = {};
  var res = await wx.login();
  return request('POST', '/api/login', {
    code: res.code,
    nickName: wxProfile.nickName || '',
    avatarUrl: wxProfile.avatarUrl || ''
  });
}

// 用户
var userAPI = {
  getProfile: function () { return get('/api/user/profile'); },
  updateProfile: function (profile) { return put('/api/user/profile', profile); }
};

// 账单
var billAPI = {
  create: function (bill) { return post('/api/bills', bill); },
  update: function (id, bill) { return put('/api/bills/' + id, bill); },
  delete: function (id) { return del('/api/bills/' + id); },
  get: function (id) { return get('/api/bills/' + id); },
  list: function (params) { return get('/api/bills', params); }
};

// 活动
var activityAPI = {
  create: function (activity) { return post('/api/activities', activity); },
  get: function (id) { return get('/api/activities/' + id); },
  update: function (id, activity) { return put('/api/activities/' + id, activity); },
  delete: function (id) { return del('/api/activities/' + id); },
  list: function (params) { return get('/api/activities', params); }
};

// 统计
var statsAPI = {
  summary: function (period) { return get('/api/stats/summary', { period: period }); }
};

module.exports = {
  initToken: initToken,
  saveToken: saveToken,
  clearToken: clearToken,
  getToken: getToken,
  get: get,
  post: post,
  put: put,
  del: del,
  login: login,
  userAPI: userAPI,
  billAPI: billAPI,
  activityAPI: activityAPI,
  statsAPI: statsAPI
};
