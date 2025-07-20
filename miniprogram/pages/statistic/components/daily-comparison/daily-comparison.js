const echarts = require('@components/ec-canvas/echarts');

const BAR_COLORS = ['#a8ddb3', '#7bc88a', '#62b37a', '#4fa768', '#62b37a', '#9dd3a8'];

Component({
  properties: {
    ec: Object,
    dailyStats: Array
  },
  data: {
    chart: null
  },
  observers: {
    'dailyStats': function(newVal) {
      if (this.chart && newVal && newVal.length > 0) {
        this.updateDailyChart();
      }
    }
  },
  lifetimes: {
    attached() {
      this.setData({
        ec: {
          onInit: this.initDailyChart.bind(this)
        }
      });
    }
  },
  methods: {
    initDailyChart(canvas, width, height, dpr) {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr || 1
      });
      canvas.setChart(chart);
      this.chart = chart;
      this.updateDailyChart();
      return chart;
    },
    updateDailyChart() {
      const dailyStats = this.data.dailyStats || [];
      if (!this.chart || dailyStats.length === 0) return;
      const option = {
        backgroundColor: 'transparent',
        grid: { left: '15%', right: '8%', top: '15%', bottom: '20%' },
        xAxis: {
          type: 'category',
          data: dailyStats.map(item => item.displayDate),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { fontSize: 10, color: '#666' }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            fontSize: 10,
            color: '#999',
            formatter: function(value) {
              if (value === 0) return '¥0';
              if (value >= 10000) return '¥' + (value / 10000).toFixed(1) + '万';
              if (value >= 1000) return '¥' + (value / 1000).toFixed(1) + 'k';
              if (value >= 100) return '¥' + value.toFixed(0);
              return '¥' + value.toFixed(1);
            }
          },
          splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
          min: 0,
          minInterval: 1,
          splitNumber: 4
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: 8,
          textStyle: { fontSize: 12, color: '#fff' },
          formatter: function(params) {
            const data = params[0];
            const date = dailyStats[data.dataIndex].date;
            const monthDay = date.split('-').slice(1).join('月') + '日';
            return `${monthDay}共支出\n¥${data.value.toFixed(2)}`;
          }
        },
        series: [{
          type: 'bar',
          data: dailyStats.map(item => item.amount),
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