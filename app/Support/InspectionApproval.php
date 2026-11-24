<?php

namespace App\Support;

use App\Models\Inspection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final class InspectionApproval
{
    /**
     * Every NC / CC case linked to these inspections must be closed (approved) before the
     * inspections can be verified or approved. Throws a validation error naming the open cases.
     *
     * @param  iterable<Inspection>  $inspections
     */
    public static function assertCasesClosed(iterable $inspections): void
    {
        $open = Collection::make($inspections)->map(function (Inspection $inspection) {
            $relationship = match ($inspection->evaluation) {
                'nonconformance' => $inspection->non_conformance(),
                'clientcomplaint' => $inspection->client_complaint(),
                default => null,
            };
            if (!$relationship) return null;

            $reference = $inspection->code ?: "inspection #{$inspection->id}";
            $case = $relationship->first();

            if (!$case) return "{$reference} (no linked case)";

            return $case->status === 'closed' ? null : "{$reference} (case still open)";
        })->filter()->values();

        if ($open->isNotEmpty()) {
            throw ValidationException::withMessages([
                'comment' => 'Cannot verify / approve yet. Approve and close the NC / CC case first: ' . $open->implode(', ') . '.',
            ]);
        }
    }

    /** The caller holds the inspection lock and commits the update together with its transaction. */
    public static function approve(Inspection $inspection, ?int $staffId, Carbon $approvedAt): void
    {
        self::assertCasesClosed([$inspection]);

        $inspection->update([
            'status' => Inspection::STATUS_APPROVED,
            'approved_by' => $staffId,
            'approved_at' => $approvedAt,
        ]);
    }
}
