// 引入微信云开发 SDK
const cloud = require('wx-server-sdk');

// 初始化云开发环境，使用当前云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 获取 openid、appid、unionid
 * @returns {Object} - 包含 openid、appid、unionid 的对象
 */
const getOpenId = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID
  };
};

/**
 * 获取小程序二维码，并上传到云存储，返回 fileID
 * @returns {string} - 云存储中二维码图片的 fileID
 */
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: 'pages/index/index'
  });
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: 'code.png',
    fileContent: resp?.buffer
  });
  return upload.fileID;
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
    case 'getOpenId':
      return await getOpenId();
    case 'getMiniProgramCode':
      return await getMiniProgramCode();
  }
};
