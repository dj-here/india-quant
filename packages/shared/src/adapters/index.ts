/**
 * Provider abstractions and mock implementations for Identity, Background Checks, and Geo
 */

export interface IdentityVerificationSession {
  sessionId: string;
  url: string;
  expiresAt: Date;
}

export interface IdentityVerificationResult {
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  documentType?: 'PASSPORT' | 'DRIVERS_LICENSE' | 'STATE_ID';
  documentFrontUrl?: string;
  selfieUrl?: string;
  details?: string;
}

export interface IdentityVerifier {
  createSession(userId: string, returnUrl: string): Promise<IdentityVerificationSession>;
  getSessionResult(sessionId: string): Promise<IdentityVerificationResult>;
}

export interface CandidateInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  postalCode: string;
  ssnLast4?: string;
  dateOfBirth?: string;
}

export interface BackgroundCheckResult {
  checkId: string;
  status: 'PENDING' | 'CLEAR' | 'CONSIDER';
  completedAt?: Date;
  flags: string[];
  notes?: string;
}

export interface BackgroundCheckAdapter {
  initiateCheck(sitterId: string, info: CandidateInfo): Promise<BackgroundCheckResult>;
  getCheckResult(checkId: string): Promise<BackgroundCheckResult>;
}

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}

export interface GeoProvider {
  geocode(address: string): Promise<GeocodedAddress>;
  obfuscateCoordinates(
    lat: number,
    lng: number,
    radiusMiles?: number
  ): { approxLat: number; approxLng: number; radiusMiles: number };
  haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number;
}

// -----------------------------------------------------------------------------
// Mock Identity Verifier (Deterministic for dev and tests)
// -----------------------------------------------------------------------------
export class MockIdentityVerifier implements IdentityVerifier {
  async createSession(userId: string, returnUrl: string): Promise<IdentityVerificationSession> {
    return {
      sessionId: `mock_id_sess_${userId}_${Date.now()}`,
      url: `${returnUrl}?session_id=mock_id_sess_${userId}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async getSessionResult(sessionId: string): Promise<IdentityVerificationResult> {
    if (sessionId.includes('fail')) {
      return {
        status: 'FAILED',
        details: 'Government document expired or illegible',
      };
    }
    return {
      status: 'VERIFIED',
      documentType: 'DRIVERS_LICENSE',
      documentFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      details: 'ID verified with facial biometric match confidence 99.4%',
    };
  }
}

// -----------------------------------------------------------------------------
// Mock Background Check Adapter (Deterministic for dev and tests)
// -----------------------------------------------------------------------------
export class MockBackgroundCheckAdapter implements BackgroundCheckAdapter {
  async initiateCheck(sitterId: string, info: CandidateInfo): Promise<BackgroundCheckResult> {
    const isConsider = info.email.includes('consider') || info.lastName.toLowerCase() === 'felon';
    return {
      checkId: `chk_mock_${sitterId}_${Date.now()}`,
      status: isConsider ? 'CONSIDER' : 'CLEAR',
      completedAt: new Date(),
      flags: isConsider ? ['Prior county violation'] : [],
      notes: isConsider ? 'Manual review required by ops team' : 'Nationwide criminal & sex offender registry check clear',
    };
  }

  async getCheckResult(checkId: string): Promise<BackgroundCheckResult> {
    return {
      checkId,
      status: 'CLEAR',
      completedAt: new Date(),
      flags: [],
      notes: 'Nationwide criminal & sex offender registry check clear',
    };
  }
}

// -----------------------------------------------------------------------------
// Deterministic Geo Provider
// -----------------------------------------------------------------------------
export class MockGeoProvider implements GeoProvider {
  private static KNOWN_CITIES: Record<string, { lat: number; lng: number; city: string; state: string; postalCode: string }> = {
    austin: { lat: 30.2672, lng: -97.7431, city: 'Austin', state: 'TX', postalCode: '78701' },
    seattle: { lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA', postalCode: '98101' },
    'san francisco': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', state: 'CA', postalCode: '94102' },
    'new york': { lat: 40.7128, lng: -74.0060, city: 'New York', state: 'NY', postalCode: '10001' },
    denver: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO', postalCode: '80202' },
  };

  async geocode(address: string): Promise<GeocodedAddress> {
    const normalized = address.toLowerCase();
    for (const [key, val] of Object.entries(MockGeoProvider.KNOWN_CITIES)) {
      if (normalized.includes(key)) {
        return {
          latitude: val.lat,
          longitude: val.lng,
          city: val.city,
          state: val.state,
          postalCode: val.postalCode,
          country: 'USA',
          formattedAddress: `${address.trim()}, ${val.city}, ${val.state} ${val.postalCode}`,
        };
      }
    }

    // Default fallback to Austin TX coordinates
    return {
      latitude: 30.2672,
      longitude: -97.7431,
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'USA',
      formattedAddress: address.trim() || 'Austin, TX 78701',
    };
  }

  obfuscateCoordinates(
    lat: number,
    lng: number,
    radiusMiles: number = 0.75
  ): { approxLat: number; approxLng: number; radiusMiles: number } {
    // 1 mile is approximately 1 / 69 degrees latitude
    // Generate deterministic pseudo-random offset based on lat/lng seed
    const seed = Math.abs(Math.sin(lat * 1000 + lng * 1000));
    const angle = seed * 2 * Math.PI;
    const distanceDeg = (radiusMiles / 69) * (0.4 + 0.4 * seed); // Offset within 40-80% of radius

    const approxLat = Number((lat + distanceDeg * Math.cos(angle)).toFixed(5));
    const approxLng = Number((lng + (distanceDeg / Math.cos((lat * Math.PI) / 180)) * Math.sin(angle)).toFixed(5));

    return {
      approxLat,
      approxLng,
      radiusMiles,
    };
  }

  haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }
}
