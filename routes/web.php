<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\PingController;
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

    Route::get('/profile/{user}', [UserController::class, 'edit'])->name('profile.edit');

    Route::group(['prefix' => '/departments'], static function () {
        Route::get('/', [DepartmentController::class, 'index']);
        Route::post('/', [DepartmentController::class, 'store']);
    });

    Route::group(['prefix' => '/subjects'], static function () {
        Route::get('/', [SubjectController::class, 'index']);
        Route::post('/', [SubjectController::class, 'store']);
    });

    Route::group(['prefix' => '/courses'], static function () {
        Route::get('/', [CourseController::class, 'index'])->name('courses.list');
        Route::post('/', [CourseController::class, 'store']);
    });

    Route::group(['prefix' => '/users'], static function () {
        Route::get('/', [UserController::class, 'index'])->name('users.list');
        Route::post('/', [UserController::class, 'store']);
    });

    Route::group(['prefix' => '/import-templates'], static function () {
        Route::get('/departments', [DepartmentController::class, 'downloadTemplate']);
        Route::get('/courses', [CourseController::class, 'downloadTemplate']);
        Route::get('/subjects', [SubjectController::class, 'downloadTemplate']);
        Route::get('/users', [UserController::class, 'downloadTemplate']);
    });
});

Route::get('/ping', [PingController::class, 'index']);
