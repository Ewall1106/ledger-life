// 引入微信云开发 SDK
const cloud = require('wx-server-sdk');

// 初始化云开发环境，使用当前云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库引用
const db = cloud.database(); // 补充：获取数据库实例

/**
 * 创建用户
 * @param {Object} event - 事件参数，包含 name 和 avatar
 * @param {Object} context - 云函数上下文
 * @returns {Object} - 返回操作结果
 */
const createUser = async (event, context) => {
  const { name = '', avatar = '' } = event;
  try {
    await db.collection('user').add({
      data: {
        name,
        avatar,
        extendInfo: '{}', // 预留扩展信息字段
        createTime: db.serverDate(), // 创建时间
        updateTime: db.serverDate()  // 更新时间
      }
    });

    return {
      status: 200,
      success: true,
      message: '请求成功'
    };
  } catch (e) {
    return { status: 500, success: false };
  }
};

/**
 * 根据用户ID获取用户信息
 * @param {Object} event - 事件参数，包含 userId
 * @param {Object} context - 云函数上下文
 * @returns {Object} - 返回用户信息
 */
const getUserInfoById = async (event, context) => {
  const { userId } = event;
  try {
    const res = await db
      .collection('user')
      .where({
        _id: userId
      })
      .get();

    return {
      status: 200,
      success: true,
      message: '请求成功',
      data: res.data
    };
  } catch (e) {
    return { status: 500, success: false };
  }
};

/**
 * 更新用户信息（目前仅支持更新头像）
 * @param {Object} event - 事件参数，包含 userId 和 avatar
 * @param {Object} context - 云函数上下文
 * @returns {Object} - 返回操作结果
 */
const updateUserInfo = async (event, context) => {
  const { userId, avatar } = event; // 补充 avatar 字段

  if (!userId) {
    return {
      status: 500,
      success: false,
      message: '入参有误 - userId不能为空'
    };
  }

  try {
    await db
      .collection('user')
      .where({
        _id: userId
      })
      .update({
        data: {
          avatar,
          updateTime: db.serverDate()
        }
      });

    return {
      status: 200,
      success: true,
      message: '更新成功'
    };
  } catch (e) {
    return {
      status: 500,
      success: false
    };
  }
};

/**
 * 云函数主入口
 * 根据 event.type 分发到不同的处理函数
 * @param {Object} event - 事件参数，需包含 type 字段
 * @param {Object} context - 云函数上下文
 * @returns {Object} - 返回对应操作的结果
 */
exports.main = async (event, context) => {
  switch (event.type) {
    case 'createUser':
      return await createUser(event, context); 
    case 'getUserInfoById':
      return await getUserInfoById(event, context);
    case 'updateUserInfo':
      return await updateUserInfo(event, context);
  }
};
