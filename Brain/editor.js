// Note editor functionality
class NoteEditor {
    constructor() {
        this.currentNote = null;
        this.currentTemplate = null;
        this.activeElement = 'content'; // Track which element is being styled
        this.sheetScale = 1;
        // Content styling
        this.fontSize = '30';
        this.fontFamily = 'Arial';
        this.textAlign = 'left';
        this.textColor = '#000000';
        // Title styling
        this.titleFontSize = '30';
        this.titleFontFamily = 'Arial';
        this.titleTextColor = '#000000';
        this.titleTextAlign = 'center';
    }

    init() {
        this.setupEventListeners();
        this.loadNoteFromURL();
    }

    getDraftKey(noteId) {
        return noteId ? `flikker_note_draft_${noteId}` : 'flikker_note_draft';
    }

    saveDraft() {
        if (!this.currentNote) return;

        const titleInput = document.getElementById('editorTitle');
        const contentDiv = document.getElementById('editorContent');
        const titleTextAlign = titleInput ? window.getComputedStyle(titleInput).textAlign : (this.titleTextAlign || 'center');
        const contentTextAlign = contentDiv ? window.getComputedStyle(contentDiv).textAlign : (this.textAlign || 'left');

        this.currentNote.title = (titleInput && titleInput.value && titleInput.value.trim()) ? titleInput.value : 'NOTES';
        this.currentNote.content = contentDiv ? contentDiv.innerText : '';
        this.currentNote.fontFamily = this.fontFamily || 'Arial';
        this.currentNote.fontSize = this.fontSize || '30';
        this.currentNote.textAlign = contentTextAlign || this.textAlign || 'left';
        this.currentNote.textColor = this.textColor || '#000000';
        this.currentNote.titleFontFamily = this.titleFontFamily || 'Arial';
        this.currentNote.titleFontSize = this.titleFontSize || '30';
        this.currentNote.titleTextColor = this.titleTextColor || '#000000';
        this.currentNote.titleTextAlign = titleTextAlign || this.titleTextAlign || 'center';
        this.currentNote.sheetScale = this.sheetScale || 1;
        this.currentNote.updatedAt = new Date().toISOString();

        if (this.currentNote.id) {
            sessionStorage.setItem(this.getDraftKey(this.currentNote.id), JSON.stringify(this.currentNote));
        }
    }

