import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  imports: [NgIf],
  templateUrl: './app-loading.component.html',
  styleUrl: './app-loading.component.css',
})
export class AppLoadingComponent {
  @Input() show: boolean = false;
}
