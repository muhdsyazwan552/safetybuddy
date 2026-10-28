<?php

namespace Tests\Feature;

use App\Models\SubconCompany;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExecutorCompanyManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        $this->withoutMiddleware(\App\Http\Middleware\EnsureCompanyPurchased::class);

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->unsignedBigInteger('company_id');
            $table->unsignedInteger('role_id');
            $table->timestamps();
        });
        Schema::create('subcon_company', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->string('name');
            $table->string('email');
            $table->string('contact');
            $table->text('address');
            $table->string('status');
            $table->string('public_token')->nullable();
            $table->timestamps();
        });
        Schema::create('subcon_staff', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
        });
        Schema::create('project_assign', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entity_id');
            $table->string('entity_type');
        });

        DB::table('users')->insert([
            'id' => 1, 'name' => 'Owner', 'email' => 'owner@example.com',
            'password' => 'unused', 'company_id' => 2, 'role_id' => 2,
        ]);
        $this->actingAs(User::findOrFail(1));
    }

    public function test_owner_can_edit_executor_details_but_not_another_companies_executor(): void
    {
        $own = $this->company(2);
        $other = $this->company(3);
        $details = ['name' => 'Updated Executor', 'email' => 'updated@example.com',
            'contact' => '0123456789', 'address' => 'New address'];

        $this->put(route('admin.company.update', $own->id), $details)->assertRedirect();
        $this->assertDatabaseHas('subcon_company', ['id' => $own->id, 'name' => 'Updated Executor', 'address' => 'New address']);

        $this->put(route('admin.company.update', $other->id), $details)->assertForbidden();
        $this->assertDatabaseHas('subcon_company', ['id' => $other->id, 'name' => 'Executor']);
    }

    public function test_delete_removes_only_unused_owned_executor(): void
    {
        $unused = $this->company(2);
        $hasStaff = $this->company(2);
        $assigned = $this->company(2);
        $other = $this->company(3);
        DB::table('subcon_staff')->insert(['company_id' => $hasStaff->id]);
        DB::table('project_assign')->insert(['entity_type' => 'compsub', 'entity_id' => $assigned->id]);

        $this->delete(route('admin.company.destroy', $other->id))->assertForbidden();
        $this->delete(route('admin.company.destroy', $hasStaff->id))->assertSessionHasErrors('company');
        $this->delete(route('admin.company.destroy', $assigned->id))->assertSessionHasErrors('company');
        $this->delete(route('admin.company.destroy', $unused->id))->assertRedirect();

        $this->assertDatabaseMissing('subcon_company', ['id' => $unused->id]);
        $this->assertDatabaseHas('subcon_company', ['id' => $hasStaff->id]);
        $this->assertDatabaseHas('subcon_company', ['id' => $assigned->id]);
        $this->assertDatabaseHas('subcon_company', ['id' => $other->id]);
    }

    private function company(int $ownerId): SubconCompany
    {
        return SubconCompany::create([
            'company_id' => $ownerId,
            'name' => 'Executor',
            'email' => 'executor@example.com',
            'contact' => '0100000000',
            'address' => 'Old address',
            'status' => 'inactive',
        ]);
    }
}
