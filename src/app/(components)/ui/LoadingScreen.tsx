
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const steps = [
    "Connexion au Cadastre...",
    "Extraction des actes notariés...",
    "Analyse du marché en temps réel...",
    "Vérification des risques...",
    "Finalisation du rapport..."
];

export default function LoadingScreen() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center p-6 cursor-wait">

            {/* Brand Mark - Pulsing gently */}
            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-12"
            >
                <div className="w-16 h-1 bg-black rounded-full mb-1"></div>
                <div className="w-8 h-1 bg-emerald-500 rounded-full mx-auto"></div>
            </motion.div>

            {/* Dynamic Text */}
            <div className="h-8 mb-8 relative flex items-center justify-center w-full">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentStep}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-sm md:text-base font-light tracking-[0.2em] text-gray-900 uppercase text-center absolute min-w-[300px]"
                    >
                        {steps[currentStep]}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Ultra-thin Progress Line */}
            <div className="w-64 h-[1px] bg-gray-100 overflow-hidden relative rounded-full">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-emerald-500 w-full"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 0.5
                    }}
                />
            </div>

        </div>
    );
}
