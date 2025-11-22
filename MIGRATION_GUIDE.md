# 🔄 Guía de Migración - Context API a Zustand

## 📚 Cómo usar los nuevos stores

### 1. useAuthStore - Autenticación

```typescript
import { useAuthStore } from '@/stores/useAuthStore';

function MyComponent() {
  // Subscripción selectiva (solo se re-renderiza si userId cambia)
  const userId = useAuthStore((state) => state.userId);
  const initAuth = useAuthStore((state) => state.initAuth);

  // O obtener todo el store (no recomendado)
  // const { userId, initAuth } = useAuthStore();

  return <div>User ID: {userId}</div>;
}
```

### 2. useSwipeStore - Estado de Swipe

```typescript
import { useSwipeStore } from '@/stores/useSwipeStore';

function SwipeComponent() {
  // Subscripciones selectivas
  const getCurrentIdea = useSwipeStore((state) => state.getCurrentIdea);
  const answerIdea = useSwipeStore((state) => state.answerIdea);
  const isLoading = useSwipeStore((state) => state.isLoading);

  const currentIdea = getCurrentIdea();

  const handleAnswer = async () => {
    await answerIdea(userId, 'agree');
  };

  if (isLoading) return <div>Loading...</div>;

  return <div>{currentIdea?.text}</div>;
}
```

### 3. useTopicsStore - Gestión de Topics

```typescript
import { useTopicsStore } from '@/stores/useTopicsStore';

function TopicsComponent() {
  const topics = useTopicsStore((state) => state.topics);
  const setTopics = useTopicsStore((state) => state.setTopics);

  return (
    <div>
      {topics.map(topic => (
        <div key={topic.id}>{topic.name}</div>
      ))}
    </div>
  );
}
```

---

## 🔄 Diferencias vs Context API

### Antes (Context API)
```typescript
// ❌ Re-render en CUALQUIER cambio del contexto
const {
  userId,
  currentIdeaIndex,
  answers,
  ideas,
  candidates,
  // ... 11+ valores
} = useAppContext();
```

### Después (Zustand)
```typescript
// ✅ Re-render SOLO cuando cambia userId
const userId = useAuthStore((state) => state.userId);

// ✅ Re-render SOLO cuando cambia isLoading
const isLoading = useSwipeStore((state) => state.isLoading);
```

---

## 🎯 Migración de Componentes Existentes

### Ejemplo: Migrar de useAppContext a Zustand

**Antes:**
```typescript
import { useAppContext } from '@/context/AppContext';

function MyPage() {
  const {
    userId,
    answerIdea,
    getCurrentIdea,
    isLoading
  } = useAppContext();

  const currentIdea = getCurrentIdea();

  return <div>...</div>;
}
```

**Después:**
```typescript
import { useAuthStore } from '@/stores/useAuthStore';
import { useSwipeStore } from '@/stores/useSwipeStore';

function MyPage() {
  // Subscripciones selectivas
  const userId = useAuthStore((state) => state.userId);
  const answerIdea = useSwipeStore((state) => state.answerIdea);
  const getCurrentIdea = useSwipeStore((state) => state.getCurrentIdea);
  const isLoading = useSwipeStore((state) => state.isLoading);

  const currentIdea = getCurrentIdea();

  return <div>...</div>;
}
```

---

## 📋 Checklist de Migración

Para migrar un componente que usa `useAppContext`:

- [ ] Identificar qué valores del contexto usa
- [ ] Importar los stores correspondientes
- [ ] Reemplazar `useAppContext()` con subscripciones selectivas
- [ ] Verificar que las funciones reciban `userId` como parámetro si es necesario
- [ ] Actualizar tests si existen

---

## 🎨 Uso de Animaciones CSS

### Clases Disponibles

```typescript
// Animaciones básicas
<div className="animate-fade-in">Fade in</div>
<div className="animate-fade-in-up">Fade in from bottom</div>
<div className="animate-fade-in-down">Fade in from top</div>
<div className="animate-scale-in">Scale in</div>
<div className="animate-pulse">Pulse</div>

// Swipe animations
<div className="animate-swipe-left">Swipe left</div>
<div className="animate-swipe-right">Swipe right</div>

// Performance
<div className="gpu-accelerated">GPU accelerated</div>
<div className="transition-all-smooth">Smooth transition</div>
<div className="hover-lift">Hover lift effect</div>

// Stagger items en listas
{items.map((item, i) => (
  <div
    key={item.id}
    className="stagger-item"
    style={{ animationDelay: `${i * 0.05}s` }}
  >
    {item.name}
  </div>
))}
```

