---
name: test-generation
description: "Use when: writing tests, improving test coverage, or ensuring code quality. Generates comprehensive unit, integration, and E2E tests for TypeScript, React, NestJS, and Firebase code."
---

# Test Generation Skill

## Overview
This skill provides strategies for comprehensive testing across all layers of the application.

## Coverage Areas

### Unit Testing
- Service/function testing with mocks
- React component testing
- Hook testing
- Utility function testing
- Type testing

### Integration Testing
- API endpoint testing
- Database integration
- Firebase integration
- Service-to-service communication
- Component-with-hook integration

### End-to-End Testing
- User flow testing
- Full authentication flows
- Multi-step operations
- Error scenarios

### Testing Tools & Frameworks
- Jest for unit/integration tests
- React Testing Library for components
- Supertest for API endpoints
- Cypress/Playwright for E2E
- Firestore emulator for Firebase

## Unit Testing Examples

### Jest Service Testing
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepository>;

    service = new UserService(repository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: '1', name: 'John' };
      repository.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should return null when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      const result = await service.findById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
```

### React Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### React Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });
});
```

## Integration Testing Examples

### NestJS API Testing
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Users API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'test@example.com', password: 'Password123' })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'invalid', password: 'Password123' })
        .expect(400);
    });
  });
});
```

### Firebase Integration Testing
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

describe('Firebase Integration', () => {
  let db;

  beforeAll(async () => {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  });

  it('should add and retrieve document', async () => {
    const docRef = await addDoc(collection(db, 'posts'), {
      title: 'Test Post',
      content: 'Content',
    });
    
    const snapshot = await getDocs(collection(db, 'posts'));
    expect(snapshot.docs.length).toBeGreaterThan(0);
  });
});
```

## Testing Checklist

### Unit Tests
- [ ] All services have test suites
- [ ] All components have test suites
- [ ] Mock dependencies properly
- [ ] Test both success and error cases
- [ ] 80%+ code coverage target
- [ ] Edge cases covered

### Integration Tests
- [ ] API endpoints tested
- [ ] Database integration tested
- [ ] Firebase operations tested
- [ ] Cross-service flows tested
- [ ] Error scenarios covered

### E2E Tests
- [ ] User authentication flow
- [ ] Main user journeys
- [ ] Error handling
- [ ] Forms and input validation
- [ ] Critical features

### Test Quality
- [ ] Descriptive test names
- [ ] Tests are independent
- [ ] No flaky tests
- [ ] Fast execution
- [ ] Clear assertions

## Test Organization

```
src/
├── services/
│   ├── user.service.ts
│   └── user.service.spec.ts
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
└── hooks/
    ├── useCounter.ts
    └── useCounter.test.ts
```

## Common Testing Pitfalls
- Testing implementation details instead of behavior
- Not mocking dependencies
- Flaky async tests
- Poor test names
- Testing too much in one test
- Not testing error cases
