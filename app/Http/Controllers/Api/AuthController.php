<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Services\AdminNotificationService;

class AuthController extends Controller
{
    /**
     * Register a new customer.
     */
    public function register(Request $request, AdminNotificationService $notifications)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name'  => ['required', 'string', 'max:255'],
            'email'      => ['nullable', 'email', 'max:255', 'unique:customers,email'],
            'phone'      => ['required', 'string', 'max:30', 'unique:customers,phone'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
            'address'    => ['nullable', 'string'],
            'city'       => ['nullable', 'string', 'max:255'],
        ]);

        $customer = Customer::create([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'email'      => $validated['email'] ?? null,
            'phone'      => $validated['phone'],
            'password'   => Hash::make($validated['password']),
            'address'    => $validated['address'] ?? null,
            'city'       => $validated['city'] ?? null,
            'is_active'  => true,
        ]);
        $notifications->send('New Customer Registered', $customer->first_name . ' ' . $customer->last_name . ' has registered as a new customer.', 'success');

        $token = $customer->createToken('adrian-store-react')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'customer' => $customer,
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Log in an existing customer.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = $validated['login'];

        $customer = Customer::query()
            ->where('email', $login)
            ->orWhere('phone', $login)
            ->first();

        if (
            ! $customer ||
            ! $customer->is_active ||
            ! Hash::check($validated['password'], $customer->password)
        ) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $customer->createToken('adrian-store-react')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'customer' => $customer,
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Return the authenticated customer's details.
     */
    public function customer(Request $request)
    {
        return response()->json([
            'customer' => $request->user(),
        ]);
    }

    /**
     * Log out the current customer.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}