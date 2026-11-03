<?php

namespace Tests\Feature;

use App\Models\User;
use App\Http\Middleware\EnsureCompanyPurchased;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyLogoUploadTest extends TestCase
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
        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('role_id');
            $table->timestamps();
        });

        DB::table('roles')->insert(['id' => 2, 'name' => 'admin', 'display_name' => 'Company admin']);
        DB::table('company')->insert([['id' => 2, 'name' => 'Own company'], ['id' => 3, 'name' => 'Other company']]);
        DB::table('users')->insert(['id' => 1, 'name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'unused', 'company_id' => 2, 'role_id' => 2]);
        Storage::fake('public');
        $this->withoutMiddleware(EnsureCompanyPurchased::class);
    }

    public function test_company_admin_can_upload_and_replace_only_their_company_logo(): void
    {
        $user = User::findOrFail(1);

        $this->actingAs($user)->post(route('company.details.logo'), ['logo' => UploadedFile::fake()->image('first.png')])
            ->assertRedirect('/profile#company');
        $first = DB::table('company')->where('id', 2)->value('logo_path');
        Storage::disk('public')->assertExists($first);

        $this->actingAs($user)->post(route('company.details.logo'), ['logo' => UploadedFile::fake()->image('second.jpg')])
            ->assertRedirect('/profile#company');
        $second = DB::table('company')->where('id', 2)->value('logo_path');
        Storage::disk('public')->assertExists($second);
        Storage::disk('public')->assertMissing($first);
        $this->assertNull(DB::table('company')->where('id', 3)->value('logo_path'));
    }

    public function test_company_logo_must_be_an_allowed_image_under_two_megabytes(): void
    {
        $this->actingAs(User::findOrFail(1))->post(route('company.details.logo'), ['logo' => UploadedFile::fake()->create('notes.txt', 1)])
            ->assertSessionHasErrors('logo');
        $this->actingAs(User::findOrFail(1))->post(route('company.details.logo'), ['logo' => UploadedFile::fake()->image('large.png')->size(3000)])
            ->assertSessionHasErrors('logo');
        $this->assertNull(DB::table('company')->where('id', 2)->value('logo_path'));
    }
}
