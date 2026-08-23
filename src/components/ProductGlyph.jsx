import React from 'react';
import {
  Car, Truck, Bus, Bike, Home, Building2, Trees, Smartphone, Laptop, Tv, Gamepad2,
  Camera, Armchair, Footprints, ShoppingBag, Watch, Shirt, Dumbbell, Gem, Dog, Cat,
  Bird, PawPrint, Sailboat, Briefcase, Sparkles, Wrench, Store,
} from 'lucide-react';

const MAP = {
  car: Car, truck: Truck, bus: Bus, bike: Bike, home: Home, building2: Building2, trees: Trees,
  smartphone: Smartphone, laptop: Laptop, tv: Tv, gamepad2: Gamepad2, camera: Camera,
  armchair: Armchair, footprints: Footprints, shoppingbag: ShoppingBag, watch: Watch, shirt: Shirt,
  dumbbell: Dumbbell, gem: Gem, dog: Dog, cat: Cat, bird: Bird, pawprint: PawPrint, sailboat: Sailboat,
  briefcase: Briefcase, sparkles: Sparkles, wrench: Wrench, store: Store,
};

export function ProductGlyph({ name, ...props }) {
  const Comp = MAP[name] || Sparkles;
  return <Comp {...props} />;
}
