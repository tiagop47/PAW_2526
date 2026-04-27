import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div *ngFor="let n of notificationService.notifications()" 
           [class]="'alert alert-dismissible fade show shadow alert-' + n.type" 
           role="alert">
        <i class="bi" [ngClass]="{
          'bi-check-circle-fill': n.type === 'success',
          'bi-exclamation-triangle-fill': n.type === 'danger',
          'bi-info-circle-fill': n.type === 'info',
          'bi-exclamation-circle-fill': n.type === 'warning'
        }"></i>
        <span class="ms-2">{{ n.message }}</span>
        <button type="button" class="btn-close" (click)="notificationService.remove(n.id)"></button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      width: 350px;
      max-width: 90vw;
    }
    .alert {
      margin-bottom: 10px;
      pointer-events: auto;
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
