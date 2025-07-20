import Notify from '@vant/weapp/notify/notify';
import { BILL_CATEGORIES } from '@utils/constants';

function getMonthDateRange(year, month) {
  // month: 1-12
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // 当月最后一天
  return {
    startDate: `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-01`,
    endDate: `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getDate().toString().padStart(2, '0')}`
  };
}

Page({
  data: {
    selectedDate: new Date().getTime(),
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    activeTab: 'expense',
    totalExpense: 0,
    totalIncome: 0,
    categoryStats: [],
    displayCategories: [],
    loading: false,
    showAllCategories: false,
    dailyStats: [],
    monthlyStats: [],
    expenseRanking: [],
    displayExpenseRanking: [],
    noData: false // 新增：无数据标记
  },

  /**
   * 页面加载时获取统计数据
   */
  onLoad() {
    this.loadStatistics();
  },

  /**
   * 页面显示时刷新统计数据
   */
  onShow() {
    this.loadStatistics();
  },

  /**
   * 监听月份变更
   */
  onDateChange(e) {
    const selectedDate = e.detail;
    const dateObj = new Date(selectedDate);
    this.setData({
      selectedDate,
      currentYear: dateObj.getFullYear(),
      currentMonth: dateObj.getMonth() + 1
    });
    this.loadStatistics();
  },

  /**
   * 监听支出/入账 tab 切换
   */
  onTabChange(e) {
    this.setData({ activeTab: e.detail });
  },

  /**
   * 切换分类列表展开/收起
   */
  toggleCategoryList() {
    this.setData({ showAllCategories: !this.data.showAllCategories });
    this.getDisplayCategories && this.getDisplayCategories();
  },

  /**
   * 查看全部排行
   */
  onViewAllRanking() {
    // 跳转到全部排行页面或弹窗
  },

  /**
   * 加载统计数据
   */
  loadStatistics() {
    this.setData({ loading: true });
    const { currentYear, currentMonth } = this.data;
    const { startDate, endDate } = getMonthDateRange(currentYear, currentMonth);
    wx.cloud.callFunction({
      name: 'bill',
      data: {
        type: 'getBillList',
        page: 1,
        limit: 1000,
        startDate,
        endDate
      }
    })
      .then(res => {
        if (res.result.success) {
          this.calculateStatistics(res.result.data);
        } else {
          Notify({ type: 'danger', message: res.result.message || '获取数据失败' });
        }
      })
      .catch(() => {
        Notify({ type: 'danger', message: '网络错误，请重试' });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 计算统计数据（只基于当前年月范围）
   */
  calculateStatistics(billList) {
    if (!billList || billList.length === 0) {
      this.setData({
        totalExpense: 0,
        totalIncome: 0,
        categoryStats: [],
        displayCategories: [],
        dailyStats: [],
        monthlyStats: [],
        expenseRanking: [],
        displayExpenseRanking: [],
        noData: true // 新增：无数据
      });
      return;
    }

    let totalExpense = 0;
    let totalIncome = 0;
    const categoryMap = {};

    billList.forEach(bill => {
      if (bill.type === 'expense') {
        totalExpense += bill.amount;
        if (!categoryMap[bill.category]) {
          categoryMap[bill.category] = {
            category: bill.category,
            amount: 0,
            count: 0
          };
        }
        categoryMap[bill.category].amount += bill.amount;
        categoryMap[bill.category].count += 1;
      } else if (bill.type === 'income') {
        totalIncome += bill.amount;
      }
    });

    const categoryStats = Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .map(item => ({
        ...item,
        categoryName: this.getCategoryName(item.category),
        categoryIcon: this.getCategoryIcon(item.category),
        percentage: totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(2) : 0
      }));

    this.setData({
      totalExpense: totalExpense.toFixed(2),
      totalIncome: totalIncome.toFixed(2),
      categoryStats,
      displayCategories:
        this.data.showAllCategories || categoryStats.length <= 5
          ? categoryStats
          : categoryStats.slice(0, 5)
    }, () => {
      setTimeout(() => {}, 500);
    });

    this.calculateDailyStats(billList);
    this.calculateMonthlyStats(billList);
    this.calculateExpenseRanking(billList);
    this.setData({ noData: false }); // 有数据时
  },

  /**
   * 计算每日统计数据
   */
  calculateDailyStats(billList) {
    if (!billList || billList.length === 0) {
      this.setData({ dailyStats: [] });
      return { dates: [], amounts: [] };
    }

    // 获取最近15天的数据
    const today = new Date();
    const dailyMap = {};

    // 初始化最近15天
    for (let i = 14; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = this.formatDate(date);
      dailyMap[dateKey] = {
        date: dateKey,
        displayDate: `${date.getMonth() + 1}.${date.getDate()}`,
        amount: 0
      };
    }

    // 统计每日支出
    billList.forEach(bill => {
      if (bill.type === 'expense') {
        const billDate = new Date(bill.createTime);
        const dateKey = this.formatDate(billDate);
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].amount += bill.amount;
        }
      }
    });

    // 转换为数组并排序
    const dailyStats = Object.values(dailyMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    this.setData({ dailyStats });

    return {
      dates: dailyStats.map(item => item.displayDate),
      amounts: dailyStats.map(item => item.amount)
    };
  },

  /**
   * 计算月度统计数据
   */
  calculateMonthlyStats(billList) {
    if (!billList || billList.length === 0) {
      this.setData({ monthlyStats: [] });
      return { months: [], amounts: [] };
    }

    const monthlyMap = {};
    const today = new Date();

    // 初始化最近6个月
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      monthlyMap[monthKey] = {
        month: monthKey,
        displayMonth: `${date.getMonth() + 1}月`,
        amount: 0
      };
    }

    // 统计月度支出
    billList.forEach(bill => {
      if (bill.type === 'expense') {
        const billDate = new Date(bill.createTime);
        const monthKey = `${billDate.getFullYear()}-${(billDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].amount += bill.amount;
        }
      }
    });

    // 转换为数组并排序
    const monthlyStats = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    this.setData({ monthlyStats });

    return {
      months: monthlyStats.map(item => item.displayMonth),
      amounts: monthlyStats.map(item => item.amount)
    };
  },

  /**
   * 计算支出排行数据 - 按具体账单排名
   */
  calculateExpenseRanking(filteredBills) {
    if (!filteredBills || filteredBills.length === 0) {
      this.setData({
        expenseRanking: [],
        displayExpenseRanking: []
      });
      return;
    }

    // 获取当月所有支出账单并按金额排序
    const expenseBills = filteredBills
      .filter(bill => bill.type === 'expense')
      .map(bill => ({
        id: bill._id || bill.id,
        categoryName: this.getCategoryName(bill.category),
        categoryIcon: this.getCategoryIcon(bill.category),
        amount: bill.amount.toFixed(2),
        description: bill.remark || this.getCategoryName(bill.category),
        date: this.formatDateDisplay(new Date(bill.createTime)),
        category: bill.category
      }))
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    // 限制显示前10个
    const displayExpenseRanking = expenseBills.slice(0, 10);

    this.setData({
      expenseRanking: expenseBills,
      displayExpenseRanking
    });
  },

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化日期显示
   */
  formatDateDisplay(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;
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

  /**
   * 获取显示的分类数据
   */
  getDisplayCategories() {
    const { categoryStats, showAllCategories } = this.data;
    if (showAllCategories || categoryStats.length <= 5) {
      return categoryStats;
    }
    return categoryStats.slice(0, 5);
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '记账本',
      path: '/pages/index/index',
      imageUrl: ''
    };
  }
});