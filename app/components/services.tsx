import React from "react";
import Link from "next/link";
import { client } from "@/lib/sanity";
import { urlFor } from "@/lib/image";

type Service = {
    _id: string;
    title: string;
    description: string;
    image?: { _type: string; asset: { _ref: string } };
};

const Services = async () => {
    const allServices = await client.fetch<Service[]>(`*[_type == "service"]`);
    const services = allServices.slice(0, 3);

    return (
        <section className="py-14 md:py-28 bg-neutral-900 text-white">
            <div className="mx-auto flex flex-col gap-8 md:gap-14">
                <div className="text-center  px-3 md:px-8 ">
                    <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-wide mb-4">
                        Parte de lo que hacemos
                    </h2>
                    <p className="text-white/80 md:max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
                        Trabajo de forma independiente y me especializo en
                        trenzas. Siempre atenta a las tendencias, técnicas
                        nuevas y lo que mejor funciona para cada tipo de
                        cabello.
                    </p>
                </div>

                <div className="w-full md:h-[75vh] h-auto ">
                    <div className="grid grid-cols-1 md:grid-cols-3 py-3 md:p-0 md:px-32 left-0  relative md:h-[75vh]  w-full gap-8 md:gap-0 border-neutral-400 border-y md:border-y-2">
                        {services.map((s, index) => (
                            <article
                                key={s._id}
                                className={`relative flex flex-col justify-between gap-2 md:gap-0 p-4 h-full border-neutral-400 ${
                                    index !== 1 ? "md:border-x-2 " : ""
                                }`}
                            >
                                <div className={`w-full ${index === 1 ? "md:h-[65%] h-full" : "md:h-[50%] h-full"}`}>
                                    {s.image
                                        ? (
                                            <img
                                                src={urlFor(s.image).width(600)
                                                    .height(525).url()}
                                                alt={s.title}
                                                className="w-full h-full grayscale object-cover"
                                            />
                                        )
                                        : (
                                            <div className="w-full h-full flex items-center justify-center text-white/40">
                                                Sin imagen
                                            </div>
                                        )}
                                </div>
                                <div className="p-2 flex flex-col">
                                    <span className="text-xl text-white/70 mb-1">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
                                        {s.title}
                                    </h3>
                                    <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                                        {s.description}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="text-center">
                    <Link
                        href="/reservar"
                        className="inline-flex items-center text-xs md:text-base justify-center px-8 md:px-10 py-4 rounded-full border-2 border-white text-white font-semibold uppercase tracking-wide hover:bg-white hover:text-neutral-900 transition-colors"
                    >
                        Reservar cita
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Services;
