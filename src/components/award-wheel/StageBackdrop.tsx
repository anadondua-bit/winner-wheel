const DEFAULT_IMAGE = "/brand/reveal.jpg";

/**
 * Conference artwork behind the wheel. One consistent look for the whole
 * show — idle, spinning, reveal and complete all read as the same stage,
 * so the room's lighting never visibly resets between draws.
 */
export const StageBackdrop = ({ imageUrl }: { imageUrl?: string }) => (
  <div className="stage-backdrop" aria-hidden="true">
    <img
      className="stage-backdrop__image"
      src={imageUrl || DEFAULT_IMAGE}
      alt=""
      draggable={false}
    />
    <div className="stage-backdrop__beams">
      <span className="stage-beam stage-beam--a" />
      <span className="stage-beam stage-beam--b" />
    </div>
    <div className="stage-backdrop__bokeh">
      <span className="bokeh-dot bokeh-dot--1" />
      <span className="bokeh-dot bokeh-dot--2" />
      <span className="bokeh-dot bokeh-dot--3" />
      <span className="bokeh-dot bokeh-dot--4" />
      <span className="bokeh-dot bokeh-dot--5" />
    </div>
    <div className="stage-backdrop__halo" />
    <div className="stage-backdrop__scrim" />
    <div className="stage-backdrop__grain" />
  </div>
);
