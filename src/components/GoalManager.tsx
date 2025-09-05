import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Calendar, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { format, addMonths, addWeeks, isAfter, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';
import { GoalHierarchy } from './GoalHierarchy';
import { Fireworks } from './Fireworks';
import { toast } from '@/hooks/use-toast';

interface DailyTask {
  id: string;
  weeklyGoalId: string;
  title: string;
  completed: boolean;
  date: string;
}

interface WeeklyGoal {
  id: string;
  monthlyGoalId: string;
  title: string;
  targetDate: string;
  completed: boolean;
  dailyTasks: DailyTask[];
}

interface MonthlyGoal {
  id: string;
  bigGoalId: string;
  title: string;
  targetDate: string;
  completed: boolean;
  weeklyGoals: WeeklyGoal[];
}

interface BigGoal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  createdAt: string;
  monthlyGoals: MonthlyGoal[];
}

const units = ['kg', '点', '冊', '時間', '回', 'km', '％', 'その他'];

export const GoalManager = () => {
  const [bigGoals, setBigGoals] = useState<BigGoal[]>([]);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [completedGoalTitle, setCompletedGoalTitle] = useState('');
  
  // Add form states
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newTargetValue, setNewTargetValue] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dayweave-goals');
    if (saved) {
      setBigGoals(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (bigGoals.length >= 0) {
      localStorage.setItem('dayweave-goals', JSON.stringify(bigGoals));
    }
  }, [bigGoals]);

  // Check for expired goals and completed goals
  useEffect(() => {
    const now = new Date();
    const expiredGoals: BigGoal[] = [];
    const completedGoals: BigGoal[] = [];
    
    bigGoals.forEach(goal => {
      const deadline = new Date(goal.deadline);
      const progress = getProgress(goal);
      
      // Check if goal is completed (100% progress)
      if (progress >= 100 && goal.currentValue >= goal.targetValue && !completedGoals.some(cg => cg.id === goal.id)) {
        completedGoals.push(goal);
      }
      
      // Check if goal is expired
      if (deadline < now && !expiredGoals.some(eg => eg.id === goal.id)) {
        expiredGoals.push(goal);
      }
    });

    // Handle completed goals
    if (completedGoals.length > 0) {
      const firstCompleted = completedGoals[0];
      setCompletedGoalTitle(firstCompleted.title);
      setShowFireworks(true);
    }

    // Handle expired goals
    expiredGoals.forEach(goal => {
      const achievementPercentage = Math.round(getProgress(goal));
      toast({
        title: "目標期限終了",
        description: `「${goal.title}」は${achievementPercentage}%達成しました！`,
        duration: 5000,
      });
      
      // Remove expired goal after showing message
      setBigGoals(prev => prev.filter(g => g.id !== goal.id));
    });
  }, [bigGoals]);

  const addBigGoal = () => {
    if (newGoalTitle.trim() && newTargetValue && newUnit && newDeadline) {
      const goal: BigGoal = {
        id: Date.now().toString(),
        title: newGoalTitle.trim(),
        targetValue: parseFloat(newTargetValue),
        currentValue: 0,
        unit: newUnit,
        deadline: newDeadline,
        createdAt: new Date().toISOString(),
        monthlyGoals: [],
      };
      setBigGoals([...bigGoals, goal]);
      setNewGoalTitle('');
      setNewTargetValue('');
      setNewUnit('');
      setNewDeadline('');
      setShowAddForm(false);
    }
  };

  const addMonthlyGoal = (bigGoalId: string, title: string, targetDate: string) => {
    setBigGoals(bigGoals.map(goal => 
      goal.id === bigGoalId
        ? {
            ...goal,
            monthlyGoals: [...goal.monthlyGoals, {
              id: Date.now().toString(),
              bigGoalId,
              title: title.trim(),
              targetDate,
              completed: false,
              weeklyGoals: [],
            }]
          }
        : goal
    ));
  };

  const addWeeklyGoal = (monthlyGoalId: string, title: string, targetDate: string) => {
    setBigGoals(bigGoals.map(goal => ({
      ...goal,
      monthlyGoals: goal.monthlyGoals.map(monthly =>
        monthly.id === monthlyGoalId
          ? {
              ...monthly,
              weeklyGoals: [...monthly.weeklyGoals, {
                id: Date.now().toString(),
                monthlyGoalId,
                title: title.trim(),
                targetDate,
                completed: false,
                dailyTasks: [],
              }]
            }
          : monthly
      )
    })));
  };

  const addDailyTask = (weeklyGoalId: string, title: string) => {
    const today = new Date().toISOString().split('T')[0];
    setBigGoals(bigGoals.map(goal => ({
      ...goal,
      monthlyGoals: goal.monthlyGoals.map(monthly => ({
        ...monthly,
        weeklyGoals: monthly.weeklyGoals.map(weekly =>
          weekly.id === weeklyGoalId
            ? {
                ...weekly,
                dailyTasks: [...weekly.dailyTasks, {
                  id: Date.now().toString(),
                  weeklyGoalId,
                  title: title.trim(),
                  completed: false,
                  date: today,
                }]
              }
            : weekly
        )
      }))
    })));
  };

  const toggleDailyTask = (taskId: string) => {
    setBigGoals(bigGoals.map(goal => ({
      ...goal,
      monthlyGoals: goal.monthlyGoals.map(monthly => ({
        ...monthly,
        weeklyGoals: monthly.weeklyGoals.map(weekly => ({
          ...weekly,
          dailyTasks: weekly.dailyTasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        }))
      }))
    })));
  };

  const updateCurrentValue = (goalId: string, value: number) => {
    setBigGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, currentValue: value };
        const progress = (value / goal.targetValue) * 100;
        
        // Check if goal just got completed
        if (progress >= 100 && value >= goal.targetValue && goal.currentValue < goal.targetValue) {
          setCompletedGoalTitle(goal.title);
          setShowFireworks(true);
        }
        
        return updatedGoal;
      }
      return goal;
    }));
  };

  const toggleExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const getProgress = (goal: BigGoal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '期限切れ';
    if (diffDays === 0) return '今日まで';
    if (diffDays === 1) return '明日まで';
    if (diffDays < 7) return `${diffDays}日後`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}週間後`;
    return `${Math.ceil(diffDays / 30)}ヶ月後`;
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks: DailyTask[] = [];
    
    bigGoals.forEach(goal => {
      goal.monthlyGoals.forEach(monthly => {
        monthly.weeklyGoals.forEach(weekly => {
          weekly.dailyTasks.forEach(task => {
            if (task.date === today) {
              tasks.push(task);
            }
          });
        });
      });
    });
    
    return tasks;
  };

  const todayTasks = getTodayTasks();
  const completedTodayTasks = todayTasks.filter(task => task.completed).length;

  const handleFireworksComplete = () => {
    setShowFireworks(false);
    setCompletedGoalTitle('');
  };

  return (
    <div className="space-y-6">
      <Fireworks show={showFireworks} onComplete={handleFireworksComplete} />
      {/* Today's Tasks Summary */}
      {todayTasks.length > 0 && (
        <Card className="shadow-medium border-0 bg-gradient-to-r from-primary/10 to-primary-soft/20 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">今日のタスク</h3>
                <p className="text-sm text-muted-foreground">
                  {completedTodayTasks} / {todayTasks.length} 完了
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((completedTodayTasks / todayTasks.length) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">達成率</div>
              </div>
            </div>
            <Progress 
              value={(completedTodayTasks / todayTasks.length) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>
      )}

      {/* Add Goal Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">大きな目標</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-primary to-primary-glow"
        >
          <Plus className="w-4 h-4 mr-2" />
          目標を追加
        </Button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">新しい大きな目標</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="目標の内容（例：体重を減らす、TOEICスコアを上げる）"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                type="number"
                placeholder="目標値"
                value={newTargetValue}
                onChange={(e) => setNewTargetValue(e.target.value)}
              />
              <Select value={newUnit} onValueChange={setNewUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="単位を選択" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={addBigGoal}
                disabled={!newGoalTitle.trim() || !newTargetValue || !newUnit || !newDeadline}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                目標を作成
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {bigGoals.map(goal => {
          const progress = getProgress(goal);
          const timeRemaining = getTimeRemaining(goal.deadline);
          const isExpanded = expandedGoals.has(goal.id);
          
          return (
            <Card key={goal.id} className="shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Goal Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(goal.id)}
                          className="p-0 h-auto"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {goal.targetValue}{goal.unit}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>現在値: {goal.currentValue}{goal.unit}</span>
                        <span>期限: {getTimeRemaining(goal.deadline)}</span>
                        <span>達成率: {Math.round(progress)}%</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            目標まで {goal.targetValue - goal.currentValue}{goal.unit}
                          </span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="現在値"
                              className="w-20 h-8 text-xs"
                              value={goal.currentValue}
                              onChange={(e) => updateCurrentValue(goal.id, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-xs text-muted-foreground">{goal.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <GoalHierarchy 
                      goal={goal}
                      onAddMonthlyGoal={addMonthlyGoal}
                      onAddWeeklyGoal={addWeeklyGoal}
                      onAddDailyTask={addDailyTask}
                      onToggleDailyTask={toggleDailyTask}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {bigGoals.length === 0 && !showAddForm && (
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardContent className="pt-12 pb-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-2">まだ目標がありません</p>
            <p className="text-sm text-muted-foreground">大きな目標を設定して達成に向けて進めましょう</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
