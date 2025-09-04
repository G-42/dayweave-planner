import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScheduleManager } from '@/components/ScheduleManager';
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
  const [habitProgress, setHabitProgress] = useState<HabitProgress[]>([]);
  const [todosToday, setTodosToday] = useState<TodoItem[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('dayweave-user');
    const habitsData = localStorage.getItem('dayweave-habits');
    const todosData = localStorage.getItem('dayweave-todos');
    
    if (data) {
      const user = JSON.parse(data);
      setUserData(user);
    }

    // Load habits data with actual progress
    if (habitsData) {
      const habits = JSON.parse(habitsData);
      
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
      
      // Filter for today's important tasks (high priority, due today, or overdue)
      const importantTodos = todos.filter((todo: any) => {
        if (todo.completed) return false;
        if (todo.priority === 'high') return true;
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          const todayDate = new Date();
          return dueDate <= todayDate;
        }
        return false;
      }).slice(0, 5); // Show max 5 important todos

      setTodosToday(importantTodos);
    }
  }, []);

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

        {/* Enhanced Schedule Manager */}
        <ScheduleManager habits={userData.habits} />

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
                  {/* Schedule completion will be handled by ScheduleManager */}
                  0
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