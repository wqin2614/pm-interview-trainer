export default typeof definePageConfig === 'function'
  ? definePageConfig({
    navigationStyle: 'custom',
    navigationBarTitleText: '查看题库',
  })
  : {
    navigationStyle: 'custom',
    navigationBarTitleText: '查看题库',
  }
