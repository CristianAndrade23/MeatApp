import {MenuItem} from '../menu-item/menu-item.model';

export class CartItem {
  constructor(public menuItem: MenuItem,
              public quantity = 1){}

  value() {
      return this.menuItem.price * this.quantity
  }
}
