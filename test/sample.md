# Comprehensive Markdown Preview Test Document

This document tests the **Code Block Syntax Highlighter** extension with various code blocks, languages, sizes, and edge cases.

---

## 1. Small Code Blocks (5-10 lines)

### JavaScript
```javascript
// Simple function with ES6 features
const greet = (name) => {
  const greeting = `Hello, ${name}!`;
  console.log(greeting);
  return greeting;
};

greet('World');
```

### TypeScript
```typescript
// TypeScript interface and class
interface User {
  id: number;
  name: string;
  email?: string;
}

class UserManager {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
}
```

### Python
```python
# Python class with decorators
class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x, y):
        self.result = x + y
        return self.result
    
    def multiply(self, x, y):
        return x * y
```

### Java
```java
// Java class with methods
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        int sum = addNumbers(5, 10);
        System.out.println("Sum: " + sum);
    }
    
    public static int addNumbers(int a, int b) {
        return a + b;
    }
}
```

### C++
```cpp
// C++ with STL
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {5, 2, 8, 1, 9};
    std::sort(nums.begin(), nums.end());
    
    for (int num : nums) {
        std::cout << num << " ";
    }
    return 0;
}
```

---

## 2. Medium Code Blocks (50-100 lines)

### Rust - REST API Handler
```rust
// Rust async web server with error handling
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Task {
    id: u32,
    title: String,
    completed: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateTaskRequest {
    title: String,
}

struct AppState {
    tasks: Mutex<Vec<Task>>,
}

async fn get_tasks(data: web::Data<AppState>) -> impl Responder {
    let tasks = data.tasks.lock().unwrap();
    HttpResponse::Ok().json(&*tasks)
}

async fn get_task(
    data: web::Data<AppState>,
    task_id: web::Path<u32>,
) -> impl Responder {
    let tasks = data.tasks.lock().unwrap();
    match tasks.iter().find(|t| t.id == *task_id) {
        Some(task) => HttpResponse::Ok().json(task),
        None => HttpResponse::NotFound().body("Task not found"),
    }
}

async fn create_task(
    data: web::Data<AppState>,
    task_req: web::Json<CreateTaskRequest>,
) -> impl Responder {
    let mut tasks = data.tasks.lock().unwrap();
    let new_id = tasks.len() as u32 + 1;
    
    let new_task = Task {
        id: new_id,
        title: task_req.title.clone(),
        completed: false,
    };
    
    tasks.push(new_task.clone());
    HttpResponse::Created().json(new_task)
}

async fn update_task(
    data: web::Data<AppState>,
    task_id: web::Path<u32>,
) -> impl Responder {
    let mut tasks = data.tasks.lock().unwrap();
    
    if let Some(task) = tasks.iter_mut().find(|t| t.id == *task_id) {
        task.completed = !task.completed;
        HttpResponse::Ok().json(task.clone())
    } else {
        HttpResponse::NotFound().body("Task not found")
    }
}

async fn delete_task(
    data: web::Data<AppState>,
    task_id: web::Path<u32>,
) -> impl Responder {
    let mut tasks = data.tasks.lock().unwrap();
    
    if let Some(pos) = tasks.iter().position(|t| t.id == *task_id) {
        tasks.remove(pos);
        HttpResponse::NoContent().finish()
    } else {
        HttpResponse::NotFound().body("Task not found")
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        tasks: Mutex::new(vec![]),
    });

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/tasks", web::get().to(get_tasks))
            .route("/tasks", web::post().to(create_task))
            .route("/tasks/{id}", web::get().to(get_task))
            .route("/tasks/{id}", web::put().to(update_task))
            .route("/tasks/{id}", web::delete().to(delete_task))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

### Go - Concurrent Worker Pool
```go
// Go concurrent worker pool pattern
package main

import (
    "fmt"
    "sync"
    "time"
)

type Job struct {
    ID     int
    Data   string
    Result chan string
}

type Worker struct {
    ID         int
    JobQueue   chan Job
    QuitChan   chan bool
    WaitGroup  *sync.WaitGroup
}

func NewWorker(id int, jobQueue chan Job, wg *sync.WaitGroup) *Worker {
    return &Worker{
        ID:        id,
        JobQueue:  jobQueue,
        QuitChan:  make(chan bool),
        WaitGroup: wg,
    }
}

func (w *Worker) Start() {
    go func() {
        defer w.WaitGroup.Done()
        
        for {
            select {
            case job := <-w.JobQueue:
                fmt.Printf("Worker %d: Processing job %d\n", w.ID, job.ID)
                
                // Simulate work
                time.Sleep(time.Millisecond * 100)
                result := fmt.Sprintf("Job %d completed by Worker %d", job.ID, w.ID)
                
                job.Result <- result
                
            case <-w.QuitChan:
                fmt.Printf("Worker %d: Stopping\n", w.ID)
                return
            }
        }
    }()
}

