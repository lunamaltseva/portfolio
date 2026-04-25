import { useState, useEffect } from 'react';

export default function Hero() {
  const words = ['PROGRAMMER', 'DESIGNER', 'WRITER'];
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
      <div className="moon" aria-hidden="true">
        <div className="moon-half" />
        <div className="moon-ellipse" />
      </div>
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
    </section>
  );
}
