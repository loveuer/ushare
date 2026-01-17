# AGENTS.md

## Build Commands

### Go Backend (Root)
```bash
# Build the Go backend binary
go build -o ushare .

# Run tests
go test ./...

# Run single test
go test -run TestFunctionName ./internal/pkg/tool

# Run tests in specific package
go test ./internal/pkg/tool

# Run tests with verbose output
go test -v ./...

# Run the application
./ushare -debug -address 0.0.0.0:9119 -data ./data -auth "admin:password"
```

### TypeScript Frontend (frontend/)
```bash
# Install dependencies (uses pnpm)
pnpm install

# Development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint

# Preview production build
pnpm run preview
```

### Docker Build
```bash
# Build the complete Docker image
docker build -t ushare:latest .
```

## Code Style Guidelines

### Go Backend

#### Imports
- Group imports in three sections: standard library, third-party, internal
- Keep one import per line for readability
- Example:
```go
import (
    "context"
    "fmt"
    "net/http"

    "github.com/pkg/errors"
    "github.com/spf13/viper"

    "github.com/loveuer/ushare/internal/model"
    "github.com/loveuer/ushare/internal/opt"
)
```

#### Naming Conventions
- Exported functions/types: PascalCase (e.g., `UserManager`, `NewPassword`)
- Private functions/types: camelCase (e.g., `generateMeta`, `tokenFn`)
- Variables: camelCase (e.g., `filename`, `totalChunks`)
- Constants: PascalCase (e.g., `Meta`, `HeaderSize`, `CodeLength`)
- Interfaces: Usually implied, not explicitly declared unless needed
- Receiver names: Short, 1-2 letters (e.g., `m`, `um`, `c`)

#### Error Handling
- Use `github.com/pkg/errors` for error wrapping
- Check errors immediately after function calls
- Return errors for functions that can fail
- Use `errors.New()` for simple error messages
- Wrap errors with context when propagating up:
```go
if err != nil {
    return errors.New("invalid file code")
}
```

#### Struct Tags
- Use `json` tags for JSON serialization
- Use `mapstructure` tags for config parsing (viper)
- Use `-` for fields to exclude from JSON:
```go
type User struct {
    Id       int    `json:"id"`
    Username string `json:"username"`
    Password string `json:"-"`
}
```

#### Concurrency
- Use `sync.Mutex` for protecting shared state
- Always use `defer mutex.Unlock()` after `mutex.Lock()`
- Use goroutines with select statements for graceful shutdown

#### Testing
- Use standard `testing` package
- Test functions named `Test<FunctionName>`
- Table-driven tests are preferred:
```go
func TestFunction(t *testing.T) {
    tests := []struct {
        name string
        arg  ArgType
        want ReturnType
    }{
        {"case 1", arg1, want1},
        {"case 2", arg2, want2},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Function(tt.arg); got != tt.want {
                t.Errorf("Function() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

#### Generics
- Use generics for utility functions with type parameters:
```go
func Min[T ~int | ~uint | ~float64](a, b T) T
```

#### Context
- Use `context.Context` for cancellation signals
- Always check `ctx.Done()` in long-running goroutines

### TypeScript Frontend

#### Imports
- Use ES6 imports
- Third-party imports first, then relative imports:
```typescript
import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { CloudBackground } from "../component/fluid/cloud.tsx";
```

#### Naming Conventions
- Components: PascalCase (e.g., `UButton`, `Login`, `FileSharing`)
- Functions/hooks: camelCase (e.g., `useFileUpload`, `onLogin`)
- Variables: camelCase (e.g., `progress`, `loading`, `error`)
- Constants: UPPER_SNAKE_CASE (rarely used)
- Types/Interfaces: PascalCase (e.g., `UploadRes`, `LocalStore`)

#### Types
- Explicitly type function parameters and return values
- Use interfaces for object shapes:
```typescript
interface UploadRes {
    code: string
}

interface LocalStore {
    id: string;
    name: string;
    channel?: RTCDataChannel;
    set: (id: string, name: string) => void;
}
```

#### Components
- Use functional components with hooks
- Props as interface at top of component:
```typescript
type Props = {
    onClick?: () => void;
    children: ReactNode;
    disabled?: boolean;
};

export const UButton: React.FC<Props> = ({ onClick, children, disabled }) => { ... }
```

#### Styling
- Use `react-jss` with `createUseStyles` for component styles
- Define styles object with camelCase properties:
```typescript
const useStyle = createUseStyles({
    container: {
        display: "flex",
        "&:hover": { backgroundColor: "#45a049" }
    }
});
```

#### State Management
- Use `useState` for local component state
- Use `zustand` for global state (defined in `store/` directory)
- Always destructure from store hooks:
```typescript
export const useLocalStore = create<LocalStore>()((_set) => ({
    id: '',
    set: (id: string) => _set({ id })
}))
```

#### Async Patterns
- Use async/await for API calls
- Handle errors with try-catch:
```typescript
try {
    const result = await uploadFile(file);
} catch (err) {
    setError(err.message);
}
```

#### Configuration
- Vite dev server proxies `/api` and `/ushare` to Go backend at `http://127.0.0.1:9119`
- WebSocket proxy configured for `/api/ulocal/ws`

## Project Structure

```
ushare/
├── internal/
│   ├── api/         # HTTP API setup and routes
│   ├── controller/  # Business logic (user, meta, room management)
│   ├── handler/     # HTTP request handlers
│   ├── model/       # Data models (User, Meta, WS)
│   ├── opt/         # Configuration and constants
│   └── pkg/
│       ├── db/      # Database utilities
│       └── tool/    # Utility functions (password, random, etc.)
├── frontend/
│   └── src/
│       ├── api/         # API calls (auth, upload)
│       ├── component/   # Reusable UI components
│       ├── hook/        # Custom hooks (websocket, message)
│       ├── page/        # Page components (login, share, local)
│       ├── store/       # Zustand state stores
│       └── interface/   # TypeScript interfaces
└── deployment/      # Docker and nginx configs
```
