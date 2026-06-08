import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  clearInterviewHistory,
  loadInterviewHistory,
  type InterviewHistoryRecord,
} from '@/data/interview-history'
import { saveSelectedInterviewQuestion } from '@/data/interview-questions'
import { ArrowLeft, Copy, History, Play, RefreshCw } from 'lucide-react-taro'
import './index.css'

const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const formatElapsed = (elapsedSeconds: number) => {
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${minutes}分 ${seconds.toString().padStart(2, '0')}秒`
}

const HistoryPage = () => {
  const [historyRecords, setHistoryRecords] = useState<InterviewHistoryRecord[]>([])

  useDidShow(() => {
    setHistoryRecords(loadInterviewHistory())
  })

  const handleBack = () => {
    Taro.reLaunch({
      url: '/pages/index/index',
    })
  }

  const handleRetry = (record: InterviewHistoryRecord) => {
    saveSelectedInterviewQuestion(record.question)
    Taro.navigateTo({
      url: '/pages/interview/index',
    })
  }

  const handleCopy = (record: InterviewHistoryRecord) => {
    if (!record.transcript) {
      Taro.showToast({
        title: '这条记录还没有转写内容',
        icon: 'none',
      })
      return
    }

    Taro.setClipboardData({
      data: record.transcript,
    })
  }

  const handleClear = async () => {
    if (historyRecords.length === 0) {
      return
    }

    const result = await Taro.showModal({
      title: '清空记录',
      content: '确认清空所有练习记录吗？此操作不可恢复。',
    })

    if (!result.confirm) {
      return
    }

    clearInterviewHistory()
    setHistoryRecords([])
    Taro.showToast({
      title: '已清空记录',
      icon: 'none',
    })
  }

  return (
    <View className="history-page-shell min-h-full bg-background">
      <View className="history-page-backdrop history-page-backdrop--one" />
      <View className="history-page-backdrop history-page-backdrop--two" />

      <View className="relative px-4 py-4 pb-10">
        <View className="sticky top-0 z-30 mb-4 flex items-center justify-between rounded-full bg-white bg-opacity-70 px-2 py-2 backdrop-blur">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleBack}>
            <ArrowLeft size={20} color="#8B7662" />
          </Button>
          <Text className="text-base font-semibold text-on-surface">历史记录</Text>
          <Button
            variant="ghost"
            className="h-10 rounded-full px-3 text-sm text-on-surface-variant"
            disabled={historyRecords.length === 0}
            onClick={handleClear}
          >
            清空
          </Button>
        </View>

        <Card className="history-page-panel mb-4 overflow-hidden">
          <CardContent className="p-5">
            <View className="mb-4 flex items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="mb-2 block text-2xl font-semibold text-on-surface">练习沉淀</Text>
                <Text className="block text-sm leading-relaxed text-on-surface-variant">
                  这里会保留最近的练习记录，方便你回看题目、转写内容和作答时长，持续复盘表达方式和回答结构。
                </Text>
              </View>

              <View className="rounded-2xl border border-primary border-opacity-10 bg-white bg-opacity-75 px-4 py-3 text-center">
                <Text className="block text-2xl font-bold text-on-surface">{historyRecords.length}</Text>
                <Text className="block text-xs text-on-surface-variant">累计记录</Text>
              </View>
            </View>

            <View className="rounded-2xl border border-primary border-opacity-8 bg-white bg-opacity-65 px-4 py-3">
              <Text className="block text-xs font-medium uppercase tracking-wide text-primary text-opacity-80">
                Practice Notes
              </Text>
              <Text className="mt-2 block text-sm leading-relaxed text-on-surface-variant">
                每次完成面试作答后，系统会自动保存本次题目、用时和转写摘要，帮助你形成连续复盘。
              </Text>
            </View>
          </CardContent>
        </Card>

        {historyRecords.length === 0 ? (
          <Card className="history-page-panel history-page-panel--soft overflow-hidden">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <View className="history-page-empty-icon mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <History size={28} color="#C96F3D" />
              </View>
              <Text className="mb-2 block text-lg font-semibold text-on-surface">还没有练习记录</Text>
              <Text className="mb-5 block text-sm leading-relaxed text-on-surface-variant">
                去首页抽一题，完成一次限时作答后，记录就会自动出现在这里。
              </Text>
              <Button className="bg-primary px-6 py-3 text-on-primary" onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}>
                <View className="flex items-center justify-center gap-2">
                  <Play size={18} color="#ffffff" />
                  <Text className="text-sm font-semibold">去练一题</Text>
                </View>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <View className="flex flex-col gap-4">
            {historyRecords.map((record) => (
              <Card key={record.id} className="history-page-record-card overflow-hidden">
                <CardContent className="p-0">
                  <View className="border-b border-outline-variant border-opacity-20 px-4 pb-3 pt-4">
                    <Text className="mb-3 block text-lg font-semibold leading-relaxed text-on-surface">
                      {record.question.title}
                    </Text>

                    <View className="flex flex-wrap gap-2">
                      <Badge variant="default" className="border-transparent bg-primary bg-opacity-10 text-primary">
                        {record.question.category}
                      </Badge>
                      <Badge variant="default" className="border-transparent bg-surface-container-highest text-on-surface-variant">
                        {formatDateTime(record.createdAt)}
                      </Badge>
                      <Badge variant="default" className="border-transparent bg-surface-container-highest text-on-surface-variant">
                        作答 {formatElapsed(record.elapsedSeconds)}
                      </Badge>
                    </View>
                  </View>

                  <View className="p-4">
                    <Text className="mb-2 block text-xs font-medium text-on-surface-variant">转写摘要</Text>

                    <View className="history-page-transcript mb-4 p-4">
                      <Text className="block text-sm leading-relaxed text-on-surface-variant">
                        {record.transcript || '这次作答没有保存到转写内容，可以直接重新练习这道题。'}
                      </Text>
                    </View>

                    <View className="flex gap-3">
                      <Button
                        variant="default"
                        className="history-page-secondary-button flex-1 py-4"
                        onClick={() => handleCopy(record)}
                      >
                        <View className="flex items-center justify-center gap-2">
                          <Copy size={18} color="#8B7662" />
                          <Text className="text-sm font-semibold">复制转写</Text>
                        </View>
                      </Button>

                      <Button className="flex-1 bg-primary py-4 text-on-primary" onClick={() => handleRetry(record)}>
                        <View className="flex items-center justify-center gap-2">
                          <RefreshCw size={18} color="#ffffff" />
                          <Text className="text-sm font-semibold">再练这题</Text>
                        </View>
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default HistoryPage
