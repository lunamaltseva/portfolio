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
      <h1 className="hero-title">
        Hi, I'm <span className="hero-name">Luna</span>
      </h1>
      <p className="hero-subtitle">
        <span className={`flip-word ${isAnimating ? 'slide-out' : 'slide-in'}`}>
          {words[currentWordIndex]}
        </span>
      </p>
    </section>
  );
}
