import { View, Text } from '@tarojs/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Shuffle, Mic, History } from 'lucide-react-taro';

/**
 * 产品面试练习工具首页
 */
const IndexPage = () => {
  return (
    <View className="w-full min-h-full bg-background p-4">
      <View className="mb-8">
        <Text className="block text-2xl font-bold text-on-surface mb-2">
          面试练习
        </Text>
        <Text className="block text-sm text-on-surface-variant">
          准备产品经理面试，从这里开始
        </Text>
      </View>

      <View className="flex flex-col gap-4">
        <Card className="bg-surface-container-lowest">
          <CardHeader className="pb-2">
            <View className="flex items-center gap-3">
              <BookOpen size={24} color="#C96F3D" />
              <CardTitle className="text-lg font-semibold text-on-surface">
                题库学习
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-on-surface-variant mb-4">
              按类别浏览面试题目，查看参考答案和答题建议
            </Text>
            <Button className="w-full bg-primary text-on-primary">
              <Text>开始学习</Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest">
          <CardHeader className="pb-2">
            <View className="flex items-center gap-3">
              <Shuffle size={24} color="#C96F3D" />
              <CardTitle className="text-lg font-semibold text-on-surface">
                随机练习
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-on-surface-variant mb-4">
              老虎机随机抽题，体验真实面试场景
            </Text>
            <Button className="w-full bg-primary text-on-primary">
              <Text>随机抽题</Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest">
          <CardHeader className="pb-2">
            <View className="flex items-center gap-3">
              <Mic size={24} color="#C96F3D" />
              <CardTitle className="text-lg font-semibold text-on-surface">
                模拟面试
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-on-surface-variant mb-4">
              倒计时答题，录音分析，智能建议
            </Text>
            <Button className="w-full bg-primary text-on-primary">
              <Text>开始面试</Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest">
          <CardHeader className="pb-2">
            <View className="flex items-center gap-3">
              <History size={24} color="#C96F3D" />
              <CardTitle className="text-lg font-semibold text-on-surface">
                历史记录
              </CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="block text-sm text-on-surface-variant mb-4">
              查看练习记录，复盘面试表现
            </Text>
            <Button className="w-full bg-primary text-on-primary">
              <Text>查看记录</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  );
};

export default IndexPage;
