# Code Optimizer Agent & Skills

## Overview

The **Code Optimizer** is a comprehensive custom agent designed to create and leverage skills for excellent code development and optimization across your TypeScript, React, NestJS, Firebase, and API projects.

## What's Included

### 🤖 Custom Agent
- **code-optimizer** - Main agent that orchestrates all skills and provides expert guidance

### 🛠️ Skills

1. **typescript-best-practices** - Type-safe, modern TypeScript patterns and conventions
2. **architecture-review** - System design validation and proper layering
3. **security-audit** - Vulnerability detection and secure coding practices
4. **test-generation** - Comprehensive unit, integration, and E2E testing strategies
5. **performance-tuning** - Optimization for React, NestJS, Firebase, and network
6. **build-optimization** - Bundle size reduction, build performance, and deployment

## How to Use

### In VS Code
1. Use the agent when working on TypeScript, React, NestJS, or Firebase code
2. The agent automatically applies relevant skills based on your task
3. Type `/` in chat to see available skills and invoke them directly

### Invoking Skills Directly
Type `/` in the chat and select:
- `/typescript-best-practices` - Get TypeScript guidance
- `/architecture-review` - Validate code structure
- `/security-audit` - Check for vulnerabilities
- `/test-generation` - Generate test strategies
- `/performance-tuning` - Optimize performance
- `/build-optimization` - Improve build pipeline

## File Structure

```
.github/
├── agents/
│   └── code-optimizer/
│       └── code-optimizer.agent.md
└── skills/
    ├── typescript-best-practices/SKILL.md
    ├── architecture-review/SKILL.md
    ├── security-audit/SKILL.md
    ├── test-generation/SKILL.md
    ├── performance-tuning/SKILL.md
    └── build-optimization/SKILL.md
```

## Key Features

### 🎯 Domains Covered
- **Languages**: TypeScript, JavaScript
- **Frameworks**: React, Next.js, NestJS
- **Backend**: APIs, Express, HTTP
- **Database**: Firebase, Firestore
- **Practices**: Security, Performance, Testing, Architecture

### 📋 Focus Areas
- ✅ Best Practices - Modern patterns and conventions
- ✅ Architecture - Proper design and scalability
- ✅ Security - Authentication, authorization, data protection
- ✅ Testing - Unit, integration, E2E test strategies
- ✅ Performance - Frontend and backend optimization
- ✅ Build - Bundle optimization and deployment

## Quick Start

1. **Install**: The agent is now available in your workspace
2. **Use**: Open a file and mention the code-optimizer agent
3. **Get Feedback**: It will apply relevant skills automatically

## Skills at a Glance

| Skill | When to Use | Focus |
|-------|-----------|-------|
| **TypeScript** | Writing TypeScript code | Type safety, modern patterns |
| **Architecture** | Designing systems | Structure, modularity, scalability |
| **Security** | Handling auth/data | Vulnerabilities, best practices |
| **Testing** | Writing tests | Coverage, quality, strategies |
| **Performance** | Optimizing code | Speed, efficiency, load times |
| **Build** | Configuring builds | Bundle size, deployment, CI/CD |

## Contributing

To extend this agent with new skills:
1. Create a new directory in `.github/skills/<skill-name>/`
2. Add a `SKILL.md` file with proper frontmatter
3. Document patterns, examples, and best practices
4. Reference it in the agent's documentation

## Questions?

Each skill includes:
- Coverage areas and focus topics
- Code examples and templates
- Checklists for validation
- Common pitfalls to avoid

Refer to individual skill files for detailed guidance on each area.
