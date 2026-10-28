<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class CompanyEmailVerificationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');

        Schema::create('company', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('address');
            $table->string('contact');
            $table->string('status');
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedInteger('role_id')->nullable();
            $table->boolean('email_verification_required')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Notification::fake();
    }

    public function test_registration_requires_email_verification_before_login(): void
    {
        $response = $this->postJson('/register', [
            'name' => 'Example Company',
            'email' => 'owner@example.com',
            'phone' => '0123456789',
            'address' => 'Kuala Lumpur',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'terms' => true,
        ]);

        $response->assertOk()->assertJsonPath('redirect', route('verification.notice'));
        $user = User::where('email', 'owner@example.com')->firstOrFail();
        $this->assertTrue($user->email_verification_required);
        $this->assertNull($user->email_verified_at);
        $this->assertSame(2, $user->role_id);
        Notification::assertSentTo($user, VerifyEmail::class);

        $this->post('/login', ['email' => 'owner@example.com', 'password' => 'password123'])
            ->assertRedirect(route('verification.notice'));
        $this->assertGuest();

        $this->actingAs($user)->get('/plans')->assertRedirect(route('verification.notice'));
    }

    public function test_valid_signed_link_verifies_email_and_expired_link_does_not(): void
    {
        $user = User::create([
            'name' => 'Example Company',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'role_id' => 2,
            'email_verification_required' => true,
        ]);

        $parameters = ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())];
        $expired = URL::temporarySignedRoute('verification.verify', now()->subMinute(), $parameters);
        $this->get($expired)->assertForbidden();
        $this->assertNull($user->fresh()->email_verified_at);

        $valid = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), $parameters);
        $this->get($valid)->assertRedirect(route('admin.login'));
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_unverified_user_can_request_another_link(): void
    {
        $user = User::create([
            'name' => 'Example Company',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'role_id' => 2,
            'email_verification_required' => true,
        ]);

        $this->post('/email/verification-notification', ['email' => $user->email])
            ->assertRedirect(route('verification.notice'));

        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
