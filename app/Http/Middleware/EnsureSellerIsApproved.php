<?php

namespace App\Http\Middleware;

use App\Models\Seller;
use App\Models\SellerStaff;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class EnsureSellerIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Identify the business owner.
        if ($user instanceof Seller) {
            $seller = $user;
        } elseif ($user instanceof SellerStaff) {

            // Reject deactivated employees.
            if (! $user->is_active) {
                return response()->json([
                    'message' => 'Your staff account has been deactivated.',
                ], 403);
            }

            // Get the business owner this employee belongs to.
            $seller = $user->seller;
        } else {
            return response()->json([
                'message' => 'Access denied. Seller account required.',
            ], 403);
        }

        // Ensure the employee still belongs to an existing seller.
        if (! $seller) {
            return response()->json([
                'message' => 'The associated seller account could not be found.',
            ], 403);
        }

        // Only approved sellers and their employees can access the shop.
        if ($seller->approval_status !== 'approved') {
            return response()->json([
                'message' => 'Your seller account is not approved.',
            ], 403);
        }

        // Set the current seller context for Spatie permissions.
        $permissionRegistrar = app(PermissionRegistrar::class);

        $permissionRegistrar->setPermissionsTeamId($seller->id);

        try {
            return $next($request);
        } finally {
            // Clear the seller context after processing the request.
            $permissionRegistrar->setPermissionsTeamId(null);
        }
    }
}