/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef } from 'react';

export const useCountUp = (endValue: number, duration: number = 2000): number => {
    const [count, setCount] = useState(0);
    const frameRate = 60;
    const totalFrames = Math.round(duration / (1000 / frameRate));
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    // FIX: Changed to a more explicit and robust ref initialization.
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        let frame = 0;
        const counter = () => {
            frame++;
            const progress = easeOutCubic(frame / totalFrames);
            const currentCount = Math.round(endValue * progress);

            if (frame <= totalFrames) {
                setCount(currentCount);
                requestRef.current = requestAnimationFrame(counter);
            } else {
                 setCount(endValue);
            }
        };

        requestRef.current = requestAnimationFrame(counter);
        
        return () => {
            // FIX: Check for null/undefined instead of truthiness, as request ID can be 0.
            if (requestRef.current != null) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [endValue, duration]);
    
    return count;
};