import { useState } from 'react';

interface NavLink {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: NavLink[];
}

const navItems: NavItem[] = [
  { label: 'About Me', href: '/about' },
  {
    label: 'Writing',
    dropdown: [
      { label: 'Academic', href: '/writing/academic' },
      { label: 'Fiction', href: '/writing/fiction' },
    ],
  },
  { label: 'Design', href: '/design' },
  { label: 'Programming', href: '/programming' },
];

function Dropdown({ label, items }: { label: string; items: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="nav-link dropdown-toggle">{label}</span>
      <ul
        className={`dropdown-menu ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2.5'}`}
      >
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} className="dropdown-item">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-title">
          Luna Maltseva
        </a>
        <ul className="navbar-nav">
          {navItems.map((item) =>
            item.dropdown ? (
              <Dropdown key={item.label} label={item.label} items={item.dropdown} />
            ) : (
              <li key={item.href} className="nav-item">
                <a href={item.href} className="nav-link">
                  {item.label}
                </a>
              </li>
            )
          )}
        </ul>
      </div>
    </nav>
  );
}
