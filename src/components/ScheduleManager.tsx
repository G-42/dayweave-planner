import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScheduleItemEditor } from './ScheduleItemEditor';
import { WeeklyView } from './WeeklyView';
import { TemplateEditor } from './TemplateEditor';
import { SavedItemsPanel } from './SavedItemsPanel';
import { Plus, Clock, CheckCircle, Circle, Target, Calendar, Edit, Trash2, MoreHorizontal, Save, ChevronDown, Bookmark, Archive, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  priority?: 'none' | 'low' | 'medium' | 'high';
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
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<ScheduleItem[]>([]);
  const [isSavedItemsMenuOpen, setIsSavedItemsMenuOpen] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const scheduleData = localStorage.getItem('dayweave-schedule');
    const templatesData = localStorage.getItem('dayweave-templates');
    const userData = localStorage.getItem('dayweave-user');
    const savedItemsData = localStorage.getItem('dayweave-saved-items');

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

    // Load saved items
    if (savedItemsData) {
      setSavedItems(JSON.parse(savedItemsData));
    }
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

  // Save saved items to localStorage
  useEffect(() => {
    if (savedItems.length >= 0) {
      localStorage.setItem('dayweave-saved-items', JSON.stringify(savedItems));
    }
  }, [savedItems]);

  const getTodayItems = () => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleItems
      .filter(item => item.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleSaveItem = (itemData: Omit<ScheduleItem, 'id'>) => {
    let newItem: ScheduleItem;
    
    if (editingItem) {
      // Update existing item
      newItem = { ...itemData, id: editingItem.id };
      setScheduleItems(prev => prev.map(item =>
        item.id === editingItem.id ? newItem : item
      ));
    } else {
      // Add new item
      newItem = {
        ...itemData,
        id: Date.now().toString(),
      };
      setScheduleItems(prev => [...prev, newItem]);
    }
    
    // Save unique items to saved items (excluding date and completed status)
    const itemToSave = {
      ...newItem,
      date: '', // Remove date specificity
      completed: false, // Reset completion status
    };
    
    setSavedItems(prev => {
      const exists = prev.some(item => 
        item.title === itemToSave.title && 
        item.startTime === itemToSave.startTime && 
        item.endTime === itemToSave.endTime
      );
      
      if (!exists) {
        return [...prev, itemToSave];
      }
      return prev;
    });
    
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
      priority: 'none' as const,
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

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsTemplateEditorOpen(true);
  };

  const handleEditTemplateName = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setIsTemplateDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !templateName.trim()) return;

    setTemplates(prev => prev.map(t => 
      t.id === editingTemplate.id 
        ? { ...t, name: templateName.trim() }
        : t
    ));
    
    setEditingTemplate(null);
    setTemplateName('');
    setIsTemplateDialogOpen(false);
  };

  const handleSaveTemplateFromEditor = (updatedTemplate: Template) => {
    if (updatedTemplate.id && templates.find(t => t.id === updatedTemplate.id)) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === updatedTemplate.id ? updatedTemplate : t
      ));
    } else {
      // Add new template
      setTemplates(prev => [...prev, { ...updatedTemplate, id: Date.now().toString() }]);
    }
    setEditingTemplate(null);
    setIsTemplateEditorOpen(false);
  };

  const handleDeleteSavedItem = (itemId: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleDragStart = (e: React.DragEvent, item: ScheduleItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
      const today = new Date().toISOString().split('T')[0];
      
      const newItem: ScheduleItem = {
        ...itemData,
        id: Date.now().toString(),
        date: today,
        completed: false,
      };
      
      setScheduleItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Failed to parse dropped item:', error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive bg-destructive/10';
      case 'medium': return 'text-warning border-warning bg-warning/10';
      case 'low': return 'text-success border-success bg-success/10';
      case 'none': return 'text-muted-foreground border-muted-foreground/30 bg-muted/10';
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Schedule Section */}
        <div className="lg:col-span-1">
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
                      {/* Saved Items Dropdown */}
                      {savedItems.length > 0 && (
                        <DropdownMenu open={isSavedItemsMenuOpen} onOpenChange={setIsSavedItemsMenuOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-accent text-foreground hover:bg-accent/50"
                            >
                              <Archive className="w-4 h-4 mr-1" />
                              項目
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            className="w-96 bg-popover/95 backdrop-blur border-border z-50 max-h-80 overflow-y-auto"
                            align="end" 
                            sideOffset={5}
                          >
                            <div className="p-2">
                              <div className="text-sm font-medium mb-2 text-foreground">保存済み項目</div>
                              <div className="text-xs text-muted-foreground mb-3">
                                ドラッグして下のエリアにドロップ ({savedItems.length}個)
                              </div>
                              
                              {/* Group saved items by category */}
                              {Object.entries(savedItems.reduce((acc, item) => {
                                const category = item.isHabit ? '習慣' : item.category || 'その他';
                                if (!acc[category]) acc[category] = [];
                                acc[category].push(item);
                                return acc;
                              }, {} as Record<string, ScheduleItem[]>)).map(([category, items]) => (
                                <div key={category} className="mb-3">
                                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <span>{category}</span>
                                    <Badge variant="outline" className="text-xs h-4">
                                      {items.length}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    {items.map((item) => (
                                      <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        className="group flex items-center gap-2 p-2 rounded hover:bg-accent/50 transition-all cursor-grab active:cursor-grabbing text-xs"
                                      >
                                        <div className="flex items-center gap-1 text-muted-foreground min-w-[70px]">
                                          <Clock className="w-3 h-3" />
                                          {item.startTime}〜{item.endTime}
                                        </div>
                                        
                                        <div className="flex-1 truncate">
                                          <div className="font-medium text-foreground truncate">
                                            {item.title}
                                          </div>
                                          {item.isHabit && (
                                            <div className="text-xs text-success truncate">
                                              習慣: {item.habitName}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <Button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSavedItem(item.id);
                                          }}
                                          size="sm"
                                          variant="ghost"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {/* Template Dropdown */}
                      {templates.length > 0 && (
                        <DropdownMenu open={isTemplateMenuOpen} onOpenChange={setIsTemplateMenuOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary/50 text-primary hover:bg-primary/10"
                            >
                              <Bookmark className="w-4 h-4 mr-1" />
                              テンプレート
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            className="w-80 bg-popover/95 backdrop-blur border-border z-50"
                            align="end" 
                            sideOffset={5}
                          >
                            <div className="p-2">
                              <div className="text-sm font-medium mb-2 text-foreground">保存済みテンプレート</div>
                              {templates.map(template => {
                                const isWelcomeTemplate = ['holiday-a', 'holiday-b', 'workday'].includes(template.id);
                                return (
                                  <div
                                    key={template.id}
                                    className="flex items-center justify-between gap-2 p-2 rounded hover:bg-accent/50 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-foreground truncate">{template.name}</div>
                                        {isWelcomeTemplate && (
                                          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary flex-shrink-0">
                                            初期
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {template.items.length}項目 • {template.items.filter(item => item.isHabit).length}習慣
                                      </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <Button
                                        onClick={() => {
                                          applyTemplate(template.id);
                                          setIsTemplateMenuOpen(false);
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 px-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                                      >
                                        適用
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs h-7 w-7 p-0"
                                          >
                                            <MoreHorizontal className="w-3 h-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-popover/95 backdrop-blur border-border z-50">
                                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                            <Edit className="w-3 h-3 mr-2" />
                                            詳細編集
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleEditTemplateName(template)}>
                                            <Edit className="w-3 h-3 mr-2" />
                                            名前変更
                                          </DropdownMenuItem>
                                          {!isWelcomeTemplate && (
                                            <DropdownMenuItem 
                                              onClick={() => deleteTemplate(template.id)}
                                              className="text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="w-3 h-3 mr-2" />
                                              削除
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {todayItems.length > 0 && (
                        <Button
                          onClick={() => {
                            setEditingTemplate(null);
                            setIsTemplateDialogOpen(true);
                          }}
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

                <CardContent
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="min-h-[200px] relative"
                >
                  {/* Drag & Drop Area Hint */}
                  <div className="absolute inset-0 border-2 border-dashed border-transparent transition-colors hover:border-primary/30 pointer-events-none rounded-lg">
                    <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                        ここに項目をドロップ
                      </div>
                    </div>
                  </div>

                  {/* Schedule Items with Timeline Design */}
                  {todayItems.length > 0 ? (
                    <div className="relative">
                      {/* Main timeline line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
                      
                      {todayItems.map((item, index) => (
                        <div key={item.id} className="relative mb-6 last:mb-0">
                          {/* Timeline bubble with icon */}
                          <div className="absolute left-4 w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-full border-4 border-background shadow-lg flex items-center justify-center z-10">
                            {item.isHabit ? (
                              <Target className="w-4 h-4 text-white" />
                            ) : item.title.includes('睡眠') || item.title.includes('起床') ? (
                              <Moon className="w-4 h-4 text-white" />
                            ) : item.title.includes('食') ? (
                              <Circle className="w-3 h-3 text-white fill-current" />
                            ) : (
                              <Clock className="w-4 h-4 text-white" />
                            )}
                          </div>
                          
                          {/* Time label */}
                          <div className="absolute left-0 top-10 text-xs text-muted-foreground font-mono w-12 text-center">
                            {item.startTime}
                          </div>
                          
                          {/* Content card */}
                          <div className="ml-16 max-w-sm">
                            <div
                              className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm ${
                                item.completed
                                  ? 'bg-gradient-to-br from-success/10 to-success-soft/20 border-success/30 opacity-80'
                                  : 'bg-gradient-to-br from-background to-accent/5 border-border hover:border-primary/30 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleToggleComplete(item.id)}
                                  className="flex-shrink-0 mt-1"
                                >
                                  {item.completed ? (
                                    <CheckCircle className="w-5 h-5 text-success" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    {item.startTime !== item.endTime && (
                                      <span className="font-mono">
                                        {item.startTime}〜{item.endTime}
                                      </span>
                                    )}
                                    {item.endTime !== item.startTime && item.endTime && item.startTime && (
                                      <span className="text-primary">
                                        ({(() => {
                                          const start = new Date(`2024-01-01T${item.startTime}:00`);
                                          const end = new Date(`2024-01-01T${item.endTime}:00`);
                                          const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                                          return diffMinutes > 0 ? `${diffMinutes}分間` : '';
                                        })()})
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className={`font-medium text-sm leading-snug ${
                                    item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                  }`}>
                                    {item.title}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {item.isHabit && (
                                      <Badge variant="outline" className="text-xs bg-success-soft/20 border-success/40 text-success-foreground">
                                        習慣: {item.habitName}
                                      </Badge>
                                    )}
                                    
                                    {item.priority && item.priority !== 'none' && (
                                      <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                                        {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}優先度
                                      </Badge>
                                    )}
                                    
                                    {item.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {item.category}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {item.notes && (
                                    <div className="text-xs text-muted-foreground mt-2 italic bg-muted/20 p-2 rounded">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100">
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">今日のスケジュールがありません</p>
                      <p className="text-xs mb-4">項目をドラッグ&ドロップまたは上のボタンから追加してください</p>
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
        </div>
      </div>

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

      {/* Template Save/Edit Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
        setIsTemplateDialogOpen(open);
        if (!open) {
          setEditingTemplate(null);
          setTemplateName('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              {editingTemplate ? 'テンプレートを編集' : 'テンプレートとして保存'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'テンプレート名を変更できます。'
                : '現在のスケジュールをテンプレートとして保存します。後で再利用できます。'
              }
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
            {!editingTemplate && (
              <div className="text-sm text-muted-foreground">
                保存対象: 今日のスケジュール {todayItems.length}個の項目
              </div>
            )}
            {editingTemplate && (
              <div className="text-sm text-muted-foreground">
                編集対象: {editingTemplate.items.length}個の項目を含むテンプレート
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTemplateDialogOpen(false);
                setEditingTemplate(null);
                setTemplateName('');
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={editingTemplate ? handleUpdateTemplate : saveAsTemplate}
              disabled={!templateName.trim() || (!editingTemplate && todayItems.length === 0)}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              {editingTemplate ? '更新' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={isTemplateEditorOpen}
        onClose={() => {
          setIsTemplateEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplateFromEditor}
        habits={habits}
      />
    </div>
  );
};