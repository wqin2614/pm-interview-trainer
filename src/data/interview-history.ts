import Taro from '@tarojs/taro'
import { type InterviewQuestion } from '@/data/interview-questions'

export type InterviewHistoryRecord = {
  id: string
  createdAt: number
  durationMinutes: number
  elapsedSeconds: number
  transcript: string
  question: InterviewQuestion
}

export const INTERVIEW_HISTORY_STORAGE_KEY = 'interview:history-records'
const MAX_HISTORY_RECORDS = 20

const isInterviewHistoryRecord = (value: unknown): value is InterviewHistoryRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string'
    && typeof candidate.createdAt === 'number'
    && typeof candidate.durationMinutes === 'number'
    && typeof candidate.elapsedSeconds === 'number'
    && typeof candidate.transcript === 'string'
    && !!candidate.question
}

export const loadInterviewHistory = (): InterviewHistoryRecord[] => {
  try {
    const history = Taro.getStorageSync(INTERVIEW_HISTORY_STORAGE_KEY)
    if (!Array.isArray(history)) {
      return []
    }

    return history.filter(isInterviewHistoryRecord)
  } catch {
    return []
  }
}

export const saveInterviewHistoryRecord = (
  record: Omit<InterviewHistoryRecord, 'id' | 'createdAt'>,
): InterviewHistoryRecord[] => {
  const nextRecord: InterviewHistoryRecord = {
    ...record,
    id: `${Date.now()}-${record.question.id}`,
    createdAt: Date.now(),
  }

  const nextHistory = [nextRecord, ...loadInterviewHistory()].slice(0, MAX_HISTORY_RECORDS)
  Taro.setStorageSync(INTERVIEW_HISTORY_STORAGE_KEY, nextHistory)
  return nextHistory
}

export const clearInterviewHistory = () => {
  Taro.removeStorageSync(INTERVIEW_HISTORY_STORAGE_KEY)
}
