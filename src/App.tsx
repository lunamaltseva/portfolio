import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import CategoryCard from './components/CategoryCard';
import Fiction from './pages/Fiction';

const categories = [
  {
    title: 'Writing',
    subtitle: 'Academic work, publications, and creative fiction.',
    color: '#166cc3',
    buttons: [
      { label: 'Academic', href: '/writing/academic' },
      { label: 'Fiction', href: '/writing/fiction' },
    ],
  },
  {
    title: 'Design',
    subtitle: 'Commissioned projects and personal creative work.',
    color: '#7820c5',
    buttons: [
      { label: 'Commissioned', href: '/design/commissioned' },
      { label: 'Personal', href: '/design/personal' },
    ],
  },
  {
    title: 'Programming',
    subtitle: 'Software projects and development experience.',
    color: '#3e36a7',
    buttons: [
      { label: 'Projects', href: '/programming' },
      { label: 'GitHub', href: 'https://github.com' },
    ],
  },
];

function HomePage() {
  return (
    <>
      <Hero />
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
    </>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={
          <main className="main-content">
            <HomePage />
          </main>
        } />
        <Route path="/writing/fiction" element={<Fiction />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
