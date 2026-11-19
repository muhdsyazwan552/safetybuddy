<?php

namespace App\Support;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\UnableToWriteFile;
use Throwable;

final class UploadedAssets
{
    private const PREFIX = 'uploads/';

    public static function store(UploadedFile $file, string $category): string
    {
        $mime = $file->getMimeType() ?? 'application/octet-stream';
        $type = match (true) {
            str_starts_with($mime, 'image/') => 'images',
            $mime === 'application/pdf' => 'pdf',
            default => 'files',
        };
        $directory = self::PREFIX.$category.'/'.$type.'/'.now('Asia/Kuala_Lumpur')->format('Y/m');
        $extension = $file->extension();
        $filename = 'SB-'.Str::ulid().($extension ? '.'.$extension : '');

        $path = Storage::disk('s3')->putFileAs($directory, $file, $filename, ['ContentType' => $mime]);
        if ($path === false) {
            throw UnableToWriteFile::atLocation($directory.'/'.$filename);
        }

        return $path;
    }

    public static function disk(string $path, string $legacy = 'public'): FilesystemAdapter
    {
        return Storage::disk(str_starts_with($path, self::PREFIX) ? 's3' : $legacy);
    }

    public static function url(?string $path): ?string
    {
        if (!$path || str_starts_with($path, '/') || Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return str_starts_with($path, self::PREFIX)
            ? self::disk($path)->temporaryUrl($path, now()->addHours(2))
            : Storage::disk('public')->url($path);
    }

    public static function photoUrls(?string $value): array
    {
        $paths = json_decode((string) $value, true);
        $paths = is_array($paths) ? $paths : [$value];

        return array_values(array_map(self::url(...), array_filter($paths, fn ($path) => is_string($path) && $path !== '')));
    }

    public static function delete(string $path): bool
    {
        return self::disk($path)->delete($path);
    }

    public static function cleanupOnFailure(callable $operation): mixed
    {
        $paths = [];
        $upload = function (UploadedFile $file, string $category) use (&$paths): string {
            $path = self::store($file, $category);
            $paths[] = $path;

            return $path;
        };

        try {
            return $operation($upload);
        } catch (Throwable $exception) {
            foreach ($paths as $path) {
                try {
                    self::delete($path);
                } catch (Throwable $cleanupError) {
                    report($cleanupError);
                }
            }

            throw $exception;
        }
    }
}
