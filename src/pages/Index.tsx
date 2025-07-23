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
  const [gameState, setGameState] = useState<'menu' | 'levels' | 'playing' | 'records'>('menu');
  const [gameMode, setGameMode] = useState<'level' | 'endless'>('level');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [endlessScore, setEndlessScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedBubbles, setSelectedBubbles] = useState<string[]>([]);
  const [bubblesPopped, setBubblesPopped] = useState(0);
  
  // Состояние для перемещения камеры
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

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

  // Обработчики перемещения камеры
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPoint(cameraOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setCameraOffset({
      x: Math.max(-200, Math.min(200, lastPanPoint.x + deltaX)),
      y: Math.max(-200, Math.min(200, lastPanPoint.y + deltaY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch события для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setLastPanPoint(cameraOffset);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    
    setCameraOffset({
      x: Math.max(-200, Math.min(200, lastPanPoint.x + deltaX)),
      y: Math.max(-200, Math.min(200, lastPanPoint.y + deltaY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Генерация пузырьков по уровню
  const generateBubbles = useCallback(() => {
    const newBubbles: Bubble[] = [];
    let bubbleCount = 60;
    let specialChance = 0.1;
    
    if (gameMode === 'level') {
      // Прогрессия сложности по уровням
      bubbleCount = Math.min(40 + currentLevel * 5, 80);
      specialChance = Math.min(0.05 + currentLevel * 0.02, 0.2);
    } else {
      // Бесконечный режим - увеличение сложности по очкам
      const difficulty = Math.floor(score / 500);
      bubbleCount = Math.min(50 + difficulty * 3, 90);
      specialChance = Math.min(0.08 + difficulty * 0.01, 0.15);
    }
    
    // Генерируем пузыри в большем пространстве для перемещения камеры
    for (let i = 0; i < bubbleCount; i++) {
      const isSpecial = Math.random() < specialChance;
      const specialTypes = Object.keys(specialBubbleTypes) as (keyof typeof specialBubbleTypes)[];
      const specialType = isSpecial ? specialTypes[Math.floor(Math.random() * specialTypes.length)] : undefined;
      
      newBubbles.push({
        id: `bubble-${i}`,
        x: Math.random() * 700, // Увеличиваем игровое пространство
        y: Math.random() * 800,
        color: isSpecial 
          ? specialBubbleTypes[specialType!].color
          : colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 20 + 30,
        isSpecial,
        specialType
      });
    }
    setBubbles(newBubbles);
    setBubblesPopped(0);
    setCameraOffset({ x: 0, y: 0 }); // Сброс позиции камеры
  }, [gameMode, currentLevel, score]);

  // Обработка клика по пузырю
  const handleBubbleClick = (bubbleId: string) => {
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    let bubblesRemoved = 1;
    
    if (bubble.isSpecial) {
      // Обработка специальных пузырей
      let bonusPoints = 0;
      switch (bubble.specialType) {
        case 'bomb':
          bonusPoints = 100;
          // Взрыв соседних пузырей
          const nearbyBubbles = bubbles.filter(b => 
            Math.abs(b.x - bubble.x) <= 60 && Math.abs(b.y - bubble.y) <= 60
          );
          bubblesRemoved = nearbyBubbles.length;
          setBubbles(prev => prev.filter(b => 
            Math.abs(b.x - bubble.x) > 60 || Math.abs(b.y - bubble.y) > 60
          ));
          break;
        case 'multicolor':
          bonusPoints = 50;
          // Удаляет все пузыри одного случайного цвета
          const targetColor = colors[Math.floor(Math.random() * colors.length)];
          const colorBubbles = bubbles.filter(b => b.color === targetColor);
          bubblesRemoved = colorBubbles.length;
          setBubbles(prev => prev.filter(b => b.color !== targetColor));
          break;
        case 'lightning':
          bonusPoints = 75;
          // Удаляет вертикальную линию пузырей
          const lineBubbles = bubbles.filter(b => Math.abs(b.x - bubble.x) <= 30);
          bubblesRemoved = lineBubbles.length;
          setBubbles(prev => prev.filter(b => Math.abs(b.x - bubble.x) > 30));
          break;
      }
      setScore(prev => prev + bonusPoints);
    } else {
      // Обычное удаление пузыря
      setBubbles(prev => prev.filter(b => b.id !== bubbleId));
      setScore(prev => prev + 10);
    }
    
    setBubblesPopped(prev => prev + bubblesRemoved);
  };

  // Загрузка сохраненных данных
  useEffect(() => {
    const savedBestScore = localStorage.getItem('bubbleKvasBestScore');
    const savedEndlessScore = localStorage.getItem('bubbleKvasEndlessScore');
    const savedUnlockedLevels = localStorage.getItem('bubbleKvasUnlockedLevels');
    
    if (savedBestScore) setBestScore(parseInt(savedBestScore));
    if (savedEndlessScore) setEndlessScore(parseInt(savedEndlessScore));
    if (savedUnlockedLevels) setUnlockedLevels(parseInt(savedUnlockedLevels));
  }, []);

  // Сохранение рекордов
  useEffect(() => {
    if (gameMode === 'level' && score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bubbleKvasBestScore', score.toString());
    }
    if (gameMode === 'endless' && score > endlessScore) {
      setEndlessScore(score);
      localStorage.setItem('bubbleKvasEndlessScore', score.toString());
    }
  }, [score, bestScore, endlessScore, gameMode]);

  // Проверка завершения уровня
  useEffect(() => {
    if (gameMode === 'level' && bubbles.length === 0 && bubblesPopped > 0) {
      // Разблокировка следующего уровня
      if (currentLevel >= unlockedLevels) {
        const newUnlockedLevels = currentLevel + 1;
        setUnlockedLevels(newUnlockedLevels);
        localStorage.setItem('bubbleKvasUnlockedLevels', newUnlockedLevels.toString());
      }
    }
  }, [bubbles.length, bubblesPopped, currentLevel, unlockedLevels, gameMode]);

  // Начало игры
  const startGame = (mode: 'level' | 'endless', level?: number) => {
    setGameMode(mode);
    if (level) setCurrentLevel(level);
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
            onClick={() => setGameState('levels')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Icon name="Map" size={20} className="mr-2" />
            Уровни
          </Button>
          
          <Button 
            onClick={() => startGame('endless')}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Icon name="Infinity" size={20} className="mr-2" />
            Бесконечный режим
          </Button>
          
          <Button 
            onClick={() => setGameState('records')}
            variant="outline"
            className="w-full border-2 border-cyan-400 text-cyan-600 hover:bg-cyan-50 font-semibold py-3 rounded-full"
          >
            <Icon name="Trophy" size={20} className="mr-2" />
            Рекорды
          </Button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 space-y-1">
          <p>🎯 Лопай обычные пузыри: +10 очков</p>
          <p>💣 Бомба: взрывает соседние (+100)</p>
          <p>✨ Мультицвет: убирает все одного цвета (+50)</p>
          <p>⚡ Молния: убирает вертикальную линию (+75)</p>
          <p className="text-blue-600 font-semibold">👆 Перемещайте игровое поле мышью или пальцем!</p>
        </div>
      </Card>
    </div>
  );

  // Экран выбора уровней
  const renderLevels = () => (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={() => setGameState('menu')} 
            variant="outline" 
            className="bg-white/80 backdrop-blur-sm border-0"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
          <h2 className="text-2xl font-bold text-white">Уровни</h2>
          <div></div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
            const isUnlocked = level <= unlockedLevels;
            const isCompleted = level < unlockedLevels;
            
            return (
              <Button
                key={level}
                onClick={() => isUnlocked ? startGame('level', level) : null}
                disabled={!isUnlocked}
                className={`aspect-square text-lg font-bold relative ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg' 
                    : isUnlocked
                      ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-all duration-200`}
              >
                {isCompleted && (
                  <Icon name="Check" size={12} className="absolute top-1 right-1" />
                )}
                {level}
              </Button>
            );
          })}
        </div>

        <Card className="p-4 bg-white/90 backdrop-blur-sm border-0">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Прогресс</p>
            <div className="flex justify-between text-sm">
              <span>Пройдено: {unlockedLevels - 1}/20</span>
              <span>Лучший счет: {bestScore}</span>
            </div>
          </div>
        </Card>
      </div>
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
        
        <div className="flex gap-2 text-sm">
          <Badge className="bg-white/90 text-gray-800 px-3 py-1 font-bold">
            <Icon name="Star" size={14} className="mr-1" />
            {score}
          </Badge>
          {gameMode === 'level' && (
            <Badge className="bg-blue-400/90 text-white px-3 py-1 font-bold">
              Уровень {currentLevel}
            </Badge>
          )}
          {gameMode === 'endless' && (
            <Badge className="bg-purple-400/90 text-white px-3 py-1 font-bold">
              <Icon name="Infinity" size={14} className="mr-1" />
              Бесконечный
            </Badge>
          )}
          <Badge className="bg-yellow-400/90 text-gray-800 px-3 py-1 font-bold">
            <Icon name="Trophy" size={14} className="mr-1" />
            {gameMode === 'level' ? bestScore : endlessScore}
          </Badge>
        </div>
      </div>

      {/* Игровое поле */}
      <div 
        className="relative w-full max-w-md mx-auto h-96 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/30 overflow-hidden select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="absolute inset-0 transition-transform duration-100"
          style={{
            transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
            width: '700px',
            height: '800px',
            left: '-200px',
            top: '-200px'
          }}
        >
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) handleBubbleClick(bubble.id);
              }}
              className={`absolute cursor-pointer rounded-full ${bubble.color} shadow-lg transform hover:scale-110 transition-all duration-200 flex items-center justify-center animate-pulse`}
              style={{
                left: `${bubble.x}px`,
                top: `${bubble.y}px`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                pointerEvents: isDragging ? 'none' : 'auto'
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
        </div>
        
        {bubbles.length === 0 && bubblesPopped > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <Icon name="CheckCircle" size={48} className="mx-auto mb-2" />
              <p className="text-xl font-bold">
                {gameMode === 'level' ? 'Уровень пройден!' : 'Отлично!'}
              </p>
              {gameMode === 'level' ? (
                <div className="space-y-2">
                  <Button 
                    onClick={() => startGame('level', currentLevel + 1)}
                    disabled={currentLevel >= 20}
                    className="mt-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                  >
                    {currentLevel >= 20 ? 'Все уровни пройдены!' : 'Следующий уровень'}
                  </Button>
                  <Button 
                    onClick={() => setGameState('levels')}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    Выбрать уровень
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={generateBubbles}
                  className="mt-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                >
                  Продолжить
                </Button>
              )}
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
            <p className="text-sm opacity-90">Уровни - лучший результат</p>
            <p className="text-3xl font-bold">{bestScore}</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-4 rounded-xl text-white">
            <p className="text-sm opacity-90">Бесконечный режим</p>
            <p className="text-2xl font-bold">{endlessScore}</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-4 rounded-xl text-white">
            <p className="text-sm opacity-90">Пройдено уровней</p>
            <p className="text-2xl font-bold">{unlockedLevels - 1}/20</p>
          </div>
          
          {score > 0 && (
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-xl text-white">
              <p className="text-sm opacity-90">Текущий счет</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
          )}
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
      {gameState === 'levels' && renderLevels()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'records' && renderRecords()}
    </div>
  );
};

export default BubbleKvas;