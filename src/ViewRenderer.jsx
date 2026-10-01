// ViewRenderer.jsx — punto de ramificación por tipo de vista.
// Reenvía a DeepZoomViewer el estado de anotación seleccionada para
// coordinar pines (imagen) y panel derecho.
import { useT } from './i18n';
import { ui } from './strings';
import ModelViewer from './ModelViewer';
import ObjectViewer from './ObjectViewer';
import PathViewer from './PathViewer';
import DeepZoomViewer from './DeepZoomViewer';
import Carousel from './Carousel';
import Gallery from './Gallery';
import Article from './Article';
import Diagram from './Diagram';
import Notes from './Notes';

export default function ViewRenderer({ view, onNavigateView, activeAnno = null, onSelectAnno }) {
  const t = useT();
  if (!view) return <div className="view-empty">{t(ui.noView)}</div>;

  switch (view.type) {
    case 'model3d':
      return <ModelViewer model={view.model} options={view.options} camera={view.camera} color={view.color} />;
    case 'object3d':
      return <ObjectViewer model={view.model} camera={view.camera} light={view.light} color={view.color} options={view.options} />;
    case 'path3d':
      return <PathViewer model={view.model} points={view.points} path={view.path} color={view.color} />;
    case 'deepzoom':
      return (
        <DeepZoomViewer
          sources={view.sources}
          activeAnno={activeAnno}
          onSelectAnno={onSelectAnno}
          options={view.options ?? {}}
        />
      );
    case 'carousel':
      return <Carousel images={view.images} options={view.options} />;
    case 'gallery':
      return <Gallery images={view.images} />;
    case 'notes':
      return <Notes body={view.body} />;
    case 'article':
      return <Article body={view.body} bodyPath={view.bodyPath} />;
    case 'diagram':
      return <Diagram view={view} onNavigateView={onNavigateView} />;
    default:
      return <div className="view-empty">{t(ui.noView)}</div>;
  }
}
