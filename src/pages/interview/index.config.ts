export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '模拟面试' })
  : { navigationBarTitleText: '模拟面试' }
