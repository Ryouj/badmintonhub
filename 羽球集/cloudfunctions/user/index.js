// cloudfunctions/user/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'getProfile':
      return await getProfile(OPENID);
    case 'updateProfile':
      return await updateProfile(OPENID, event.profile);
    default:
      return { code: -1, msg: '未知操作' };
  }
};

// 获取用户档案
async function getProfile(openid) {
  try {
    const res = await db.collection('users').where({ _openid: openid }).get();
    if (res.data.length > 0) {
      return { code: 0, data: res.data[0] };
    }
    // 无档案时返回空对象
    return { code: 0, data: {} };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}

// 更新用户档案
async function updateProfile(openid, profile) {
  try {
    const exist = await db.collection('users').where({ _openid: openid }).get();

    if (exist.data.length > 0) {
      await db.collection('users').doc(exist.data[0]._id).update({
        data: {
          ...profile,
          updateTime: db.serverDate()
        }
      });
    } else {
      await db.collection('users').add({
        data: {
          _openid: openid,
          ...profile,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
    }
    return { code: 0 };
  } catch (err) {
    return { code: -1, msg: err.message };
  }
}
