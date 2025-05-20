<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCurriculumRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $authUser = Auth::user();
        $authUserRoles = $authUser->roles->pluck('name');

        return $authUserRoles->contains(function ($role) {
            return in_array($role, ['Super Admin', 'Dean', 'Associate Dean']);
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
            'is_active' => 'sometimes|required|boolean',
        ];
    }
}
