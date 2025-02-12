'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  HeartOff,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface PropertyField {
  key: string;
  icon: React.ReactNode;
  label: string;
  suffix?: string;
}

export default function UserPropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!user.permissions?.mls) {
      router.push('/user/dashboard');
      return;
    }

    fetchPropertyDetails();
    checkIfFavorite();
  }, [params.id]);

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

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      const updatedFavorites = favorites.filter((fav: any) => fav.ListingKey !== params.id);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorite(false);
      toast.success('Removed from favorites');
    } else {
      const updatedFavorites = [...favorites, property];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorite(true);
      toast.success('Added to favorites');
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  const propertyFields: PropertyField[] = [
    { key: 'BedroomsTotal', icon: <Bed className="h-4 w-4" />, label: 'Bedrooms' },
    { key: 'BathroomsTotalInteger', icon: <Bath className="h-4 w-4" />, label: 'Bathrooms' },
    { key: 'LivingArea', icon: <Square className="h-4 w-4" />, label: 'Living Area', suffix: 'sqft' },
    { key: 'PropertyType', icon: <Home className="h-4 w-4" />, label: 'Property Type' },
    { key: 'YearBuilt', icon: <Building2 className="h-4 w-4" />, label: 'Year Built' },
    { key: 'LotSize', icon: <Ruler className="h-4 w-4" />, label: 'Lot Size', suffix: 'acres' },
    { key: 'ParkingSpaces', icon: <Car className="h-4 w-4" />, label: 'Parking Spaces' },
    { key: 'LotFeatures', icon: <Trees className="h-4 w-4" />, label: 'Lot Features' },
    { key: 'ListDate', icon: <CalendarDays className="h-4 w-4" />, label: 'Listed Date' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-pulse">Loading property details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <div className="text-destructive">{error}</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <div>Property not found</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Listings
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFavorite}
          >
            {isFavorite ? (
              <HeartOff className="h-4 w-4 text-destructive" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.share({
                title: property.UnparsedAddress,
                text: `Check out this property: ${property.UnparsedAddress}`,
                url: window.location.href
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard');
              });
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-semibold mb-2">
                    ${formatValue(property.ListPrice)}
                  </h1>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-1" />
                    <div>
                      <div className="break-words">{property.UnparsedAddress}</div>
                      <div>
                        {[property.City, property.StateOrProvince, property.PostalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className="self-start">{property.StandardStatus || 'Unknown'}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {propertyFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    {field.icon}
                    <div className="text-sm">
                      <div className="text-muted-foreground">{field.label}</div>
                      <div>
                        {formatValue(property[field.key])}
                        {field.suffix && ` ${field.suffix}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Description */}
          {property.PublicRemarks && (
            <Card>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <p className="whitespace-pre-line">{property.PublicRemarks}</p>
              </div>
            </Card>
          )}

          {/* Features */}
          {(property.InteriorFeatures || property.ExteriorFeatures) && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {property.InteriorFeatures && typeof property.InteriorFeatures === 'string' && (
                    <div>
                      <h3 className="font-medium mb-2">Interior Features</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {property.InteriorFeatures.split(',').map((feature: string) => (
                          <li key={feature.trim()} className="break-words">
                            {feature.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {property.ExteriorFeatures && typeof property.ExteriorFeatures === 'string' && (
                    <div>
                      <h3 className="font-medium mb-2">Exterior Features</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {property.ExteriorFeatures.split(',').map((feature: string) => (
                          <li key={feature.trim()} className="break-words">
                            {feature.trim()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Contact and Additional Info */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                {property.ListAgentFullName && (
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="text-muted-foreground">Listing Agent</div>
                      <div className="break-words">{property.ListAgentFullName}</div>
                    </div>
                  </div>
                )}
                {property.ListAgentEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="text-muted-foreground">Email</div>
                      <a
                        href={`mailto:${property.ListAgentEmail}`}
                        className="text-primary hover:underline break-words"
                      >
                        {property.ListAgentEmail}
                      </a>
                    </div>
                  </div>
                )}
                {property.ListAgentPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="text-muted-foreground">Phone</div>
                      <a
                        href={`tel:${property.ListAgentPhone}`}
                        className="text-primary hover:underline"
                      >
                        {property.ListAgentPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Additional Details */}
          <Card>
            <div className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">MLS #</div>
                  <div className="break-words">{property.ListingKey}</div>
                  {property.TaxAssessedValue && (
                    <>
                      <div className="text-muted-foreground">Tax Assessment</div>
                      <div>${formatValue(property.TaxAssessedValue)}</div>
                    </>
                  )}
                  {property.TaxAnnualAmount && (
                    <>
                      <div className="text-muted-foreground">Annual Tax</div>
                      <div>${formatValue(property.TaxAnnualAmount)}</div>
                    </>
                  )}
                  {property.AssociationFee && (
                    <>
                      <div className="text-muted-foreground">HOA Fee</div>
                      <div>${formatValue(property.AssociationFee)}/month</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 