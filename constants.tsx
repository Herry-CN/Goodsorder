
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '红富士苹果',
    price: 8.5,
    unit: '斤',
    category: '水果',
    spec: '精品大果',
    image: 'https://picsum.photos/id/102/400/300'
  },
  {
    id: 'p2',
    name: '精品大白菜',
    price: 1.2,
    unit: '斤',
    category: '蔬菜',
    spec: '新鲜现砍',
    image: 'https://picsum.photos/id/102/400/301'
  },
  {
    id: 'p3',
    name: '土鸡蛋',
    price: 15.0,
    unit: '盒',
    category: '禽蛋',
    spec: '10枚/盒',
    image: 'https://picsum.photos/id/102/400/302'
  },
  {
    id: 'p4',
    name: '农夫山泉',
    price: 2.0,
    unit: '瓶',
    category: '饮品',
    spec: '550ml',
    image: 'https://picsum.photos/id/102/400/303'
  },
  {
    id: 'p5',
    name: '金龙鱼花生油',
    price: 128.0,
    unit: '桶',
    category: '粮油',
    spec: '5L/桶',
    image: 'https://picsum.photos/id/102/400/304'
  }
];

export const SYNC_CHANNEL_NAME = 'smart_store_sync';
