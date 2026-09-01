// Storage management for notes and todos
class StorageManager {
    constructor() {
        this.notesKey = 'flikker_notes';
        this.todosKey = 'flikker_todos';
        this.viewKey = 'flikker_view_mode';
        this.sortKey = 'flikker_sort_mode';
    }

    // Notes Management
    getAllNotes() {
        const notes = localStorage.getItem(this.notesKey);
        return notes ? JSON.parse(notes) : [];
    }

    getNoteById(id) {
        const notes = this.getAllNotes();
        return notes.find(note => note.id === id);
    }

    getDefaultNotes() {
        return this.getAllNotes().filter(note => !note.notebook || note.notebook === 'default');
    }

    getRecentNotes(limit = null) {
        const notes = this.getAllNotes();
        const sorted = notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return limit ? sorted.slice(0, limit) : sorted;
    }

    saveNote(note) {
        const notes = this.getAllNotes();
        const index = notes.findIndex(n => n.id === note.id);
        
        if (index >= 0) {
            notes[index] = { ...notes[index], ...note, updatedAt: new Date().toISOString() };
        } else {
            notes.push({
                ...note,
                id: note.id || this.generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                notebook: note.notebook || 'default'
            });
        }
        
        localStorage.setItem(this.notesKey, JSON.stringify(notes));
        return notes[index >= 0 ? index : notes.length - 1];
    }

    deleteNote(id) {
        const notes = this.getAllNotes();
        const filtered = notes.filter(note => note.id !== id);
        localStorage.setItem(this.notesKey, JSON.stringify(filtered));
    }

    // Todos Management
    getAllTodos() {
        const todos = localStorage.getItem(this.todosKey);
        return todos ? JSON.parse(todos) : [];
    }

    saveTodo(todo) {
        const todos = this.getAllTodos();
        const index = todos.findIndex(t => t.id === todo.id);
        
        if (index >= 0) {
            todos[index] = { ...todos[index], ...todo };
        } else {
            todos.push({
                ...todo,
                id: todo.id || this.generateId(),
                completed: false,
                createdAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem(this.todosKey, JSON.stringify(todos));
        return todos[index >= 0 ? index : todos.length - 1];
    }

    deleteTodo(id) {
        const todos = this.getAllTodos();
        const filtered = todos.filter(todo => todo.id !== id);
        localStorage.setItem(this.todosKey, JSON.stringify(filtered));
    }

    // View Mode Management
    setViewMode(mode) {
        localStorage.setItem(this.viewKey, mode);
    }

    getViewMode() {
        return localStorage.getItem(this.viewKey) || 'grid';
    }

    // Sort Mode Management
    setSortMode(mode) {
        localStorage.setItem(this.sortKey, mode);
    }

    getSortMode() {
        return localStorage.getItem(this.sortKey) || 'edited';
    }

    // Utility
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    clearAllData() {
        localStorage.removeItem(this.notesKey);
        localStorage.removeItem(this.todosKey);
        localStorage.removeItem(this.viewKey);
        localStorage.removeItem(this.sortKey);
    }
}

// Global storage instance
const storage = new StorageManager();
