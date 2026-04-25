import { useIsMobile } from '../hooks/useIsMobile';

export default function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer className="footer">
      <div className="footer-container">
        {!isMobile && <span className="footer-name">But such a form as Grecian goldsmiths make!</span>}
        <a href="mailto:luna@lunamaltseva.dev" className="footer-email">
          Email Me
        </a>
      </div>
    </footer>
  );
}