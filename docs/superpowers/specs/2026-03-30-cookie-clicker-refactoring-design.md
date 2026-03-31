# Cookie Clicker 전면 리팩토링 설계

**날짜**: 2026-03-30  
**목표**: SOLID 원칙, DI 패턴 적용, 성능 최적화

---

## 1. 현재 문제점

### 백엔드
- Service가 Config 직접 참조 → SRP 위반
- Repository에 db, saveDB 직접 전달 → 추상화 부족
- effects 객체가 여러 서비스에서 직접 생성 → 중복 코드
- bulk update 없음 → `incrementLevel` N회 호출 시 성능 저하

### 프론트엔드
- game.js 735줄 → 모든 로직混杂
- 상태, 렌더링, API 통신 섞여 있음 → SRP 위반
- 전체 DOM 재생성 → 성능 저하
- 캐시 문제 → 버그 원인 파악困难

---

## 2. 백엔드 아키텍처

### 2.1 폴더 구조

```
src/
├── config/
│   ├── upgrades.js           # 업그레이드 설정
│   ├── skills.js             # 스킬 설정
│   └── constants.js          # 게임 상수 (MAX_LEVEL, etc)
│
├── interfaces/
│   ├── IReadableRepository.js  # Repository 조회 인터페이스 (ISP)
│   ├── IWritableRepository.js  # Repository 작성 인터페이스 (ISP)
│   ├── IRepository.js          # Repository 전체 인터페이스 (LSP)
│   ├── IService.js             # Service 추상화 (getById, getAll, create, update)
│   ├── IValidator.js           # Validator 추상화 (validate)
│   └── ICache.js               # Cache 추상화 (get, set, delete, clear)
│
├── infrastructure/
│   ├── DatabaseAdapter.js    # DB 추상화 (sql.js wrapper)
│   ├── MemoryCache.js        # LRU 캐시 (50개 플레이어 상태)
│   ├── EventBus.js           # 이벤트 발행/구독
│   └── RequestQueue.js       # 비동기 작업 큐
│
├── models/
│   ├── Player.js             # Player Entity
│   ├── Upgrade.js            # Upgrade Entity
│   ├── Skill.js              # Skill Entity
│   ├── Effects.js            # Effects Value Object
│   └── GameState.js          # 전체 상태 Snapshot
│
├── repositories/
│   ├── baseRepository.js     # BaseRepository (implements IRepository)
│   ├── playerRepository.js   # PlayerRepository (extends BaseRepository)
│   ├── upgradeRepository.js  # UpgradeRepository (extends BaseRepository)
│   └── skillRepository.js    # SkillRepository (extends BaseRepository)
│
├── services/
│   ├── playerService.js      # Player 비즈니스 로직
│   ├── upgradeService.js     # Upgrade 비즈니스 로직
│   ├── skillService.js       # Skill 비즈니스 로직
│   ├── prestigeService.js    # Prestige 비즈니스 로직
│   ├── effectsService.js     # Effects 계산 전담
│   ├── statsCalculator.js    # 수치 계산
│   └── cacheService.js       # 캐시 관리
│
├── validators/
│   ├── upgradeValidator.js   # Upgrade 검증 (level, cost, enhancement)
│   ├── prestigeValidator.js  # Prestige 검증 (min cookies, stars)
│   └── skillValidator.js     # Skill 검증 (cost, dependencies)
│
├── errors/
│   ├── GameError.js          # Base error class
│   ├── ValidationError.js    # 검증 실패
│   ├── InsufficientFundsError.js  # 쿠키 부족
│   ├── MaxLevelReachedError.js    # 만렙 도달
│   └── AlreadyEnhancedError.js    # 이미 강화됨
│   └── errorHandler.js       # Central error handler
│
├── routes/
│   ├── gameRoutes.js         # HTTP 핸들러
│   └── errorHandlerMiddleware.js  # Express error middleware
│
├── container.js              # DI Container (강화된 형태)
└── app.js                    # Entry point
```

### 2.2 클래스 설계

#### Interfaces (추상화)

