import React from 'react';
import {
  Car, Building2, Smartphone, Armchair, Shirt, Bike, Gem, PawPrint,
  Sailboat, Briefcase, Wrench, Store, Sparkles, Tag, Dumbbell,
} from 'lucide-react';

const MAP = {
  Car, Building2, Smartphone, Armchair, Shirt, Bike, Gem, PawPrint,
  Sailboat, Briefcase, Wrench, Store, Sparkles, Tag, Dumbbell,
};

export function CategoryIcon({ name, ...props }) {
  const Comp = MAP[name] || Tag;
  return <Comp {...props} />;
}
