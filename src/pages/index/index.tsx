import { View, Text } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { loadInterviewHistory } from '@/data/interview-history'
import {
  defaultInterviewQuestion,
  loadInterviewQuestionBank,
  loadInterviewQuestionCategories,
  saveSelectedInterviewQuestion,
  type InterviewQuestion,
} from '@/data/interview-questions'
import { Play, Shuffle } from 'lucide-react-taro'
import './index.css'

const rollingDuration = 2200

const getRandomQuestion = (questions: InterviewQuestion[], excludeId?: number) => {
  if (questions.length === 0) {
    return defaultInterviewQuestion
  }

  if (questions.length <= 1 || excludeId === undefined) {
    return questions[Math.floor(Math.random() * questions.length)]
  }

  const availableQuestions = questions.filter((question) => question.id !== excludeId)
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
}

const IndexPage = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(() => loadInterviewQuestionBank())
  const [categories, setCategories] = useState<string[]>(() => loadInterviewQuestionCategories())
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(() => loadInterviewQuestionBank()[0] ?? defaultInterviewQuestion)
  const [rollingQuestion, setRollingQuestion] = useState<InterviewQuestion | null>(null)
  const [historyCount, setHistoryCount] = useState(0)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const practiceStats = [
    { value: String(questions.length), label: '题目总数' },
    { value: String(categories.length), label: '题目分类' },
    { value: String(historyCount), label: '练习记录' },
  ]

  const clearSelectionTimers = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }

    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }

  const refreshQuestionData = () => {
    const latestQuestions = loadInterviewQuestionBank()
    const latestCategories = loadInterviewQuestionCategories()

    setQuestions(latestQuestions)
    setCategories(latestCategories)
    setSelectedQuestion((previousQuestion) =>
      latestQuestions.find((question) => question.id === previousQuestion.id) ?? latestQuestions[0] ?? defaultInterviewQuestion,
    )
  }

  useEffect(() => () => clearSelectionTimers(), [])

  useDidShow(() => {
    setHistoryCount(loadInterviewHistory().length)
    refreshQuestionData()
  })

  const handleSelectQuestion = () => {
    if (isSelecting || questions.length === 0) {
      return
    }

    clearSelectionTimers()
    setIsSelecting(true)

    const finalQuestion = getRandomQuestion(questions, selectedQuestion.id)

    setRollingQuestion(getRandomQuestion(questions, selectedQuestion.id))

    previewTimerRef.current = setInterval(() => {
      setRollingQuestion((previousQuestion) => getRandomQuestion(questions, previousQuestion?.id))
    }, 140)

    settleTimerRef.current = setTimeout(() => {
      clearSelectionTimers()
      setRollingQuestion(null)
      setSelectedQuestion(finalQuestion)
      setIsSelecting(false)
    }, rollingDuration)
  }

  const handleStartAnswer = () => {
    saveSelectedInterviewQuestion(selectedQuestion)
    Taro.navigateTo({
      url: '/pages/interview/index',
    })
  }

  const handleOpenQuestionBank = () => {
    Taro.navigateTo({
      url: '/pages/question-bank/index',
    })
  }

  const handleOpenHistory = () => {
    Taro.navigateTo({
      url: '/pages/history/index',
    })
  }

  const activeQuestion = rollingQuestion ?? selectedQuestion

  return (
    <View className="training-page min-h-full bg-background">
      <View className="training-page__backdrop training-page__backdrop--one" />
      <View className="training-page__backdrop training-page__backdrop--two" />

      <View className="relative px-4 py-6 pb-10">
        <View className="mb-6">
          <View className="training-kicker mb-3">
            <Text className="text-xs font-semibold text-primary">PRODUCT INTERVIEW LAB</Text>
          </View>
          <Text className="mb-3 block text-3xl font-bold text-on-surface">产品面试训练</Text>
          <Text className="block text-sm leading-relaxed text-on-surface-variant">
            面向产品岗位求职者的实战训练工具，提供高频题目抽取、限时作答与练习沉淀，帮助你更高效地准备产品岗位面试。
          </Text>
        </View>

        <View className="mb-6 grid grid-cols-3 gap-3">
          {practiceStats.map((stat) => (
            <View key={stat.label} className="training-stat">
              <Text className="mb-1 block text-2xl font-bold text-on-surface">{stat.value}</Text>
              <Text className="block text-xs text-on-surface-variant">{stat.label}</Text>
            </View>
          ))}
        </View>

        <Card className="training-card training-card--hero mb-6 overflow-hidden">
          <CardContent className="p-0">
            <View className="training-card__shine" />
            <View className="p-5">
              <View className="mb-3">
                <Text className="mb-2 block text-xl font-semibold text-on-surface">来一道热身题</Text>
                <Text className="block text-sm leading-relaxed text-on-surface-variant">
                  每天来一题，练表达、练逻辑、练临场感。把面试准备变成一次次可积累的成长挑战。
                </Text>
              </View>

              <View className="training-question-card mb-4">
                <View className="mb-3 flex items-center justify-between gap-3">
                  <View className="flex flex-wrap gap-2">
                    <Badge
                      variant="default"
                      className={`training-category-badge text-primary ${isSelecting ? 'animate-pulse' : ''}`}
                    >
                      {activeQuestion.category}
                    </Badge>
                    <Badge variant="default" className="bg-surface-container-highest text-on-surface-variant">
                      {activeQuestion.difficulty}
                    </Badge>
                    <Badge variant="default" className="bg-surface-container-highest text-on-surface-variant">
                      {activeQuestion.source}
                    </Badge>
                  </View>
                </View>

                <Text className="mb-2 block text-lg font-semibold leading-relaxed text-on-surface">
                  {activeQuestion.title}
                </Text>
                <Text className="block text-sm leading-relaxed text-on-surface-variant">
                  {activeQuestion.description}
                </Text>
              </View>

              <View className="flex gap-3">
                <Button className="flex-1 bg-primary py-4 text-on-primary" onClick={handleStartAnswer}>
                  <View className="flex items-center justify-center gap-2">
                    <Play size={18} color="#ffffff" />
                    <Text className="text-base font-semibold">开始限时作答</Text>
                  </View>
                </Button>

                <Button
                  variant="default"
                  className="training-secondary-button flex-1 py-4"
                  disabled={isSelecting}
                  onClick={handleSelectQuestion}
                >
                  <View className="flex items-center justify-center gap-2">
                    <Shuffle size={18} color="#8B7662" />
                    <Text className="text-base font-semibold">
                      {isSelecting ? '选题中...' : '重新选题'}
                    </Text>
                  </View>
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        <View className="flex flex-col gap-4">
          <Card className="training-card training-card--soft">
            <CardContent className="p-5">
              <Text className="mb-2 block text-lg font-semibold text-on-surface">查看题库</Text>
              <Text className="mb-4 block text-sm leading-relaxed text-on-surface-variant">
                按分类浏览题目，挑一题开始练习。先从熟悉的话题热身，再逐步挑战更高难度的问题。
              </Text>
              <Button variant="default" className="training-feature-button w-full py-4" onClick={handleOpenQuestionBank}>
                <Text className="text-base font-semibold text-on-surface">进入题库</Text>
              </Button>
            </CardContent>
          </Card>

          <Card className="training-card training-card--soft">
            <CardContent className="p-5">
              <Text className="mb-2 block text-lg font-semibold text-on-surface">历史记录</Text>
              <Text className="mb-4 block text-sm leading-relaxed text-on-surface-variant">
                回看已经练过的题目、作答时长和转写内容，帮助你持续复盘表达方式和答题结构。
              </Text>
              <Button variant="default" className="training-feature-button w-full py-4" onClick={handleOpenHistory}>
                <Text className="text-base font-semibold text-on-surface">查看记录</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}

export default IndexPage