### Reemplazar framer-motion

**Antes:**
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**Después:**
```typescript
<div className="animate-fade-in-up">
  Content
</div>
```

---

## 🧠 Memoización - Cuándo usar qué

### React.memo - Componentes

Úsalo cuando:
- El componente se renderiza frecuentemente
- El componente es "hoja" (no tiene children dinámicos)
- Las props no cambian frecuentemente

```typescript
export const MyComponent = memo(({ id, name }) => {
  return <div>{name}</div>;
});
```

### useCallback - Funciones

Úsalo cuando:
- Pasas la función como prop a componentes memoizados
- La función es dependencia de useEffect
- La función es costosa de crear

```typescript
const handleClick = useCallback(() => {
  doSomething(userId);
}, [userId]);
```

### useMemo - Valores computados

Úsalo cuando:
- El cálculo es costoso (loops, sort, filter, etc.)
- El valor es dependencia de useEffect
- El valor se usa en comparaciones

```typescript
const sortedItems = useMemo(
  () => items.sort((a, b) => b.score - a.score),
  [items]
);
```

---

## 🚨 Errores Comunes

### 1. No usar subscripción selectiva

❌ **Mal:**
```typescript
// Esto causará re-renders innecesarios
const store = useSwipeStore();
const { isLoading, ideas, answers } = store;
```

✅ **Bien:**
```typescript
// Solo se re-renderiza cuando cambia isLoading
const isLoading = useSwipeStore((state) => state.isLoading);
```

### 2. Olvidar pasar userId a funciones

❌ **Mal:**
```typescript
const answerIdea = useSwipeStore((state) => state.answerIdea);

// Falta el userId
answerIdea('agree');
```

✅ **Bien:**
```typescript
const userId = useAuthStore((state) => state.userId);
const answerIdea = useSwipeStore((state) => state.answerIdea);

answerIdea(userId, 'agree');
```

### 3. Dependencias incorrectas en useMemo

❌ **Mal:**
```typescript
// getCurrentIdea es una función, no un valor
const currentIdea = useMemo(() => getCurrentIdea(), [getCurrentIdea]);
```

✅ **Bien:**
```typescript
// getCurrentIdea es estable en Zustand, no necesita useMemo
const currentIdea = getCurrentIdea();
```

---

## 📦 Estructura de Stores

### useAuthStore
```typescript
{
  userId: string | null,
  isInitialized: boolean,
  initAuth: () => Promise<void>,
  setUserId: (userId: string | null) => void
}
```

### useSwipeStore
```typescript
{
  // State
  currentIdeaIndex: number,
  answers: UserAnswer[],
  ideas: Idea[],
  candidates: Candidate[],
  hasShownImminentMatch: boolean,
  isLoading: boolean,
  error: string | null,

  // Setters
  setCurrentIdeaIndex: (index: number) => void,
  setAnswers: (answers: UserAnswer[]) => void,
  // ...

  // Actions
  loadOpinions: (topicIds?: number[]) => Promise<void>,
  answerIdea: (userId: string, answer: 'agree' | 'disagree') => Promise<void>,
  loadPreviousAnswers: (userId: string) => Promise<void>,
  resetSwipe: () => void,

  // Computed
  getCurrentIdea: () => Idea | null,
  getProgress: () => { current: number; total: number },
  shouldShowMatch: () => boolean,
  markMatchShown: () => void
}
```

### useTopicsStore
```typescript
{
  topics: Topic[],
  setTopics: (topics: Topic[]) => void,
  addTopic: (topic: Topic) => void,
  removeTopic: (id: number) => void
}
```

---

## 🔧 DevTools

Zustand tiene excelente integración con Redux DevTools:

```typescript
// En desarrollo, puedes inspeccionar el state
import { devtools } from 'zustand/middleware';

export const useSwipeStore = create(
  devtools((set, get) => ({
    // ...store
  }), { name: 'SwipeStore' })
);
```

---

## 🎓 Recursos

- [Zustand Docs](https://github.com/pmndrs/zustand)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [CSS Animations vs JS](https://web.dev/animations/)
- [GPU Acceleration](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)

---

## 📞 Soporte

Si tienes dudas sobre la migración:
1. Revisa OPTIMIZATION_REPORT.md para contexto completo
2. Compara con SwipePage.tsx o TopicsPage.tsx como ejemplos
3. Verifica que las subscripciones sean selectivas
4. Usa React DevTools Profiler para identificar re-renders
