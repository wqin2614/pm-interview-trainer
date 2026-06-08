import { View, Text } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { saveInterviewHistoryRecord } from '@/data/interview-history'
import { loadSelectedInterviewQuestion, type InterviewQuestion } from '@/data/interview-questions'
import {
  ArrowLeft,
  Mic,
  Play,
  Pause,
  Square,
  Check,
  Activity,
  FileText,
  Lightbulb,
  Copy,
  RefreshCw,
  History
} from 'lucide-react-taro'
import './index.css'

type RecognitionPhase = 'preparation' | 'interview' | 'report'

type BrowserRecognitionResultAlternative = {
  transcript: string
}

type BrowserRecognitionResult = {
  0: BrowserRecognitionResultAlternative
  isFinal?: boolean
  length: number
}

type BrowserRecognitionEvent = {
  results: ArrayLike<BrowserRecognitionResult>
}

type BrowserRecognitionErrorEvent = {
  error?: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: BrowserRecognitionErrorEvent) => void) | null
  onresult: ((event: BrowserRecognitionEvent) => void) | null
  onstart: (() => void) | null
  abort: () => void
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

type TranscribeResponse = {
  data?: {
    text?: string
  }
  message?: string
  status?: string
}

const scoreBreakdown = [
  { label: '表达流畅度', value: 82 },
  { label: '内容完整度', value: 75 },
  { label: '语言规范性', value: 76 }
]

const paceMetrics = [
  { label: '平均语速', value: '156', unit: '字/分' },
  { label: '实际用时', value: '4:32', unit: '分钟' },
  { label: '总字数', value: '698', unit: '字' }
]

const fillerWords = [
  ['然后', '12'],
  ['就是', '8'],
  ['其实', '6']
] as const

const improvementTips = [
  '开头先定义问题和目标，能更快建立你的结构感。',
  '方案题建议补一句“如何验证效果”，回答会更像真实面试场景。',
  '结尾用一两句话总结优先级和落地节奏，整体会更完整。'
]

const preparationChecklist = [
  '先用 30 秒明确题目目标、场景和回答边界。',
  '把答案组织成“判断问题 - 拆解路径 - 给出方案 - 说明验证”四步。',
  '确认时长后，准备好就直接开始作答，系统会同步计时和记录。'
]

const WEAPP_RECORD_SEGMENT_MS = 59000
const H5_RECORDER_SLICE_MS = 4000
const currentEnv = String(Taro.getEnv()).toLowerCase()
const isWeapp = currentEnv === String(Taro.ENV_TYPE.WEAPP).toLowerCase()
const isH5 = currentEnv === 'h5'

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim()

