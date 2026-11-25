<?php

namespace App\Http\Middleware;

use App\Models\Seller;
use App\Models\SellerStaff;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSellerPermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {
        $user = $request->user();

        // Business owners have full access to their own business.
        if ($user instanceof Seller) {
            return $next($request);
        }

        // Only seller employees can proceed through permission checks.
        if (! $user instanceof SellerStaff) {
            return response()->json([
                'message' => 'Access denied.',
            ], 403);
        }

        // Check whether the employee has the required permission.
        if (! $user->can($permission)) {
            return response()->json([
                'message' => 'You do not have permission to perform this action.',
                'required_permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}