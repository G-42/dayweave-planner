import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, Grip, Trash2 } from 'lucide-react';

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

interface SavedItemsPanelProps {
  savedItems: ScheduleItem[];
  onDragStart: (e: React.DragEvent, item: ScheduleItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const SavedItemsPanel = ({ savedItems, onDragStart, onDeleteItem }: SavedItemsPanelProps) => {
  // Group saved items by category/type
  const groupedItems = savedItems.reduce((acc, item) => {
    const category = item.isHabit ? '習慣' : item.category || 'その他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  if (savedItems.length === 0) {
    return (
      <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">スケジュール項目</CardTitle>
          <CardDescription>
            過去に追加した項目がここに表示されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">まだ保存された項目がありません</p>
            <p className="text-xs">スケジュールを追加すると自動的に保存されます</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium border-0 bg-card/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg">スケジュール項目</CardTitle>
        <CardDescription>
          ドラッグして今日のスケジュールに追加 ({savedItems.length}個)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span>{category}</span>
              <Badge variant="outline" className="text-xs">
                {items.length}個
              </Badge>
            </div>
            
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, item)}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-all cursor-grab active:cursor-grabbing hover:shadow-md"
                >
                  <Grip className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[100px]">
                    <Clock className="w-3 h-3" />
                    {item.startTime}〜{item.endTime}
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {item.title}
                    </div>
                    {item.isHabit && (
                      <Badge variant="outline" className="text-xs bg-success-soft border-success text-success-foreground mt-1">
                        <Target className="w-3 h-3 mr-1" />
                        {item.habitName}
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-primary/5 rounded border border-primary/20">
          <div className="text-xs text-primary font-medium flex items-center gap-1">
            <Grip className="w-3 h-3" />
            使い方
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            項目をドラッグして今日のスケジュールエリアにドロップすると追加されます
          </div>
        </div>
      </CardContent>
    </Card>
  );
};