import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, Target, Trash2, Clock, BookOpen } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  dailyGoal: number;
  unit: string;
}

interface InitialSetupProps {
  onSetupComplete: (habits: Habit[]) => void;
  onSkip: () => void;
}

const commonHabits = [
  { name: '水を飲む', unit: 'コップ', suggestedGoal: 8 },
  { name: '運動する', unit: '分', suggestedGoal: 30 },
  { name: '読書する', unit: '分', suggestedGoal: 20 },
  { name: '瞑想する', unit: '分', suggestedGoal: 10 },
  { name: '散歩する', unit: '分', suggestedGoal: 15 },
  { name: '日記を書く', unit: '分', suggestedGoal: 5 },
  { name: '勉強する', unit: '分', suggestedGoal: 60 },
  { name: 'ストレッチする', unit: '分', suggestedGoal: 10 },
];

const units = ['分', 'コップ', '冊', 'ページ', '回', 'km', 'その他'];

export const InitialSetup = ({ onSetupComplete, onSkip }: InitialSetupProps) => {
  const [selectedHabits, setSelectedHabits] = useState<Habit[]>([]);
  const [customHabitName, setCustomHabitName] = useState('');
  const [customHabitGoal, setCustomHabitGoal] = useState('');
  const [customHabitUnit, setCustomHabitUnit] = useState('分');
  const [currentStep, setCurrentStep] = useState(0);

  const addCommonHabit = (habitTemplate: typeof commonHabits[0]) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitTemplate.name,
      dailyGoal: habitTemplate.suggestedGoal,
      unit: habitTemplate.unit,
    };
    setSelectedHabits([...selectedHabits, newHabit]);
  };

  const addCustomHabit = () => {
    if (customHabitName.trim() && customHabitGoal && customHabitUnit) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: customHabitName.trim(),
        dailyGoal: parseInt(customHabitGoal),
        unit: customHabitUnit,
      };
      setSelectedHabits([...selectedHabits, newHabit]);
      setCustomHabitName('');
      setCustomHabitGoal('');
      setCustomHabitUnit('分');
    }
  };

  const removeHabit = (habitId: string) => {
    setSelectedHabits(selectedHabits.filter(h => h.id !== habitId));
  };

  const updateHabitGoal = (habitId: string, newGoal: number) => {
    setSelectedHabits(selectedHabits.map(habit => 
      habit.id === habitId ? { ...habit, dailyGoal: newGoal } : habit
    ));
  };

  const handleComplete = () => {
    onSetupComplete(selectedHabits);
  };

  const steps = [
    {
      title: "Fulfillへようこそ！",
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold">習慣化で理想の自分を実現しましょう</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            まずは継続したい習慣を設定して、毎日の成長を記録していきます。
          </p>
          <Button 
            onClick={() => setCurrentStep(1)}
            className="bg-gradient-to-r from-primary to-primary-glow"
            size="lg"
          >
            習慣を設定する
          </Button>
        </div>
      )
    },
    {
      title: "習慣を選択してください",
      content: (
        <div className="space-y-6">
          {/* Common Habits */}
          <div>
            <h4 className="font-medium mb-3">よく選ばれる習慣</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonHabits.map((habit) => {
                const isSelected = selectedHabits.some(h => h.name === habit.name);
                return (
                  <Button
                    key={habit.name}
                    onClick={() => !isSelected && addCommonHabit(habit)}
                    variant={isSelected ? "default" : "outline"}
                    disabled={isSelected}
                    className="h-auto p-3 text-xs"
                  >
                    <div className="text-center">
                      <div>{habit.name}</div>
                      <div className="text-xs opacity-70">
                        {habit.suggestedGoal}{habit.unit}/日
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom Habit */}
          <div>
            <h4 className="font-medium mb-3">カスタム習慣を追加</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="習慣名"
                value={customHabitName}
                onChange={(e) => setCustomHabitName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="目標"
                value={customHabitGoal}
                onChange={(e) => setCustomHabitGoal(e.target.value)}
              />
              <select 
                className="px-3 py-2 border rounded-md"
                value={customHabitUnit}
                onChange={(e) => setCustomHabitUnit(e.target.value)}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <Button 
                onClick={addCustomHabit}
                disabled={!customHabitName.trim() || !customHabitGoal}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>
          </div>

          {/* Selected Habits */}
          {selectedHabits.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">選択した習慣</h4>
              <div className="space-y-2">
                {selectedHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="font-medium">{habit.name}</span>
                      <Badge variant="outline">
                        <input
                          type="number"
                          value={habit.dailyGoal}
                          onChange={(e) => updateHabitGoal(habit.id, parseInt(e.target.value) || 0)}
                          className="w-12 bg-transparent border-0 text-center"
                        />
                        {habit.unit}/日
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHabit(habit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onSkip}>
              スキップ
            </Button>
            <Button 
              onClick={() => setCurrentStep(2)}
              disabled={selectedHabits.length === 0}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              次へ
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "設定を確認",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">素晴らしい選択です！</h3>
            <p className="text-muted-foreground">
              以下の習慣で毎日の成長を記録していきましょう。
            </p>
          </div>

          <div className="space-y-3">
            {selectedHabits.map((habit) => (
              <div key={habit.id} className="flex items-center gap-3 p-4 border rounded-lg bg-gradient-to-r from-success/5 to-success-soft/10">
                <CheckCircle className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <div className="font-medium">{habit.name}</div>
                  <div className="text-sm text-muted-foreground">
                    目標: {habit.dailyGoal}{habit.unit}/日
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              戻る
            </Button>
            <Button 
              onClick={handleComplete}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              設定完了
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <Card className="shadow-medium border-0 bg-card/90 backdrop-blur max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
        </div>
        <CardDescription>
          ステップ {currentStep + 1} / {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {steps[currentStep].content}
      </CardContent>
    </Card>
  );
};