import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';

interface ProductCardProps {
  id: number;
  image: string;
  title: string;
  description: string;
  price: number;
  onAddToCart?: (id: number) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  title,
  description,
  price,
  onAddToCart,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleSeeMore = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-[420px] ${className}`}>
      <Link to={`/product/${id}`}>
        <img
          alt={title}
          className="w-full h-64 object-cover"
          src={image}
        />
      </Link>
      <div className="p-6 flex flex-col justify-between h-32">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="font-bold text-xl text-blue-500">
            ${price.toFixed(2)}
          </span>
          <Button
            size="sm"
            onClick={handleSeeMore}
            className="text-sm"
          >
            See More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
