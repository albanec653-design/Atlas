import { useState } from 'react';
import { ShoppingBag, Search, Filter, MapPin, Euro, Heart, MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';

type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  image_url: string | null;
  seller_id: string;
  seller_name: string;
  seller_avatar: string | null;
  created_at: string;
};

const MOCK_ITEMS: MarketplaceItem[] = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'Brand new, sealed in box. Titanium design with A17 Pro chip.',
    price: 1199,
    category: 'Electronics',
    location: 'Bratislava',
    condition: 'new',
    image_url: null,
    seller_id: '1',
    seller_name: 'John Doe',
    seller_avatar: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'MacBook Pro 14" M3',
    description: 'Like new, used for 3 months. Comes with original charger.',
    price: 1899,
    category: 'Electronics',
    location: 'Kosice',
    condition: 'used',
    image_url: null,
    seller_id: '2',
    seller_name: 'Jane Smith',
    seller_avatar: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Gaming PC RTX 4090',
    description: 'Custom build, i9-14900K, 64GB RAM, RTX 4090. Perfect for gaming.',
    price: 3499,
    category: 'Electronics',
    location: 'Bratislava',
    condition: 'used',
    image_url: null,
    seller_id: '3',
    seller_name: 'Mike Johnson',
    seller_avatar: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Vehicles', 'Sports', 'Books'];
const CONDITIONS = ['All', 'new', 'used', 'refurbished'];

export function MarketplacePage() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [items] = useState<MarketplaceItem[]>(MOCK_ITEMS);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || item.condition === selectedCondition;
    return matchesSearch && matchesCategory && matchesCondition;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="text-primary" />
              Marketplace
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Buy and sell in your local area</p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-[#166FE5] transition-colors">
            + Sell Item
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary dark:text-white"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <Filter size={18} className="text-gray-500 flex-shrink-0" />
        <div className="flex gap-2 flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex gap-2 flex-shrink-0">
          {CONDITIONS.map((cond) => (
            <button
              key={cond}
              onClick={() => setSelectedCondition(cond)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCondition === cond
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No items found. Try different filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Image placeholder */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={48} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 flex-1">
                      {item.title}
                    </h3>
                    <span className="text-lg font-bold text-primary ml-2 flex-shrink-0">
                      €{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full capitalize">
                      {item.condition}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {item.location}
                    </span>
                  </div>

                  {/* Seller */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                      onClick={() => navigate({ name: 'profile', userId: item.seller_id })}
                    >
                      <Avatar profile={{ id: item.seller_id, full_name: item.seller_name, avatar_url: item.seller_avatar }} size="sm" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{item.seller_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                        <Heart size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
