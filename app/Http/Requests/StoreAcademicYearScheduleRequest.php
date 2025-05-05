<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAcademicYearScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'academic_year' => [
                'required',
                Rule::unique('academic_year_schedules')->where(function ($query) {
                    return $query->where('academic_year', $this->academic_year)
                        ->where('semester_id', $this->semester_id);
                }),
            ],
            'semester_id' => 'required',
        ];
    }
}
