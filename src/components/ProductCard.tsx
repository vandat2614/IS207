import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';

interface ProductCardProps {
  id: number;
  image: string;
  title: string;
  description: string;
  price: number;
  sale_percentage?: number;
  is_on_sale?: boolean;
  onAddToCart?: (id: number) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  image,
  title,
  description,
  price,
  sale_percentage,
  is_on_sale,
  onAddToCart,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleSeeMore = () => {
    navigate(`/product/${id}`);
  };

  // Calculate sale price
  const salePrice = (sale_percentage && sale_percentage > 0)
    ? price * (1 - sale_percentage / 100)
    : price;

  // Check if product has an active sale
  // Only show sale if sale_percentage is a positive number greater than 0
  const hasSale = Boolean(sale_percentage && sale_percentage > 0);

  // Debug: Log sale information
  console.log(`Product ${id}: sale_percentage=${sale_percentage}, hasSale=${hasSale}`);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-[420px] ${className} relative`}>
      <Link to={`/product/${id}`}>
        <img
          alt={title}
          className="w-full h-64 object-cover"
          src={image}
        />
      </Link>

      {/* Sale Badge - Only show if hasSale is true */}
      {hasSale && sale_percentage && sale_percentage > 0 && (
        <div className="absolute top-3 right-3 z-10">
          {/* Ribbon Shape */}
          <div className="relative">
            {/* Main ribbon body */}
            <div className="bg-gradient-to-r from-orange-400 to-red-600 text-white text-xs font-bold px-3 py-1 shadow-lg transform rotate-12">
              Sale {sale_percentage}%
            </div>
            {/* Ribbon tail */}
            <div className="absolute -bottom-1 right-0 w-0 h-0 border-l-4 border-l-transparent border-t-4 border-t-red-600"></div>
            {/* Ribbon fold */}
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-700 transform rotate-12 rounded-sm"></div>
          </div>
        </div>
      )}
      <div className="p-6 flex flex-col justify-between h-32">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {hasSale ? (
              <>
                <span className="text-sm text-gray-500 line-through">
                  ${price.toFixed(2)}
                </span>
                <span className="font-bold text-xl text-blue-600">
                  ${salePrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-xl text-blue-500">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
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
