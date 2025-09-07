import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Utensils, 
  Droplets, 
  Dumbbell, 
  Moon, 
  Coffee, 
  Car, 
  BookOpen, 
  Users,
  Trash2,
  Edit3,
  Plus,
  Clock
} from 'lucide-react';

interface ScheduleActivity {
  id: string;
  title: string;
  duration: number; // in minutes
  icon: React.ReactNode;
  color: string;
  category: string;
}

interface PlacedActivity {
  id: string;
  activityId: string;
  title: string;
  startTime: number; // minutes from 00:00
  duration: number;
  color: string;
  icon: React.ReactNode;
  category: string;
}

interface DragDropScheduleBuilderProps {
  onScheduleChange: (activities: PlacedActivity[]) => void;
  initialSchedule?: PlacedActivity[];
}

const defaultActivities: ScheduleActivity[] = [
  { id: 'sleep', title: '睡眠', duration: 480, icon: <Moon className="w-4 h-4" />, color: 'bg-indigo-100 border-indigo-300 text-indigo-800', category: 'daily' },
  { id: 'breakfast', title: '朝食', duration: 30, icon: <Coffee className="w-4 h-4" />, color: 'bg-orange-100 border-orange-300 text-orange-800', category: 'meals' },
  { id: 'lunch', title: '昼食', duration: 30, icon: <Utensils className="w-4 h-4" />, color: 'bg-orange-100 border-orange-300 text-orange-800', category: 'meals' },
  { id: 'dinner', title: '夕食', duration: 30, icon: <Utensils className="w-4 h-4" />, color: 'bg-orange-100 border-orange-300 text-orange-800', category: 'meals' },
  { id: 'shower', title: 'シャワー', duration: 15, icon: <Droplets className="w-4 h-4" />, color: 'bg-blue-100 border-blue-300 text-blue-800', category: 'daily' },
  { id: 'workout', title: 'トレーニング', duration: 120, icon: <Dumbbell className="w-4 h-4" />, color: 'bg-green-100 border-green-300 text-green-800', category: 'health' },
  { id: 'commute', title: '通勤', duration: 60, icon: <Car className="w-4 h-4" />, color: 'bg-gray-100 border-gray-300 text-gray-800', category: 'transport' },
  { id: 'work', title: '仕事', duration: 480, icon: <BookOpen className="w-4 h-4" />, color: 'bg-purple-100 border-purple-300 text-purple-800', category: 'work' },
  { id: 'meeting', title: 'ミーティング', duration: 60, icon: <Users className="w-4 h-4" />, color: 'bg-red-100 border-red-300 text-red-800', category: 'work' },
];

