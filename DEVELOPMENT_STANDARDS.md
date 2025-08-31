# Bobsleigh Coach AI - Development Standards

## Project Structure (Monorepo)

This project uses a **pnpm monorepo** structure with the following architecture:

```
bobsleigh-coach-ai/
├── frontend/              # Next.js React application
├── backend/              # FastAPI Python application
├── ml/                   # Machine learning models and notebooks
├── packages/            # Shared packages (future)
├── tools/               # Development tools (future)
├── docs/                # Documentation
├── scripts/             # Deployment and utility scripts
└── package.json         # Root workspace configuration
```

## File Naming Conventions

### ✅ Frontend (TypeScript/React)

| Type | Convention | Example |
|------|------------|---------|
| **Components** | `PascalCase.tsx` | `UserProfile.tsx` |
| **Hooks** | `useExample.ts` | `useAuth.ts` |
| **Utils** | `camelCase.ts` | `apiClient.ts` |
| **Types** | `PascalCase.ts` | `UserTypes.ts` |
| **Pages** | `page.tsx` | `dashboard/page.tsx` |
| **Directories** | `kebab-case` | `user-profile/` |

### ✅ Backend (Python)

| Type | Convention | Example |
|------|------------|---------|
| **Files** | `snake_case.py` | `user_service.py` |
| **Classes** | `PascalCase` | `UserService` |
| **Functions** | `snake_case` | `get_user_profile` |
| **Constants** | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| **Directories** | `snake_case` | `user_management/` |

### ✅ Configuration Files

| Type | Convention | Example |
|------|------------|---------|
| **Docker** | `kebab-case.yml` | `docker-compose.yml` |
| **Config** | `kebab-case.json` | `biome.json` |
| **Documentation** | `UPPER.md` | `README.md` |
| **Scripts** | `kebab-case.sh` | `deploy.sh` |

## Directory Structure Standards

### Frontend Structure
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── dashboard/       # kebab-case directories
│   │   │   └── page.tsx     # Always page.tsx
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Reusable components
│   │   ├── ui/             # Base UI components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── providers/          # React context providers
│   ├── styles/             # Global styles and themes
│   └── utils/              # Helper functions
├── public/                 # Static assets
└── package.json
```

### Backend Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/      # API route handlers
│   │   └── router.py       # Main API router
│   ├── core/              # Core configuration
│   ├── db/
│   │   ├── models/        # Database models
│   │   └── session.py     # Database session
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── tests/                 # Test files
└── requirements.txt
```

## Package Management (pnpm)

### Installation
```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install

# Install in specific workspace
pnpm --filter frontend add package-name
```

### Workspace Commands
```bash
# Run script in all workspaces
pnpm --recursive run build

# Run script in specific workspace
pnpm --filter frontend dev

# Add dev dependency to root
pnpm add -D -w package-name
```

## Code Quality (Biome)

### Setup
- **Linting**: Biome replaces ESLint + Prettier
- **Performance**: 25x faster than Prettier
- **Configuration**: `biome.json` in root

### Commands
```bash
# Lint all files
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format all files
pnpm format

# Type check
pnpm type-check
```

### VS Code Integration
- Install Biome extension
- Auto-format on save enabled
- Organize imports on save

## Development Workflow

### 1. Local Development
```bash
# Start all services
pnpm docker:up

# Start frontend only
pnpm dev

# Run linting
pnpm lint

# Run tests
pnpm test
```

### 2. Code Quality Checks
Before committing, ensure:
- ✅ `pnpm lint` passes
- ✅ `pnpm type-check` passes
- ✅ `pnpm test` passes
- ✅ All files properly formatted

### 3. Git Workflow
```bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes with proper naming
# Commit with descriptive messages
git commit -m "feat: add user authentication with JWT"

# Push and create PR
git push origin feature/user-authentication
```

## Component Standards

### React Components
```typescript
// ✅ Good: PascalCase.tsx
// frontend/src/components/user/UserProfile.tsx

import { useState } from "react";
import { User } from "@/types/User";

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="user-profile">
      {/* Component content */}
    </div>
  );
}
```

### Custom Hooks
```typescript
// ✅ Good: useExample.ts
// frontend/src/hooks/useAuth.ts

import { useState, useEffect } from "react";
import { User } from "@/types/User";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Hook logic
  
  return { user, loading, login, logout };
}
```

### API Services
```python
# ✅ Good: snake_case.py
# backend/app/services/user_service.py

from typing import Optional
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class UserService:
    def __init__(self, db_session):
        self.db = db_session
    
    async def create_user(self, user_data: UserCreate) -> User:
        # Service logic
        pass
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        # Service logic
        pass
```

## Testing Standards

### Frontend Testing
```typescript
// ✅ Good: ComponentName.test.tsx
// frontend/src/components/user/UserProfile.test.tsx

import { render, screen } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  it("renders user name correctly", () => {
    // Test implementation
  });
});
```

### Backend Testing
```python
# ✅ Good: test_service_name.py
# backend/tests/test_user_service.py

import pytest
from app.services.user_service import UserService

class TestUserService:
    def test_create_user(self):
        # Test implementation
        pass
```

## Performance Guidelines

### Bundle Size
- Monitor bundle size with `pnpm build`
- Use dynamic imports for large components
- Tree-shake unused dependencies

### Database Performance
- Use proper indexing
- Optimize N+1 queries
- Implement pagination for large datasets

### API Performance
- Implement response caching
- Use database connection pooling
- Add request/response compression

## Security Standards

### Frontend Security
- Validate all user inputs
- Sanitize data before display
- Use HTTPS in production
- Implement CSP headers

### Backend Security
- Use JWT for authentication
- Implement rate limiting
- Validate all API inputs
- Use parameterized queries

## Documentation Standards

### Code Documentation
- Use JSDoc for TypeScript functions
- Use docstrings for Python functions
- Document complex business logic
- Keep README files updated

### API Documentation
- FastAPI auto-generates OpenAPI docs
- Document all endpoints and schemas
- Include example requests/responses
- Maintain version compatibility

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9.0.0
      - name: Install dependencies
        run: pnpm install
      - name: Run linting
        run: pnpm lint
      - name: Run tests
        run: pnpm test
```

## Deployment Standards

### Docker
- Use multi-stage builds for production
- Optimize image sizes
- Use .dockerignore properly
- Pin dependency versions

### Environment Management
- Use .env files for local development
- Never commit secrets to git
- Use environment-specific configurations
- Implement proper logging

## Future Expansion

### Monorepo Growth
When adding new packages:
1. Create in `packages/` directory
2. Follow naming conventions
3. Update workspace configuration
4. Add to CI/CD pipeline

### Shared Packages
Future shared packages:
- `@bobsleigh/types` - Shared TypeScript types
- `@bobsleigh/ui` - Shared UI components
- `@bobsleigh/utils` - Shared utilities
- `@bobsleigh/api-client` - Shared API client

## Migration Checklist

### ✅ Completed
- [x] Convert all .jsx to .tsx files
- [x] Remove duplicate files
- [x] Setup pnpm workspace
- [x] Configure Biome linting
- [x] Create VS Code settings
- [x] Update package.json scripts

### 🔄 Next Steps
- [ ] Install pnpm and migrate dependencies
- [ ] Run biome formatting on all files
- [ ] Test all scripts work correctly
- [ ] Update CI/CD to use pnpm
- [ ] Create shared types package

## Resources

- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
- [Biome Documentation](https://biomejs.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**This document should be updated as the project evolves. All team members should follow these standards to ensure consistency and maintainability.**