import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Bubble {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  isSpecial?: boolean;
  specialType?: 'bomb' | 'multicolor' | 'lightning';
}

const BubbleKvas = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'records'>('menu');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedBubbles, setSelectedBubbles] = useState<string[]>([]);

  const colors = [
    'bg-gradient-to-br from-orange-400 to-orange-600', // #FF6B35
    'bg-gradient-to-br from-cyan-400 to-blue-500',     // #45B7D1
    'bg-gradient-to-br from-purple-400 to-purple-600', // #9B59B6
    'bg-gradient-to-br from-yellow-400 to-orange-500', // #F7931E
    'bg-gradient-to-br from-pink-400 to-rose-500',
    'bg-gradient-to-br from-green-400 to-emerald-500',
  ];

  const specialBubbleTypes = {
    bomb: { color: 'bg-gradient-to-br from-red-500 to-red-700', icon: 'Bomb' },
    multicolor: { color: 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500', icon: 'Sparkles' },
    lightning: { color: 'bg-gradient-to-br from-yellow-300 to-yellow-500', icon: 'Zap' }
  };

  // Генерация случайных пузырьков
  const generateBubbles = useCallback(() => {
    const newBubbles: Bubble[] = [];
    for (let i = 0; i < 60; i++) {
      const isSpecial = Math.random() < 0.1; // 10% шанс специального пузыря
      const specialTypes = Object.keys(specialBubbleTypes) as (keyof typeof specialBubbleTypes)[];
      const specialType = isSpecial ? specialTypes[Math.floor(Math.random() * specialTypes.length)] : undefined;
      
      newBubbles.push({
        id: `bubble-${i}`,
        x: Math.random() * 300,
        y: Math.random() * 400,
        color: isSpecial 
          ? specialBubbleTypes[specialType!].color
          : colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 20 + 30,
        isSpecial,
        specialType
      });
    }
    setBubbles(newBubbles);
  }, []);

  // Обработка клика по пузырю
  const handleBubbleClick = (bubbleId: string) => {
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    if (bubble.isSpecial) {
      // Обработка специальных пузырей
      let bonusPoints = 0;
      switch (bubble.specialType) {
        case 'bomb':
          bonusPoints = 100;
          // Взрыв соседних пузырей
          setBubbles(prev => prev.filter(b => 
            Math.abs(b.x - bubble.x) > 60 || Math.abs(b.y - bubble.y) > 60
          ));
          break;
        case 'multicolor':
          bonusPoints = 50;
          // Удаляет все пузыри одного случайного цвета
          const targetColor = colors[Math.floor(Math.random() * colors.length)];
          setBubbles(prev => prev.filter(b => b.color !== targetColor));
          break;
        case 'lightning':
          bonusPoints = 75;
          // Удаляет вертикальную линию пузырей
          setBubbles(prev => prev.filter(b => Math.abs(b.x - bubble.x) > 30));
          break;
      }
      setScore(prev => prev + bonusPoints);
    } else {
      // Обычное удаление пузыря
      setBubbles(prev => prev.filter(b => b.id !== bubbleId));
      setScore(prev => prev + 10);
    }
  };

  // Загрузка лучшего счета
  useEffect(() => {
    const saved = localStorage.getItem('bubbleKvasBestScore');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  // Сохранение рекорда
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bubbleKvasBestScore', score.toString());
    }
  }, [score, bestScore]);

  // Начало игры
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    generateBubbles();
  };

  // Главное меню
  const renderMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center">
      <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 text-center max-w-md mx-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            BUBBLE КВАС
          </h1>
          <p className="text-gray-600">Лопай пузыри и набирай очки!</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={startGame}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Icon name="Play" size={20} className="mr-2" />
            Начать игру
          </Button>
          
          <Button 
            onClick={() => setGameState('records')}
            variant="outline"
            className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-50 font-semibold py-3 rounded-full"
          >
            <Icon name="Trophy" size={20} className="mr-2" />
            Рекорды
          </Button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>🎯 Лопай обычные пузыри: +10 очков</p>
          <p>💣 Бомба: взрывает соседние (+100)</p>
          <p>✨ Мультицвет: убирает все одного цвета (+50)</p>
          <p>⚡ Молния: убирает вертикальную линию (+75)</p>
        </div>
      </Card>
    </div>
  );

  // Экран игры
  const renderGame = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
      {/* Интерфейс игры */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          onClick={() => setGameState('menu')} 
          variant="outline" 
          className="bg-white/80 backdrop-blur-sm border-0"
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Меню
        </Button>
        
        <div className="flex gap-4">
          <Badge className="bg-white/90 text-gray-800 px-4 py-2 text-lg font-bold">
            <Icon name="Star" size={16} className="mr-1" />
            {score}
          </Badge>
          <Badge className="bg-yellow-400/90 text-gray-800 px-4 py-2 text-lg font-bold">
            <Icon name="Trophy" size={16} className="mr-1" />
            {bestScore}
          </Badge>
        </div>
      </div>

      {/* Игровое поле */}
      <div className="relative w-full max-w-md mx-auto h-96 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            onClick={() => handleBubbleClick(bubble.id)}
            className={`absolute cursor-pointer rounded-full ${bubble.color} shadow-lg transform hover:scale-110 transition-all duration-200 flex items-center justify-center animate-pulse`}
            style={{
              left: `${bubble.x}px`,
              top: `${bubble.y}px`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
            }}
          >
            {bubble.isSpecial && (
              <Icon 
                name={specialBubbleTypes[bubble.specialType!].icon as any} 
                size={bubble.size * 0.4} 
                className="text-white drop-shadow-lg" 
              />
            )}
          </div>
        ))}
        
        {bubbles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <Icon name="CheckCircle" size={48} className="mx-auto mb-2" />
              <p className="text-xl font-bold">Молодец!</p>
              <Button 
                onClick={generateBubbles}
                className="mt-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                Следующий уровень
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Экран рекордов
  const renderRecords = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
      <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 text-center max-w-md mx-4">
        <div className="mb-6">
          <Icon name="Trophy" size={48} className="mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Рекорды</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-xl text-white">
            <p className="text-sm opacity-90">Лучший результат</p>
            <p className="text-3xl font-bold">{bestScore}</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-4 rounded-xl text-white">
            <p className="text-sm opacity-90">Текущий счет</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setGameState('menu')}
          className="mt-6 w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-full"
        >
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад в меню
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="font-[Rubik]">
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'records' && renderRecords()}
    </div>
  );
};

export default BubbleKvas;