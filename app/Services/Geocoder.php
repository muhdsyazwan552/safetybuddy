<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Turns a Malaysian address into coordinates with OpenStreetMap Nominatim (free, ~1 request/second). */
class Geocoder
{
    /** @return array{0: float, 1: float}|null [latitude, longitude], or null when the address cannot be found */
    public static function locate(?string $street, ?string $city, ?string $postcode, ?string $state): ?array
    {
        $full = self::join([$street, $postcode, $city, $state]);
        $fallback = self::join([$postcode, $city, $state]);

        foreach (array_unique(array_filter([$full, $fallback])) as $query) {
            $point = self::search($query);
            if ($point) {
                return $point;
            }
        }

        return null;
    }

    private static function join(array $parts): string
    {
        $parts = array_filter(array_map(fn ($part) => trim((string) $part), $parts), fn ($part) => $part !== '' && $part !== '-');

        return implode(', ', $parts);
    }

    private static function search(string $query): ?array
    {
        try {
            $rows = Http::withHeaders(['User-Agent' => 'SafetyBuddy/1.0 (training provider directory)'])
                ->timeout(6)
                ->get('https://nominatim.openstreetmap.org/search', ['q' => $query, 'format' => 'json', 'limit' => 1, 'countrycodes' => 'my'])
                ->throw()->json();
        } catch (\Throwable $exception) {
            Log::warning('Geocoding failed: '.$exception->getMessage());

            return null;
        }

        return isset($rows[0]['lat'], $rows[0]['lon']) ? [(float) $rows[0]['lat'], (float) $rows[0]['lon']] : null;
    }
}
