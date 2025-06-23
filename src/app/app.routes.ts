import { Routes } from '@angular/router';
import { NoteComponent } from './note/note.component';
import { NoteListComponent } from './note-list/note-list.component';

export const routes: Routes = [
    { path: '', component: NoteListComponent },
    { path: 'note/:id', component: NoteComponent }
];
