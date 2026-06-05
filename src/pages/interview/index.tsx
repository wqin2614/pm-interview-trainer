import { View, Text } from '@tarojs/components';
import { useState, useRef } from 'react';
import Taro from '@tarojs/taro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Play, Pause, Square, Check, Activity, FileText, Lightbulb, Copy, RefreshCw, History } from 'lucide-react-taro';

const InterviewPage = () => {
  const [phase, setPhase] = useState<'preparation' | 'interview' | 'report'>('preparation');
  const [selectedDuration, setSelectedDuration] = useState(5); // 分钟
  const [remainingTime, setRemainingTime] = useState(5 * 60); // 秒
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 模拟题目数据
  const question = {
    id: 1,
    category: '产品思维',
    difficulty: '中等',
    source: '字节跳动',
    title: '如何设计一个用户增长方案？',
    description: '假设你是某电商产品的产品经理，需要设计一个用户增长方案，请说明你的思路和具体措施。'
  };

  // 计算进度百分比
  const progressPercentage = phase === 'interview' 
    ? ((selectedDuration * 60 - remainingTime) / (selectedDuration * 60)) * 100 
    : 0;

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始面试
  const startInterview = () => {
    setPhase('interview');
    setRemainingTime(selectedDuration * 60);
    setIsRecording(true);
    setTranscript('');
    
    // 开始计时
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          stopInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 模拟语音转文字
    simulateTranscript();
  };

  // 模拟语音转文字
  const simulateTranscript = () => {
    const sampleTexts = [
      '好的，我来谈谈如何设计一个用户增长方案。',
      '首先，我认为需要明确产品的目标用户群体是谁，',
      '然后分析当前用户的生命周期和转化漏斗。',
      '接下来可以从拉新、激活、留存、变现几个维度来思考...'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < sampleTexts.length && phase === 'interview') {
        setTranscript(prev => prev + (prev ? ' ' : '') + sampleTexts[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  };

  // 暂停面试
  const pauseInterview = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 停止面试
  const stopInterview = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setPhase('report');
  };

  // 再来一次
  const restartInterview = () => {
    setPhase('preparation');
    setRemainingTime(selectedDuration * 60);
    setTranscript('');
  };

  // 返回上一页
  const goBack = () => {
    Taro.navigateBack();
  };

  return (
    <View className="w-full min-h-full bg-background">
      {/* 顶部导航 */}
      <View className="sticky top-0 z-40 bg-background h-14 flex items-center justify-between px-4">
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

      {/* 准备阶段 */}
      {phase === 'preparation' && (
        <View className="px-4 py-6 pb-8">
          {/* 时长选择 */}
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

          {/* 面试题目 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-3">
                <FileText size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">今日面试题目</Text>
              </View>
              <Text className="text-base font-medium text-on-surface mb-2">{question.title}</Text>
              <View className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary bg-opacity-15 text-primary">
                  {question.category}
                </Badge>
                <Text className="text-xs text-on-surface-variant">高频面试题</Text>
              </View>
            </CardContent>
          </Card>

          {/* 功能说明 */}
          <Card className="bg-surface-container mb-6">
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-on-surface mb-3">面试功能</Text>
              <View className="flex flex-col gap-3">
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity size={16} color="#C96F3D" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-on-surface">倒计时答题</Text>
                    <Text className="text-xs text-on-surface-variant">圆形进度条实时显示剩余时间</Text>
                  </View>
                </View>
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mic size={16} color="#C96F3D" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-on-surface">全程录音</Text>
                    <Text className="text-xs text-on-surface-variant">支持录音回放和下载</Text>
                  </View>
                </View>
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText size={16} color="#C96F3D" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-on-surface">语音转文字</Text>
                    <Text className="text-xs text-on-surface-variant">实时显示语音转写内容</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 开始按钮 */}
          <Button 
            className="w-full bg-primary text-on-primary py-4"
            onClick={startInterview}
          >
            <View className="flex items-center justify-center gap-2">
              <Play size={20} color="#ffffff" />
              <Text className="text-base font-semibold">开始面试</Text>
            </View>
          </Button>
        </View>
      )}

      {/* 面试进行阶段 */}
      {phase === 'interview' && (
        <View className="px-4 py-6 pb-8">
          {/* 圆形进度条计时器 */}
          <View className="flex justify-center mb-6">
            <View className="relative">
              <View className="w-48 h-48 flex items-center justify-center">
                <View className="absolute inset-0 flex items-center justify-center">
                  <View className="w-32 h-32 rounded-full border-8 border-surface-container" />
                </View>
                <View 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <View 
                    className="w-32 h-32 rounded-full border-8 border-primary"
                    style={{ 
                      borderLeftColor: 'transparent',
                      borderBottomColor: 'transparent',
                      transform: `rotate(${progressPercentage * 3.6}deg)`
                    }}
                  />
                </View>
                <View className="flex flex-col items-center justify-center">
                  <View className="flex items-center gap-2 mb-2">
                    {isRecording && (
                      <View className="w-3 h-3 bg-error rounded-full animate-pulse" />
                    )}
                    <Text className="text-xs text-on-surface-variant">
                      {isRecording ? '录音中' : '已暂停'}
                    </Text>
                  </View>
                  <Text className="text-3xl font-bold text-on-surface">
                    {formatTime(remainingTime)}
                  </Text>
                  <Text className="text-xs text-on-surface-variant mt-1">剩余时间</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 当前题目 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-on-surface mb-2">当前题目</Text>
              <Text className="text-base text-on-surface">{question.title}</Text>
            </CardContent>
          </Card>

          {/* 实时语音转文字 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-on-surface">实时转写</Text>
                <View className="flex items-center gap-1.5">
                  <Mic size={16} color="#C96F3D" className={isRecording ? 'animate-pulse' : ''} />
                  <Text className="text-xs text-primary font-medium">识别中</Text>
                </View>
              </View>
              <View className="bg-surface-container rounded-xl p-4 min-h-[120px]">
                <Text className="text-sm text-on-surface leading-relaxed">
                  {transcript || '开始说话后，这里会实时显示转写内容...'}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* 控制按钮 */}
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
                onClick={startInterview}
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

      {/* 分析报告阶段 */}
      {phase === 'report' && (
        <View className="px-4 py-6 pb-8">
          {/* 完成提示 */}
          <View className="bg-success bg-opacity-10 rounded-xl p-4 mb-6">
            <View className="flex items-start gap-3">
              <View className="w-10 h-10 bg-success bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={20} color="#7E9F7A" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-success mb-1">面试完成！</Text>
                <Text className="text-xs text-on-surface-variant">以下是你的语音分析报告，已自动保存到历史记录</Text>
              </View>
            </View>
          </View>

          {/* 总体评分 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-on-surface mb-4">总体评分</Text>
              <View className="flex items-center justify-center gap-8">
                <View className="text-center">
                  <Text className="text-4xl font-bold text-primary mb-1">78</Text>
                  <Text className="text-xs text-on-surface-variant">综合得分</Text>
                </View>
                <View className="h-16 w-px bg-outline-variant bg-opacity-30" />
                <View className="flex-1 flex flex-col gap-3">
                  <View>
                    <View className="flex justify-between text-xs mb-1">
                      <Text className="text-on-surface-variant">表达流畅度</Text>
                      <Text className="text-on-surface font-medium">82分</Text>
                    </View>
                    <View className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <View className="h-full bg-primary rounded-full" style={{ width: '82%' }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex justify-between text-xs mb-1">
                      <Text className="text-on-surface-variant">内容完整度</Text>
                      <Text className="text-on-surface font-medium">75分</Text>
                    </View>
                    <View className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <View className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex justify-between text-xs mb-1">
                      <Text className="text-on-surface-variant">语言规范性</Text>
                      <Text className="text-on-surface font-medium">76分</Text>
                    </View>
                    <View className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <View className="h-full bg-primary rounded-full" style={{ width: '76%' }} />
                    </View>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 语速统计 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <Activity size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">语速统计</Text>
              </View>
              <View className="grid grid-cols-3 gap-4 mb-4">
                <View className="bg-surface-container rounded-xl p-3 text-center">
                  <Text className="text-lg font-bold text-primary mb-1">156</Text>
                  <Text className="text-xs text-on-surface-variant">平均语速<br />(字/分钟)</Text>
                </View>
                <View className="bg-surface-container rounded-xl p-3 text-center">
                  <Text className="text-lg font-bold text-primary mb-1">4:32</Text>
                  <Text className="text-xs text-on-surface-variant">实际用时</Text>
                </View>
                <View className="bg-surface-container rounded-xl p-3 text-center">
                  <Text className="text-lg font-bold text-primary mb-1">698</Text>
                  <Text className="text-xs text-on-surface-variant">总字数</Text>
                </View>
              </View>
              <View className="bg-primary bg-opacity-5 rounded-lg p-3">
                <Text className="text-xs text-on-surface-variant">
                  建议语速为每分钟120-160字，你的语速处于理想范围内，继续保持！
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* 语言习惯分析 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <FileText size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">语言习惯分析</Text>
              </View>
              
              {/* 口头禅统计 */}
              <View className="mb-4">
                <Text className="text-xs font-medium text-on-surface-variant mb-2">高频口头禅</Text>
                <View className="flex flex-wrap gap-2">
                  <View className="inline-flex items-center gap-1 px-3 py-2 bg-surface-container rounded-full text-xs text-on-surface">
                    <Text className="font-medium text-primary">然后</Text>
                    <Text className="text-on-surface-variant">×12</Text>
                  </View>
                  <View className="inline-flex items-center gap-1 px-3 py-2 bg-surface-container rounded-full text-xs text-on-surface">
                    <Text className="font-medium text-primary">就是</Text>
                    <Text className="text-on-surface-variant">×8</Text>
                  </View>
                  <View className="inline-flex items-center gap-1 px-3 py-2 bg-surface-container rounded-full text-xs text-on-surface">
                    <Text className="font-medium text-primary">嗯</Text>
                    <Text className="text-on-surface-variant">×6</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 表达建议 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} color="#C96F3D" />
                <Text className="text-sm font-semibold text-on-surface">表达建议</Text>
              </View>
              <View className="flex flex-col gap-3">
                <View className="flex gap-3">
                  <View className="w-6 h-6 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Text className="text-xs font-bold text-primary">1</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-on-surface mb-1">减少口头禅使用</Text>
                    <Text className="text-xs text-on-surface-variant">建议在思考时稍作停顿，而非使用然后、就是等填充词。</Text>
                  </View>
                </View>
                <View className="flex gap-3">
                  <View className="w-6 h-6 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Text className="text-xs font-bold text-primary">2</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-on-surface mb-1">增强内容条理性</Text>
                    <Text className="text-xs text-on-surface-variant">建议使用第一、第二、第三等连接词，让回答更有层次感。</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 转写文本 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-on-surface">转写文本</Text>
                <Button variant="ghost" size="sm" className="text-xs text-primary font-medium h-auto py-1">
                  <View className="flex items-center gap-1">
                    <Copy size={14} color="#C96F3D" />
                    <Text>复制</Text>
                  </View>
                </Button>
              </View>
              <View className="bg-surface-container rounded-xl p-4">
                <Text className="text-sm text-on-surface leading-relaxed">
                  {transcript || '好的，我来谈谈如何设计一个用户增长方案。首先，我认为需要明确产品的目标用户群体是谁，然后分析当前用户的生命周期和转化漏斗。接下来可以从拉新、激活、留存、变现几个维度来思考...'}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <View className="flex flex-col gap-3">
            <Button 
              variant="default"
              className="w-full bg-surface-container text-on-surface-variant py-4"
            >
              <View className="flex items-center justify-center gap-2">
                <History size={20} color="#8B7662" />
                <Text className="text-base font-semibold">查看历史记录</Text>
              </View>
            </Button>
            <Button 
              className="w-full bg-primary text-on-primary py-4"
              onClick={restartInterview}
            >
              <View className="flex items-center justify-center gap-2">
                <RefreshCw size={20} color="#ffffff" />
                <Text className="text-base font-semibold">再来一次</Text>
              </View>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default InterviewPage;
