const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes and origins
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// In-memory storage for tasks (in production, use a database)
let tasks = [
    {
        id: 1,
        title: "Sample Task",
        description: "This is a sample task",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

let nextId = 2;

// Validation middleware
const validateTask = (req, res, next) => {
    const { title, description, status } = req.body;
    
    if (!title || title.trim() === '') {
        return res.status(400).json({ 
            error: 'Title is required and cannot be empty' 
        });
    }
    
    if (status && !['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({ 
            error: 'Status must be one of: pending, in-progress, completed' 
        });
    }
    
    next();
};

// Helper function to find task by ID
const findTaskById = (id) => {
    return tasks.find(task => task.id === parseInt(id));
};

// Routes

// GET /api/tasks - Get all tasks
app.get('/api/tasks', (req, res) => {
    const { status } = req.query;
    
    let filteredTasks = tasks;
    
    // Filter by status if provided
    if (status) {
        filteredTasks = tasks.filter(task => task.status === status);
    }
    
    res.json({
        success: true,
        count: filteredTasks.length,
        data: filteredTasks
    });
});

// GET /api/tasks/:id - Get a specific task
app.get('/api/tasks/:id', (req, res) => {
    const task = findTaskById(req.params.id);
    
    if (!task) {
        return res.status(404).json({
            success: false,
            error: 'Task not found'
        });
    }
    
    res.json({
        success: true,
        data: task
    });
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', validateTask, (req, res) => {
    const { title, description, status = 'pending' } = req.body;
    
    const newTask = {
        id: nextId++,
        title: title.trim(),
        description: description ? description.trim() : '',
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask
    });
});

// PUT /api/tasks/:id - Update a task
app.put('/api/tasks/:id', validateTask, (req, res) => {
    const task = findTaskById(req.params.id);
    
    if (!task) {
        return res.status(404).json({
            success: false,
            error: 'Task not found'
        });
    }
    
    const { title, description, status } = req.body;
    
    // Update task properties
    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status) task.status = status;
    task.updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Task updated successfully',
        data: task
    });
});

// PATCH /api/tasks/:id/status - Update only task status
app.patch('/api/tasks/:id/status', (req, res) => {
    const task = findTaskById(req.params.id);
    
    if (!task) {
        return res.status(404).json({
            success: false,
            error: 'Task not found'
        });
    }
    
    const { status } = req.body;
    
    if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Valid status is required: pending, in-progress, completed'
        });
    }
    
    task.status = status;
    task.updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Task status updated successfully',
        data: task
    });
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex(task => task.id === parseInt(req.params.id));
    
    if (taskIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Task not found'
        });
    }
    
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    res.json({
        success: true,
        message: 'Task deleted successfully',
        data: deletedTask
    });
});

// GET /api/stats - Get task statistics
app.get('/api/stats', (req, res) => {
    const stats = {
        total: tasks.length,
        pending: tasks.filter(task => task.status === 'pending').length,
        'in-progress': tasks.filter(task => task.status === 'in-progress').length,
        completed: tasks.filter(task => task.status === 'completed').length
    };
    
    res.json({
        success: true,
        data: stats
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Task Manager API',
        version: '1.0.0',
        endpoints: {
            'GET /api/tasks': 'Get all tasks',
            'GET /api/tasks/:id': 'Get a specific task',
            'POST /api/tasks': 'Create a new task',
            'PUT /api/tasks/:id': 'Update a task',
            'PATCH /api/tasks/:id/status': 'Update task status only',
            'DELETE /api/tasks/:id': 'Delete a task',
            'GET /api/stats': 'Get task statistics'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 Task Manager API is ready!`);
    console.log(`🔗 Try: GET http://localhost:${PORT}/api/tasks`);
});

module.exports = app;