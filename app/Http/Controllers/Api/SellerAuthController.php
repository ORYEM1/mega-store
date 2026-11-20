<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seller;
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\SellerStaff;
use Spatie\Permission\PermissionRegistrar;


class SellerAuthController extends Controller
{
    /**
     * Register a new seller.
     */
    public function register(Request $request,AdminNotificationService $notifications)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],

            'email' => ['required', 'email', 'max:255', 'unique:sellers,email'],
            'phone' => ['nullable', 'string', 'max:30', 'unique:sellers,phone'],

            'password' => ['required', 'string', 'min:8', 'confirmed'],

            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['nullable', 'string'],

            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
        ]);

        $baseSlug = Str::slug($validated['business_name']);
        $baseSlug = $baseSlug ?: 'shop';

        $slug = $baseSlug;
        $counter = 1;

        while (Seller::where('business_slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $seller = Seller::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,

            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),

            'business_name' => $validated['business_name'],
            'business_slug' => $slug,
            'business_description' => $validated['business_description'] ?? null,

            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'country' => $validated['country'] ?? 'Uganda',

            'approval_status' => 'pending',
        ]);

        $notifications->send(
            'New Seller Registration',
            $seller->business_name . ' has registered and is awaiting approval.',
            'warning'
        );

        return response()->json([
            'message' => 'Seller registration successful. Your application is awaiting admin approval.',
            'seller' => $seller,
        ], 201);
    }

    /**
     * Log in an approved seller.
     */
    /**
 * Log in an approved seller or an active seller employee.
 */
public function login(Request $request)
{
    $validated = $request->validate([
        'login' => ['required', 'string'],
        'password' => ['required', 'string'],
    ]);

    /*
    |--------------------------------------------------------------------------
    | 1. Try seller owner login first
    |--------------------------------------------------------------------------
    */

    $seller = Seller::query()
        ->where(function ($query) use ($validated) {
            $query->where('email', $validated['login'])
                ->orWhere('phone', $validated['login']);
        })
        ->first();

    if ($seller) {
        if (! Hash::check($validated['password'], $seller->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($seller->approval_status !== 'approved') {
            throw ValidationException::withMessages([
                'login' => [
                    'Your seller account is awaiting approval or is currently unavailable.',
                ],
            ]);
        }

        $token = $seller->createToken(
            'adrian-seller-dashboard'
        )->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'account_type' => 'owner',
            'seller' => $seller,
            'account' => $seller,
            'role' => 'Owner',
            'permissions' => ['*'],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Try employee login
    |--------------------------------------------------------------------------
    */

    $staff = SellerStaff::with('seller')
        ->where('email', $validated['login'])
        ->first();

    if (
        ! $staff ||
        ! Hash::check($validated['password'], $staff->password)
    ) {
        throw ValidationException::withMessages([
            'login' => ['The provided credentials are incorrect.'],
        ]);
    }

    if (! $staff->is_active) {
        throw ValidationException::withMessages([
            'login' => ['Your employee account has been deactivated.'],
        ]);
    }

    $seller = $staff->seller;

    if (! $seller || $seller->approval_status !== 'approved') {
        throw ValidationException::withMessages([
            'login' => [
                'The associated business is currently unavailable.',
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Retrieve employee role and permissions
    |--------------------------------------------------------------------------
    */

    $registrar = app(PermissionRegistrar::class);

    $registrar->setPermissionsTeamId($seller->id);

    try {
        $role = $staff->getRoleNames()->first();

        $permissions = $staff->getAllPermissions()
            ->pluck('name')
            ->values()
            ->all();
    } finally {
        $registrar->setPermissionsTeamId(null);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Generate employee token
    |--------------------------------------------------------------------------
    */

    $token = $staff->createToken(
        'adrian-seller-staff-dashboard'
    )->plainTextToken;

    return response()->json([
        'message' => 'Employee login successful.',
        'account_type' => 'staff',

        // Preserve the seller object expected by the existing frontend.
        'seller' => $seller,

        // Employee-specific account information.
        'account' => $staff->only([
            'id',
            'seller_id',
            'name',
            'email',
            'phone',
            'is_active',
        ]),

        'role' => $role,
        'permissions' => $permissions,

        'token' => $token,
        'token_type' => 'Bearer',
    ]);
}

    /**
     * Return the authenticated seller's profile.
     */
    public function profile(Request $request)
    {
        return response()->json([
            'seller' => $request->user(),
        ]);
    }

    /**
     * Log out the authenticated seller.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}