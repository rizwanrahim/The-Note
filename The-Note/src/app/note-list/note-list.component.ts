import { MatSnackBar } from '@angular/material/snack-bar';
import { AppSnackbarComponent } from './../shared/app-snackbar/app-snackbar.component';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NoteService } from '../services/note.service';
import { CommonModule, NgFor, NgStyle } from '@angular/common';
import { AppLoadingComponent } from '../shared/app-loading/app-loading.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'note-list',
  imports: [
    MatCardModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
    NgFor,
    NgStyle,
    AppLoadingComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css',
})
export class NoteListComponent {
  notes: any = [];
  @Output() noteId = new EventEmitter<string>();
  loading: boolean = true;

  searchText = '';
  private searchSubject = new Subject<string>();

  constructor(private note: NoteService, private snackBar: MatSnackBar) {}

  async ngOnInit() {
    try {
      this.onSearchTextChanged();
      await this.note.saveFolder();

      const fetchedNotes = await this.note.fetchNotes();
      const colors = this.getDistinctColors(fetchedNotes.length);
      if (fetchedNotes.length > 0) {
        this.notes = fetchedNotes.map((note: any, index: number) => ({
          ...note,
          bgColor: colors[index],
        }));
      }

      this.loading = false;
    } catch (err) {
      console.error('Error creating folder or fetching notes:', err);
    }
  }

  getDistinctColors(count: number): string[] {
    const colors: string[] = [];
    const step = 360 / count;
    for (let i = 0; i < count; i++) {
      const hue = Math.floor(i * step + Math.random() * (step / 2));
      colors.push(`hsl(${hue}, 70%, 80%)`);
    }
    return colors;
  }

  openNote(noteId: string) {
    this.noteId.emit(noteId);
  }

  onSearchInput(value: Event) {
    this.searchSubject.next(String(value));
  }

  private onSearchTextChanged() {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(async (searchText) => {
        try {
          var files = await this.note.searchNotesInFolder(searchText);
          if (files) {
            const colors = this.getDistinctColors(files.length);
            this.notes = files.map((file: any, index: number) => ({
              ...file,
              bgColor: colors[index],
            }));
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
    message?: string,
    icon?: string,
    status?: 'success' | 'error'
  ) {
    this.snackBar.openFromComponent(AppSnackbarComponent, {
      data: {
        message: message || 'Note saved successfully!',
        icon: icon || 'check',
        status: status || 'success',
      },
      panelClass: 'custom-snackbar-panel',
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
    });
  }
}
