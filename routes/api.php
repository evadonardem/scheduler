<?php

use App\Models\SubjectClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::patch('subject-classes/{subjectClass}/schedule', function (SubjectClass $subjectClass) {
        $subjectClass->schedule = request()->input('schedule');
        $subjectClass->save();

        response()->noContent();
    });
});
