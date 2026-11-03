<?php

namespace Tests\Feature;

use App\Support\SeriesCodes;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SeriesCodesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');

        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->nullable()->unique();
            $table->string('name');
            $table->timestamps();
        });
        Schema::create('company_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->timestamps();
        });
        Schema::create('subcon_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->string('public_token')->nullable();
            $table->timestamps();
        });
        Schema::create('subcon_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->string('status')->nullable();
            $table->string('sp_briefing_status')->nullable();
            $table->timestamps();
        });
    }

    private function migrateCodes(): void
    {
        $migration = require base_path('database/migrations/2026_10_28_000002_add_series_codes.php');
        $migration->up();
    }

    public function test_existing_records_receive_hierarchical_codes(): void
    {
        DB::table('company')->insert(['id' => 2, 'name' => 'DASAR JATI SDN BHD']);
        DB::table('company_staff')->insert(['id' => 4, 'company_id' => 2, 'name' => 'Manager']);
        DB::table('subcon_company')->insert(['id' => 7, 'company_id' => 2, 'name' => 'XYZ ELECTRICAL']);
        DB::table('subcon_staff')->insert(['id' => 9, 'company_id' => 7, 'name' => 'Worker']);

        $this->migrateCodes();

        $this->assertDatabaseHas('company', ['id' => 2, 'code' => 'DJ']);
        $this->assertDatabaseHas('company_staff', ['id' => 4, 'code' => 'DJ/EMP/001']);
        $this->assertDatabaseHas('subcon_company', ['id' => 7, 'code' => 'DJ/XYZ/001']);
        $this->assertDatabaseHas('subcon_staff', ['id' => 9, 'code' => 'DJ/XYZ/001/STF/001']);
    }

    public function test_new_codes_do_not_change_or_get_reused_after_deletion(): void
    {
        $this->migrateCodes();

        $owner = SeriesCodes::createCompany(['name' => 'Dasar Jati Sdn Bhd']);
        $this->assertSame('DJ-000001', $owner->code);
        // same acronym, different company: the number keeps the code unique
        $this->assertSame('DJ-000002', SeriesCodes::createCompany(['name' => 'Dunia Jutawan Sdn Bhd'])->code);
        $this->assertNotSame($owner->uuid, SeriesCodes::createCompany(['name' => 'Dasar Jati Sdn Bhd'])->uuid);
        $this->assertTrue(\Illuminate\Support\Str::isUuid($owner->uuid));

        $firstEmployee = SeriesCodes::createEmployee($owner->id, ['name' => 'Manager']);
        $this->assertSame('DJ-000001/EMP/001', $firstEmployee->code);
        $firstEmployee->delete();
        $this->assertSame('DJ-000001/EMP/002', SeriesCodes::createEmployee($owner->id, ['name' => 'Inspector'])->code);

        $firstSubcon = SeriesCodes::createSubconCompany($owner->id, ['name' => 'XYZ Electrical']);
        $this->assertSame('DJ-000001/XYZ/001', $firstSubcon->code);
        $this->assertSame('DJ-000001/XYZ/002', SeriesCodes::createSubconCompany($owner->id, ['name' => 'XYZ Engineering'])->code);

        $firstStaff = SeriesCodes::createSubconStaff($firstSubcon->id, ['name' => 'Worker']);
        $this->assertSame('DJ-000001/XYZ/001/STF/001', $firstStaff->code);
        $firstStaff->delete();
        $owner->update(['name' => 'Dasar Jati Group']);
        $firstSubcon->update(['name' => 'XYZ Group']);
        $this->assertSame('DJ-000001/XYZ/001/STF/002', SeriesCodes::createSubconStaff($firstSubcon->id, ['name' => 'Worker 2'])->code);
    }
}
