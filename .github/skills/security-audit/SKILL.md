---
name: security-audit
description: "Use when: implementing authentication, handling user data, or working with APIs and Firebase. Identifies vulnerabilities and ensures secure coding practices for TypeScript, React, NestJS, and Firebase projects."
---

# Security Audit Skill

## Overview
This skill ensures secure implementation of authentication, authorization, data handling, and API communications.

## Coverage Areas

### Authentication & Authorization
- JWT token management (generation, validation, refresh)
- Password hashing (bcrypt, scrypt)
- OAuth2/Social authentication flows
- Role-based access control (RBAC)
- Permission validation

### API Security
- Input validation and sanitization
- Rate limiting
- CORS configuration
- SQL injection prevention (if using SQL)
- XSS prevention (React)
- CSRF protection

### Firebase Security
- Firestore security rules validation
- Auth provider configuration
- Real-time database access control
- Storage bucket permissions
- Function security and authentication

### Data Protection
- Encryption of sensitive data at rest
- HTTPS/TLS for data in transit
- Secure session management
- PII (Personally Identifiable Information) handling
- Data retention policies

### Code Security
- Environment variable management (no secrets in code)
- Dependency vulnerability scanning
- Error message handling (no sensitive data leak)
- Logging security (no sensitive data logging)
- Input type validation

## Security Patterns

### NestJS Authentication
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): User {
    return { userId: payload.sub, username: payload.username };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('protected')
export class ProtectedController {
  @Get()
  getProtectedResource() {
    return { message: 'Secure data' };
  }
}
```

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      resource.data.authorId == request.auth.uid;
    }
  }
}
```

### Input Validation (NestJS)
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@Post('register')
async register(@Body() dto: CreateUserDto) {
  // Validated input automatically
  return this.authService.register(dto);
}
```

## Security Checklist

### Authentication
- [ ] JWT secrets in environment variables
- [ ] Tokens have expiration times
- [ ] Refresh token rotation
- [ ] Secure password hashing
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured properly

### Authorization
- [ ] User identity verified
- [ ] Permissions checked before operations
- [ ] Firestore rules match code logic
- [ ] Admin endpoints protected
- [ ] Role-based access enforced

### API Security
- [ ] Input validation on all endpoints
- [ ] Output sanitization (no sensitive data)
- [ ] Error messages don't leak info
- [ ] HTTPS enforced
- [ ] Rate limiting configured

### Firebase
- [ ] Security rules tested
- [ ] Anonymous access disabled (if needed)
- [ ] Environment configs secure
- [ ] Sensitive data encrypted
- [ ] Access logs enabled

### Code & Secrets
- [ ] No hardcoded secrets
- [ ] Environment variables used
- [ ] Dependencies up-to-date
- [ ] No sensitive data in logs
- [ ] No secrets in error messages

## Common Vulnerabilities

### Authentication
- Weak or no password requirements
- Missing HTTPS redirect
- Expired token not validated
- No rate limiting on login

### Authorization
- Missing permission checks
- Overly permissive Firebase rules
- User ID not verified
- Admin endpoints accessible to all

### Data
- Sensitive data logged
- Unencrypted storage
- Missing input validation
- No CSRF tokens

### Dependencies
- Outdated vulnerable packages
- Unnecessary dependencies
- Unvetted third-party libraries
