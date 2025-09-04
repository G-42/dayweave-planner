import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, Circle, Target, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  isHabit: boolean;
  habitName?: string;
  completed?: boolean;
  date: string;
  category?: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
}

interface WeeklyViewProps {
  scheduleItems: ScheduleItem[];
  onItemClick: (item: ScheduleItem) => void;
  onAddItem: (date: string) => void;
  onToggleComplete: (itemId: string) => void;
}

export const WeeklyView = ({ scheduleItems, onItemClick, onAddItem, onToggleComplete }: WeeklyViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayItems = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduleItems
      .filter(item => item.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': return 'border-l-success bg-success/5';
      case 'none': return 'border-l-muted-foreground bg-muted/5';
      default: return 'border-l-primary bg-primary/5';
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getCompletionStats = (date: Date) => {
    const items = getDayItems(date);
    const completed = items.filter(item => item.completed).length;
    const total = items.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  return (
    <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">週間スケジュール</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={goToPreviousWeek} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button onClick={goToToday} variant="outline" size="sm" className="px-4">
              今週
            </Button>
            <Button onClick={goToNextWeek} variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(weekStart, 'yyyy年MM月dd日', { locale: ja })} 〜 {format(addDays(weekStart, 6), 'MM月dd日', { locale: ja })}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const dayItems = getDayItems(day);
            const stats = getCompletionStats(day);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={index}
                className={`space-y-2 p-3 rounded-lg border transition-colors ${
                  isCurrentDay 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-background/50 border-border/50'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'E', { locale: ja })}
                    </div>
                    <div className={`text-lg font-bold ${
                      isCurrentDay ? 'text-primary' : 'text-foreground'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onAddItem(format(day, 'yyyy-MM-dd'))}
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Day Stats */}
                {dayItems.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stats.completed}/{stats.total}</span>
                      <span>{Math.round(stats.percentage)}%</span>
                    </div>
                    <div className="w-full bg-secondary/20 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-success to-success-soft h-1 rounded-full transition-smooth" 
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Schedule Items */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {dayItems.length > 0 ? (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded border-l-2 cursor-pointer transition-colors hover:bg-accent/50 ${
                          getPriorityColor(item.priority)
                        } ${item.completed ? 'opacity-75' : ''}`}
                        onClick={() => onItemClick(item)}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(item.id);
                            }}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {item.completed ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${
                              item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {item.title}
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.startTime}〜{item.endTime}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-1">
                              {item.isHabit && (
                                <Badge variant="outline" className="text-xs py-0 px-1 bg-success-soft border-success text-success-foreground">
                                  <Target className="w-2 h-2 mr-1" />
                                  習慣
                                </Badge>
                              )}
                              
                              {item.category && (
                                <Badge variant="outline" className="text-xs py-0 px-1">
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CalendarIcon className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      <div className="text-xs">予定なし</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};