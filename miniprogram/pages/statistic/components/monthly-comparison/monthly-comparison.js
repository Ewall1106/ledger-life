const echarts = require('@components/ec-canvas/echarts');

const BAR_COLORS = ['#a8ddb3', '#7bc88a', '#62b37a', '#4fa768', '#62b37a', '#9dd3a8'];

Component({
  properties: {
    ec: Object,
    monthlyStats: Array
  },
  data: {
    chart: null
  },
  observers: {
    'monthlyStats': function(newVal) {
      if (this.chart && newVal && newVal.length > 0) {
        this.updateMonthlyChart();
      }
    }
  },
  lifetimes: {
    attached() {
      this.setData({
        ec: {
          onInit: this.initMonthlyChart.bind(this)
        }
      });
    }
  },
  methods: {
    initMonthlyChart(canvas, width, height, dpr) {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr || 1
      });
      canvas.setChart(chart);
      this.chart = chart;
      this.updateMonthlyChart();
      return chart;
    },
    updateMonthlyChart() {
      const monthlyStats = this.data.monthlyStats || [];
      if (!this.chart || monthlyStats.length === 0) return;
      const option = {
        backgroundColor: 'transparent',
        grid: { left: '8%', right: '8%', top: '15%', bottom: '20%' },
        xAxis: {
          type: 'category',
          data: monthlyStats.map(item => item.displayMonth),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { fontSize: 12, color: '#666' }
        },
        yAxis: { type: 'value', show: false },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: 8,
          textStyle: { fontSize: 12, color: '#fff' },
          formatter: function(params) {
            const data = params[0];
            return `${data.name}\n¥${data.value.toFixed(2)}`;
          }
        },
        series: [{
          type: 'bar',
          data: monthlyStats.map(item => item.amount),
          itemStyle: {
            color: function(params) {
              return BAR_COLORS[params.dataIndex % BAR_COLORS.length];
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '50%'
        }]
      };
      try {
        this.chart.setOption(option);
      } catch (error) {}
    }
  }
}); 