func (w *Worker) Stop() {
    w.QuitChan <- true
}

type WorkerPool struct {
    Workers   []*Worker
    JobQueue  chan Job
    WaitGroup sync.WaitGroup
}

func NewWorkerPool(numWorkers int, jobQueueSize int) *WorkerPool {
    jobQueue := make(chan Job, jobQueueSize)
    workers := make([]*Worker, numWorkers)
    
    pool := &WorkerPool{
        Workers:  workers,
        JobQueue: jobQueue,
    }
    
    for i := 0; i < numWorkers; i++ {
        pool.WaitGroup.Add(1)
        worker := NewWorker(i+1, jobQueue, &pool.WaitGroup)
        pool.Workers[i] = worker
        worker.Start()
    }
    
    return pool
}

func (p *WorkerPool) Submit(job Job) {
    p.JobQueue <- job
}

func (p *WorkerPool) Shutdown() {
    close(p.JobQueue)
    
    for _, worker := range p.Workers {
        worker.Stop()
    }
    
    p.WaitGroup.Wait()
}

func main() {
    pool := NewWorkerPool(5, 100)
    
    results := make([]chan string, 20)
    
    for i := 0; i < 20; i++ {
        results[i] = make(chan string, 1)
        job := Job{
            ID:     i + 1,
            Data:   fmt.Sprintf("Data for job %d", i+1),
            Result: results[i],
        }
        pool.Submit(job)
    }
    
    for i, resultChan := range results {
        result := <-resultChan
        fmt.Printf("Result %d: %s\n", i+1, result)
    }
    
    pool.Shutdown()
    fmt.Println("All jobs completed!")
}
```

---

## 3. Different Language Types

### HTML
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Block Test</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to Code Block Highlighter</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="features">
            <article class="feature-card">
                <h2>Syntax Highlighting</h2>
                <p>Beautiful, theme-aware syntax highlighting</p>
            </article>
        </section>
    </main>
    
    <script src="app.js"></script>
</body>
</html>
```

### CSS
```css
/* Modern CSS with variables and grid */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #333;
    --background-color: #f4f4f4;
    --border-radius: 8px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.card {
    background: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
```

### SQL
```sql
-- SQL database schema and queries
CREATE DATABASE IF NOT EXISTS company_db;
USE company_db;

CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    budget DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department_id INT,
    salary DECIMAL(10, 2),
    hire_date DATE,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Insert sample data
INSERT INTO departments (name, budget) VALUES
    ('Engineering', 500000.00),
    ('Sales', 300000.00),
    ('Marketing', 200000.00);

INSERT INTO employees (first_name, last_name, email, department_id, salary, hire_date) VALUES
    ('John', 'Doe', 'john.doe@company.com', 1, 85000.00, '2023-01-15'),
    ('Jane', 'Smith', 'jane.smith@company.com', 1, 92000.00, '2022-06-01'),
    ('Bob', 'Johnson', 'bob.j@company.com', 2, 75000.00, '2023-03-20');

-- Complex query with joins and aggregations
SELECT 
    d.name AS department,
    COUNT(e.id) AS employee_count,
    AVG(e.salary) AS avg_salary,
    MAX(e.salary) AS max_salary,
    MIN(e.salary) AS min_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
HAVING COUNT(e.id) > 0
ORDER BY avg_salary DESC;
```

### Bash/Shell
```bash
#!/bin/bash
# Comprehensive bash script with functions and error handling

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Global variables
LOG_FILE="deployment.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

check_dependencies() {
    local deps=("git" "node" "npm" "docker")
    
    for dep in "${deps[@]}"; do
        if command -v "$dep" &> /dev/null; then
            log_info "✓ $dep is installed"
        else
            log_error "✗ $dep is not installed"
            return 1
        fi
    done
}

deploy_application() {
    local env=$1
    local version=$2
    
    log_info "Starting deployment to $env environment (version: $version)"
    
    # Build application
    log_info "Building application..."
    npm run build || {
        log_error "Build failed!"
        return 1
    }
    
    # Run tests
    log_info "Running tests..."
    npm test || {
        log_error "Tests failed!"
        return 1
    }
    
    # Deploy
    log_info "Deploying..."
    docker build -t "myapp:$version" . || {
        log_error "Docker build failed!"
        return 1
    }
    
    docker push "myapp:$version" || {
        log_error "Docker push failed!"
        return 1
    }
    
    log_info "Deployment completed successfully!"
}

# Main execution
main() {
    log_info "=== Deployment Script Started at $TIMESTAMP ==="
    
    check_dependencies || {
        log_error "Dependency check failed!"
        exit 1
    }
    
    deploy_application "production" "1.0.0" || {
        log_error "Deployment failed!"
        exit 1
    }
    
    log_info "=== Script completed successfully ==="
}

main "$@"
```

