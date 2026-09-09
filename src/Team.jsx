// Team.jsx — página "Quiénes somos": perfil de Magoga Piñas y Félix Bergés.
// Usa los tokens y familias tipográficas de unfolded-ui.css (ver team.css).
import { useT } from './i18n';
import { ui } from './strings';
import './team.css';

export default function Team() {
  const t = useT();
  return (
    <main className="team">
      <header className="team-header">
        <p className="team-eyebrow">{t(ui.aboutNav)}</p>
        <p className="team-intro">{t(ui.aboutIntro)}</p>
      </header>

      <div className="team-grid">
        <article className="team-card">
          <img className="team-photo" src="/team/magoga.jpg" alt="Magoga Piñas" loading="lazy" />
          <h2 className="team-name">Magoga Piñas</h2>
          <p className="team-role">{t(ui.magogaRole)}</p>
          <p className="team-bio">{t(ui.magogaBio)}</p>
        </article>

        <article className="team-card">
          <img className="team-photo" src="/team/felix.jpg" alt="Félix Bergés" loading="lazy" />
          <h2 className="team-name">Félix Bergés</h2>
          <p className="team-role">{t(ui.felixRole)}</p>
          <p className="team-bio">{t(ui.felixBio)}</p>
        </article>
      </div>
    </main>
  );
}
