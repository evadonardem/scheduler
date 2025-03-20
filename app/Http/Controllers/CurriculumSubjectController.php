<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCurriculumSubjectRequest;
use App\Http\Requests\UpdateCurriculumSubjectRequest;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Services\CurriculumService;

class CurriculumSubjectController extends Controller
{
    public function __construct(
        protected CurriculumService $curriculumService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Curriculum $curriculum)
    {

        return $this->curriculumService->getSubjectsByYearLevel($curriculum);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCurriculumSubjectRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(CurriculumSubject $curriculaSubject)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CurriculumSubject $curriculaSubject)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCurriculumSubjectRequest $request, CurriculumSubject $curriculaSubject)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CurriculumSubject $curriculaSubject)
    {
        //
    }
}
