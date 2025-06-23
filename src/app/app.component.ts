import { Component } from '@angular/core';
import { NoteService } from './services/note.service';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { NoteListComponent } from './note-list/note-list.component';
import { CommonModule, NgIf } from '@angular/common';
import { NoteComponent } from './note/note.component';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
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
}
