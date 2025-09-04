import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock, Edit, Trash2, X, Save, Target } from 'lucide-react';
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

interface TemplateEditorProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  habits: string[];
}

export const TemplateEditor = ({ template, isOpen, onClose, onSave, habits }: TemplateEditorProps) => {
  const [templateName, setTemplateName] = useState('');
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isItemEditorOpen, setIsItemEditorOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    startTime: '',
    endTime: '',
    title: '',
    isHabit: false,
    habitName: '',
  });

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setItems([...template.items]);
    } else {
      setTemplateName('');
      setItems([]);
    }
  }, [template]);

  const addItem = () => {
    if (newItem.startTime && newItem.endTime && newItem.title) {
      if (newItem.endTime <= newItem.startTime) {
        alert('終了時刻は開始時刻より後に設定してください');
        return;
      }

      const item: ScheduleItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        startTime: newItem.startTime,
        endTime: newItem.endTime,
        title: newItem.title,
        isHabit: newItem.isHabit,
        habitName: newItem.isHabit ? newItem.habitName : undefined,
      };

      setItems(prev => [...prev, item].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setNewItem({ startTime: '', endTime: '', title: '', isHabit: false, habitName: '' });
    }
  };

  const updateItem = (updatedItem: ScheduleItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ).sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const deleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }

    const updatedTemplate: Template = {
      id: template?.id || Date.now().toString(),
      name: templateName.trim(),
      items: items,
    };

    onSave(updatedTemplate);
    onClose();
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewItem({
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.title,
      isHabit: item.isHabit,
      habitName: item.habitName || '',
    });
    setIsItemEditorOpen(true);
  };

  const handleItemSave = () => {
    if (!newItem.startTime || !newItem.endTime || !newItem.title) return;
    if (newItem.endTime <= newItem.startTime) {
      alert('終了時刻は開始時刻より後に設定してください');
      return;
    }

    const itemData: ScheduleItem = {
      id: editingItem?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startTime: newItem.startTime,
      endTime: newItem.endTime,
      title: newItem.title,
      isHabit: newItem.isHabit,
      habitName: newItem.isHabit ? newItem.habitName : undefined,
    };

    if (editingItem) {
      updateItem(itemData);
    } else {
      setItems(prev => [...prev, itemData].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    }

    setEditingItem(null);
    setNewItem({ startTime: '', endTime: '', title: '', isHabit: false, habitName: '' });
    setIsItemEditorOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-card/95 backdrop-blur border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              {template ? 'テンプレートを編集' : '新しいテンプレート'}
            </DialogTitle>
            <DialogDescription>
              テンプレート名と項目を編集できます
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-hidden">
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

            {/* Items List */}
            <div className="flex-1 overflow-hidden">
              <Card className="h-full flex flex-col shadow-medium border-0 bg-card/90 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">スケジュール項目</CardTitle>
                      <CardDescription>{items.length}個の項目</CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingItem(null);
                        setNewItem({ startTime: '', endTime: '', title: '', isHabit: false, habitName: '' });
                        setIsItemEditorOpen(true);
                      }}
                      size="sm"
                      className="bg-gradient-to-r from-primary to-primary-glow"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      項目を追加
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto">
                  {items.length > 0 ? (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                            <Clock className="w-4 h-4" />
                            {item.startTime}〜{item.endTime}
                          </div>
                          
                          <div className="flex-1">
                            <span className="text-foreground font-medium">{item.title}</span>
                            {item.isHabit && (
                              <Badge variant="outline" className="ml-2 text-xs bg-success-soft border-success text-success-foreground">
                                <Target className="w-3 h-3 mr-1" />
                                習慣: {item.habitName}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditItem(item)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteItem(item.id)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">まだ項目がありません</p>
                      <p className="text-xs">上のボタンから項目を追加してください</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
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

      {/* Item Editor Dialog */}
      <Dialog open={isItemEditorOpen} onOpenChange={setIsItemEditorOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur border-border">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? '項目を編集' : '項目を追加'}
            </DialogTitle>
            <DialogDescription>
              時刻と内容を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-time">開始時刻</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newItem.startTime}
                  onChange={(e) => setNewItem(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">終了時刻</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newItem.endTime}
                  onChange={(e) => setNewItem(prev => ({ ...prev, endTime: e.target.value }))}
                />
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-habit"
                  checked={newItem.isHabit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, isHabit: e.target.checked }))}
                  className="rounded border-border"
                />
                <Label htmlFor="is-habit">習慣化タスクにする</Label>
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
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsItemEditorOpen(false);
                setEditingItem(null);
                setNewItem({ startTime: '', endTime: '', title: '', isHabit: false, habitName: '' });
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleItemSave}
              disabled={!newItem.startTime || !newItem.endTime || !newItem.title || (newItem.isHabit && !newItem.habitName)}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              {editingItem ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};