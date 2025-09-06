import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';

export default function Welcome() {
  const { user, session, isSubscribed, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 新規登録後のユーザーもwelcomeページを表示できるように、自動リダイレクトを無効化
    // if (!loading && user) {
    //   navigate('/dashboard');
    // }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleSubscribe = async (priceType: 'monthly' | 'yearly') => {
    if (!session) {
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        return;
      }

      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout showNavigation={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Fulfill
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              習慣化と目標達成をサポートする<br />
              あなた専用の成長プラットフォーム
            </p>
            
            {!user ? (
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-primary"
              >
                今すぐ始める（無料）
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  アカウント作成完了！早速アプリを使い始めましょう。
                </p>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-primary"
                >
                  ダッシュボードへ移動
                </Button>
              </div>
            )}
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Free Plan */}
            <Card className="relative border-border">
              <CardHeader>
                <CardTitle className="text-xl">無料プラン</CardTitle>
                <CardDescription>まずは試してみる</CardDescription>
                <div className="text-3xl font-bold">¥0</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    習慣化タスク 1個
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    単発タスク 1日3個まで
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    基本的な進捗管理
                  </li>
                </ul>
                {!user && (
                  <Button 
                    onClick={handleGetStarted}
                    variant="outline" 
                    className="w-full"
                  >
                    無料で始める
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="relative border-primary shadow-lg">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                人気
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">月額プラン</CardTitle>
                <CardDescription>継続して使いたい方に</CardDescription>
                <div className="text-3xl font-bold">¥300<span className="text-sm font-normal">/月</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    習慣化タスク 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    単発タスク 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    目標設定 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    統計分析機能
                  </li>
                </ul>
                <Button 
                  onClick={() => handleSubscribe('monthly')}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isProcessing ? '処理中...' : '月額プランを選ぶ'}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="relative border-border">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600">
                お得
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">年額プラン</CardTitle>
                <CardDescription>約2ヶ月分お得</CardDescription>
                <div className="text-3xl font-bold">¥980<span className="text-sm font-normal">/年</span></div>
                <div className="text-xs text-muted-foreground">月額換算 ¥82</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    習慣化タスク 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    単発タスク 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    目標設定 無制限
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    統計分析機能
                  </li>
                </ul>
                <Button 
                  onClick={() => handleSubscribe('yearly')}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isProcessing ? '処理中...' : '年額プランを選ぶ'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Fulfillで実現できること</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="font-semibold mb-2">習慣の可視化</h3>
                <p className="text-sm text-muted-foreground">
                  日々の習慣を記録し、継続状況をグラフで確認
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="font-semibold mb-2">目標管理</h3>
                <p className="text-sm text-muted-foreground">
                  短期・長期の目標を設定し、進捗を追跡
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-semibold mb-2">詳細な分析</h3>
                <p className="text-sm text-muted-foreground">
                  統計データで成長の軌跡を振り返り
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}