---

## 4. Edge Cases

### No Language Specified
```
// This code block has no language specified
function test() {
    console.log("No language hint");
}
```

### Invalid Language
```invalidlang
This should fall back to plain text
No syntax highlighting should be applied
```

### Empty Code Block
```javascript
```

### Very Long Single Line
```javascript
const veryLongString = "This is an extremely long string that goes on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on to test horizontal scrolling behavior";
```

### Special Characters and Unicode
```javascript
// Unicode and special characters test
const greeting = "Hello 世界 🌍";
const math = "∑∫∂√π≈≠≤≥";
const symbols = "→←↑↓⇒⇐⇑⇓";
const emoji = "😀😃😄😁🎉🎊🎈";

// Special regex characters
const regex = /[\^\$\.\|\?\*\+\(\)\[\]\{\}\\]/g;
const escaped = "\"\\n\\t\\r\\\"";
```

---

## 5. Nested Structures

### Code in Lists

1. First installation step:
   ```bash
   npm install code-block-highlighter
   ```

2. Configuration step:
   ```json
   {
     "codeBlock.enableHighlighting": true,
     "codeBlock.cacheSize": 100
   }
   ```

3. Usage example:
   ```typescript
   import { highlighter } from 'code-block-highlighter';
   highlighter.enable();
   ```

### Code in Blockquotes

> Here's a tip for developers:
> 
> ```javascript
> // Always use const by default
> const config = {
>   theme: 'dark',
>   fontSize: 14
> };
> ```

### Code in Tables

| Language | Example | Description |
|----------|---------|-------------|
| JavaScript | `const x = 10;` | Variable declaration |
| Python | `x = 10` | Variable assignment |
| Java | `int x = 10;` | Typed variable |

---

## 6. Large Code Block (500+ lines)

### Python - Complete Flask Application

