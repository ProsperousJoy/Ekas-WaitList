// queue.js
class Task {
    constructor(id, data, priority = 'low') {
      this.id = id;
      this.data = data;
      this.priority = priority;
      this.status = 'pending';
      this.progress = 0;
      this.result = null;
      this.error = null;
      this.createdAt = new Date();
      this.completedAt = null;
    }
  }
  
  class Queue {
    constructor() {
      this.highPriorityQueue = [];
      this.lowPriorityQueue = [];
      this.processing = false;
      this.handlers = new Map();
      this.taskMap = new Map();
    }
  
    registerHandler(taskType, handler) {
      this.handlers.set(taskType, handler);
    }
  
    async addTask(taskType, data, priority = 'low') {
      if (!this.handlers.has(taskType)) {
        throw new Error(`No handler registered for task type: ${taskType}`);
      }
  
      const task = new Task(
        `${taskType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        data,
        priority
      );
  
      this.taskMap.set(task.id, task);
      
      if (priority === 'high') {
        this.highPriorityQueue.push({ taskType, taskId: task.id });
      } else {
        this.lowPriorityQueue.push({ taskType, taskId: task.id });
      }
  
      if (!this.processing) {
        this.processQueue();
      }
  
      return task.id;
    }
  
    getTaskStatus(taskId) {
      const task = this.taskMap.get(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      return {
        id: task.id,
        status: task.status,
        progress: task.progress,
        result: task.result,
        error: task.error,
        createdAt: task.createdAt,
        completedAt: task.completedAt
      };
    }

    updateTaskProgress(taskId, progress) {
      const task = this.taskMap.get(taskId);
      if (task) {
        task.progress = progress;
      }
    }

    async processQueue() {
      this.processing = true;
  
      while (this.highPriorityQueue.length > 0 || this.lowPriorityQueue.length > 0) {
        const nextTask = this.highPriorityQueue.shift() || this.lowPriorityQueue.shift();
        const task = this.taskMap.get(nextTask.taskId);
        const handler = this.handlers.get(nextTask.taskType);
  
        try {
          task.status = 'processing';
          task.result = await handler(task.data, (progress) => this.updateTaskProgress(task.id, progress));
          task.status = 'completed';
          task.completedAt = new Date();
        } catch (error) {
          task.status = 'failed';
          task.error = error.message;
        }
      }
  
      this.processing = false;
    }

    cleanup(maxAge = 24 * 60 * 60 * 1000) {
      const now = new Date();
      for (const [taskId, task] of this.taskMap.entries()) {
        if (task.completedAt && (now - task.completedAt) > maxAge) {
          this.taskMap.delete(taskId);
        }
      }
    }
  }
  
  module.exports = Queue;