```javascript
// interfaces/IReadableRepository.js (ISP - 조회만)
class IReadableRepository {
  findById(id) { throw new Error('Not implemented'); }
  findAll() { throw new Error('Not implemented'); }
  findByPlayerId(playerId) { throw new Error('Not implemented'); }
  findByType(playerId, type) { throw new Error('Not implemented'); }
}

// interfaces/IWritableRepository.js (ISP - 작성만)
class IWritableRepository {
  save(entity) { throw new Error('Not implemented'); }
  delete(id) { throw new Error('Not implemented'); }
  incrementLevel(playerId, type) { throw new Error('Not implemented'); }
  incrementEnhancementCount(playerId, type) { throw new Error('Not implemented'); }
}

// interfaces/IRepository.js (LSP - IReadable + IWritable)
class IRepository extends IReadableRepository {
  // IWritableRepository 메서드도 포함 (다중 상속 불가 → 믹스인)
}

// interfaces/IService.js
class IService {
  getById(id) { throw new Error('Not implemented'); }
  getAll() { throw new Error('Not implemented'); }
  create(data) { throw new Error('Not implemented'); }
  update(id, data) { throw new Error('Not implemented'); }
}

// interfaces/ICache.js
class ICache {
  get(key) { throw new Error('Not implemented'); }
  set(key, value) { throw new Error('Not implemented'); }
  delete(key) { throw new Error('Not implemented'); }
  clear() { throw new Error('Not implemented'); }
}
```

#### Models (Entity, Value Object)

```javascript
// models/Player.js
class Player {
  constructor(id, cookies, cps, clickPower, prestigeCount, prestigeStars) {
    this.id = id;
    this.cookies = cookies;
    this.cps = cps;
    this.clickPower = clickPower;
    this.prestigeCount = prestigeCount;
    this.prestigeStars = prestigeStars;
  }
  
  canAfford(cost) {
    return this.cookies >= cost;
  }
  
  spend(amount) {
    this.cookies -= amount;
  }
}

// models/Effects.js (Value Object)
class Effects {
  constructor(hasDiscount, critChance, critMultiplier, autoCritChance) {
    this.hasDiscount = hasDiscount;
    this.critChance = critChance;
    this.critMultiplier = critMultiplier;
    this.autoCritChance = autoCritChance;
  }
  
  static fromUpgrades(upgrades, unlockedSkills) {
    // effects 계산 로직
  }
}
```

#### Infrastructure

```javascript
// infrastructure/DatabaseAdapter.js
class DatabaseAdapter {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
  }
  
  run(sql, params) { this.db.run(sql, params); this.saveDB(); }
  get(sql, params) { return this.db.exec(sql, params)[0]?.values[0]; }
  all(sql, params) { return this.db.exec(sql, params)[0]?.values; }
}

// infrastructure/MemoryCache.js (LRU)
class MemoryCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) { return this.cache.get(key); }
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  delete(key) { this.cache.delete(key); }
  clear() { this.cache.clear(); }
}

// infrastructure/EventBus.js
class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}
```

#### Services (DI 적용)

```javascript
// services/upgradeService.js
class UpgradeService {
  constructor({
    upgradeRepository,
    effectsService,
    statsCalculator,
    validator,
    cache,
    eventBus
  }) {
    this.upgradeRepository = upgradeRepository;
    this.effectsService = effectsService;
    this.statsCalculator = statsCalculator;
    this.validator = validator;
    this.cache = cache;
    this.eventBus = eventBus;
  }
  
  buildUpgradeState(playerId) {
    const cached = this.cache.get(`upgrades:${playerId}`);
    if (cached) return cached;
    
    const upgrades = this.upgradeRepository.findByPlayerId(playerId);
    const effects = this.effectsService.calculate(playerId);
    const state = this._buildState(upgrades, effects);
    
    this.cache.set(`upgrades:${playerId}`, state);
    return state;
  }
  
  buyUpgrade(playerId, type) {
    const upgrade = this.upgradeRepository.findByType(playerId, type);
    const config = this.getUpgradeConfig(type);
    
    this.validator.validateBuy(upgrade, config);
    
    const effects = this.effectsService.calculate(playerId);
    const cost = this.statsCalculator.calculateCost(config, upgrade.level, effects);
    
    // PlayerService에서 쿠키 차감 (이벤트 발행)
    this.eventBus.emit('upgrade:bought', { playerId, type, cost });
    
    this.upgradeRepository.incrementLevel(playerId, type);
    this.cache.delete(`upgrades:${playerId}`);
  }
}
```

#### DI Container (강화)

