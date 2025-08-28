import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, TrendingUp, Calendar } from 'lucide-react';

interface HabitData {
  name: string;
  totalValue: number;
  unit: string;
  consecutiveDays: number;
  lastUpdated: string;
  todayValue: number;
}

interface TimerState {
  isRunning: boolean;
  seconds: number;
  activeHabit: string | null;
}

export default function Habits() {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    seconds: 0,
    activeHabit: null,
  });

  useEffect(() => {
    const userData = localStorage.getItem('dayweave-user');
    if (userData) {
      const { habits: habitNames } = JSON.parse(userData);
      // Initialize habit data
      const initialHabits = habitNames.map((name: string) => ({
        name,
        totalValue: 0,
        unit: 'minutes', // Default unit
        consecutiveDays: 0,
        lastUpdated: '',
        todayValue: 0,
      }));
      setHabits(initialHabits);
    }
  }, []);

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
      setHabits(prev => prev.map(habit => 
        habit.name === timer.activeHabit
          ? {
              ...habit,
              totalValue: habit.totalValue + minutes,
              todayValue: habit.todayValue + minutes,
              lastUpdated: new Date().toISOString(),
              consecutiveDays: habit.consecutiveDays + (habit.todayValue === 0 ? 1 : 0),
            }
          : habit
      ));
      resetTimer();
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">習慣トラッカー</h1>
          <p className="text-muted-foreground">継続は力なり</p>
        </div>

        {/* Timer Card */}
        {timer.activeHabit && (
          <Card className="shadow-large border-0 bg-gradient-to-br from-primary/10 to-primary-soft/20 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-lg text-primary">{timer.activeHabit} タイマー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-primary mb-4">
                  {formatTime(timer.seconds)}
                </div>
                
                <div className="flex justify-center gap-2">
                  {timer.isRunning ? (
                    <Button onClick={pauseTimer} variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      一時停止
                    </Button>
                  ) : (
                    <Button onClick={() => setTimer(prev => ({ ...prev, isRunning: true }))} size="sm" className="bg-gradient-to-r from-success to-success">
                      <Play className="w-4 h-4 mr-1" />
                      開始
                    </Button>
                  )}
                  
                  <Button onClick={resetTimer} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    リセット
                  </Button>
                  
                  <Button onClick={completeSession} size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
                    完了
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Habits List */}
        <div className="space-y-4">
          {habits.map((habit, index) => (
            <Card key={index} className="shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{habit.name}</CardTitle>
                  <Button 
                    onClick={() => startTimer(habit.name)}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary-glow"
                    disabled={timer.activeHabit === habit.name}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    開始
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-success/10 to-success-soft/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-success mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">累計</span>
                    </div>
                    <div className="text-lg font-bold text-success-foreground">
                      {habit.totalValue} {habit.unit}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-gradient-to-br from-warning/10 to-warning-soft/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-warning mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">連続日数</span>
                    </div>
                    <div className="text-lg font-bold text-warning-foreground">
                      {habit.consecutiveDays} 日
                    </div>
                  </div>
                </div>

                {/* Today's Progress */}
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium">今日の記録</span>
                  <Badge variant="outline" className="bg-primary-soft border-primary text-primary-foreground">
                    {habit.todayValue} {habit.unit}
                  </Badge>
                </div>

                {/* Manual Input */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={`${habit.unit}を入力`}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm">
                    記録
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}