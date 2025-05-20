<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreCurriculumRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $authUser = Auth::user();
        $authUserRoles = $authUser->roles->pluck('name');

        return $authUser->isSuperAdmin || $authUserRoles->contains(function ($role) {
            return in_array($role, ['Dean', 'Associate Dean']);
        });
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'department' => 'required|exists:departments,id',
            'course' => 'required|exists:courses,id',
            'code' => 'required|unique:curricula,code',
            'description' => 'required',
        ];
    }
}
