// Notes rendering and management
class NotesManager {
    constructor() {
        this.currentView = 'all';
        this.currentType = 'notes';
        this.viewMode = storage.getViewMode();
        this.sortMode = storage.getSortMode();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // View selector buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.render();
            });
        });

        // Menu button (header version)
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                const menu = document.getElementById('dropdownMenu');
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                e.stopPropagation();
            });
        }

        // Menu button (bar version)
        const menuBtnBar = document.getElementById('menuBtnBar');
        if (menuBtnBar) {
            menuBtnBar.addEventListener('click', (e) => {
                const menu = document.getElementById('dropdownMenu');
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                e.stopPropagation();
            });
        }

        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                alert('🔍 Coming Soon');
            });
        }

        // Dropdown items
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
                const menu = document.getElementById('dropdownMenu');
                if (menu) menu.style.display = 'none';
            });
        });

        // Create button
        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                window.location.href = 'templates.html';
            });
        }

        // Toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentType = e.target.dataset.type;
                if (this.currentType === 'todos') {
                    window.location.href = 'todos.html';
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            const menu = document.getElementById('dropdownMenu');
            if (menu) menu.style.display = 'none';
        });
    }

    handleMenuAction(action) {
        switch(action) {
            case 'grid':
                this.viewMode = 'grid';
                storage.setViewMode('grid');
                break;
            case 'list':
                this.viewMode = 'list';
                storage.setViewMode('list');
                break;
            case 'sort-name':
                this.sortMode = 'name';
                storage.setSortMode('name');
                break;
            case 'sort-edited':
                this.sortMode = 'edited';
                storage.setSortMode('edited');
                break;
        }
        this.render();
    }

    render() {
        const container = document.getElementById('notesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        this.renderNotes(container);

        // Update view mode class
        if (this.viewMode === 'list') {
            container.classList.add('list-view');
        } else {
            container.classList.remove('list-view');
        }
    }

    renderNotes(container) {
        let notes = [];

        if (this.currentView === 'all') {
            notes = storage.getAllNotes();
        } else if (this.currentView === 'default') {
            notes = storage.getDefaultNotes();
        } else if (this.currentView === 'recent') {
            notes = storage.getRecentNotes();
        }

        // Sort notes
        if (this.sortMode === 'name') {
            notes.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
        } else if (this.sortMode === 'created') {
            notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        if (notes.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No notes yet. Create one to get started!</div>';
            return;
        }

        notes.forEach(note => {
            const card = this.createNoteCard(note);
            container.appendChild(card);
        });
    }

    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        
        // Set background if available
        if (note.sheetImage) {
            card.style.backgroundImage = `url('${note.sheetImage}')`;
        } else {
            card.classList.add('black-bg');
        }

        const date = new Date(note.updatedAt || note.createdAt);
        const formattedDate = this.formatDate(date);

        card.innerHTML = `
            <button class="card-delete-btn" type="button" aria-label="Delete note">Delete</button>
            <div class="note-card-title">${note.title || 'Untitled'}</div>
            <div class="note-card-content">${note.content ? note.content.substring(0, 100) : ''}</div>
            <div class="note-card-date">${formattedDate}</div>
        `;

        // Apply text styling from the note
        const titleEl = card.querySelector('.note-card-title');
        if (titleEl) {
            titleEl.style.fontFamily = note.titleFontFamily || note.fontFamily || 'Arial';
            titleEl.style.color = note.titleTextColor || note.textColor || '#ffffff';
            titleEl.style.textAlign = 'center';
        }

        const contentEl = card.querySelector('.note-card-content');
        if (contentEl) {
            contentEl.style.fontFamily = note.fontFamily || 'Arial';
            contentEl.style.fontSize = (note.fontSize ? Number(note.fontSize) * 0.6 : 19) + 'px';
            contentEl.style.color = note.textColor || 'rgba(255,255,255,0.95)';
            contentEl.style.textAlign = note.textAlign || 'left';
        }

        const deleteBtn = card.querySelector('.card-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const shouldDelete = window.confirm('Delete this note?');
                if (!shouldDelete) return;
                storage.deleteNote(note.id);
                notesManager.render();
            });
        }

        card.addEventListener('click', () => {
            window.location.href = `editor.html?id=${note.id}`;
        });

        return card;
    }

    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}

// Global notes manager instance
const notesManager = new NotesManager();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    notesManager.init();
});
