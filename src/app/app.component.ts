import { Component, ElementRef, ViewChild } from '@angular/core';
import { NoteService } from './services/note.service';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { NoteListComponent } from './note-list/note-list.component';
import { CommonModule, NgIf } from '@angular/common';
import { NoteComponent } from './note/note.component';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppLoadingComponent } from './shared/app-loading/app-loading.component';

@Component({
  selector: 'app-root',
  imports: [
    ToolbarComponent,
    NoteListComponent,
    NgIf,
    NoteComponent,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    AppLoadingComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  files: { name: string; content: string }[] = [];
  loading = new BehaviorSubject<boolean>(false);
  constructor(public note: NoteService, public auth: AuthService) {}

  noteId: string = '';
  InDetail: BehaviorSubject<boolean> | undefined;
  SignedIn: BehaviorSubject<boolean> | undefined;

  ngOnInit() {
    this.InDetail = this.note.IN_DETAILED;
    this.SignedIn = this.note.SIGNED_IN;
  }

  onSave() {
    this.onNoteSelected('');
  }

  onNoteSelected(noteId: string) {
    this.note.IN_DETAILED.next(true);
    this.noteId = noteId;
  }
  onUpload() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    this.loading.next(true);
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.files = [];

    const fileList = Array.from(input.files).filter((file) =>
      file.name.toLowerCase().endsWith('.txt')
    );
    for (const file of fileList) {
      const content = await this.readFileAsText(file);
      this.files.push({ name: file.name, content });
      await this.note.saveNote(file.name.replace('.txt', ''), content);
    }

    this.note.triggerRefresh();
    this.loading.next(false);
  }

  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
