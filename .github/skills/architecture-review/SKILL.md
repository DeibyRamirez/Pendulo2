---
name: architecture-review
description: "Use when: designing system architecture, reviewing code structure, or validating component relationships. Ensures proper layering, modularity, and scalability for React, NestJS, and Firebase projects."
---

# Architecture Review Skill

## Overview
This skill evaluates and improves system architecture for maintainability, scalability, and proper separation of concerns.

## Coverage Areas

### Layered Architecture
- **Presentation Layer** - React components, UI logic, state management
- **Business Logic Layer** - Services, hooks, domain models
- **Data Access Layer** - Repositories, Firebase queries, API clients
- **Infrastructure Layer** - Configuration, utilities, error handling

### Modularity & Organization
- Feature-based folder structure
- Clear module boundaries
- Shared vs feature-specific code
- Circular dependency detection
- Index file organization

### NestJS Architecture
- Module organization (Feature modules, Shared modules)
- Service layer abstraction
- Controller responsibility
- Dependency injection patterns
- Middleware and guard placement

### React Architecture
- Container vs Presentational components
- Custom hooks organization
- State management patterns (Context, Redux)
- Code splitting and lazy loading
- Shared component libraries

### Firebase Integration
- Data model design (Collections, Documents)
- Authentication flow integration
- Real-time listener management
- Security rules alignment with code
- Query optimization

## Folder Structure Templates

### React + NestJS + Firebase
```
src/
├── app/                        # Next.js app directory
│   ├── api/                   # API routes (NestJS modules)
│   ├── (auth)/                # Authentication pages
│   └── (dashboard)/           # Protected pages
├── components/
│   ├── common/                # Shared components
│   ├── features/
│   │   ├── users/             # User-related components
│   │   └── posts/             # Post-related components
├── hooks/                      # Custom React hooks
├── lib/
│   ├── firebase.ts            # Firebase config
│   ├── api-client.ts          # API client
│   └── services/              # Business logic services
├── types/                      # Shared TypeScript types
└── utils/                      # Utility functions
```

### NestJS Modules
```
src/
├── common/
│   ├── decorators/
│   ├── exceptions/
│   ├── filters/
│   └── guards/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── strategies/
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/
└── app.module.ts
```

## Design Patterns

### Dependency Injection
- Services injected into components/controllers
- Factory patterns for complex objects
- Singleton services for shared state

### Repository Pattern
- Abstract data access logic
- Single responsibility for queries
- Testable services

### Factory & Strategy Patterns
- Firebase query builders
- Authentication strategies
- Error handling strategies

## Validation Checklist
- [ ] Clear separation of concerns
- [ ] No circular dependencies
- [ ] Each module has single responsibility
- [ ] Public API clearly defined
- [ ] Shared code in shared modules
- [ ] Proper dependency injection
- [ ] Scalable folder structure
- [ ] Documentation for module boundaries

## Common Issues to Fix
- Mixed presentation and business logic
- Circular module imports
- Over-engineered abstractions
- Inconsistent folder structure
- Poor separation between features
- Misplaced utility functions
