<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['non_conformances', 'client_complaints'];

    public function up(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                // reply from the subcontractor leader; status stays open until a Supervisor/Manager closes it
                $table->text('subcon_response')->nullable();
                $table->timestamp('responded_at')->nullable();
                $table->string('responded_by', 150)->nullable();
                $table->text('return_reason')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropColumn(['subcon_response', 'responded_at', 'responded_by', 'return_reason']);
            });
        }
    }
};
