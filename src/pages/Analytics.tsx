import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, Clock, Award, Flame, Activity } from 'lucide-react';

interface HabitData {
  name: string;
  totalValue: number;
  unit: string;
  consecutiveDays: number;
  lastUpdated: string;
  todayValue: number;
  dailyGoal: number;
  history: { [date: string]: number };
}

interface TodoData {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

interface AnalyticsData {
  date: string;
  habitCompletionRate: number;
  tasksCompleted: number;
  totalTasks: number;
  productivityScore: number;
}

interface HabitTrend {
  name: string;
  data: { date: string; value: number; goal: number }[];
  totalProgress: number;
  averageDaily: number;
  bestStreak: number;
  currentStreak: number;
}

export default function Analytics() {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [todos, setTodos] = useState<TodoData[]>([]);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [habitTrends, setHabitTrends] = useState<HabitTrend[]>([]);

  useEffect(() => {
    const habitsData = localStorage.getItem('dayweave-habits');
    const todosData = localStorage.getItem('dayweave-todos');

    if (habitsData) {
      setHabits(JSON.parse(habitsData));
    }

    if (todosData) {
      setTodos(JSON.parse(todosData));
    }
  }, []);

  useEffect(() => {
    if (habits.length > 0 || todos.length > 0) {
      generateAnalyticsData();
      generateHabitTrends();
    }
  }, [habits, todos, timeRange]);

  const generateAnalyticsData = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const data: AnalyticsData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Calculate habit completion rate for this date
      let habitCompletionRate = 0;
      if (habits.length > 0) {
        const completedHabits = habits.filter(habit => {
          const dayValue = habit.history[dateStr] || 0;
          return dayValue >= habit.dailyGoal;
        }).length;
        habitCompletionRate = (completedHabits / habits.length) * 100;
      }

      // Calculate task completion for this date
      const todosOnDate = todos.filter(todo => {
        const createdDate = new Date(todo.createdAt).toISOString().split('T')[0];
        return createdDate <= dateStr;
      });

      const completedTodosOnDate = todos.filter(todo => {
        if (!todo.completedAt) return false;
        const completedDate = new Date(todo.completedAt).toISOString().split('T')[0];
        return completedDate === dateStr;
      }).length;

      const totalTasks = todosOnDate.length;
      const tasksCompleted = completedTodosOnDate;

      // Calculate productivity score (combination of habits and tasks)
      const taskCompletionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
      const productivityScore = (habitCompletionRate * 0.6 + taskCompletionRate * 0.4);

      data.push({
        date: dateStr,
        habitCompletionRate: Math.round(habitCompletionRate),
        tasksCompleted,
        totalTasks,
        productivityScore: Math.round(productivityScore),
      });
    }

