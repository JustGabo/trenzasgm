import Image from "next/image";
import Link from "next/link";
import React from "react";

const TrenzasHero = () => {
    return (
        <section className="grid md:grid-cols-2 gap-12 items-center px-4 pt-16 pb-0 md:py-16 md:px-16 max-w-8xl mx-auto">
            <div className="space-y-3 md:space-y-6">
                <h1 className="text-4xl md:text-[5vw] font-bold text-neutral-800 md:leading-none">
                    Un estilo donde te sientes unico 
                    {/* <span className="relative inline-block">
                        trenzas
                        <span className="absolute -top-2 -right-2 w-12 h-12 rounded-full overflow-hidden border-2 border-accent">
                            <Image
                                src="/hero.png"
                                alt=""
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                            />
                        </span>
                    </span> */}
                </h1>
                <p className="text-base md:text-[1.25vw] font-medium text-neutral-600 max-w-lg">
                    Bienvenida a TrenzasGM. El mejor sitio de trenzas de la
                    región.
                </p>
                <div className="flex items-center gap-3 md:gap-6">
                    <Link
                        href="/reservar"
                        className="md:px-5 md:py-3 px-3 py-2 border-2 md:text-[1vw] text-sm border-accent text-neutral-800 rounded-lg font-medium hover:bg-accent hover:text-white transition-colors"
                    >
                        Reservar cita
                    </Link>
                    <div className="flex items-center gap-2 text-neutral-600 cursor-pointer hover:text-accent transition-colors">
                        <span className="md:w-12 md:h-12 w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center shrink-0">
                            <svg
                                className="md:w-4 md:h-4 w-3 h-3 md:ml-1 text-accent"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </span>
                        <span className="md:text-[1vw] text-sm">Explorar</span>
                    </div>
                </div>
                <div className="flex items-center gap-8 pt-4 mt-7 md:mt-0 border-t border-neutral-200">
                    <div>
                        <p className="md:text-[1.5vw] text-base font-bold text-neutral-800">
                            15+
                        </p>
                        <p className="md:text-sm text-sm text-neutral-600">
                            Años de experiencia
                        </p>
                    </div>
                    <div className="w-px h-12 bg-neutral-200" />
                    <div>
                        <p className="md:text-[1.5vw] text-base font-bold text-neutral-800">
                            1k+
                        </p>
                        <p className="md:text-sm text-sm text-neutral-600">
                            Clientas felices
                        </p>
                    </div>
                </div>
            </div>

            {/* Hero image with mask from Figma shape */}
            <div className="relative flex justify-center md:justify-end">
                <div className="relative w-full md:max-w-104 max-w-72 aspect-4/5">
                    <div
                        className="absolute border border-black inset-0 mask-[url(/heroImgContainer.png)] mask-contain mask-no-repeat mask-center"
                    >
                        <Image
                            src="/hero/heroImg.jpg"
                            alt="Especialista en trenzas"
                            fill
                            className="object-cover object-top"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrenzasHero;
