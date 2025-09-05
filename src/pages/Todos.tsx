import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { GoalManager } from '@/components/GoalManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Clock } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'none' | 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  inSchedule: boolean;
}

interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

const categories = ['仕事', '個人', '学習', '健康', '家事', 'その他'];

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [scheduleTime, setScheduleTime] = useState({ startTime: '', endTime: '' });

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('dayweave-todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save to localStorage when todos change
  useEffect(() => {
    if (todos.length >= 0) {
      localStorage.setItem('dayweave-todos', JSON.stringify(todos));
    }
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        title: newTodo.trim(),
        completed: false,
        priority: newPriority,
        category: newCategory || 'その他',
        createdAt: new Date().toISOString(),
        inSchedule: false,
      };
      setTodos([...todos, todo]);
      setNewTodo('');
      setNewPriority('none');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id 
        ? { 
            ...todo, 
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date().toISOString() : undefined,
          } 
        : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const openScheduleDialog = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsScheduleDialogOpen(true);
  };

  const addToSchedule = () => {
    if (selectedTodo && scheduleTime.startTime && scheduleTime.endTime) {
      // Add the todo to today's schedule
      const today = new Date().toISOString().split('T')[0];
      const scheduleItem = {
        id: Date.now().toString(),
        startTime: scheduleTime.startTime,
        endTime: scheduleTime.endTime,
        title: selectedTodo.title,
        isHabit: false,
        completed: false,
        date: today,
        category: selectedTodo.category,
        priority: selectedTodo.priority as 'none' | 'low' | 'medium' | 'high' || 'none',
        notes: `単発タスクより追加: ${selectedTodo.title}`,
      };

      // Add to schedule
      const scheduleData = localStorage.getItem('dayweave-schedule');
      const currentSchedule = scheduleData ? JSON.parse(scheduleData) : [];
      const updatedSchedule = [...currentSchedule, scheduleItem];
      localStorage.setItem('dayweave-schedule', JSON.stringify(updatedSchedule));

      console.log('タスクをスケジュールに追加しました:', scheduleItem);
      
      // Close dialog and reset
      setIsScheduleDialogOpen(false);
      setSelectedTodo(null);
      setScheduleTime({ startTime: '', endTime: '' });

      // Show success feedback
      alert('タスクがスケジュールに追加されました！');
    }
  };

  const filteredTodos = todos;

  const stats: TodoStats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    overdue: 0,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            目標・タスク管理
          </h1>
          <p className="text-muted-foreground">大きな目標から今日のタスクまで階層的に管理</p>
        </div>

        {/* Goal Manager */}
        <GoalManager />

        {/* Today's Simple Tasks */}
        {todos.length > 0 && (
          <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">今日の単発タスク</CardTitle>
              <CardDescription>目標とは別の今日やることリスト</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      todo.completed
                        ? 'bg-success-soft/20 border-success/30 opacity-75'
                        : 'bg-background border-border hover:bg-accent/50'
                    }`}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                    />
                    
                    <div className="flex-1">
                      <span
                        className={`font-medium ${
                          todo.completed ? 'line-through opacity-60' : 'text-foreground'
                        }`}
                      >
                        {todo.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {todo.category}
                        </Badge>
                        {todo.priority !== 'none' && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              todo.priority === 'high' 
                                ? 'text-destructive border-destructive bg-destructive/10'
                                : todo.priority === 'medium'
                                ? 'text-warning border-warning bg-warning/10'
                                : 'text-success border-success bg-success/10'
                            }`}
                          >
                            {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}優先度
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScheduleDialog(todo)}
                        className="text-primary border-primary hover:bg-primary-soft text-xs"
                      >
                        スケジュールに追加
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simple Task Addition for Today */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">今日のタスクを追加</CardTitle>
            <CardDescription>目標に関係ない単発のタスクはこちら</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="今日やることを入力してください"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリ選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={newPriority} onValueChange={(value: 'none' | 'low' | 'medium' | 'high') => setNewPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="優先度選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">優先度なし</SelectItem>
                    <SelectItem value="low">低優先度</SelectItem>
                    <SelectItem value="medium">中優先度</SelectItem>
                    <SelectItem value="high">高優先度</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  className="bg-gradient-to-r from-primary to-primary-glow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  タスクを追加
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スケジュールに追加</DialogTitle>
            <DialogDescription>
              「{selectedTodo?.title}」の実行時間を設定してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>開始時刻</Label>
                <div className="flex gap-2">
                  <Select
                    value={scheduleTime.startTime.split(':')[0] || ''}
                    onValueChange={(hour) => {
                      const minute = scheduleTime.startTime.split(':')[1] || '00';
                      setScheduleTime(prev => ({ ...prev, startTime: `${hour.padStart(2, '0')}:${minute}` }));
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
                    value={scheduleTime.startTime.split(':')[1] || ''}
                    onValueChange={(minute) => {
                      const hour = scheduleTime.startTime.split(':')[0] || '00';
                      setScheduleTime(prev => ({ ...prev, startTime: `${hour.padStart(2, '0')}:${minute}` }));
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
                <Label>終了時刻</Label>
                <div className="flex gap-2">
                  <Select
                    value={scheduleTime.endTime.split(':')[0] || ''}
                    onValueChange={(hour) => {
                      const minute = scheduleTime.endTime.split(':')[1] || '00';
                      setScheduleTime(prev => ({ ...prev, endTime: `${hour.padStart(2, '0')}:${minute}` }));
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
                    value={scheduleTime.endTime.split(':')[1] || ''}
                    onValueChange={(minute) => {
                      const hour = scheduleTime.endTime.split(':')[0] || '00';
                      setScheduleTime(prev => ({ ...prev, endTime: `${hour.padStart(2, '0')}:${minute}` }));
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
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                キャンセル
              </Button>
              <Button 
                onClick={addToSchedule}
                disabled={!scheduleTime.startTime || !scheduleTime.endTime}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <Clock className="w-4 h-4 mr-2" />
                スケジュールに追加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}