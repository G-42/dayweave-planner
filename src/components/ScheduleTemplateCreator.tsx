import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  isHabit: boolean;
  habitName?: string;
}

interface Template {
  id: string;
  name: string;
  items: ScheduleItem[];
}

interface ScheduleTemplateCreatorProps {
  habits: string[];
  onComplete: (templates: Template[]) => void;
  onBack: () => void;
}

const templateTypes = [
  { id: 'holiday-a', name: '休日A', description: 'リラックスした休日' },
  { id: 'holiday-b', name: '休日B', description: 'アクティブな休日' },
  { id: 'workday', name: '仕事の日', description: '平日のスケジュール' },
];

export const ScheduleTemplateCreator = ({ habits, onComplete, onBack }: ScheduleTemplateCreatorProps) => {
  const [currentTemplate, setCurrentTemplate] = useState(0);
  const [templates, setTemplates] = useState<Template[]>(
    templateTypes.map(type => ({
      id: type.id,
      name: type.name,
      items: [],
    }))
  );
  const [newItem, setNewItem] = useState({
    startTime: '',
    endTime: '',
    title: '',
    isHabit: false,
    habitName: '',
  });

  const addScheduleItem = () => {
    if (newItem.startTime && newItem.endTime && newItem.title) {
      // Validate that end time is after start time
      if (newItem.endTime <= newItem.startTime) {
        alert('終了時刻は開始時刻より後に設定してください');
        return;
      }

      const item: ScheduleItem = {
        id: Date.now().toString(),
        startTime: newItem.startTime,
        endTime: newItem.endTime,
        title: newItem.title,
        isHabit: newItem.isHabit,
        habitName: newItem.isHabit ? newItem.habitName : undefined,
      };

      setTemplates(prev => prev.map((template, index) => 
        index === currentTemplate 
          ? { ...template, items: [...template.items, item].sort((a, b) => a.startTime.localeCompare(b.startTime)) }
          : template
      ));

      setNewItem({ startTime: '', endTime: '', title: '', isHabit: false, habitName: '' });
    }
  };

  const removeScheduleItem = (itemId: string) => {
    setTemplates(prev => prev.map((template, index) => 
      index === currentTemplate 
        ? { ...template, items: template.items.filter(item => item.id !== itemId) }
        : template
    ));
  };

  const nextTemplate = () => {
    if (currentTemplate < templates.length - 1) {
      setCurrentTemplate(currentTemplate + 1);
    }
  };

  const prevTemplate = () => {
    if (currentTemplate > 0) {
      setCurrentTemplate(currentTemplate - 1);
    }
  };

  const handleComplete = () => {
    // Check if all habits are included across all templates
    const allHabitsIncluded = habits.every(habit =>
      templates.some(template =>
        template.items.some(item => item.isHabit && item.habitName === habit)
      )
    );

    if (!allHabitsIncluded) {
      alert('すべての習慣をいずれかのテンプレートに含めてください');
      return;
    }

    onComplete(templates);
  };

  const currentTemplateData = templates[currentTemplate];
  const currentTemplateType = templateTypes[currentTemplate];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          スケジュールテンプレート作成
        </h2>
        <p className="text-muted-foreground">
          3つのテンプレートを作成しましょう ({currentTemplate + 1}/3)
        </p>
      </div>

      {/* Template Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={prevTemplate}
          disabled={currentTemplate === 0}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          前へ
        </Button>

        <div className="text-center">
          <Badge variant="outline" className="bg-primary-soft border-primary text-primary-foreground px-4 py-2">
            {currentTemplateType.name}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            {currentTemplateType.description}
          </p>
        </div>

        <Button
          onClick={nextTemplate}
          disabled={currentTemplate === templates.length - 1}
          variant="outline"
          size="sm"
        >
          次へ
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Add New Item */}
      <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">スケジュール項目を追加</CardTitle>
          <CardDescription>時刻と内容を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">開始時刻</Label>
                <div className="flex gap-2">
                  <Select
                    value={newItem.startTime.split(':')[0] || ''}
                    onValueChange={(hour) => {
                      const minute = newItem.startTime.split(':')[1] || '00';
                      setNewItem(prev => ({ ...prev, startTime: `${hour.padStart(2, '0')}:${minute}` }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="時" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>{i}時</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newItem.startTime.split(':')[1] || ''}
                    onValueChange={(minute) => {
                      const hour = newItem.startTime.split(':')[0] || '00';
                      setNewItem(prev => ({ ...prev, startTime: `${hour.padStart(2, '0')}:${minute}` }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="分" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i} value={(i * 5).toString().padStart(2, '0')}>{i * 5}分</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">終了時刻</Label>
                <div className="flex gap-2">
                  <Select
                    value={newItem.endTime.split(':')[0] || ''}
                    onValueChange={(hour) => {
                      const minute = newItem.endTime.split(':')[1] || '00';
                      setNewItem(prev => ({ ...prev, endTime: `${hour.padStart(2, '0')}:${minute}` }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="時" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>{i}時</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newItem.endTime.split(':')[1] || ''}
                    onValueChange={(minute) => {
                      const hour = newItem.endTime.split(':')[0] || '00';
                      setNewItem(prev => ({ ...prev, endTime: `${hour.padStart(2, '0')}:${minute}` }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="分" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i} value={(i * 5).toString().padStart(2, '0')}>{i * 5}分</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">内容</Label>
              <Input
                id="title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例: 朝食、運動、読書"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHabit"
                checked={newItem.isHabit}
                onChange={(e) => setNewItem(prev => ({ ...prev, isHabit: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="isHabit">習慣化タスクにする</Label>
            </div>
            
            {newItem.isHabit && (
              <Select
                value={newItem.habitName}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, habitName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="習慣を選択" />
                </SelectTrigger>
                <SelectContent>
                  {habits.map((habit, index) => (
                    <SelectItem key={index} value={habit}>
                      {habit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            onClick={addScheduleItem}
            disabled={!newItem.startTime || !newItem.endTime || !newItem.title || (newItem.isHabit && !newItem.habitName)}
            className="w-full bg-gradient-to-r from-primary to-primary-glow"
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </CardContent>
      </Card>

      {/* Current Template Items */}
      <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">{currentTemplateType.name} のスケジュール</CardTitle>
          <CardDescription>
            {currentTemplateData.items.length}個の項目が設定されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentTemplateData.items.length > 0 ? (
            <div className="space-y-2">
              {currentTemplateData.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                    <Clock className="w-4 h-4" />
                    {item.startTime}〜{item.endTime}
                  </div>
                  <div className="flex-1">
                    <span className="text-foreground">{item.title}</span>
                  </div>
                  {item.isHabit && (
                    <Badge variant="outline" className="text-xs bg-success-soft border-success text-success-foreground">
                      習慣: {item.habitName}
                    </Badge>
                  )}
                  <Button
                    onClick={() => removeScheduleItem(item.id)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">まだスケジュールがありません</p>
              <p className="text-xs">上の入力欄から項目を追加してください</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          戻る
        </Button>
        
        <Button
          onClick={handleComplete}
          className="bg-gradient-to-r from-primary to-primary-glow"
          disabled={templates.every(t => t.items.length === 0)}
        >
          完了してダッシュボードへ
        </Button>
      </div>

      {/* Habits Check */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">習慣の配置状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {habits.map((habit, index) => {
              const isIncluded = templates.some(template =>
                template.items.some(item => item.isHabit && item.habitName === habit)
              );
              return (
                <Badge
                  key={index}
                  variant={isIncluded ? "default" : "outline"}
                  className={
                    isIncluded
                      ? "bg-success text-success-foreground"
                      : "border-warning text-warning-foreground"
                  }
                >
                  {habit} {isIncluded ? "✓" : "⚠"}
                </Badge>
              );
            })}
          </div>
          {!habits.every(habit =>
            templates.some(template =>
              template.items.some(item => item.isHabit && item.habitName === habit)
            )
          ) && (
            <p className="text-xs text-warning-foreground mt-2">
              ⚠ すべての習慣をいずれかのテンプレートに含めてください
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};