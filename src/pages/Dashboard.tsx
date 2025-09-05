import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, Plus, CheckCircle, Circle, Target, TrendingUp, Crown, Settings 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, session, isSubscribed, subscriptionTier, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [habits, setHabits] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      loadUserData();
    }
  }, [user, loading, navigate]);

  const loadUserData = async () => {
    try {
      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user?.id);

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // Load daily tasks for today
      const today = new Date().toISOString().split('T')[0];
      const { data: tasksData, error: tasksError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('task_date', today);

      if (tasksError) throw tasksError;
      setDailyTasks(tasksData || []);

      // Load goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id);

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "データの読み込みに失敗しました",
        description: "再度お試しください",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session || !isSubscribed) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Customer portal error:', error);
        return;
      }

      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Failed to open customer portal:', error);
    }
  };

  const canAddMoreHabits = () => {
    if (isSubscribed) return true;
    return habits.length < 1; // Free plan: 1 habit only
  };

  const canAddMoreTasks = () => {
    if (isSubscribed) return true;
    return dailyTasks.length < 3; // Free plan: 3 tasks per day
  };

  const canViewAnalytics = () => {
    return isSubscribed; // Analytics only for premium users
  };

  if (loading || isLoadingData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const currentDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {getGreeting()}、{user.user_metadata?.name || 'ユーザー'}さん
            </h1>
            {isSubscribed && (
              <Crown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{currentDate}</span>
          </div>
        </div>

        {/* Subscription Status */}
        {!isSubscribed ? (
          <Alert className="border-warning bg-warning/10">
            <AlertDescription className="text-center">
              <div className="space-y-2">
                <p className="font-medium">無料プランをご利用中です</p>
                <p className="text-sm">習慣1個、タスク1日3個まで利用可能です。</p>
                <Button 
                  onClick={() => navigate('/welcome')}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary-glow"
                >
                  プレミアムにアップグレード
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-success bg-success/10">
            <AlertDescription className="text-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">
                    プレミアムプラン ({subscriptionTier === 'yearly' ? '年額' : '月額'})
                  </span>
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  size="sm"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  管理
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-success">{habits.length}</div>
            <div className="text-xs text-muted-foreground">
              習慣 {!isSubscribed && '(1個まで)'}
            </div>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-primary">{dailyTasks.length}</div>
            <div className="text-xs text-muted-foreground">
              今日のタスク {!isSubscribed && '(3個まで)'}
            </div>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-warning">{goals.length}</div>
            <div className="text-xs text-muted-foreground">
              目標 {!isSubscribed && '(制限あり)'}
            </div>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-secondary-accent">
              {canViewAnalytics() ? '📊' : '🔒'}
            </div>
            <div className="text-xs text-muted-foreground">
              {canViewAnalytics() ? '統計分析' : '分析機能'}
            </div>
          </Card>
        </div>

        {/* Habits Section */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">習慣管理</CardTitle>
                <CardDescription>
                  継続したい習慣を記録しましょう
                </CardDescription>
              </div>
              <Button 
                size="sm"
                disabled={!canAddMoreHabits()}
                onClick={() => {
                  toast({
                    title: "習慣の追加",
                    description: "この機能は開発中です",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>まだ習慣が登録されていません</p>
                {canAddMoreHabits() ? (
                  <p className="text-sm">「追加」ボタンから新しい習慣を作成しましょう</p>
                ) : (
                  <p className="text-sm">無料プランでは1個まで登録できます</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <div key={habit.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{habit.name}</span>
                      <Badge variant="outline">進行中</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Tasks Section */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">今日のタスク</CardTitle>
                <CardDescription>
                  今日やることを管理しましょう
                </CardDescription>
              </div>
              <Button 
                size="sm"
                disabled={!canAddMoreTasks()}
                onClick={() => {
                  toast({
                    title: "タスクの追加",
                    description: "この機能は開発中です",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dailyTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>今日のタスクはありません</p>
                {canAddMoreTasks() ? (
                  <p className="text-sm">「追加」ボタンから新しいタスクを作成しましょう</p>
                ) : (
                  <p className="text-sm">無料プランでは1日3個まで登録できます</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dailyTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{task.title}</span>
                    <Badge variant={task.completed ? "default" : "outline"}>
                      {task.completed ? "完了" : "未完了"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Section */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">目標管理</CardTitle>
                <CardDescription>
                  長期的な目標を設定・追跡しましょう
                </CardDescription>
              </div>
              <Button 
                size="sm"
                disabled={!isSubscribed}
                onClick={() => {
                  toast({
                    title: "目標の追加",
                    description: "この機能は開発中です",
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isSubscribed ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>目標管理はプレミアムプラン限定です</p>
                <Button 
                  onClick={() => navigate('/welcome')}
                  size="sm"
                  className="mt-2"
                >
                  アップグレード
                </Button>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>まだ目標が設定されていません</p>
                <p className="text-sm">「追加」ボタンから新しい目標を作成しましょう</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{goal.title}</span>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                      <Badge variant={goal.completed ? "default" : "outline"}>
                        {goal.completed ? "達成" : "進行中"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Section */}
        {canViewAnalytics() && (
          <Card className="shadow-medium border-0 bg-gradient-to-r from-primary/10 to-primary-glow/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                統計分析
              </CardTitle>
              <CardDescription>あなたの成長を数値で確認</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>統計分析機能は開発中です</p>
                <p className="text-sm">近日中に利用可能になります</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}