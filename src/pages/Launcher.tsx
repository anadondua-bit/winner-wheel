import { MonitorPlay, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

type DestinationProps = {
  to: string;
  icon: typeof MonitorPlay;
  title: string;
  description: string;
};

const Destination = ({ to, icon: Icon, title, description }: DestinationProps) => (
  <Link
    to={to}
    className="panel-glass group flex flex-1 flex-col gap-4 rounded-[1.5rem] px-7 py-8 transition-transform hover:-translate-y-0.5"
  >
    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-mint/12 text-brand-mint transition-colors group-hover:bg-brand-mint/20">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
    <div>
      <h2 className="text-xl font-bold text-brand-light">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-light/55">{description}</p>
    </div>
    <span className="mt-auto text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-mint/80">
      Open {to} →
    </span>
  </Link>
);

/** Where to point a browser: the operator's console, or the TV mirroring the wheel. */
const Launcher = () => (
  <div className="flex h-full w-full items-center justify-center bg-background px-6" data-accent="teal">
    <div className="w-full max-w-2xl">
      <p className="eyebrow text-center">Conference awards wheel</p>
      <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-brand-light sm:text-4xl">
        Which screen is this?
      </h1>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-brand-light/50">
        Open the command center on the operator's laptop, and the stage display on the machine
        mirrored to the LED wall.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Destination
          to="/control"
          icon={SlidersHorizontal}
          title="Command center"
          description="Start spins, advance draws and edit the roster. Nothing here is shown to the audience."
        />
        <Destination
          to="/stage"
          icon={MonitorPlay}
          title="Stage display"
          description="The wheel, the reveal and the backdrop — mirrored live to the LED wall. No controls."
        />
      </div>
    </div>
  </div>
);

export default Launcher;
