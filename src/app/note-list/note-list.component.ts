import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule, NgFor, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { NoteService } from '../services/note.service';
import { AppSnackbarComponent } from '../shared/app-snackbar/app-snackbar.component';
import { AppLoadingComponent } from '../shared/app-loading/app-loading.component';

@Component({
  selector: 'note-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgFor,
    NgStyle,
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule,
    AppLoadingComponent,
  ],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css',
})
export class NoteListComponent {
  @Output() noteId = new EventEmitter<string>();
  notes: any[] = [];
  loading = true;
  searchText = '';
  private searchSubject = new Subject<string>();

  constructor(private note: NoteService, private snackBar: MatSnackBar) {}

  async ngOnInit() {
    this.note.refreshNotes$.subscribe(() => this.fetchNotes());
    await this.fetchNotes();
    this.initSearchListener();
    this.loading = false;
  }

  private async fetchNotes() {
    await this.note.saveFolder();
    const fetchedNotes = await this.note.fetchNotes();
    this.notes = this.decorateAndSortNotes(fetchedNotes);
  }

  private decorateAndSortNotes(notes: any[]): any[] {
    const sortedNotes = [...notes].sort((a, b) => a.name.localeCompare(b.name));
    const colors = this.getDistinctColors(sortedNotes.length);
    return sortedNotes.map((note, index) => ({
      ...note,
      bgColor: colors[index],
    }));
  }

  private getDistinctColors(count: number): string[] {
    const step = 360 / count;
    return Array.from({ length: count }, (_, i) => {
      const hue = Math.floor(i * step + Math.random() * (step / 2));
      return `hsl(${hue}, 70%, 80%)`;
    });
  }

  openNote(noteId: string) {
    this.noteId.emit(noteId);
  }

  onSearchInput(value: string) {
    this.searchSubject.next(value);
  }

  private initSearchListener() {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(async (text) => {
        try {
          const files = await this.note.searchNotesInFolder(text);
          if (files && files.length > 0) {
            this.notes = this.decorateAndSortNotes(files);
          } else {
            this.notes = [];
            this.Notify('No notes found', 'info', 'error');
          }
        } catch (err) {
          console.error('Search error:', err);
        }
      });
  }

  private Notify(
    message = 'Note saved successfully!',
    icon = 'check',
    status: 'success' | 'error' = 'success'
  ) {
    this.snackBar.openFromComponent(AppSnackbarComponent, {
      data: { message, icon, status },
      panelClass: 'custom-snackbar-panel',
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
