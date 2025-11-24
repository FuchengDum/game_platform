# 🚀 游戏开发快速指南

本指南帮助你快速上手，在 Phaser 游戏大厅中开发各类小游戏。

## 📋 目录

1. [5分钟快速开始](#5分钟快速开始)
2. [游戏类型模板](#游戏类型模板)
3. [常用代码片段](#常用代码片段)
4. [调试技巧](#调试技巧)

## 5分钟快速开始

### 创建新游戏的完整流程

```bash
# 1. 创建游戏目录
mkdir -p src/games/my-game/scenes

# 2. 复制模板文件（从现有游戏）
cp src/games/breakout/config.js src/games/my-game/
cp src/games/breakout/index.js src/games/my-game/
cp src/games/breakout/scenes/GameScene.js src/games/my-game/scenes/

# 3. 修改配置和代码
# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000 查看你的游戏
```

## 游戏类型模板

### 1. 街机游戏模板（Arcade）

适合：打砖块、太空射击、跑酷等

```javascript
// config.js
export default {
  name: '街机游戏',
  category: 'arcade',
  gameConfig: {
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    }
  }
};

// GameScene.js
export default class GameScene extends Phaser.Scene {
  create() {
    // 创建玩家
    this.player = this.physics.add.sprite(400, 500, 'player');
    this.player.setCollideWorldBounds(true);

    // 创建敌人组
    this.enemies = this.physics.add.group();

    // 碰撞检测
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );

    // 键盘输入
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // 玩家移动
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }
  }

  hitEnemy(player, enemy) {
    enemy.destroy();
    this.score += 10;
  }
}
```

### 2. 益智游戏模板（Puzzle）

适合：消消乐、拼图、数独等

```javascript
// config.js
export default {
  name: '益智游戏',
  category: 'puzzle',
  gameConfig: {
    width: 600,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 }
      }
    }
  }
};

// GameScene.js
export default class GameScene extends Phaser.Scene {
  create() {
    this.gridSize = 8;
    this.tileSize = 60;
    this.grid = [];

    // 创建网格
    this.createGrid();

    // 点击事件
    this.input.on('pointerdown', this.handleClick, this);
  }

  createGrid() {
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        const x = col * this.tileSize + 60;
        const y = row * this.tileSize + 60;
        const tile = this.add.rectangle(x, y, this.tileSize - 4, this.tileSize - 4, 0x0ea5e9);
        tile.setInteractive();
        tile.setData('row', row);
        tile.setData('col', col);
        this.grid[row][col] = tile;
      }
    }
  }

  handleClick(pointer) {
    const tile = this.grid[0][0]; // 获取点击的方块
    // 处理点击逻辑
  }
}
```

### 3. 动作游戏模板（Action）

适合：平台跳跃、格斗、冒险等

```javascript
// config.js
export default {
  name: '动作游戏',
  category: 'action',
  gameConfig: {
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800 },  // 重力
        debug: false
      }
    }
  }
};

// GameScene.js
export default class GameScene extends Phaser.Scene {
  create() {
    // 创建平台
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    // 创建玩家
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // 碰撞
    this.physics.add.collider(this.player, this.platforms);

    // 键盘
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    // 跳跃
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-500);
    }
  }
}
```

### 4. 休闲游戏模板（Casual）

适合：点击游戏、放置游戏等

```javascript
// config.js
export default {
  name: '休闲游戏',
  category: 'casual',
  gameConfig: {
    width: 600,
    height: 800,
    physics: {
      default: 'arcade'
    }
  }
};

// GameScene.js
export default class GameScene extends Phaser.Scene {
  create() {
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff'
    });

    // 创建可交互对象
    this.createInteractiveObjects();

    // 定时器
    this.time.addEvent({
      delay: 1000,
      callback: this.spawnObject,
      callbackScope: this,
      loop: true
    });
  }

  createInteractiveObjects() {
    // 创建可点击的对象
  }

  spawnObject() {
    // 生成新对象
  }
}
```

## 常用代码片段

### 1. 分数系统

```javascript
create() {
  this.score = 0;
  this.scoreText = this.add.text(16, 16, '分数: 0', {
    fontSize: '24px',
    fill: '#fff',
    fontFamily: 'Arial'
  });
}

addScore(points) {
  this.score += points;
  this.scoreText.setText('分数: ' + this.score);
}
```

### 2. 生命值系统

```javascript
create() {
  this.lives = 3;
  this.livesText = this.add.text(700, 16, '❤️ x 3', {
    fontSize: '24px',
    fill: '#fff'
  });
}

loseLife() {
  this.lives--;
  this.livesText.setText('❤️ x ' + this.lives);

  if (this.lives <= 0) {
    this.gameOver();
  }
}
```

### 3. 倒计时系统

```javascript
create() {
  this.timeLeft = 60;
  this.timerText = this.add.text(400, 16, '时间: 60', {
    fontSize: '24px',
    fill: '#fff'
  }).setOrigin(0.5, 0);

  this.timerEvent = this.time.addEvent({
    delay: 1000,
    callback: this.updateTimer,
    callbackScope: this,
    loop: true
  });
}

updateTimer() {
  this.timeLeft--;
  this.timerText.setText('时间: ' + this.timeLeft);

  if (this.timeLeft <= 0) {
    this.timerEvent.remove();
    this.gameOver();
  }
}
```

### 4. 粒子效果

```javascript
create() {
  // 创建粒子发射器
  this.particles = this.add.particles('particle');

  this.emitter = this.particles.createEmitter({
    speed: 100,
    scale: { start: 1, end: 0 },
    blendMode: 'ADD',
    lifespan: 600
  });

  // 停止发射
  this.emitter.stop();
}

explode(x, y) {
  // 在指定位置爆炸
  this.emitter.explode(16, x, y);
}
```

### 5. 对象池

```javascript
create() {
  // 创建对象池
  this.bulletPool = this.physics.add.group({
    classType: Bullet,
    maxSize: 30,
    runChildUpdate: true
  });
}

shoot() {
  // 从池中获取对象
  const bullet = this.bulletPool.get(this.player.x, this.player.y);

  if (bullet) {
    bullet.fire(this.player.x, this.player.y);
  }
}

// Bullet 类
class Bullet extends Phaser.Physics.Arcade.Sprite {
  fire(x, y) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityY(-300);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.y <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}
```

### 6. 触摸/鼠标控制

```javascript
create() {
  // 点击事件
  this.input.on('pointerdown', (pointer) => {
    console.log('点击位置:', pointer.x, pointer.y);
  });

  // 拖拽
  this.input.on('pointermove', (pointer) => {
    if (pointer.isDown) {
      this.player.x = pointer.x;
      this.player.y = pointer.y;
    }
  });

  // 滑动检测
  this.input.on('pointerup', (pointer) => {
    const swipeTime = pointer.upTime - pointer.downTime;
    const swipeDistance = Phaser.Math.Distance.Between(
      pointer.downX,
      pointer.downY,
      pointer.upX,
      pointer.upY
    );

    if (swipeTime < 300 && swipeDistance > 50) {
      // 检测滑动方向
      const angle = Phaser.Math.Angle.Between(
        pointer.downX,
        pointer.downY,
        pointer.upX,
        pointer.upY
      );
      // 处理滑动
    }
  });
}
```

### 7. 音效管理

```javascript
preload() {
  this.load.audio('bgm', 'assets/audio/bgm.mp3');
  this.load.audio('jump', 'assets/audio/jump.mp3');
  this.load.audio('coin', 'assets/audio/coin.mp3');
}

create() {
  // 背景音乐
  this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
  this.bgm.play();

  // 音效
  this.jumpSound = this.sound.add('jump');
  this.coinSound = this.sound.add('coin');
}

playJumpSound() {
  this.jumpSound.play();
}

// 停止所有音频
stopAllSounds() {
  this.sound.stopAll();
}
```

### 8. 动画系统

```javascript
preload() {
  this.load.spritesheet('player', 'assets/player.png', {
    frameWidth: 32,
    frameHeight: 48
  });
}

create() {
  // 创建动画
  this.anims.create({
    key: 'idle',
    frames: [{ key: 'player', frame: 0 }],
    frameRate: 10
  });

  this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', { start: 1, end: 4 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'jump',
    frames: [{ key: 'player', frame: 5 }],
    frameRate: 10
  });

  this.player = this.add.sprite(400, 300, 'player');
}

update() {
  if (this.cursors.left.isDown || this.cursors.right.isDown) {
    this.player.play('walk', true);
  } else {
    this.player.play('idle', true);
  }
}
```

### 9. 碰撞检测

```javascript
create() {
  // 简单碰撞
  this.physics.add.collider(this.player, this.platforms);

  // 重叠检测（不产生物理效果）
  this.physics.add.overlap(
    this.player,
    this.coins,
    this.collectCoin,
    null,
    this
  );

  // 带条件的碰撞
  this.physics.add.collider(
    this.player,
    this.enemies,
    this.hitEnemy,
    (player, enemy) => {
      // 返回 true 才会触发碰撞
      return enemy.active;
    },
    this
  );
}

collectCoin(player, coin) {
  coin.disableBody(true, true);
  this.score += 10;
}

hitEnemy(player, enemy) {
  this.loseLife();
}
```

### 10. 场景切换

```javascript
// 启动另一个场景
this.scene.start('GameOverScene', { score: this.score });

// 暂停当前场景并启动另一个
this.scene.pause();
this.scene.launch('PauseScene');

// 恢复场景
this.scene.resume('GameScene');

// 停止场景
this.scene.stop('PauseScene');
```

## 调试技巧

### 1. 启用物理调试

```javascript
gameConfig: {
  physics: {
    arcade: {
      debug: true  // 显示碰撞边界
    }
  }
}
```

### 2. 控制台日志

```javascript
update() {
  console.log('Player position:', this.player.x, this.player.y);
  console.log('Player velocity:', this.player.body.velocity);
}
```

### 3. 显示 FPS

```javascript
create() {
  this.fpsText = this.add.text(10, 10, '', {
    fontSize: '16px',
    fill: '#00ff00'
  });
}

update() {
  this.fpsText.setText('FPS: ' + Math.round(this.game.loop.actualFps));
}
```

### 4. 暂停游戏进行检查

```javascript
// 在浏览器控制台中
game.scene.pause('GameScene');
game.scene.resume('GameScene');
```

## 性能优化建议

1. **使用对象池** - 避免频繁创建/销毁对象
2. **限制粒子数量** - 粒子效果不要太多
3. **优化碰撞检测** - 只检测必要的碰撞
4. **使用纹理图集** - 合并小图片
5. **避免在 update 中创建对象** - 在 create 中预创建

## 常见问题解决

### Q: 游戏画面模糊？

```javascript
gameConfig: {
  type: Phaser.WEBGL,
  pixelArt: true,  // 像素游戏使用
  antialias: false
}
```

### Q: 触摸控制不灵敏？

```javascript
this.input.addPointer(2);  // 支持多点触控
```

### Q: 游戏在移动端太慢？

- 降低分辨率
- 减少粒子效果
- 使用对象池
- 禁用物理调试

---

**祝你开发愉快！** 🎮✨
