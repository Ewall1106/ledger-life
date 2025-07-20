Component({
  properties: {
    currentYear: Number,
    currentMonth: Number,
    activeTab: String,
    totalExpense: Number,
    selectedDate: Number
  },
  data: {
    showDatePicker: false
  },
  methods: {
    onDateSelect() {
      this.setData({ showDatePicker: true });
    },
    onDateCancel() {
      this.setData({ showDatePicker: false });
    },
    onDateConfirm(e) {
      this.setData({ showDatePicker: false });
      this.triggerEvent('datechange', e.detail);
    },
    onTabChange(e) {
      const tab = e.currentTarget.dataset.tab;
      this.triggerEvent('tabchange', tab);
    }
  }
}); 