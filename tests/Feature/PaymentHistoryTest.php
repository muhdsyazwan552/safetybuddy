<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PaymentHistoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('display_name');
        });
        Schema::create('account_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('reference_code')->nullable();
            $table->unsignedBigInteger('account_type_id')->nullable();
            $table->unsignedBigInteger('training_provider_company_id')->nullable();
        });
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('role_id');
            $table->boolean('email_verification_required')->default(false);
            $table->timestamps();
        });
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('name')->nullable();
        });
        Schema::create('subscriptions_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('module_id');
            $table->unsignedBigInteger('subscription_plan_id')->nullable();
            $table->string('status');
            $table->date('start_date');
            $table->date('end_date');
        });
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->unsignedInteger('total_amount');
            $table->string('payment_type');
            $table->string('payment_status');
            $table->string('cash_flow');
            $table->timestamps();
        });
        Schema::create('subscription_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->string('type');
            $table->unsignedInteger('quantity');
        });
        Schema::create('subscription_plan_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->string('status');
            $table->unsignedInteger('price_yearly');
            $table->timestamps();
        });
        Schema::create('package_activation_codes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('provider_company_id');
            $table->string('batch_ref');
            $table->string('status');
            $table->unsignedInteger('price_yearly');
            $table->timestamps();
        });

        DB::table('roles')->insert(['id' => 2, 'name' => 'admin', 'display_name' => 'Company admin']);
        DB::table('account_types')->insert(['id' => 1, 'name' => 'Normal']);
        DB::table('company')->insert([
            ['id' => 2, 'name' => 'Own company', 'account_type_id' => 1],
            ['id' => 3, 'name' => 'Other company', 'account_type_id' => 1],
        ]);
        DB::table('users')->insert(['id' => 1, 'name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'unused', 'company_id' => 2, 'role_id' => 2]);
    }

    public function test_payment_history_shows_only_own_company_transactions(): void
    {
        DB::table('payments')->insert([
            ['id' => 10, 'company_id' => 2, 'total_amount' => 800, 'payment_type' => 'addon_inspector', 'payment_status' => 'pending', 'cash_flow' => 'cash_in', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 11, 'company_id' => 3, 'total_amount' => 500, 'payment_type' => 'addon_executor', 'payment_status' => 'completed', 'cash_flow' => 'cash_in', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->actingAs(User::findOrFail(1))
            ->get(route('manage.package.payments'))
            ->assertOk();

        preg_match('/data-page="([^"]+)"/', $response->getContent(), $matches);
        $page = json_decode(html_entity_decode($matches[1] ?? '', ENT_QUOTES), true);
        $this->assertSame('Company/PaymentHistory', $page['component']);
        $this->assertSame([10], array_column($page['props']['payments']['data'], 'id'));
    }

    public function test_payment_history_includes_active_yearly_package_details(): void
    {
        DB::table('modules')->insert(['id' => 1, 'code' => 'SB360-WSIS']);
        DB::table('subscriptions_company')->insert([
            'id' => 7,
            'company_id' => 2,
            'module_id' => 1,
            'status' => 'active',
            'start_date' => today()->toDateString(),
            'end_date' => today()->addYear()->subDay()->toDateString(),
        ]);
        DB::table('payments')->insert([
            'company_id' => 2,
            'subscription_id' => 7,
            'total_amount' => 800,
            'payment_type' => 'subscription',
            'payment_status' => 'completed',
            'cash_flow' => 'cash_in',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs(User::findOrFail(1))->get(route('manage.package.payments'))->assertOk();
        preg_match('/data-page="([^"]+)"/', $response->getContent(), $matches);
        $page = json_decode(html_entity_decode($matches[1] ?? '', ENT_QUOTES), true);

        $this->assertSame(800, $page['props']['yearlyPayment']['total']);
        $this->assertSame(today()->addYear()->toDateString(), $page['props']['yearlyPayment']['next_billing_date']);
        $this->assertSame('subscription', $page['props']['payments']['data'][0]['payment_type']);
    }
}
