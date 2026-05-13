---
name: performance-tuning
description: "Use when: optimizing rendering, reducing latency, or improving query performance. Provides strategies for React rendering optimization, NestJS endpoint efficiency, Firebase query optimization, and load time reduction."
---

# Performance Tuning Skill

## Overview
This skill improves application performance across frontend, backend, and database layers.

## Coverage Areas

### React Performance
- Component memoization (React.memo, useMemo)
- Callback optimization (useCallback)
- Code splitting and lazy loading
- Image optimization
- Bundle size analysis
- Virtual scrolling for large lists

### NestJS Performance
- Request/response optimization
- Caching strategies (in-memory, Redis)
- Query optimization
- Middleware performance
- Rate limiting
- Compression

### Firebase Performance
- Query optimization (indexing, filtering)
- Real-time listener management
- Batch operations
- Pagination strategies
- Data structure optimization

### Network Performance
- API response time optimization
- Compression (gzip, brotli)
- HTTP caching headers
- CDN utilization
- Asset minification

## React Optimization Examples

### Memoization
```typescript
// Prevent unnecessary re-renders
const UserCard = React.memo(({ user, onSelect }: UserCardProps) => {
  return (
    <div onClick={() => onSelect(user)}>
      {user.name}
    </div>
  );
});

// Memoize expensive computations
const UserList = ({ users }: { users: User[] }) => {
  const sortedUsers = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const handleSelect = useCallback((user: User) => {
    console.log('Selected:', user.id);
  }, []);

  return <div>{/* render */}</div>;
};
```

### Code Splitting
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

export const App = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </Suspense>
);
```

### Virtual Scrolling (Large Lists)
```typescript
import { FixedSizeList } from 'react-window';

const BigList = ({ items }: { items: string[] }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={35}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index]}
      </div>
    )}
  </FixedSizeList>
);
```

## NestJS Performance Examples

### Caching with Decorators
```typescript
import { Cacheable } from '@nestjs/cache-manager';

@Injectable()
export class UserService {
  @Cacheable()
  async getUsersWithCache(limit: number): Promise<User[]> {
    // Expensive database query
    return this.userRepository.find({ take: limit });
  }

  invalidateCache() {
    this.cacheManager.reset();
  }
}
```

### Query Optimization
```typescript
@Injectable()
export class UserService {
  async getUserWithPosts(userId: string): Promise<User> {
    // Eager load relations to avoid N+1 queries
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['posts', 'comments'],
    });
  }

  async getPaginatedUsers(page: number, limit: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }
}
```

### Response Compression
```typescript
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  await app.listen(3000);
}
```

## Firebase Optimization Examples

### Query Optimization
```typescript
import { query, collection, where, orderBy, limit } from 'firebase/firestore';

// Good: Filtered, ordered, limited query
const recentPostsQuery = query(
  collection(db, 'posts'),
  where('published', '==', true),
  orderBy('createdAt', 'desc'),
  limit(10)
);

const snapshot = await getDocs(recentPostsQuery);
```

### Real-time Listener Management
```typescript
// Unsubscribe to prevent memory leaks
const unsubscribe = onSnapshot(
  query(collection(db, 'posts'), limit(10)),
  (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPosts(posts);
  }
);

// Cleanup on component unmount
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Data Structure Optimization
```javascript
// Avoid deeply nested structures
// Good structure for queries and performance
{
  users/{userId}
    - email: string
    - name: string
    - postCount: number    // Denormalized count
  posts/{postId}
    - authorId: string
    - title: string
    - createdAt: timestamp
}
```

## Performance Checklist

### React
- [ ] Components properly memoized
- [ ] Code splitting implemented
- [ ] Large lists use virtual scrolling
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size analyzed
- [ ] useCallback for event handlers
- [ ] useMemo for expensive calculations

### NestJS
- [ ] Database queries use eager loading
- [ ] Pagination implemented
- [ ] Caching configured
- [ ] Compression enabled
- [ ] Rate limiting active
- [ ] Slow queries identified
- [ ] N+1 queries eliminated

### Firebase
- [ ] Queries use proper filters
- [ ] Indexes created for frequent queries
- [ ] Real-time listeners properly cleaned up
- [ ] Pagination implemented
- [ ] Batch operations used
- [ ] Data denormalized where needed

### Network
- [ ] Response times < 200ms
- [ ] Bundle size < 200KB (gzipped)
- [ ] Images optimized
- [ ] Cache headers set
- [ ] CDN configured
- [ ] Assets minified

## Performance Monitoring

### Key Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)
- API response times
- Database query times

### Tools
- Lighthouse (React performance)
- Redux DevTools (state changes)
- Network tab (API calls)
- Chrome DevTools Profiler
- Firebase Console (query performance)

## Common Bottlenecks
- Unnecessary component re-renders
- Large bundle sizes
- Unoptimized queries (N+1)
- Missing pagination
- Poor image optimization
- Inefficient state management
- Missing caching
