<?php

namespace App\Http\Middleware;

use App\Models\Seller;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSellerIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only seller accounts can access seller endpoints.
        if (! $user instanceof Seller) {
            return response()->json([
                'message' => 'Access denied. Seller account required.',
            ], 403);
        }

        // Only approved sellers can manage their shops.
        if ($user->approval_status !== 'approved') {
            return response()->json([
                'message' => 'Your seller account is not approved.',
            ], 403);
        }

        return $next($request);
    }
}