import Notify from '@vant/weapp/notify/notify';
import { BILL_CATEGORIES } from '@utils/constants';

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    mode: {
      type: String,
      value: 'create' // 'create' 或 'edit'
    },
    editData: {
      type: Object,
      value: null
    }
  },

  data: {
    activeType: 'expense',
    selectedDate: new Date().getTime(),
    displayDate: '',
    showDatePicker: false,
    amount: '',
    remark: '',
    selectedCategory: '',
    categories: BILL_CATEGORIES,
    loading: false
  },

  lifetimes: {
    attached() {
      this.updateDisplayDate();
    }
  },

  observers: {
    'editData': function(editData) {
      if (editData && this.data.mode === 'edit') {
        this.setData({
          activeType: editData.type || 'expense',
          amount: editData.amount || '',
          remark: editData.remark || '',
          selectedCategory: editData.category || '',
          selectedDate: editData.createTime || new Date().getTime()
        });
        this.updateDisplayDate();
      }
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    },

    onTypeChange(event) {
      const { type } = event.currentTarget.dataset;
      this.setData({
        activeType: type
      });
    },

    onDateSelect() {
      this.setData({
        showDatePicker: true
      });
    },

    onDateConfirm(event) {
      const date = event.detail;
      this.setData({
        selectedDate: date,
        showDatePicker: false
      });
      this.updateDisplayDate();
    },

    onDateCancel() {
      this.setData({
        showDatePicker: false
      });
    },

    onAmountChange(event) {
      let value = event.detail;
      
      // 限制小数点后最多2位
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2);
        }
      }
      
      this.setData({
        amount: value
      });
    },

    onRemarkChange(event) {
      this.setData({
        remark: event.detail
      });
    },

    onCategorySelect(event) {
      const { category } = event.currentTarget.dataset;
      this.setData({
        selectedCategory: category
      });
    },

    onConfirm() {
      // 数据验证
      if (!this.data.amount) {
        Notify({ type: 'danger', message: '请输入金额' });
        return;
      }

      if (!this.data.selectedCategory) {
        Notify({ type: 'danger', message: '请选择分类' });
        return;
      }

      // 设置loading状态
      this.setData({ loading: true });

      // 根据模式调用不同的云函数
      const isEdit = this.data.mode === 'edit';
      const functionData = {
        name: 'bill',
        data: {
          type: isEdit ? 'updateBill' : 'createBill',
          billType: this.data.activeType,
          amount: parseFloat(this.data.amount),
          category: this.data.selectedCategory,
          remark: this.data.remark,
          createTime: this.data.selectedDate
        }
      };

      // 如果是编辑模式，添加billId
      if (isEdit && this.data.editData) {
        functionData.data.billId = this.data.editData.id;
      }

      wx.cloud.callFunction(functionData).then(res => {
        console.log(`${isEdit ? '编辑' : '创建'}账单成功:`, res);
        if (res.result.success) {
          Notify({ type: 'success', message: `账单${isEdit ? '编辑' : '创建'}成功` });
          // 触发成功事件，让父组件刷新列表
          this.triggerEvent(isEdit ? 'updated' : 'created');
          // 关闭弹窗
          this.triggerEvent('close');
          // 重置表单
          this.resetForm();
        } else {
          Notify({ type: 'danger', message: res.result.message || `${isEdit ? '编辑' : '创建'}失败` });
        }
      }).catch(err => {
        console.error(`${isEdit ? '编辑' : '创建'}账单失败:`, err);
        Notify({ type: 'danger', message: '网络错误，请重试' });
      }).finally(() => {
        // 无论成功失败都要关闭loading
        this.setData({ loading: false });
      });
    },

    resetForm() {
      this.setData({
        activeType: 'expense',
        amount: '',
        remark: '',
        selectedCategory: '',
        selectedDate: new Date().getTime(),
        loading: false
      });
      this.updateDisplayDate();
    },

    updateDisplayDate() {
      const date = new Date(this.data.selectedDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      this.setData({
        displayDate: `${month}月${day}号`
      });
    }
  }
});