    setupEventListeners() {
        // Font select
        const fontSelect = document.getElementById('fontSelect');
        if (fontSelect) {
            fontSelect.addEventListener('change', (e) => {
                if (this.activeElement === 'title') {
                    this.titleFontFamily = e.target.value;
                } else {
                    this.fontFamily = e.target.value;
                }
                this.updateEditorStyle();
                this.saveDraft();
            });
        }

        // Size select
        const sizeSelect = document.getElementById('sizeSelect');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                if (this.activeElement === 'title') {
                    this.titleFontSize = e.target.value;
                } else {
                    this.fontSize = e.target.value;
                }
                this.updateEditorStyle();
                this.saveDraft();
            });
        }

        // Align select
        const alignSelect = document.getElementById('alignSelect');
        if (alignSelect) {
            alignSelect.addEventListener('change', (e) => {
                if (this.activeElement === 'title') {
                    this.titleTextAlign = e.target.value;
                } else {
                    this.textAlign = e.target.value;
                }
                this.updateEditorStyle();
                this.saveDraft();
            });
        }

        // Color input
        const colorInput = document.getElementById('colorInput');
        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                if (this.activeElement === 'title') {
                    this.titleTextColor = e.target.value;
                } else {
                    this.textColor = e.target.value;
                }
                this.updateEditorStyle();
                this.saveDraft();
            });
        }

        // Size buttons
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.textContent.trim();
                const sheet = document.getElementById('editorSheet');
                if (!sheet) return;

                const currentScale = Number(sheet.dataset.scale || '1');
                let nextScale = currentScale;

                if (action === '+') {
                    nextScale = Math.min(1.4, currentScale + 0.08);
                } else if (action === '-') {
                    nextScale = Math.max(0.7, currentScale - 0.08);
                } else {
                    nextScale = Number(e.target.dataset.size) || currentScale;
                }

                this.sheetScale = nextScale;
                sheet.dataset.scale = String(nextScale);
                sheet.style.transform = `scale(${nextScale})`;
                sheet.style.transformOrigin = 'center center';
                this.saveDraft();
                const sizeSelect = document.getElementById('sizeSelect');
                if (sizeSelect) sizeSelect.value = this.fontSize;
            });
        });

        // Add image button
        const addImageBtn = document.getElementById('addImageBtn');
        if (addImageBtn) {
            addImageBtn.addEventListener('click', () => {
                document.getElementById('imageInput').click();
            });
        }

        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });
        }

        // Save button
        const saveBtn = document.getElementById('saveNoteBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveNote();
            });
        }

        // Delete button
        const deleteBtn = document.getElementById('deleteNoteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteNote();
            });
        }

        // Track which element is focused
        const titleInput = document.getElementById('editorTitle');
        if (titleInput) {
            titleInput.addEventListener('focus', () => {
                this.activeElement = 'title';
                this.updateStylesFromNote();
            });
            titleInput.addEventListener('input', () => {
                this.currentNote = this.currentNote || { id: '', title: 'NOTES', content: '', fontFamily: 'Arial', fontSize: '30', textAlign: 'left', textColor: '#000000', sheetImage: '', images: [] };
                this.saveDraft();
            });
        }

        const editorContent = document.getElementById('editorContent');
        if (editorContent) {
            editorContent.addEventListener('focus', () => {
                this.activeElement = 'content';
                this.updateStylesFromNote();
            });
            editorContent.addEventListener('input', () => {
                this.currentNote = this.currentNote || { id: '', title: 'NOTES', content: '', fontFamily: 'Arial', fontSize: '30', textAlign: 'left', textColor: '#000000', sheetImage: '', images: [] };
                this.saveDraft();
            });
        }

        window.addEventListener('beforeunload', () => {
            this.saveDraft();
        });
    }

    loadNoteFromURL() {
        const params = new URLSearchParams(window.location.search);
        const noteId = params.get('id');

        if (noteId) {
            const tempNote = sessionStorage.getItem('flikker_temp_note');
            if (tempNote) {
                const note = JSON.parse(tempNote);
                sessionStorage.removeItem('flikker_temp_note');
                this.openNote(note);
                return;
            }

            const draftKey = this.getDraftKey(noteId);
            const draftNote = sessionStorage.getItem(draftKey);
            if (draftNote) {
                const note = JSON.parse(draftNote);
                this.openNote(note);
                return;
            }

            const note = storage.getNoteById(noteId);
            if (note) {
                this.openNote(note);
            }
        }
    }

    openNote(note) {
        this.currentNote = note;
        this.activeElement = 'content';
        
        const titleInput = document.getElementById('editorTitle');
        const resolvedTitle = (note && note.title && note.title.trim()) ? note.title : 'NOTES';
        if (titleInput) titleInput.value = resolvedTitle;
        
        // Load title styles
        this.titleFontFamily = note.titleFontFamily || 'Arial';
        this.titleFontSize = note.titleFontSize || '30';
        this.titleTextColor = note.titleTextColor || '#000000';
        this.titleTextAlign = note.titleTextAlign || 'center';
        
        // Load content styles
        this.fontFamily = note.fontFamily || 'Arial';
        this.fontSize = note.fontSize || '30';
        this.textAlign = note.textAlign || 'left';
        this.textColor = note.textColor || '#000000';
        this.sheetScale = note.sheetScale || 1;

        this.updateDropdowns();
        this.renderContent();
        this.applyAllStyles();
        this.applySheetScale();
    }

    applyAllStyles() {
        const editorSheet = document.getElementById('editorSheet');
        if (!editorSheet) return;

        // Apply title styles
        const titleInput = editorSheet.querySelector('.editor-title');
        if (titleInput) {
            titleInput.style.fontFamily = this.titleFontFamily;
            titleInput.style.fontSize = this.titleFontSize + 'px';
            titleInput.style.color = this.titleTextColor;
            titleInput.style.textAlign = this.titleTextAlign || 'center';
        }

        // Apply content styles
        const content = document.getElementById('editorContent');
        if (content) {
            content.style.fontFamily = this.fontFamily;
            content.style.fontSize = this.fontSize + 'px';
            content.style.textAlign = this.textAlign;
            content.style.color = this.textColor;
        }
    }

    applySheetScale() {
        const sheet = document.getElementById('editorSheet');
        if (!sheet) return;
        const scale = Number(this.sheetScale || 1);
        sheet.dataset.scale = String(scale);
        sheet.style.transform = `scale(${scale})`;
        sheet.style.transformOrigin = 'center center';
    }

    updateStylesFromNote() {
        // Load current styles based on active element
        if (this.activeElement === 'title' && this.currentNote) {
            this.fontFamily = this.currentNote.titleFontFamily || 'Arial';
            this.fontSize = this.currentNote.titleFontSize || '30';
            this.textColor = this.currentNote.titleTextColor || '#000000';
            this.textAlign = this.currentNote.titleTextAlign || 'center';
            this.titleFontFamily = this.currentNote.titleFontFamily || 'Arial';
            this.titleFontSize = this.currentNote.titleFontSize || '30';
            this.titleTextColor = this.currentNote.titleTextColor || '#000000';
            this.titleTextAlign = this.currentNote.titleTextAlign || 'center';
        } else if (this.activeElement === 'content' && this.currentNote) {
            this.fontFamily = this.currentNote.fontFamily || 'Arial';
            this.fontSize = this.currentNote.fontSize || '30';
            this.textColor = this.currentNote.textColor || '#000000';
            this.textAlign = this.currentNote.textAlign || 'left';
            this.titleFontFamily = this.currentNote.titleFontFamily || 'Arial';
            this.titleFontSize = this.currentNote.titleFontSize || '30';
            this.titleTextColor = this.currentNote.titleTextColor || '#000000';
            this.titleTextAlign = this.currentNote.titleTextAlign || 'center';
        }
        this.updateDropdowns();
    }

    updateDropdowns() {
        const fontSelect = document.getElementById('fontSelect');
        if (fontSelect) fontSelect.value = this.activeElement === 'title' ? (this.titleFontFamily || this.fontFamily) : this.fontFamily;
        
        const sizeSelect = document.getElementById('sizeSelect');
        if (sizeSelect) sizeSelect.value = this.activeElement === 'title' ? (this.titleFontSize || this.fontSize) : this.fontSize;
        
        const alignSelect = document.getElementById('alignSelect');
        if (alignSelect) alignSelect.value = this.activeElement === 'title' ? (this.titleTextAlign || this.textAlign) : this.textAlign;
        
        const colorInput = document.getElementById('colorInput');
        if (colorInput) colorInput.value = this.activeElement === 'title' ? (this.titleTextColor || this.textColor) : this.textColor;
    }

    updateEditorStyle() {
        const editorSheet = document.getElementById('editorSheet');
        if (!editorSheet) return;

        if (this.activeElement === 'title') {
            // Apply to title using title properties
            const titleInput = editorSheet.querySelector('.editor-title');
            if (titleInput) {
                titleInput.style.fontFamily = this.titleFontFamily;
                titleInput.style.fontSize = this.titleFontSize + 'px';
                titleInput.style.color = this.titleTextColor;
                titleInput.style.textAlign = this.titleTextAlign || 'center';
            }
        } else {
            // Apply to content using content properties
            const content = document.getElementById('editorContent');
            if (content) {
                content.style.fontFamily = this.fontFamily;
                content.style.fontSize = this.fontSize + 'px';
                content.style.textAlign = this.textAlign;
                content.style.color = this.textColor;
            }
        }
    }

    renderContent() {
        const editorSheet = document.getElementById('editorSheet');
        if (!editorSheet) return;

        const titleInput = editorSheet.querySelector('.editor-title');
        if (titleInput) {
            titleInput.value = this.currentNote.title || 'NOTES';
        }

        const content = document.getElementById('editorContent');
        if (!content) return;

        content.innerText = this.currentNote.content || '';
        content.style.fontFamily = this.currentNote.fontFamily || 'Arial';
        content.style.fontSize = (this.currentNote.fontSize || '30') + 'px';
        content.style.textAlign = this.currentNote.textAlign || 'left';
        content.style.color = this.currentNote.textColor || '#000000';

        titleInput.style.textAlign = this.currentNote.titleTextAlign || 'center';
        titleInput.style.fontFamily = this.currentNote.titleFontFamily || 'Arial';
        titleInput.style.fontSize = (this.currentNote.titleFontSize || '30') + 'px';
        titleInput.style.color = this.currentNote.titleTextColor || '#000000';

        if (this.currentNote.sheetImage) {
            editorSheet.style.backgroundImage = `url('${this.currentNote.sheetImage}')`;
        } else {
            editorSheet.style.backgroundImage = 'none';
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const editorSheet = document.getElementById('editorSheet');
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.maxWidth = '75%';
            img.style.margin = '10px 0';
            img.style.display = 'block';
            
            editorSheet.appendChild(img);

            if (!this.currentNote.images) {
                this.currentNote.images = [];
            }

            this.currentNote.images.push({
                src: event.target.result,
                width: 75
            });

            this.autoSave();
        };

        reader.readAsDataURL(file);
        
        // Reset input
        e.target.value = '';
    }

    saveNote() {
        if (!this.currentNote) {
            console.error('No note to save');
            return;
        }

        const titleInput = document.getElementById('editorTitle');
        const title = (titleInput && titleInput.value && titleInput.value.trim()) ? titleInput.value : 'NOTES';
        const contentDiv = document.getElementById('editorContent');
        const content = contentDiv ? contentDiv.innerText : '';

        const actualTitleAlign = titleInput ? window.getComputedStyle(titleInput).textAlign : (this.titleTextAlign || 'center');
        const actualContentAlign = contentDiv ? window.getComputedStyle(contentDiv).textAlign : (this.textAlign || 'left');

        this.currentNote.title = title;
        this.currentNote.content = content;
        this.currentNote.fontFamily = this.fontFamily || 'Arial';
        this.currentNote.fontSize = this.fontSize || '30';
        this.currentNote.textAlign = actualContentAlign || this.textAlign || 'left';
        this.currentNote.textColor = this.textColor || '#000000';
        this.currentNote.titleFontFamily = this.titleFontFamily || 'Arial';
        this.currentNote.titleFontSize = this.titleFontSize || '30';
        this.currentNote.titleTextColor = this.titleTextColor || '#000000';
        this.currentNote.titleTextAlign = actualTitleAlign || this.titleTextAlign || 'center';
        this.currentNote.sheetScale = this.sheetScale || 1;

        storage.saveNote(this.currentNote);
        if (this.currentNote.id) {
            sessionStorage.removeItem(this.getDraftKey(this.currentNote.id));
        }
        sessionStorage.removeItem('flikker_temp_note');

        const btn = document.getElementById('saveNoteBtn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            btn.style.backgroundColor = '#27ae60';
            btn.disabled = true;

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    deleteNote() {
        if (!this.currentNote || !this.currentNote.id) return;

        const confirmed = window.confirm('Delete this note?');
        if (!confirmed) return;

        // Only delete if it was saved (not a new temporary note)
        if (this.currentNote.isNew) {
            // Just discard the unsaved note
            sessionStorage.removeItem('flikker_temp_note');
        } else {
            // Delete from persistent storage
            storage.deleteNote(this.currentNote.id);
        }
        
        window.location.href = 'dashboard.html';
    }

    autoSave() {
        // Manual save only: no autosave on edit.
        return;
    }
}

// Global editor instance
const editor = new NoteEditor();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    editor.init();
});
