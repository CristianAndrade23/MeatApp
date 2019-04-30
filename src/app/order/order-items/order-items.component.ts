import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CartItem} from '../../restaurant-detail/shopping-cart/cart-item.model';

@Component({
  selector: 'mt-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.css']
})
export class OrderItemsComponent implements OnInit {

  @Input() items: CartItem[];

  @Output() incrementaQtd = new EventEmitter<CartItem>();
  @Output() decrementaQtd = new EventEmitter<CartItem>();
  @Output() excluir = new EventEmitter<CartItem>();

  constructor() { }

  ngOnInit() {
  }

  emiteIncrementaQtd(item: CartItem){
    this.incrementaQtd.emit(item);
  }

  emiteDecrementaQtd(item: CartItem){
    this.decrementaQtd.emit(item);
  }

  emiteRemove(item: CartItem){
    this.excluir.emit(item);
  }
}