```javascript
// container.js
class Container {
  constructor(db, saveDB) {
    this.db = db;
    this.saveDB = saveDB;
    this.factories = new Map();
    this.instances = new Map();
    this.init();
  }
  
  init() {
    // Infrastructure
    this.register('databaseAdapter', () => new DatabaseAdapter(this.db, this.saveDB));
    this.register('cache', () => new MemoryCache(50));
    this.register('eventBus', () => new EventBus());
    
    // Repositories
    this.register('playerRepository', () => new PlayerRepository(this.get('databaseAdapter')));
    this.register('upgradeRepository', () => new UpgradeRepository(this.get('databaseAdapter')));
    this.register('skillRepository', () => new SkillRepository(this.get('databaseAdapter')));
    
    // Validators
    this.register('upgradeValidator', () => new UpgradeValidator());
    this.register('prestigeValidator', () => new PrestigeValidator());
    this.register('skillValidator', () => new SkillValidator());
    
    // Services
    this.register('effectsService', () => new EffectsService(
      this.get('upgradeRepository'),
      this.get('skillRepository')
    ));
    
    this.register('upgradeService', () => new UpgradeService({
      upgradeRepository: this.get('upgradeRepository'),
      effectsService: this.get('effectsService'),
      statsCalculator: new StatsCalculator(),
      validator: this.get('upgradeValidator'),
      cache: this.get('cache'),
      eventBus: this.get('eventBus')
    }));
    
    // ... other services
  }
  
  register(name, factory) {
    this.factories.set(name, factory);
  }
  
  get(name) {
    if (!this.instances.has(name)) {
      this.instances.set(name, this.factories.get(name)());
    }
    return this.instances.get(name);
  }
}
```

### 2.3 성능 최적화

| 기술 | 설명 | 적용 위치 |
|------|------|-----------|
| LRU Cache | 50개 플레이어 상태 캐싱 | MemoryCache |
| Batch Update | `incrementLevel` N회 → 1회 SQL | UpgradeRepository.bulkIncrement |
| Event-driven | 상태 변경 → 캐시 무효화 | EventBus |
| Query Optimization | CREATE INDEX on player_id | DatabaseAdapter |

```javascript
// upgradeRepository.js - batch update
bulkIncrementLevels(playerId, type, count) {
  this.db.run(`
    UPDATE upgrades 
    SET level = level + ? 
    WHERE player_id = ? AND upgrade_type = ?
  `, [count, playerId, type]);
  this.saveDB();
}
```

---

## 3. 프론트엔드 아키텍처

### 3.1 폴더 구조

```
public/
├── js/
│   ├── core/
│   │   ├── EventEmitter.js    # Observer 패턴
│   │   ├── StateManager.js    # 상태 관리 + 변경 감지
│   │   ├── DiffRenderer.js    # DOM diff 알고리즘
│   │   ├── ObjectPool.js      # DOM 요소 재사용
│   │   └── RequestQueue.js    # API 요청 배치
│   │
│   ├── services/
│   │   ├── api.js             # fetch wrapper + 캐싱
│   │   ├── effectsCalculator.js  # effects 계산 (Worker 사용)
│   │   ├── audio.js           # 사운드 관리
│   │   └── workerManager.js   # Web Worker 관리
│   │
│   ├── components/
│   │   ├── Component.js       # Base component class
│   │   ├── UpgradeCard.js     # 업그레이드 카드 컴포넌트
│   │   ├── SkillNode.js       # 스킬 노드 컴포넌트
│   │   ├── Toast.js           # 알림 컴포넌트
│   │   └── Modal.js           # 모달 컴포넌트
│   │
│   ├── templates/
│   │   ├── upgradeTemplate.js # 업그레이드 HTML 템플릿
│   │   ├── skillTemplate.js   # 스킬 트리 HTML 템플릿
│   │   └── modalTemplate.js   # 모달 HTML 템플릿
│   │
│   ├── utils/
│   │   ├── format.js          # formatNumber
│   │   ├── debounce.js        # throttle, debounce
│   │   └── math.js            # calculateProgress
│   │
│   └── main.js                # 진입점
│
├── workers/
│   └── stats.worker.js        # Web Worker (계산)
│
├── index.html
└── style.css
```

### 3.2 클래스 설계

#### Core Modules

