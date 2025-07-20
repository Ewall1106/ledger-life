Component({
  properties: {
    currentMonth: Number,
    expenseRanking: Array,
    displayExpenseRanking: Array
  },
  methods: {
    onViewAllRanking() {
      this.triggerEvent('viewallranking');
    }
  }
}); 