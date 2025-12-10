export interface Product {
  id: number;
  name: string;
  image: string;
}

export const products: Product[] = [
  { id: 1, name: '와인', image: '/images/product1.jpg' },
  { id: 2, name: '쿠키세트', image: '/images/product2.jpg' },
  { id: 3, name: '와인', image: '/images/product3.jpg' },
  { id: 4, name: '숙취해소제', image: '/images/product4.jpg' },
  { id: 5, name: '와인', image: '/images/product5.jpg' },
];