<?php

namespace App\Enums;

/**
 * The roles a logged-in user can have (users.role_id / roles.id).
 *
 * Use the names instead of bare numbers: UserRole::Manager->value, UserRole::reviewerIds(),
 * or the slugs in route middleware: role:manager,supervisor.
 */
enum UserRole: int
{
    case SystemAdmin = 1;
    case CompanyAdmin = 2;
    case Manager = 3;
    case Supervisor = 4;
    case Inspector = 7;

    public function slug(): string
    {
        return match ($this) {
            self::SystemAdmin => 'system_admin',
            self::CompanyAdmin => 'company_admin',
            self::Manager => 'manager',
            self::Supervisor => 'supervisor',
            self::Inspector => 'inspector',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::SystemAdmin => 'System Admin',
            self::CompanyAdmin => 'Company Admin',
            self::Manager => 'Manager',
            self::Supervisor => 'Supervisor',
            self::Inspector => 'Inspector',
        };
    }

    /** Accepts a slug ("manager") or a number ("3"); returns the role id or null. */
    public static function resolveId(string $value): ?int
    {
        $value = trim($value);
        if (ctype_digit($value)) {
            return self::tryFrom((int) $value)?->value;
        }
        foreach (self::cases() as $case) {
            if ($case->slug() === strtolower($value)) {
                return $case->value;
            }
        }

        return null;
    }

    public static function labelFor(mixed $roleId): ?string
    {
        return self::tryFrom((int) $roleId)?->label();
    }

    /** Manager + Supervisor: the review portal. */
    public static function reviewerIds(): array
    {
        return [self::Manager->value, self::Supervisor->value];
    }

    /** Field inspectors. */
    public static function inspectorIds(): array
    {
        return [self::Inspector->value];
    }

    /** Company employees who can have a staff record (not the company admin). */
    public static function staffIds(): array
    {
        return [self::Manager->value, self::Supervisor->value, self::Inspector->value];
    }

    /** Everyone who works inside a company's Safety workspace. */
    public static function companyIds(): array
    {
        return [self::CompanyAdmin->value, ...self::staffIds()];
    }
}
