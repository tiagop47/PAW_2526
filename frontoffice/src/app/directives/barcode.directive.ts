import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Directive({
  selector: '[appBarcode]',
  standalone: true
})
export class BarcodeDirective implements OnChanges {
  @Input('appBarcode') value: string | undefined;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value) {
      try {
        JsBarcode(this.el.nativeElement, this.value, {
          format: 'CODE128',
          lineColor: '#000',
          width: 2,
          height: 50,
          displayValue: true
        });
      } catch (e) {
        console.error('Error generating barcode:', e);
      }
    }
  }
}
