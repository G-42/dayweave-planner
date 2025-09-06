import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, TrendingUp, Calendar, Target, Flame, CheckCircle, Plus, Settings, Save, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

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

interface TimerState {
  isRunning: boolean;
  seconds: number;
  activeHabit: string | null;
}

interface ManualInput {
  [habitName: string]: string;
}

interface UnitInput {
  [habitName: string]: string;
}

interface GoalInput {
  [habitName: string]: string;
}

export default function Habits() {
  const { user, loading } = useAuth();
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [manualInputs, setManualInputs] = useState<ManualInput>({});
  const [unitInputs, setUnitInputs] = useState<UnitInput>({});
  const [goalInputs, setGoalInputs] = useState<GoalInput>({});
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    seconds: 0,
    activeHabit: null,
  });

  // Load habits data from Supabase
  const loadHabits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');

      if (error) {
        console.error('Error loading habits:', error);
        return;
      }

      const habitsData = data.map(habit => ({
        name: habit.name,
        totalValue: habit.total_value || 0,
        unit: habit.unit || 'minutes',
        consecutiveDays: habit.consecutive_days || 0,
        lastUpdated: habit.updated_at,
        todayValue: habit.today_value || 0,
        dailyGoal: habit.daily_goal || 30,
        history: (habit.history as { [date: string]: number }) || {},
      }));

      setHabits(habitsData);
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      loadHabits();
    }
  }, [user, loading]);

  // Update daily data when date changes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    setHabits(prev => prev.map(habit => {
      const lastUpdate = habit.lastUpdated ? new Date(habit.lastUpdated).toISOString().split('T')[0] : '';
      
      if (lastUpdate !== today) {
        // New day - reset todayValue and update streak
        const hadProgressYesterday = habit.history[yesterdayStr] > 0;
        const newConsecutiveDays = hadProgressYesterday && lastUpdate === yesterdayStr 
          ? habit.consecutiveDays 
          : 0;

        return {
          ...habit,
          todayValue: habit.history[today] || 0,
          consecutiveDays: newConsecutiveDays,
          history: { ...habit.history, [today]: habit.history[today] || 0 },
        };
      }
      return habit;
    }));
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const updateHabitValue = async (habitName: string, value: number, isTimer = false) => {
    if (!user) return;

    const today = getTodayString();
    
    try {
      // Update local state
      setHabits(prev => prev.map(habit => {
        if (habit.name === habitName) {
          const newTodayValue = habit.todayValue + value;
          const newTotalValue = habit.totalValue + value;
          const isFirstTimeToday = habit.todayValue === 0 && newTodayValue > 0;
          
          return {
            ...habit,
            totalValue: newTotalValue,
            todayValue: newTodayValue,
            lastUpdated: new Date().toISOString(),
            consecutiveDays: isFirstTimeToday ? habit.consecutiveDays + 1 : habit.consecutiveDays,
            history: { ...habit.history, [today]: newTodayValue },
          };
        }
        return habit;
      }));

      // Update in Supabase
      const habit = habits.find(h => h.name === habitName);
      if (habit) {
        const newTodayValue = habit.todayValue + value;
        const newTotalValue = habit.totalValue + value;
        const isFirstTimeToday = habit.todayValue === 0 && newTodayValue > 0;
        const newHistory = { ...habit.history, [today]: newTodayValue };

        const { error } = await supabase
          .from('habits')
          .update({
            total_value: newTotalValue,
            today_value: newTodayValue,
            consecutive_days: isFirstTimeToday ? habit.consecutiveDays + 1 : habit.consecutiveDays,
            history: newHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('name', habitName);

        if (error) {
          console.error('Error updating habit:', error);
        }
      }
    } catch (error) {
      console.error('Failed to update habit:', error);
    }
  };

  const startTimer = (habitName: string) => {
    setTimer({
      isRunning: true,
      seconds: 0,
      activeHabit: habitName,
    });
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    setTimer({
      isRunning: false,
      seconds: 0,
      activeHabit: null,
    });
  };

  const completeSession = () => {
    if (timer.activeHabit) {
      const minutes = Math.floor(timer.seconds / 60);
      if (minutes > 0) {
        updateHabitValue(timer.activeHabit, minutes, true);
      }
      resetTimer();
    }
  };

  const handleManualInput = (habitName: string) => {
    const value = parseFloat(manualInputs[habitName] || '0');
    if (value > 0) {
      updateHabitValue(habitName, value);
      setManualInputs(prev => ({ ...prev, [habitName]: '' }));
    }
  };

  const updateHabitSettings = async (habitName: string) => {
    if (!user) return;

    const newUnit = unitInputs[habitName];
    const newGoal = parseFloat(goalInputs[habitName] || '0');
    
    if (newUnit && newGoal > 0) {
      try {
        // Update local state
        setHabits(prev => prev.map(habit =>
          habit.name === habitName
            ? { ...habit, unit: newUnit, dailyGoal: newGoal }
            : habit
        ));

        // Update in Supabase
        const { error } = await supabase
          .from('habits')
          .update({
            unit: newUnit,
            daily_goal: newGoal,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('name', habitName);

        if (error) {
          console.error('Error updating habit settings:', error);
        }

        setEditingHabit(null);
        setUnitInputs(prev => ({ ...prev, [habitName]: '' }));
        setGoalInputs(prev => ({ ...prev, [habitName]: '' }));
      } catch (error) {
        console.error('Failed to update habit settings:', error);
      }
    }
  };

  const startEditingHabit = (habitName: string, currentUnit: string, currentGoal: number) => {
    setEditingHabit(habitName);
    setUnitInputs(prev => ({ ...prev, [habitName]: currentUnit }));
    setGoalInputs(prev => ({ ...prev, [habitName]: currentGoal.toString() }));
  };

  const cancelEditingHabit = (habitName: string) => {
    setEditingHabit(null);
    setUnitInputs(prev => ({ ...prev, [habitName]: '' }));
    setGoalInputs(prev => ({ ...prev, [habitName]: '' }));
  };

  const getProgressPercentage = (habit: HabitData) => {
    return Math.min((habit.todayValue / habit.dailyGoal) * 100, 100);
  };

  const getStreakEmoji = (days: number) => {
    if (days >= 30) return '🔥';
    if (days >= 14) return '⚡';
    if (days >= 7) return '💪';
    if (days >= 3) return '✨';
    return '';
  };

  // Show loading or auth required state
  if (loading) {
    return (
      <Layout>
        <div className="p-4 text-center">読み込み中...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="p-4 text-center space-y-4">
          <h2 className="text-xl font-bold">ログインが必要です</h2>
          <p className="text-muted-foreground">習慣トラッカーを使用するにはログインしてください。</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            習慣トラッカー
          </h1>
          <p className="text-muted-foreground">継続は力なり</p>
        </div>

        {/* Overall Progress */}
        <Card className="shadow-medium border-0 bg-gradient-to-r from-success/10 to-success-soft/20 backdrop-blur">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Flame className="w-6 h-6 text-warning" />
                <span className="text-lg font-bold text-success-foreground">
                  今日の達成度: {habits.filter(h => getProgressPercentage(h) >= 100).length}/{habits.length}
                </span>
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-success font-bold">
                    {Math.round(habits.reduce((acc, h) => acc + getProgressPercentage(h), 0) / habits.length) || 0}%
                  </div>
                  <div className="text-muted-foreground">平均進捗</div>
                </div>
                <div className="text-center">
                  <div className="text-warning font-bold">
                    {Math.max(...habits.map(h => h.consecutiveDays), 0)}
                  </div>
                  <div className="text-muted-foreground">最長ストリーク</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Card */}
        {timer.activeHabit && (
          <Card className="shadow-large border-0 bg-gradient-to-br from-primary/10 to-primary-glow/20 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-lg text-primary">
                {timer.activeHabit} タイマー
              </CardTitle>
              <CardDescription>
                集中して取り組みましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-mono font-bold text-primary mb-4">
                  {formatTime(timer.seconds)}
                </div>
                
                <div className="flex justify-center gap-2">
                  {timer.isRunning ? (
                    <Button onClick={pauseTimer} variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      一時停止
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setTimer(prev => ({ ...prev, isRunning: true }))} 
                      size="sm" 
                      className="bg-gradient-success"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      開始
                    </Button>
                  )}
                  
                  <Button onClick={resetTimer} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    リセット
                  </Button>
                  
                  <Button 
                    onClick={completeSession} 
                    size="sm" 
                    className="bg-gradient-to-r from-primary to-primary-glow"
                    disabled={timer.seconds < 60}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    完了
                  </Button>
                </div>
                
                {timer.seconds < 60 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    最低1分間は計測してください
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map((habit, index) => {
            const progressPercentage = getProgressPercentage(habit);
            const isCompleted = progressPercentage >= 100;
            const streakEmoji = getStreakEmoji(habit.consecutiveDays);

            return (
              <Card 
                key={index} 
                className={`shadow-medium border-0 backdrop-blur transition-colors ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-success/10 to-success-soft/20' 
                    : 'bg-card/90'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{habit.name}</CardTitle>
                      {streakEmoji && <span className="text-lg">{streakEmoji}</span>}
                      {isCompleted && <CheckCircle className="w-5 h-5 text-success" />}
                    </div>
                    <Button 
                      onClick={() => startTimer(habit.name)}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-primary-glow"
                      disabled={timer.activeHabit === habit.name}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      {timer.activeHabit === habit.name ? '実行中' : '開始'}
                    </Button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        今日の目標: {habit.dailyGoal} {habit.unit}
                      </span>
                      <span className={isCompleted ? 'text-success font-medium' : 'text-foreground'}>
                        {habit.todayValue} / {habit.dailyGoal} {habit.unit}
                      </span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className="h-2"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary-soft/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-primary mb-1">
                        <Target className="w-4 h-4" />
                        <span className="text-xs font-medium">今日</span>
                      </div>
                      <div className="text-lg font-bold text-primary-foreground">
                        {habit.todayValue}
                      </div>
                      <div className="text-xs text-muted-foreground">{habit.unit}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-br from-success/10 to-success-soft/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-success mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium">累計</span>
                      </div>
                      <div className="text-lg font-bold text-success-foreground">
                        {habit.totalValue}
                      </div>
                      <div className="text-xs text-muted-foreground">{habit.unit}</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-br from-warning/10 to-warning-soft/20 rounded-lg">
                      <div className="flex items-center justify-center gap-1 text-warning mb-1">
                        <Flame className="w-4 h-4" />
                        <span className="text-xs font-medium">連続</span>
                      </div>
                      <div className="text-lg font-bold text-warning-foreground">
                        {habit.consecutiveDays}
                      </div>
                      <div className="text-xs text-muted-foreground">日</div>
                    </div>
                  </div>

                  {/* Settings Section */}
                  {editingHabit === habit.name ? (
                    <div className="space-y-3 p-3 bg-accent/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Settings className="w-4 h-4" />
                        習慣設定を編集
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">単位</label>
                          <Input
                            value={unitInputs[habit.name] || ''}
                            onChange={(e) => setUnitInputs(prev => ({ 
                              ...prev, 
                              [habit.name]: e.target.value 
                            }))}
                            placeholder="例: 分、ページ、回"
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">目標値</label>
                          <Input
                            type="number"
                            value={goalInputs[habit.name] || ''}
                            onChange={(e) => setGoalInputs(prev => ({ 
                              ...prev, 
                              [habit.name]: e.target.value 
                            }))}
                            placeholder="目標値"
                            min="0"
                            step="0.1"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateHabitSettings(habit.name)}
                          size="sm"
                          className="bg-gradient-to-r from-success to-success-soft flex-1"
                          disabled={!unitInputs[habit.name] || !goalInputs[habit.name] || parseFloat(goalInputs[habit.name] || '0') <= 0}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          保存
                        </Button>
                        <Button
                          onClick={() => cancelEditingHabit(habit.name)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        設定: {habit.dailyGoal} {habit.unit} / 日
                      </div>
                      <Button
                        onClick={() => startEditingHabit(habit.name, habit.unit, habit.dailyGoal)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        編集
                      </Button>
                    </div>
                  )}

                  {/* Manual Input */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`${habit.unit}を入力`}
                      value={manualInputs[habit.name] || ''}
                      onChange={(e) => setManualInputs(prev => ({ 
                        ...prev, 
                        [habit.name]: e.target.value 
                      }))}
                      className="flex-1"
                      min="0"
                      step="0.1"
                    />
                    <Button 
                      onClick={() => handleManualInput(habit.name)}
                      variant="outline" 
                      size="sm"
                      disabled={!manualInputs[habit.name] || parseFloat(manualInputs[habit.name]) <= 0}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      記録
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {habits.length === 0 && (
          <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
            <CardContent className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">
                習慣が設定されていません
              </p>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">
                習慣を設定する
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}