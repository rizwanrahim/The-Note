import { NgClass } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-snackbar',
  imports: [MatIconModule, NgClass],
  templateUrl: './app-snackbar.component.html',
  styleUrl: './app-snackbar.component.css',
})
export class AppSnackbarComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA)
    public data: {
      message: string;
      icon?: string;
      status?: 'success' | 'error';
    }
  ) {}
}
