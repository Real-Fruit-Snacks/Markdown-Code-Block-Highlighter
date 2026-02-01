# Test Markdown File

This file is used for testing the Markdown Code Block Highlighter extension.

## JavaScript Example

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
    return true;
}

const result = greet("World");
```

## Python Example

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Calculate fibonacci
result = fibonacci(10)
print(f"Fibonacci(10) = {result}")
```

## TypeScript Example

```typescript
interface User {
    name: string;
    age: number;
    email?: string;
}

class UserManager {
    private users: User[] = [];
    
    addUser(user: User): void {
        this.users.push(user);
    }
    
    getUser(name: string): User | undefined {
        return this.users.find(u => u.name === name);
    }
}
```

## JSON Example

```json
{
    "name": "test-project",
    "version": "1.0.0",
    "dependencies": {
        "express": "^4.17.1",
        "typescript": "^4.5.0"
    }
}
```

## Shell Script Example

```bash
#!/bin/bash

# Deploy script
echo "Starting deployment..."

npm run build
npm test

if [ $? -eq 0 ]; then
    echo "Tests passed! Deploying..."
    npm run deploy
else
    echo "Tests failed! Aborting deployment."
    exit 1
fi
```

## HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a test page.</p>
</body>
</html>
```

## CSS Example

```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.button {
    background-color: #007acc;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

.button:hover {
    background-color: #005a9e;
}
```

## Code without language identifier

```
This is plain text code block
without any language identifier.
It should still be highlighted minimally.
```

## Empty code block

```javascript
```
