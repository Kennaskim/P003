import { notFound } from 'next/navigation';
import { propertiesApi } from '@/lib/api/properties';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
    try {
        // Fetch property data server-side
        const response = await propertiesApi.getById(params.id);
        const property = response.data;

        if (!property) {
            // Trigger the 404 page if no data is returned
            notFound();
        }

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{property.name}</h2>
                    <p className="text-muted-foreground">{property.address}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Property Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>Type:</strong> {property.type}</p>
                        <p><strong>Units:</strong> {property.units?.length || 0}</p>
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error) {
        notFound();
    }
}