export const DragDropScheduleBuilder: React.FC<DragDropScheduleBuilderProps> = ({
  onScheduleChange,
  initialSchedule = []
}) => {
  const [activities, setActivities] = useState<ScheduleActivity[]>(defaultActivities);
  const [placedActivities, setPlacedActivities] = useState<PlacedActivity[]>(initialSchedule);
  const [draggedActivity, setDraggedActivity] = useState<ScheduleActivity | null>(null);
  const [editingActivity, setEditingActivity] = useState<ScheduleActivity | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push({
        hour: i,
        time: `${i.toString().padStart(2, '0')}:00`,
        minutes: i * 60
      });
    }
    return slots;
  };

  const handleDragStart = (activity: ScheduleActivity) => {
    setDraggedActivity(activity);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetTime: number) => {
    e.preventDefault();
    
    if (!draggedActivity) return;

    // Check for conflicts
    const hasConflict = placedActivities.some(activity => {
      const activityEnd = activity.startTime + activity.duration;
      const newEnd = targetTime + draggedActivity.duration;
      
      return (
        (targetTime >= activity.startTime && targetTime < activityEnd) ||
        (newEnd > activity.startTime && newEnd <= activityEnd) ||
        (targetTime <= activity.startTime && newEnd >= activityEnd)
      );
    });

    if (hasConflict) {
      alert('この時間帯は既に予定が入っています');
      return;
    }

    // Check if goes beyond 24 hours
    if (targetTime + draggedActivity.duration > 1440) {
      alert('24時間を超える予定は設定できません');
      return;
    }

    const newActivity: PlacedActivity = {
      id: Date.now().toString(),
      activityId: draggedActivity.id,
      title: draggedActivity.title,
      startTime: targetTime,
      duration: draggedActivity.duration,
      color: draggedActivity.color,
      icon: draggedActivity.icon,
      category: draggedActivity.category
    };

    const newPlacedActivities = [...placedActivities, newActivity];
    setPlacedActivities(newPlacedActivities);
    onScheduleChange(newPlacedActivities);
    setDraggedActivity(null);
  };

  const handleRemoveActivity = (id: string) => {
    const newPlacedActivities = placedActivities.filter(activity => activity.id !== id);
    setPlacedActivities(newPlacedActivities);
    onScheduleChange(newPlacedActivities);
  };

  const handleEditActivityDuration = (activityId: string, newDuration: number) => {
    setActivities(activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, duration: newDuration }
        : activity
    ));
    setEditingActivity(null);
  };

  const handleAddCustomActivity = () => {
    const title = prompt('アクティビティ名を入力してください');
    const duration = prompt('時間（分）を入力してください');
    
    if (title && duration && !isNaN(Number(duration))) {
      const newActivity: ScheduleActivity = {
        id: Date.now().toString(),
        title,
        duration: Number(duration),
        icon: <Clock className="w-4 h-4" />,
        color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        category: 'custom'
      };
      
      setActivities([...activities, newActivity]);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      {/* Timeline - Top */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">24時間タイムライン</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={timelineRef}>
            {/* Time labels */}
            <div className="flex mb-4">
              {timeSlots.map((slot) => (
                <div key={slot.hour} className="flex-1 text-xs text-center text-muted-foreground py-1 border-r border-border last:border-r-0">
                  {slot.hour}
                </div>
              ))}
            </div>

            {/* Timeline grid - Vertical layout */}
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div key={slot.hour} className="flex items-center gap-4">
                  <div className="w-12 text-sm text-muted-foreground text-right">
                    {slot.time}
                  </div>
                  <div
                    className="flex-1 h-12 border border-border rounded hover:bg-muted/30 transition-colors cursor-pointer relative"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slot.minutes)}
                  >
                    {/* Placed activities for this hour */}
                    {placedActivities
                      .filter(activity => {
                        const activityHour = Math.floor(activity.startTime / 60);
                        return activityHour === slot.hour;
                      })
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className={`absolute inset-1 ${activity.color} border rounded px-2 py-1 text-xs font-medium flex items-center gap-1 group cursor-pointer`}
                        >
                          {activity.icon}
                          <span className="truncate">{activity.title}</span>
                          <span className="text-xs opacity-70 ml-auto">
                            {activity.duration}分
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => handleRemoveActivity(activity.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {placedActivities.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 rounded">
              <h4 className="font-medium mb-2">スケジュール概要</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {placedActivities
                  .sort((a, b) => a.startTime - b.startTime)
                  .map((activity) => (
                    <div key={activity.id} className="flex items-center gap-2">
                      {activity.icon}
                      <span>{activity.title}</span>
                      <span className="text-muted-foreground">
                        {formatTime(activity.startTime)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Templates - Bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4" />
            アクティビティ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`${activity.color} border-2 border-dashed p-3 rounded-lg cursor-grab hover:opacity-80 transition-opacity`}
                draggable
                onDragStart={() => handleDragStart(activity)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {activity.icon}
                  <span className="font-medium text-sm">{activity.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">{activity.duration}分</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditingActivity(activity)}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
                {editingActivity?.id === activity.id && (
                  <div className="mt-2 flex gap-1">
                    <Input
                      type="number"
                      defaultValue={activity.duration}
                      className="h-6 text-xs"
                      onBlur={(e) => handleEditActivityDuration(activity.id, Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditActivityDuration(activity.id, Number((e.target as HTMLInputElement).value));
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            <div
              className="border-2 border-dashed border-muted-foreground/30 p-3 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors flex flex-col items-center justify-center text-center"
              onClick={handleAddCustomActivity}
            >
              <Plus className="w-6 h-6 mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">カスタム</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};