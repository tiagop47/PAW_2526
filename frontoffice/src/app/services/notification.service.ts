import { Injectable, signal } from '@angular/core';

export interface Notification {
  message: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  notifications = this.notificationsSignal.asReadonly();
  private counter = 0;

  show(message: string, type: Notification['type'] = 'info', duration: number = 5000) {
    const id = this.counter++;
    const newNotification: Notification = { message, type, id };
    
    this.notificationsSignal.update(n => n.concat([newNotification]));

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  showSuccess(message: string) {
    this.show(message, 'success');
  }

  showError(message: string) {
    this.show(message, 'danger');
  }

  showInfo(message: string) {
    this.show(message, 'info');
  }

  showWarning(message: string) {
    this.show(message, 'warning');
  }

  remove(id: number) {
    this.notificationsSignal.update(n => n.filter(x => x.id !== id));
  }
}
