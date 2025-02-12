'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Home,
  Info,
  Mail,
  Phone,
  Share2,
  Ruler,
  Car,
  Trees,
  Building2,
  CalendarDays,
  Heart,
  HeartOff
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface PropertyField {
  key: string;
  icon: React.ReactNode;
  label: string;
  suffix?: string;
}

interface PropertyGroups {
  [key: string]: PropertyField[];
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { canView } = usePermissions('mls');

  useEffect(() => {
    if (!canView) {
      router.push('/dashboard');
      return;
    }
    fetchPropertyDetails();
    checkIfFavorite();
  }, [params.id, canView]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/mls/${params.id}`);

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setProperty(response.data);
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some((fav: any) => fav.ListingKey === params.id));
  };

  const toggleFavorite = async () => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = favorites.filter((fav: any) => fav.ListingKey !== params.id);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const propertyToSave = {
          ListingKey: property.ListingKey,
          UnparsedAddress: property.UnparsedAddress,
          City: property.City,
          StateOrProvince: property.StateOrProvince,
          PostalCode: property.PostalCode,
          ListPrice: property.ListPrice,
          BedroomsTotal: property.BedroomsTotal,
          BathroomsTotalInteger: property.BathroomsTotalInteger,
          LivingArea: property.LivingArea,
          PropertyType: property.PropertyType,
          StandardStatus: property.StandardStatus
        };
        
        const updatedFavorites = [...favorites, propertyToSave];
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setIsFavorite(true);
        toast.success('Added to favorites');
      }

      // Sync with backend (in a real app)
      await axios.post('/api/favorites', {
        propertyId: params.id,
        isFavorite: !isFavorite
      });

    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites');
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  if (!canView) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading property details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-destructive">{error || 'Property not found'}</div>
            <Button onClick={() => router.push('/mls')}>Back to Listings</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/mls')}
          className="mb-4"
        >
          ← Back to Listings
        </Button>

        {/* Property Header */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-bold">
                    ${formatValue(property.ListPrice)}
                  </h2>
                  <Badge variant={property.StandardStatus === 'Active' ? 'default' : 'secondary'}>
                    {property.StandardStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{property.UnparsedAddress}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {[property.City, property.StateOrProvince, property.PostalCode]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={isFavorite ? "default" : "outline"}
                  onClick={toggleFavorite}
                >
                  {isFavorite ? (
                    <>
                      <Heart className="h-4 w-4 mr-2 fill-current" />
                      Favorited
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Favorite
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => window.location.href = `mailto:?subject=Property at ${property.UnparsedAddress}&body=Check out this property: ${window.location.href}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Beds</div>
                  <div className="font-medium">{formatValue(property.BedroomsTotal)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Baths</div>
                  <div className="font-medium">{formatValue(property.BathroomsTotalInteger)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Living Area</div>
                  <div className="font-medium">{formatValue(property.LivingArea)} sqft</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">{formatValue(property.PropertyType)}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Property Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Property Details</h3>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(property)
                .filter(([key, value]) => 
                  !['ListingKey', 'StandardStatus', 'ListPrice', 'UnparsedAddress', 
                    'City', 'StateOrProvince', 'PostalCode', 'BedroomsTotal', 
                    'BathroomsTotalInteger', 'LivingArea', 'PropertyType', 
                    'ModificationTimestamp'
                  ].includes(key) && 
                  value !== null && 
                  value !== undefined
                )
                .map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="font-medium">{formatValue(value)}</div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
} 