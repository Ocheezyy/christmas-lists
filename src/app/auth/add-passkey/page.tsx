'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function AddPasskeyPage() {
  const router = useRouter();
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPasskey = async () => {
    try {
      setLoading(true);
      setError('');

      // Get registration options
      const optionsRes = await fetch('/api/auth/add-passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: deviceName.trim() || null }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        throw new Error(data.error || 'Failed to start passkey registration');
      }

      const options = await optionsRes.json();

      // Start WebAuthn registration
      const regResponse = await startRegistration(options);

      // Verify registration
      const verifyRes = await fetch('/api/auth/add-passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Failed to verify passkey');
      }

      // Success - redirect to profile or show success message
      router.push('/profile/edit?passkey=added');
    } catch (err) {
      console.error('Add passkey error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add passkey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Passkey</CardTitle>
          <CardDescription>
            Register a new passkey for this device to enable secure login from multiple devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="deviceName" className="text-sm font-medium">
              Device Name (Optional)
            </label>
            <Input
              id="deviceName"
              placeholder="e.g., My iPhone, Work Laptop"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Give this passkey a friendly name to help you identify it later.
            </p>
          </div>

          <Button 
            onClick={handleAddPasskey} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Adding Passkey...' : 'Add Passkey'}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
