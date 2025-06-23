import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NoteService } from '../services/note.service';
import { CommonModule, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-toolbar',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    NgIf,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css',
})
export class ToolbarComponent {
  profileName: any;
  InDetail: BehaviorSubject<boolean> | undefined;
  constructor(private noteService: NoteService, private auth: AuthService) {
    this.InDetail = this.noteService.IN_DETAILED;
  }

  async ngOnInit() {
    await this.onSignIn();
  }

  async onSignIn() {
    var response = await this.auth.signIn();
    if (response) {
      this.profileName = response;
      this.noteService.SIGNED_IN.next(true);
    } else {
      console.error('Failed to sign in or fetch profile name');
      this.noteService.SIGNED_IN.next(false);
    }
  }
  onSignOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('profileName');
    this.profileName = null;
    this.noteService.SIGNED_IN.next(false);
    this.noteService.IN_DETAILED.next(false);
  }

  onBack() {
    this.noteService.IN_DETAILED.next(false);
  }
}
