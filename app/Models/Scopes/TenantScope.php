<?php

namespace App\Models\Scopes;

use App\Enums\UserRole;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * A signed-in company account only ever sees its own company's rows, whatever id it asks for.
 * A request for someone else's record finds nothing (404), exactly as if it did not exist.
 *
 * Not applied to: the system admin (no company), guests, console/queue work, and the token-based
 * contractor portal (its routes name the contractor, not a signed-in company).
 */
class TenantScope implements Scope
{
    /** @param string $via 'company' = table has company_id; 'project' = owned through project_id; 'inspection' = through inspection_id; 'subcon' / 'subcon_company' = owned by one of the company's contractors (company_id / subcon_company_id) */
    public function __construct(private string $via = 'company')
    {
    }

    public static function companyId(): ?int
    {
        $user = Auth::user();
        if (!$user || !$user->company_id || (int) $user->role_id === UserRole::SystemAdmin->value) {
            return null;
        }
        if (request()->routeIs('subcon.public.*')) {
            return null;
        }

        return (int) $user->company_id;
    }

    /**
     * Write guard, run on every save of a tenant-owned model: whatever ids the request sent, the row may only
     * point at this company's own company, project, contractor and inspection. `exists:` validation rules query
     * the table directly and cannot tell, so this is the check that stops a forged id.
     */
    public static function guardWrite(Model $model): void
    {
        $companyId = self::companyId();
        if ($companyId === null) {
            return;
        }

        $owned = [
            'project_id' => ['projects', 'company_id'],
            'subcon_company_id' => ['subcon_company', 'company_id'],
        ];
        $attributes = $model->getAttributes();

        if (array_key_exists('company_id', $attributes) && $model->getTable() !== 'subcon_staff' && $attributes['company_id'] !== null
            && (int) $attributes['company_id'] !== $companyId) {
            abort(403, 'This record belongs to another company.');
        }
        // a contractor's staff row stores the contractor's id in company_id
        if ($model->getTable() === 'subcon_staff' && !empty($attributes['company_id'])
            && !DB::table('subcon_company')->where('id', $attributes['company_id'])->where('company_id', $companyId)->exists()) {
            abort(403, 'This record belongs to another company.');
        }
        foreach ($owned as $column => [$table, $ownerColumn]) {
            if (!empty($attributes[$column]) && !DB::table($table)->where('id', $attributes[$column])->where($ownerColumn, $companyId)->exists()) {
                abort(403, 'This record belongs to another company.');
            }
        }
        if (!empty($attributes['inspection_id']) && !DB::table('inspections')->where('id', $attributes['inspection_id'])->where('company_id', $companyId)->exists()) {
            abort(403, 'This record belongs to another company.');
        }
    }

    public function apply(Builder $builder, Model $model): void
    {
        $companyId = self::companyId();
        if ($companyId === null) {
            return;
        }

        $table = $model->getTable();
        match ($this->via) {
            'project' => $builder->whereIn("{$table}.project_id", DB::table('projects')->where('company_id', $companyId)->select('id')),
            'inspection' => $builder->whereIn("{$table}.inspection_id", DB::table('inspections')->where('company_id', $companyId)->select('id')),
            'subcon' => $builder->whereIn("{$table}.company_id", DB::table('subcon_company')->where('company_id', $companyId)->select('id')),
            'subcon_company' => $builder->whereIn("{$table}.subcon_company_id", DB::table('subcon_company')->where('company_id', $companyId)->select('id')),
            default => $builder->where("{$table}.company_id", $companyId),
        };
    }
}
