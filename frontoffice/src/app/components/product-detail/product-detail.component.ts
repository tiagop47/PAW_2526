import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ProductDTO } from '../../models/product.dto';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  product: ProductDTO | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private rest: ProductService,
  ) {}

  ngOnInit(): void {
    var idTemp = this.route.snapshot.params['id'];
    this.rest.getProduct(idTemp).subscribe((data: ProductDTO) => {
      this.product = data;
      this.loading = false;
    });
  }
}
