Component({
  properties: {
    currentMonth: String,
    totalExpense: String,
    totalIncome: String,
    selectedDate: Number // 由主页面传入当前选中的时间戳
  },
  data: {
    showMonthPicker: false
  },
  methods: {
    onMonthSelectorTap() {
      this.setData({ showMonthPicker: true });
    },
    onMonthPickerCancel() {
      this.setData({ showMonthPicker: false });
    },
    onMonthPickerConfirm(e) {
      this.setData({ showMonthPicker: false });
      this.triggerEvent('monthchange', e.detail); // 向主页面抛出新选中的时间戳
    }
  }
}); 