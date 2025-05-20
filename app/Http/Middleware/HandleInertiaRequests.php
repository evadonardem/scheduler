<?php

namespace App\Http\Middleware;

use App\Http\Resources\DepartmentResource;
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
        $user = Auth::user();
        $department = $user ? $user->departments->first() : null;

        $appMenu = [];
        if (Auth::check()) {
            request()->user()?->tokens()->where('created_at', '<', now())->delete();

            $authUserRoles = $user->roles->pluck('name');

            $dashboardMenu = [
                [
                    'label' => 'Dashboard',
                    'icon' => 'dashboard',
                    'route' => 'dashboard',
                ],
            ];

            $deparmentalMenu = [
                [
                    'label' => 'Schedules',
                    'icon' => 'calendar_month',
                    'route' => 'academic-year-schedules',
                ],
            ];

            if ($authUserRoles->contains(fn ($role) => in_array($role, ['Super Admin', 'Dean', 'Associate Dean']))) {
                $deparmentalMenu[] = [
                    'label' => 'Courses',
                    'icon' => 'school',
                    'route' => 'courses',
                ];
                $deparmentalMenu[] = [
                    'label' => 'Subjects',
                    'icon' => 'list_alt',
                    'route' => 'subjects',
                ];
            }

            $deparmentalMenu[] = [
                'label' => 'Curricula',
                'icon' => 'tab',
                'route' => 'curricula',
            ];

            $settingsMenu = [
                [
                    'label' => 'Settings',
                    'icon' => 'settings',
                    'submenu' => [
                        [
                            'label' => 'Departments',
                            'icon' => 'apartment',
                            'route' => 'departments',
                        ],
                        [
                            'label' => 'Rooms',
                            'icon' => 'room_preferences',
                            'route' => 'rooms',
                        ],
                        [
                            'label' => 'Users',
                            'icon' => 'people',
                            'route' => 'users',
                        ],
                    ],
                ],
            ];

            $appMenu = [
                $dashboardMenu,
                $deparmentalMenu,
            ];

            if ($authUserRoles->contains(fn ($role) => in_array($role, ['Super Admin', 'Dean', 'Associate Dean']))) {
                $appMenu[] = $settingsMenu;
            }
        }

        return array_merge(parent::share($request), [
            'appName' => config('app.name'),
            'appMenu' => $appMenu,
            'auth' => $user ? [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'department' => $department ? DepartmentResource::make($department)->toArray(request()) : null,
                'roles' => Auth::user()->roles->pluck('name'),
                'permissions' => Auth::user()->permissions,
                'token' => request()->user()?->createToken('scheduler')->plainTextToken,
            ] : null,
            'flashMessage' => $request->session()->get('scheduler-flash-message'),
        ]);
    }
}
