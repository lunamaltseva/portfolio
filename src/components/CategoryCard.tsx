interface CardButton {
  label: string;
  href: string;
}

interface CategoryCardProps {
  title: string;
  subtitle: string;
  color: string;
  buttons: CardButton[];
}

export default function CategoryCard({ title, subtitle, color, buttons }: CategoryCardProps) {
  return (
    <div className="category-card">
      <div className="card-header" style={{ backgroundColor: color }}>
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <p className="card-subtitle">{subtitle}</p>
        <div className="card-buttons">
          {buttons.map((button) => (
            <a key={button.href} href={button.href} className="card-button">
              {button.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