const InterviewPage = () => {
  const [phase, setPhase] = useState<RecognitionPhase>('preparation')
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [remainingTime, setRemainingTime] = useState(5 * 60)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [question, setQuestion] = useState<InterviewQuestion>(() => loadSelectedInterviewQuestion())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const weappRecorderRef = useRef<Taro.RecorderManager | null>(null)
  const weappRecorderReadyRef = useRef(false)
  const weappUploadQueueRef = useRef(Promise.resolve())
  const h5RecognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const h5RecorderRef = useRef<MediaRecorder | null>(null)
  const h5RecorderStreamRef = useRef<MediaStream | null>(null)
  const h5UploadQueueRef = useRef(Promise.resolve())
  const h5RestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const weappRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldContinueRecognitionRef = useRef(false)
  const finalTranscriptRef = useRef('')
  const liveTranscriptRef = useRef('')
  const phaseRef = useRef<RecognitionPhase>('preparation')
  const isRecordingRef = useRef(false)
  const hasSavedReportRef = useRef(false)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    if (phase !== 'report' || hasSavedReportRef.current) {
      return
    }

    const elapsedSeconds = Math.max(0, selectedDuration * 60 - remainingTime)
    saveInterviewHistoryRecord({
      question,
      transcript,
      durationMinutes: selectedDuration,
      elapsedSeconds,
    })
    hasSavedReportRef.current = true
  }, [phase, question, remainingTime, selectedDuration, transcript])

  const syncTranscript = () => {
    const merged = [finalTranscriptRef.current, liveTranscriptRef.current]
      .map(normalizeText)
      .filter(Boolean)
      .join(' ')
    setTranscript(merged)
  }

  const resetTranscript = () => {
    finalTranscriptRef.current = ''
    liveTranscriptRef.current = ''
    setTranscript('')
  }

  const appendFinalTranscript = (value: string) => {
    const normalized = normalizeText(value)
    const current = normalizeText(finalTranscriptRef.current)

    if (!normalized) {
      liveTranscriptRef.current = ''
      syncTranscript()
      return
    }

    if (!current) {
      finalTranscriptRef.current = normalized
    } else if (!current.endsWith(normalized)) {
      finalTranscriptRef.current = `${current} ${normalized}`
    }

    liveTranscriptRef.current = ''
    syncTranscript()
  }

  const replaceLiveTranscript = (value: string) => {
    liveTranscriptRef.current = normalizeText(value)
    syncTranscript()
  }

  const clearRecognitionRestartTimers = () => {
    if (h5RestartTimerRef.current) {
      clearTimeout(h5RestartTimerRef.current)
      h5RestartTimerRef.current = null
    }

    if (weappRestartTimerRef.current) {
      clearTimeout(weappRestartTimerRef.current)
      weappRestartTimerRef.current = null
    }
  }

  const stopH5Recognition = () => {
    const recognition = h5RecognitionRef.current
    if (!recognition) {
      return
    }

    try {
      recognition.stop()
      recognition.abort()
    } catch {
      // Ignore stop errors from already-finished speech sessions.
    }
  }

  const stopH5Recorder = () => {
    if (h5RecorderRef.current) {
      try {
        if (h5RecorderRef.current.state !== 'inactive') {
          h5RecorderRef.current.stop()
        }
      } catch {
        // Ignore stop errors from already-finished recorder sessions.
      }

      h5RecorderRef.current = null
    }

    if (h5RecorderStreamRef.current) {
      h5RecorderStreamRef.current.getTracks().forEach(track => track.stop())
      h5RecorderStreamRef.current = null
    }
  }

  const stopWeappRecognition = () => {
    const manager = weappRecorderRef.current
    if (!manager) {
      return
    }

    try {
      manager.stop()
    } catch {
      // Ignore stop errors from already-finished speech sessions.
    }
  }

  const stopRecognition = () => {
    shouldContinueRecognitionRef.current = false
    clearRecognitionRestartTimers()
    stopH5Recognition()
    stopH5Recorder()
    stopWeappRecognition()
  }

  const clearInterviewTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(
    () => () => {
      clearInterviewTimers()
      stopRecognition()
    },
    []
  )

  useDidShow(() => {
    setQuestion(loadSelectedInterviewQuestion())
  })

  const progressPercentage =
    phase === 'interview'
      ? ((selectedDuration * 60 - remainingTime) / (selectedDuration * 60)) * 100
      : 0
  const elapsedDegrees = Math.max(0, Math.min(360, progressPercentage * 3.6))
  const timerRingStyle = {
    background: `conic-gradient(from 0deg, rgb(255 255 255 / 96%) 0deg ${elapsedDegrees}deg, rgb(185 114 73) ${elapsedDegrees}deg 360deg)`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const buildApiUrl = (url: string) => {
    if (PROJECT_DOMAIN && PROJECT_DOMAIN.length > 0) {
      return `${PROJECT_DOMAIN}${url}`
    }

    return url
  }

  const getTranscribeErrorMessage = (message?: string) => {
    if (message?.includes('OPENAI_API_KEY')) {
      return '服务端未配置 OPENAI_API_KEY'
    }

    return '录音转写失败，请稍后重试'
  }

  const appendTranscribedText = (payload?: TranscribeResponse) => {
    if (payload?.data?.text) {
      appendFinalTranscript(payload.data.text)
    }
  }

  const getSpeechRecognitionConstructor = (): BrowserSpeechRecognitionConstructor | null => {
    if (!isH5) {
      return null
    }

    const browserWindow = globalThis as typeof globalThis & {
      SpeechRecognition?: BrowserSpeechRecognitionConstructor
      webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
    }

    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null
  }

  const scheduleH5RecognitionRestart = () => {
    clearRecognitionRestartTimers()
    h5RestartTimerRef.current = setTimeout(() => {
      if (!shouldContinueRecognitionRef.current || phaseRef.current !== 'interview' || !isRecordingRef.current) {
        return
      }

      void startH5Recognition()
    }, 240)
  }

  const setupH5RecognitionInstance = () => {
    if (h5RecognitionRef.current) {
      return h5RecognitionRef.current
    }

    const RecognitionConstructor = getSpeechRecognitionConstructor()
    if (!RecognitionConstructor) {
      return null
    }

    const recognition = new RecognitionConstructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.onresult = event => {
      const sessionTranscript = Array.from(event.results)
        .map(result => normalizeText(result[0]?.transcript || ''))
        .filter(Boolean)
        .join(' ')

      replaceLiveTranscript(sessionTranscript)
    }
    recognition.onend = () => {
      appendFinalTranscript(liveTranscriptRef.current)

      if (shouldContinueRecognitionRef.current && phaseRef.current === 'interview' && isRecordingRef.current) {
        scheduleH5RecognitionRestart()
      }
    }
    recognition.onerror = event => {
      const error = event?.error || 'unknown'

      if (error === 'aborted' || error === 'no-speech') {
        return
      }

      shouldContinueRecognitionRef.current = false
      setIsRecording(false)
      Taro.showToast({
        title: '语音识别暂时不可用',
        icon: 'none'
      })
    }

    h5RecognitionRef.current = recognition
    return recognition
  }

  const startH5Recognition = async () => {
    const recognition = setupH5RecognitionInstance()
    if (!recognition) {
      return false
    }

    shouldContinueRecognitionRef.current = true

    try {
      recognition.start()
      return true
    } catch {
      // Some browsers throw if recognition is already active; treat it as started.
      return true
    }
  }

  const uploadWeappAudioFile = async (tempFilePath: string) => {
    const response = await Network.uploadFile({
      url: '/api/interview/transcribe',
      filePath: tempFilePath,
      name: 'file'
    })

    const payload = typeof response.data === 'string'
      ? JSON.parse(response.data) as TranscribeResponse
      : response.data as TranscribeResponse

    if (response.statusCode !== 200) {
      throw new Error(payload?.message || 'transcribe_failed')
    }

    appendTranscribedText(payload)
  }

  const attachWeappRecorderHandlers = (manager: Taro.RecorderManager) => {
    manager.onStop(result => {
      replaceLiveTranscript('')

      if (PROJECT_DOMAIN && result?.tempFilePath) {
        weappUploadQueueRef.current = weappUploadQueueRef.current
          .then(async () => {
            await uploadWeappAudioFile(result.tempFilePath)
          })
          .catch((error: Error) => {
            Taro.showToast({
              title: getTranscribeErrorMessage(error?.message),
              icon: 'none'
            })
          })
      }

      if (shouldContinueRecognitionRef.current && phaseRef.current === 'interview' && isRecordingRef.current) {
        weappRestartTimerRef.current = setTimeout(() => {
          void startWeappRecognition()
        }, 240)
      }
    })

    manager.onError(() => {
      shouldContinueRecognitionRef.current = false
      setIsRecording(false)
      Taro.showToast({
        title: '小程序录音启动失败',
        icon: 'none'
      })
    })
  }

  const getWeappRecorderManager = () => {
    if (!isWeapp) {
      return null
    }

    if (weappRecorderRef.current) {
      return weappRecorderRef.current
    }

    const manager = Taro.getRecorderManager()
    if (!weappRecorderReadyRef.current) {
      attachWeappRecorderHandlers(manager)
      weappRecorderReadyRef.current = true
    }

    weappRecorderRef.current = manager
    return manager
  }

  const startWeappRecognition = async () => {
    try {
      await Taro.authorize({ scope: 'scope.record' })
    } catch {
      shouldContinueRecognitionRef.current = false
      await Taro.showModal({
        title: '需要录音权限',
        content: '请先允许录音权限，再开始答题。',
        showCancel: false
      })
      return false
    }

    const manager = getWeappRecorderManager()
    if (!manager) {
      Taro.showToast({
        title: '当前环境不支持录音',
        icon: 'none'
      })
      return false
    }

    shouldContinueRecognitionRef.current = true
    replaceLiveTranscript(PROJECT_DOMAIN ? '正在整理本段语音...' : '')

    try {
      manager.start({
        duration: WEAPP_RECORD_SEGMENT_MS,
        format: 'mp3'
      })
      if (!PROJECT_DOMAIN) {
        Taro.showToast({
          title: '当前小程序端未配置转写服务域名',
          icon: 'none'
        })
      }
      return true
    } catch {
      Taro.showToast({
        title: '录音启动失败',
        icon: 'none'
      })
      return false
    }
  }

  const transcribeH5AudioChunk = async (audioChunk: Blob) => {
    const formData = new FormData()
    formData.append('file', audioChunk, `interview-segment-${Date.now()}.webm`)

    const response = await fetch(buildApiUrl('/api/interview/transcribe'), {
      method: 'POST',
      body: formData
    })

    const payload = (await response.json()) as TranscribeResponse

    if (!response.ok) {
      throw new Error(payload?.message || 'transcribe_failed')
    }

    appendTranscribedText(payload)
  }

  const startH5RecorderRecognition = async () => {
    if (!isH5 || typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      Taro.showToast({
        title: '当前环境不支持录音转写',
        icon: 'none'
      })
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      h5RecorderStreamRef.current = stream
      h5RecorderRef.current = recorder
      shouldContinueRecognitionRef.current = true

      recorder.ondataavailable = event => {
        if (!event.data || event.data.size === 0) {
          return
        }

        h5UploadQueueRef.current = h5UploadQueueRef.current
          .then(async () => {
            if (!shouldContinueRecognitionRef.current) {
              return
            }

            await transcribeH5AudioChunk(event.data)
          })
          .catch((error: Error) => {
            shouldContinueRecognitionRef.current = false
            setIsRecording(false)
            Taro.showToast({
              title: getTranscribeErrorMessage(error?.message),
              icon: 'none'
            })
          })
      }

      recorder.onstop = () => {
        if (h5RecorderStreamRef.current) {
          h5RecorderStreamRef.current.getTracks().forEach(track => track.stop())
          h5RecorderStreamRef.current = null
        }
      }

      recorder.start(H5_RECORDER_SLICE_MS)
      return true
    } catch {
      Taro.showToast({
        title: '麦克风权限未开启',
        icon: 'none'
      })
      return false
    }
  }

  const startRecognition = async () => {
    if (isWeapp) {
      return startWeappRecognition()
    }

    const startedH5Speech = await startH5Recognition()
    if (startedH5Speech) {
      return true
    }

    return startH5RecorderRecognition()
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRemainingTime(previousTime => {
        if (previousTime <= 1) {
          clearInterviewTimers()
          stopRecognition()
          setIsRecording(false)
          setPhase('report')
          return 0
        }

        return previousTime - 1
      })
    }, 1000)
  }

  const startInterview = async () => {
    clearInterviewTimers()
    stopRecognition()
    resetTranscript()
    hasSavedReportRef.current = false

    const started = await startRecognition()
    if (!started) {
      return
    }

    setPhase('interview')
    setRemainingTime(selectedDuration * 60)
    setIsRecording(true)
    startTimer()
  }

  const resumeInterview = async () => {
    clearInterviewTimers()

    const resumed = await startRecognition()
    if (!resumed) {
      return
    }

    setIsRecording(true)
    startTimer()
  }

  const pauseInterview = () => {
    clearInterviewTimers()
    stopRecognition()
    setIsRecording(false)
  }

  const stopInterview = () => {
    clearInterviewTimers()
    stopRecognition()
    setIsRecording(false)
    setPhase('report')
  }

  const restartInterview = () => {
    clearInterviewTimers()
    stopRecognition()
    resetTranscript()
    hasSavedReportRef.current = false
    setPhase('preparation')
    setRemainingTime(selectedDuration * 60)
    setIsRecording(false)
    setQuestion(loadSelectedInterviewQuestion())
  }

  const copyTranscript = () => {
    if (!transcript) {
      Taro.showToast({
        title: '当前还没有可复制的内容',
        icon: 'none'
      })
      return
    }

    Taro.setClipboardData({
      data: transcript
    })
  }

  const goBack = () => {
    clearInterviewTimers()
    stopRecognition()
    const pageStack = Taro.getCurrentPages()

    if (pageStack.length > 1) {
      Taro.navigateBack()
      return
    }

    Taro.reLaunch({
      url: '/pages/index/index'
    })
  }

  const openHistoryPage = () => {
    Taro.navigateTo({
      url: '/pages/history/index',
    })
  }

  return (
    <View className="w-full min-h-full bg-background">
      <View className="sticky top-0 z-40 bg-background h-16 pt-2 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10"
          onClick={goBack}
        >
          <ArrowLeft size={20} color="#8B7662" />
        </Button>
        <Text className="text-base font-semibold text-on-surface">
          {phase === 'preparation' ? '准备面试' : phase === 'interview' ? '面试中' : '面试报告'}
        </Text>
        <View className="w-10 h-10" />
      </View>

      {phase === 'preparation' && (
        <View className="px-4 py-6 pb-8">
          <View className="mb-6">
            <Text className="block text-base font-semibold text-on-surface mb-3">选择面试时长</Text>
            <View className="flex gap-3">
              {[3, 5, 10].map(duration => (
                <Button
                  key={duration}
                  variant="default"
                  className={`flex-1 py-4 ${
                    selectedDuration === duration
                      ? 'bg-primary bg-opacity-10 text-primary border-2 border-primary'
                      : 'bg-surface-container text-on-surface-variant border-2 border-outline-variant border-opacity-20'
                  }`}
                  onClick={() => setSelectedDuration(duration)}
                >
                  <Text className="text-sm font-medium">{duration} 分钟</Text>
                </Button>
              ))}
            </View>
          </View>

          <Card className="bg-surface-container-lowest mb-6 overflow-hidden">
            <CardContent className="p-0">
              <View className="px-4 pt-4 pb-3 border-b border-outline-variant border-opacity-20 bg-white bg-opacity-35">
                <View className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-primary border-opacity-15 bg-white bg-opacity-85 mb-3">
                  <FileText size={16} color="#C96F3D" />
                  <Text className="text-xs font-semibold text-primary">本次抽取题目</Text>
                </View>
                <Text className="block text-lg font-semibold text-on-surface leading-relaxed">
                  {question.title}
                </Text>
              </View>

              <View className="p-4">
                <Text className="block text-xs font-medium text-on-surface-variant mb-2">题目说明</Text>
                <View className="rounded-2xl bg-surface-container bg-opacity-70 p-4 mb-4">
                  <Text className="block text-sm text-on-surface-variant leading-relaxed">
                    {question.description}
                  </Text>
                </View>

                <View className="flex flex-wrap gap-2">
                  <Badge variant="default" className="interview-category-badge text-primary border-transparent">
                    {question.category}
                  </Badge>
                  <Badge variant="default" className="bg-surface-container-highest text-on-surface-variant border-transparent">
                    {question.difficulty}
                  </Badge>
                  <Badge variant="default" className="bg-surface-container-highest text-on-surface-variant border-transparent">
                    {question.source}
                  </Badge>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-surface-container mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">个人准备</Text>
              </View>
              <View className="flex flex-col gap-3">
                {preparationChecklist.map(item => (
                  <View key={item} className="flex items-center gap-3">
                    <View className="w-3 h-3 rounded-full bg-primary bg-opacity-12 flex-shrink-0" />
                    <Text className="flex-1 text-sm text-on-surface-variant leading-relaxed">{item}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-primary text-on-primary py-4"
            onClick={startInterview}
          >
            <View className="flex items-center justify-center gap-2">
              <Play size={20} color="#ffffff" />
              <Text className="text-base font-semibold">准备好，开始作答</Text>
            </View>
          </Button>
        </View>
      )}

      {phase === 'interview' && (
        <View className="px-4 py-6 pb-8">
          <View className="flex justify-center mb-6">
            <View className="relative">
              <View className="w-48 h-48 flex items-center justify-center">
                <View className="interview-timer-ring" style={timerRingStyle}>
                  <View className="interview-timer-ring__inner">
                    <View className="flex flex-col items-center justify-center">
                      <View className="flex items-center justify-center gap-2 mb-2 min-w-24">
                        <View className={`w-3 h-3 rounded-full ${isRecording ? 'bg-error animate-pulse' : 'opacity-0'}`} />
                        <Text className="text-xs text-on-surface-variant text-center">
                          {isRecording ? '录音中' : '已暂停'}
                        </Text>
                        <View className="w-3 h-3 opacity-0" />
                      </View>
                      <Text className="text-3xl font-bold text-on-surface">{formatTime(remainingTime)}</Text>
                      <Text className="text-xs text-on-surface-variant mt-1">剩余时间</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Card className="bg-surface-container-lowest mb-6 overflow-hidden">
            <CardContent className="p-0">
              <View className="px-4 pt-4 pb-3 border-b border-outline-variant border-opacity-20 bg-white bg-opacity-35">
                <View className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-primary border-opacity-15 bg-white bg-opacity-85 mb-3">
                  <FileText size={16} color="#C96F3D" />
                  <Text className="text-xs font-semibold text-primary">当前题目</Text>
                </View>
                <Text className="block text-lg font-semibold text-on-surface leading-relaxed">
                  {question.title}
                </Text>
              </View>
              <View className="p-4">
                <Text className="block text-xs font-medium text-on-surface-variant mb-2">答题提醒</Text>
                <View className="rounded-2xl bg-surface-container bg-opacity-70 p-4">
                  <Text className="block text-sm text-on-surface-variant leading-relaxed">
                    {question.description}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-on-surface">实时转写</Text>
                <View className="flex items-center gap-2">
                  <Mic size={16} color="#C96F3D" className={isRecording ? 'animate-pulse' : ''} />
                  <Text className="text-xs text-primary font-medium">{isRecording ? '识别中' : '暂停中'}</Text>
                </View>
              </View>
              <View className="bg-surface-container rounded-xl p-4 min-h-32">
                <Text className="text-sm text-on-surface leading-relaxed">
                  {transcript || '开始作答后，这里会实时显示你的语音转写内容。'}
                </Text>
              </View>
            </CardContent>
          </Card>

          <View className="flex gap-4 mb-6">
            {isRecording ? (
              <Button
                variant="default"
                className="flex-1 bg-surface-container text-on-surface-variant py-4"
                onClick={pauseInterview}
              >
                <View className="flex items-center justify-center gap-2">
                  <Pause size={20} color="#8B7662" />
                  <Text className="text-base font-semibold">暂停</Text>
                </View>
              </Button>
            ) : (
              <Button
                className="flex-1 bg-primary text-on-primary py-4"
                onClick={resumeInterview}
              >
                <View className="flex items-center justify-center gap-2">
                  <Play size={20} color="#ffffff" />
                  <Text className="text-base font-semibold">继续</Text>
                </View>
              </Button>
            )}
            <Button
              className="flex-1 bg-primary text-on-primary py-4"
              onClick={stopInterview}
            >
              <View className="flex items-center justify-center gap-2">
                <Square size={20} color="#ffffff" />
                <Text className="text-base font-semibold">结束</Text>
              </View>
            </Button>
          </View>
        </View>
      )}

      {phase === 'report' && (
        <View className="px-4 py-6 pb-8">
          <Card className="bg-surface-container-lowest mb-6 overflow-hidden">
            <CardContent className="p-0">
              <View className="p-4 bg-success bg-opacity-10 border-b border-success border-opacity-10">
                <View className="flex items-start justify-between gap-4">
                  <View className="flex items-start gap-3 flex-1">
                    <View className="w-10 h-10 bg-success bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={20} color="#7E9F7A" />
                    </View>
                    <View className="flex-1">
                      <Text className="block text-lg font-semibold text-on-surface mb-1">面试已完成</Text>
                      <Text className="block text-sm text-on-surface-variant leading-relaxed">
                        以下是本次作答的分析结果。你可以快速查看表现概览，再继续复盘这道题。
                      </Text>
                    </View>
                  </View>
                  <View className="report-score-chip flex-shrink-0">
                    <Text className="block text-xs text-primary font-medium">综合得分</Text>
                    <Text className="block text-2xl font-bold text-primary mt-1">78</Text>
                  </View>
                </View>
              </View>

              <View className="p-4">
                <View className="grid grid-cols-3 gap-3">
                  {paceMetrics.map(item => (
                    <View key={item.label} className="bg-surface-container rounded-2xl p-3 text-center">
                      <Text className="block text-lg font-bold text-on-surface mb-1">{item.value}</Text>
                      <Text className="block text-xs text-on-surface-variant">{item.label}</Text>
                      <Text className="block text-xs text-primary mt-1">{item.unit}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-lowest mb-6 overflow-hidden">
            <CardContent className="p-0">
              <View className="px-4 pt-4 pb-3 border-b border-outline-variant border-opacity-20 bg-white bg-opacity-35">
                <View className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-primary border-opacity-15 bg-white bg-opacity-85 mb-3">
                  <FileText size={16} color="#C96F3D" />
                  <Text className="text-xs font-semibold text-primary">本次题目回顾</Text>
                </View>
                <Text className="block text-lg font-semibold text-on-surface leading-relaxed">
                  {question.title}
                </Text>
              </View>
              <View className="p-4">
                <Text className="block text-xs font-medium text-on-surface-variant mb-2">题目说明</Text>
                <View className="rounded-2xl bg-surface-container bg-opacity-70 p-4">
                  <Text className="block text-sm text-on-surface-variant leading-relaxed">
                    {question.description}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <Activity size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">综合表现</Text>
              </View>

              <View className="report-overview-panel rounded-3xl p-4">
                <View className="flex items-center gap-5 mb-4">
                  <View className="report-score-panel">
                    <Text className="block text-xs text-on-surface-variant mb-1">本次评分</Text>
                    <Text className="block text-4xl font-bold text-primary">78</Text>
                    <Text className="block text-xs text-primary mt-1">表现稳定，可继续打磨结构</Text>
                  </View>
                  <View className="flex-1 flex flex-col gap-3">
                    {scoreBreakdown.map(item => (
                      <View key={item.label}>
                        <View className="flex justify-between items-center mb-1">
                          <Text className="text-xs text-on-surface-variant">{item.label}</Text>
                          <Text className="text-xs font-medium text-on-surface">{item.value} 分</Text>
                        </View>
                        <View className="h-2 bg-white bg-opacity-70 rounded-full overflow-hidden">
                          <View className="h-full bg-primary rounded-full" style={{ width: `${item.value}%` }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="rounded-2xl bg-white bg-opacity-80 p-3">
                  <Text className="block text-xs text-on-surface-variant leading-relaxed">
                    你的回答整体条理比较清晰，已经具备面试表达的基本框架。下一步更值得优化的是“先讲判断，再讲方案，再讲验证”的节奏感。
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <FileText size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">语言习惯分析</Text>
              </View>

              <View className="bg-surface-container rounded-2xl p-4 mb-4">
                <Text className="block text-xs font-medium text-on-surface-variant mb-3">高频口头词</Text>
                <View className="flex flex-wrap gap-2 mb-3">
                  {fillerWords.map(([word, count]) => (
                    <View key={word} className="inline-flex items-center gap-1 px-3 py-2 bg-white bg-opacity-80 rounded-full text-xs text-on-surface">
                      <Text className="font-medium text-primary">{word}</Text>
                      <Text className="text-on-surface-variant">x{count}</Text>
                    </View>
                  ))}
                </View>
                <Text className="block text-xs text-on-surface-variant leading-relaxed">
                  这些词不会明显影响理解，但在关键句前后稍微减少一些，重点会更突出，表达也会更干净。
                </Text>
              </View>

              <View className="report-pace-note rounded-2xl p-4">
                <Text className="block text-xs text-primary leading-relaxed">
                  建议语速保持在每分钟 120 到 160 字之间，你这次整体处在比较舒适的表达区间。
                </Text>
              </View>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">优化建议</Text>
              </View>
              <View className="flex flex-col gap-3">
                {improvementTips.map((item, index) => (
                  <View key={item} className="flex items-center gap-3">
                    <View className="report-tip-index">{index + 1}</View>
                    <View className="flex-1 rounded-2xl bg-surface-container p-3">
                      <Text className="block text-sm text-on-surface-variant leading-relaxed">{item}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          <View className="flex flex-col gap-3">
            <Button variant="default" className="w-full bg-surface-container text-on-surface py-4" onClick={copyTranscript}>
              <View className="flex items-center justify-center gap-2">
                <Copy size={18} color="#8B7662" />
                <Text className="text-base font-semibold">复制转写内容</Text>
              </View>
            </Button>
            <Button variant="default" className="w-full bg-surface-container text-on-surface py-4" onClick={openHistoryPage}>
              <View className="flex items-center justify-center gap-2">
                <History size={18} color="#8B7662" />
                <Text className="text-base font-semibold">查看历史记录</Text>
              </View>
            </Button>
            <Button className="w-full bg-primary text-on-primary py-4" onClick={restartInterview}>
              <View className="flex items-center justify-center gap-2">
                <RefreshCw size={18} color="#ffffff" />
                <Text className="text-base font-semibold">再练一题</Text>
              </View>
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default InterviewPage
