import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleActivity {
  id: string;
  activityId: string;
  title: string;
  startTime: number; // minutes from 00:00
  duration: number;
  color: string;
  icon: React.ReactNode;
  category: string;
}

interface ScheduleViewerProps {
  activities: ScheduleActivity[];
  wakeTime?: number; // default 6:00
  sleepTime?: number; // default 22:00
  title?: string;
}

export const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  activities,
  wakeTime = 6,
  sleepTime = 22,
  title = "今日のスケジュール"
}) => {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    const endTime = sleepTime > wakeTime ? sleepTime : sleepTime + 24;
    
    for (let i = wakeTime; i < endTime; i++) {
      const hour = i % 24;
      slots.push({
        hour: hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        minutes: hour * 60
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline grid - Vertical layout */}
          <div className="space-y-2">
            {timeSlots.map((slot) => (
              <div key={slot.hour} className="flex items-center gap-4">
                <div className="w-12 text-sm text-muted-foreground text-right">
                  {slot.time}
                </div>
                <div className="flex-1 h-12 border border-border rounded relative">
                  {/* Placed activities for this hour */}
                  {activities
                    .filter(activity => {
                      const activityHour = Math.floor(activity.startTime / 60);
                      return activityHour === slot.hour;
                    })
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className={`absolute inset-1 ${activity.color} border rounded px-2 py-1 text-xs font-medium flex items-center gap-1`}
                      >
                        {activity.icon}
                        <span className="truncate">{activity.title}</span>
                        <span className="text-xs opacity-70 ml-auto">
                          {activity.duration}分
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {activities.length > 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded">
            <h4 className="font-medium mb-2">スケジュール概要</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {activities
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
  );
};