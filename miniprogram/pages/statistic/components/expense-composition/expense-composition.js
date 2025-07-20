const echarts = require('../../../../components/ec-canvas/echarts');

Component({
  properties: {
    categoryStats: Array,
    displayCategories: Array,
    showAllCategories: Boolean
  },
  data: {
    ec: {
      onInit: null
    }
  },
  observers: {
    'categoryStats': function(newVal) {
      if (newVal && newVal.length > 0) {
        this.updatePieChart();
      }
    }
  },
  lifetimes: {
    attached() {
      this.setData({
        ec: {
          onInit: this.initPieChart.bind(this)
        }
      });
    }
  },
  methods: {
    onToggleCategoryList() {
      this.triggerEvent('togglecategorylist');
    },
    getPieColors() {
      return [
        '#62b37a', '#7bc88a', '#95d5a3', '#b0e2bb', '#4fa768', '#6cc485', '#88d09f', '#a4dcb8'
      ];
    },
    initPieChart(canvas, width, height, dpr) {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr || 1
      });
      canvas.setChart(chart);
      this.chart = chart;
      this.updatePieChart();
      return chart;
    },
    updatePieChart() {
      if (!this.chart || !this.data.categoryStats || this.data.categoryStats.length === 0) return;
      const pieData = this.data.categoryStats.map((item, index) => ({
        value: parseFloat(item.amount),
        name: item.categoryName,
        itemStyle: {
          color: this.getPieColors()[index % this.getPieColors().length]
        }
      }));
      const option = {
        backgroundColor: 'transparent',
        series: [{
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '50%'],
          data: pieData,
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            fontSize: 10,
            color: '#333'
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 8
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      try {
        this.chart.setOption(option);
      } catch (e) {
        // ignore
      }
    }
  }
}); 