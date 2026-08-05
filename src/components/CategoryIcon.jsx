import React from 'react';
import {
  Car, Building2, Smartphone, Armchair, Shirt, Bike, Gem, PawPrint,
  Sailboat, Briefcase, Wrench, Store, Sparkles, Tag,
} from 'lucide-react';

const MAP = {
  Car, Building2, Smartphone, Armchair, Shirt, Bike, Gem, PawPrint,
  Sailboat, Briefcase, Wrench, Store, Sparkles, Tag,
};

export function CategoryIcon({ name, ...props }) {
  const Comp = MAP[name] || Tag;
  return <Comp {...props} />;
}
