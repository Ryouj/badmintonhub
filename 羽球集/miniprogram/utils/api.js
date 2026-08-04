// utils/api.js - HTTP API 客户端（替代云函数调用）
const BASE_URL = 'https://your-cloud-run-domain.com/api'; // 替换为云托管域名

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

// 通用请求
function request(method, path, data = {}) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' };
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }

    wx.request({
      url: BASE_URL + path,
      method,
      header,
      data: method !== 'GET' ? data : undefined,
      dataType: 'json',
      success(res) {
        if (res.statusCode === 401) {
          clearToken();
          wx.showToast({ title: '登录已过期，请重新进入', icon: 'none' });
          reject(new Error('Unauthorized'));
          return;
        }
        if (res.data && res.data.code === 0) {
          resolve(res.data.data);
        } else {
          reject(new Error(res.data?.msg || '请求失败'));
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误', icon: 'none' });
        reject(err);
      }
    });
  });
}

// GET 请求
function get(path, params = {}) {
  const query = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map(k => k + '=' + encodeURIComponent(params[k]))
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
async function login() {
  const res = await wx.login();
  return request('POST', '/api/login', { code: res.code });
}

// 用户
const userAPI = {
  getProfile: () => get('/api/user/profile'),
  updateProfile: (profile) => put('/api/user/profile', profile)
};

// 账单
const billAPI = {
  create: (bill) => post('/api/bills', bill),
  update: (id, bill) => put('/api/bills/' + id, bill),
  delete: (id) => del('/api/bills/' + id),
  get: (id) => get('/api/bills/' + id),
  list: (params) => get('/api/bills', params)
};

// 活动
const activityAPI = {
  create: (activity) => post('/api/activities', activity),
  list: (params) => get('/api/activities', params)
};

// 统计
const statsAPI = {
  summary: (period) => get('/api/stats/summary', { period })
};

module.exports = {
  initToken,
  saveToken,
  clearToken,
  getToken,
  get,
  post,
  put,
  del,
  login,
  userAPI,
  billAPI,
  activityAPI,
  statsAPI,
  BASE_URL
};
