import { Truck, Clock, ShieldCheck, Phone, ThumbsUp } from 'lucide-react';

const features = [
    {
        icon: Truck,
        title: 'Fast, Countrywide Shipping',
        description: 'Across Kenya',
    },
    {
        icon: Clock,
        title: 'Same Day Delivery',
        description: 'Nairobi and Environs',
    },
    {
        icon: ShieldCheck,
        title: '1 Year warranty',
        description: 'For new Laptops',
    },
    {
        icon: Phone,
        title: 'Customer Service',
        description: 'WhatsApp, Call, or Email',
    },
    {
        icon: ThumbsUp,
        title: 'Wide variety',
        description: 'Select from wide range products',
    },
];


export function InfoFeatures() {
    return (
        <div className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-[40px] py-8 px-6 shadow-xl my-8 border border-white/10">
            <div className="flex flex-wrap justify-between items-center gap-6 max-w-7xl mx-auto">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 flex-1 min-w-[200px]"
                    >
                        <div className="p-2 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                            <feature.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-sm leading-tight">{feature.title}</h3>
                            <p className="text-white/80 text-xs">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
