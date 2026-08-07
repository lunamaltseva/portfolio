import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Moon from './Moon';
import { useMoon } from '../hooks/useMoon';
import { ICONS_BY_HREF } from './navIcons';

const PAGES = [
  { label: 'About', to: '/about' },
  { label: 'Academic', to: '/writing/academic' },
  { label: 'Design', to: '/design' },
];

const words = ['DATA ANALYST', 'DESIGNER', 'WRITER'];

export default function Hero() {
  const moon = useMoon();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 250);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="stars" aria-hidden="true">
        <div className="stars-layer stars-layer-1" />
        <div className="stars-layer stars-layer-2" />
        <div className="stars-layer stars-layer-3" />
        <div className="stars-layer stars-layer-4" />
        <div className="stars-layer stars-layer-5" />
      </div>

      <div className="hero-stack">
        <div className="moon-stage">
          {moon && <Moon fraction={moon.fraction} rotation={moon.rotation} />}
          <div className="hero-text">
            <h1 className="hero-title">
              Hi, I'm <span className="hero-name">Luna</span>
            </h1>
            <p className="hero-subtitle">
              <span className={`flip-word ${isAnimating ? 'slide-out' : 'slide-in'}`}>
                {words[currentWordIndex]}
              </span>
            </p>
          </div>
        </div>

        <p className="moon-caption">
          {moon
            ? `The moon, as seen from ${moon.city}, on ${moon.dateLabel} at ${moon.timeLabel}`
            : ' '}
        </p>

        <p className="explore-label">EXPLORE</p>

        <nav className="moon-links" aria-label="Explore">
          {PAGES.map((page) => {
            const Icon = ICONS_BY_HREF[page.to];
            return (
              <Link key={page.to} to={page.to} className="moon-link">
                {Icon && <Icon size={16} />}
                <span>{page.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
