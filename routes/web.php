<?php

use App\Http\Controllers\AcademicYearScheduleController;
use App\Http\Controllers\AcademicYearScheduleFacultyLoadingController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\CurriculumSubjectController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\PingController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [AuthController::class, 'create'])->name('login');
Route::post('/login', [AuthController::class, 'store']);
Route::post('/logout', [AuthController::class, 'destroy'])->middleware('auth');

Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])
    ->middleware('guest')
    ->name('password.request');
Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');
Route::get('/reset-password/{token}', [ResetPasswordController::class, 'create'])
    ->middleware('guest')
    ->name('password.reset');
Route::post('/reset-password', [ResetPasswordController::class, 'store'])
    ->middleware('guest')
    ->name('password.update');

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::group(['prefix' => '/academic-year-schedules'], static function () {
        Route::get('/', [AcademicYearScheduleController::class, 'index'])->name('academic-year-schedules.list');
        Route::get('/{academicYearSchedule}', [AcademicYearScheduleController::class, 'show']);
        Route::get('/{academicYearSchedule}/faculty-loadings', [AcademicYearScheduleFacultyLoadingController::class, 'index'])->name('academic-year-schedules.faculty-loadings.list');
        Route::post('/', [AcademicYearScheduleController::class, 'store']);
    });

    Route::get('/profile/{user}', [UserController::class, 'edit'])->name('profile.edit');

    Route::group(['prefix' => '/courses'], static function () {
        Route::get('/', [CourseController::class, 'index'])->name('courses.list');
        Route::post('/', [CourseController::class, 'store']);
    });

    Route::group(['prefix' => '/curricula'], static function () {
        Route::get('/', [CurriculumController::class, 'index'])->name('curricula.list');
        // Route::post('/', [CurriculumController::class, 'store']);

        Route::group(['prefix' => '/{curriculum}/subjects'], static function () {
            Route::get('/', [CurriculumSubjectController::class, 'index']);
        });
    });

    Route::group(['prefix' => '/departments'], static function () {
        Route::get('/', [DepartmentController::class, 'index']);
        Route::post('/', [DepartmentController::class, 'store']);
    });

    Route::group(['prefix' => '/import-templates'], static function () {
        Route::get('/departments', [DepartmentController::class, 'downloadTemplate']);
        Route::get('/courses', [CourseController::class, 'downloadTemplate']);
        Route::get('/subjects', [SubjectController::class, 'downloadTemplate']);
        Route::get('/users', [UserController::class, 'downloadTemplate']);
    });

    Route::group(['prefix' => '/rooms'], static function () {
        Route::get('/', [RoomController::class, 'index'])->name('rooms.list');
        // Route::post('/', [RoomController::class, 'store']);
    });

    Route::group(['prefix' => '/subjects'], static function () {
        Route::get('/', [SubjectController::class, 'index'])->name('subjects.list');
        Route::post('/', [SubjectController::class, 'store']);
    });

    Route::group(['prefix' => '/users'], static function () {
        Route::get('/', [UserController::class, 'index'])->name('users.list');
        Route::post('/', [UserController::class, 'store']);
    });
});

Route::get('/ping', [PingController::class, 'index']);
