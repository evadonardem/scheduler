<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        request()->user()?->tokens()->delete();

        $appMenu = [];
        if (Auth::check()) {
            $appMenu = [
                [
                    [
                        'label' => 'Dashboard',
                        'icon' => 'dashboard',
                        'route' => 'dashboard',
                    ],
                ],
                [
                    [
                        'label' => 'Schedules',
                        'icon' => 'calendar_month',
                        'route' => 'academic-year-schedules',
                    ],
                    [
                        'label' => 'Settings',
                        'icon' => 'settings',
                        'submenu' => [
                            [
                                'label' => 'Departments Registry',
                                'icon' => 'apartment',
                                'route' => 'departments',
                            ],
                            [
                                'label' => 'Courses Registry',
                                'icon' => 'school',
                                'route' => 'courses',
                            ],
                            [
                                'label' => 'Subjects Registry',
                                'icon' => 'list_alt',
                                'route' => 'subjects',
                            ],
                            [
                                'label' => 'Curricula Registry',
                                'icon' => 'tab',
                                'route' => 'curricula',
                            ],
                            [
                                'label' => 'Rooms Registry',
                                'icon' => 'room_preferences',
                                'route' => 'rooms',
                            ],
                            [
                                'label' => 'Users Registry',
                                'icon' => 'people',
                                'route' => 'users',
                            ],
                        ],
                    ],
                ],
            ];
        }

        return array_merge(parent::share($request), [
            'appName' => config('app.name'),
            'appMenu' => $appMenu,
            'auth' => Auth::user() ? [
                'id' => Auth::user()->id,
                'email' => Auth::user()->email,
                'name' => Auth::user()->name,
                'roles' => Auth::user()->roles->pluck('name'),
                'token' => request()->user()?->createToken('scheduler')->plainTextToken,
            ] : null,
            'flashMessage' => $request->session()->get('scheduler-flash-message'),
        ]);
    }
}
