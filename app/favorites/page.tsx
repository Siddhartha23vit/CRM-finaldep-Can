"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Eye, Share2, Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import jsPDF from "jspdf"

interface Property {
  id: string
  address: string
  type: string
  price: string
  status: string
  description?: string
  features?: string
  squareFootage?: string
  bedrooms?: string
  bathrooms?: string
  yearBuilt?: string
  mainImage?: string
  images?: string[]
  image360?: string[]
  isFavorite?: boolean
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Property[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  const handleViewDetails = (id: string) => {
    router.push(`/inventory/${id}`)
  }

  const removeFavorite = (id: string) => {
    // Remove from favorites
    const updatedFavorites = favorites.filter(property => property.id !== id)
    setFavorites(updatedFavorites)
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites))

    // Update property in main inventory
    const savedProperties = localStorage.getItem("properties")
    if (savedProperties) {
      const properties = JSON.parse(savedProperties)
      const updatedProperties = properties.map((property: Property) => {
        if (property.id === id) {
          return { ...property, isFavorite: false }
        }
        return property
      })
      localStorage.setItem("properties", JSON.stringify(updatedProperties))
    }
  }

  const generatePDF = async (property: Property) => {
    try {
      setIsGenerating(true)
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text("Property Details", 20, 20)
      
      // Add property information
      doc.setFontSize(12)
      doc.text(`Address: ${property.address}`, 20, 40)
      doc.text(`Type: ${property.type}`, 20, 50)
      doc.text(`Price: ${property.price}`, 20, 60)
      doc.text(`Status: ${property.status}`, 20, 70)
      
      if (property.squareFootage) {
        doc.text(`Square Footage: ${property.squareFootage}`, 20, 80)
      }
      if (property.bedrooms) {
        doc.text(`Bedrooms: ${property.bedrooms}`, 20, 90)
      }
      if (property.bathrooms) {
        doc.text(`Bathrooms: ${property.bathrooms}`, 20, 100)
      }
      if (property.yearBuilt) {
        doc.text(`Year Built: ${property.yearBuilt}`, 20, 110)
      }
      
      // Add description if available
      if (property.description) {
        doc.text("Description:", 20, 130)
        const descriptionLines = doc.splitTextToSize(property.description, 170)
        doc.text(descriptionLines, 20, 140)
      }
      
      // Add features if available
      if (property.features) {
        const yPos = property.description ? 180 : 130
        doc.text("Features:", 20, yPos)
        const featureLines = doc.splitTextToSize(property.features, 170)
        doc.text(featureLines, 20, yPos + 10)
      }

      // Save the PDF
      doc.save(`property-${property.id}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "for sale":
        return "text-green-600"
      case "for rent":
        return "text-blue-600"
      case "sold":
        return "text-red-600"
      case "rented":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Favorite Properties</h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No favorite properties yet.</p>
                <Button
                  variant="link"
                  onClick={() => router.push("/inventory")}
                  className="mt-2"
                >
                  Browse Properties
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Address</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Price</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {favorites.map((property) => (
                      <tr key={property.id} className="border-b">
                        <td className="p-3">{property.address}</td>
                        <td className="p-3">{property.type}</td>
                        <td className="p-3">{property.price}</td>
                        <td className="p-3">
                          <span className={`font-medium ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(property.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => generatePDF(property)}
                              disabled={isGenerating}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFavorite(property.id)}
                            >
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

