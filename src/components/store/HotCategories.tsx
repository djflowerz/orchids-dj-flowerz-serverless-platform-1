import Link from 'next/link';
import { Laptop, Monitor, Printer, Smartphone, Keyboard, Wifi, Flame } from 'lucide-react';

const categories = [
    { name: 'Desktops', icon: Monitor, href: '/store?category=desktops' },
    { name: 'Laptops', icon: Laptop, href: '/store?category=laptops' },
    { name: 'Printers', icon: Printer, href: '/store?category=printers' },
    { name: 'Accessories', icon: Keyboard, href: '/store?category=accessories' },
    { name: 'Networking', icon: Wifi, href: '/store?category=networking' },
    { name: 'Smartphones', icon: Smartphone, href: '/store?category=smartphones' },
];

export function HotCategories() {
    return (
        <div className="py-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Flame className="w-5 h-5 text-fuchsia-500 fill-fuchsia-500" />
                Hot categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                {categories.map((category) => (
                    <Link
                        key={category.name}
                        href={category.href}
                        className="flex flex-col items-center group"
                    >
                        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3 group-hover:border-violet-500 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300">
                            <category.icon className="w-10 h-10 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                        </div>
                        <span className="font-medium text-sm text-zinc-400 group-hover:text-violet-400 text-center transition-colors">
                            {category.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
