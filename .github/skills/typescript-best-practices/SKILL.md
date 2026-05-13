---
name: typescript-best-practices
description: "Use when: writing or reviewing TypeScript code. Enforces modern patterns, strict typing, generics usage, and code consistency. Applies best practices for TypeScript in React, NestJS, and API projects."
---

# TypeScript Best Practices Skill

## Overview
This skill provides expert guidance on TypeScript best practices for type-safe, maintainable code.

## Coverage Areas

### Type Safety
- Strict null checks and undefined handling
- Generic types for reusable components
- Discriminated unions for type-safe data modeling
- Utility types (Partial, Pick, Omit, Record, etc.)
- Type guards and type predicates

### Modern Patterns
- Async/await with proper error handling
- Decorators for NestJS and metadata
- Enums vs const objects
- Interface vs Type definitions
- Module organization and exports

### Code Quality
- Consistent naming conventions
- Function parameter typing
- Return type annotations
- Error handling and logging
- SOLID principles in TypeScript

### React + TypeScript
- Functional component typing
- Props interfaces with generics
- Hook types (useState, useEffect, useContext)
- Event handler typing
- Ref forwarding with proper types

### NestJS + TypeScript
- Service, controller, and module typing
- Dependency injection with decorators
- Exception handling with proper types
- Guard and middleware typing
- Validation with class-validator

## Templates & Examples

### Typed React Component
```typescript
interface Props<T> {
  data: T[];
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
}

export const List = <T extends { id: string }>({
  data,
  onSelect,
  renderItem,
}: Props<T>) => {
  return (
    <ul>
      {data.map(item => (
        <li key={item.id} onClick={() => onSelect(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
};
```

### Typed NestJS Service
```typescript
@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.repository.save(dto);
  }
}
```

## Validation Checklist
- [ ] All functions have return types
- [ ] No use of `any` type
- [ ] Proper null/undefined handling
- [ ] Generic types used for reusability
- [ ] Consistent naming conventions
- [ ] Props properly typed (React)
- [ ] Services properly decorated (NestJS)
- [ ] Error types properly defined

## Common Pitfalls to Avoid
- Using `any` instead of proper types
- Not typing function parameters
- Mixing `interface` and `type` inconsistently
- Improper generic usage
- Not handling undefined/null
- Overly complex type definitions
