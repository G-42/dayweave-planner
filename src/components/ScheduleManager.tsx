import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScheduleItemEditor } from './ScheduleItemEditor';
import { WeeklyView } from './WeeklyView';
import { Plus, Clock, CheckCircle, Circle, Target, Calendar, Edit, Trash2, MoreHorizontal, Save } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

interface Template {
  id: string;
  name: string;
  items: {
    id: string;
    startTime: string;
    endTime: string;
    title: string;
    isHabit: boolean;
    habitName?: string;
  }[];
}

interface ScheduleManagerProps {
  habits: string[];
}

export const ScheduleManager = ({ habits }: ScheduleManagerProps) => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newItemDate, setNewItemDate] = useState<string>('');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Load data from localStorage
  useEffect(() => {
    const scheduleData = localStorage.getItem('dayweave-schedule');
    const templatesData = localStorage.getItem('dayweave-templates');
    const userData = localStorage.getItem('dayweave-user');

    if (scheduleData) {
      setScheduleItems(JSON.parse(scheduleData));
    }

    // Load templates from both sources
    let allTemplates: Template[] = [];
    
    // Load from dedicated templates storage
    if (templatesData) {
      allTemplates = [...allTemplates, ...JSON.parse(templatesData)];
    }
    
    // Load from welcome setup data
    if (userData) {
      const userSetup = JSON.parse(userData);
      if (userSetup.templates && Array.isArray(userSetup.templates)) {
        allTemplates = [...allTemplates, ...userSetup.templates];
      }
    }
    
    // Remove duplicates based on template id
    const uniqueTemplates = allTemplates.filter((template, index, self) => 
      index === self.findIndex(t => t.id === template.id)
    );
    
    setTemplates(uniqueTemplates);
  }, []);

  // Save schedule items to localStorage
  useEffect(() => {
    if (scheduleItems.length >= 0) {
      localStorage.setItem('dayweave-schedule', JSON.stringify(scheduleItems));
    }
  }, [scheduleItems]);

  // Save templates to localStorage
  useEffect(() => {
    if (templates.length >= 0) {
      localStorage.setItem('dayweave-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const getTodayItems = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleItems
      .filter(item => item.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleSaveItem = (itemData: Omit<ScheduleItem, 'id'>) => {
    if (editingItem) {
      // Update existing item
      setScheduleItems(prev => prev.map(item =>
        item.id === editingItem.id
          ? { ...itemData, id: editingItem.id }
          : item
      ));
    } else {
      // Add new item
      const newItem: ScheduleItem = {
        ...itemData,
        id: Date.now().toString(),
      };
      setScheduleItems(prev => [...prev, newItem]);
    }
    
    setEditingItem(null);
  };

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleAddNewItem = (date?: string) => {
    setEditingItem(null);
    setNewItemDate(date || new Date().toISOString().split('T')[0]);
    setIsEditorOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setScheduleItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleToggleComplete = (itemId: string) => {
    setScheduleItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, completed: !item.completed }
        : item
    ));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const today = new Date().toISOString().split('T')[0];
    const newItems: ScheduleItem[] = template.items.map(templateItem => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startTime: templateItem.startTime,
      endTime: templateItem.endTime,
      title: templateItem.title,
      isHabit: templateItem.isHabit,
      habitName: templateItem.habitName,
      completed: false,
      date: today,
      category: templateItem.isHabit ? '習慣' : 'その他',
      priority: 'medium' as const,
    }));

    // Remove existing items for today and add template items
    setScheduleItems(prev => [
      ...prev.filter(item => item.date !== today),
      ...newItems,
    ]);
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) return;

    const todayItems = getTodayItems();
    if (todayItems.length === 0) return;

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName,
      items: todayItems.map(item => ({
        id: item.id,
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        isHabit: item.isHabit,
        habitName: item.habitName,
      })),
    };

    setTemplates(prev => [...prev, newTemplate]);
    setTemplateName('');
    setIsTemplateDialogOpen(false);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive bg-destructive/10';
      case 'medium': return 'text-warning border-warning bg-warning/10';
      case 'low': return 'text-success border-success bg-success/10';
      default: return 'text-muted-foreground border-border bg-background';
    }
  };

  const todayItems = getTodayItems();
  const completedToday = todayItems.filter(item => item.completed).length;
  const totalToday = todayItems.length;
  const completionRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Schedule Stats */}
      <Card className="shadow-medium border-0 bg-gradient-to-r from-primary/10 to-primary-soft/20 backdrop-blur">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{totalToday}</div>
              <div className="text-xs text-muted-foreground">今日の予定</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{completedToday}</div>
              <div className="text-xs text-muted-foreground">完了済み</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{Math.round(completionRate)}%</div>
              <div className="text-xs text-muted-foreground">達成率</div>
            </div>
          </div>
          
          {totalToday > 0 && (
            <div className="mt-4">
              <Progress value={completionRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">今日のスケジュール</TabsTrigger>
          <TabsTrigger value="weekly">週間表示</TabsTrigger>
        </TabsList>

        {/* Today's Schedule */}
        <TabsContent value="today" className="space-y-4">
          <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">今日のスケジュール</CardTitle>
                  <CardDescription>
                    {new Date().toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {todayItems.length > 0 && (
                    <Button
                      onClick={() => setIsTemplateDialogOpen(true)}
                      size="sm"
                      variant="outline"
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      テンプレート保存
                    </Button>
                  )}
                  <Button
                    onClick={() => handleAddNewItem()}
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    追加
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Template Management */}
              {templates.length > 0 && (
                <div className="mb-4 p-4 bg-accent/30 rounded-lg border border-border/50">
                  <div className="text-sm font-medium mb-3 flex items-center justify-between">
                    <span>保存済みテンプレート</span>
                    <Badge variant="outline" className="text-xs">
                      {templates.length}個
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {templates.map(template => {
                      const isWelcomeTemplate = ['holiday-a', 'holiday-b', 'workday'].includes(template.id);
                      return (
                        <div
                          key={template.id}
                          className="flex items-center justify-between gap-2 p-3 bg-background/50 rounded border border-border/30 hover:bg-background/70 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{template.name}</div>
                              {isWelcomeTemplate && (
                                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                                  初期設定
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {template.items.length}個の項目 • 
                              {template.items.filter(item => item.isHabit).length}個の習慣を含む
                            </div>
                            {template.items.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {template.items[0].startTime}〜{template.items[template.items.length - 1].endTime}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => applyTemplate(template.id)}
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                            >
                              適用
                            </Button>
                            {!isWelcomeTemplate && (
                              <Button
                                onClick={() => deleteTemplate(template.id)}
                                size="sm"
                                variant="ghost"
                                className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                削除
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {todayItems.length === 0 && (
                    <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20">
                      <div className="text-xs text-primary font-medium">💡 ヒント</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        テンプレートを「適用」すると今日のスケジュールに一括追加されます
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Items */}
              {todayItems.length > 0 ? (
                <div className="space-y-2">
                  {todayItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                        item.completed
                          ? 'bg-success-soft/20 border-success/30 opacity-75'
                          : 'bg-background border-border hover:bg-accent/50'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleComplete(item.id)}
                        className="flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[120px]">
                        <Clock className="w-4 h-4" />
                        {item.startTime}〜{item.endTime}
                      </div>

                      <div className="flex-1">
                        <div className={`font-medium ${
                          item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {item.title}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {item.priority && (
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}優先度
                            </Badge>
                          )}
                          
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                          
                          {item.isHabit && (
                            <Badge variant="outline" className="text-xs bg-success-soft border-success text-success-foreground">
                              <Target className="w-3 h-3 mr-1" />
                              習慣: {item.habitName}
                            </Badge>
                          )}
                        </div>
                        
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            {item.notes}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-popover/95 backdrop-blur border-border">
                          <DropdownMenuItem onClick={() => handleEditItem(item)}>
                            <Edit className="w-4 h-4 mr-2" />
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">今日のスケジュールがありません</p>
                  <p className="text-xs mb-4">上のボタンから項目を追加してください</p>
                  <Button
                    onClick={() => handleAddNewItem()}
                    className="bg-gradient-to-r from-primary to-primary-glow"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    スケジュールを追加
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly View */}
        <TabsContent value="weekly">
          <WeeklyView
            scheduleItems={scheduleItems}
            onItemClick={handleEditItem}
            onAddItem={handleAddNewItem}
            onToggleComplete={handleToggleComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Schedule Item Editor */}
      <ScheduleItemEditor
        item={editingItem || undefined}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingItem(null);
          setNewItemDate('');
        }}
        onSave={handleSaveItem}
        habits={habits}
      />

      {/* Template Save Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              テンプレートとして保存
            </DialogTitle>
            <DialogDescription>
              現在のスケジュールをテンプレートとして保存します。後で再利用できます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <div className="text-sm text-muted-foreground">
              保存対象: 今日のスケジュール {todayItems.length}個の項目
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplateDialogOpen(false);
                setTemplateName('');
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={saveAsTemplate}
              disabled={!templateName.trim() || todayItems.length === 0}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};