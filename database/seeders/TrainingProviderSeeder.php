<?php

namespace Database\Seeders;

use App\Models\AccountType;
use App\Models\Company;
use App\Models\Module;
use App\Models\Payments;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanRequest;
use App\Models\TrainingProviderApplication;
use App\Models\TrainingProviderCertificate;
use App\Models\User;
use App\Support\OrderNumber;
use App\Support\SeriesCodes;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Three Training Providers that went through the whole process:
 * company + admin account -> application with documents -> approved -> package order paid -> active subscription
 * -> reference code issued, so they show in the public "Find my Training Provider" directory.
 *
 * Logos: put one image per provider in  database/seeders/assets/training-provider-logos/  named after the slug
 * (borneo-safety-academy.png, klang-valley-safety-centre.png, seri-utara-safety-institute.png) and run the seeder
 * again - it is safe to run any number of times (it only creates what is missing and refreshes the logo).
 *
 *   php artisan db:seed --class=TrainingProviderSeeder
 */
class TrainingProviderSeeder extends Seeder
{
    /** Contact data is written so it cannot belong to a real person or company. */
    private const PROVIDERS = [
        [
            'slug' => 'borneo-safety-academy',
            'name' => 'Borneo Safety Academy Sdn Bhd',
            'registration_no' => '202201004511 (1458831-K)',
            'owner' => 'Awang Hafiz bin Abang Zaini',
            'email' => 'admin@borneosafetyacademy.example',
            'contact' => '+60 82-000 1101',
            'address' => 'Lot 214, Block B, Jalan Tun Jugah',
            'city' => 'Kuching', 'postcode' => '93350', 'state' => 'Sarawak',
            'lat' => 1.5311, 'lng' => 110.3398,
            'certificates' => [['Sarawak Safety Training Accreditation Council', '+14 months'], ['National Occupational Safety Trainers Register', '+9 months']],
            'days_ago' => 21,
        ],
        [
            'slug' => 'klang-valley-safety-centre',
            'name' => 'Klang Valley Safety Training Centre Sdn Bhd',
            'registration_no' => '202101018276 (1423950-T)',
            'owner' => 'Nurul Aini binti Rosli',
            'email' => 'admin@klangvalleysafety.example',
            'contact' => '+60 3-0000 2202',
            'address' => 'No. 18, Jalan Pelabur 23/1, Seksyen 23',
            'city' => 'Shah Alam', 'postcode' => '40300', 'state' => 'Selangor',
            'lat' => 3.0486, 'lng' => 101.5365,
            'certificates' => [['National Occupational Safety Trainers Register', '+11 months'], ['Industrial Safety Competency Board', '+18 months']],
            'days_ago' => 14,
        ],
        [
            'slug' => 'seri-utara-safety-institute',
            'name' => 'Seri Utara Safety Institute Sdn Bhd',
            'registration_no' => '202301007734 (1487205-D)',
            'owner' => 'Lim Chee Keong',
            'email' => 'admin@seriutarasafety.example',
            'contact' => '+60 4-000 3303',
            'address' => '56, Lebuh Macallum, Georgetown',
            'city' => 'George Town', 'postcode' => '10300', 'state' => 'Pulau Pinang',
            'lat' => 5.4164, 'lng' => 100.3327,
            'certificates' => [['Industrial Safety Competency Board', '+16 months'], ['Northern Region Skills Accreditation Panel', '+7 months']],
            'days_ago' => 7,
        ],
    ];

    public function run(): void
    {
        $plan = SubscriptionPlan::where('audience', 'training_provider')->where('is_active', true)->orderBy('sort_order')->first();
        $module = Module::where('code', 'SB360-WSIS')->first();
        if (!$plan || !$module) {
            $this->command?->error('The Training Provider package or the Safety Buddy module is missing. Nothing was created.');

            return;
        }

        $logins = [];
        foreach (self::PROVIDERS as $p) {
            $company = Company::where('email', $p['email'])->first();
            if (!$company) {
                [$company, $password] = DB::transaction(fn () => $this->create($p, $plan, $module));
                $logins[] = [$p['name'], $p['email'], $password];
            }
            $this->logo($company, $p['slug']);
        }

        if ($logins) {
            $this->command?->info('Created. Sign-in details of the new provider admins (shown once):');
            foreach ($logins as [$name, $email, $password]) {
                $this->command?->line("  {$name}\n    e-mail: {$email}\n    password: {$password}");
            }
        } else {
            $this->command?->info('All three providers already exist. Logos were refreshed from the logo folder.');
        }
    }

