<?php

namespace Tests\Feature;

use App\Services\CompanySeatLimits;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CompanySeatLimitsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');

        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code');
        });
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('manager_limit');
            $table->unsignedInteger('supervisor_limit');
            $table->unsignedInteger('inspector_limit');
        });
        Schema::create('subscriptions_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('module_id');
            $table->unsignedBigInteger('subscription_plan_id')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status');
        });
        Schema::create('subscription_plan_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subscription_id');
            $table->unsignedBigInteger('plan_id');
            $table->string('status');
        });
        Schema::create('subscription_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('type')->default('inspector');
            $table->unsignedInteger('quantity');
        });
        Schema::create('company_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedInteger('role_id');
        });
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedInteger('role_id');
        });

        DB::table('modules')->insert(['id' => 1, 'code' => 'SB360-WSIS']);
        DB::table('subscription_plans')->insert(['id' => 1, 'name' => 'Starter', 'manager_limit' => 1, 'supervisor_limit' => 1, 'inspector_limit' => 1]);
        DB::table('subscriptions_company')->insert([
            'id' => 1, 'company_id' => 2, 'module_id' => 1, 'subscription_plan_id' => null,
            'start_date' => today()->subDay(), 'end_date' => today()->addYear(), 'status' => 'active',
        ]);
    }

    public function test_unassigned_subscription_blocks_new_seats_until_admin_selects_plan(): void
    {
        $this->assertFalse(CompanySeatLimits::snapshot(2)['configured']);

        try {
            CompanySeatLimits::assertAvailable(2, 3);
            $this->fail('Unassigned subscription should block a new Manager.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('role_id', $exception->errors());
        }

        DB::table('subscriptions_company')->where('id', 1)->update(['subscription_plan_id' => 1]);
        CompanySeatLimits::assertAvailable(2, 3);
        $this->assertTrue(CompanySeatLimits::snapshot(2)['configured']);
    }

    public function test_linked_user_counts_once_and_role_limit_is_enforced(): void
    {
        DB::table('subscriptions_company')->where('id', 1)->update(['subscription_plan_id' => 1]);
        DB::table('users')->insert(['id' => 10, 'company_id' => 2, 'role_id' => 3]);
        DB::table('company_staff')->insert(['id' => 20, 'company_id' => 2, 'user_id' => 10, 'role_id' => 3]);

        $this->assertSame(1, CompanySeatLimits::snapshot(2)['roles'][3]['used']);
        $this->expectException(ValidationException::class);
        CompanySeatLimits::assertAvailable(2, 3);
    }

    public function test_extra_inspectors_raise_only_the_inspector_limit(): void
    {
        DB::table('subscriptions_company')->where('id', 1)->update(['subscription_plan_id' => 1]);
        DB::table('users')->insert(['id' => 10, 'company_id' => 2, 'role_id' => 7]);

        try {
            CompanySeatLimits::assertAvailable(2, 7);
            $this->fail('Included Inspector seat is used up.');
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('RM 800', $exception->errors()['role_id'][0]);
        }

        DB::table('subscription_addons')->insert(['company_id' => 2, 'type' => 'inspector', 'quantity' => 2]);

        $roles = CompanySeatLimits::snapshot(2)['roles'];
        $this->assertSame(1, $roles[7]['included']);
        $this->assertSame(3, $roles[7]['limit']);
        $this->assertSame(1, $roles[3]['limit']); // Manager is not affected
        CompanySeatLimits::assertAvailable(2, 7);
    }

    public function test_direct_admin_created_user_consumes_a_seat(): void
    {
        DB::table('subscriptions_company')->where('id', 1)->update(['subscription_plan_id' => 1]);
        DB::table('users')->insert(['id' => 10, 'company_id' => 2, 'role_id' => 7]);

        $this->assertSame(1, CompanySeatLimits::snapshot(2)['roles'][7]['used']);
        $this->expectException(ValidationException::class);
        CompanySeatLimits::assertAvailable(2, 7);
    }
}