    setAnalyticsData(data);
  };

  const generateHabitTrends = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const trends: HabitTrend[] = [];

    habits.forEach(habit => {
      const data: { date: string; value: number; goal: number }[] = [];
      let totalProgress = 0;
      let streakDays = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const value = habit.history[dateStr] || 0;
        
        data.push({
          date: dateStr,
          value,
          goal: habit.dailyGoal,
        });

        totalProgress += value;

        // Calculate streaks
        if (value >= habit.dailyGoal) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak; // Current streak if today
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
        }
      }

      bestStreak = Math.max(bestStreak, tempStreak);
      const averageDaily = totalProgress / days;

      trends.push({
        name: habit.name,
        data,
        totalProgress,
        averageDaily: Math.round(averageDaily * 10) / 10,
        bestStreak,
        currentStreak: habit.consecutiveDays,
      });
    });

    setHabitTrends(trends);
  };

  const getCategoryStats = () => {
    const categoryData: { [key: string]: { total: number; completed: number } } = {};

    todos.forEach(todo => {
      if (!categoryData[todo.category]) {
        categoryData[todo.category] = { total: 0, completed: 0 };
      }
      categoryData[todo.category].total++;
      if (todo.completed) {
        categoryData[todo.category].completed++;
      }
    });

    return Object.entries(categoryData).map(([category, stats]) => ({
      category,
      total: stats.total,
      completed: stats.completed,
      completionRate: Math.round((stats.completed / stats.total) * 100),
    }));
  };

  const getPriorityStats = () => {
    const priorityData = { high: 0, medium: 0, low: 0 };
    const completedPriorityData = { high: 0, medium: 0, low: 0 };

    todos.forEach(todo => {
      priorityData[todo.priority]++;
      if (todo.completed) {
        completedPriorityData[todo.priority]++;
      }
    });

    return [
      { name: '高優先度', total: priorityData.high, completed: completedPriorityData.high, color: '#ef4444' },
      { name: '中優先度', total: priorityData.medium, completed: completedPriorityData.medium, color: '#f59e0b' },
      { name: '低優先度', total: priorityData.low, completed: completedPriorityData.low, color: '#10b981' },
    ];
  };

  const getOverallStats = () => {
    const totalHabits = habits.length;
    const completedHabitsToday = habits.filter(h => {
      const today = new Date().toISOString().split('T')[0];
      const todayValue = h.history[today] || 0;
      return todayValue >= h.dailyGoal;
    }).length;

    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;

    const avgHabitCompletion = analyticsData.length > 0 
      ? analyticsData.reduce((acc, day) => acc + day.habitCompletionRate, 0) / analyticsData.length
      : 0;

    const avgProductivity = analyticsData.length > 0
      ? analyticsData.reduce((acc, day) => acc + day.productivityScore, 0) / analyticsData.length
      : 0;

    return {
      habitCompletionToday: totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0,
      taskCompletionOverall: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
      avgHabitCompletion: Math.round(avgHabitCompletion),
      avgProductivity: Math.round(avgProductivity),
      totalActiveDays: analyticsData.filter(d => d.habitCompletionRate > 0 || d.tasksCompleted > 0).length,
    };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const categoryStats = getCategoryStats();
  const priorityStats = getPriorityStats();
  const overallStats = getOverallStats();

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              分析・統計
            </h1>
            <p className="text-muted-foreground">あなたの習慣と生産性を詳しく分析</p>
          </div>
          
          <Select value={timeRange} onValueChange={(value: '7days' | '30days' | '90days') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7日間</SelectItem>
              <SelectItem value="30days">30日間</SelectItem>
              <SelectItem value="90days">90日間</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-medium border-0 bg-gradient-to-br from-success/10 to-success-soft/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-success" />
                <div>
                  <div className="text-2xl font-bold text-success">{overallStats.habitCompletionToday}%</div>
                  <div className="text-xs text-muted-foreground">今日の習慣達成率</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-0 bg-gradient-to-br from-primary/10 to-primary-soft/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">{overallStats.avgProductivity}%</div>
                  <div className="text-xs text-muted-foreground">平均生産性スコア</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-0 bg-gradient-to-br from-warning/10 to-warning-soft/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-warning" />
                <div>
                  <div className="text-2xl font-bold text-warning">{overallStats.taskCompletionOverall}%</div>
                  <div className="text-xs text-muted-foreground">タスク完了率</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-0 bg-gradient-to-br from-secondary/10 to-secondary-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary-accent" />
                <div>
                  <div className="text-2xl font-bold text-secondary-accent">{overallStats.totalActiveDays}</div>
                  <div className="text-xs text-muted-foreground">アクティブな日数</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">トレンド</TabsTrigger>
            <TabsTrigger value="habits">習慣詳細</TabsTrigger>
            <TabsTrigger value="tasks">タスク分析</TabsTrigger>
            <TabsTrigger value="productivity">生産性</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">習慣達成率の推移</CardTitle>
                <CardDescription>過去{timeRange === '7days' ? '7' : timeRange === '30days' ? '30' : '90'}日間の習慣達成状況</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value: number) => [`${value}%`, '達成率']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="habitCompletionRate" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">生産性スコアの推移</CardTitle>
                <CardDescription>習慣とタスクを組み合わせた総合スコア</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value: number) => [`${value}%`, 'スコア']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivityScore" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-4">
            {habitTrends.map((trend, index) => (
              <Card key={index} className="shadow-medium border-0 bg-card/90 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{trend.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Flame className="w-3 h-3 mr-1" />
                        {trend.currentStreak}日連続
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    平均: {trend.averageDaily}/日 | 最長ストリーク: {trend.bestStreak}日
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trend.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value as string)}
                        formatter={(value: number, name: string) => [
                          `${value}${habits.find(h => h.name === trend.name)?.unit || ''}`, 
                          name === 'value' ? '実績' : '目標'
                        ]}
                      />
                      <Bar dataKey="goal" fill="hsl(var(--muted))" opacity={0.3} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">カテゴリ別完了率</CardTitle>
                  <CardDescription>各カテゴリのタスク完了状況</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryStats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{stat.category}</span>
                        <span className="text-muted-foreground">
                          {stat.completed}/{stat.total} ({stat.completionRate}%)
                        </span>
                      </div>
                      <Progress value={stat.completionRate} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">優先度別タスク分布</CardTitle>
                  <CardDescription>優先度ごとのタスク完了状況</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={priorityStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="completed"
                        label={({name, completed, total}: any) => 
                          `${name}: ${completed}/${total}`
                        }
                        fontSize={12}
                      >
                        {priorityStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">タスク完了の推移</CardTitle>
                <CardDescription>日別のタスク完了数</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value: number, name: string) => [
                        value, 
                        name === 'tasksCompleted' ? '完了タスク' : '総タスク'
                      ]}
                    />
                    <Bar dataKey="totalTasks" fill="hsl(var(--muted))" opacity={0.3} />
                    <Bar dataKey="tasksCompleted" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Productivity Tab */}
          <TabsContent value="productivity" className="space-y-4">
            <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">生産性分析</CardTitle>
                <CardDescription>習慣とタスクの相関関係</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value: number, name: string) => {
                        const label = name === 'habitCompletionRate' ? '習慣達成率' : 
                                     name === 'productivityScore' ? '生産性スコア' : name;
                        return [`${value}%`, label];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="habitCompletionRate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="習慣達成率"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivityScore" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="生産性スコア"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="shadow-medium border-0 bg-gradient-to-br from-primary/10 to-primary-soft/20">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-primary mb-1">
                    {overallStats.avgHabitCompletion}%
                  </div>
                  <div className="text-sm text-muted-foreground">平均習慣達成率</div>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-0 bg-gradient-to-br from-success/10 to-success-soft/20">
                <CardContent className="pt-6 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-success" />
                  <div className="text-2xl font-bold text-success mb-1">
                    {Math.max(...habitTrends.map(h => h.bestStreak), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">最長ストリーク</div>
                </CardContent>
              </Card>

              <Card className="shadow-medium border-0 bg-gradient-to-br from-warning/10 to-warning-soft/20">
                <CardContent className="pt-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-warning" />
                  <div className="text-2xl font-bold text-warning mb-1">
                    {habits.reduce((acc, h) => acc + h.totalValue, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">総活動時間</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}