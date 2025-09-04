import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { ScheduleTemplateCreator } from '@/components/ScheduleTemplateCreator';

interface Template {
  id: string;
  name: string;
  items: {
    id: string;
    time: string;
    title: string;
    isHabit: boolean;
    habitName?: string;
  }[];
}

export default function Welcome() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [habits, setHabits] = useState<string[]>([]);
  const [habitInput, setHabitInput] = useState('');
  const navigate = useNavigate();

  const addHabit = () => {
    if (habitInput.trim() && habits.length < 3) {
      setHabits([...habits, habitInput.trim()]);
      setHabitInput('');
    }
  };

  const removeHabit = (index: number) => {
    setHabits(habits.filter((_, i) => i !== index));
  };

  const handleBasicInfoSubmit = () => {
    if (name.trim() && habits.length > 0) {
      setStep(2);
    }
  };

  const handleTemplatesComplete = (templates: Template[]) => {
    // Save all data to localStorage
    const userData = {
      name: name.trim(),
      habits,
      templates,
      setupComplete: true
    };
    localStorage.setItem('dayweave-user', JSON.stringify(userData));
    navigate('/dashboard');
  };

  const handleBackToBasicInfo = () => {
    setStep(1);
  };

  if (step === 2) {
    return (
      <Layout showNavigation={false}>
        <div className="min-h-screen p-4">
          <div className="max-w-2xl mx-auto">
            <ScheduleTemplateCreator
              habits={habits}
              onComplete={handleTemplatesComplete}
              onBack={handleBackToBasicInfo}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large border-0 bg-card/90 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              DayWeave
            </CardTitle>
            <CardDescription className="text-base">
              あなたの名前と習慣化したいタスクを設定しましょう
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">お名前</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                className="border-border focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">習慣化したいタスク (最大3つ)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  例: 読書、運動、瞑想
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={habitInput}
                  onChange={(e) => setHabitInput(e.target.value)}
                  placeholder="習慣を入力"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                />
                <Button 
                  onClick={addHabit}
                  size="sm"
                  disabled={!habitInput.trim() || habits.length >= 3}
                  className="px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {habits.map((habit, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1 bg-secondary-accent text-secondary-foreground"
                  >
                    {habit}
                    <button
                      onClick={() => removeHabit(index)}
                      className="ml-1 hover:bg-secondary-foreground/10 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={handleBasicInfoSubmit}
              disabled={!name.trim() || habits.length === 0}
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-primary"
            >
              次へ（テンプレート作成）
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}