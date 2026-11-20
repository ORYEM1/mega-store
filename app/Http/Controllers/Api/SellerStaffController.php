<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seller;
use App\Models\SellerStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class SellerStaffController extends Controller
{
    /**
     * Only the business owner can manage staff accounts.
     */
    private function authorizeOwner(Request $request): Seller
    {
        $user = $request->user();

        abort_unless(
            $user instanceof Seller,
            403,
            'Only the business owner can manage staff accounts.'
        );

        return $user;
    }

    /**
     * List employees belonging to the authenticated seller.
     */
    public function index(Request $request)
    {
        $seller = $this->authorizeOwner($request);

        $staff = SellerStaff::where('seller_id', $seller->id)
            ->with('roles:id,name')
            ->latest()
            ->get();

        return response()->json([
            'staff' => $staff,
        ]);
    }

    /**
     * Create a new employee account.
     */
    public function store(Request $request)
    {
        $seller = $this->authorizeOwner($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:seller_staff,email',
                'unique:sellers,email',
            ],

            'phone' => ['nullable', 'string', 'max:30'],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where(
                    fn ($query) => $query
                        ->where('seller_id', $seller->id)
                        ->where('guard_name', 'seller_staff')
                ),
            ],
        ]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($seller->id);

        try {
            $staff = DB::transaction(function () use ($validated, $seller) {

                $employee = SellerStaff::create([
                    'seller_id' => $seller->id,
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'password' => $validated['password'],
                    'is_active' => true,
                ]);

                $role = Role::where('seller_id', $seller->id)
                    ->where('guard_name', 'seller_staff')
                    ->findOrFail($validated['role_id']);

                $employee->assignRole($role);

                return $employee;
            });
        } finally {
            $registrar->setPermissionsTeamId(null);
        }

        return response()->json([
            'message' => 'Employee account created successfully.',
            'staff' => $staff->load('roles:id,name'),
        ], 201);
    }

    /**
     * Update employee details and optionally change their role.
     */
    public function update(Request $request, int $id)
    {
        $seller = $this->authorizeOwner($request);

        $staff = SellerStaff::where('seller_id', $seller->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('seller_staff', 'email')->ignore($staff->id),
                Rule::unique('sellers', 'email'),
            ],

            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],

            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:8',
                'confirmed',
            ],

            'role_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('roles', 'id')->where(
                    fn ($query) => $query
                        ->where('seller_id', $seller->id)
                        ->where('guard_name', 'seller_staff')
                ),
            ],
        ]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($seller->id);

        try {
            DB::transaction(function () use ($staff, $validated, $seller) {

                $staff->fill(collect($validated)->except([
                    'role_id',
                    'password',
                ])->all());

                if (! empty($validated['password'])) {
                    $staff->password = $validated['password'];
                }

                $staff->save();

                if (isset($validated['role_id'])) {
                    $role = Role::where('seller_id', $seller->id)
                        ->where('guard_name', 'seller_staff')
                        ->findOrFail($validated['role_id']);

                    $staff->syncRoles([$role]);
                }
            });
        } finally {
            $registrar->setPermissionsTeamId(null);
        }

        return response()->json([
            'message' => 'Employee updated successfully.',
            'staff' => $staff->fresh()->load('roles:id,name'),
        ]);
    }

    /**
     * Activate or deactivate an employee.
     */
    public function updateStatus(Request $request, int $id)
    {
        $seller = $this->authorizeOwner($request);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $staff = SellerStaff::where('seller_id', $seller->id)
            ->findOrFail($id);

        $staff->update([
            'is_active' => $validated['is_active'],
        ]);

        if (! $staff->is_active) {
            $staff->tokens()->delete();
        }

        return response()->json([
            'message' => $staff->is_active
                ? 'Employee account activated.'
                : 'Employee account deactivated.',
            'staff' => $staff,
        ]);
    }

    /**
     * Delete an employee account.
     */
    public function destroy(Request $request, int $id)
    {
        $seller = $this->authorizeOwner($request);

        $staff = SellerStaff::where('seller_id', $seller->id)
            ->findOrFail($id);

        $staff->tokens()->delete();
        $staff->delete();

        return response()->json([
            'message' => 'Employee account deleted successfully.',
        ]);
    }
}