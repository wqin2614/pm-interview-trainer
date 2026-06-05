import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Play, RefreshCw, Menu } from 'lucide-react-taro';

// 模拟题库数据
const questionBank = [
  {
    id: 1,
    category: '产品思维',
    difficulty: '中等',
    source: '字节跳动',
    title: '如何设计一个用户增长方案？',
    description: '假设你是某电商产品的产品经理，需要设计一个用户增长方案，请说明你的思路和具体措施。'
  },
  {
    id: 2,
    category: '数据分析',
    difficulty: '简单',
    source: '腾讯',
    title: '如何分析用户留存率下降？',
    description: '发现最近一个月用户留存率下降了10%，你会如何分析这个问题？'
  },
  {
    id: 3,
    category: '产品设计',
    difficulty: '困难',
    source: '阿里巴巴',
    title: '设计一个老年用户友好的支付流程',
    description: '为60岁以上的老年用户设计一个支付流程，需要考虑他们的使用习惯和可能遇到的困难。'
  },
  {
    id: 4,
    category: '用户研究',
    difficulty: '中等',
    source: '美团',
    title: '如何进行用户访谈？',
    description: '计划进行一轮用户访谈来了解用户对新功能的反馈，请设计访谈提纲和注意事项。'
  }
];

const IndexPage = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  // 随机抽题
  const handleSpin = () => {
    setIsSpinning(true);
    
    // 模拟老虎机滚动效果
    setTimeout(() => {
      // 随机选择题目
      const randomQuestion = questionBank[Math.floor(Math.random() * questionBank.length)];
      setSelectedQuestion(randomQuestion);
      setIsSpinning(false);
      setShowResult(true);
    }, 1500);
  };

  // 重新抽取
  const handleRetry = () => {
    setShowResult(false);
    setSelectedQuestion(null);
  };

  // 开始答题
  const handleStartAnswer = () => {
    if (selectedQuestion) {
      Taro.navigateTo({
        url: '/pages/interview/index'
      });
    }
  };

  return (
    <View className="w-full min-h-full bg-background">
      {/* 顶部导航 */}
      <View className="sticky top-0 z-40 bg-background h-14 flex items-center justify-between px-4">
        <View className="w-10 h-10 flex items-center justify-center">
          {showMenu ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10"
              onClick={() => setShowMenu(false)}
            >
              <Text>关闭</Text>
            </Button>
          ) : null}
        </View>
        <Text className="text-base font-semibold text-on-surface">随机练习</Text>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-10 h-10"
          onClick={() => setShowMenu(!showMenu)}
        >
          <Menu size={20} color="#8B7662" />
        </Button>
      </View>

      {/* 侧边菜单 */}
      {showMenu && (
        <View className="absolute inset-0 z-50 bg-background">
          <View className="p-6 pt-20">
            <Text className="block text-xl font-bold text-on-surface mb-8">更多功能</Text>
            <View className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                className="justify-start px-0 h-12"
                onClick={() => setShowMenu(false)}
              >
                <Text className="text-base text-on-surface">📚 题库学习</Text>
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start px-0 h-12"
                onClick={() => setShowMenu(false)}
              >
                <Text className="text-base text-on-surface">🎤 模拟面试</Text>
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start px-0 h-12"
                onClick={() => setShowMenu(false)}
              >
                <Text className="text-base text-on-surface">📋 历史记录</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 主要内容 */}
      {!showMenu && (
        <View className="px-4 py-6 pb-8">
          {/* 标题 */}
          <View className="mb-8">
            <Text className="block text-2xl font-bold text-on-surface mb-2">
              来抽一道题
            </Text>
            <Text className="block text-sm text-on-surface-variant">
              点击 Spin 开始随机抽题
            </Text>
          </View>

          {/* 老虎机区域 */}
          <Card className="bg-surface-container-lowest mb-6">
            <CardContent className="p-6">
              {/* 三个槽位 */}
              <View className="flex justify-center gap-3 mb-6">
                {/* 类别 */}
                <View className="bg-surface-container rounded-xl p-4 w-24 h-32 flex items-center justify-center">
                  <View className="text-center">
                    <Text className="block text-xs text-on-surface-variant mb-2">类别</Text>
                    <Text className={`block text-base font-semibold text-on-surface ${isSpinning ? 'animate-pulse' : ''}`}>
                      产品思维
                    </Text>
                  </View>
                </View>

                {/* 难度 */}
                <View className="bg-surface-container rounded-xl p-4 w-24 h-32 flex items-center justify-center">
                  <View className="text-center">
                    <Text className="block text-xs text-on-surface-variant mb-2">难度</Text>
                    <Text className={`block text-base font-semibold text-on-surface ${isSpinning ? 'animate-pulse' : ''}`}>
                      中等
                    </Text>
                  </View>
                </View>

                {/* 来源 */}
                <View className="bg-surface-container rounded-xl p-4 w-24 h-32 flex items-center justify-center">
                  <View className="text-center">
                    <Text className="block text-xs text-on-surface-variant mb-2">来源</Text>
                    <Text className={`block text-base font-semibold text-on-surface ${isSpinning ? 'animate-pulse' : ''}`}>
                      字节跳动
                    </Text>
                  </View>
                </View>
              </View>

              {/* Spin 按钮 */}
              <Button 
                className="w-full bg-primary text-on-primary py-4"
                disabled={isSpinning}
                onClick={handleSpin}
              >
                <View className="flex items-center justify-center gap-2">
                  <Shuffle size={20} color="#ffffff" />
                  <Text className="text-base font-semibold">
                    {isSpinning ? '抽取中...' : 'Spin'}
                  </Text>
                </View>
              </Button>
            </CardContent>
          </Card>

          {/* 抽取结果 */}
          {showResult && selectedQuestion && (
            <Card className="bg-surface-container-lowest mb-6">
              <CardContent className="p-6">
                <Text className="block text-base font-semibold text-on-surface mb-4">
                  抽到的题目
                </Text>

                {/* 题目卡片 */}
                <View className="bg-surface-container rounded-xl p-4 mb-4">
                  <View className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="default" className="bg-primary bg-opacity-15 text-primary">
                      {selectedQuestion.category}
                    </Badge>
                    <Badge variant="default" className="bg-surface-container-highest text-on-surface-variant">
                      {selectedQuestion.difficulty}
                    </Badge>
                    <Badge variant="default" className="bg-surface-container-highest text-on-surface-variant">
                      {selectedQuestion.source}
                    </Badge>
                  </View>
                  <Text className="block text-base font-semibold text-on-surface mb-2">
                    {selectedQuestion.title}
                  </Text>
                  <Text className="block text-sm text-on-surface-variant">
                    {selectedQuestion.description}
                  </Text>
                </View>

                {/* 操作按钮 */}
                <View className="flex gap-3">
                  <Button 
                    className="flex-1 bg-primary text-on-primary py-4"
                    onClick={handleStartAnswer}
                  >
                    <View className="flex items-center justify-center gap-2">
                      <Play size={20} color="#ffffff" />
                      <Text className="text-base font-semibold">开始答题</Text>
                    </View>
                  </Button>
                  <Button 
                    variant="default"
                    className="flex-1 bg-surface-container text-on-surface-variant py-4"
                    onClick={handleRetry}
                  >
                    <View className="flex items-center justify-center gap-2">
                      <RefreshCw size={20} color="#8B7662" />
                      <Text className="text-base font-semibold">重新抽取</Text>
                    </View>
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      )}
    </View>
  );
};

export default IndexPage;
