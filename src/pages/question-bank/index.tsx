import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  appendCustomInterviewQuestions,
  getNextInterviewQuestionId,
  loadInterviewQuestionBank,
  loadInterviewQuestionCategories,
  saveSelectedInterviewQuestion,
  type InterviewQuestion,
} from '@/data/interview-questions'
import { ArrowLeft, BookOpenText, FileText, Play, Upload } from 'lucide-react-taro'
import './index.css'

const ALL_CATEGORY = '全部'

type SingleQuestionDraft = {
  title: string
  description: string
  category: string
  difficulty: string
  source: string
}

const defaultDraft: SingleQuestionDraft = {
  title: '',
  description: '',
  category: '',
  difficulty: '',
  source: '',
}

const QuestionBankPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single')
  const [singleDraft, setSingleDraft] = useState<SingleQuestionDraft>(defaultDraft)
  const [batchText, setBatchText] = useState('')
  const [allQuestions, setAllQuestions] = useState<InterviewQuestion[]>(() => loadInterviewQuestionBank())
  const [allCategories, setAllCategories] = useState<string[]>(() => loadInterviewQuestionCategories())

  const filteredQuestions = selectedCategory === ALL_CATEGORY
    ? allQuestions
    : allQuestions.filter((question) => question.category === selectedCategory)

  const refreshQuestionBank = () => {
    setAllQuestions(loadInterviewQuestionBank())
    setAllCategories(loadInterviewQuestionCategories())
  }

  useDidShow(() => {
    refreshQuestionBank()
  })

  const handleBack = () => {
    Taro.reLaunch({
      url: '/pages/index/index',
    })
  }

  const handleStartPractice = (question: InterviewQuestion) => {
    saveSelectedInterviewQuestion(question)
    Taro.navigateTo({
      url: '/pages/interview/index',
    })
  }

  const handleDraftChange = (key: keyof SingleQuestionDraft, value?: string) => {
    setSingleDraft((previous) => ({
      ...previous,
      [key]: value ?? '',
    }))
  }

  const resetUploadDraft = () => {
    setSingleDraft(defaultDraft)
    setBatchText('')
    setUploadMode('single')
  }

  const handleUploadClose = (open: boolean) => {
    setIsUploadOpen(open)
    if (!open) {
      resetUploadDraft()
    }
  }

  const handleSingleSubmit = () => {
    if (!singleDraft.title.trim() || !singleDraft.description.trim()) {
      Taro.showToast({
        title: '请先补全题目标题和题目描述',
        icon: 'none',
      })
      return
    }

    const newQuestion: InterviewQuestion = {
      id: getNextInterviewQuestionId(allQuestions),
      title: singleDraft.title.trim(),
      description: singleDraft.description.trim(),
      category: singleDraft.category.trim() || '未分类',
      difficulty: singleDraft.difficulty.trim() || '自定义',
      source: singleDraft.source.trim() || '自定义上传',
    }

    appendCustomInterviewQuestions([newQuestion])
    refreshQuestionBank()
    setSelectedCategory(ALL_CATEGORY)

    Taro.showToast({
      title: '题目已加入本地题库',
      icon: 'none',
    })

    handleUploadClose(false)
  }

  const handleBatchSubmit = () => {
    const lines = batchText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      Taro.showToast({
        title: '请先粘贴批量题目内容',
        icon: 'none',
      })
      return
    }

    const baseId = getNextInterviewQuestionId(allQuestions)
    const parsedQuestions = lines
      .map((line, index) => {
        const [title, description, category, difficulty, source] = line.split('||').map((segment) => segment?.trim() ?? '')

        if (!title || !description) {
          return null
        }

        return {
          id: baseId + index,
          title,
          description,
          category: category || '未分类',
          difficulty: difficulty || '自定义',
          source: source || '批量导入',
        } satisfies InterviewQuestion
      })
      .filter((question): question is InterviewQuestion => !!question)

    if (parsedQuestions.length === 0) {
      Taro.showToast({
        title: '格式不正确，请按示例粘贴',
        icon: 'none',
      })
      return
    }

    appendCustomInterviewQuestions(parsedQuestions)
    refreshQuestionBank()
    setSelectedCategory(ALL_CATEGORY)

    Taro.showToast({
      title: `已导入 ${parsedQuestions.length} 道题`,
      icon: 'none',
    })

    handleUploadClose(false)
  }

  const singlePreviewQuestion: InterviewQuestion = {
    id: getNextInterviewQuestionId(allQuestions),
    title: singleDraft.title.trim() || '这里预览你准备上传的题目标题',
    description: singleDraft.description.trim() || '这里预览题目描述，建议你写清楚背景、分析维度和输出预期。',
    category: singleDraft.category.trim() || '类型',
    difficulty: singleDraft.difficulty.trim() || '难度',
    source: singleDraft.source.trim() || '来源',
  }

  return (
    <View className="practice-library-page min-h-full bg-background">
      <View className="practice-library-backdrop practice-library-backdrop--one" />
      <View className="practice-library-backdrop practice-library-backdrop--two" />

      <View className="relative px-4 py-4 pb-10">
        <View className="sticky top-0 z-30 mb-4 flex items-center justify-between rounded-full bg-white bg-opacity-70 px-2 py-2 backdrop-blur">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleBack}>
            <ArrowLeft size={20} color="#8B7662" />
          </Button>
          <Text className="text-base font-semibold text-on-surface">查看题库</Text>
          <View className="w-10" />
        </View>

        <Card className="practice-library-panel mb-4 overflow-hidden">
          <CardContent className="p-5">
            <View className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary border-opacity-10 bg-white bg-opacity-80 px-3 py-2">
              <BookOpenText size={16} color="#C96F3D" />
              <Text className="text-xs font-semibold text-primary">QUESTION BANK</Text>
            </View>

            <View className="mb-4">
              <Text className="mb-2 block text-2xl font-semibold text-on-surface">按分类挑题</Text>
              <Text className="block text-sm leading-relaxed text-on-surface-variant">
                从熟悉的话题开始热身，也可以直接挑一题进入限时作答。先找到想练的方向，再逐步提升难度。
              </Text>
            </View>

            <View className="flex flex-wrap gap-2">
              {[ALL_CATEGORY, ...allCategories].map((category) => {
                const isActive = selectedCategory === category

                return (
                  <Button
                    key={category}
                    variant="default"
                    className={`rounded-full px-4 py-2 ${isActive ? 'practice-library-chip--active' : 'practice-library-chip'}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Text className="text-sm font-medium">{category}</Text>
                  </Button>
                )
              })}
            </View>
          </CardContent>
        </Card>

        <View className="mb-3 flex items-center justify-between gap-3 px-1">
          <View className="flex items-center gap-2">
            <Text className="text-sm font-medium text-on-surface">
              {selectedCategory === ALL_CATEGORY ? '全部题目' : `${selectedCategory} · 精选题目`}
            </Text>
            <Text className="text-xs font-medium text-on-surface-variant">共 {filteredQuestions.length} 道</Text>
          </View>

          <Button
            className="practice-library-upload-button practice-library-upload-button--compact rounded-full px-3 py-1.5"
            onClick={() => setIsUploadOpen(true)}
          >
            <View className="flex items-center justify-center gap-2">
              <Upload size={14} color="#ffffff" />
              <Text className="text-xs font-semibold text-white">上传题目</Text>
            </View>
          </Button>
        </View>

        <View className="flex flex-col gap-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="practice-library-question-card overflow-hidden">
              <CardContent className="p-0">
                <View className="border-b border-outline-variant border-opacity-20 px-4 pb-3 pt-4">
                  <View className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary border-opacity-15 bg-white bg-opacity-85 px-3 py-2">
                    <FileText size={16} color="#C96F3D" />
                    <Text className="text-xs font-semibold text-primary">题目 {question.id}</Text>
                  </View>

                  <Text className="block text-lg font-semibold leading-relaxed text-on-surface">
                    {question.title}
                  </Text>
                </View>

                <View className="p-4">
                  <View className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="default" className="border-[rgba(201,111,61,0)] bg-primary bg-opacity-10 text-primary">
                      {question.category}
                    </Badge>
                    <Badge variant="default" className="border-[rgba(201,111,61,0)] bg-surface-container-highest text-on-surface-variant">
                      {question.difficulty}
                    </Badge>
                    <Badge variant="default" className="border-[rgba(201,111,61,0)] bg-surface-container-highest text-on-surface-variant">
                      {question.source}
                    </Badge>
                  </View>

                  <Text className="mb-4 block text-sm leading-relaxed text-on-surface-variant">
                    {question.description}
                  </Text>

                  <Button className="w-full bg-primary py-4 text-on-primary" onClick={() => handleStartPractice(question)}>
                    <View className="flex items-center justify-center gap-2">
                      <Play size={18} color="#ffffff" />
                      <Text className="text-base font-semibold">开始这题</Text>
                    </View>
                  </Button>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>

      <Drawer open={isUploadOpen} onOpenChange={handleUploadClose}>
        <DrawerContent className="practice-library-drawer max-h-[85vh] border-none bg-transparent shadow-none">
          <View className="practice-library-drawer-sheet">
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle className="text-xl text-on-surface">上传题目</DrawerTitle>
              <DrawerDescription className="text-sm leading-relaxed text-on-surface-variant">
                当前先落地轻量版，支持单个录入和批量导入。保存后会立即进入本地题库，首页抽题和题库列表都会同步生效。
              </DrawerDescription>
            </DrawerHeader>

            <View className="px-4 pb-2">
              <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'single' | 'batch')}>
                <TabsList className="practice-library-tab-list h-11 w-full rounded-full p-1">
                  <TabsTrigger value="single" className="practice-library-tab-trigger flex-1 rounded-full py-2 text-center">
                    单个录入
                  </TabsTrigger>
                  <TabsTrigger value="batch" className="practice-library-tab-trigger flex-1 rounded-full py-2 text-center">
                    批量导入
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="mt-4">
                  <View className="flex flex-col gap-4">
                    <Card className="practice-library-panel practice-library-panel--soft">
                      <CardContent className="p-4">
                        <View className="flex flex-col gap-3">
                          <Field>
                            <FieldLabel>题目标题</FieldLabel>
                            <FieldContent>
                              <Input
                                value={singleDraft.title}
                                placeholder="例如：如何设计一个提升复购率的会员体系？"
                                onInput={(e) => handleDraftChange('title', e.detail.value)}
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel>题目描述</FieldLabel>
                            <FieldContent>
                              <Textarea
                                value={singleDraft.description}
                                maxlength={300}
                                placeholder="写清楚背景、分析维度和希望候选人回答的重点。"
                                onInput={(e) => handleDraftChange('description', e.detail.value)}
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel>类型</FieldLabel>
                            <FieldContent>
                              <Input
                                value={singleDraft.category}
                                placeholder="例如：产品增长"
                                onInput={(e) => handleDraftChange('category', e.detail.value)}
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel>难度</FieldLabel>
                            <FieldContent>
                              <Input
                                value={singleDraft.difficulty}
                                placeholder="例如：中等"
                                onInput={(e) => handleDraftChange('difficulty', e.detail.value)}
                              />
                            </FieldContent>
                          </Field>

                          <Field>
                            <FieldLabel>来源</FieldLabel>
                            <FieldContent>
                              <Input
                                value={singleDraft.source}
                                placeholder="例如：社招题库"
                                onInput={(e) => handleDraftChange('source', e.detail.value)}
                              />
                            </FieldContent>
                          </Field>
                        </View>
                      </CardContent>
                    </Card>

                    <Card className="practice-library-panel practice-library-panel--soft">
                      <CardContent className="p-4">
                        <Text className="mb-3 block text-sm font-semibold text-on-surface">实时预览</Text>
                        <View className="practice-library-preview-card">
                          <View className="mb-3 flex flex-wrap gap-2">
                            <Badge variant="default" className="border-[rgba(201,111,61,0)] bg-primary bg-opacity-10 text-primary">
                              {singlePreviewQuestion.category}
                            </Badge>
                            <Badge variant="default" className="border-[rgba(201,111,61,0)] bg-surface-container-highest text-on-surface-variant">
                              {singlePreviewQuestion.difficulty}
                            </Badge>
                            <Badge variant="default" className="border-[rgba(201,111,61,0)] bg-surface-container-highest text-on-surface-variant">
                              {singlePreviewQuestion.source}
                            </Badge>
                          </View>
                          <Text className="mb-2 block text-base font-semibold leading-relaxed text-on-surface">
                            {singlePreviewQuestion.title}
                          </Text>
                          <Text className="block text-sm leading-relaxed text-on-surface-variant">
                            {singlePreviewQuestion.description}
                          </Text>
                        </View>
                      </CardContent>
                    </Card>
                  </View>
                </TabsContent>

                <TabsContent value="batch" className="mt-4">
                  <Card className="practice-library-panel practice-library-panel--soft">
                    <CardContent className="p-4">
                      <Field>
                        <FieldLabel>批量粘贴内容</FieldLabel>
                        <FieldContent>
                          <Textarea
                            value={batchText}
                            maxlength={4000}
                            className="h-44"
                            placeholder={'每行一题，格式：\n题目标题||题目描述||类型||难度||来源'}
                            onInput={(e) => setBatchText(e.detail.value)}
                          />
                          <FieldDescription>
                            这一版先用 `||` 分隔字段，等你确认好结构后，我们再接文件上传或 Excel 模板导入。
                          </FieldDescription>
                        </FieldContent>
                      </Field>

                      <View className="practice-library-batch-tip mt-4">
                        <Text className="mb-2 block text-xs font-semibold uppercase tracking-wide text-primary">
                          示例
                        </Text>
                        <Text className="block text-sm leading-relaxed text-on-surface-variant">
                          如何提升次日留存||请从用户分层、路径分析和版本因素三个角度拆解。||数据分析||中等||社招题库
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </View>

            <DrawerFooter className="practice-library-drawer-footer">
              <View className="flex gap-3">
                <DrawerClose className="flex-1">
                  <Button variant="default" className="practice-library-drawer-secondary w-full py-4">
                    <Text className="text-sm font-semibold text-on-surface">先关闭</Text>
                  </Button>
                </DrawerClose>

                <Button
                  className="practice-library-upload-button flex-1 py-4"
                  onClick={uploadMode === 'single' ? handleSingleSubmit : handleBatchSubmit}
                >
                  <Text className="text-sm font-semibold text-white">
                    {uploadMode === 'single' ? '加入题库' : '批量导入'}
                  </Text>
                </Button>
              </View>
            </DrawerFooter>
          </View>
        </DrawerContent>
      </Drawer>
    </View>
  )
}

export default QuestionBankPage
