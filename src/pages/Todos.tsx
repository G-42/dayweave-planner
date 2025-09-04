import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, AlertCircle, CheckCircle, Clock, Filter, Target, Trash2 } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
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
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
        dueDate: newDueDate || undefined,
        createdAt: new Date().toISOString(),
        inSchedule: false,
      };
      setTodos([...todos, todo]);
      setNewTodo('');
      setNewDueDate('');
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

  const toggleSchedule = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, inSchedule: !todo.inSchedule } : todo
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive bg-destructive/10';
      case 'medium': return 'text-warning border-warning bg-warning/10';
      case 'low': return 'text-success border-success bg-success/10';
      default: return 'text-muted-foreground border-border bg-background';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  };

  const isOverdue = (todo: Todo) => {
    if (!todo.dueDate || todo.completed) return false;
    return new Date(todo.dueDate) < new Date();
  };

  const filteredTodos = todos.filter(todo => {
    // Filter by completion status
    if (filter === 'pending' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (filter === 'overdue' && (!isOverdue(todo))) return false;

    // Filter by category
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

    return true;
  });

  const stats: TodoStats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    overdue: todos.filter(t => isOverdue(t)).length,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            タスク管理
          </h1>
          <p className="text-muted-foreground">効率的にタスクを整理しましょう</p>
        </div>

        {/* Stats Overview */}
        <Card className="shadow-medium border-0 bg-gradient-to-r from-primary/10 to-primary-soft/20 backdrop-blur">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-xs text-muted-foreground">総タスク</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">完了済み</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">未完了</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
                <div className="text-xs text-muted-foreground">期限切れ</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>完了率</span>
                <span className="font-medium">{Math.round(completionRate)}%</span>
              </div>
              <div className="w-full bg-background/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-success to-success-soft h-2 rounded-full transition-smooth" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Todo Form */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">新しいタスク</CardTitle>
            <CardDescription>詳細を設定してタスクを追加</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="タスクの内容を入力してください"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={newPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高優先度</SelectItem>
                    <SelectItem value="medium">中優先度</SelectItem>
                    <SelectItem value="low">低優先度</SelectItem>
                  </SelectContent>
                </Select>

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

                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button 
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="w-full bg-gradient-to-r from-primary to-primary-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                タスクを追加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardContent className="pt-6">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  すべて ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  未完了 ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">
                  完了済み ({stats.completed})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="text-xs">
                  期限切れ ({stats.overdue})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="mt-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリで絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのカテゴリ</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">
              タスク一覧 ({filteredTodos.length})
            </CardTitle>
            <CardDescription>
              {filter === 'all' ? 'すべてのタスク' : 
               filter === 'pending' ? '未完了のタスク' :
               filter === 'completed' ? '完了済みのタスク' :
               '期限切れのタスク'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTodos.length > 0 ? (
              <div className="space-y-3">
                {filteredTodos
                  .sort((a, b) => {
                    // Priority sorting
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                  })
                  .map((todo) => {
                    const overdue = isOverdue(todo);
                    
                    return (
                      <div
                        key={todo.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                          todo.completed
                            ? 'bg-success-soft/20 border-success/30 opacity-75'
                            : overdue
                            ? 'bg-destructive/10 border-destructive/30'
                            : 'bg-background border-border hover:bg-accent/50'
                        }`}
                      >
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                          className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <span
                              className={`font-medium ${
                                todo.completed ? 'line-through opacity-60' : 'text-foreground'
                              }`}
                            >
                              {todo.title}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTodo(todo.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(todo.priority)}`}
                            >
                              <Target className="w-3 h-3 mr-1" />
                              {getPriorityLabel(todo.priority)}優先度
                            </Badge>
                            
                            <Badge variant="outline" className="text-xs">
                              {todo.category}
                            </Badge>
                            
                            {todo.dueDate && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  overdue 
                                    ? 'text-destructive border-destructive bg-destructive/10' 
                                    : 'text-primary border-primary bg-primary/10'
                                }`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(todo.dueDate).toLocaleDateString('ja-JP')}
                                {overdue && ' (期限切れ)'}
                              </Badge>
                            )}
                            
                            {todo.inSchedule && (
                              <Badge variant="outline" className="text-xs bg-primary-soft border-primary text-primary-foreground">
                                <Calendar className="w-3 h-3 mr-1" />
                                予定済み
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSchedule(todo.id)}
                              className={
                                todo.inSchedule
                                  ? 'border-primary text-primary hover:bg-primary-soft'
                                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                              }
                            >
                              {todo.inSchedule ? 'スケジュールから削除' : 'スケジュールに追加'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {filter === 'all' ? (
                  <>
                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">まだタスクがありません</p>
                    <p className="text-xs">上の入力欄からタスクを追加してください</p>
                  </>
                ) : (
                  <>
                    <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      {filter === 'pending' && '未完了のタスクがありません'}
                      {filter === 'completed' && '完了済みのタスクがありません'}
                      {filter === 'overdue' && '期限切れのタスクがありません'}
                    </p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}