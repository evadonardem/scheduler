<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct() {}

    public function index()
    {
        return Inertia::render('Dashboard/Index', [
        ]);
    }
}
