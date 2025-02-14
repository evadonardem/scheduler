<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class PingController extends Controller
{
    public function index()
    {
        return Inertia::render('Ping');
    }
}
