import { Component, Input } from '@angular/core';
import { NoteService } from '../services/note.service';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppSnackbarComponent } from '../shared/app-snackbar/app-snackbar.component';
import { AppLoadingComponent } from '../shared/app-loading/app-loading.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'note',
  imports: [
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    AppLoadingComponent,
    MatIconModule,
  ],
  templateUrl: './note.component.html',
  styleUrl: './note.component.css',
})
export class NoteComponent {
  private _noteId = '';
  @Input()
  set noteId(value: string) {
    if (value !== this._noteId) {
      if (!this.originalNoteId) {
        this.originalNoteId = value;
      }
      this._noteId = value;
      this.onNoteIdChanged(value);
    }
  }
  get noteId(): string {
    return this._noteId;
  }

  originalNoteId: string = '';
  noteContent: string | null = null;
  originalContent: string | null = null;
  contentChange: boolean = false;
  noteIdChange: boolean = false;
  loading: boolean = true;
  disabledSave: boolean = !(this.noteIdChange || this.contentChange);
  onSuccess: boolean = false;
  newFile: boolean = false;

  constructor(private note: NoteService, private snackBar: MatSnackBar) {}

  async ngOnInit() {
    this.note.IN_DETAILED.next(true);
    if (this.noteId && this.noteId !== '') {
      await this.getNotes();
    } else {
      this.newFile = true;
    }
    this.loading = false;
  }

  private async getNotes() {
    try {
      const result = await this.note.fetchNote(this.noteId);
      if (result !== null) {
        this.loading = false;
        this.noteContent = result;
        this.originalContent = result;
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  }

  onNoteIdUpdate(value: Event) {
    var result = value.target as HTMLInputElement;
    if (!this.noteId) {
      this.noteIdChange = true;
      this.noteId = result.value;
      this.refreshButtonDisabled();
      return;
    }
    this.noteId = result.value;
    this.noteIdChange = this.noteId !== this.originalNoteId;
    this.refreshButtonDisabled();
  }

  onContentChange(value: Event) {
    var result = value.target as HTMLTextAreaElement;
    if (!this.noteId) {
      this.contentChange = true;
      this.noteContent = result.value;
      console.log(`Note ID ${this.noteId}`);
      this.refreshButtonDisabled();
      return;
    }
    this.noteContent = result.value;
    this.contentChange = this.noteContent !== this.originalContent;
    this.refreshButtonDisabled();
  }

  async onSave() {
    try {
      this.loading = true;

      await this.saveTitle();

      await this.saveContent();

      if (this.onSuccess) {
        this.note.IN_DETAILED.next(false);
        this.Notify();
      } else {
        this.Notify('note cannot be saved', 'close', 'error');
      }
      this.loading = false;
    } catch (error) {
      this.Notify(String(error), 'close', 'error');
    } finally {
      this.loading = false;
    }
  }

  private async saveContent() {
    if (!this.contentChange) return;
    var response = await this.note.saveNote(
      this.noteId,
      this.noteContent || ''
    );

    if (response.status === 200) {
      this.originalContent = this.noteContent;
      this.contentChange = false;
      this.onSuccess = true;
    } else {
      this.onSuccess = false;
    }
  }

  private async saveTitle() {
    if (this.newFile) {
      var response = await this.note.saveNote(
        this.noteId,
        this.noteContent || '',
        this.newFile
      );
      if (response.status === 200) {
        this.originalNoteId = this.noteId;
        this.newFile = false;
        this.noteIdChange = false;
        this.onSuccess = true;
        return;
      } else {
        this.onSuccess = false;
        return;
      }
    }

    if (!this.noteIdChange) return;
    var response = await this.note.renameNoteFile(
      this.originalNoteId,
      this.noteId
    );
    if (response.status === 200) {
      this.noteIdChange = false;
      this.originalNoteId = this.noteId;
      this.onSuccess = true;
    } else {
      this.onSuccess = false;
    }
  }

  private Notify(
    message?: string,
    icon?: string,
    status?: 'success' | 'error'
  ) {
    if (status == 'error' && message?.startsWith('Error:'))
      message = message.replace('Error:', '').trim();

    this.snackBar.openFromComponent(AppSnackbarComponent, {
      data: {
        message: message || 'Note saved successfully!',
        icon: icon || 'check',
        status: status || 'success',
      },
      panelClass: 'custom-snackbar-panel',
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }

  onNoteIdChanged(noteId: string) {
    this.noteIdChange = noteId !== this.originalNoteId;
  }

  refreshButtonDisabled() {
    this.disabledSave = !(
      this.noteId &&
      (this.noteIdChange || this.contentChange)
    );
  }

  async onDelete() {
    this.loading = true;
    try {
      await this.note.deleteNote(this.noteId);
      this.Notify('Note deleted successfully!', 'check', 'success');
      this.note.IN_DETAILED.next(false);
    } catch (error) {
      this.Notify(String(error), 'close', 'error');
    } finally {
      this.loading = false;
    }
  }
}
