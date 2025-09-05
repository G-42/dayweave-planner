import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, CheckSquare, Square } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

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

interface GoalHierarchyProps {
  goal: BigGoal;
  onAddMonthlyGoal: (bigGoalId: string, title: string, targetDate: string) => void;
  onAddWeeklyGoal: (monthlyGoalId: string, title: string, targetDate: string) => void;
  onAddDailyTask: (weeklyGoalId: string, title: string) => void;
  onToggleDailyTask: (taskId: string) => void;
}

export const GoalHierarchy = ({ 
  goal, 
  onAddMonthlyGoal, 
  onAddWeeklyGoal, 
  onAddDailyTask, 
  onToggleDailyTask 
}: GoalHierarchyProps) => {
  const [showAddMonthly, setShowAddMonthly] = useState(false);
  const [showAddWeekly, setShowAddWeekly] = useState<string | null>(null);
  const [showAddDaily, setShowAddDaily] = useState<string | null>(null);
  
  const [newMonthlyTitle, setNewMonthlyTitle] = useState('');
  const [newMonthlyDate, setNewMonthlyDate] = useState('');
  const [newWeeklyTitle, setNewWeeklyTitle] = useState('');
  const [newWeeklyDate, setNewWeeklyDate] = useState('');
  const [newDailyTitle, setNewDailyTitle] = useState('');

  const handleAddMonthly = () => {
    if (newMonthlyTitle.trim() && newMonthlyDate) {
      onAddMonthlyGoal(goal.id, newMonthlyTitle, newMonthlyDate);
      setNewMonthlyTitle('');
      setNewMonthlyDate('');
      setShowAddMonthly(false);
    }
  };

  const handleAddWeekly = (monthlyId: string) => {
    if (newWeeklyTitle.trim() && newWeeklyDate) {
      onAddWeeklyGoal(monthlyId, newWeeklyTitle, newWeeklyDate);
      setNewWeeklyTitle('');
      setNewWeeklyDate('');
      setShowAddWeekly(null);
    }
  };

  const handleAddDaily = (weeklyId: string) => {
    if (newDailyTitle.trim()) {
      onAddDailyTask(weeklyId, newDailyTitle);
      setNewDailyTitle('');
      setShowAddDaily(null);
    }
  };

  const getTodayTasks = (weeklyGoal: WeeklyGoal) => {
    const today = new Date().toISOString().split('T')[0];
    return weeklyGoal.dailyTasks.filter(task => task.date === today);
  };

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Monthly Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-primary">月目標</h4>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAddMonthly(!showAddMonthly)}
          >
            <Plus className="w-3 h-3 mr-1" />
            月目標を追加
          </Button>
        </div>

        {/* Add Monthly Goal Form */}
        {showAddMonthly && (
          <Card className="bg-background/50 border-dashed">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="月目標の内容"
                value={newMonthlyTitle}
                onChange={(e) => setNewMonthlyTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newMonthlyDate}
                  onChange={(e) => setNewMonthlyDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Button size="sm" onClick={handleAddMonthly}>追加</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddMonthly(false)}>
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Goals List */}
        {goal.monthlyGoals.map(monthly => (
          <Card key={monthly.id} className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{monthly.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(monthly.targetDate), 'MM/dd', { locale: ja })}まで
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowAddWeekly(showAddWeekly === monthly.id ? null : monthly.id)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  週目標
                </Button>
              </div>

              {/* Add Weekly Goal Form */}
              {showAddWeekly === monthly.id && (
                <Card className="bg-background/50 border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      placeholder="週目標の内容"
                      value={newWeeklyTitle}
                      onChange={(e) => setNewWeeklyTitle(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={newWeeklyDate}
                        onChange={(e) => setNewWeeklyDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Button size="sm" onClick={() => handleAddWeekly(monthly.id)}>追加</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddWeekly(null)}>
                        キャンセル
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Goals */}
              {monthly.weeklyGoals.map(weekly => {
                const todayTasks = getTodayTasks(weekly);
                const completedTodayTasks = todayTasks.filter(task => task.completed).length;
                
                return (
                  <Card key={weekly.id} className="bg-warning/5 border-warning/20 ml-4">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-warning" />
                          <span className="font-medium text-sm">{weekly.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(weekly.targetDate), 'MM/dd', { locale: ja })}まで
                          </Badge>
                          {todayTasks.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-success/10 border-success text-success">
                              今日: {completedTodayTasks}/{todayTasks.length}
                            </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowAddDaily(showAddDaily === weekly.id ? null : weekly.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          今日のタスク
                        </Button>
                      </div>

                      {/* Add Daily Task Form */}
                      {showAddDaily === weekly.id && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="今日のタスク"
                            value={newDailyTitle}
                            onChange={(e) => setNewDailyTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddDaily(weekly.id)}
                          />
                          <Button size="sm" onClick={() => handleAddDaily(weekly.id)}>追加</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowAddDaily(null)}>
                            キャンセル
                          </Button>
                        </div>
                      )}

                      {/* Today's Tasks */}
                      {todayTasks.length > 0 && (
                        <div className="space-y-2 ml-4">
                          <h6 className="text-xs font-medium text-muted-foreground">今日のタスク</h6>
                          {todayTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => onToggleDailyTask(task.id)}
                                className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                              />
                              <span className={`text-sm ${task.completed ? 'line-through opacity-60' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {monthly.weeklyGoals.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  週目標がありません
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {goal.monthlyGoals.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            月目標がありません
          </div>
        )}
      </div>
    </div>
  );
};