import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar } from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  inSchedule: boolean;
}

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        title: newTodo.trim(),
        completed: false,
        inSchedule: false,
      };
      setTodos([...todos, todo]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const toggleSchedule = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, inSchedule: !todo.inSchedule } : todo
    ));
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">今日のタスク</h1>
          <p className="text-muted-foreground">追加のタスクを管理しましょう</p>
        </div>

        {/* Add Todo */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">新しいタスク</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="タスクを入力してください"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              <Button 
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">タスク一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {todos.length > 0 ? (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      todo.completed
                        ? 'bg-success-soft border-success opacity-75'
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
                        className={`text-foreground ${
                          todo.completed ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {todo.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {todo.inSchedule && (
                        <Badge variant="outline" className="text-xs bg-primary-soft border-primary text-primary-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          予定済み
                        </Badge>
                      )}
                      
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
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">まだタスクがありません</p>
                <p className="text-xs">上の入力欄からタスクを追加してください</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}