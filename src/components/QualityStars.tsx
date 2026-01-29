import React from 'react';
import { Star } from 'lucide-react';

interface QualityStarsProps {
  quality: number;
}

const QualityStars: React.FC<QualityStarsProps> = ({ quality }) => (
    <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={8} 
                className={i < quality ? "fill-amber-400 text-amber-400" : "text-gray-700"} 
            />
        ))}
    </div>
);

export default QualityStars;
