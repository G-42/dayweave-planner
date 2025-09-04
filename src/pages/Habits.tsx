import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, TrendingUp, Calendar, Target, Flame, CheckCircle, Plus } from 'lucide-react';

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

export default function Habits() {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [manualInputs, setManualInputs] = useState<ManualInput>({});
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    seconds: 0,
    activeHabit: null,
  });

  // Load habits data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('dayweave-user');
    const habitsData = localStorage.getItem('dayweave-habits');
    
    if (userData) {
      const { habits: habitNames } = JSON.parse(userData);
      
      if (habitsData) {
        // Load existing habit data
        const savedHabits = JSON.parse(habitsData);
        setHabits(savedHabits);
      } else {
        // Initialize new habit data
        const today = new Date().toISOString().split('T')[0];
        const initialHabits = habitNames.map((name: string) => ({
          name,
          totalValue: 0,
          unit: name.includes('読書') ? 'ページ' : 'minutes',
          consecutiveDays: 0,
          lastUpdated: '',
          todayValue: 0,
          dailyGoal: name.includes('読書') ? 30 : 30, // 30 pages or 30 minutes
          history: { [today]: 0 },
        }));
        setHabits(initialHabits);
      }
    }
  }, []);

  // Save habits data to localStorage whenever it changes
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('dayweave-habits', JSON.stringify(habits));
    }
  }, [habits]);

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

  const updateHabitValue = (habitName: string, value: number, isTimer = false) => {
    const today = getTodayString();
    
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