    /** @return array{0: Company, 1: string} */
    private function create(array $p, SubscriptionPlan $plan, Module $module): array
    {
        $when = now()->subDays($p['days_ago']);

        $company = SeriesCodes::createCompany([
            'uuid' => (string) Str::uuid(),
            'name' => $p['name'],
            'registration_no' => $p['registration_no'],
            'email' => $p['email'],
            'address' => $p['address'],
            'city' => $p['city'],
            'postcode' => $p['postcode'],
            'state' => $p['state'],
            'latitude' => $p['lat'],
            'longitude' => $p['lng'],
            'contact' => $p['contact'],
            'status' => 'active',
            'account_type_id' => AccountType::NORMAL ?? 1,
        ]);

        $password = Str::password(14, symbols: false);
        $admin = User::create([
            'name' => $p['owner'],
            'email' => $p['email'],
            'phone' => preg_replace('/[^0-9+]/', '', $p['contact']),
            'password' => Hash::make($password),
            'role_id' => 2,
            'company_id' => $company->id,
            'email_verified_at' => $when,
            'email_verification_required' => 0,
        ]);

        // 1. the application with its documents
        $applicationData = [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'registration_no' => $p['registration_no'],
            'registration_document' => $this->document($company, 'registration-certificate', $p['name'], 'Company registration certificate (copy)', [
                'Company' => $p['name'], 'Registration no.' => $p['registration_no'], 'Registered address' => "{$p['address']}, {$p['postcode']} {$p['city']}, {$p['state']}",
            ]),
            'status' => 'approved',
            'requested_by' => $admin->id,
            'reviewed_at' => $when->copy()->addDays(3),
        ];
        foreach (['company_name' => $p['name'], 'owner_name' => $p['owner'], 'email' => $p['email']] as $column => $value) {
            if (Schema::hasColumn('training_provider_applications', $column)) {
                $applicationData[$column] = $value;
            }
        }
        $application = TrainingProviderApplication::create($applicationData);
        TrainingProviderApplication::whereKey($application->id)->update(['created_at' => $when, 'updated_at' => $when->copy()->addDays(3)]);

        foreach ($p['certificates'] as $n => [$body, $expiry]) {
            $fileName = Str::slug($body) . '.pdf';
            TrainingProviderCertificate::create([
                'application_id' => $application->id,
                'issuing_body' => $body,
                'expiry_date' => now()->modify($expiry)->toDateString(),
                'file_path' => $this->document($company, 'certificate-' . ($n + 1), $p['name'], $body . ' - training provider certificate (copy)', [
                    'Training provider' => $p['name'], 'Issued by' => $body,
                ]),
                'file_name' => $fileName,
            ]);
        }

        // 2. the package order, approved after payment
        $requestData = [
            'company_id' => $company->id,
            'plan_id' => $plan->id,
            'price_yearly' => (int) $plan->price_yearly,
            'status' => 'approved',
            'requested_by' => $admin->id,
            'reviewed_at' => $when->copy()->addDays(5),
        ];
        if (Schema::hasColumn('subscription_plan_requests', 'order_no')) {
            $requestData['order_no'] = OrderNumber::next(OrderNumber::planCode($plan));
        }
        $order = SubscriptionPlanRequest::create($requestData);

        $start = $when->copy()->addDays(5)->toDateString();
        $subscription = SeriesCodes::createSubscription((int) $company->id, [
            'company_id' => $company->id,
            'module_id' => $module->id,
            'subscription_plan_id' => $plan->id,
            'start_date' => $start,
            'end_date' => \Carbon\Carbon::parse($start)->addYear()->subDay()->toDateString(),
            'status' => 'active',
            'type' => 'new',
        ]);
        Payments::create([
            'subscriber_type' => 'company',
            'subscriber_id' => $company->id,
            'company_id' => $company->id,
            'subscription_id' => $subscription->id,
            'total_amount' => $plan->price_yearly,
            'payment_type' => 'manual_verified',
            'payment_status' => 'completed',
            'cash_flow' => 'cash_in',
        ]);
        $order->update(['subscription_id' => $subscription->id]);

        // 3. approved and paid: the company becomes a Training Provider with its reference code
        $company->update(['account_type_id' => AccountType::TRAINING_PROVIDER]);
        $company->ensureReferenceCode();

        return [$company, $password];
    }

    /** A plain one-page document stored the same way older uploads are (public disk). */
    private function document(Company $company, string $name, string $title, string $heading, array $lines): string
    {
        $rows = '';
        foreach ($lines as $label => $value) {
            $rows .= '<tr><td style="padding:6px 10px;color:#555;width:32%">' . e($label) . '</td><td style="padding:6px 10px"><b>' . e($value) . '</b></td></tr>';
        }
        $html = '<html><body style="font-family:DejaVu Sans,sans-serif;font-size:12px"><h2>' . e($heading) . '</h2><p>' . e($title) . '</p><table style="width:100%;border-collapse:collapse">' . $rows . '</table></body></html>';

        return $this->put("training-providers/{$company->id}", $name . '.pdf', Pdf::loadHTML($html)->setPaper('a4')->output(), 'application/pdf');
    }

    /**
     * Store a file the way the application stores uploads: on the S3 disk under uploads/ when S3 is the default disk
     * (the live system), otherwise on the public disk. Returns the path to keep in the database.
     */
    private function put(string $category, string $name, string $contents, string $mime): string
    {
        if (config('filesystems.default') === 's3') {
            $type = str_starts_with($mime, 'image/') ? 'images' : ($mime === 'application/pdf' ? 'pdf' : 'files');
            $path = 'uploads/' . $category . '/' . $type . '/' . now('Asia/Kuala_Lumpur')->format('Y/m') . '/SB-' . Str::ulid() . '.' . pathinfo($name, PATHINFO_EXTENSION);
            if (Storage::disk('s3')->put($path, $contents, ['ContentType' => $mime]) === false) {
                throw new RuntimeException("Could not store {$path}");
            }

            return $path;
        }

        $path = $category . '/' . $name;
        Storage::disk('public')->put($path, $contents);

        return $path;
    }

    /** Use the image in the logo folder, if there is one, as the company logo. */
    private function logo(Company $company, string $slug): void
    {
        $dir = database_path('seeders/assets/training-provider-logos');
        foreach (['png', 'jpg', 'jpeg', 'webp'] as $ext) {
            $file = "{$dir}/{$slug}.{$ext}";
            if (!is_file($file)) {
                continue;
            }
            $mime = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp'][$ext];
            $old = $company->logo_path;
            $path = $this->put("companies/{$company->id}/logos", "{$slug}.{$ext}", file_get_contents($file), $mime);
            $company->update(['logo_path' => $path]);
            if ($old && $old !== $path && str_starts_with($old, 'uploads/') && config('filesystems.default') === 's3') {
                Storage::disk('s3')->delete($old); // the logo this seeder put there before
            }
            $this->command?->info("Logo set for {$company->name}");

            return;
        }
    }
}
