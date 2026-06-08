import Taro from '@tarojs/taro'

export type InterviewQuestion = {
  id: number
  category: string
  difficulty: string
  source: string
  title: string
  description: string
}

export const INTERVIEW_QUESTION_STORAGE_KEY = 'interview:selected-question'
export const CUSTOM_INTERVIEW_QUESTION_STORAGE_KEY = 'interview:custom-questions'

export const questionBank: InterviewQuestion[] = [
  {
    id: 1,
    category: '产品增长',
    difficulty: '中等',
    source: '互联网大厂',
    title: '如何为一个新功能设计用户增长方案？',
    description: '假设你负责一个刚上线的新功能，当前渗透率很低。请从目标用户、触达路径、激励设计和效果评估四个方面，说明你会如何提升使用率。',
  },
  {
    id: 2,
    category: '数据分析',
    difficulty: '中等',
    source: '腾讯',
    title: '留存率连续两周下降，你会怎么拆解问题？',
    description: '请从指标口径、用户分层、行为路径和版本变更四个角度排查，并说明你会优先验证哪些假设。',
  },
  {
    id: 3,
    category: '产品设计',
    difficulty: '困难',
    source: '阿里巴巴',
    title: '为老年用户设计一个更友好的支付流程',
    description: '结合认知负担、风险提示、步骤简化和异常兜底，给出一版你认为更稳妥的流程设计。',
  },
  {
    id: 4,
    category: '用户研究',
    difficulty: '简单',
    source: '美团',
    title: '你会如何组织一场验证新功能方向的用户访谈？',
    description: '请说明访谈目标、样本选择、问题提纲以及如何把定性结论沉淀成产品决策输入。',
  },
  {
    id: 5,
    category: '商业化',
    difficulty: '中等',
    source: '字节跳动',
    title: '一个内容产品该如何平衡广告收入和用户体验？',
    description: '请从广告位策略、频控逻辑、内容体验和关键指标监控四个方面阐述你的方案。',
  },
  {
    id: 6,
    category: '策略思考',
    difficulty: '困难',
    source: '小红书',
    title: '面对竞品快速增长，你会如何制定产品应对策略？',
    description: '请结合用户价值、差异化定位、资源取舍和执行节奏，给出一份三个月内可落地的应对框架。',
  },
  {
    id: 7,
    category: '产品增长',
    difficulty: '简单',
    source: 'B端产品',
    title: '如何提升新用户首次完成核心动作的比例？',
    description: '请围绕新手引导、任务拆解、激励设计和触达节奏四个方面，给出一套提升新用户激活率的方案。',
  },
  {
    id: 8,
    category: '数据分析',
    difficulty: '困难',
    source: '京东',
    title: '转化漏斗某一环节突然下滑，你会如何定位原因？',
    description: '请从数据口径、流量结构、页面改动、渠道质量和异常监控五个角度说明你的排查路径。',
  },
  {
    id: 9,
    category: '产品设计',
    difficulty: '中等',
    source: '滴滴',
    title: '设计一个让用户更安心的订单取消流程',
    description: '请结合用户预期、信息透明、责任判定和补偿机制，设计一个兼顾体验与规则的取消流程。',
  },
  {
    id: 10,
    category: '用户研究',
    difficulty: '中等',
    source: '携程',
    title: '新功能上线前，怎样快速验证用户是否真的需要它？',
    description: '请说明你会如何选择研究方法、定义目标人群、设计验证问题，并将研究结论转成需求优先级。',
  },
  {
    id: 11,
    category: '商业化',
    difficulty: '困难',
    source: '知乎',
    title: '会员权益增长放缓时，你会如何重构商业化策略？',
    description: '请从权益结构、用户分层、付费场景和转化链路四个方面，提出一套更可持续的增长方案。',
  },
  {
    id: 12,
    category: '策略思考',
    difficulty: '中等',
    source: '拼多多',
    title: '当核心指标增长见顶时，你会如何寻找第二增长曲线？',
    description: '请结合用户需求外延、供给拓展、商业模式和组织协同，说明你会如何判断并推进新的增长方向。',
  },
]

export const defaultInterviewQuestion = questionBank[0]
export const questionCategories = Array.from(new Set(questionBank.map((question) => question.category)))

const isInterviewQuestion = (value: unknown): value is InterviewQuestion => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'number'
    && typeof candidate.category === 'string'
    && typeof candidate.difficulty === 'string'
    && typeof candidate.source === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.description === 'string'
}

const isInterviewQuestionList = (value: unknown): value is InterviewQuestion[] =>
  Array.isArray(value) && value.every(isInterviewQuestion)

export const saveSelectedInterviewQuestion = (question: InterviewQuestion) => {
  Taro.setStorageSync(INTERVIEW_QUESTION_STORAGE_KEY, question)
}

export const loadSelectedInterviewQuestion = (): InterviewQuestion => {
  try {
    const question = Taro.getStorageSync(INTERVIEW_QUESTION_STORAGE_KEY)
    return isInterviewQuestion(question) ? question : defaultInterviewQuestion
  } catch {
    return defaultInterviewQuestion
  }
}

export const loadCustomInterviewQuestions = (): InterviewQuestion[] => {
  try {
    const questions = Taro.getStorageSync(CUSTOM_INTERVIEW_QUESTION_STORAGE_KEY)
    return isInterviewQuestionList(questions) ? questions : []
  } catch {
    return []
  }
}

export const saveCustomInterviewQuestions = (questions: InterviewQuestion[]) => {
  Taro.setStorageSync(
    CUSTOM_INTERVIEW_QUESTION_STORAGE_KEY,
    questions.filter(isInterviewQuestion),
  )
}

export const appendCustomInterviewQuestions = (questions: InterviewQuestion[]) => {
  const existingQuestions = loadCustomInterviewQuestions()
  saveCustomInterviewQuestions([...questions.filter(isInterviewQuestion), ...existingQuestions])
}

export const loadInterviewQuestionBank = (): InterviewQuestion[] => [
  ...loadCustomInterviewQuestions(),
  ...questionBank,
]

export const loadInterviewQuestionCategories = (): string[] =>
  Array.from(new Set(loadInterviewQuestionBank().map((question) => question.category)))

export const getNextInterviewQuestionId = (questions: InterviewQuestion[] = loadInterviewQuestionBank()) =>
  questions.reduce((maxId, question) => Math.max(maxId, question.id), 0) + 1
