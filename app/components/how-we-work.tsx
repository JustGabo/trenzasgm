import React from "react";

const HowWeWork = () => {
  const steps = [
    {
      number: "01",
      title: "Agendar",
      description:
        "Agenda una cita para elegir el servicio y la fecha que te quede mejor.",
    },
    {
      number: "02",
      title: "Confirmar",
      description:
        "Te confirmo la cita. Si necesitas reprogramar, avísame con tiempo y lo coordinamos.",
    },
    {
      number: "03",
      title: "El día del turno",
      description:
        "Nos encontramos en el lugar acordado. Si tienes que cancelar, avísame al menos con 24–48 horas antes.",
    },
  ];

  return (
    <section className="px-4 py-14 md:h-[60vh] flex items-center md:py-16  bg-neutral-100">
      <div className="max-w-[90vw] mx-auto flex flex-col gap-14">
        <h2 className="text-center text-4xl md:text-5xl font-bold uppercase tracking-wide text-neutral-900">Cómo trabajo</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <article key={step.number} className="relative flex flex-col gap-3 md:flex-row items-center md:gap-5">
              <span
                className=" md:text-[9vw] text-5xl tracking-tighter md:leading-px font-bold text-accent/20 select-none"
                aria-hidden
              >
                {step.number}
              </span>
              {/* <div className="flex items-center gap-1 w-[30vw]"/> */}
              <div className="relative flex flex-col items-center md:items-start gap-1 md:text-start text-center">
                <h3 className="text-lg md:text-[1.3vw] font-bold text-neutral-800">{step.title}</h3>
                <p className="text-neutral-600 text-sm md:text-[1rem] font-medium leading-relaxed">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowWeWork;