```javascript
// core/StateManager.js
class StateManager extends EventEmitter {
  constructor(initialState) {
    super();
    this.state = initialState;
    this.previousState = null;
  }
  
  setState(newState) {
    this.previousState = this.state;
    this.state = newState;
    this.emit('state:changed', { 
      current: this.state, 
      previous: this.previousState,
      diff: this._calculateDiff()
    });
  }
  
  getDiff() {
    return this._calculateDiff();
  }
  
  _calculateDiff() {
    // 변경된 필드만 반환
  }
}

// core/DiffRenderer.js
class DiffRenderer {
  constructor(container) {
    this.container = container;
    this.pool = new ObjectPool();
  }
  
  render(items) {
    const existing = this.container.children;
    
    // 삭제: existing - items
    // 추가: items - existing
    // 수정: intersection, changed props
    
    items.forEach(item => {
      const element = this.pool.get(item.type) || this._create(item);
      this._update(element, item);
    });
  }
}

// core/ObjectPool.js
class ObjectPool {
  constructor() {
    this.pool = new Map(); // type -> [elements]
  }
  
  get(type) {
    const elements = this.pool.get(type) || [];
    return elements.pop() || null;
  }
  
  release(type, element) {
    if (!this.pool.has(type)) this.pool.set(type, []);
    this.pool.get(type).push(element);
  }
}
```

#### Components

```javascript
// components/Component.js
import { EventEmitter } from './core/EventEmitter.js';

class Component extends EventEmitter {
  constructor(props, container) {
    super();
    this.props = props;
    this.container = container;
    this.element = null;
  }
  
  render() {
    this.element = this.template(this.props);
    this.container.appendChild(this.element);
    this.bindEvents();
  }
  
  update(newProps) {
    const diff = this._diff(this.props, newProps);
    if (diff.length > 0) {
      this.props = newProps;
      this._patch(diff);
    }
  }
  
  template(props) { throw new Error('Not implemented'); }
  bindEvents() {}
  _diff(oldProps, newProps) {}
  _patch(diff) {}
}

// components/UpgradeCard.js
class UpgradeCard extends Component {
  template(props) {
    const div = document.createElement('div');
    div.className = 'upgrade-item';
    div.dataset.type = props.type;
    div.innerHTML = upgradeTemplate(props);
    return div;
  }
  
  bindEvents() {
    const buttons = this.element.querySelectorAll('.buy-button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.emit('upgrade:action', {
          type: this.props.type,
          action: btn.dataset.action
        });
      });
    });
  }
  
  _patch(diff) {
    // 버튼 disabled 상태만 업데이트
    // progress bar만 업데이트
    // 전체 재생성 X
  }
}
```

#### Services

```javascript
// services/api.js
class ApiService {
  constructor(cache) {
    this.cache = cache;
    this.requestQueue = new RequestQueue();
  }
  
  async getGameState() {
    const cached = this.cache.get('gameState');
    if (cached && Date.now() - cached.timestamp < 1000) {
      return cached.data;
    }
    
    return this.requestQueue.add('/api/game', {
      method: 'GET'
    }).then(data => {
      this.cache.set('gameState', { data, timestamp: Date.now() });
      return data;
    });
  }
  
  async buyUpgrade(type, action) {
    return this.requestQueue.add(`/api/upgrade/${action}`, {
      method: 'POST',
      body: { type }
    });
  }
}

// core/RequestQueue.js
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  
  add(url, options) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this._process();
    });
  }
  
  async _process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    const { url, options, resolve, reject } = this.queue.shift();
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    }
    
    this.processing = false;
    this._process();
  }
}
```

### 3.3 Web Worker

```javascript
// workers/stats.worker.js
self.onmessage = function(e) {
  const { upgrades, skills, type } = e.data;
  
  if (type === 'calculateEffects') {
    const effects = calculateEffects(upgrades, skills);
    self.postMessage({ type: 'effects', data: effects });
  }
  
  if (type === 'calculateStats') {
    const stats = calculateStats(upgrades, skills);
    self.postMessage({ type: 'stats', data: stats });
  }
};

function calculateEffects(upgrades, skills) {
  // 복잡한 effects 계산
  let hasDiscount = false;
  let critChance = 0.05;
  let critMultiplier = 5;
  
  upgrades.forEach(u => {
    if (u.specialEffect === 'cost_10pct_discount' && u.specialEnhancement) {
      hasDiscount = true;
    }
    if (u.specialEffect === 'crit_chance_15pct' && u.specialEnhancement) {
      critChance += 0.15;
    }
  });
  
  return { hasDiscount, critChance, critMultiplier };
}
```

### 3.4 main.js (진입점)

