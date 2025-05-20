<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCurriculumSubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $curricullum = $this->curriculum;

        return $curricullum->is_draft;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'year_level' => 'required|numeric|min:1',
            'semester_id' => 'required|exists:semesters,id',
            'subject_id' => 'required|exists:subjects,id',
            'units_lec' => 'required|numeric|min:1',
            'units_lab' => 'sometimes|required|numeric|min:0',
            'credit_hours' => 'required|numeric|min:1',
        ];
    }
}
