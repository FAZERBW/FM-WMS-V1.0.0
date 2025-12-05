
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ShopProfile } from '../types';

interface ShopStore {
  shop: ShopProfile;
  updateShop: (data: Partial<ShopProfile>) => void;
}

export const useShopStore = create<ShopStore>()(
  persist(
    (set) => ({
      shop: { 
        name: 'Prince Auto Parts', 
        mobile1: '9922115982', 
        mobile2: '99921226321', 
        address: 'Shop no.4, Naaz Complex, Behind Lokmanya Hospital, 80 Feet Road, Dhule, Maharashtra. 424001.', 
        slogan: 'Seller in electrical auto parts' 
      },
      updateShop: (data) => set((state) => ({ shop: { ...state.shop, ...data } })),
    }),
    { name: 'fm-shop-storage' }
  )
);