```javascript
// main.js
import { StateManager } from './core/StateManager.js';
import { DiffRenderer } from './core/DiffRenderer.js';
import { ApiService } from './services/api.js';
import { UpgradeCard } from './components/UpgradeCard.js';
import { EventEmitter } from './core/EventEmitter.js';
import { WorkerManager } from './services/workerManager.js';

const eventBus = new EventEmitter();
const stateManager = new StateManager({ cookies: 0, upgrades: [] });
const api = new ApiService(new Map());
const workerManager = new WorkerManager('workers/stats.worker.js');

// State 변경 → Renderer
stateManager.on('state:changed', ({ diff }) => {
  renderer.update(diff);
});

// API → State
async function sync() {
  const gameState = await api.getGameState();
  stateManager.setState(gameState);
}

// Upgrade Action → API
eventBus.on('upgrade:action', async ({ type, action }) => {
  const result = await api.buyUpgrade(type, action);
  if (result.success) {
    sync();
  }
});

// 초기화
sync();
setInterval(sync, 1000);
```

### 3.5 성능 최적화

| 기술 | 설명 | 적용 위치 |
|------|------|-----------|
| Diff Rendering | 변경된 upgrade만 DOM 업데이트 | DiffRenderer |
| RAF Loop | requestAnimationFrame으로 UI 업데이트 동기화 | main.js |
| Throttle Click | 100ms 내 중복 클릭 무시 | UpgradeCard.bindEvents |
| Object Pool | upgrade-item DOM 요소 재사용 | ObjectPool |
| Web Worker | CPS, effects 계산 Worker에서 처리 | workerManager |
| API Cache | /api/game 1초 캐싱 | ApiService |
| Request Queue | API 요청 순차 처리 | RequestQueue |

---

## 4. SOLID 적용 상세

### SRP (Single Responsibility Principle)

| 파일 | 단일 역할 |
|------|-----------|
| EffectsService | effects 계산만 |
| UpgradeValidator | 업그레이드 검증만 |
| UpgradeCard | 업그레이드 UI만 |
| upgradeTemplate | HTML 템플릿만 |

### OCP (Open-Closed Principle)

| 확장 | 수정 없이 확장 |
|------|---------------|
| 새 업그레이드 타입 | upgrades.js만 수정 |
| 새 스킬 | skills.js만 수정 |
| 새 에러 타입 | GameError 상속 |

### LSP (Liskov Substitution Principle)

| 인터페이스 | 구현체 |
|-----------|--------|
| IRepository | PlayerRepository, UpgradeRepository, SkillRepository 모두 대체 가능 |

### ISP (Interface Segregation Principle)

| 분리된 인터페이스 | 용도 |
|------------------|------|
| IReadableRepository | findById, findAll (조회만) |
| IWritableRepository | save, delete (작성만) |

### DIP (Dependency Inversion Principle)

| 상위 모듈 | 하위 모듈 (인터페이스에만 의존) |
|----------|----------------------------|
| UpgradeService | upgradeRepository (IRepository) |
| UpgradeService | effectsService (IService) |
| UpgradeService | validator (IValidator) |

---

## 5. 마이그레이션 계획

### Phase 1: 백엔드 리팩토링
1. interfaces/ 생성
2. infrastructure/ 생성 (DatabaseAdapter, MemoryCache, EventBus)
3. models/ 생성
4. repositories/ 리팩토링 (BaseRepository)
5. validators/ 생성
6. errors/ 생성
7. services/ 리팩토링
8. container.js 강화
9. routes/ 리팩토링

### Phase 2: 프론트엔드 리팩토링
1. core/ 생성 (EventEmitter, StateManager, DiffRenderer, ObjectPool)
2. utils/ 생성
3. templates/ 생성
4. components/ 생성 (Component base, UpgradeCard, SkillNode)
5. services/ 생성 (api, workerManager)
6. workers/stats.worker.js 생성
7. main.js 진입점

### Phase 3: 테스트 & 버그 수정
1. 만렙 버튼 버그 확인 (리팩토링 중 해결)
2. 기능 테스트
3. 성능 테스트

---

## 6. 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| 백엔드 파일 수 | 12 | ~30 |
| 프론트엔드 파일 수 | 3 | ~20 |
| game.js 라인 수 | 735 | main.js ~100 |
| DOM 업데이트 | 전체 재생성 | Diff만 업데이트 |
| API 호출 | 중복 가능 | 캐싱 + Queue |
| 캐시 버그 | 브라우저 캐시 문제 | ES6 모듈로 해결 |