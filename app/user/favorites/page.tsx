'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CardItem } from '@/components/ui/card-item';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Search,
  Heart,
  Share2,
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface Property {
  ListingKey: string;
  UnparsedAddress: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  ListPrice: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  PropertyType: string;
  StandardStatus: string;
}

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Recently Added' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'price_asc', label: 'Price: Low to High' }
];

export default function UserFavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Check user permissions
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.permissions?.favorites) {
      router.push('/user/dashboard');
      return;
    }

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, [router]);

  useEffect(() => {
    let filtered = [...favorites];

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(property => 
        property.UnparsedAddress.toLowerCase().includes(searchLower) ||
        property.City.toLowerCase().includes(searchLower) ||
        property.StateOrProvince.toLowerCase().includes(searchLower) ||
        property.PostalCode.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_desc':
          return b.ListPrice - a.ListPrice;
        case 'price_asc':
          return a.ListPrice - b.ListPrice;
        case 'date_asc':
          return 0; // Would need timestamp of when added to implement
        case 'date_desc':
        default:
          return 0; // Most recent first is default
      }
    });

    setFilteredFavorites(filtered);
  }, [favorites, debouncedSearch, sortBy]);

  const removeFavorite = (listingKey: string) => {
    const updatedFavorites = favorites.filter(property => property.ListingKey !== listingKey);
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    toast.success('Removed from favorites');
  };

  const handleShare = async (property: Property) => {
    const shareUrl = `${window.location.origin}/user/mls/${property.ListingKey}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.UnparsedAddress,
          text: `Check out this property: ${property.UnparsedAddress}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Favorite Properties</h1>
            <p className="text-muted-foreground">{filteredFavorites.length} saved properties</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your favorites..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Properties Grid */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchQuery ? 'No matching properties found' : 'No favorite properties yet'}
            </div>
            <Button onClick={() => router.push('/user/mls')}>
              Browse MLS Listings
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFavorites.map((property) => (
              <CardItem
                key={property.ListingKey}
                onClick={() => router.push(`/user/mls/${property.ListingKey}`)}
                header={
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold truncate">
                      ${formatValue(property.ListPrice)}
                    </h3>
                    <Badge>
                      {property.StandardStatus || 'Unknown'}
                    </Badge>
                  </div>
                }
                footer={
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/user/mls/${property.ListingKey}`);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(property);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(property.ListingKey);
                      }}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                }
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <div className="font-medium truncate">{property.UnparsedAddress || 'No Address'}</div>
                      <div className="text-muted-foreground truncate">
                        {[property.City, property.StateOrProvince, property.PostalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{formatValue(property.BedroomsTotal)} bd</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span>{formatValue(property.BathroomsTotalInteger)} ba</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      <span>{formatValue(property.LivingArea)} sqft</span>
                    </div>
                  </div>
                </div>
              </CardItem>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 