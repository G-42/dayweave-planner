import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DragDropScheduleBuilder } from './DragDropScheduleBuilder';
import { Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface DragDropTemplateEditorProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
}

export const DragDropTemplateEditor: React.FC<DragDropTemplateEditorProps> = ({
  template,
  isOpen,
  onClose,
  onSave
}) => {
  const [templateName, setTemplateName] = useState('');
  const [activities, setActivities] = useState<PlacedActivity[]>([]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      const convertedActivities: PlacedActivity[] = template.items.map(item => {
        const startMinutes = parseTime(item.startTime);
        const endMinutes = parseTime(item.endTime);
        return {
          id: item.id,
          activityId: item.id,
          title: item.title,
          startTime: startMinutes,
          duration: endMinutes - startMinutes,
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          icon: <div className="w-4 h-4" />,
          category: item.isHabit ? 'habits' : 'custom'
        };
      });
      setActivities(convertedActivities);
    } else {
      setTemplateName('');
      setActivities([]);
    }
  }, [template, isOpen]);

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }

    const templateItems: ScheduleItem[] = activities.map(activity => ({
      id: activity.id,
      startTime: formatTime(activity.startTime),
      endTime: formatTime(activity.startTime + activity.duration),
      title: activity.title,
      isHabit: false,
      habitName: undefined
    }));

    const updatedTemplate: Template = {
      id: template?.id || Date.now().toString(),
      name: templateName.trim(),
      items: templateItems
    };

    onSave(updatedTemplate);
    onClose();
  };

  const handleClose = () => {
    setTemplateName('');
    setActivities([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-card/95 backdrop-blur border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            {template ? 'テンプレートを編集' : '新しいテンプレートを作成'}
          </DialogTitle>
          <DialogDescription>
            ドラッグ&ドロップでテンプレートのスケジュールを作成・編集できます
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden flex-1">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">テンプレート名</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例: 平日のスケジュール、休日プラン"
              className="bg-background border-border"
            />
          </div>

          {/* Drag & Drop Schedule Builder */}
          <div className="flex-1 overflow-hidden">
            <Card className="h-full shadow-medium border-0 bg-card/90 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">スケジュール設定</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-hidden">
                <div className="h-full">
                  <DragDropScheduleBuilder
                    onScheduleChange={setActivities}
                    initialSchedule={activities}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-1" />
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={!templateName.trim()}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            <Save className="w-4 h-4 mr-1" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};