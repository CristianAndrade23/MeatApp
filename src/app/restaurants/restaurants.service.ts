import {Restaurant} from './restaurant/restaurant.model';
import {Injectable} from '@angular/core';
import {MEAT_API} from '../app.api';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {ErrorHandler} from '../app.error-handler';
import {Review} from "../restaurant-detail/reviews/review.model";
import {MenuItem} from "../restaurant-detail/menu-item/menu-item.model";

@Injectable()
export class RestaurantsService {

  constructor(private http: Http){}

  restaurants(): Observable<Restaurant[]> {
    return this.http.get(`${ MEAT_API }/restaurants`)
      .map(response => response.json())
      .catch(ErrorHandler.handleError)
  };


  restaurantsPorId(id: number): Observable<Restaurant>{
    return this.http.get(`${MEAT_API}/restaurants/${id}`)
      .map(response => response.json())
      .catch(ErrorHandler.handleError)
  }

  reviewsOfRestaurant(id: string): Observable<Review>{
    return this.http.get(`${MEAT_API}/restaurants/${id}/reviews`)
      .map(response => response.json())
      .catch(ErrorHandler.handleError)
  }

  menuOfRestaurant(id: string): Observable<MenuItem[]>{
    return this.http.get(`${MEAT_API}/restaurants/${id}/menu`)
      .map(response => response.json())
      .catch(ErrorHandler.handleError)
  }

}
