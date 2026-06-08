export default typeof definePageConfig === 'function'
  ? definePageConfig({
    navigationStyle: 'custom',
    navigationBarTitleText: '历史记录',
  })
  : {
    navigationStyle: 'custom',
    navigationBarTitleText: '历史记录',
  }
