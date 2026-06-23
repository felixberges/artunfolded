// ViewRenderer.jsx — punto de ramificación por tipo de vista.
// Reenvía a DeepZoomViewer el estado de anotación seleccionada para
// coordinar pines (imagen) y panel derecho.
import { useT } from './i18n';
import { ui } from './strings';
import ModelViewer from './ModelViewer';
import DeepZoomViewer from './DeepZoomViewer';
import Carousel from './Carousel';
import Gallery from './Gallery';
import Article from './Article';
import Diagram from './Diagram';

export default function ViewRenderer({ view, onNavigateView, activeAnno = null, onSelectAnno }) {
  const t = useT();
  if (!view) return <div className="view-empty">{t(ui.noView)}</div>;

  switch (view.type) {
    case 'model3d':
      return <ModelViewer model={view.model} options={view.options} camera={view.camera} />;
    case 'deepzoom':
      return (
        <DeepZoomViewer
          sources={view.sources}
          activeAnno={activeAnno}
          onSelectAnno={onSelectAnno}
        />
      );
    case 'carousel':
      return <Carousel images={view.images} options={view.options} />;
    case 'gallery':
      return <Gallery images={view.images} />;
    case 'article':
      return <Article body={view.body} bodyPath={view.bodyPath} />;
    case 'diagram':
      return <Diagram view={view} onNavigateView={onNavigateView} />;
    default:
      return <div className="view-empty">{t(ui.noView)}</div>;
  }
}
