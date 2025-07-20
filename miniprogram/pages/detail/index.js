import Toast from '@vant/weapp/toast/toast';
import { BILL_CATEGORIES } from '@utils/constants';


Page({
  data: {
    userInfo: {},
    billDetail: null,
    loading: true,
    billId: null,
    showEditDialog: false,
    editData: null
  },
  extraData: {},

  // --------- Lifecycle START --------- //
  // https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page-life-cycle.html
  onLoad(options) {
    const billId = options.id;
    if (billId) {
      this.setData({ billId });
      this.loadBillDetail(billId);
    } else {
      Toast.fail('参数错误');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {},

  onReady() {},

  onHide() {},

  onUnload() {},
  // ---------- Lifecycle END ---------- //

  // ------- DOM Function START -------- //
  // https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html


  loadBillDetail(billId) {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'bill',
      data: {
        type: 'getBillById',
        billId: billId
      }
    }).then(res => {
      console.log('获取账单详情成功:', res);
      if (res.result.success) {
        const billData = res.result.data;
        const formattedDetail = this.formatBillDetail(billData);
        this.setData({ 
          billDetail: formattedDetail,
          loading: false 
        });
      } else {
        Toast.fail(res.result.message || '获取账单详情失败');
        this.setData({ loading: false });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      console.error('获取账单详情失败:', err);
      Toast.fail('网络错误，请重试');
      this.setData({ loading: false });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    });
  },

  formatBillDetail(billData) {
    console.log('原始账单数据:', billData);
    
    const category = BILL_CATEGORIES.find(item => item.id === billData.category);
    
    // 使用createTime作为记录时间
    let recordTime;
    if (billData.createTime) {
      recordTime = new Date(billData.createTime);
    } else {
      recordTime = new Date();
    }
    
    // 检查日期是否有效
    if (isNaN(recordTime.getTime())) {
      console.error('无效的日期:', billData.createTime);
      recordTime = new Date(); // 使用当前时间作为fallback
    }
    
    const formattedDetail = {
      categoryIcon: category ? category.icon : 'shopping-cart-o',
      categoryName: category ? category.name : (billData.category || '其他'),
      categoryId: billData.category, // 保存原始分类ID供编辑使用
      type: billData.type || 'expense',
      amount: (billData.amount || 0).toFixed(2),
      dateTime: this.formatDateTime(recordTime),
      originalDate: billData.createTime, // 保存原始日期供编辑使用
      source: '自动同步',
      remark: billData.remark || '无备注'
    };
    
    console.log('格式化后的详情:', formattedDetail);
    return formattedDetail;
  },

  formatDateTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  },

  onBack() {
    wx.navigateBack();
  },
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条账单记录吗？',
      confirmText: '删除',
      confirmColor: '#f56c6c',
      success: (res) => {
        if (res.confirm) {
          this.deleteBill();
        }
      }
    });
  },
  
  deleteBill() {
    wx.cloud.callFunction({
      name: 'bill',
      data: {
        type: 'deleteBill',
        billId: this.data.billId
      }
    }).then(res => {
      console.log('删除账单成功:', res);
      if (res.result.success) {
        Toast.success('删除成功');
        setTimeout(() => {
          // 通知首页刷新数据
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2]; // 获取上一页
          if (prevPage) {
            // 调用上一页的刷新方法
            prevPage.loadBillList && prevPage.loadBillList();
          }
          wx.navigateBack();
        }, 1000);
      } else {
        Toast.fail(res.result.message || '删除失败');
      }
    }).catch(err => {
      console.error('删除账单失败:', err);
      Toast.fail('网络错误，请重试');
    });
  },
  
  onEdit() {
    if (!this.data.billDetail) {
      Toast.fail('账单信息不完整');
      return;
    }

    // 准备编辑数据
    const editData = {
      id: this.data.billId,
      type: this.data.billDetail.type,
      amount: this.data.billDetail.amount,
      category: this.data.billDetail.categoryId || '',
      remark: this.data.billDetail.remark,
      date: this.data.billDetail.originalDate || new Date().getTime()
    };

    this.setData({
      editData: editData,
      showEditDialog: true
    });
  },

  onEditClose() {
    this.setData({
      showEditDialog: false,
      editData: null
    });
  },

  onEditUpdated() {
    // 编辑成功后重新加载详情
    this.loadBillDetail(this.data.billId);
    
    // 通知上一页刷新数据
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      prevPage.loadBillList && prevPage.loadBillList();
    }
  },

  // -------- DOM Function END --------- //

  // ------- Page Function START ------- //
  initData() {},

  onPageScroll() {},

  onPullDownRefresh() {},

  onShareAppMessage() {
    return {
      title: '竹竹AI',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
  // -------- Page Function END -------- //
});
