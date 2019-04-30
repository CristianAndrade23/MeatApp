import {Injectable} from '@angular/core';
import {ShoppingCartService} from '../restaurant-detail/shopping-cart/shopping-cart.service';
import {CartItem} from '../restaurant-detail/shopping-cart/cart-item.model';

@Injectable()
export class OrderService {

  constructor(private cartService: ShoppingCartService){}

  itemsValue(): number {
    return  this.cartService.total();
  }

  cartItems(): CartItem[] {
    return this.cartService.itens;
  }

  incrementaQtd(item: CartItem){
    this.cartService.incrementaQtd(item);
  }

  decrementaQtd(item: CartItem){
    this.cartService.decrementaQtd(item);
  }

  remove(item: CartItem){
    this.cartService.removeItem(item);
  }
}
