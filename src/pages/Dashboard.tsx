import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus } from 'lucide-react';

interface UserData {
  name: string;
  habits: string[];
}

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  isHabit: boolean;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('dayweave-user');
    if (data) {
      setUserData(JSON.parse(data));
    }
  }, []);

  const currentDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (!userData) {
    return null;
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            おはようございます、{userData.name}さん
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{currentDate}</span>
          </div>
        </div>

        {/* Today's Schedule */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">今日のスケジュール</CardTitle>
                <CardDescription>タップして編集できます</CardDescription>
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
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <span className="text-foreground">{item.title}</span>
                  </div>
                  {item.isHabit && (
                    <Badge variant="outline" className="text-xs bg-success-soft border-success text-success-foreground">
                      習慣
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">今日のスケジュールを設定しましょう</p>
                <Button className="mt-3 bg-gradient-to-r from-primary to-primary-glow">
                  スケジュール作成
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits Overview */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">習慣の進捗</CardTitle>
            <CardDescription>今日の習慣タスクの状況</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {userData.habits.map((habit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-secondary/20 to-secondary-accent/20 border border-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-secondary-accent"></div>
                    <span className="font-medium text-secondary-foreground">{habit}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    未実行
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}