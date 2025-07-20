import Notify from '@vant/weapp/notify/notify';
import { BILL_CATEGORIES } from '@utils/constants';

Page({
  data: {
    activeTab: 0,
    showAddRecord: false,
    transactions: [],
    loading: false,
    currentMonth: '',
    totalExpense: 0,
    totalIncome: 0,
    selectedDate: new Date().getTime(),
    minDate: new Date(2020, 0, 1).getTime(),
    maxDate: new Date().getTime()
  },

  onLoad() {
    this.setCurrentMonth();
    this.loadBillList();
  },

  /**
   * 设置当前月份显示
   */
  setCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.setData({
      currentMonth: `${year}年${month}月`
    });
  },

  /**
   * 加载账单列表
   */
  loadBillList() {
    this.setData({ loading: true });
    
    const selectedDate = new Date(this.data.selectedDate);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    
    // 获取当月的第一天和最后一天
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    wx.cloud.callFunction({
      name: 'bill',
      data: {
        type: 'getBillList',
        page: 1,
        limit: 50,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      }
    }).then(res => {
      console.log('获取账单列表成功:', res);
      if (res.result.success) {
        const formattedData = this.formatBillData(res.result.data);
        const { totalExpense, totalIncome } = this.calculateMonthlySummary(res.result.data);
        this.setData({
          transactions: formattedData,
          totalExpense: totalExpense.toFixed(2),
          totalIncome: totalIncome.toFixed(2),
          loading: false
        });
      } else {
        Notify({ type: 'danger', message: res.result.message || '获取数据失败' });
        this.setData({ loading: false });
      }
    }).catch(err => {
      console.error('获取账单列表失败:', err);
      Notify({ type: 'danger', message: '网络错误，请重试' });
      this.setData({ loading: false });
    });
  },

  /**
   * 计算月度汇总
   */
  calculateMonthlySummary(billList) {
    let totalExpense = 0;
    let totalIncome = 0;
    
    if (!billList || billList.length === 0) {
      return { totalExpense: 0, totalIncome: 0 };
    }
    
    billList.forEach(bill => {
      if (bill.type === 'expense') {
        totalExpense += bill.amount;
      } else if (bill.type === 'income') {
        totalIncome += bill.amount;
      }
    });
    
    return { totalExpense, totalIncome };
  },

  /**
   * 格式化账单数据
   */
  formatBillData(billList) {
    if (!billList || billList.length === 0) {
      return [];
    }

    // 按日期分组
    const groupedData = {};
    
    billList.forEach(bill => {
      const date = new Date(bill.createTime);
      const dateKey = this.formatDate(date);
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          dateKey: dateKey, // 添加唯一的dateKey作为key
          date: this.formatDateDisplay(date),
          dateLabel: this.getDateLabel(date),
          dailyExpense: 0,
          dailyIncome: 0,
          items: []
        };
      }

      // 计算每日收支
      if (bill.type === 'expense') {
        groupedData[dateKey].dailyExpense += bill.amount;
      } else if (bill.type === 'income') {
        groupedData[dateKey].dailyIncome += bill.amount;
      }

      // 添加交易项
      groupedData[dateKey].items.push({
        time: this.formatTime(new Date(bill.createTime)),
        category: this.getCategoryName(bill.category),
        description: bill.remark || '无备注',
        amount: bill.type === 'expense' ? -bill.amount.toFixed(2) : bill.amount.toFixed(2),
        icon: this.getCategoryIcon(bill.category),
        billId: bill._id
      });
    });

    // 转换为数组并按日期排序
    const result = Object.keys(groupedData)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(key => groupedData[key]);

    console.log(result);

    return result;
  },

  /**
   * 格式化日期用于分组
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  },

  /**
   * 格式化日期显示
   */
  formatDateDisplay(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  /**
   * 获取日期标签
   */
  getDateLabel(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = this.formatDate(date);
    const todayStr = this.formatDate(today);
    const yesterdayStr = this.formatDate(yesterday);
    
    if (dateStr === todayStr) {
      return '今天';
    } else if (dateStr === yesterdayStr) {
      return '昨天';
    } else {
      return date.getFullYear() + '年';
    }
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  /**
   * 获取分类名称
   */
  getCategoryName(categoryId) {
    const category = BILL_CATEGORIES.find(item => item.id === categoryId);
    return category ? category.name : categoryId;
  },

  /**
   * 获取分类图标
   */
  getCategoryIcon(categoryId) {
    const category = BILL_CATEGORIES.find(item => item.id === categoryId);
    return category ? category.icon : 'shopping-cart-o';
  },

  onTabChange(event) {
    this.setData({
      activeTab: event.detail.index
    });
  },

  onTransactionTap(event) {
    const { transaction } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/index?id=${transaction.billId}`
    });
  },

  onAddTransaction() {
    this.setData({
      showAddRecord: true
    });
  },

  onAddRecordClose() {
    this.setData({
      showAddRecord: false
    });
  },

  /**
   * 新建账单成功后刷新列表
   */
  onAddRecordCreated() {
    this.loadBillList();
  },

  /**
   * 监听 summary-header 组件的月份变更事件
   */
  onMonthChange(e) {
    const selectedDate = e.detail;
    const dateObj = new Date(selectedDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    this.setData({
      selectedDate,
      currentMonth: `${year}年${month}月`
    });
    this.loadBillList();
  },

  onShareAppMessage() {
    return {
      title: '记账本',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});
