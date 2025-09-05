import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { GoalManager } from '@/components/GoalManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';

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
  const [newCategory, setNewCategory] = useState('');

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
        priority: 'medium',
        category: newCategory || 'その他',
        createdAt: new Date().toISOString(),
        inSchedule: false,
      };
      setTodos([...todos, todo]);
      setNewTodo('');
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

        {/* Simple Task Addition for Today */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">今日のタスクを直接追加</CardTitle>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}