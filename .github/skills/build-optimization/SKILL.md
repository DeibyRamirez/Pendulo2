---
name: build-optimization
description: "Use when: improving build performance, optimizing bundle size, or configuring deployment. Provides strategies for Next.js build optimization, dependency management, and deployment efficiency."
---

# Build Optimization Skill

## Overview
This skill optimizes build processes, reduces bundle sizes, and improves deployment efficiency.

## Coverage Areas

### Build Performance
- Build time analysis
- Parallel builds
- Incremental builds
- Cache configuration
- Dependency optimization

### Bundle Size
- Tree shaking configuration
- Code splitting strategy
- Dynamic imports
- Asset optimization
- Dependency analysis

### Next.js Optimization
- Image optimization
- Font loading
- Script optimization
- Dynamic imports
- API routes optimization

### Dependency Management
- Unused dependency removal
- Major version upgrades
- Security patch management
- Monorepo optimization
- Lock file management

### Deployment
- Environment configuration
- Build artifacts
- Docker optimization
- CI/CD performance
- Vercel deployment optimization

## Next.js Build Configuration

### next.config.mjs Optimization
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWR caching for static generation
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebase.google.com',
      },
    ],
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      minimizer: config.optimization.minimizer,
    };
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://:host/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

### Dynamic Imports
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false,
});

export default function Page() {
  return <HeavyComponent />;
}
```

### Image Optimization
```typescript
import Image from 'next/image';

export const OptimizedImage = () => (
  <Image
    src="/hero.jpg"
    alt="Hero"
    width={1200}
    height={600}
    priority
    placeholder="blur"
  />
);
```

## Bundle Size Analysis

### Analyze Build
```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

### Bundle Configuration
```javascript
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  // config
});
```

## Tree Shaking & Code Splitting

### ESM Module Usage
```typescript
// Bad: CommonJS (not tree-shakeable)
const _ = require('lodash');

// Good: Named imports (tree-shakeable)
import { debounce } from 'lodash-es';
```

### Dynamic Imports
```typescript
// Before: Static import increases bundle
import { heavy } from './heavy-module';

// After: Load only when needed
const loadHeavy = async () => {
  const { heavy } = await import('./heavy-module');
  return heavy();
};
```

## NestJS Build Optimization

### Production Build
```json
{
  "scripts": {
    "build": "nest build",
    "build:prod": "nest build --webpack --webpackPath ncc && npm run analyze"
  }
}
```

### Dependency Optimization
```bash
# Remove unused packages
npm prune --production

# Check for vulnerabilities
npm audit

# Update dependencies safely
npm update
```

## CI/CD Build Optimization

### GitHub Actions Caching
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm run test

      - name: Deploy
        run: npm run deploy
```

## Docker Optimization

### Multi-stage Build
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

## Build Checklist

### Next.js
- [ ] Images optimized with Next Image
- [ ] Dynamic imports for heavy components
- [ ] Code splitting configured
- [ ] Environment variables set
- [ ] Cache headers configured
- [ ] Build time < 5 minutes

### Bundle Size
- [ ] Bundle < 200KB (gzipped)
- [ ] Unused dependencies removed
- [ ] Tree shaking enabled
- [ ] Code splitting implemented
- [ ] Analytics run regularly

### Dependencies
- [ ] No duplicate versions
- [ ] Security vulnerabilities patched
- [ ] Outdated packages updated
- [ ] Unused packages removed
- [ ] Lock file committed

### Deployment
- [ ] Environment config correct
- [ ] Secrets not in code
- [ ] CI/CD caching configured
- [ ] Build artifacts optimized
- [ ] Rollback plan ready

## Performance Targets

### Build Times
- Development build: < 5s
- Production build: < 5 minutes
- Incremental build: < 10s

### Bundle Sizes
- Main bundle: < 150KB (gzipped)
- Total bundles: < 300KB (gzipped)
- Images: < 100KB average

### Deployment
- Deployment time: < 10 minutes
- Time to first byte: < 1s
- Page load time: < 3s

## Common Issues
- Large dependencies not tree-shaken
- Missing dynamic imports
- Inefficient images
- Duplicate packages
- Slow CI/CD builds
- Poor caching strategy
