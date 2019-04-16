export class Restaurant {
  constructor(public id: string,
              public name: string,
              public category: string,
              public deliveryEstimate: string,
              public rating: number,
              public imagePath: string,
              public about?: string,
              public hours?: string) {}

}
