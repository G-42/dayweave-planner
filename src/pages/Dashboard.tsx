import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Plus, CheckCircle, Circle, Zap, Sun, Moon, Briefcase, Target, TrendingUp } from 'lucide-react';

interface UserData {
  name: string;
  habits: string[];
}

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  isHabit: boolean;
  habitName?: string;
  completed?: boolean;
}

interface Template {
  id: string;
  name: string;
  items: ScheduleItem[];
}

interface HabitProgress {
  habitName: string;
  completed: boolean;
  scheduledTime?: string;
  todayValue: number;
  dailyGoal: number;
  unit: string;
  progressPercentage: number;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [habitProgress, setHabitProgress] = useState<HabitProgress[]>([]);
  const [todosToday, setTodosToday] = useState<TodoItem[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('dayweave-user');
    const templatesData = localStorage.getItem('dayweave-templates');
    const habitsData = localStorage.getItem('dayweave-habits');
    const todosData = localStorage.getItem('dayweave-todos');
    
    if (data) {
      const user = JSON.parse(data);
      setUserData(user);
    }
    
    if (templatesData) {
      setTemplates(JSON.parse(templatesData));
    }

    // Load habits data with actual progress
    if (habitsData) {
      const habits = JSON.parse(habitsData);
      const today = new Date().toISOString().split('T')[0];
      
      const progressData = habits.map((habit: any) => {
        const progressPercentage = Math.min((habit.todayValue / habit.dailyGoal) * 100, 100);
        return {
          habitName: habit.name,
          completed: progressPercentage >= 100,
          todayValue: habit.todayValue,
          dailyGoal: habit.dailyGoal,
          unit: habit.unit,
          progressPercentage,
        };
      });
      setHabitProgress(progressData);
    } else if (data) {
      // Fallback for initial setup
      const user = JSON.parse(data);
      const progress = user.habits.map((habit: string) => ({
        habitName: habit,
        completed: false,
        todayValue: 0,
        dailyGoal: 30,
        unit: 'minutes',
        progressPercentage: 0,
      }));
      setHabitProgress(progress);
    }

    // Load today's important todos
    if (todosData) {
      const todos = JSON.parse(todosData);
      const today = new Date().toISOString().split('T')[0];
      
      // Filter for today's important tasks (high priority, due today, or overdue)
      const importantTodos = todos.filter((todo: any) => {
        if (todo.completed) return false;
        if (todo.priority === 'high') return true;
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          const todayDate = new Date(today);
          return dueDate <= todayDate;
        }
        return false;
      }).slice(0, 5); // Show max 5 important todos

      setTodosToday(importantTodos);
    }
  }, []);

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Add completed status to items
      const scheduleWithStatus = template.items.map(item => ({
        ...item,
        completed: false,
      }));
      setTodaySchedule(scheduleWithStatus);
      
      // Update habit progress with scheduled times
      const updatedProgress = habitProgress.map(progress => {
        const habitItem = template.items.find(item => 
          item.isHabit && item.habitName === progress.habitName
        );
        return {
          ...progress,
          scheduledTime: habitItem ? `${habitItem.startTime}〜${habitItem.endTime}` : undefined,
        };
      });
      setHabitProgress(updatedProgress);
    }
  };

  const toggleScheduleItem = (itemId: string) => {
    setTodaySchedule(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
    
    // Update habit progress if it's a habit
    const item = todaySchedule.find(item => item.id === itemId);
    if (item && item.isHabit && item.habitName) {
      setHabitProgress(prev => prev.map(progress =>
        progress.habitName === item.habitName 
          ? { ...progress, completed: !item.completed }
          : progress
      ));
    }
  };

  const toggleHabit = (habitName: string) => {
    setHabitProgress(prev => prev.map(progress =>
      progress.habitName === habitName 
        ? { ...progress, completed: !progress.completed }
        : progress
    ));
    
    // Update schedule item if it exists
    const habitItem = todaySchedule.find(item => 
      item.isHabit && item.habitName === habitName
    );
    if (habitItem) {
      toggleScheduleItem(habitItem.id);
    }
  };

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'holiday-a': return <Sun className="w-4 h-4" />;
      case 'holiday-b': return <Zap className="w-4 h-4" />;
      case 'workday': return <Briefcase className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const completedHabits = habitProgress.filter(h => h.completed).length;
  const totalHabits = habitProgress.length;
  const habitCompletionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

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

  if (!userData) {
    return null;
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {getGreeting()}、{userData.name}さん
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{currentDate}</span>
          </div>
        </div>

        {/* Habit Progress Overview */}
        <Card className="shadow-medium border-0 bg-gradient-to-r from-success/10 to-success-soft/20 backdrop-blur">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-success">
                {completedHabits}/{totalHabits}
              </div>
              <div className="text-sm text-success-foreground">
                今日の習慣達成率 {Math.round(habitCompletionRate)}%
              </div>
              <div className="w-full bg-secondary/20 rounded-full h-2">
                <div 
                  className="bg-gradient-success h-2 rounded-full transition-smooth" 
                  style={{ width: `${habitCompletionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Selection */}
        {templates.length > 0 && (
          <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">今日のテンプレート</CardTitle>
              <CardDescription>スケジュールテンプレートを選択してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="テンプレートを選択" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.id)}
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedTemplate && (
                <Button
                  onClick={() => applyTemplate(selectedTemplate)}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                >
                  このテンプレートを適用
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">今日のスケジュール</CardTitle>
                <CardDescription>
                  {todaySchedule.length > 0 
                    ? `${todaySchedule.filter(item => item.completed).length}/${todaySchedule.length} 完了`
                    : 'スケジュールを設定しましょう'
                  }
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary-soft">
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    item.completed 
                      ? 'bg-success-soft/20 border-success/30' 
                      : 'border-border hover:bg-accent/50'
                  }`}
                  onClick={() => toggleScheduleItem(item.id)}
                >
                  <div className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                    <Clock className="w-4 h-4" />
                    {item.startTime}〜{item.endTime}
                  </div>
                  <div className="flex-1">
                    <span className={`${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.title}
                    </span>
                  </div>
                  {item.isHabit && (
                    <Badge variant="outline" className="text-xs bg-success-soft border-success text-success-foreground">
                      習慣: {item.habitName}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">今日のスケジュールを設定しましょう</p>
                {templates.length === 0 ? (
                  <Button className="mt-3 bg-gradient-to-r from-primary to-primary-glow">
                    スケジュール作成
                  </Button>
                ) : (
                  <p className="text-xs mt-2">上のテンプレートから選択してください</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits Detailed Progress */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">習慣の進捗</CardTitle>
            <CardDescription>今日の習慣達成状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {habitProgress.map((progress, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${
                    progress.completed
                      ? 'bg-gradient-to-r from-success/10 to-success-soft/20 border-success/30'
                      : 'bg-gradient-to-r from-secondary/10 to-secondary-accent/20 border-secondary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {progress.completed ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Target className="w-5 h-5 text-secondary-accent" />
                      )}
                      <div>
                        <span className={`font-medium ${
                          progress.completed 
                            ? 'text-success-foreground' 
                            : 'text-secondary-foreground'
                        }`}>
                          {progress.habitName}
                        </span>
                        {progress.scheduledTime && (
                          <div className="text-xs text-muted-foreground">
                            予定: {progress.scheduledTime}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        progress.completed
                          ? 'bg-success text-success-foreground border-success'
                          : 'border-secondary text-secondary-foreground'
                      }`}
                    >
                      {progress.todayValue}/{progress.dailyGoal} {progress.unit}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">進捗</span>
                      <span className={progress.completed ? 'text-success font-medium' : 'text-foreground'}>
                        {Math.round(progress.progressPercentage)}%
                      </span>
                    </div>
                    <Progress 
                      value={progress.progressPercentage} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Todos Today */}
        {todosToday.length > 0 && (
          <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">重要なタスク</CardTitle>
              <CardDescription>
                優先度が高い、または期限が迫っているタスク
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todosToday.map((todo) => {
                  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();
                  const isDueToday = todo.dueDate && new Date(todo.dueDate).toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={todo.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isOverdue
                          ? 'bg-destructive/10 border-destructive/30'
                          : isDueToday
                          ? 'bg-warning/10 border-warning/30'
                          : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {todo.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              todo.priority === 'high' 
                                ? 'text-destructive border-destructive bg-destructive/10'
                                : todo.priority === 'medium'
                                ? 'text-warning border-warning bg-warning/10'
                                : 'text-success border-success bg-success/10'
                            }`}
                          >
                            {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}優先度
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs">
                            {todo.category}
                          </Badge>
                          
                          {todo.dueDate && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                isOverdue 
                                  ? 'text-destructive border-destructive bg-destructive/10' 
                                  : isDueToday
                                  ? 'text-warning border-warning bg-warning/10'
                                  : 'text-primary border-primary bg-primary/10'
                              }`}
                            >
                              {isOverdue ? '期限切れ' : isDueToday ? '今日期限' : '期限: ' + new Date(todo.dueDate).toLocaleDateString('ja-JP')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-primary border-primary hover:bg-primary-soft"
                >
                  すべてのタスクを表示
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Summary */}
        <Card className="shadow-medium border-0 bg-gradient-to-r from-primary/10 to-primary-glow/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">今日のまとめ</CardTitle>
            <CardDescription>本日の活動状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-success">{completedHabits}</div>
                <div className="text-xs text-muted-foreground">完了した習慣</div>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {todaySchedule.filter(item => item.completed).length}
                </div>
                <div className="text-xs text-muted-foreground">完了したスケジュール</div>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-warning">{todosToday.length}</div>
                <div className="text-xs text-muted-foreground">重要なタスク</div>
              </div>
              
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-secondary-accent">
                  {Math.round(habitProgress.reduce((acc, h) => acc + h.progressPercentage, 0) / habitProgress.length) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">平均達成率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}