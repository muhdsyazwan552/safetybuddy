<?php

namespace Tests\Feature;

use App\Models\User;
use App\Http\Middleware\EnsureCompanyPurchased;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SystemAdminCompaniesTest extends TestCase
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
            $table->unsignedSmallInteger('sort_order')->default(0);
        });
        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('reference_code')->nullable();
            $table->string('registration_no')->nullable();
            $table->string('email')->nullable();
            $table->string('contact')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postcode')->nullable();
            $table->string('state')->nullable();
            $table->string('status')->nullable();
            $table->string('logo_path')->nullable();
            $table->unsignedBigInteger('account_type_id')->nullable();
            $table->unsignedBigInteger('training_provider_company_id')->nullable();
            $table->dateTime('provider_linked_at')->nullable();
            $table->timestamps();
        });
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->string('phone')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('role_id');
            $table->dateTime('email_verified_at')->nullable();
            $table->timestamps();
        });
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->string('description')->nullable();
            $table->decimal('price')->nullable();
            $table->string('is_active')->default('Y');
        });
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable();
            $table->string('audience')->default('normal');
            $table->string('name');
            $table->decimal('price_yearly')->nullable();
            $table->decimal('provider_price_yearly')->nullable();
            $table->unsignedInteger('manager_limit')->default(1);
            $table->unsignedInteger('supervisor_limit')->default(1);
            $table->unsignedInteger('inspector_limit')->default(1);
            $table->unsignedInteger('contractor_limit')->default(1);
            $table->unsignedInteger('daily_pdf_limit')->nullable();
            $table->unsignedInteger('monthly_pdf_limit')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();
        });
        Schema::create('subscriptions_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('module_id');
            $table->unsignedBigInteger('subscription_plan_id')->nullable();
            $table->string('code')->nullable();
            $table->unsignedInteger('serial_no')->nullable();
            $table->string('status');
            $table->string('type')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
        });
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->decimal('total_amount')->nullable();
            $table->string('payment_type')->nullable();
            $table->string('payment_status')->nullable();
            $table->timestamps();
        });
        Schema::create('subscription_plan_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->string('status');
            $table->decimal('price_yearly')->default(0);
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->timestamps();
        });
        Schema::create('training_provider_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->string('registration_no')->nullable();
            $table->string('registration_document')->nullable();
            $table->string('status');
            $table->string('rejection_reason')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('training_provider_certificates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->string('issuing_body');
            $table->date('expiry_date');
            $table->string('file_path');
            $table->string('file_name');
            $table->timestamps();
        });
        Schema::create('package_activation_codes', function (Blueprint $table) {
            $table->id();
            $table->string('batch_ref');
            $table->string('code')->nullable();
            $table->unsignedBigInteger('provider_company_id');
            $table->unsignedBigInteger('plan_id');
            $table->decimal('price_yearly');
            $table->string('status');
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('used_by_company_id')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
        Schema::create('series_code_counters', function (Blueprint $table) {
            $table->string('scope')->primary();
            $table->unsignedInteger('next_number');
        });
        Schema::create('company_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('role_id');
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('email')->nullable();
            $table->string('contact')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('subcon_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('email')->nullable();
            $table->string('contact')->nullable();
            $table->string('address')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('subcon_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('role')->nullable();
            $table->string('email')->nullable();
            $table->string('contact')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
        Schema::create('subscription_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('type');
            $table->unsignedInteger('quantity');
            $table->timestamps();
        });

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'system_admin', 'display_name' => 'System Admin'],
            ['id' => 2, 'name' => 'company_admin', 'display_name' => 'Company Admin'],
        ]);
        DB::table('account_types')->insert(['id' => 1, 'name' => 'Normal', 'sort_order' => 1]);
        DB::table('company')->insert([
            ['id' => 10, 'name' => 'Acme Safety', 'code' => 'ACM', 'email' => 'hello@acme.test', 'status' => 'active', 'account_type_id' => 1],
            ['id' => 11, 'name' => 'Other Company', 'code' => 'OTH', 'email' => null, 'status' => null, 'account_type_id' => 1],
        ]);
        DB::table('users')->insert([
            ['id' => 1, 'name' => 'System Owner', 'email' => 'system@test.local', 'password' => 'unused', 'role_id' => 1, 'company_id' => null],
            ['id' => 2, 'name' => 'Acme Owner', 'email' => 'owner@acme.test', 'password' => 'unused', 'role_id' => 2, 'company_id' => 10],
        ]);
        DB::table('modules')->insert(['id' => 1, 'name' => 'Safety Buddy', 'code' => 'SB360', 'price' => 100]);
        DB::table('subscriptions_company')->insert(['id' => 1, 'company_id' => 10, 'module_id' => 1, 'status' => 'active', 'type' => 'new', 'start_date' => today()->subDay()->toDateString(), 'end_date' => today()->addYear()->toDateString()]);
    }

    public function test_system_admin_can_search_companies_and_view_their_details(): void
    {
        $this->actingAs(User::findOrFail(1))->get(route('system.admin.companies.index', ['search' => 'owner@acme.test']))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Companies')
                ->where('companies.total', 1)
                ->where('companies.data.0.name', 'Acme Safety')
                ->where('companies.data.0.account_type', 'Normal')
                ->where('companies.data.0.subscription.module', 'Safety Buddy')
                ->etc());

        $this->actingAs(User::findOrFail(1))->get(route('system.admin.companies.show', 10))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Admin/CompanyDetails')
                ->where('company.name', 'Acme Safety')
                ->where('admins.0.email', 'owner@acme.test')
                ->where('subscriptions.0.module', 'Safety Buddy')
                ->etc());
    }

    public function test_company_admin_cannot_open_system_company_directory(): void
    {
        $this->withoutMiddleware(EnsureCompanyPurchased::class);
        $this->actingAs(User::findOrFail(2))->get(route('system.admin.companies.index'))->assertForbidden();
        $this->actingAs(User::findOrFail(2))->get(route('system.admin.companies.show', 10))->assertForbidden();
    }

    public function test_subscription_and_package_pages_and_package_edit(): void
    {
        $this->actingAs(User::findOrFail(1))->get(route('system.admin.subscriptions'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Subscription_Management')->where('subscriptions.0.company_name', 'Acme Safety')->etc());
        $this->get(route('system.admin.subscriptions.show', 1))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/SubscriptionDetails')->where('subscription.company.name', 'Acme Safety')->etc());
        $this->get(route('system.admin.subscriptions.create', ['renew' => 1]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/SubscriptionCreate')->where('renew.company_id', 10)->etc());
        $this->get(route('system.admin.packages.index'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Packages')->where('packages.0.name', 'Safety Buddy')->etc());
        $this->get(route('system.admin.packages.create'))->assertOk();
        $this->get(route('system.admin.packages.edit', 1))->assertOk();
        DB::table('subscription_plans')->insert(['id' => 1, 'code' => 'STARTER', 'name' => 'Starter', 'price_yearly' => 100]);
        DB::table('subscription_plan_requests')->insert(['id' => 1, 'company_id' => 10, 'plan_id' => 1, 'status' => 'pending', 'price_yearly' => 100]);
        DB::table('package_activation_codes')->insert([
            ['id' => 1, 'batch_ref' => 'BATCH-1', 'provider_company_id' => 10, 'plan_id' => 1, 'price_yearly' => 100, 'status' => 'pending'],
            ['id' => 2, 'batch_ref' => 'BATCH-1', 'provider_company_id' => 10, 'plan_id' => 1, 'price_yearly' => 100, 'status' => 'pending'],
        ]);
        $this->get(route('system.admin.approvals'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Approvals')->where('planRequests.0.status', 'pending')->missing('packageOrders')->missing('trainingApplications')->etc());

        $this->put(route('system.admin.packages.update', 1), [
            'code' => 'SB360', 'name' => 'Updated Safety Buddy', 'description' => 'Updated', 'price' => 150, 'is_active' => 'N',
        ])->assertRedirect(route('system.admin.packages.index'));
        $this->assertDatabaseHas('modules', ['id' => 1, 'name' => 'Updated Safety Buddy', 'is_active' => 'N']);
        $this->put(route('system.admin.packages.update', 1), [
            'code' => 'RENAMED', 'name' => 'Updated Safety Buddy', 'price' => 150, 'is_active' => 'Y',
        ])->assertSessionHasErrors('code');

        $this->post(route('system.admin.packages.store'), [
            'code' => 'EXTRA', 'name' => 'Extra package', 'description' => 'Extra', 'price' => 90, 'is_active' => 'Y',
        ])->assertRedirect(route('system.admin.packages.index'));
        $this->assertDatabaseHas('modules', ['code' => 'EXTRA', 'name' => 'Extra package']);

        $this->post(route('system.admin.subscriptions.store'), [
            'company_id' => 10, 'module_id' => 1, 'start_date' => today()->addYear()->addDay()->toDateString(),
            'end_date' => today()->addYears(2)->toDateString(), 'status' => 'active', 'type' => 'renew',
            'payment_status' => 'not_recorded',
        ])->assertRedirect(route('system.admin.subscriptions.show', 2));
        $this->assertDatabaseHas('subscriptions_company', ['id' => 2, 'company_id' => 10, 'type' => 'renew', 'code' => 'ACM/SUB/001']);
    }

    public function test_safety_buddy_plan_detail_and_edit(): void
    {
        DB::table('subscription_plans')->insert([
            'id' => 1, 'code' => 'STARTER', 'audience' => 'normal', 'name' => 'Starter',
            'price_yearly' => 800, 'provider_price_yearly' => 700,
            'manager_limit' => 1, 'supervisor_limit' => 2, 'inspector_limit' => 3, 'contractor_limit' => 4,
            'daily_pdf_limit' => 10, 'monthly_pdf_limit' => 2, 'is_active' => true, 'sort_order' => 1,
        ]);
        DB::table('subscriptions_company')->where('id', 1)->update(['subscription_plan_id' => 1]);

        $this->actingAs(User::findOrFail(1))->get(route('system.admin.packages.index'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Packages')->where('subscriptionPlans.0.name', 'Starter')->etc());
        $this->get(route('system.admin.plans.create'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/PlanCreate')->etc());
        $this->get(route('system.admin.plans.show', 1))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/PlanDetails')
                ->where('plan.provider_price_yearly', 700)->where('usage.subscriptions', 1)->etc());
        $this->get(route('system.admin.plans.edit', 1))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/PlanEdit')->where('plan.code', 'STARTER')->etc());

        $this->put(route('system.admin.plans.update', 1), [
            'name' => 'Starter Plus', 'price_yearly' => 900, 'provider_price_yearly' => 750,
            'manager_limit' => 2, 'supervisor_limit' => 3, 'inspector_limit' => 4, 'contractor_limit' => 5,
            'daily_pdf_limit' => '', 'monthly_pdf_limit' => 6, 'is_active' => '0', 'sort_order' => 2,
            'code' => 'CHANGED', 'audience' => 'training_provider',
        ])->assertRedirect(route('system.admin.plans.show', 1));
        $this->assertDatabaseHas('subscription_plans', [
            'id' => 1, 'code' => 'STARTER', 'audience' => 'normal', 'name' => 'Starter Plus',
            'price_yearly' => 900, 'provider_price_yearly' => 750, 'manager_limit' => 2,
            'daily_pdf_limit' => null, 'is_active' => 0, 'sort_order' => 2,
        ]);

        $this->post(route('system.admin.plans.store'), [
            'code' => 'BASIC_NEW', 'name' => 'Basic New', 'price_yearly' => 1200, 'provider_price_yearly' => 1000,
            'manager_limit' => 1, 'supervisor_limit' => 1, 'inspector_limit' => 2, 'contractor_limit' => 2,
            'daily_pdf_limit' => '', 'monthly_pdf_limit' => 5,
        ])->assertRedirect(route('system.admin.plans.show', 2));
        $this->assertDatabaseHas('subscription_plans', ['id' => 2, 'code' => 'BASIC_NEW', 'name' => 'Basic New', 'provider_price_yearly' => 1000]);
    }

    public function test_training_provider_approval_requires_full_review_page(): void
    {
        DB::table('subscription_plans')->insert(['id' => 1, 'code' => 'TRAINING_PROVIDER', 'name' => 'Training Provider', 'price_yearly' => 800]);
        DB::table('training_provider_applications')->insert([
            'id' => 1, 'company_id' => 10, 'plan_id' => 1, 'requested_by' => 2,
            'registration_no' => 'REG-123', 'registration_document' => 'private/registration.pdf', 'status' => 'pending',
        ]);
        DB::table('training_provider_certificates')->insert([
            'id' => 1, 'application_id' => 1, 'issuing_body' => 'Training Board',
            'expiry_date' => today()->addYear()->toDateString(), 'file_path' => 'private/certificate.pdf', 'file_name' => 'certificate.pdf',
        ]);

        $this->actingAs(User::findOrFail(1))->get(route('system.admin.training-providers.approvals'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/TrainingProviderApprovals')
                ->where('applications.0.company.name', 'Acme Safety')->where('applications.0.certificates_count', 1)->etc());
        $this->get(route('system.admin.training-providers.approvals.show', 1))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/TrainingProviderApprovalDetails')
                ->where('application.company.name', 'Acme Safety')->where('application.certificates.0.issuing_body', 'Training Board')->etc());

        $this->post(route('system.admin.training-providers.approve', 1))->assertSessionHasErrors('reviewed');
        $this->assertDatabaseHas('training_provider_applications', ['id' => 1, 'status' => 'pending']);
        $this->post(route('system.admin.training-providers.approve', 1), ['reviewed' => true])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('training_provider_applications', ['id' => 1, 'status' => 'approved']);
        $this->assertDatabaseHas('subscription_plan_requests', ['company_id' => 10, 'plan_id' => 1, 'status' => 'pending']);

        DB::table('training_provider_applications')->insert([
            'id' => 2, 'company_id' => 11, 'plan_id' => 1, 'requested_by' => 2,
            'registration_no' => 'REG-456', 'registration_document' => 'private/second.pdf', 'status' => 'pending',
        ]);
        $this->post(route('system.admin.training-providers.reject', 2), ['reason' => 'Certificate details need correction.'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('training_provider_applications', [
            'id' => 2, 'status' => 'rejected', 'rejection_reason' => 'Certificate details need correction.',
        ]);
    }

    public function test_training_provider_page_opens_full_linked_company_details(): void
    {
        DB::table('company')->insert([
            'id' => 12, 'name' => 'Provider One', 'code' => 'PRO', 'reference_code' => 'PRO-123',
            'email' => 'provider@test.local', 'contact' => '0123456789', 'account_type_id' => 2, 'status' => 'active',
        ]);
        DB::table('company')->insert([
            'id' => 13, 'name' => 'Linked Trainee', 'code' => 'LIN', 'email' => 'linked@test.local',
            'account_type_id' => 3, 'training_provider_company_id' => 12, 'provider_linked_at' => now(),
        ]);
        DB::table('subscription_plans')->insert(['id' => 1, 'code' => 'STARTER', 'name' => 'Starter', 'price_yearly' => 800]);
        DB::table('modules')->where('id', 1)->update(['code' => 'SB360-WSIS']);
        DB::table('subscriptions_company')->insert([
            'id' => 2, 'company_id' => 13, 'module_id' => 1, 'subscription_plan_id' => 1,
            'status' => 'active', 'type' => 'new', 'start_date' => today()->subDay()->toDateString(),
            'end_date' => today()->addYear()->toDateString(),
        ]);
        DB::table('package_activation_codes')->insert([
            ['id' => 1, 'batch_ref' => 'ORDER-1', 'provider_company_id' => 12, 'plan_id' => 1, 'price_yearly' => 800, 'status' => 'pending'],
            ['id' => 2, 'batch_ref' => 'ORDER-1', 'provider_company_id' => 12, 'plan_id' => 1, 'price_yearly' => 800, 'status' => 'pending'],
        ]);
        DB::table('roles')->insert(['id' => 3, 'name' => 'manager', 'display_name' => 'Manager']);
        DB::table('company_staff')->insert([
            'id' => 1, 'company_id' => 13, 'role_id' => 3, 'name' => 'Site Manager',
            'code' => 'LIN/EMP/001', 'email' => 'manager@test.local', 'status' => 'active',
        ]);
        DB::table('subcon_company')->insert([
            'id' => 1, 'company_id' => 13, 'name' => 'Contractor One', 'code' => 'CON', 'email' => 'contractor@test.local', 'status' => 'active',
        ]);
        DB::table('subcon_staff')->insert([
            'id' => 1, 'company_id' => 1, 'name' => 'Contractor Worker', 'role' => 'Worker', 'status' => 'active',
        ]);

        $this->actingAs(User::findOrFail(1))->get(route('system.admin.training-providers.index', ['search' => 'PRO-123']))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/TrainingProviders')
                ->where('providers.total', 1)
                ->where('providers.data.0.name', 'Provider One')
                ->where('providers.data.0.trainees_count', 1)
                ->missing('orders')
                ->etc());
        $this->get(route('system.admin.training-providers.companies', 12))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/CompanyDetails')
                ->where('company.name', 'Provider One')
                ->where('company.is_training_provider', true)
                ->where('linkedCompanies.data.0.name', 'Linked Trainee')
                ->where('linkedCompanies.data.0.package', 'Starter')
                ->etc());
        $this->get(route('system.admin.companies.show', 13))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/CompanyDetails')
                ->where('company.name', 'Linked Trainee')
                ->where('slots.roles.3.used', 1)
                ->where('employees.0.name', 'Site Manager')
                ->where('contractors.0.name', 'Contractor One')
                ->where('contractors.0.staff.0.name', 'Contractor Worker')
                ->etc());
        $this->get(route('system.admin.training-providers.orders'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/TrainingProviderOrders')
                ->where('orders.0.quantity', 2)
                ->where('orders.0.provider_id', 12)
                ->where('orders.0.available', 0)
                ->missing('orders.0.codes.0')
                ->etc());
        $this->get(route('system.admin.training-providers.orders.show', 'ORDER-1'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/TrainingProviderOrderDetails')
                ->where('order.provider', 'Provider One')
                ->where('order.codes.0.code', null)
                ->etc());
        DB::table('package_activation_codes')->where('id', 1)->update([
            'code' => 'PRO-PK-AAAA-BBBB-CCCC', 'status' => 'used',
            'used_by_company_id' => 13, 'used_at' => now(),
        ]);
        DB::table('package_activation_codes')->where('id', 2)->update([
            'code' => 'PRO-PK-DDDD-EEEE-FFFF', 'status' => 'available',
        ]);
        $this->get(route('system.admin.training-providers.orders.show', 'ORDER-1'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/TrainingProviderOrderDetails')
                ->where('order.status', 'partially used')
                ->where('order.used', 1)
                ->where('order.available', 1)
                ->where('order.codes.1.used_by_company', 'Linked Trainee')
                ->where('order.codes.1.code', 'PRO-PK-AAAA-BBBB-CCCC')
                ->etc());
        $this->get(route('system.admin.training-providers.orders.show', 'MISSING-ORDER'))->assertNotFound();
    }
}
