'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Container from '../Container';

export default function BrandSection() {
    const brands = [
        {
            name: 'Notaires de France',
            logo: '/marques/notaires.png',
            height: 40,
            width: 120
        },
        {
            name: 'FNAIM',
            logo: '/marques/fnaim.png',
            height: 45,
            width: 100
        }
    ];

    return (
        <section className="bg-white py-12 border-t border-gray-50">
            <Container>
                <div className="flex flex-col items-center">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-8"
                    >
                        Sources de données officielles
                    </motion.p>

                    <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24">
                        {brands.map((brand, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                className="relative group cursor-default"
                            >
                                <div className="absolute -inset-4 bg-gray-50/0 group-hover:bg-gray-50/50 rounded-2xl transition-all duration-500 -z-10"></div>
                                <Image
                                    src={brand.logo}
                                    alt={brand.name}
                                    width={brand.width}
                                    height={brand.height}
                                    className="h-10 md:h-14 w-auto object-contain opacity-60 group-hover:opacity-100 transition-all duration-700 ease-in-out"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}
