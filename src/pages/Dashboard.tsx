import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleManager } from '@/components/ScheduleManager';
import { ScheduleTemplateCreator } from '@/components/ScheduleTemplateCreator';
import { GoalManager } from '@/components/GoalManager';
import { 
  Calendar, Plus, CheckCircle, Circle, Target, TrendingUp, Crown, Settings, Clock, Users, BookOpen 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Template interfaces to match ScheduleTemplateCreator
interface TemplateScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  isHabit: boolean;
  habitName?: string;
}

interface TemplateData {
  id: string;
  name: string;
  items: TemplateScheduleItem[];
}

export default function Dashboard() {
  const { user, session, isSubscribed, subscriptionTier, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [habits, setHabits] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      loadUserData();
      checkSetupStatus();
    }
  }, [user, loading, navigate]);

  const checkSetupStatus = () => {
    const userData = localStorage.getItem('dayweave-user');
    const templatesData = localStorage.getItem('dayweave-templates');
    
    // Check if user has completed initial setup (has templates or habits)
    if (userData || templatesData) {
      const userSetup = userData ? JSON.parse(userData) : null;
      const templates = templatesData ? JSON.parse(templatesData) : [];
      
      if ((userSetup && userSetup.habits && userSetup.habits.length > 0) || templates.length > 0) {
        setHasCompletedSetup(true);
      }
    }
  };

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

  const handleSetupComplete = (templates: TemplateData[]) => {
    // Extract habits from templates
    const allHabits = new Set<string>();
    templates.forEach(template => {
      template.items.forEach(item => {
        if (item.isHabit && item.habitName) {
          allHabits.add(item.habitName);
        }
      });
    });
    
    const setupData = {
      habits: Array.from(allHabits),
      templates: templates
    };
    
    // Save setup data to localStorage
    localStorage.setItem('dayweave-user', JSON.stringify(setupData));
    setHasCompletedSetup(true);
    setIsSetupDialogOpen(false);
    
    // Refresh user data
    loadUserData();
    
    toast({
      title: "初期設定が完了しました！",
      description: "スケジュール管理を始めましょう",
    });
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
          
          {/* Setup Button */}
          {!hasCompletedSetup && (
            <Button 
              onClick={() => setIsSetupDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              初期設定を開始
            </Button>
          )}
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

        {/* Main Content */}
        {hasCompletedSetup ? (
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                スケジュール
              </TabsTrigger>
              <TabsTrigger value="habits" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                習慣
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                目標
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                分析
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <ScheduleManager habits={habits.map(h => h.name) || []} />
            </TabsContent>

            <TabsContent value="habits" className="space-y-4">
              <div className="space-y-4">
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
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              {!isSubscribed ? (
                <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>目標管理はプレミアムプラン限定です</p>
                    <Button 
                      onClick={() => navigate('/welcome')}
                      size="sm"
                      className="mt-2"
                    >
                      アップグレード
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <GoalManager />
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {canViewAnalytics() ? (
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
              ) : (
                <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>統計分析はプレミアムプラン限定です</p>
                    <Button 
                      onClick={() => navigate('/welcome')}
                      size="sm"
                      className="mt-2"
                    >
                      アップグレード
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">まずは初期設定を行いましょう！</h3>
              <p className="text-muted-foreground mb-4">
                習慣とスケジュールテンプレートを設定して、効率的な日々を始めませんか？
              </p>
              <Button 
                onClick={() => setIsSetupDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                初期設定を開始
              </Button>
            </CardContent>
          </Card>
        )}

        
        {/* Setup Dialog */}
        <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>初期設定</DialogTitle>
              <DialogDescription>
                習慣とスケジュールテンプレートを設定しましょう
              </DialogDescription>
            </DialogHeader>
            <ScheduleTemplateCreator
              habits={[]} // Start with no habits, user will define them
              onComplete={handleSetupComplete}
              onBack={() => setIsSetupDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}