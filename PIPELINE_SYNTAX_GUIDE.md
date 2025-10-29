# GitHub Actions Pipeline Syntax Walkthrough

## Complete Line-by-Line Explanation

Let's go through `.github/workflows/demo-pipeline.yml` and explain every piece of syntax:

---

## Header Section
```yaml
name: Demo CI/CD Pipeline
```
**What it does:** Names your workflow (shows up in GitHub Actions tab)
**Real world:** Usually matches your project name like "Frontend Pipeline" or "API Deploy"

---

## Trigger Section
```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:  # Allow manual trigger
```

**Line by line:**
- `on:` = "When should this pipeline run?"
- `push: branches: [ main ]` = "Run when someone pushes to main branch"
- `pull_request: branches: [ main ]` = "Run when someone creates a PR to main"
- `workflow_dispatch:` = "Let me manually trigger this from GitHub UI"

**Real world examples:**
```yaml
# Only on main branch pushes
on:
  push:
    branches: [ main ]

# On every branch
on:
  push:

# Only on specific branches
on:
  push:
    branches: [ main, develop ]

# On schedule (every day at 2 AM)
on:
  schedule:
    - cron: '0 2 * * *'
```

---

## Jobs Section
```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
```

**Line by line:**
- `jobs:` = "Define the work to be done"
- `build-and-test:` = "Name of this job" (you can have multiple jobs)
- `runs-on: ubuntu-latest` = "Run on Ubuntu Linux virtual machine"

**Available runners:**
```yaml
runs-on: ubuntu-latest    # Linux (most common)
runs-on: windows-latest   # Windows
runs-on: macos-latest     # macOS
runs-on: self-hosted      # Your own servers
```

---

## Steps Section
```yaml
steps:
- name: Checkout code
  uses: actions/checkout@v4
```

**Line by line:**
- `steps:` = "List of commands to run"
- `- name:` = "Human-readable description"
- `uses: actions/checkout@v4` = "Use a pre-built action"

**Common actions:**
```yaml
# Get your code
- uses: actions/checkout@v4

# Set up Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '18'

# Set up Python
- uses: actions/setup-python@v4
  with:
    python-version: '3.11'

# Set up Docker
- uses: docker/setup-buildx-action@v3
```

---

## Build Step
```yaml
- name: Build Docker image
  run: |
    cd test/python-app
    docker build -t demo-python-app:latest .
```

**Line by line:**
- `run: |` = "Run shell commands" (the `|` allows multi-line)
- `cd test/python-app` = "Change to the app directory"
- `docker build -t demo-python-app:latest .` = "Build Docker image"

**Alternative syntax:**
```yaml
# Single line
- run: docker build -t myapp .

# Multiple commands
- run: |
    echo "Starting build..."
    docker build -t myapp .
    echo "Build complete!"

# With environment variables
- run: docker build -t myapp .
  env:
    BUILD_VERSION: ${{ github.sha }}
```

---

## Run Container Step
```yaml
- name: Run container
  run: |
    docker run -d --rm -p 8000:8000 --name demo-python-app demo-python-app:latest
```

**Docker flags explained:**
- `-d` = "Run in background (detached)"
- `--rm` = "Delete container when it stops"
- `-p 8000:8000` = "Map port 8000 on host to port 8000 in container"
- `--name demo-python-app` = "Give container a name"
- `demo-python-app:latest` = "Image to run"

---

## Wait Step
```yaml
- name: Wait for app to start
  run: sleep 10
```

**Why we need this:** Apps take time to start up. Without this, tests might run before the app is ready.

**Better alternatives:**
```yaml
# Wait until health check passes
- name: Wait for app to start
  run: |
    until curl -f http://localhost:8000/health; do
      echo "Waiting for app..."
      sleep 2
    done

# Or use a proper health check action
- uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 10
    command: curl -f http://localhost:8000/health
```

---

## Test Steps
```yaml
- name: Test health endpoint
  run: |
    curl -f http://localhost:8000/health || exit 1
    echo "Health check passed!"
```

**Line by line:**
- `curl -f` = "Download URL, fail on HTTP errors"
- `|| exit 1` = "If curl fails, exit with error code"
- `echo` = "Print success message"

**More test examples:**
```yaml
# Test multiple endpoints
- name: Test API endpoints
  run: |
    curl -f http://localhost:8000/health
    curl -f http://localhost:8000/api/users
    curl -f http://localhost:8000/api/status

# Test with data
- name: Test POST endpoint
  run: |
    curl -X POST http://localhost:8000/api/users \
      -H "Content-Type: application/json" \
      -d '{"name": "test"}'

# Run unit tests
- name: Run tests
  run: |
    npm test
    # or
    python -m pytest
    # or
    go test ./...
```

---

## Conditional Cleanup
```yaml
- name: Cleanup
  if: always()
  run: docker stop demo-python-app || true
```

**Line by line:**
- `if: always()` = "Run this step even if previous steps failed"
- `|| true` = "Don't fail if docker stop fails"

**Other conditions:**
```yaml
if: success()        # Only if all previous steps succeeded
if: failure()        # Only if any previous step failed
if: cancelled()      # Only if workflow was cancelled
if: always()         # Always run (most common for cleanup)
```

---

## Job Dependencies
```yaml
deploy-staging:
  needs: build-and-test
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
```

**Line by line:**
- `needs: build-and-test` = "Wait for build-and-test job to complete"
- `if: github.ref == 'refs/heads/main'` = "Only run on main branch"

**More dependency examples:**
```yaml
# Run after multiple jobs
needs: [build, test, security-scan]

# Run in parallel (no needs)
jobs:
  test-frontend:
    runs-on: ubuntu-latest
  test-backend:
    runs-on: ubuntu-latest
  # Both run at the same time

# Conditional deployment
deploy-prod:
  needs: [build, test]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

---

## Environment Variables and Secrets
```yaml
- name: Deploy to production
  run: |
    echo "Deploying to ${{ env.ENVIRONMENT }}"
    curl -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" \
         https://api.example.com/deploy
  env:
    ENVIRONMENT: production
```

**Available variables:**
```yaml
# GitHub context
${{ github.sha }}           # Commit hash
${{ github.ref }}           # Branch name
${{ github.actor }}         # Username who triggered
${{ github.repository }}    # Repository name

# Secrets (set in GitHub Settings)
${{ secrets.API_KEY }}      # Secure values
${{ secrets.DATABASE_URL }}

# Environment variables
env:
  NODE_ENV: production
  BUILD_VERSION: ${{ github.sha }}
```

---

## Real-World Pipeline Examples

### Simple Node.js App
```yaml
name: Node.js CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run build
```

### Docker App with Registry Push
```yaml
name: Docker Build and Push
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Build image
      run: docker build -t myapp:${{ github.sha }} .
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push myapp:${{ github.sha }}
```

### Multi-Environment Deployment
```yaml
name: Deploy Pipeline
on:
  push:
    branches: [main, develop]
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to staging
      run: echo "Deploying to staging..."
      
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to production
      run: echo "Deploying to production..."
```

---

## Key Takeaways

1. **`on:`** = When to run (triggers)
2. **`jobs:`** = What work to do
3. **`steps:`** = How to do the work
4. **`uses:`** = Pre-built actions
5. **`run:`** = Custom commands
6. **`if:`** = Conditional execution
7. **`needs:`** = Job dependencies
8. **`env:`** = Environment variables
9. **`secrets:`** = Secure values

This syntax is used by millions of developers worldwide and powers deployments for companies like Microsoft, Netflix, and Spotify!