```python
# Complete Flask REST API with authentication, database, and error handling
from flask import Flask, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
import datetime
from sqlalchemy import desc, asc
from sqlalchemy.exc import IntegrityError
import os
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['TOKEN_EXPIRATION'] = 24  # hours

# Initialize database
db = SQLAlchemy(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Database Models
# ============================================================================

class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_email=False):
        """Convert user to dictionary"""
        data = {
            'id': self.id,
            'username': self.username,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
        }
        if include_email:
            data['email'] = self.email
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'


class Post(db.Model):
    """Blog post model"""
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    published = db.Column(db.Boolean, default=False)
    views = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    tags = db.relationship('Tag', secondary='post_tags', backref='posts', lazy='dynamic')
    
    def to_dict(self, include_author=True, include_comments=False):
        """Convert post to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'slug': self.slug,
            'published': self.published,
            'views': self.views,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        
        if include_author:
            data['author'] = self.author.to_dict()
        
        if include_comments:
            data['comments'] = [comment.to_dict(include_author=True) for comment in self.comments]
        
        data['tags'] = [tag.name for tag in self.tags]
        
        return data
    
    def __repr__(self):
        return f'<Post {self.title}>'


class Comment(db.Model):
    """Comment model"""
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self, include_author=True):
        """Convert comment to dictionary"""
        data = {
            'id': self.id,
            'content': self.content,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat(),
        }
        
        if include_author:
            data['author'] = self.author.to_dict()
        
        return data
    
    def __repr__(self):
        return f'<Comment {self.id}>'


class Tag(db.Model):
    """Tag model for categorizing posts"""
    __tablename__ = 'tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    def __repr__(self):
        return f'<Tag {self.name}>'


# Association table for many-to-many relationship
post_tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('posts.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)


# ============================================================================
# Authentication Decorators
# ============================================================================

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            
            g.current_user = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated


def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not g.current_user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    
    return decorated


# ============================================================================
# Authentication Routes
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f'New user registered: {user.username}')
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict(include_email=True)
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Database integrity error'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f'Registration error: {str(e)}')
        return jsonify({'error': 'An error occurred during registration'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=app.config['TOKEN_EXPIRATION'])
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        logger.info(f'User logged in: {user.username}')
        
        return jsonify({
            'token': token,
            'user': user.to_dict(include_email=True)
        }), 200
        
    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An error occurred during login'}), 500


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current authenticated user"""
    return jsonify(g.current_user.to_dict(include_email=True)), 200


# ============================================================================
# Post Routes
# ============================================================================

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Get all posts with pagination and filtering"""
    try:
        # Pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Filtering parameters
        published_only = request.args.get('published', 'true').lower() == 'true'
        tag = request.args.get('tag', None)
        search = request.args.get('search', None)
        
        # Build query
        query = Post.query
        
        if published_only:
            query = query.filter_by(published=True)
        
        if tag:
            query = query.join(Post.tags).filter(Tag.name == tag)
        
        if search:
            query = query.filter(
                db.or_(
                    Post.title.ilike(f'%{search}%'),
                    Post.content.ilike(f'%{search}%')
                )
            )
        
        # Sort by creation date (newest first)
        query = query.order_by(desc(Post.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'posts': [post.to_dict() for post in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        logger.error(f'Error fetching posts: {str(e)}')
        return jsonify({'error': 'An error occurred while fetching posts'}), 500


@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """Get a single post by ID"""
    post = Post.query.get_or_404(post_id)
    
    # Increment view count
    post.views += 1
    db.session.commit()
    
    return jsonify(post.to_dict(include_comments=True)), 200


@app.route('/api/posts', methods=['POST'])
@token_required
def create_post():
    """Create a new post"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title') or not data.get('content'):
            return jsonify({'error': 'Title and content are required'}), 400
        
        # Generate slug from title
        slug = data['title'].lower().replace(' ', '-')
        
        # Ensure slug is unique
        base_slug = slug
        counter = 1
        while Post.query.filter_by(slug=slug).first():
            slug = f'{base_slug}-{counter}'
            counter += 1
        
        # Create post
        post = Post(
            title=data['title'],
            content=data['content'],
            slug=slug,
            published=data.get('published', False),
            user_id=g.current_user.id
        )
        
        # Add tags if provided
        if 'tags' in data:
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                post.tags.append(tag)
        
        db.session.add(post)
        db.session.commit()
        
        logger.info(f'Post created: {post.title} by {g.current_user.username}')
        
        return jsonify({
            'message': 'Post created successfully',
            'post': post.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Error creating post: {str(e)}')
        return jsonify({'error': 'An error occurred while creating the post'}), 500


# ============================================================================
# Initialize Database and Run
# ============================================================================

@app.cli.command()
def init_db():
    """Initialize the database"""
    db.create_all()
    print('Database initialized!')


@app.cli.command()
def create_admin():
    """Create an admin user"""
    admin = User(username='admin', email='admin@example.com', is_admin=True)
    admin.set_password('admin')
    db.session.add(admin)
    db.session.commit()
    print('Admin user created!')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## 7. Mixed Content Testing

Here's a paragraph before a code block. The extension should handle transitions between markdown content and code blocks smoothly.

```json
{
  "name": "test-package",
  "version": "1.0.0",
  "description": "Testing JSON syntax highlighting",
  "keywords": ["test", "json", "highlighting"],
  "nested": {
    "array": [1, 2, 3, 4, 5],
    "boolean": true,
    "null_value": null
  }
}
```

And here's content after the code block. Let's add a list:

- Item 1
- Item 2
- Item 3

And now another code block:

```ruby
# Ruby class with inheritance
class Animal
  attr_accessor :name, :age
  
  def initialize(name, age)
    @name = name
    @age = age
  end
  
  def speak
    "Some sound"
  end
end

class Dog < Animal
  def speak
    "Woof!"
  end
  
  def fetch(item)
    puts "#{@name} fetches the #{item}"
  end
end

dog = Dog.new("Buddy", 3)
puts dog.speak
dog.fetch("ball")
```

---

## 8. Performance Test Section

### Multiple Sequential Blocks

```javascript
console.log("Block 1");
```

```python
print("Block 2")
```

```java
System.out.println("Block 3");
```

```cpp
std::cout << "Block 4" << std::endl;
```

```rust
println!("Block 5");
```

```go
fmt.Println("Block 6")
```

```typescript
console.log("Block 7");
```

```bash
echo "Block 8"
```

```sql
SELECT "Block 9";
```

```json
{"block": 10}
```

---

## Testing Checklist

When viewing this document in VS Code Markdown Preview:

- [ ] All code blocks should have syntax highlighting
- [ ] Highlighting should match the current VS Code theme
- [ ] Switching themes should update highlighting immediately
- [ ] Large code blocks should load without freezing
- [ ] Scrolling should be smooth
- [ ] No console errors in preview
- [ ] Cache should improve reload performance
- [ ] Unknown languages should display as plain text
- [ ] Empty blocks should not cause errors
- [ ] Special characters should display correctly

---

**End of Test Document**

*This document contains approximately 50+ code blocks in 15+ different languages to thoroughly test the Code Block Syntax Highlighter extension.*
