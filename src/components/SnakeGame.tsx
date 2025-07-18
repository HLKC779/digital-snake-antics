import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 5, y: 5 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

interface Position {
  x: number;
  y: number;
}

export const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [gameRunning, setGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });

  const { toast } = useToast();
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameRunning(false);
  };

  const startGame = () => {
    if (gameOver) resetGame();
    setGameRunning(true);
  };

  const pauseGame = () => {
    setGameRunning(false);
  };

  const moveSnake = useCallback(() => {
    if (!gameRunning || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      // Move head
      head.x += direction.x;
      head.y += direction.y;

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setGameRunning(false);
        toast({
          title: "Game Over!",
          description: `You hit the wall! Final score: ${score}`,
          variant: "destructive",
        });
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setGameRunning(false);
        toast({
          title: "Game Over!",
          description: `You hit yourself! Final score: ${score}`,
          variant: "destructive",
        });
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
            toast({
              title: "New High Score!",
              description: `Amazing! New record: ${newScore}`,
            });
          }
          return newScore;
        });
        setFood(generateFood());
        toast({
          title: "Yummy!",
          description: "+10 points",
        });
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameRunning, gameOver, score, highScore, generateFood, toast]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameRunning) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          e.preventDefault();
          pauseGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameRunning]);

  useEffect(() => {
    if (gameRunning) {
      gameLoopRef.current = setInterval(moveSnake, 150);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameRunning, moveSnake]);

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;

        let cellClass = 'w-4 h-4 border border-game-grid';
        
        if (isSnakeHead) {
          cellClass += ' bg-game-snake-head shadow-lg';
        } else if (isSnakeBody) {
          cellClass += ' bg-game-snake';
        } else if (isFood) {
          cellClass += ' bg-game-food animate-pulse shadow-lg';
        } else {
          cellClass += ' bg-game-bg';
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Snake Game
        </h1>
        <p className="text-muted-foreground">Use arrow keys to control the snake</p>
      </div>

      <div className="flex gap-8 items-start">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-foreground font-medium">Score:</span>
              <span className="text-primary font-bold text-xl">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground font-medium">High Score:</span>
              <span className="text-accent font-bold text-xl">{highScore}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {!gameRunning && !gameOver && (
              <Button onClick={startGame} className="w-full">
                Start Game
              </Button>
            )}
            {gameRunning && (
              <Button onClick={pauseGame} variant="secondary" className="w-full">
                Pause (Space)
              </Button>
            )}
            {gameOver && (
              <Button onClick={startGame} className="w-full">
                Play Again
              </Button>
            )}
            <Button onClick={resetGame} variant="outline" className="w-full">
              Reset
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>↑↓←→ Move</p>
            <p>Space = Pause</p>
          </div>
        </Card>

        <Card className="p-4">
          <div 
            className="grid gap-0 border border-border rounded-lg overflow-hidden"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              backgroundColor: 'hsl(var(--game-bg))'
            }}
          >
            {renderGrid()}
          </div>
        </Card>
      </div>

      {gameOver && (
        <Card className="p-6 text-center border-destructive bg-destructive/10">
          <h2 className="text-2xl font-bold text-destructive mb-2">Game Over!</h2>
          <p className="text-destructive/80">Final Score: {score}</p>
          {score === highScore && score > 0 && (
            <p className="text-accent font-bold mt-2">🎉 New High Score! 🎉</p>
          )}
        </Card>
      )}
    </div>
  );
};