import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export default function SplineRobot() {
    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            <Suspense fallback={null}>
                <Spline
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full"
                />
            </Suspense>
        </div>
    );
}
