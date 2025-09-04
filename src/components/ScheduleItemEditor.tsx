import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Save, X, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  isHabit: boolean;
  habitName?: string;
  completed?: boolean;
  date?: string;
  category?: string;
  priority?: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
}

interface ScheduleItemEditorProps {
  item?: ScheduleItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<ScheduleItem, 'id'>) => void;
  habits: string[];
}

const categories = ['仕事', '個人', '学習', '健康', '家事', 'その他'];

export const ScheduleItemEditor = ({ item, isOpen, onClose, onSave, habits }: ScheduleItemEditorProps) => {
  const [formData, setFormData] = useState({
    startTime: item?.startTime || '',
    endTime: item?.endTime || '',
    title: item?.title || '',
    isHabit: item?.isHabit || false,
    habitName: item?.habitName || '',
    date: item?.date || new Date().toISOString().split('T')[0],
    category: item?.category || 'その他',
    priority: item?.priority || 'none' as 'none' | 'low' | 'medium' | 'high',
    notes: item?.notes || '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    item?.date ? new Date(item.date) : new Date()
  );

  const handleSave = () => {
    if (!formData.startTime || !formData.endTime || !formData.title) return;
    
    if (formData.endTime <= formData.startTime) {
      alert('終了時刻は開始時刻より後に設定してください');
      return;
    }

    onSave({
      ...formData,
      date: selectedDate?.toISOString().split('T')[0] || formData.date,
    });
    
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive bg-destructive/10';
      case 'medium': return 'text-warning border-warning bg-warning/10';
      case 'low': return 'text-success border-success bg-success/10';
      case 'none': return 'text-muted-foreground border-muted-foreground/30 bg-muted/10';
      default: return 'text-muted-foreground border-border bg-background';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高優先度';
      case 'medium': return '中優先度';
      case 'low': return '低優先度';
      case 'none': return 'なし';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {item ? 'スケジュール編集' : '新しいスケジュール'}
          </DialogTitle>
          <DialogDescription>
            スケジュール項目の詳細を設定してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>日付</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "yyyy年MM月dd日") : "日付を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover/95 backdrop-blur border-border" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">開始時刻</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時刻</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="例: 会議、運動、読書"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur border-border">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>優先度</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: 'none' | 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur border-border">
                  <SelectItem value="none">なし</SelectItem>
                  <SelectItem value="high">高優先度</SelectItem>
                  <SelectItem value="medium">中優先度</SelectItem>
                  <SelectItem value="low">低優先度</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority Preview - Only show if not 'none' */}
          {formData.priority !== 'none' && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(formData.priority)}`}>
                <Target className="w-3 h-3 mr-1" />
                {getPriorityLabel(formData.priority)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formData.category}
              </Badge>
            </div>
          )}

          {/* Habit Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHabit"
                checked={formData.isHabit}
                onChange={(e) => setFormData(prev => ({ ...prev, isHabit: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="isHabit">この項目を習慣タスクにする</Label>
            </div>
            
            {formData.isHabit && (
              <div className="space-y-2">
                <Label>習慣を選択</Label>
                <Select
                  value={formData.habitName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, habitName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="習慣を選択してください" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur border-border">
                    {habits.map((habit, index) => (
                      <SelectItem key={index} value={habit}>
                        {habit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">メモ（任意）</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="詳細や備考があれば記入してください"
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.startTime || !formData.endTime || !formData.title || (formData.isHabit && !formData.habitName)}
            className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
          >
            <Save className="w-4 h-4 mr-1" />
            {item ? '更新' : '追加'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};