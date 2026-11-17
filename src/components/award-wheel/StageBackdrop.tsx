type BackdropVariant = "stage" | "reveal" | "closing";

const SOURCES: Record<BackdropVariant, string> = {
  stage: "/brand/stage.jpg",
  reveal: "/brand/reveal.jpg",
  closing: "/brand/closing.jpg",
};

/** Literal modifier classes so Tailwind emits each backdrop variant. */
const VARIANTS: Record<BackdropVariant, string> = {
  stage: "stage-backdrop--stage",
  reveal: "stage-backdrop--reveal",
  closing: "stage-backdrop--closing",
};

/**
 * Conference artwork supplied by production, exported at the wall's native
 * 2304 × 1280 and covered edge to edge behind the wheel.
 */
export const StageBackdrop = ({ variant }: { variant: BackdropVariant }) => (
  <div className={`stage-backdrop ${VARIANTS[variant]}`} aria-hidden="true">
    <img
      className="stage-backdrop__image"
      src={SOURCES[variant]}
      alt=""
      draggable={false}
    />
    <div className="stage-backdrop__halo" />
    <div className="stage-backdrop__scrim" />
    <div className="stage-backdrop__grain" />
  </div>
);
