const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 创建账单
 * @param {Object} event - 事件对象
 * @param {string} event.type - 账单类型 (expense/income/none)
 * @param {number} event.amount - 金额
 * @param {string} event.category - 分类
 * @param {string} event.remark - 备注
 * @param {number} event.date - 日期时间戳
 * @param {Object} context - 上下文对象
 * @returns {Object} 返回创建结果
 */
async function createBill(event, context) {
  try {
    const { billType, amount, category, remark, date } = event;
    
    // 参数验证
    if (!billType || !amount || !category) {
      return {
        status: 400,
        success: false,
        message: '缺少必要参数'
      };
    }

    // 获取用户openid
    const { OPENID } = cloud.getWXContext();
    
    // 创建账单数据
    const billData = {
      userId: OPENID,
      type: billType,       // 账单类型：expense/income/none
      amount: parseFloat(amount),
      category: category,
      remark: remark || '',
      date: new Date(date),
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    // 插入数据库
    const result = await db.collection('bills').add({
      data: billData
    });

    return {
      status: 200,
      success: true,
      message: '账单创建成功',
      data: {
        _id: result._id
      }
    };
  } catch (error) {
    console.error('创建账单失败:', error);
    return {
      status: 500,
      success: false,
      message: '账单创建失败'
    };
  }
}

/**
 * 获取账单列表
 * @param {Object} event - 事件对象
 * @param {number} event.page - 页码
 * @param {number} event.limit - 每页数量
 * @param {string} event.startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} event.endDate - 结束日期 (YYYY-MM-DD)
 * @param {Object} context - 上下文对象
 * @returns {Object} 返回账单列表
 */
async function getBillList(event, context) {
  try {
    const { page = 1, limit = 20, startDate, endDate } = event;
    
    // 获取数据库引用和操作符
    const db = cloud.database();
    const _ = db.command;
    
    // 获取用户openid
    const { OPENID } = cloud.getWXContext();
    
    // 构建查询条件
    let query = {
      userId: OPENID
    };
    
    // 添加日期范围过滤
    if (startDate && endDate) {
      // 将字符串日期转换为Date对象进行比较
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // 设置为当天结束时间
      
      query.createTime = _.gte(start).and(_.lte(end));
    }
    
    // 查询账单列表
    const result = await db.collection('bills')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();

    return {
      status: 200,
      success: true,
      message: '获取账单列表成功',
      data: result.data
    };
  } catch (error) {
    console.error('获取账单列表失败:', error);
    return {
      status: 500,
      success: false,
      message: '获取账单列表失败'
    };
  }
}

/**
 * 获取账单详情
 * @param {Object} event - 事件对象
 * @param {string} event.billId - 账单ID
 * @param {Object} context - 上下文对象
 * @returns {Object} 返回账单详情
 */
async function getBillById(event, context) {
  try {
    const { billId } = event;
    
    if (!billId) {
      return {
        status: 400,
        success: false,
        message: '缺少账单ID'
      };
    }

    // 获取用户openid
    const { OPENID } = cloud.getWXContext();
    
    // 查询账单详情
    const result = await db.collection('bills')
      .where({
        _id: billId,
        userId: OPENID
      })
      .get();

    if (result.data.length === 0) {
      return {
        status: 404,
        success: false,
        message: '账单不存在或无权限访问'
      };
    }

    return {
      status: 200,
      success: true,
      message: '获取账单详情成功',
      data: result.data[0]
    };
  } catch (error) {
    console.error('获取账单详情失败:', error);
    return {
      status: 500,
      success: false,
      message: '获取账单详情失败'
    };
  }
}

/**
 * 删除账单
 * @param {Object} event - 事件对象
 * @param {string} event.billId - 账单ID
 * @param {Object} context - 上下文对象
 * @returns {Object} 返回删除结果
 */
async function deleteBill(event, context) {
  try {
    const { billId } = event;
    
    if (!billId) {
      return {
        status: 400,
        success: false,
        message: '缺少账单ID'
      };
    }

    // 获取用户openid
    const { OPENID } = cloud.getWXContext();
    
    // 删除账单
    const result = await db.collection('bills')
      .where({
        _id: billId,
        userId: OPENID
      })
      .remove();

    if (result.stats.removed === 0) {
      return {
        status: 404,
        success: false,
        message: '账单不存在或无权限删除'
      };
    }

    return {
      status: 200,
      success: true,
      message: '账单删除成功'
    };
  } catch (error) {
    console.error('删除账单失败:', error);
    return {
      status: 500,
      success: false,
      message: '账单删除失败'
    };
  }
}

/**
 * 更新账单
 * @param {Object} event - 事件对象
 * @param {string} event.billId - 账单ID
 * @param {string} event.type - 账单类型 (expense/income/none)
 * @param {number} event.amount - 金额
 * @param {string} event.category - 分类
 * @param {string} event.remark - 备注
 * @param {number} event.date - 日期时间戳
 * @param {Object} context - 上下文对象
 * @returns {Object} 返回更新结果
 */
async function updateBill(event, context) {
  try {
    const { billId, type, amount, category, remark, date } = event;
    
    // 参数验证
    if (!billId || !type || !amount || !category) {
      return {
        status: 400,
        success: false,
        message: '缺少必要参数'
      };
    }

    // 获取用户openid
    const { OPENID } = cloud.getWXContext();
    
    // 构建更新数据
    const updateData = {
      type: type,
      amount: parseFloat(amount),
      category: category,
      remark: remark || '',
      date: new Date(date),
      updateTime: db.serverDate()
    };

    // 更新数据库
    const result = await db.collection('bills')
      .where({
        _id: billId,
        userId: OPENID
      })
      .update({
        data: updateData
      });

    if (result.stats.updated === 0) {
      return {
        status: 404,
        success: false,
        message: '账单不存在或无权限更新'
      };
    }

    return {
      status: 200,
      success: true,
      message: '账单更新成功'
    };
  } catch (error) {
    console.error('更新账单失败:', error);
    return {
      status: 500,
      success: false,
      message: '账单更新失败'
    };
  }
}

/**
 * 云函数入口函数
 * @param {Object} event - 事件对象
 * @param {string} event.type - 功能类型
 * @param {Object} context - 上下文对象
 * @returns {Object} 返回处理结果
 */
exports.main = async (event, context) => {
  switch (event.type) {
    case 'createBill':
      return await createBill(event, context);
    case 'getBillList':
      return await getBillList(event, context);
    case 'getBillById':
      return await getBillById(event, context);
    case 'deleteBill':
      return await deleteBill(event, context);
    case 'updateBill':
      return await updateBill(event, context);
    default:
      return {
        status: 400,
        success: false,
        message: '未知的操作类型'
      };
  }
};