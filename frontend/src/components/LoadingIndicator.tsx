'use client';

import { useEffect, useState } from 'react';

export default function LoadingIndicator() {
    const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, opacity: number }>>([]);

    //     useEffect(() => {
    //         const interval = setInterval(() => {
    //             setParticles(prev => {
    //                 // Remove old particles and add new ones
    //                 const newParticles = prev
    //                     .map(p => ({ ...p, opacity: p.opacity - 0.02 }))
    //                     .filter(p => p.opacity > 0);

    //                 // Add new particle
    //                 if (newParticles.length < 8) {
    //                     newParticles.push({
    //                         id: Date.now(),
    //                         x: Math.random() * 100,
    //                         y: Math.random() * 100,
    //                         opacity: 1
    //                     });
    //                 }

    //                 return newParticles;
    //             });
    //         }, 300);

    //         return () => clearInterval(interval);
    //     }, []);

    //     return (
    //         <div className="absolute top-4 right-10 w-16 h-16 pointer-events-none">
    //             <div className="relative w-full h-full">
    //                 {particles.map(particle => (
    //                     <div
    //                         key={particle.id}
    //                         className="absolute text-2xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
    //                         style={{
    //                             left: `${particle.x}%`,
    //                             top: `${particle.y}%`,
    //                             opacity: particle.opacity
    //                         }}
    //                     >
    //                         🤔
    //                     </div>
    //                 ))}
    //             </div>
    //         </div>
    //     );
}
