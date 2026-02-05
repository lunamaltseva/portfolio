import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import CategoryCard from './components/CategoryCard';
import Fiction from './pages/Fiction';
import Academic from './pages/Academic';
import About from './pages/About';

const categories = [
  {
    title: 'Writing',
    subtitle: 'Essays, research papers, articles, and Thezeraine.',
    color: '#166cc3',
    buttons: [
      { label: 'Academic', href: '/writing/academic' },
      { label: 'Fiction', href: '/writing/fiction' },
    ],
  },
  {
    title: 'Design',
    subtitle: 'Commissioned and personal design work.',
    color: '#7820c5',
    buttons: [
      { label: 'Commissioned', href: '/design/commissioned' },
      { label: 'Personal', href: '/design/personal' },
    ],
  },
  {
    title: 'Programming',
    subtitle: 'Software solutions and educational projects.',
    color: '#3e36a7',
    buttons: [
      { label: 'Projects', href: '/programming' },
      { label: 'GitHub', href: 'https://github.com' },
    ],
  },
]; //

function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <Routes>
        <Route path="/" element={
          <main className="main-content">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, background: '#000000' }} />
            <Hero />
            <div className="cards-wrapper">
              <div className="cards-container">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.title}
                    title={category.title}
                    subtitle={category.subtitle}
                    color={category.color}
                    buttons={category.buttons}
                  />
                ))}
              </div>
            </div>
          </main>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/writing/fiction" element={<Fiction />} />
        <Route path="/writing/academic" element={<Academic />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
