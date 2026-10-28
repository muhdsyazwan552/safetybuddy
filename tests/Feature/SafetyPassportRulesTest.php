<?php

namespace Tests\Feature;

use App\Support\SafetyInductionDefaults;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SafetyPassportRulesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');

        Schema::create('toolbox_topic', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('name');
        });
        Schema::create('safety_induction_topics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedTinyInteger('default_key')->nullable();
            $table->string('title');
            $table->unsignedInteger('sort_order');
            $table->boolean('is_active');
            $table->boolean('is_customised');
            $table->timestamps();
        });
        Schema::create('safety_induction_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedInteger('sort_order');
            $table->string('type');
            $table->text('content');
            $table->timestamps();
        });
        Schema::create('subcon_induction_acks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subcon_company_id');
            $table->unsignedBigInteger('topic_id');
            $table->timestamps();
        });
        Schema::create('subcon_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('status');
            $table->timestamps();
        });
    }

    public function test_new_defaults_contain_the_fourteen_rules(): void
    {
        $topics = SafetyInductionDefaults::topics();

        $this->assertCount(14, $topics);
        $this->assertSame('Safety Passport Rules Briefing', $topics[1]['title']);
        $this->assertSame('Final Message', $topics[14]['title']);
    }

    public function test_migration_hides_old_declarations_and_preserves_acknowledgements(): void
    {
        DB::table('toolbox_topic')->insert(['code' => 'C02-12', 'name' => 'Safety Induction']);
        DB::table('subcon_company')->insert(['id' => 10, 'company_id' => 1, 'status' => 'active']);

        for ($key = 1; $key <= 12; $key++) {
            DB::table('safety_induction_topics')->insert([
                'id' => $key, 'company_id' => 1, 'default_key' => $key,
                'title' => "Declaration {$key}", 'sort_order' => $key,
                'is_active' => true, 'is_customised' => false,
            ]);
        }
        DB::table('subcon_induction_acks')->insert(['subcon_company_id' => 10, 'topic_id' => 1]);

        $migration = require base_path('database/migrations/2026_10_28_000001_replace_declarations_with_safety_passport_rules.php');
        $migration->up();

        $this->assertSame(12, DB::table('safety_induction_topics')->where('company_id', 1)->where('is_active', false)->count());
        $this->assertSame(14, DB::table('safety_induction_topics')->where('company_id', 1)->where('is_active', true)->count());
        $this->assertSame(101, DB::table('safety_induction_topics')->where('id', 1)->value('default_key'));
        $this->assertDatabaseHas('subcon_induction_acks', ['subcon_company_id' => 10, 'topic_id' => 1]);
        $this->assertDatabaseHas('subcon_company', ['id' => 10, 'status' => 'inactive']);
        $this->assertDatabaseHas('toolbox_topic', ['code' => 'C02-12', 'name' => 'Safety Passport']);
    }

    public function test_migration_does_not_duplicate_new_defaults_on_fresh_install(): void
    {
        SafetyInductionDefaults::seedFor(1);

        $migration = require base_path('database/migrations/2026_10_28_000001_replace_declarations_with_safety_passport_rules.php');
        $migration->up();

        $this->assertSame(14, DB::table('safety_induction_topics')->where('company_id', 1)->count());
        $this->assertSame(0, DB::table('safety_induction_topics')->where('is_active', false)->count());
    }
}
